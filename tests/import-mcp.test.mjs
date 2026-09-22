import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { harness, adminHeaders, origin } from './import-harness.mjs';

const rpc=(method,params={},id=1)=>({jsonrpc:'2.0',id,method,params});

test('an unauthenticated chat client discovers the admin-approved authorization server',async t=>{
  const h=await harness();t.after(h.close);
  const denied=await h.request('/mcp',{method:'POST',json:rpc('initialize',{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'test',version:'1'}})});
  assert.equal(denied.status,401);
  const metadataUrl=/resource_metadata="([^"]+)"/.exec(denied.headers.get('www-authenticate'))?.[1];
  assert.equal(metadataUrl,`${origin}/.well-known/oauth-protected-resource/mcp`);
  const resource=await (await h.request(new URL(metadataUrl).pathname)).json();
  assert.equal(resource.resource,`${origin}/mcp`);
  const server=await (await h.request(`/.well-known/oauth-authorization-server`)).json();
  assert.equal(server.issuer,resource.authorization_servers[0]);
  assert.deepEqual(server.code_challenge_methods_supported,['S256']);
  assert.equal(server.registration_endpoint,undefined);
  assert.equal((await h.request('/mcp')).status,405);
});

const callback='https://client.example/callback';
const base64url=buffer=>buffer.toString('base64').replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const form=values=>({headers:{'content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams(values).toString()});

async function connect(h,{scope,redeem=true}={}) {
  const client=await (await h.request('/api/admin/imports/oauth-clients',{method:'POST',headers:adminHeaders,json:{name:'Test chat',redirectUris:[callback]}})).json();
  const verifier=base64url(Buffer.from('a'.repeat(48))),challenge=base64url(createHash('sha256').update(verifier).digest());
  const query=new URLSearchParams({response_type:'code',client_id:client.id,redirect_uri:callback,code_challenge:challenge,code_challenge_method:'S256',state:'xyz',resource:`${origin}/mcp`,...(scope?{scope}:{})});
  const consentPage=await h.request(`/oauth/authorize?${query}`,{headers:adminHeaders});
  assert.equal(consentPage.status,200);
  const consent=/name="consent" value="([^"]+)"/.exec(await consentPage.text())[1];
  const approved=await h.request('/oauth/authorize',{method:'POST',...form({consent,decision:'allow'}),headers:{...adminHeaders,...form({}).headers}});
  assert.equal(approved.status,302);
  const redirect=new URL(approved.headers.get('location'));
  assert.equal(redirect.origin+redirect.pathname,callback);
  assert.equal(redirect.searchParams.get('state'),'xyz');
  assert.equal(redirect.searchParams.get('iss'),origin);
  const exchange=values=>h.request('/oauth/token',{method:'POST',...form({grant_type:'authorization_code',code:redirect.searchParams.get('code'),redirect_uri:callback,client_id:client.id,code_verifier:verifier,resource:`${origin}/mcp`,...values})});
  const tokens=redeem?await (await exchange({})).json():null;
  return {client,consent,exchange,tokens,query};
}
const mcp=(h,token,message)=>h.request('/mcp',{method:'POST',token,headers:{accept:'application/json, text/event-stream','mcp-protocol-version':'2025-11-25'},json:message});
const call=async (h,token,name,args)=>(await (await mcp(h,token,rpc('tools/call',{name,arguments:args}))).json()).result;

test('an admin-approved chat client saves private drafts through MCP tools but cannot publish',async t=>{
  const h=await harness();t.after(h.close);
  const {client,query,tokens}=await connect(h);
  const anonymous=await h.request(`/oauth/authorize?${query}`);
  assert.equal(anonymous.status,302);
  assert.match(anonymous.headers.get('location'),/^\/signin-with-chatgpt\?return_to=%2Foauth%2Fauthorize/);
  assert.equal(tokens.token_type,'Bearer');
  const init=await (await mcp(h,tokens.access_token,rpc('initialize',{protocolVersion:'2025-11-25',capabilities:{},clientInfo:{name:'test',version:'1'}}))).json();
  assert.equal(init.result.protocolVersion,'2025-11-25');
  assert.equal((await mcp(h,tokens.access_token,{jsonrpc:'2.0',method:'notifications/initialized'})).status,202);
  const names=(await (await mcp(h,tokens.access_token,rpc('tools/list'))).json()).result.tools.map(tool=>tool.name);
  assert.ok(names.includes('import_listings')&&names.includes('upload_media'));
  assert.ok(!names.some(name=>/publish|credential|client/.test(name)));
  const job=(await call(h,tokens.access_token,'import_listings',{namespace:'chat',idempotencyKey:'chat-1',listings:[{reference:'unit-9',name:'Chat residence'}]})).structuredContent;
  assert.equal(job.results[0].outcome,'created');
  assert.equal(job.results[0].reviewUrl,`${origin}/admin/imports/${job.results[0].draftId}`);
  const draft=(await call(h,tokens.access_token,'get_draft',{draftId:job.results[0].draftId})).structuredContent;
  assert.ok(draft.blockers.includes('rent'));
  assert.equal((await h.request(`/api/admin/imports/drafts/${draft.id}/publish`,{method:'POST',token:tokens.access_token,json:{}})).status,401);
  assert.equal((await h.request(`/api/v1/drafts/${draft.id}`,{token:tokens.access_token})).status,401);
  const revoked=await h.request(`/api/admin/imports/oauth-clients/${client.id}`,{method:'DELETE',headers:adminHeaders});
  assert.equal(revoked.status,200);
  assert.equal((await mcp(h,tokens.access_token,rpc('tools/list'))).status,401);
});

test('codes and consents are one-use and replayed refresh tokens end the connection',async t=>{
  const h=await harness();t.after(h.close);
  const {client,consent,exchange,tokens}=await connect(h);
  assert.equal((await h.request('/oauth/authorize',{method:'POST',...form({consent,decision:'allow'}),headers:{...adminHeaders,...form({}).headers}})).status,400);
  const refresh=value=>h.request('/oauth/token',{method:'POST',...form({grant_type:'refresh_token',refresh_token:value,client_id:client.id})});
  const rotated=await (await refresh(tokens.refresh_token)).json();
  assert.notEqual(rotated.refresh_token,tokens.refresh_token);
  assert.equal((await mcp(h,rotated.access_token,rpc('ping'))).status,200);
  const replay=await refresh(tokens.refresh_token);
  assert.equal(replay.status,400);
  assert.equal((await replay.json()).error,'invalid_grant');
  assert.equal((await mcp(h,rotated.access_token,rpc('ping'))).status,401);
  assert.equal((await refresh(rotated.refresh_token)).status,400);
  const second=await connect(h);
  assert.equal((await second.exchange({})).status,400);
  assert.equal((await mcp(h,second.tokens.access_token,rpc('ping'))).status,401);
});

test('unregistered callbacks, wrong verifiers and the kill switch are refused',async t=>{
  const h=await harness();t.after(h.close);
  const {client,query}=await connect(h);
  const elsewhere=new URLSearchParams(query);elsewhere.set('redirect_uri','https://attacker.example/callback');
  const refused=await h.request(`/oauth/authorize?${elsewhere}`,{headers:adminHeaders});
  assert.equal(refused.status,400);
  assert.equal(refused.headers.get('location'),null);
  const plain=new URLSearchParams(query);plain.set('code_challenge_method','plain');
  assert.equal(new URL((await h.request(`/oauth/authorize?${plain}`,{headers:adminHeaders})).headers.get('location')).searchParams.get('error'),'invalid_request');
  const other=await connect(h,{redeem:false});
  assert.equal((await (await other.exchange({code_verifier:base64url(Buffer.from('b'.repeat(48)))})).json()).error,'invalid_grant');
  assert.equal((await other.exchange({})).status,400);
  assert.equal((await h.request('/oauth/token',{method:'POST',...form({grant_type:'refresh_token',refresh_token:'x',client_id:client.id,client_secret:'wrong'})})).status,401);
  const off=await harness({IMPORTS_ENABLED:'0'});t.after(off.close);
  assert.equal((await off.request('/mcp',{method:'POST',json:rpc('ping')})).status,503);
  assert.equal((await off.request(`/oauth/authorize?${query}`,{headers:adminHeaders})).status,503);
});

test('an API credential uses the same MCP tools and uploads private media',async t=>{
  const h=await harness();t.after(h.close);const {token}=await h.issue();
  const png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=';
  const media=(await call(h,token,'upload_media',{fileName:'room.png',mimeType:'image/png',dataBase64:png})).structuredContent;
  assert.equal((await call(h,token,'upload_media',{fileName:'again.png',mimeType:'image/png',dataBase64:png})).structuredContent.id,media.id);
  assert.equal((await h.request(`/listing-media/${media.id}`)).status,404);
  assert.deepEqual(Buffer.from(await (await h.request(`/api/v1/media/${media.id}`,{token})).arrayBuffer()),Buffer.from(png,'base64'));
  const fake=await call(h,token,'upload_media',{fileName:'fake.png',mimeType:'image/png',dataBase64:Buffer.from('not a png').toString('base64')});
  assert.equal(fake.isError,true);
  const invalid=await call(h,token,'import_listings',{namespace:'chat',idempotencyKey:'bad',listings:[{reference:'x',name:'Bad',rent:'lots'}]});
  assert.equal(invalid.structuredContent.results[0].outcome,'invalid');
});
