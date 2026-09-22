import { ApiError, bearer, bodyJson, credentialActor, json, type Actor, type ImportEnv } from './core';
import { getDraft, getImport, importBatch } from './service';
import { listingSchema, validateBatch } from './validation';
import { storeMedia } from './media';
import { cors, mcpResource, oauthActor, siteOrigin } from './oauth';
import { MEDIA_TYPES } from '../uploads';

// Stateless Streamable HTTP: every POST carries one JSON-RPC message and gets a JSON reply.
// Tools call the same services as the REST API; none of them publishes or manages access.
const versions=['2025-11-25','2025-06-18','2025-03-26'];
const MCP_MEDIA_BYTES=5*1024*1024;
type Args=Record<string,unknown>;
type Tool={name:string;title:string;description:string;scope:string;inputSchema:Record<string,unknown>;annotations:Record<string,boolean>;run:(args:Args,actor:Actor,env:ImportEnv,origin:string)=>Promise<unknown>|unknown};

const listings={type:'array',minItems:1,maxItems:50,items:{type:'object',description:'One unit: reference and name are required; add only facts the source confirms.'}};
const text=(description:string)=>({type:'string',minLength:1,description});
const absolute=(origin:string,job:{results:{reviewUrl?:string}[]})=>({...job,results:job.results.map(r=>r.reviewUrl?{...r,reviewUrl:origin+r.reviewUrl}:r)});
const tools:Tool[]=[
  {name:'get_listing_schema',title:'Get listing format',scope:'listings:read',annotations:{readOnlyHint:true,openWorldHint:false},
    description:'Returns the listing fields, which facts are required before an admin can publish, and batch/file limits. Call this before preparing listings.',
    inputSchema:{type:'object',properties:{},additionalProperties:false},run:()=>listingSchema},
  {name:'validate_listings',title:'Check listings',scope:'listings:write',annotations:{readOnlyHint:true,openWorldHint:false},
    description:'Checks up to 50 listings without saving anything. Reports malformed facts per row and which facts are still missing for publication.',
    inputSchema:{type:'object',properties:{namespace:text('Stable name for the source, e.g. "drive"'),listings},required:['namespace','listings'],additionalProperties:false},
    run:args=>({results:validateBatch({namespace:args.namespace,listings:args.listings}).rows.map(r=>({index:r.index,outcome:r.errors.length?'invalid':'valid',errors:r.errors,blockers:r.blockers}))})},
  {name:'import_listings',title:'Save listings as drafts',scope:'listings:write',annotations:{readOnlyHint:false,destructiveHint:false,idempotentHint:true,openWorldHint:false},
    description:'Saves up to 50 listings as private drafts for an admin to review. Never publishes. Leave out facts the source does not confirm; never guess. The same namespace + reference updates the same unit. Retrying with the same idempotencyKey returns the original result.',
    inputSchema:{type:'object',properties:{namespace:text('Stable name for the source, e.g. "drive"'),listings,idempotencyKey:{...text('Unique per batch; reuse it only to retry the same batch'),maxLength:200}},required:['namespace','listings','idempotencyKey'],additionalProperties:false},
    run:async (args,actor,env,origin)=>absolute(origin,await importBatch(env,actor,{namespace:args.namespace,listings:args.listings},String(args.idempotencyKey??'')))},
  {name:'get_import',title:'Get import result',scope:'listings:read',annotations:{readOnlyHint:true,openWorldHint:false},
    description:'Returns the per-row outcome of an earlier import_listings call.',
    inputSchema:{type:'object',properties:{importId:text('The id returned by import_listings')},required:['importId'],additionalProperties:false},
    run:async (args,_actor,env,origin)=>absolute(origin,await getImport(env,String(args.importId)))},
  {name:'get_draft',title:'Get draft',scope:'listings:read',annotations:{readOnlyHint:true,openWorldHint:false},
    description:'Returns a draft, its review state and anything still blocking publication.',
    inputSchema:{type:'object',properties:{draftId:text('The draftId from an import result')},required:['draftId'],additionalProperties:false},
    run:(args,_actor,env)=>getDraft(env,String(args.draftId))},
  {name:'upload_media',title:'Upload a photo or video',scope:'media:write',annotations:{readOnlyHint:false,destructiveHint:false,idempotentHint:true,openWorldHint:false},
    description:'Uploads one real photo or video of a unit (base64, up to 5 MiB here; use the command-line helper for larger files, up to 50 MiB). Returns an id to use in a listing\'s media and coverId. Stays private until an admin publishes the listing.',
    inputSchema:{type:'object',properties:{fileName:text('Original file name'),mimeType:{type:'string',enum:Object.keys(MEDIA_TYPES)},dataBase64:text('File bytes, base64-encoded')},required:['fileName','mimeType','dataBase64'],additionalProperties:false},
    run:async (args,actor,env)=>{
      if(typeof args.dataBase64!=='string'||args.dataBase64.length>Math.ceil(MCP_MEDIA_BYTES/3)*4) throw new ApiError(413,'Files over 5 MiB must be uploaded with the command-line helper');
      let bytes:Uint8Array;
      try { bytes=Uint8Array.from(atob(args.dataBase64),c=>c.charCodeAt(0)); } catch { throw new ApiError(400,'dataBase64 is not valid base64'); }
      if(!bytes.length) throw new ApiError(400,'File is empty');
      return storeMedia(env,actor,{mime:String(args.mimeType),size:bytes.length,name:String(args.fileName),body:new Response(bytes.buffer as ArrayBuffer).body!});
    }},
];

const reply=(id:unknown,body:Record<string,unknown>,status=200)=>json({jsonrpc:'2.0',id,...body},status,cors);
const failure=(id:unknown,code:number,message:string,status=200)=>reply(id,{error:{code,message}},status);

export async function handleMcp(request:Request,env:ImportEnv):Promise<Response> {
  if(request.method==='OPTIONS') return new Response(null,{status:204,headers:{...cors,'access-control-allow-methods':'POST, OPTIONS','access-control-max-age':'86400'}});
  if(request.method!=='POST') return new Response(null,{status:405,headers:{...cors,allow:'POST, OPTIONS'}});
  if(env.IMPORTS_ENABLED!=='1') return json({error:'Agent imports are disabled'},503,cors);
  const origin=siteOrigin(request,env),resource=mcpResource(origin),token=bearer(request);
  const actor=token ? await credentialActor(env,token) ?? await oauthActor(env,token,resource) : null;
  if(!actor) return json({error:'Authorization required'},401,{...cors,'www-authenticate':`Bearer resource_metadata="${origin}/.well-known/oauth-protected-resource/mcp"`});
  const version=request.headers.get('mcp-protocol-version');
  if(version&&!versions.includes(version)) return failure(null,-32600,`Unsupported protocol version; use ${versions.join(', ')}`,400);
  let message:Args;
  try { message=await bodyJson(request,8*1024*1024); }
  catch(error) { return failure(null,error instanceof ApiError&&error.status===413?-32600:-32700,error instanceof Error?error.message:'Parse error',error instanceof ApiError?error.status:400); }
  if(message.jsonrpc!=='2.0') return failure(message.id??null,-32600,'Expected a JSON-RPC 2.0 message',400);
  // Notifications and responses need no reply.
  if(message.id===undefined||typeof message.method!=='string') return new Response(null,{status:202,headers:cors});
  const {id,method}=message,params=(message.params??{}) as Args;
  if(method==='initialize') {
    const requested=String(params.protocolVersion??'');
    return reply(id,{result:{protocolVersion:versions.includes(requested)?requested:versions[0],capabilities:{tools:{listChanged:false}},
      serverInfo:{name:'remarcable-living-imports',title:'REMARCABLE LIVING listing imports',version:'1.0.0'},
      instructions:'Prepare rental listings for REMARCABLE LIVING from source files the user gives you. Call get_listing_schema first. Upload real photos with upload_media, then save listings with import_listings. Everything stays a private draft until an admin reviews and publishes it; share the reviewUrl links with the user. Never invent facts, photos or captions.'}});
  }
  if(method==='ping') return reply(id,{result:{}});
  if(method==='tools/list') return reply(id,{result:{tools:tools.map(({name,title,description,inputSchema,annotations})=>({name,title,description,inputSchema,annotations}))}});
  if(method!=='tools/call') return failure(id,-32601,`Method not found: ${method}`);
  const tool=tools.find(t=>t.name===params.name);
  if(!tool) return failure(id,-32602,`Unknown tool: ${String(params.name)}`);
  try {
    if(!actor.scopes.includes(tool.scope)) throw new ApiError(403,`This connection lacks the ${tool.scope} scope`);
    const args=params.arguments&&typeof params.arguments==='object'&&!Array.isArray(params.arguments)?params.arguments as Args:{};
    const result=await tool.run(args,actor,env,origin);
    return reply(id,{result:{content:[{type:'text',text:JSON.stringify(result)}],structuredContent:result}});
  } catch(error) {
    if(!(error instanceof ApiError)) throw error;
    const details=Array.isArray(error.details)?` (${error.details.join('; ')})`:'';
    return reply(id,{result:{content:[{type:'text',text:`${error.message}${details}`}],isError:true}});
  }
}
