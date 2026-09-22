import { createHash } from 'node:crypto';
import { ApiError, audit, type Actor, type ImportEnv } from './core';
import { MAX_UPLOAD_BYTES, MEDIA_TYPES } from '../uploads';
import type { DraftPayload } from './validation';

type MediaRow = {id:string;object_key:string;mime:string;size:number;name:string};
function matchesType(bytes: Uint8Array, mime:string) {
  const ascii=new TextDecoder().decode(bytes);
  if(mime==='image/png') return [137,80,78,71,13,10,26,10].every((b,i)=>bytes[i]===b);
  if(mime==='image/jpeg') return bytes[0]===255&&bytes[1]===216&&bytes[2]===255;
  if(mime==='image/gif') return ascii.startsWith('GIF87a')||ascii.startsWith('GIF89a');
  if(mime==='image/webp') return ascii.startsWith('RIFF')&&ascii.slice(8,12)==='WEBP';
  if(mime==='video/webm') return [26,69,223,163].every((b,i)=>bytes[i]===b);
  return ['video/mp4','video/quicktime'].includes(mime)&&['ftyp','moov','mdat','wide'].includes(ascii.slice(4,8));
}
export async function uploadMedia(request:Request,env:ImportEnv,actor:Actor) {
  const size=Number(request.headers.get('content-length'));
  if(!Number.isSafeInteger(size)||size<1||!request.body) throw new ApiError(400,'Non-empty body and Content-Length required');
  let name:string;try{name=decodeURIComponent(request.headers.get('x-file-name')??'upload');}catch{throw new ApiError(400,'Invalid filename');}
  return storeMedia(env,actor,{mime:request.headers.get('content-type')??'',size,name,body:request.body});
}
/** Streams bytes into the private import prefix; REST and MCP uploads share these rules. */
export async function storeMedia(env:ImportEnv,actor:Actor,file:{mime:string;size:number;name:string;body:ReadableStream<Uint8Array>}) {
  const {mime,size}=file,name=file.name.slice(0,180);
  if(!MEDIA_TYPES[mime]) throw new ApiError(415,'Unsupported media type');
  if(size>MAX_UPLOAD_BYTES) throw new ApiError(413,'Files must be 50 MiB or smaller');
  const id=crypto.randomUUID(),objectKey=`listing-imports/${id}`;
  const digest=createHash('sha256');let actual=0;const prefix:number[]=[];
  const validated=new TransformStream<Uint8Array,Uint8Array>({transform(chunk,controller){
    actual+=chunk.length;if(actual>size||actual>MAX_UPLOAD_BYTES) throw new ApiError(413,'Upload exceeds declared size');
    digest.update(chunk);for(let i=0;i<chunk.length&&prefix.length<32;i++)prefix.push(chunk[i]);controller.enqueue(chunk);
  },flush(){if(actual!==size)throw new ApiError(400,'Upload length mismatch');if(!matchesType(new Uint8Array(prefix),mime))throw new ApiError(415,'File bytes do not match media type');}});
  // FixedLengthStream keeps R2 streaming with a known length; no full-file buffer.
  const fixed=new FixedLengthStream(size);
  let streamError:unknown;
  const pumping=file.body.pipeThrough(validated).pipeTo(fixed.writable).catch(error=>{streamError=error;});
  try {
    await env.MEDIA.put(objectKey,fixed.readable,{httpMetadata:{contentType:mime}});
    await pumping;if(streamError)throw streamError;
    const contentHash=digest.digest('hex');
    await env.DB.batch([env.DB.prepare('INSERT OR IGNORE INTO import_media (id,actor,content_hash,object_key,mime,size,name,created_at) VALUES (?,?,?,?,?,?,?,?)').bind(id,actor.id,contentHash,objectKey,mime,size,name,Date.now()),audit(env,actor,'media.uploaded',id)]);
    const row=await env.DB.prepare('SELECT id,mime,size,name FROM import_media WHERE actor=? AND content_hash=?').bind(actor.id,contentHash).first<MediaRow>();
    if(!row)throw new ApiError(503,'Media metadata unavailable');
    if(row.id!==id)await env.MEDIA.delete(objectKey);
    return {...row,url:`/api/v1/media/${row.id}`};
  } catch(error){await pumping;await env.MEDIA.delete(objectKey).catch(()=>undefined);throw streamError??error;}
}
export async function attachmentDetails(env:ImportEnv,payload:DraftPayload) {
  const ids=(payload.media??[]).map(m=>m.id);
  if(!ids.length)return [];
  return (await env.DB.prepare(`SELECT id,mime,size,name FROM import_media WHERE id IN (${ids.map(()=>'?').join(',')})`).bind(...ids).all<Omit<MediaRow,'object_key'>>()).results;
}
export function mediaBlockers(payload:DraftPayload,details:{id:string;mime:string}[]) {
  const errors:string[]=[];
  for(const attachment of payload.media??[]) {
    const media=details.find(d=>d.id===attachment.id);
    if(!media)errors.push(`Unknown attachment: ${attachment.id}`);
    else if(payload.coverId===attachment.id&&!media.mime.startsWith('image/'))errors.push('Cover must be a photo');
  }
  if(payload.coverId && !(payload.media??[]).some(m=>m.id===payload.coverId)) errors.push('Cover must be included in media');
  return errors;
}
export async function readMedia(request:Request,env:ImportEnv,id:string,isPublic=false) {
  const row=await env.DB.prepare(`SELECT m.* FROM import_media m WHERE m.id=? ${isPublic?'AND EXISTS (SELECT 1 FROM listing_media p WHERE p.media_id=m.id)':''}`).bind(id).first<MediaRow>();
  if(!row)throw new ApiError(404,'Media not found');
  const headers=new Headers({'content-type':row.mime,'x-content-type-options':'nosniff','cache-control':isPublic?'public, max-age=300':'private, no-store','accept-ranges':'bytes'});
  const rangeHeader=request.headers.get('range');let range:{offset:number;length:number}|undefined;
  if(rangeHeader){
    const match=/^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
    const bad=()=>new Response(null,{status:416,headers:{'content-range':`bytes */${row.size}`,'cache-control':'no-store'}});
    if(!match||(!match[1]&&!match[2]))return bad();
    const offset=match[1]?Number(match[1]):Math.max(0,row.size-Number(match[2]));
    const end=match[1]&&match[2]?Math.min(Number(match[2]),row.size-1):row.size-1;
    if(!Number.isSafeInteger(offset)||!Number.isSafeInteger(end)||offset>=row.size||end<offset)return bad();
    range={offset,length:end-offset+1};headers.set('content-range',`bytes ${offset}-${end}/${row.size}`);
  }
  const object=await env.MEDIA.get(row.object_key,range?{range}:undefined);
  if(!object)throw new ApiError(503,'Media bytes unavailable');
  headers.set('content-length',String(range?.length??row.size));headers.set('etag',object.httpEtag);
  return new Response(request.method==='HEAD'?null:object.body as unknown as BodyInit,{status:range?206:200,headers});
}
