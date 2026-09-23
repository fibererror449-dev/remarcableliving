export type ImportEnv = { DB: D1Database; MEDIA: R2Bucket; ADMIN_EMAILS?: string; IMPORTS_ENABLED?: string; SITE_ORIGIN?: string };
export type Actor = { id: string; owner: string; scopes: string[]; admin?: boolean };
export const scopes = ['listings:read', 'listings:write', 'media:write'];
export class ApiError extends Error {
  constructor(public status: number, message: string, public details?: unknown) { super(message); }
}
export function json(value: unknown, status = 200, headers: HeadersInit = {}) {
  return Response.json(value, { status, headers: { 'cache-control': 'no-store', ...headers } });
}
export function allowed(env: ImportEnv, email: string) {
  return String(env.ADMIN_EMAILS ?? '').split(',').map(s=>s.trim().toLowerCase()).includes(email.toLowerCase());
}
export function adminActor(request: Request, env: ImportEnv): Actor {
  const email = request.headers.get('oai-authenticated-user-email')?.toLowerCase();
  if (!email || !request.headers.get('oai-authenticated-user-id') || !allowed(env,email)) throw new ApiError(401,'Admin sign-in required');
  if (!['GET','HEAD'].includes(request.method) && request.headers.get('origin') !== new URL(request.url).origin) throw new ApiError(403,'Invalid request origin');
  return { id:`admin:${email}`, owner:email, scopes, admin:true };
}
export async function hash(value: string | ArrayBuffer) {
  const digest = await crypto.subtle.digest('SHA-256',typeof value === 'string' ? new TextEncoder().encode(value) : value);
  return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
}
export function secret() { return [...crypto.getRandomValues(new Uint8Array(32))].map(x=>x.toString(16).padStart(2,'0')).join(''); }
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return '['+value.map(canonical).join(',')+']';
  if (value && typeof value === 'object') return '{'+Object.keys(value).sort().map(k=>JSON.stringify(k)+':'+canonical((value as Record<string,unknown>)[k])).join(',')+'}';
  return JSON.stringify(value);
}
export async function bodyText(request: Request, max: number): Promise<string> {
  if (!request.body) throw new ApiError(400,'Request body required');
  const reader = request.body.getReader(); const chunks: Uint8Array[]=[]; let size=0;
  while(true) { const {value,done}=await reader.read(); if(done) break; size+=value.length; if(size>max){await reader.cancel(); throw new ApiError(413,`Request exceeds ${max/1048576} MiB`);} chunks.push(value); }
  const bytes=new Uint8Array(size); let offset=0; for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
  return new TextDecoder().decode(bytes);
}
export async function bodyJson(request: Request, max = 1048576): Promise<Record<string, unknown>> {
  if (!request.headers.get('content-type')?.startsWith('application/json')) throw new ApiError(415,'Use application/json');
  const text=await bodyText(request,max);
  try { const value=JSON.parse(text); if(!value || typeof value!=='object' || Array.isArray(value)) throw new Error(); return value; }
  catch { throw new ApiError(400,'Expected a JSON object'); }
}
export function audit(env: ImportEnv, actor: Actor, action: string, subject: string) {
  return env.DB.prepare('INSERT INTO import_audit (id,actor,action,subject,created_at) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),actor.id,action,subject,Date.now());
}
export function bearer(request: Request) { return /^Bearer (\S+)$/i.exec(request.headers.get('authorization') ?? '')?.[1]; }
/** Admin-issued API credential; null when unknown, expired, revoked or its owner lost admin access. */
export async function credentialActor(env: ImportEnv, token: string): Promise<Actor | null> {
  const row = await env.DB.prepare('SELECT * FROM agent_credentials WHERE token_hash = ? AND revoked_at IS NULL AND expires_at > ?').bind(await hash(token),Date.now()).first<{id:string;owner:string;scopes:string}>();
  return row && allowed(env,row.owner) ? {id:row.id,owner:row.owner,scopes:row.scopes.split(' ')} : null;
}
export async function agentActor(request: Request, env: ImportEnv, scope: string): Promise<Actor> {
  if (env.IMPORTS_ENABLED !== '1') throw new ApiError(503,'Agent imports are disabled');
  const token = bearer(request);
  if (!token) throw new ApiError(401,'Bearer credential required');
  const actor = await credentialActor(env,token);
  if (!actor) throw new ApiError(401,'Invalid or expired credential');
  if (!actor.scopes.includes(scope)) throw new ApiError(403,'Insufficient scope');
  return actor;
}
export async function createCredential(env: ImportEnv, actor: Actor, body: Record<string,unknown>) {
  if(typeof body.name!=='string' || !body.name.trim() || body.name.length>120) throw new ApiError(400,'Name required (1–120 characters)');
  const days=body.expiresInDays ?? 30;
  if(typeof days!=='number' || !Number.isInteger(days) || days<1 || days>90) throw new ApiError(400,'expiresInDays must be 1–90');
  const id=crypto.randomUUID(), token='rli_'+secret(), expiresAt=Date.now()+days*86400000;
  await env.DB.batch([env.DB.prepare('INSERT INTO agent_credentials (id,owner,name,token_hash,scopes,expires_at,created_at) VALUES (?,?,?,?,?,?,?)').bind(id,actor.owner,body.name.trim(),await hash(token),scopes.join(' '),expiresAt,Date.now()),audit(env,actor,'credential.created',id)]);
  return {id,token,name:body.name,expiresAt,scopes};
}
