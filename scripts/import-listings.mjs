#!/usr/bin/env node
// Uploads local listing media and submits listings to the agent import REST API.
// Contract: specs/001-bulk-listing-import/contracts/helper.md
import { createHash } from 'node:crypto';
import { createReadStream } from 'node:fs';
import { readFile, rename, stat, writeFile } from 'node:fs/promises';
import { basename, dirname, extname, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { parseArgs } from 'node:util';

const MIME = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.gif': 'image/gif', '.mp4': 'video/mp4', '.webm': 'video/webm', '.mov': 'video/quicktime' };
const MAX_FILE_BYTES = 50 * 1024 * 1024, MAX_ROWS = 50, MAX_BODY_BYTES = 1048576, ATTEMPTS = 5;
const RETRY_BASE_MS = Number(process.env.IMPORT_RETRY_BASE_MS ?? 500);

const USAGE = 'usage: SITE_URL=https://… IMPORT_API_TOKEN=rli_… node scripts/import-listings.mjs <listings.json> [--validate-only] [--state <path>]';

class Fatal extends Error {}
class Usage extends Error {}
class Refused extends Error {}

function canonical(value) {
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object') return '{' + Object.keys(value).sort().map(k => JSON.stringify(k) + ':' + canonical(value[k])).join(',') + '}';
  return JSON.stringify(value);
}

const sha256 = text => createHash('sha256').update(text).digest('hex');

async function fileHash(file) {
  const digest = createHash('sha256');
  for await (const chunk of createReadStream(file)) digest.update(chunk);
  return digest.digest('hex');
}

async function failure(response) {
  const body = await response.json().catch(() => ({}));
  return `${response.status} ${body.error ?? response.statusText}${Array.isArray(body.details) ? ': ' + body.details.join('; ') : ''}`;
}

async function retryable(response) {
  if ([429, 502, 503, 504].includes(response.status)) return true;
  return response.status === 409 && /busy/i.test((await response.clone().json().catch(() => ({}))).error ?? '');
}

// Retries network failures and transient statuses with exponential backoff. Safe because media
// uploads are deduplicated by content and imports replay by idempotency key.
async function send(label, request) {
  for (let attempt = 1; ; attempt++) {
    let response, error;
    try { response = await request(); } catch (caught) { error = caught; }
    if (response && !(await retryable(response))) return response;
    const reason = response ? `HTTP ${response.status}` : `network error (${error.cause?.code ?? error.message})`;
    if (attempt === ATTEMPTS) { if (response) return response; throw new Fatal(`${label}: ${reason} after ${ATTEMPTS} attempts`); }
    const delay = RETRY_BASE_MS * 2 ** (attempt - 1);
    console.error(`${label}: ${reason}; retrying in ${delay} ms`);
    await sleep(delay);
  }
}

async function fileProblem(file, name) {
  if (!MIME[extname(file).toLowerCase()]) return `${name}: unsupported file type ${extname(file) || '(none)'}; use ${Object.keys(MIME).join(' ')}`;
  const info = await stat(file).catch(error => error);
  if (info instanceof Error) return info.code === 'ENOENT' ? `${name}: file not found` : `${name}: cannot read file (${info.code})`;
  if (!info.isFile()) return `${name}: not a regular file`;
  if (info.size === 0) return `${name}: file is empty`;
  if (info.size > MAX_FILE_BYTES) return `${name}: larger than the 50 MiB upload limit (${(info.size / 1048576).toFixed(1)} MiB)`;
}

async function main() {
  let values, positionals;
  try { ({ values, positionals } = parseArgs({ allowPositionals: true, options: { state: { type: 'string' }, 'validate-only': { type: 'boolean' } } })); }
  catch (error) { throw new Usage(`${error.message}\n${USAGE}`); }
  if (positionals.length !== 1) throw new Usage(USAGE);
  const validateOnly = values['validate-only'] === true;
  const token = process.env.IMPORT_API_TOKEN;
  if (!token) throw new Usage('Set IMPORT_API_TOKEN to an admin-issued credential');
  let site;
  try { site = new URL(process.env.SITE_URL).origin; } catch { throw new Usage('Set SITE_URL to the site origin, for example https://example.com'); }
  const loopback = ['localhost', '127.0.0.1', '[::1]'].includes(new URL(site).hostname);
  if (!site.startsWith('https://') && !(site.startsWith('http://') && loopback)) throw new Usage('SITE_URL must use https (plain http only for localhost) so the credential is never sent in cleartext');

  const inputPath = resolve(positionals[0]), base = dirname(inputPath);
  let input;
  try { input = JSON.parse(await readFile(inputPath, 'utf8')); } catch (error) { throw new Usage(`Cannot read ${inputPath}: ${error.code ?? error.message}`); }
  if (!input || typeof input !== 'object' || typeof input.namespace !== 'string' || !Array.isArray(input.listings) || !input.listings.length) throw new Usage(`${inputPath} must contain {"namespace": "…", "listings": [ … ]}`);

  // Validation neither reads nor writes state; an import resumes from it.
  const statePath = resolve(values.state ?? `${inputPath}.import-state.json`);
  let state = { version: 1, site, media: {}, imports: {} };
  const saved = validateOnly ? null : await readFile(statePath, 'utf8').catch(error => { if (error.code === 'ENOENT') return null; throw new Usage(`Cannot read state file ${statePath}: ${error.code}`); });
  if (saved !== null) {
    try { state = JSON.parse(saved); } catch { state = null; }
    if (typeof state?.media !== 'object' || typeof state?.imports !== 'object') throw new Usage(`${statePath} is not an import state file; delete it to start over`);
    if (state.site !== site) throw new Usage(`State file ${statePath} records work on ${state.site}, not ${site}; pass --state <path> to keep a separate state file per site`);
  }
  // Written to a temporary file then renamed, so an interrupted run never leaves a torn state file.
  const save = async () => { const temporary = `${statePath}.${process.pid}.tmp`; await writeFile(temporary, JSON.stringify(state, null, 2) + '\n'); await rename(temporary, statePath); };
  const api = (path, init = {}) => fetch(new URL(path, site), { ...init, headers: { authorization: `Bearer ${token}`, ...init.headers } });
  const envelope = Buffer.byteLength(JSON.stringify({ namespace: input.namespace, listings: [] }));
  // Same length as a server media ID, so a row can be sized before anything is uploaded.
  const placeholder = file => 'local-' + sha256(file).slice(0, 30);

  // Replaces media `file` paths and `coverFile` with media IDs; everything else goes to the server as given.
  function rewrite(row, idFor) {
    if (!row || typeof row !== 'object' || Array.isArray(row)) return row;
    const { coverFile, ...listing } = row;
    if (Array.isArray(row.media)) listing.media = row.media.map(item => {
      if (item?.file === undefined) return item;
      const { file, ...rest } = item;
      return { id: idFor(resolve(base, file)), ...rest };
    });
    if (coverFile !== undefined) listing.coverId = idFor(resolve(base, coverFile));
    return listing;
  }

  // Local checks only for what the helper adds (files, request size); listing rules stay on the server.
  async function inspect(row) {
    const errors = [], files = new Map();
    if (!row || typeof row !== 'object' || Array.isArray(row)) return { errors, files };
    for (const item of Array.isArray(row.media) ? row.media : []) {
      if (item?.file === undefined) continue;
      if (typeof item.file !== 'string') { errors.push('media file must be a path'); continue; }
      if (item.id !== undefined) errors.push(`${item.file}: give either file or id, not both`);
      const file = resolve(base, item.file);
      if (files.has(file)) continue;
      files.set(file, item.file);
      const problem = await fileProblem(file, item.file);
      if (problem) errors.push(problem);
    }
    if (row.coverFile !== undefined) {
      if (row.coverId !== undefined) errors.push('give either coverFile or coverId, not both');
      if (typeof row.coverFile !== 'string' || !files.has(resolve(base, row.coverFile))) errors.push(`coverFile ${row.coverFile} must also appear in media`);
    }
    if (!errors.length && envelope + Buffer.byteLength(JSON.stringify(rewrite(row, placeholder))) > MAX_BODY_BYTES) errors.push('listing is larger than the 1 MiB request limit');
    return { errors, files };
  }

  async function upload(file, name) {
    const contentHash = await fileHash(file);
    if (state.media[contentHash]) return state.media[contentHash];
    const size = (await stat(file)).size, mime = MIME[extname(file).toLowerCase()];
    const response = await send(`Upload ${name}`, () => api('/api/v1/media', { method: 'POST', body: createReadStream(file), duplex: 'half', headers: { 'content-type': mime, 'content-length': String(size), 'x-file-name': encodeURIComponent(basename(file)) } }));
    // The server judges the bytes themselves (e.g. a HEIC renamed .jpg); that is this file's problem, not the run's.
    if ([400, 413, 415].includes(response.status)) throw new Refused(`${name}: ${(await response.json().catch(() => ({}))).error ?? `HTTP ${response.status}`}`);
    if (response.status !== 201) throw new Fatal(`Upload ${name}: ${await failure(response)}`);
    const media = await response.json();
    console.log(`uploaded ${name} as ${media.id}`);
    state.media[contentHash] = media.id; await save();
    return media.id;
  }

  const reference = index => { const value = input.listings[index]?.reference; return typeof value === 'string' ? value.trim() : ''; };
  const results = [], inspected = [], claimed = new Set();
  for (const [index, row] of input.listings.entries()) {
    const { errors, files } = await inspect(row);
    // The server rejects a repeated unit only within one request; batching must not hide a repeat.
    if (reference(index) && claimed.has(reference(index))) errors.push('Duplicate reference in this file');
    claimed.add(reference(index));
    if (errors.length) results.push({ index, outcome: 'invalid', errors });
    else inspected.push({ index, row, files });
  }
  const rows = [];
  for (const { index, row, files } of inspected) {
    if (validateOnly) { rows.push({ index, listing: rewrite(row, placeholder) }); continue; }
    const ids = new Map();
    try { for (const [file, name] of files) ids.set(file, await upload(file, name)); }
    catch (error) { if (!(error instanceof Refused)) throw error; results.push({ index, outcome: 'invalid', errors: [error.message] }); continue; }
    rows.push({ index, listing: rewrite(row, file => ids.get(file)) });
  }

  // Greedy split into requests of at most 50 rows and 1 MiB of UTF-8 JSON.
  const batches = [];
  let bytes = 0;
  for (const row of rows) {
    const size = Buffer.byteLength(JSON.stringify(row.listing)) + 1;
    if (!batches.length || batches.at(-1).length === MAX_ROWS || envelope + bytes + size > MAX_BODY_BYTES) { batches.push([]); bytes = 0; }
    batches.at(-1).push(row); bytes += size;
  }

  for (const batch of batches) {
    const body = { namespace: input.namespace, listings: batch.map(row => row.listing) };
    let job;
    if (validateOnly) {
      const response = await send('Validate', () => api('/api/v1/imports/validate', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json' } }));
      if (response.status !== 200) throw new Fatal(`Validate: ${await failure(response)}`);
      job = await response.json();
    } else {
      // Derived from the content, so a retry or a re-run without the state file replays this batch.
      const key = 'import-listings:' + sha256(canonical(body));
      if (!state.imports[key]) {
        const response = await send('Import', () => api('/api/v1/imports', { method: 'POST', body: JSON.stringify(body), headers: { 'content-type': 'application/json', 'idempotency-key': key } }));
        if (response.status !== 201) throw new Fatal(`Import: ${await failure(response)}`);
        state.imports[key] = await response.json(); await save();
      }
      job = state.imports[key];
    }
    for (const result of job.results) results.push({ ...result, index: batch[result.index].index });
  }
  for (const result of results.sort((a, b) => a.index - b.index)) {
    const label = `listings[${result.index}] ${reference(result.index)}`;
    if (result.outcome === 'invalid') console.log(`${label}: invalid — ${result.errors.join('; ')}`);
    else if (result.outcome === 'valid') console.log(`${label}: valid${result.blockers.length ? ` (missing for publication: ${result.blockers.join(', ')})` : ''}`);
    else console.log(`${label}: ${result.outcome} ${new URL(result.reviewUrl, site)}`);
  }
  const count = outcome => results.filter(result => result.outcome === outcome).length;
  const outcomes = validateOnly ? ['valid', 'invalid'] : ['created', 'updated', 'unchanged', 'invalid'];
  console.log(`Summary: ${results.length} listing${results.length === 1 ? '' : 's'} — ${outcomes.map(outcome => `${count(outcome)} ${outcome}`).join(', ')}`);
}

main().catch(error => {
  console.error(`import-listings: ${error instanceof Fatal || error instanceof Usage ? error.message : error?.stack ?? error}`);
  process.exitCode = error instanceof Usage ? 2 : 1;
});
