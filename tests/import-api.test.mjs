import assert from 'node:assert/strict';
import test from 'node:test';
import { harness, adminHeaders } from './import-harness.mjs';

test('an admin-issued credential creates a private retrievable incomplete draft', async t => {
  const h = await harness(); t.after(h.close);
  const {token} = await h.issue();
  const response = await h.request('/api/v1/imports',{method:'POST',token,headers:{'idempotency-key':'first'},json:{namespace:'drive',listings:[{reference:'unit-1',name:'First residence'}]}});
  assert.equal(response.status,201);
  const job = await response.json();
  assert.equal(job.results[0].outcome,'created');
  const draft = await (await h.request(`/api/v1/drafts/${job.results[0].draftId}`,{token})).json();
  assert.equal(draft.payload.name,'First residence');
  assert.ok(draft.blockers.includes('rent'));
  assert.equal((await h.request(`/api/v1/drafts/${draft.id}`)).status,401);
});

test('validation rejects malformed facts per row without discarding valid incomplete rows', async t=>{
  const h=await harness(); t.after(h.close); const {token}=await h.issue();
  const payload={namespace:'drive',listings:[{reference:'bad',name:'Bad facts',rent:'10000',latitude:999},{reference:'good',name:'Known facts',bedrooms:0}]};
  const preview=await h.request('/api/v1/imports/validate',{method:'POST',token,json:payload});
  assert.equal(preview.status,200);
  const validation=await preview.json();
  assert.equal(validation.results[0].outcome,'invalid');
  assert.equal(validation.results[1].outcome,'valid');
  const saved=await (await h.request('/api/v1/imports',{method:'POST',token,headers:{'idempotency-key':'mixed'},json:payload})).json();
  assert.equal(saved.results[0].outcome,'invalid');
  const draft=await (await h.request(`/api/v1/drafts/${saved.results[1].draftId}`,{token})).json();
  assert.equal(draft.payload.bedrooms,0);
  assert.equal(draft.payload.rent,undefined);
});

test('only an admin can issue credentials and revocation immediately blocks an agent', async t=>{
  const h=await harness(); t.after(h.close);
  assert.equal((await h.request('/api/admin/imports/credentials',{method:'POST',json:{name:'no'}})).status,401);
  const credential=await h.issue();
  const revoked=await h.request(`/api/admin/imports/credentials/${credential.id}`,{method:'DELETE',headers:adminHeaders});
  assert.equal(revoked.status,200);
  assert.equal((await h.request('/api/v1/listing-schema',{token:credential.token})).status,401);
});

test('concurrent retries return one job and changed source facts create one new revision', async t=>{
  const h=await harness();t.after(h.close);const {token}=await h.issue();
  const submit=(key,name)=>h.request('/api/v1/imports',{method:'POST',token,headers:{'idempotency-key':key},json:{namespace:'drive',listings:[{reference:'same-unit',name}]}});
  const responses=await Promise.all([submit('retry','Original'),submit('retry','Original')]);
  assert.deepEqual(responses.map(r=>r.status),[201,201]);
  const [a,b]=await Promise.all(responses.map(r=>r.json()));assert.deepEqual(a,b);
  assert.equal((await submit('retry','Different')).status,409);
  const unchanged=await (await submit('next','Original')).json();assert.equal(unchanged.results[0].outcome,'unchanged');
  const changed=await (await submit('changed','Updated')).json();assert.equal(changed.results[0].outcome,'updated');
  const old=await (await h.request(`/api/v1/drafts/${a.results[0].draftId}`,{token})).json();assert.equal(old.state,'superseded');
  const next=await (await h.request(`/api/v1/drafts/${changed.results[0].draftId}`,{token})).json();assert.equal(next.revision,2);
  assert.deepEqual(await (await h.request(`/api/v1/imports/${a.id}`,{token})).json(),a);
});

test('uploaded photo bytes are private, retrievable by agents, and deduplicated on retry', async t=>{
  const h=await harness();t.after(h.close);const {token}=await h.issue();
  const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=','base64');
  const upload=()=>h.request('/api/v1/media',{method:'POST',token,headers:{'content-type':'image/png','content-length':String(bytes.length),'x-file-name':'room.png'},body:bytes});
  const response=await upload(); assert.equal(response.status,201);
  const media=await response.json();assert.equal((await (await upload()).json()).id,media.id);
  assert.equal((await h.request(`/listing-media/${media.id}`)).status,404);
  const retrieved=await h.request(`/api/v1/media/${media.id}`,{token});assert.deepEqual(Buffer.from(await retrieved.arrayBuffer()),bytes);
  const range=await h.request(`/api/v1/media/${media.id}`,{token,headers:{range:'bytes=0-7'}});assert.equal(range.status,206);assert.deepEqual(Buffer.from(await range.arrayBuffer()),bytes.subarray(0,8));
  const bad=await h.request('/api/v1/media',{method:'POST',token,headers:{'content-type':'image/png','content-length':'4'},body:'fake'});assert.equal(bad.status,415);
});

test('only an admin publishes a complete current revision and pending updates preserve live facts',async t=>{
  const h=await harness();t.after(h.close);const {token}=await h.issue();
  const bytes=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=','base64');
  const media=await (await h.request('/api/v1/media',{method:'POST',token,headers:{'content-type':'image/png','content-length':String(bytes.length)},body:bytes})).json();
  const payload={reference:'publish-unit',name:'Reviewed home',district:'Ari',rent:20000,bedrooms:1,bathrooms:1,sizeSqm:35,stationType:'BTS',stationName:'Ari',walkMinutes:5,latitude:13.78,longitude:100.54,lastVerified:'2026-01-01',status:'available',media:[{id:media.id,caption:'Living room',attribution:'agent'}],coverId:media.id,provenance:'Private source notes'};
  const submit=async (key,p)=> (await (await h.request('/api/v1/imports',{method:'POST',token,headers:{'idempotency-key':key},json:{namespace:'drive',listings:[p]}})).json()).results[0].draftId;
  const id=await submit('publish',payload);
  assert.equal((await h.request(`/api/admin/imports/drafts/${id}/publish`,{method:'POST',token,json:{}})).status,401);
  const published=await h.request(`/api/admin/imports/drafts/${id}/publish`,{method:'POST',headers:adminHeaders,json:{}});
  assert.equal(published.status,200);
  const live=await published.json(); assert.ok(live.slug);
  assert.equal((await h.request(`/listing-media/${media.id}`)).status,200);
  const nextId=await submit('update',{...payload,rent:25000});
  const review=await (await h.request(`/api/admin/imports/drafts/${nextId}`,{headers:adminHeaders})).json();
  assert.equal(review.published.rent,20000);assert.equal(review.payload.rent,25000);
  const newest=await submit('newest',{...payload,rent:27000});
  assert.equal((await h.request(`/api/admin/imports/drafts/${nextId}/publish`,{method:'POST',headers:adminHeaders,json:{}})).status,409);
  assert.equal((await h.request(`/api/admin/imports/drafts/${newest}/publish`,{method:'POST',headers:adminHeaders,json:{}})).status,200);
});
