import { allowed, ApiError, audit, hash, json, scopes, secret, type Actor, type ImportEnv } from './core';

// Opaque, hashed, D1-backed OAuth for chat clients. Clients are registered by an admin with exact
// callbacks; the admin approves each connection while signed in; codes and consents are one-use;
// refresh tokens rotate and reuse revokes the whole grant.
const CONSENT_TTL=10*60000, CODE_TTL=5*60000, ACCESS_TTL=3600000, REFRESH_TTL=30*86400000;
export const cors={'access-control-allow-origin':'*','access-control-allow-headers':'authorization, content-type, mcp-protocol-version, mcp-session-id','access-control-expose-headers':'www-authenticate, mcp-protocol-version'};
type Client={id:string;name:string;redirect_uris:string;secret_hash:string};

export function siteOrigin(request:Request,env:ImportEnv) { return (env.SITE_ORIGIN||new URL(request.url).origin).replace(/\/$/,''); }
export const mcpResource=(origin:string)=>`${origin}/mcp`;
export function resourceMetadata(origin:string) {
  return {resource:mcpResource(origin),authorization_servers:[origin],scopes_supported:scopes,bearer_methods_supported:['header'],resource_name:'REMARCABLE LIVING listing imports'};
}
export function serverMetadata(origin:string) {
  return {issuer:origin,authorization_endpoint:`${origin}/oauth/authorize`,token_endpoint:`${origin}/oauth/token`,response_types_supported:['code'],grant_types_supported:['authorization_code','refresh_token'],
    code_challenge_methods_supported:['S256'],token_endpoint_auth_methods_supported:['none','client_secret_post','client_secret_basic'],scopes_supported:scopes,authorization_response_iss_parameter_supported:true};
}

function validRedirect(value:unknown) {
  if(typeof value!=='string'||value.length>500) return false;
  try {
    const url=new URL(value);
    const local=url.protocol==='http:'&&['localhost','127.0.0.1','[::1]'].includes(url.hostname);
    return (url.protocol==='https:'||local)&&!url.hash&&!url.username&&!url.password;
  } catch { return false; }
}
export async function createClient(env:ImportEnv,actor:Actor,body:Record<string,unknown>) {
  if(typeof body.name!=='string'||!body.name.trim()||body.name.length>120) throw new ApiError(400,'Name required (1–120 characters)');
  const redirects=body.redirectUris;
  if(!Array.isArray(redirects)||redirects.length<1||redirects.length>5||!redirects.every(validRedirect)) throw new ApiError(400,'Give 1–5 exact callback URLs (https, or http on localhost)');
  const id=crypto.randomUUID(),clientSecret='rls_'+secret();
  await env.DB.batch([env.DB.prepare('INSERT INTO oauth_clients (id,name,redirect_uris,secret_hash,created_at) VALUES (?,?,?,?,?)').bind(id,body.name.trim(),JSON.stringify(redirects),await hash(clientSecret),Date.now()),audit(env,actor,'oauth.client.created',id)]);
  return {id,name:body.name.trim(),redirectUris:redirects,clientSecret};
}
export async function listClients(env:ImportEnv) {
  const rows=(await env.DB.prepare('SELECT id,name,redirect_uris,created_at,revoked_at FROM oauth_clients ORDER BY created_at DESC LIMIT 100').all<{id:string;name:string;redirect_uris:string;created_at:number;revoked_at:number|null}>()).results;
  return rows.map(({redirect_uris,...row})=>({...row,redirectUris:JSON.parse(redirect_uris) as string[]}));
}
export async function revokeClient(env:ImportEnv,actor:Actor,id:string) {
  const now=Date.now();
  await env.DB.batch([env.DB.prepare('UPDATE oauth_clients SET revoked_at=? WHERE id=? AND revoked_at IS NULL').bind(now,id),env.DB.prepare('UPDATE oauth_grants SET revoked_at=? WHERE client_id=? AND revoked_at IS NULL').bind(now,id),audit(env,actor,'oauth.client.revoked',id)]);
  return {ok:true};
}
async function activeClient(env:ImportEnv,id:string|null) {
  return id ? env.DB.prepare('SELECT * FROM oauth_clients WHERE id=? AND revoked_at IS NULL').bind(id).first<Client>() : null;
}

const escape=(value:string)=>value.replace(/[&<>"']/g,c=>`&#${c.charCodeAt(0)};`);
function page(status:number,title:string,body:string) {
  const html=`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(title)} · REMARCABLE LIVING</title>
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f3f0e8;color:#11110f;font:16px/1.6 system-ui,sans-serif;padding:16px}main{max-width:520px;width:100%;background:#fff;border:1px solid rgba(17,17,15,.16);border-top:3px solid #cda96a;padding:32px}h1{font-size:28px;line-height:1.2;margin:0 0 16px;font-weight:500}p,li{color:#3c3a35}.brand{font-size:13px;letter-spacing:.14em;font-weight:600;margin:0 0 24px;color:#11110f}form{display:flex;gap:12px;flex-wrap:wrap;margin-top:24px}button{min-height:48px;padding:12px 22px;font:600 15px system-ui,sans-serif;border:1px solid #11110f;cursor:pointer}.allow{background:#11110f;color:#fff}.deny{background:#fff;color:#11110f}small{color:#6b665c}</style></head>
<body><main><p class="brand">REMARCABLE LIVING</p><h1>${escape(title)}</h1>${body}</main></body></html>`;
  return new Response(html,{status,headers:{'content-type':'text/html; charset=utf-8','cache-control':'no-store','x-frame-options':'DENY','content-security-policy':"frame-ancestors 'none'",'referrer-policy':'no-referrer'}});
}
function back(redirectUri:string,params:Record<string,string>) {
  const url=new URL(redirectUri);
  for(const [key,value] of Object.entries(params)) url.searchParams.set(key,value);
  return new Response(null,{status:302,headers:{location:url.href,'cache-control':'no-store'}});
}
function signedInAdmin(request:Request,env:ImportEnv) {
  const email=request.headers.get('oai-authenticated-user-email')?.toLowerCase();
  if(!email||!request.headers.get('oai-authenticated-user-id')) return {email:null,admin:false};
  return {email,admin:allowed(env,email)};
}

export async function authorize(request:Request,env:ImportEnv) {
  const url=new URL(request.url),params=url.searchParams,origin=siteOrigin(request,env);
  const client=await activeClient(env,params.get('client_id'));
  const redirectUri=params.get('redirect_uri')??'';
  // Never redirect to a callback the admin has not registered for this client.
  if(!client||!(JSON.parse(client.redirect_uris) as string[]).includes(redirectUri)) return page(400,'This connection is not registered','<p>Ask the site admin to register this chat client and its exact callback URL under Listing imports.</p>');
  const state=params.get('state')??'';
  const fail=(error:string,description:string)=>back(redirectUri,{error,error_description:description,iss:origin,...(state?{state}:{})});
  if(state.length>1000) return fail('invalid_request','state is too long');
  if(params.get('response_type')!=='code') return fail('unsupported_response_type','Only the authorization code flow is supported');
  const challenge=params.get('code_challenge')??'';
  if(params.get('code_challenge_method')!=='S256'||!/^[A-Za-z0-9_-]{43}$/.test(challenge)) return fail('invalid_request','PKCE with S256 is required');
  const resource=params.get('resource')??mcpResource(origin);
  if(resource!==mcpResource(origin)) return fail('invalid_target',`Use the resource ${mcpResource(origin)}`);
  const requested=(params.get('scope')??'').split(' ').filter(Boolean);
  if(requested.some(scope=>!scopes.includes(scope))) return fail('invalid_scope',`Supported scopes: ${scopes.join(' ')}`);
  const granted=requested.length?[...new Set(requested)]:scopes;
  const {email,admin}=signedInAdmin(request,env);
  if(!email) return new Response(null,{status:302,headers:{location:`/signin-with-chatgpt?return_to=${encodeURIComponent(url.pathname+url.search)}`,'cache-control':'no-store'}});
  if(!admin) return page(403,'Admin access required','<p>Only a REMARCABLE LIVING admin can connect a chat client to listing imports. <a href="/signout-with-chatgpt?return_to=/admin/imports">Switch account</a></p>');
  const consent=secret();
  await env.DB.prepare('INSERT INTO oauth_consents (id,token_hash,client_id,owner,redirect_uri,code_challenge,resource,scopes,state,expires_at) VALUES (?,?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),await hash(consent),client.id,email,redirectUri,challenge,resource,granted.join(' '),state||null,Date.now()+CONSENT_TTL).run();
  const abilities=[granted.includes('listings:read')&&'Read the listing format and check its own imports and drafts',granted.includes('listings:write')&&'Save listings as private drafts for your review',granted.includes('media:write')&&'Upload photos and videos for those drafts'].filter(Boolean) as string[];
  return page(200,`Connect ${client.name}?`,`<p><b>${escape(client.name)}</b> is asking to work with listing imports as <b>${escape(email)}</b>. It will be able to:</p><ul>${abilities.map(a=>`<li>${escape(a)}</li>`).join('')}</ul><p>It cannot publish listings or manage access. You can revoke it at any time under Listing imports.</p>
<form method="post" action="/oauth/authorize"><input type="hidden" name="consent" value="${consent}"><button class="allow" name="decision" value="allow">Allow access</button><button class="deny" name="decision" value="deny">Deny</button></form><p><small>This request expires in 10 minutes.</small></p>`);
}

export async function approve(request:Request,env:ImportEnv) {
  const {email,admin}=signedInAdmin(request,env);
  if(!email||!admin) return page(401,'Admin sign-in required','<p>Sign in with the admin account and start the connection again from your chat client.</p>');
  if(request.headers.get('origin')!==new URL(request.url).origin) return page(403,'Request blocked','<p>This approval did not come from this site.</p>');
  if(Number(request.headers.get('content-length')??0)>4096) return page(413,'Request too large','<p>Start the connection again from your chat client.</p>');
  const form=await request.formData().catch(()=>null);
  const token=form?.get('consent');
  const consent=typeof token==='string' ? await env.DB.prepare('UPDATE oauth_consents SET consumed_at=?1 WHERE token_hash=?2 AND consumed_at IS NULL AND expires_at>?1 AND owner=?3 RETURNING *').bind(Date.now(),await hash(token),email).first<{client_id:string;owner:string;redirect_uri:string;code_challenge:string;resource:string;scopes:string;state:string|null}>() : null;
  if(!consent) return page(400,'This approval has expired','<p>Start the connection again from your chat client.</p>');
  const origin=siteOrigin(request,env),state:Record<string,string>=consent.state?{state:consent.state}:{};
  if(form?.get('decision')!=='allow') return back(consent.redirect_uri,{error:'access_denied',iss:origin,...state});
  const code=secret();
  await env.DB.batch([
    env.DB.prepare('INSERT INTO oauth_codes (id,code_hash,client_id,owner,redirect_uri,code_challenge,resource,scopes,expires_at) VALUES (?,?,?,?,?,?,?,?,?)').bind(crypto.randomUUID(),await hash(code),consent.client_id,consent.owner,consent.redirect_uri,consent.code_challenge,consent.resource,consent.scopes,Date.now()+CODE_TTL),
    audit(env,{id:`admin:${email}`,owner:email,scopes},'oauth.approved',consent.client_id),
  ]);
  return back(consent.redirect_uri,{code,iss:origin,...state});
}

class OAuthError extends Error { constructor(public code:string,public status=400) { super(code); } }
const tokenError=(error:OAuthError)=>json({error:error.code},error.status,{...cors,pragma:'no-cache',...(error.status===401?{'www-authenticate':'Basic realm="oauth"'}:{})});
async function tokenPair(env:ImportEnv,grantId:string,grantScopes:string) {
  const access='rla_'+secret(),refresh='rlr_'+secret(),now=Date.now();
  const insert='INSERT INTO oauth_tokens (id,token_hash,grant_id,kind,expires_at,created_at) VALUES (?,?,?,?,?,?)';
  return {
    statements:[env.DB.prepare(insert).bind(crypto.randomUUID(),await hash(access),grantId,'access',now+ACCESS_TTL,now),env.DB.prepare(insert).bind(crypto.randomUUID(),await hash(refresh),grantId,'refresh',now+REFRESH_TTL,now)],
    body:{access_token:access,token_type:'Bearer',expires_in:ACCESS_TTL/1000,refresh_token:refresh,scope:grantScopes},
  };
}
const revokeGrant=(env:ImportEnv,grantId:string)=>env.DB.prepare('UPDATE oauth_grants SET revoked_at=? WHERE id=? AND revoked_at IS NULL').bind(Date.now(),grantId).run();
async function verifier(value:unknown) {
  if(typeof value!=='string'||!/^[A-Za-z0-9._~-]{43,128}$/.test(value)) return null;
  const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)));
  return btoa(String.fromCharCode(...digest)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}

export async function token(request:Request,env:ImportEnv) {
  try {
    if(!request.headers.get('content-type')?.startsWith('application/x-www-form-urlencoded')||Number(request.headers.get('content-length')??0)>8192) throw new OAuthError('invalid_request');
    const form=new URLSearchParams(await request.text());
    let clientId=form.get('client_id'),clientSecret=form.get('client_secret');
    const basic=/^Basic (\S+)$/i.exec(request.headers.get('authorization')??'')?.[1];
    if(basic) {
      let id:string,password:string;
      try { [id,password]=atob(basic).split(':').map(decodeURIComponent); } catch { throw new OAuthError('invalid_client',401); }
      if(clientId&&clientId!==id) throw new OAuthError('invalid_request');
      clientId=id;clientSecret=password;
    }
    const client=await activeClient(env,clientId);
    // Public clients rely on PKCE; a client that presents a secret must present the right one.
    if(!client||(clientSecret!==null&&await hash(clientSecret)!==client.secret_hash)) throw new OAuthError('invalid_client',401);
    const now=Date.now();
    if(form.get('grant_type')==='authorization_code') {
      const codeHash=await hash(form.get('code')??'');
      const code=await env.DB.prepare('UPDATE oauth_codes SET consumed_at=? WHERE code_hash=? AND consumed_at IS NULL RETURNING *').bind(now,codeHash).first<{id:string;client_id:string;owner:string;redirect_uri:string;code_challenge:string;resource:string;scopes:string;expires_at:number}>();
      if(!code) {
        const used=await env.DB.prepare('SELECT grant_id FROM oauth_codes WHERE code_hash=?').bind(codeHash).first<{grant_id:string|null}>();
        if(used?.grant_id) await revokeGrant(env,used.grant_id);
        throw new OAuthError('invalid_grant');
      }
      const resource=form.get('resource');
      if(code.client_id!==client.id||code.redirect_uri!==form.get('redirect_uri')||code.expires_at<=now||(resource&&resource!==code.resource)||await verifier(form.get('code_verifier'))!==code.code_challenge||!allowed(env,code.owner)) throw new OAuthError('invalid_grant');
      const grantId=crypto.randomUUID(),pair=await tokenPair(env,grantId,code.scopes);
      await env.DB.batch([
        env.DB.prepare('INSERT INTO oauth_grants (id,client_id,owner,resource,scopes,created_at) VALUES (?,?,?,?,?,?)').bind(grantId,client.id,code.owner,code.resource,code.scopes,now),
        env.DB.prepare('UPDATE oauth_codes SET grant_id=? WHERE id=?').bind(grantId,code.id),
        ...pair.statements,
        audit(env,{id:`oauth:${grantId}`,owner:code.owner,scopes},'oauth.granted',client.id),
      ]);
      return json(pair.body,200,{...cors,pragma:'no-cache'});
    }
    if(form.get('grant_type')==='refresh_token') {
      const row=await env.DB.prepare("SELECT t.id,t.expires_at,t.consumed_at,g.id AS grant_id,g.client_id,g.owner,g.scopes,g.revoked_at FROM oauth_tokens t JOIN oauth_grants g ON g.id=t.grant_id WHERE t.token_hash=? AND t.kind='refresh'").bind(await hash(form.get('refresh_token')??'')).first<{id:string;expires_at:number;consumed_at:number|null;grant_id:string;client_id:string;owner:string;scopes:string;revoked_at:number|null}>();
      if(!row||row.client_id!==client.id||row.revoked_at||row.expires_at<=now||!allowed(env,row.owner)) throw new OAuthError('invalid_grant');
      const consumed=row.consumed_at===null&&(await env.DB.prepare('UPDATE oauth_tokens SET consumed_at=? WHERE id=? AND consumed_at IS NULL').bind(now,row.id).run()).meta.changes===1;
      // A replayed refresh token means it leaked or raced: end the whole connection.
      if(!consumed) { await revokeGrant(env,row.grant_id); throw new OAuthError('invalid_grant'); }
      const pair=await tokenPair(env,row.grant_id,row.scopes);
      await env.DB.batch(pair.statements);
      return json(pair.body,200,{...cors,pragma:'no-cache'});
    }
    throw new OAuthError('unsupported_grant_type');
  } catch(error) {
    if(error instanceof OAuthError) return tokenError(error);
    throw error;
  }
}

/** Access token bound to this MCP resource, from a live grant, client and admin. */
export async function oauthActor(env:ImportEnv,accessToken:string,resource:string):Promise<Actor|null> {
  const row=await env.DB.prepare("SELECT g.id,g.owner,g.scopes,g.resource FROM oauth_tokens t JOIN oauth_grants g ON g.id=t.grant_id JOIN oauth_clients c ON c.id=g.client_id WHERE t.token_hash=? AND t.kind='access' AND t.expires_at>? AND g.revoked_at IS NULL AND c.revoked_at IS NULL").bind(await hash(accessToken),Date.now()).first<{id:string;owner:string;scopes:string;resource:string}>();
  return row&&row.resource===resource&&allowed(env,row.owner) ? {id:`oauth:${row.id}`,owner:row.owner,scopes:row.scopes.split(' ')} : null;
}
