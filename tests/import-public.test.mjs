import test from 'node:test';
import assert from 'node:assert/strict';
import {appHarness} from './app-harness.mjs';

const admin={'oai-authenticated-user-id':'test-admin','oai-authenticated-user-email':'admin@example.test'};
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=','base64');
const mp4=Buffer.concat([Buffer.from([0,0,0,24]),Buffer.from('ftypmp42'),Buffer.alloc(12)]);
const facts={district:'Ari',rent:20000,bedrooms:1,bathrooms:1,sizeSqm:35,stationType:'BTS',stationName:'Ari',walkMinutes:5,latitude:13.78,longitude:100.54,lastVerified:'2026-09-01',status:'available'};

async function site() {
  const h=await appHarness();
  const call=(path,{method='GET',headers={},json,body}={})=>fetch(h.url+path,{method,headers:{...headers,...(json?{'content-type':'application/json'}:{})},body:json?JSON.stringify(json):body});
  const {token}=await (await call('/api/admin/imports/credentials',{method:'POST',headers:{...admin,origin:h.url},json:{name:'public test',expiresInDays:1}})).json();
  const agent={authorization:`Bearer ${token}`};
  const upload=async (bytes,type,name)=>(await (await call('/api/v1/media',{method:'POST',headers:{...agent,'content-type':type,'x-file-name':name},body:bytes})).json()).id;
  const submit=async (key,listing)=>(await (await call('/api/v1/imports',{method:'POST',headers:{...agent,'idempotency-key':key},json:{namespace:'drive',listings:[listing]}})).json()).results[0].draftId;
  const publish=async id=>{const response=await call(`/api/admin/imports/drafts/${id}/publish`,{method:'POST',headers:{...admin,origin:h.url},json:{}});assert.equal(response.status,200,await response.clone().text());return response.json();};
  return {...h,call,upload,submit,publish};
}

test('an approved import shows its ordered photos, captions and video publicly, and nothing private',async t=>{
  const h=await site();t.after(h.close);
  const living=await h.upload(png,'image/png','living.png'),kitchen=await h.upload(Buffer.concat([png,Buffer.from('kitchen')]),'image/png','kitchen.png');
  const tour=await h.upload(mp4,'video/mp4','tour.mp4'),unused=await h.upload(Buffer.concat([png,Buffer.from('unused')]),'image/png','unused.png');
  const id=await h.submit('gallery',{reference:'gallery-unit',name:'Gallery residence',...facts,provenance:'Owner phone 081 234 5678',
    media:[{id:kitchen,caption:'Kitchen',attribution:'agent'},{id:living,caption:'Living room',attribution:'owner'},{id:tour,caption:'Walkthrough',attribution:'owner'}],coverId:living});
  const {url}=await h.publish(id);
  const html=await (await h.call(url)).text();
  const figures=[...html.matchAll(/<figure class="gallery-item">([\s\S]*?)<\/figure>/g)].map(m=>m[1]);
  assert.equal(figures.length,2);
  assert.match(figures[0],new RegExp(`/listing-media/${kitchen}"[\\s\\S]*Kitchen`));
  assert.match(figures[1],new RegExp(`/listing-media/${living}"[\\s\\S]*Living room`));
  assert.match(html,new RegExp(`<source src="/listing-media/${tour}" type="video/mp4"`));
  assert.doesNotMatch(html,/081 234 5678/);
  const range=await h.call(`/listing-media/${tour}`,{headers:{range:'bytes=0-3'}});
  assert.equal(range.status,206);
  assert.equal((await h.call(`/listing-media/${unused}`)).status,404);
  assert.match(await (await h.call('/sitemap.xml')).text(),new RegExp(url.replace(/\//g,'\\/')));
});

test('a pending revision leaves the live page unchanged until it is published',async t=>{
  const h=await site();t.after(h.close);
  const cover=await h.upload(png,'image/png','cover.png');
  const listing={reference:'price-unit',name:'Price residence',...facts,media:[{id:cover,attribution:'owner'}],coverId:cover};
  const {url}=await h.publish(await h.submit('first',listing));
  const pending=await h.submit('second',{...listing,rent:25000});
  assert.match(await (await h.call(url)).text(),/฿20,000/);
  await h.publish(pending);
  const live=await (await h.call(url)).text();
  assert.match(live,/฿25,000/);
  assert.doesNotMatch(live,/฿20,000/);
});
