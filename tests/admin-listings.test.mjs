import test from 'node:test';
import assert from 'node:assert/strict';
import {appHarness} from './app-harness.mjs';

const admin={'oai-authenticated-user-id':'test-admin','oai-authenticated-user-email':'admin@example.test'};
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=','base64');
const mp4=Buffer.concat([Buffer.from([0,0,0,24]),Buffer.from('ftypmp42'),Buffer.alloc(12)]);
// Form values arrive as strings; a studio has 0 bedrooms.
const facts={name:'Test Tower · Studio',district:'Ari',rent:'21000',bedrooms:'0',bathrooms:'1',sizeSqm:'30',floor:'12',stationType:'BTS',stationName:'Ari',walkMinutes:'5',latitude:'13.78',longitude:'100.54',lastVerified:'2026-09-01',status:'available',description:'Test listing'};

async function site() {
  const h=await appHarness();
  const call=(path,{method='GET',headers={},json,body}={})=>fetch(h.url+path,{method,headers:{...headers,...(json?{'content-type':'application/json'}:{})},body:json?JSON.stringify(json):body});
  const write=(path,method,json)=>call(path,{method,headers:{...admin,origin:h.url},json});
  const upload=async (bytes,type,name)=>{const response=await call('/api/listing-media',{method:'POST',headers:{...admin,origin:h.url,'content-type':type,'x-file-name':name},body:bytes});assert.equal(response.status,201,await response.clone().text());return (await response.json()).item.id;};
  const listings=async ()=>(await (await call('/api/listings?admin=1',{headers:admin})).json()).listings;
  const page=async slug=>(await call(`/residences/${slug}`)).text();
  const figures=html=>[...html.matchAll(/<figure class="gallery-item">([\s\S]*?)<\/figure>/g)].map(m=>/\/listing-media\/([a-f0-9-]+)/.exec(m[1])?.[1]??m[1]);
  return {...h,call,write,upload,listings,page,figures};
}

test('admin adds a listing with photos and a YouTube link, and its page shows every one',async t=>{
  const h=await site();t.after(h.close);
  const kitchen=await h.upload(png,'image/png','kitchen.png'),living=await h.upload(Buffer.concat([png,Buffer.from('living')]),'image/png','living.png');
  const response=await h.write('/api/listings','POST',{...facts,videoUrl:'https://youtu.be/dQw4w9WgXcQ?si=tracking',media:[{id:kitchen,caption:'Kitchen'},{id:living}]});
  assert.equal(response.status,201,await response.clone().text());
  const {slug,url}=await response.json();
  const listing=(await h.listings()).find(entry=>entry.slug===slug);
  assert.deepEqual(listing.media,{photos:2,cover:true,video:'youtube'});
  assert.equal(listing.videoUrl,'https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  assert.equal(listing.image,`/listing-media/${kitchen}`,'the first photo becomes the cover');
  assert.equal(listing.bedrooms,0);
  const html=await h.page(slug);
  assert.deepEqual(h.figures(html),[kitchen,living]);
  assert.match(html,/Kitchen · Owner-supplied/);
  assert.match(html,/<iframe class="residence-film-embed" src="https:\/\/www\.youtube-nocookie\.com\/embed\/dQw4w9WgXcQ\?rel=0"/);
  assert.match(html,/Open on YouTube ↗/);
  assert.equal(url,`/residences/${slug}`);
  const again=await (await h.write('/api/listings','POST',facts)).json();
  assert.equal(again.slug,`${slug}-2`,'a repeated name gets its own address');
});

test('admin edits a listing: reorders photos, picks the cover and swaps the link for an uploaded video',async t=>{
  const h=await site();t.after(h.close);
  const a=await h.upload(png,'image/png','a.png'),b=await h.upload(Buffer.concat([png,Buffer.from('b')]),'image/png','b.png'),tour=await h.upload(mp4,'video/mp4','tour.mp4');
  const {id,slug}=await (await h.write('/api/listings','POST',{...facts,videoUrl:'https://www.youtube.com/watch?v=dQw4w9WgXcQ',media:[{id:a},{id:b}]})).json();
  const detail=await (await h.call(`/api/listings/${id}`,{headers:admin})).json();
  assert.deepEqual(detail.media.map(item=>item.id),[a,b]);
  const saved=await h.write(`/api/listings/${id}`,'PUT',{...facts,rent:'24000',image:`/listing-media/${b}`,videoUrl:'',media:[{id:b,caption:'Bedroom',attribution:'admin'},{id:a},{id:tour,caption:'Walkthrough',attribution:'owner'}]});
  assert.equal(saved.status,200,await saved.clone().text());
  assert.equal((await saved.json()).slug,slug,'editing keeps the address');
  const listing=(await h.listings()).find(entry=>entry.id===id);
  assert.deepEqual(listing.media,{photos:2,cover:true,video:'upload'});
  const html=await h.page(slug);
  assert.deepEqual(h.figures(html),[b,a]);
  assert.match(html,/฿24,000/);
  assert.match(html,/REMARCABLE LIVING photography/,'the chosen cover sets the hero credit');
  assert.match(html,new RegExp(`<source src="/listing-media/${tour}" type="video/mp4"`));
  assert.doesNotMatch(html,/youtube-nocookie/);
  assert.equal((await h.call(`/listing-media/${tour}`,{headers:{range:'bytes=0-3'}})).status,206);
  const cleared=await h.write(`/api/listings/${id}`,'PUT',{...facts,media:[]});
  assert.equal(cleared.status,200);
  assert.deepEqual((await h.listings()).find(entry=>entry.id===id).media,{photos:0,cover:false,video:null});
  assert.equal((await h.call(`/listing-media/${a}`)).status,404,'detached files are private again');
});

test('media-library files attach once, and a seeded listing keeps its cover while showing new photos',async t=>{
  const h=await site();t.after(h.close);
  const library=await (await h.call('/api/media',{method:'POST',headers:{...admin,origin:h.url,'content-type':'image/png','x-file-name':'balcony.png'},body:png})).json();
  const attach=()=>h.write('/api/listing-media','POST',{libraryKey:library.item.key});
  const first=await attach(),second=await attach();
  assert.equal(first.status,201,await first.clone().text());
  const {item}=await first.json();
  assert.equal((await second.json()).item.id,item.id);
  assert.equal(item.name,'balcony.png');
  const centurion=(await h.listings()).find(entry=>entry.slug==='centurion-park-ari-soi-5-1br');
  assert.deepEqual(centurion.media,{photos:0,cover:true,video:null});
  const {listing}=await (await h.call(`/api/listings/${centurion.id}`,{headers:admin})).json();
  const saved=await h.write(`/api/listings/${centurion.id}`,'PUT',{...listing,media:[{id:item.id,caption:'Balcony'}]});
  assert.equal(saved.status,200,await saved.clone().text());
  const html=await h.page('centurion-park-ari-soi-5-1br');
  assert.deepEqual(h.figures(html),[item.id]);
  assert.match(html,/\/properties\/centurion-park-ari\.jpg/,'the existing cover stays');
  assert.equal((await h.listings()).find(entry=>entry.id===centurion.id).media.photos,1);
});

test('the listing API refuses bad links, covers and files, and anyone but a same-origin admin',async t=>{
  const h=await site();t.after(h.close);
  const photo=await h.upload(png,'image/png','photo.png');
  const problems=async (response,status=400)=>{assert.equal(response.status,status,await response.clone().text());return (await response.json()).details?.join(' | ')??'';};
  assert.match(await problems(await h.write('/api/listings','POST',{...facts,videoUrl:'https://vimeo.com/76979871'})),/Video link not recognised/);
  assert.match(await problems(await h.write('/api/listings','POST',{name:'Only a name'})),/Complete the required fields: District, Rent/);
  assert.match(await problems(await h.write('/api/listings','POST',{...facts,image:'/listing-media/not-attached',media:[{id:photo}]})),/cover must be one of this listing's photos/);
  assert.match(await problems(await h.write('/api/listings','POST',{...facts,media:[{id:'missing'}]})),/no longer available/);
  assert.match(await problems(await h.write('/api/listings','POST',{...facts,lastVerified:'2026-02-31'})),/real YYYY-MM-DD date/);
  assert.equal((await h.write('/api/listings/999999','PUT',facts)).status,404);
  assert.equal((await h.call('/api/listings',{method:'POST',json:facts})).status,401);
  assert.equal((await h.call('/api/listings',{method:'POST',headers:{...admin,origin:'https://evil.example'},json:facts})).status,403);
  assert.equal((await h.call('/api/listings?admin=1',{headers:{...admin,'oai-authenticated-user-email':'visitor@example.test'}})).status,401);
  assert.equal((await h.call('/api/listing-media',{method:'POST',headers:{...admin,origin:h.url,'content-type':'audio/wav','x-file-name':'tour.wav'},body:Buffer.from('RIFF....WAVE')})).status,415);
  assert.equal((await h.call('/api/listing-media',{method:'POST',headers:{...admin,origin:h.url,'content-type':'image/png','x-file-name':'fake.png'},body:Buffer.from('not a png')})).status,415);
  assert.equal((await h.write('/api/listing-media','POST',{libraryKey:'../secrets'})).status,400);
});

test('agent imports accept a Google Drive video link and publish it to the live listing',async t=>{
  const h=await site();t.after(h.close);
  const {token}=await (await h.write('/api/admin/imports/credentials','POST',{name:'video test',expiresInDays:1})).json();
  const agent={authorization:`Bearer ${token}`};
  const cover=await (await (await h.call('/api/v1/media',{method:'POST',headers:{...agent,'content-type':'image/png','x-file-name':'cover.png'},body:png})).json()).id;
  const unit={reference:'drive-unit',name:'Drive residence',district:'Ari',rent:20000,bedrooms:1,bathrooms:1,sizeSqm:35,stationType:'BTS',stationName:'Ari',walkMinutes:5,latitude:13.78,longitude:100.54,lastVerified:'2026-09-01',status:'available',media:[{id:cover,attribution:'owner'}],coverId:cover};
  const submit=async (key,listing)=>(await (await h.call('/api/v1/imports',{method:'POST',headers:{...agent,'idempotency-key':key},json:{namespace:'drive',listings:[listing]}})).json()).results[0];
  const rejected=await submit('bad',{...unit,videoUrl:'https://example.com/tour.mp4'});
  assert.equal(rejected.outcome,'invalid');
  assert.match(rejected.errors.join(' '),/videoUrl not recognised/);
  const {draftId}=await submit('good',{...unit,videoUrl:'https://drive.google.com/open?id=1AbCdEfGhIjKlMnOp'});
  const draft=await (await h.call(`/api/v1/drafts/${draftId}`,{headers:agent})).json();
  assert.equal(draft.payload.videoUrl,'https://drive.google.com/file/d/1AbCdEfGhIjKlMnOp/view');
  const published=await h.write(`/api/admin/imports/drafts/${draftId}/publish`,'POST',{});
  assert.equal(published.status,200,await published.clone().text());
  const {url}=await published.json();
  assert.match(await (await h.call(url)).text(),/<iframe class="residence-film-embed" src="https:\/\/drive\.google\.com\/file\/d\/1AbCdEfGhIjKlMnOp\/preview"/);
  assert.deepEqual((await h.listings()).find(entry=>url.endsWith(entry.slug)).media,{photos:1,cover:true,video:'drive'});
  const schema=await (await h.call('/api/v1/listing-schema',{headers:agent})).json();
  assert.match(schema.fields.videoUrl,/YouTube or Google Drive/);
});
