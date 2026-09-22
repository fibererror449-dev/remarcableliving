import assert from 'node:assert/strict';
import test from 'node:test';
import { spawn } from 'node:child_process';
import http from 'node:http';
import { mkdtemp, mkdir, rm, stat, truncate, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { harness } from './import-harness.mjs';

const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=','base64');

async function workspace(t, input, files = {}) {
  const dir = await mkdtemp(join(tmpdir(), 'import-helper-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  for (const [name, bytes] of Object.entries(files)) { await mkdir(dirname(join(dir, name)), { recursive: true }); await writeFile(join(dir, name), bytes); }
  await writeFile(join(dir, 'listings.json'), JSON.stringify(input));
  return { dir, input: join(dir, 'listings.json') };
}

function helper(args, { site, token }) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ['scripts/import-listings.mjs', ...args], { env: { ...process.env, SITE_URL: site, IMPORT_API_TOKEN: token, IMPORT_RETRY_BASE_MS: '1' } });
    let stdout = '', stderr = '';
    child.stdout.on('data', chunk => { stdout += chunk; });
    child.stderr.on('data', chunk => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', code => {
      if (token) assert.ok(!(stdout + stderr).includes(token), 'the helper must never print the credential');
      resolve({ code, stdout, stderr });
    });
  });
}

// Sits between the helper and the local Worker: records each request and can inject network faults.
async function network(t, target, fault = () => 'forward') {
  const seen = [];
  const server = http.createServer((req, res) => {
    const route = `${req.method} ${req.url}`; seen.push(route);
    const action = fault(route, seen.filter(r => r === route).length);
    // An { status, error } action answers in place of the server, as an overloaded edge would.
    if (action.status) { req.resume(); res.writeHead(action.status, { 'content-type': 'application/json' }).end(JSON.stringify({ error: action.error })); return; }
    const upstream = http.request(new URL(req.url, target), { method: req.method, headers: req.headers }, answer => {
      // 'drop': the server commits the request but the connection dies before the client hears back.
      if (action === 'drop') { answer.resume(); answer.on('end', () => req.socket.destroy()); return; }
      res.writeHead(answer.statusCode, answer.headers); answer.pipe(res);
    });
    req.pipe(upstream);
  });
  await new Promise(done => server.listen(0, '127.0.0.1', done));
  t.after(() => { server.closeAllConnections(); server.close(); });
  return { url: `http://127.0.0.1:${server.address().port}`, seen, posts: () => seen.filter(route => route.startsWith('POST ')) };
}

const rowLines = stdout => stdout.split('\n').filter(line => line.startsWith('listings['));
const reviewIds = (site, stdout) => [...stdout.matchAll(new RegExp(`${site}/admin/imports/([0-9a-f-]{36})`, 'g'))].map(m => m[1]);

test('imports a listing whose cover is a local photo and links the uploaded media to its draft', async t => {
  const h = await harness(); t.after(h.close); const { token } = await h.issue();
  const { input } = await workspace(t, { namespace: 'drive', listings: [{ reference: 'unit-1', name: 'Photo home', media: [{ file: 'photos/living room.png', caption: 'Living room', attribution: 'agent' }], coverFile: 'photos/living room.png' }] }, { 'photos/living room.png': png });
  const run = await helper([input], { site: h.url, token });
  assert.equal(run.code, 0, run.stderr);
  const [draftId] = reviewIds(h.url, run.stdout);
  assert.ok(draftId, run.stdout);
  const draft = await (await h.request(`/api/v1/drafts/${draftId}`, { token })).json();
  const [attachment] = draft.payload.media;
  assert.deepEqual(draft.payload.media, [{ id: attachment.id, caption: 'Living room', attribution: 'agent' }]);
  assert.equal(draft.payload.coverId, attachment.id);
  assert.ok(!draft.blockers.includes('coverId'));
  assert.deepEqual(Buffer.from(await (await h.request(`/api/v1/media/${attachment.id}`, { token })).arrayBuffer()), png);
});

test('reports an invalid row with its errors and still imports the valid row', async t => {
  const h = await harness(); t.after(h.close); const { token } = await h.issue();
  const { input } = await workspace(t, { namespace: 'drive', listings: [{ reference: 'bad', name: 'Bad facts', rent: '10000' }, { reference: 'good', name: 'Known facts', bedrooms: 0 }] });
  const run = await helper([input], { site: h.url, token });
  assert.equal(run.code, 0, run.stderr);
  assert.match(run.stdout, /^listings\[0\] bad: invalid — rent must be an integer between 1 and 100000000$/m);
  assert.match(run.stdout, /^Summary: 2 listings — 1 created, 0 updated, 0 unchanged, 1 invalid$/m);
  const ids = reviewIds(h.url, run.stdout);
  assert.equal(ids.length, 1);
  assert.equal((await (await h.request(`/api/v1/drafts/${ids[0]}`, { token })).json()).payload.reference, 'good');
});

test('re-running a finished import reports the same results without uploading or submitting again', async t => {
  const h = await harness(); t.after(h.close); const { token } = await h.issue(); const net = await network(t, h.url);
  const { input } = await workspace(t, { namespace: 'drive', listings: [{ reference: 'unit-1', name: 'Photo home', media: [{ file: 'living.png', attribution: 'owner' }], coverFile: 'living.png' }] }, { 'living.png': png });
  const first = await helper([input], { site: net.url, token });
  assert.equal(first.code, 0, first.stderr);
  const sent = net.posts().length;
  const again = await helper([input], { site: net.url, token });
  assert.equal(again.code, 0, again.stderr);
  assert.deepEqual(rowLines(again.stdout), rowLines(first.stdout));
  assert.match(rowLines(again.stdout)[0], /: created http/);
  assert.equal(net.posts().length, sent);
});

test('retries a submission whose response was lost and receives the original result instead of a duplicate', async t => {
  const h = await harness(); t.after(h.close); const { token } = await h.issue();
  const net = await network(t, h.url, (route, attempt) => route === 'POST /api/v1/imports' && attempt === 1 ? 'drop' : 'forward');
  const { input } = await workspace(t, { namespace: 'drive', listings: [{ reference: 'unit-1', name: 'Lost response' }] });
  const run = await helper([input], { site: net.url, token });
  assert.equal(run.code, 0, run.stderr);
  assert.deepEqual(net.posts(), ['POST /api/v1/imports', 'POST /api/v1/imports']);
  assert.match(rowLines(run.stdout)[0], /unit-1: created http/);
});

test('resumes an interrupted import without uploading its media again', async t => {
  const h = await harness(); t.after(h.close); const { token } = await h.issue();
  let outage = true;
  const net = await network(t, h.url, route => outage && route === 'POST /api/v1/imports' ? { status: 503, error: 'Import storage temporarily unavailable' } : 'forward');
  const { input } = await workspace(t, { namespace: 'drive', listings: [{ reference: 'unit-1', name: 'Photo home', media: [{ file: 'living.png', attribution: 'agent' }], coverFile: 'living.png' }] }, { 'living.png': png });
  const interrupted = await helper([input], { site: net.url, token });
  assert.notEqual(interrupted.code, 0);
  assert.match(interrupted.stderr, /503 Import storage temporarily unavailable/);
  outage = false;
  const uploads = () => net.posts().filter(route => route === 'POST /api/v1/media').length;
  const uploaded = uploads();
  const resumed = await helper([input], { site: net.url, token });
  assert.equal(resumed.code, 0, resumed.stderr);
  assert.equal(uploads(), uploaded);
  const draft = await (await h.request(`/api/v1/drafts/${reviewIds(net.url, resumed.stdout)[0]}`, { token })).json();
  assert.equal(draft.payload.coverId, draft.payload.media[0].id);
  assert.deepEqual(draft.blockers.filter(b => /attachment|Cover/.test(b)), []);
});

test('waits out a busy or rate-limited server and then completes the import', async t => {
  const h = await harness(); t.after(h.close); const { token } = await h.issue();
  const answers = [{ status: 409, error: 'Concurrent import busy; retry with the same idempotency key' }, { status: 429, error: 'Too many requests' }];
  const net = await network(t, h.url, (route, attempt) => route === 'POST /api/v1/imports' ? answers[attempt - 1] ?? 'forward' : 'forward');
  const { input } = await workspace(t, { namespace: 'drive', listings: [{ reference: 'unit-1', name: 'Patient home' }] });
  const run = await helper([input], { site: net.url, token });
  assert.equal(run.code, 0, run.stderr);
  assert.match(rowLines(run.stdout)[0], /unit-1: created http/);
});

test('imports every row of a file larger than one 50-row request', async t => {
  const h = await harness(); t.after(h.close); const { token } = await h.issue();
  const listings = Array.from({ length: 51 }, (_, i) => ({ reference: `unit-${i}`, name: `Home ${i}` }));
  const { input } = await workspace(t, { namespace: 'drive', listings });
  const run = await helper([input], { site: h.url, token });
  assert.equal(run.code, 0, run.stderr);
  const lines = rowLines(run.stdout);
  assert.equal(lines.length, 51);
  assert.equal(lines.filter(line => / created http/.test(line)).length, 51);
  assert.match(lines[50], /^listings\[50\] unit-50: created http/);
});

test('keeps each request under 1 MiB even when captions are multibyte text', async t => {
  const h = await harness(); t.after(h.close); const { token } = await h.issue();
  const media = Array.from({ length: 60 }, (_, j) => ({ id: `photo-${j}`, caption: 'é'.repeat(500), attribution: 'owner' }));
  const { input } = await workspace(t, { namespace: 'drive', listings: Array.from({ length: 50 }, (_, i) => ({ reference: `unit-${i}`, name: `Home ${i}`, media })) });
  const run = await helper([input], { site: h.url, token });
  assert.equal(run.code, 0, run.stderr);
  assert.equal(rowLines(run.stdout).filter(line => / created http/.test(line)).length, 50);
});

test('reports local files that cannot be uploaded against their rows and still imports the rest', async t => {
  const h = await harness(); t.after(h.close); const { token } = await h.issue(); const net = await network(t, h.url);
  const photo = file => ({ media: [{ file, attribution: 'agent' }] });
  const { dir, input } = await workspace(t, { namespace: 'drive', listings: [
    { reference: 'pdf', name: 'Floor plan only', ...photo('plan.pdf') },
    { reference: 'huge', name: 'Long tour', ...photo('tour.mp4') },
    { reference: 'gone', name: 'Missing photo', ...photo('missing.jpg') },
    { reference: 'cover', name: 'Unlisted cover', ...photo('living.png'), coverFile: 'other.png' },
    { reference: 'essay', name: 'Oversized row', description: 'x'.repeat(1048576) },
    { reference: 'good', name: 'Good home', ...photo('living.png'), coverFile: 'living.png' },
  ] }, { 'plan.pdf': Buffer.from('%PDF-1.7'), 'tour.mp4': Buffer.alloc(0), 'living.png': png, 'other.png': png });
  await truncate(join(dir, 'tour.mp4'), 50 * 1024 * 1024 + 1);
  const run = await helper([input], { site: net.url, token });
  assert.equal(run.code, 0, run.stderr);
  const lines = rowLines(run.stdout);
  assert.match(lines[0], /^listings\[0\] pdf: invalid — plan\.pdf: unsupported file type/);
  assert.match(lines[1], /^listings\[1\] huge: invalid — tour\.mp4: larger than the 50 MiB upload limit/);
  assert.match(lines[2], /^listings\[2\] gone: invalid — missing\.jpg: file not found/);
  assert.match(lines[3], /^listings\[3\] cover: invalid — coverFile other\.png must also appear in media/);
  assert.match(lines[4], /^listings\[4\] essay: invalid — listing is larger than the 1 MiB request limit/);
  assert.match(lines[5], /^listings\[5\] good: created http/);
  assert.deepEqual(net.posts(), ['POST /api/v1/media', 'POST /api/v1/imports']);
});

test('validate-only reports each row and its publication gaps without uploading or saving anything', async t => {
  const h = await harness(); t.after(h.close); const { token } = await h.issue(); const net = await network(t, h.url);
  const facts = { district: 'Ari', rent: 20000, bedrooms: 1, bathrooms: 1, sizeSqm: 35, stationType: 'BTS', stationName: 'Ari', walkMinutes: 5, latitude: 13.78, longitude: 100.54, lastVerified: '2026-01-01' };
  const { input } = await workspace(t, { namespace: 'drive', listings: [
    { reference: 'unit-1', name: 'Nearly ready', ...facts, media: [{ file: 'living.png', attribution: 'agent' }], coverFile: 'living.png' },
    { reference: 'bad', name: 'Bad facts', rent: '10000' },
  ] }, { 'living.png': png });
  const run = await helper([input, '--validate-only'], { site: net.url, token });
  assert.equal(run.code, 0, run.stderr);
  assert.deepEqual(rowLines(run.stdout), ['listings[0] unit-1: valid (missing for publication: status)', 'listings[1] bad: invalid — rent must be an integer between 1 and 100000000']);
  assert.match(run.stdout, /^Summary: 2 listings — 1 valid, 1 invalid$/m);
  assert.deepEqual(net.posts(), ['POST /api/v1/imports/validate']);
  await assert.rejects(stat(`${input}.import-state.json`), { code: 'ENOENT' });
});

test('refuses to start, with a usage error, when the site, credential or input file is unusable', async t => {
  const { dir, input } = await workspace(t, { namespace: 'drive', listings: [{ reference: 'unit-1', name: 'Home' }] });
  const token = 'rli_not-a-real-credential';
  const cases = [
    [[input], { site: 'https://example.test' }, /IMPORT_API_TOKEN/],
    [[input], { token }, /SITE_URL/],
    [[input], { site: 'http://example.test', token }, /https/],
    [[], { site: 'https://example.test', token }, /usage/i],
    [[join(dir, 'missing.json')], { site: 'https://example.test', token }, /missing\.json/],
    [[input, '--state', join(dir, 'staging.json')], { site: 'https://example.test', token }, /staging\.json.*https:\/\/staging\.example\.test/],
    [[join(dir, 'unnamed.json')], { site: 'https://example.test', token }, /namespace/],
  ];
  await writeFile(join(dir, 'unnamed.json'), JSON.stringify({ listings: [{ reference: 'unit-1', name: 'Home' }] }));
  await writeFile(join(dir, 'staging.json'), JSON.stringify({ version: 1, site: 'https://staging.example.test', media: {}, imports: {} }));
  for (const [args, options, message] of cases) {
    const run = await helper(args, options);
    assert.equal(run.code, 2, `${args} ${JSON.stringify(options)}: ${run.stderr}`);
    assert.match(run.stderr, message);
  }
});

test('a re-run that has lost its state file replays the original import instead of creating a revision', async t => {
  const h = await harness(); t.after(h.close); const { token } = await h.issue();
  const { input } = await workspace(t, { namespace: 'drive', listings: [{ reference: 'unit-1', name: 'Photo home', media: [{ file: 'living.png', attribution: 'owner' }], coverFile: 'living.png' }] }, { 'living.png': png });
  const first = await helper([input], { site: h.url, token });
  assert.equal(first.code, 0, first.stderr);
  await rm(`${input}.import-state.json`);
  const again = await helper([input], { site: h.url, token });
  assert.equal(again.code, 0, again.stderr);
  assert.deepEqual(rowLines(again.stdout), rowLines(first.stdout));
  assert.match(rowLines(again.stdout)[0], /: created http/);
});

test('a photo the server refuses marks only its own row invalid', async t => {
  const h = await harness(); t.after(h.close); const { token } = await h.issue();
  const { input } = await workspace(t, { namespace: 'drive', listings: [
    { reference: 'renamed', name: 'Renamed photo', media: [{ file: 'actually-heic.jpg', attribution: 'agent' }] },
    { reference: 'good', name: 'Good home', media: [{ file: 'living.png', attribution: 'agent' }], coverFile: 'living.png' },
  ] }, { 'actually-heic.jpg': Buffer.from('....ftypheic'), 'living.png': png });
  const run = await helper([input], { site: h.url, token });
  assert.equal(run.code, 0, run.stderr);
  assert.deepEqual(rowLines(run.stdout).map(line => line.replace(/http\S+/, 'URL')), ['listings[0] renamed: invalid — actually-heic.jpg: File bytes do not match media type', 'listings[1] good: created URL']);
});

test('a unit repeated later in a long file is reported rather than silently revising the first row', async t => {
  const h = await harness(); t.after(h.close); const { token } = await h.issue();
  const listings = Array.from({ length: 50 }, (_, i) => ({ reference: `unit-${i}`, name: `Home ${i}` }));
  const { input } = await workspace(t, { namespace: 'drive', listings: [...listings, { reference: ' unit-0 ', name: 'Same unit, other facts' }] });
  const run = await helper([input], { site: h.url, token });
  assert.equal(run.code, 0, run.stderr);
  assert.equal(rowLines(run.stdout)[50], 'listings[50] unit-0: invalid — Duplicate reference in this file');
  assert.match(run.stdout, /^Summary: 51 listings — 50 created, 0 updated, 0 unchanged, 1 invalid$/m);
});
