import { adminActor, agentActor, ApiError, audit, bodyJson, createCredential, json, type ImportEnv } from './imports/core';
import { editDraft, getDraft, getImport, importBatch, listDrafts, publishDraft, rejectDraft } from './imports/service';
import { listingSchema, validateBatch } from './imports/validation';
import { readMedia, uploadMedia } from './imports/media';
import { handleMcp } from './imports/mcp';
import { approve, authorize, cors, createClient, listClients, resourceMetadata, revokeClient, serverMetadata, siteOrigin, token } from './imports/oauth';

export async function handleAgentRequest(request: Request, env: ImportEnv): Promise<Response | null> {
  const path=new URL(request.url).pathname;
  if(!path.startsWith('/api/v1/') && !path.startsWith('/api/admin/imports') && !path.startsWith('/listing-media/') && !path.startsWith('/oauth/') && !path.startsWith('/.well-known/oauth-') && path!=='/mcp') return null;
  try {
    if(path==='/mcp') return await handleMcp(request,env);
    if(path.startsWith('/.well-known/oauth-')) {
      if(request.method==='OPTIONS') return new Response(null,{status:204,headers:{...cors,'access-control-allow-methods':'GET, OPTIONS'}});
      const origin=siteOrigin(request,env);
      if(path==='/.well-known/oauth-protected-resource'||path==='/.well-known/oauth-protected-resource/mcp') return json(resourceMetadata(origin),200,cors);
      if(path==='/.well-known/oauth-authorization-server') return json(serverMetadata(origin),200,cors);
      throw new ApiError(404,'Endpoint not found');
    }
    if(path==='/oauth/token'&&request.method==='OPTIONS') return new Response(null,{status:204,headers:{...cors,'access-control-allow-methods':'POST, OPTIONS'}});
    if(path.startsWith('/oauth/')&&env.IMPORTS_ENABLED!=='1') throw new ApiError(503,'Agent imports are disabled');
    if(path==='/oauth/authorize'&&request.method==='GET') return await authorize(request,env);
    if(path==='/oauth/authorize'&&request.method==='POST') return await approve(request,env);
    if(path==='/oauth/token'&&request.method==='POST') return await token(request,env);
    if(path==='/api/admin/imports/oauth-clients'&&request.method==='GET') {adminActor(request,env);return json({mcpUrl:`${siteOrigin(request,env)}/mcp`,clients:await listClients(env)});}
    if(path==='/api/admin/imports/oauth-clients'&&request.method==='POST') return json(await createClient(env,adminActor(request,env),await bodyJson(request)),201);
    if(path.startsWith('/api/admin/imports/oauth-clients/')&&request.method==='DELETE') return json(await revokeClient(env,adminActor(request,env),path.split('/').at(-1)!));
    if(path.startsWith('/listing-media/') && ['GET','HEAD'].includes(request.method)) return await readMedia(request,env,path.split('/').at(-1)!,true);
    if(path.startsWith('/api/admin/imports/drafts')) {
      const admin=adminActor(request,env),parts=path.split('/'),id=parts[5],action=parts[6];
      if(request.method==='GET'&&!id)return json({drafts:await listDrafts(env)});
      if(request.method==='GET'&&id)return json(await getDraft(env,id));
      if(request.method==='PATCH'&&id&&!action)return json(await editDraft(env,admin,id,await bodyJson(request)));
      if(request.method==='POST'&&action==='publish')return json(await publishDraft(env,admin,id));
      if(request.method==='POST'&&action==='reject')return json(await rejectDraft(env,admin,id));
      throw new ApiError(404,'Review action not found');
    }
    if(path.startsWith('/api/admin/imports/media/')&&['GET','HEAD'].includes(request.method)) {adminActor(request,env);return await readMedia(request,env,path.split('/').at(-1)!);}
    if(path==='/api/admin/imports/credentials' && request.method==='POST') return json(await createCredential(env,adminActor(request,env),await bodyJson(request)),201);
    if(path==='/api/admin/imports/credentials' && request.method==='GET') {
      adminActor(request,env);
      return json({importsEnabled:env.IMPORTS_ENABLED==='1',credentials:(await env.DB.prepare('SELECT id,owner,name,scopes,expires_at,revoked_at FROM agent_credentials ORDER BY created_at DESC LIMIT 100').all()).results});
    }
    if(path.startsWith('/api/admin/imports/credentials/') && request.method==='DELETE') {
      const admin=adminActor(request,env), id=path.split('/').at(-1)!;
      await env.DB.batch([env.DB.prepare('UPDATE agent_credentials SET revoked_at=? WHERE id=?').bind(Date.now(),id),audit(env,admin,'credential.revoked',id)]);
      return json({ok:true});
    }
    const actor=await agentActor(request,env,request.method==='GET'?'listings:read':path==='/api/v1/media'?'media:write':'listings:write');
    if(path==='/api/v1/media' && request.method==='POST') return json(await uploadMedia(request,env,actor),201);
    if(path.startsWith('/api/v1/media/') && ['GET','HEAD'].includes(request.method)) return await readMedia(request,env,path.split('/').at(-1)!);
    if(path==='/api/v1/listing-schema' && request.method==='GET') return json(listingSchema);
    if(path==='/api/v1/imports/validate' && request.method==='POST') return json({results:validateBatch(await bodyJson(request)).rows.map(r=>({index:r.index,outcome:r.errors.length?'invalid':'valid',errors:r.errors,blockers:r.blockers}))});
    if(path==='/api/v1/imports' && request.method==='POST') return json(await importBatch(env,actor,await bodyJson(request),request.headers.get('idempotency-key')??''),201);
    if(path.startsWith('/api/v1/imports/') && request.method==='GET') return json(await getImport(env,path.split('/').at(-1)!));
    if(path.startsWith('/api/v1/drafts/') && request.method==='GET') return json(await getDraft(env,path.split('/').at(-1)!));
    throw new ApiError(404,'Endpoint not found');
  } catch(error) {
    if(error instanceof ApiError) return json({error:error.message,details:error.details},error.status);
    console.error('Import API unavailable',error instanceof Error?error.message:'unknown');
    return json({error:'Import storage temporarily unavailable'},503);
  }
}
