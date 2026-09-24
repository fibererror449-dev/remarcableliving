import { ApiError } from './core';
import { parseVideoLink, VIDEO_LINK_HELP } from '../video';
export type Attachment = { id: string; caption?: string; attribution: 'owner'|'agent'|'admin'; };
export type DraftPayload = {
  reference: string; name: string; district?: string; rent?: number; bedrooms?: number; bathrooms?: number;
  sizeSqm?: number; floor?: string; stationType?: 'BTS'|'MRT'; stationName?: string; walkMinutes?: number;
  latitude?: number; longitude?: number; lastVerified?: string; status?: 'available'|'viewing'|'rented'|'verify';
  description?: string; sourceUrl?: string; videoUrl?: string; provenance?: string; media?: Attachment[]; coverId?: string;
};
export const publishRequired = ['district','rent','bedrooms','bathrooms','sizeSqm','stationType','stationName','walkMinutes','latitude','longitude','lastVerified','status','coverId'] as const;
export function blockers(payload: DraftPayload): string[] { return publishRequired.filter(k=>payload[k]===undefined || payload[k]===null || payload[k]===''); }
const strings: Record<string,number> = {reference:120,name:200,district:120,floor:80,stationName:120,lastVerified:10,description:10000,sourceUrl:2000,videoUrl:2000,provenance:8000,coverId:100};
const numbers: Record<string,[number,number,boolean]>={rent:[1,100000000,true],bedrooms:[0,100,true],bathrooms:[1,100,true],sizeSqm:[0.1,100000,false],walkMinutes:[0,1440,true],latitude:[-90,90,false],longitude:[-180,180,false]};
export function validatePayload(value: unknown): {payload?:DraftPayload;errors:string[];blockers:string[]} {
  const errors:string[]=[];
  if(!value || typeof value!=='object' || Array.isArray(value)) return {errors:['Listing must be an object'],blockers:[]};
  const row=value as Record<string,unknown>;
  const known=new Set([...Object.keys(strings),...Object.keys(numbers),'status','stationType','media']);
  for(const key of Object.keys(row)) if(!known.has(key)) errors.push(`Unknown field: ${key}`);
  for(const [key,max] of Object.entries(strings)) if(row[key]!==undefined && (typeof row[key]!=='string' || (row[key] as string).length>max || (['reference','name'].includes(key) && !(row[key] as string).trim()))) errors.push(`${key} must be text (${max} characters maximum)`);
  for(const key of ['reference','name']) if(typeof row[key]!=='string' || !(row[key] as string).trim()) errors.push(`${key} is required`);
  for(const [key,[min,max,integer]] of Object.entries(numbers)) if(row[key]!==undefined && (typeof row[key]!=='number' || !Number.isFinite(row[key]) || (row[key] as number)<min || (row[key] as number)>max || (integer&&!Number.isInteger(row[key])))) errors.push(`${key} must be ${integer?'an integer':'a number'} between ${min} and ${max}`);
  if(row.status!==undefined && (typeof row.status!=='string'||!['available','viewing','rented','verify'].includes(row.status))) errors.push('Invalid status');
  if(row.stationType!==undefined && (typeof row.stationType!=='string'||!['BTS','MRT'].includes(row.stationType))) errors.push('stationType must be BTS or MRT');
  if(row.lastVerified!==undefined && (!/^\d{4}-\d{2}-\d{2}$/.test(String(row.lastVerified)) || !Number.isFinite(Date.parse(String(row.lastVerified))) || new Date(String(row.lastVerified)).toISOString().slice(0,10)!==row.lastVerified || String(row.lastVerified)>new Date().toISOString().slice(0,10))) errors.push('lastVerified must be a real, non-future YYYY-MM-DD date');
  if(row.sourceUrl) { try {const url=new URL(String(row.sourceUrl));if(!['https:','http:'].includes(url.protocol)||url.username||url.password) throw new Error();} catch {errors.push('sourceUrl must be an HTTP(S) URL without credentials');} }
  if(typeof row.videoUrl==='string' && row.videoUrl && !parseVideoLink(row.videoUrl)) errors.push(`videoUrl not recognised. ${VIDEO_LINK_HELP} Upload video files as media instead`);
  if(row.media!==undefined) {
    if(!Array.isArray(row.media)||row.media.length>60) errors.push('media must be an array of at most 60 attachments');
    else {const ids=new Set();for(const item of row.media){
      if(!item || typeof item!=='object' || typeof item.id!=='string' || item.id.length>100 || !['owner','agent','admin'].includes(item.attribution) || (item.caption!==undefined && (typeof item.caption!=='string'||item.caption.length>500)) || Object.keys(item).some(k=>!['id','caption','attribution'].includes(k))) errors.push('Invalid media attachment; id and attribution required');
      else {if(ids.has(item.id)) errors.push('Duplicate attachment'); ids.add(item.id);}
    }}
  }
  const video=typeof row.videoUrl==='string'&&row.videoUrl?parseVideoLink(row.videoUrl):null;
  const payload={...row,...(video?{videoUrl:video.href}:{}),reference:typeof row.reference==='string'?row.reference.trim():row.reference,name:typeof row.name==='string'?row.name.trim():row.name} as DraftPayload;
  return {payload:errors.length?undefined:payload,errors,blockers:errors.length?[]:blockers(payload)};
}
export function validateBatch(body: Record<string,unknown>) {
  if(typeof body.namespace!=='string'||!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$/.test(body.namespace)||!Array.isArray(body.listings)||body.listings.length<1||body.listings.length>50||Object.keys(body).some(k=>!['namespace','listings'].includes(k))) throw new ApiError(400,'Expected namespace and 1–50 listings');
  const seen=new Set<string>();
  const rows=body.listings.map((row,index)=>{const result=validatePayload(row);if(result.payload){if(seen.has(result.payload.reference)){result.errors.push('Duplicate reference in this batch');result.payload=undefined;}else seen.add(result.payload.reference);} return {...result,index};});
  return {namespace:body.namespace,rows};
}
export const listingSchema = {version:1,requiredForDraft:['reference','name'],requiredForPublication:publishRequired,fields:{text:strings,numbers,status:['available','viewing','rented','verify'],stationType:['BTS','MRT'],media:{maxItems:60,fields:['id','caption','attribution'],attribution:['owner','agent','admin']},videoUrl:'Optional YouTube or Google Drive link to the unit\'s video tour; the public page plays it instead of any uploaded video. Upload video files as media instead.'},limits:{listings:50,jsonBytes:1048576,fileBytes:50*1024*1024},example:{namespace:'drive',listings:[{reference:'unit-101',name:'Example residence',bedrooms:0}]}};
