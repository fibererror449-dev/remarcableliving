import { ApiError, audit, canonical, hash, type Actor, type ImportEnv } from './core';
import { blockers, validateBatch, validatePayload, type DraftPayload } from './validation';
import { attachmentDetails, mediaBlockers } from './media';
type DraftRow = {id:string;source_id:string;revision:number;payload:string;payload_hash:string;base_version:number|null;state:string;actor:string;created_at:number;namespace:string;reference:string;listing_id:number|null;current_draft:string};
export async function getDraft(env: ImportEnv, id: string) {
  const row=await env.DB.prepare('SELECT d.*,s.namespace,s.reference,s.listing_id,s.current_draft FROM listing_drafts d JOIN import_sources s ON s.id=d.source_id WHERE d.id=?').bind(id).first<DraftRow>();
  if(!row) throw new ApiError(404,'Draft not found');
  const payload=JSON.parse(row.payload) as DraftPayload;
  const published=row.listing_id ? await env.DB.prepare('SELECT * FROM listings WHERE id=?').bind(row.listing_id).first<Record<string,unknown>>() : null;
  const attachments=await attachmentDetails(env,payload);
  return {...row, payload, attachments, blockers:[...blockers(payload),...mediaBlockers(payload,attachments)], current:row.current_draft===id, published:published?publicFacts(published):null};
}
type Source = {id:string;current_draft:string|null;generation:number;listing_id:number|null};
type RowResult = {index:number;reference?:string;outcome:string;draftId?:string;reviewUrl?:string;errors?:string[]};
export async function getImport(env: ImportEnv, id:string) {
  const job=await env.DB.prepare('SELECT id,row_count FROM import_jobs WHERE id=?').bind(id).first<{id:string;row_count:number}>();
  if(!job) throw new ApiError(404,'Import not found');
  const rows=await env.DB.prepare('SELECT result FROM import_rows WHERE job_id=? ORDER BY row_index').bind(id).all<{result:string}>();
  return {id,complete:rows.results.length===job.row_count,results:rows.results.map(r=>JSON.parse(r.result))};
}
function rowStatement(env:ImportEnv,jobId:string,result:RowResult) {
  return env.DB.prepare('INSERT INTO import_rows (id,job_id,row_index,result) VALUES (?,?,?,?)').bind(crypto.randomUUID(),jobId,result.index,JSON.stringify(result));
}
export async function importBatch(env: ImportEnv, actor: Actor, body: Record<string,unknown>, key: string) {
  if(!key || key.length>200) throw new ApiError(400,'Idempotency-Key required (1–200 characters)');
  const validated=validateBatch(body), requestHash=await hash(canonical(body));
  await env.DB.prepare('INSERT OR IGNORE INTO import_jobs (id,actor,request_key,payload_hash,row_count,created_at) VALUES (?,?,?,?,?,?)').bind(crypto.randomUUID(),actor.id,key,requestHash,validated.rows.length,Date.now()).run();
  const job=await env.DB.prepare('SELECT id,payload_hash FROM import_jobs WHERE actor=? AND request_key=?').bind(actor.id,key).first<{id:string;payload_hash:string}>();
  if(!job || job.payload_hash!==requestHash) throw new ApiError(409,'Idempotency key already used for different content');
  for(const {index,payload,errors} of validated.rows) {
    let complete=false;
    for(let attempt=0;attempt<8;attempt++) {
      if(await env.DB.prepare('SELECT id FROM import_rows WHERE job_id=? AND row_index=?').bind(job.id,index).first()){complete=true;break;}
      if(!payload){await env.DB.prepare('INSERT OR IGNORE INTO import_rows (id,job_id,row_index,result) VALUES (?,?,?,?)').bind(crypto.randomUUID(),job.id,index,JSON.stringify({index,outcome:'invalid',errors})).run();complete=true;break;}
      await env.DB.prepare('INSERT OR IGNORE INTO import_sources (id,namespace,reference) VALUES (?,?,?)').bind(crypto.randomUUID(),validated.namespace,payload.reference).run();
      const source=await env.DB.prepare('SELECT * FROM import_sources WHERE namespace=? AND reference=?').bind(validated.namespace,payload.reference).first<Source>();
      if(!source) throw new ApiError(503,'Source storage unavailable');
      const payloadHash=await hash(canonical(payload));
      const prior=source.current_draft ? await env.DB.prepare('SELECT id,payload_hash FROM listing_drafts WHERE id=?').bind(source.current_draft).first<{id:string;payload_hash:string}>() : null;
      const unchanged=prior?.payload_hash===payloadHash;
      const draftId=unchanged?prior!.id:crypto.randomUUID();
      const result:RowResult={index,reference:payload.reference,outcome:unchanged?'unchanged':source.generation?'updated':'created',draftId,reviewUrl:`/admin/imports/${draftId}`};
      const guard=crypto.randomUUID();
      const statements=[env.DB.prepare('INSERT INTO import_guards (id,valid) SELECT ?,CASE WHEN generation=? THEN 1 ELSE 0 END FROM import_sources WHERE id=?').bind(guard,source.generation,source.id)];
      if(!unchanged) {
        statements.push(env.DB.prepare("UPDATE listing_drafts SET state='superseded' WHERE source_id=? AND state='pending'").bind(source.id));
        statements.push(env.DB.prepare("INSERT INTO listing_drafts (id,source_id,revision,payload,payload_hash,base_version,state,actor,created_at) VALUES (?,?,?,?,?,(SELECT publication_version FROM listings WHERE id=?),'pending',?,?)").bind(draftId,source.id,source.generation+1,canonical(payload),payloadHash,source.listing_id,actor.id,Date.now()));
        statements.push(env.DB.prepare('UPDATE import_sources SET current_draft=?,generation=generation+1 WHERE id=?').bind(draftId,source.id));
        statements.push(audit(env,actor,'draft.'+result.outcome,draftId));
      }
      statements.push(rowStatement(env,job.id,result),env.DB.prepare('DELETE FROM import_guards WHERE id=?').bind(guard));
      try {await env.DB.batch(statements);complete=true;break;}
      catch(error){if(!/import_guard_valid|import_rows.job_id|draft_revision|listing_drafts.source_id/.test(String(error))) throw error;}
    }
    if(!complete) throw new ApiError(409,'Concurrent import busy; retry with the same idempotency key');
  }
  return getImport(env,job.id);
}

const fieldColumns:Record<string,string>={name:'name',district:'district',rent:'rent',bedrooms:'bedrooms',bathrooms:'bathrooms',sizeSqm:'size_sqm',floor:'floor',stationType:'station_type',stationName:'station_name',walkMinutes:'walk_minutes',latitude:'latitude',longitude:'longitude',lastVerified:'last_verified',status:'status',description:'description',sourceUrl:'source_url'};
function publicFacts(row:Record<string,unknown>) {return {id:row.id,slug:row.slug,...Object.fromEntries(Object.entries(fieldColumns).map(([field,column])=>[field,row[column]]))};}
export async function listDrafts(env:ImportEnv) {
  return (await env.DB.prepare("SELECT d.id,d.revision,d.state,d.created_at,s.namespace,s.reference,json_extract(d.payload,'$.name') AS name FROM listing_drafts d JOIN import_sources s ON s.current_draft=d.id ORDER BY d.created_at DESC LIMIT 100").all()).results;
}
function currentGuard(env:ImportEnv,id:string,guard:string,checkLive=false) {
  return env.DB.prepare(`INSERT INTO import_guards (id,valid) SELECT ?,CASE WHEN EXISTS (SELECT 1 FROM listing_drafts d JOIN import_sources s ON s.current_draft=d.id LEFT JOIN listings l ON l.id=s.listing_id WHERE d.id=? AND d.state='pending' ${checkLive?'AND (s.listing_id IS NULL OR l.publication_version=d.base_version)':''}) THEN 1 ELSE 0 END`).bind(guard,id);
}
export async function publishDraft(env:ImportEnv,actor:Actor,id:string) {
  const draft=await getDraft(env,id);
  if(!draft.current || draft.state!=='pending')throw new ApiError(409,'Draft is no longer pending/current');
  if(draft.blockers.length)throw new ApiError(422,'Complete the publication requirements',draft.blockers);
  const p=draft.payload as DraftPayload;
  const guard=crypto.randomUUID();
  const existing=draft.listing_id ? await env.DB.prepare('SELECT slug FROM listings WHERE id=?').bind(draft.listing_id).first<{slug:string}>() : null;
  const slug=existing?.slug ?? `${p.name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'').slice(0,65)||'residence'}-${String(draft.source_id).slice(0,8)}`;
  const values=[p.name,p.district!,p.rent!,p.bedrooms!,p.bathrooms!,p.sizeSqm!,p.floor??'—',p.stationType!,p.stationName!,p.walkMinutes!,p.latitude!,p.longitude!,`/listing-media/${p.coverId}`,p.status!,p.sourceUrl??'',p.lastVerified!,p.description??''];
  const statements=[currentGuard(env,id,guard,true)];
  if(existing)statements.push(env.DB.prepare('UPDATE listings SET name=?,district=?,rent=?,bedrooms=?,bathrooms=?,size_sqm=?,floor=?,station_type=?,station_name=?,walk_minutes=?,latitude=?,longitude=?,image=?,status=?,source_url=?,last_verified=?,description=?,publication_version=publication_version+1,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(...values,draft.listing_id));
  else {
    statements.push(env.DB.prepare('INSERT INTO listings (slug,name,district,rent,bedrooms,bathrooms,size_sqm,floor,station_type,station_name,walk_minutes,latitude,longitude,image,status,source_url,last_verified,description,publication_version) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)').bind(slug,...values));
    statements.push(env.DB.prepare('UPDATE import_sources SET listing_id=(SELECT id FROM listings WHERE slug=?) WHERE id=?').bind(slug,draft.source_id));
  }
  statements.push(env.DB.prepare('DELETE FROM listing_media WHERE listing_id=(SELECT listing_id FROM import_sources WHERE id=?)').bind(draft.source_id));
  for(const [position,m] of (p.media??[]).entries())statements.push(env.DB.prepare('INSERT INTO listing_media (id,listing_id,media_id,position,caption,attribution,cover) SELECT ?,listing_id,?,?,?,?,? FROM import_sources WHERE id=?').bind(crypto.randomUUID(),m.id,position,m.caption??'',m.attribution,m.id===p.coverId?1:0,draft.source_id));
  statements.push(env.DB.prepare("UPDATE listing_drafts SET state='published' WHERE id=?").bind(id),audit(env,actor,'draft.published',id),env.DB.prepare('DELETE FROM import_guards WHERE id=?').bind(guard));
  try {await env.DB.batch(statements);}catch(error){if(String(error).includes('import_guard_valid'))throw new ApiError(409,'Listing changed since this review; reload and create a fresh revision');throw error;}
  return {slug,url:`/residences/${slug}`};
}
export async function rejectDraft(env:ImportEnv,actor:Actor,id:string) {
  const guard=crypto.randomUUID();
  try {await env.DB.batch([currentGuard(env,id,guard),env.DB.prepare("UPDATE listing_drafts SET state='rejected' WHERE id=?").bind(id),audit(env,actor,'draft.rejected',id),env.DB.prepare('DELETE FROM import_guards WHERE id=?').bind(guard)]);}
  catch(error){if(String(error).includes('import_guard_valid'))throw new ApiError(409,'Draft is no longer current');throw error;}
  return {ok:true};
}
export async function editDraft(env:ImportEnv,actor:Actor,id:string,body:Record<string,unknown>) {
  const draft=await getDraft(env,id);const validation=validatePayload(body);
  if(!validation.payload)throw new ApiError(400,'Invalid listing fields',validation.errors);
  if(validation.payload.reference!==draft.reference)throw new ApiError(400,'Unit reference cannot change');
  const guard=crypto.randomUUID(),newId=crypto.randomUUID(),p=validation.payload;
  try {await env.DB.batch([
    currentGuard(env,id,guard),
    env.DB.prepare("UPDATE listing_drafts SET state='superseded' WHERE id=?").bind(id),
    env.DB.prepare("INSERT INTO listing_drafts (id,source_id,revision,payload,payload_hash,base_version,state,actor,created_at) VALUES (?,?,?,?,?,(SELECT publication_version FROM listings WHERE id=?),'pending',?,?)").bind(newId,draft.source_id,Number(draft.revision)+1,canonical(p),await hash(canonical(p)),draft.listing_id,actor.id,Date.now()),
    env.DB.prepare('UPDATE import_sources SET current_draft=?,generation=generation+1 WHERE id=?').bind(newId,draft.source_id),audit(env,actor,'draft.edited',newId),env.DB.prepare('DELETE FROM import_guards WHERE id=?').bind(guard)
  ]);}catch(error){if(String(error).includes('import_guard_valid'))throw new ApiError(409,'Draft changed; reload before editing');throw error;}
  return getDraft(env,newId);
}
