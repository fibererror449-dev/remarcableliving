import { Miniflare } from 'miniflare';
import { build } from 'esbuild';
import { readFile, readdir } from 'node:fs/promises';

export const origin = 'https://example.test';
export const adminHeaders = { 'oai-authenticated-user-id': 'test-admin', 'oai-authenticated-user-email': 'admin@example.test', origin };

export async function harness(bindings = {}) {
  const bundle = await build({ stdin: { contents: `import {handleAgentRequest} from './lib/agent-api.ts'; export default {async fetch(r,e){ return await handleAgentRequest(r,e) ?? new Response('Not found',{status:404}); }}`, resolveDir: process.cwd() }, bundle: true, format: 'esm', platform: 'browser', external:['node:crypto'], write: false, target: 'es2022' });
  const mf = new Miniflare({ modules: true, script: bundle.outputFiles[0].text, compatibilityFlags:['nodejs_compat'], compatibilityDate: '2026-05-22', d1Databases: ['DB'], r2Buckets: ['MEDIA'], bindings: { ADMIN_EMAILS: 'admin@example.test', IMPORTS_ENABLED: '1', SITE_ORIGIN: origin, ...bindings } });
  const db = await mf.getD1Database('DB');
  for (const file of (await readdir('drizzle')).filter(x=>x.endsWith('.sql')).sort()) {
    const sql = await readFile(`drizzle/${file}`, 'utf8');
    for (const statement of sql.split('--> statement-breakpoint').map(s=>s.trim()).filter(Boolean)) await db.prepare(statement).run();
  }
  async function request(path, { method = 'GET', json, token, headers = {}, body, redirect = 'manual' } = {}) {
    const response = await mf.dispatchFetch(origin + path, { method, redirect, ...(body instanceof ReadableStream ? {duplex:'half'} : {}), headers: { ...(json === undefined ? {} : {'content-type':'application/json'}), ...(token ? {authorization:`Bearer ${token}`} : {}), ...headers }, body: json === undefined ? body : JSON.stringify(json) });
    return response;
  }
  async function issue() {
    const response = await request('/api/admin/imports/credentials', {method:'POST', headers:adminHeaders, json:{name:'test agent',expiresInDays:7}});
    if (response.status !== 201) throw new Error(`Credential creation: ${response.status} ${await response.text()}`);
    return response.json();
  }
  return { request, issue, url:String(await mf.ready).replace(/\/$/,''), close:()=>mf.dispose() };
}
