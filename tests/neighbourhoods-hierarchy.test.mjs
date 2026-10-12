import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { appHarness } from './app-harness.mjs';

const admin = { 'oai-authenticated-user-id': 'test-admin', 'oai-authenticated-user-email': 'admin@example.test' };
const cards = html => (html.match(/<article class="property-card"/g) ?? []).length;

test('discovery objects retain identity and descriptions as listing relationships change', async t => {
  const h = await appHarness(); t.after(h.close);
  await fetch(h.url + '/api/listings'); // Seed representative inventory.
  const db = await h.mf.getD1Database('DB');
  const listing = await db.prepare("SELECT id FROM listings WHERE slug='centurion-park-ari-soi-5-1br'").first();
  await db.prepare("UPDATE listings SET university=' Test Campus ',development_project=' Test Project ' WHERE id=?").bind(listing.id).run();
  const parents = await db.prepare('SELECT p.* FROM discovery_places p JOIN listing_places r ON r.place_id=p.id WHERE r.listing_id=? ORDER BY p.kind').bind(listing.id).all();
  assert.deepEqual(parents.results.map(p => [p.kind,p.name]), [['area','Ari'],['project','Test Project'],['university','Test Campus']]);
  const project = parents.results.find(p => p.kind === 'project');
  const path = `/projects/test-project-${project.id}`;
  assert.equal((await fetch(h.url + path)).status,200);
  assert.equal((await fetch(h.url + '/projects/does-not-exist')).status,404);
  const legacy = await fetch(h.url + '/neighbourhoods?project=Test+Project', {redirect:'manual'});
  assert.equal(legacy.headers.get('location'), path);
  const patch = (headers,body) => fetch(h.url + `/api/discovery/${project.id}`, {method:'PATCH',headers:{origin:h.url,'content-type':'application/json',...headers},body:JSON.stringify(body)});
  assert.equal((await patch({}, {description:'Custom project description.'})).status,401);
  assert.equal((await patch({...admin,origin:'https://other.example'}, {description:'Custom project description.'})).status,403);
  assert.equal((await patch(admin, {description:123})).status,400);
  assert.equal((await patch(admin, {description:'Custom project description.'})).status,200);
  let html = await (await fetch(h.url+path)).text();
  assert.match(html,/Custom project description\./);
  assert.equal(cards(html),1);
  const detail = await (await fetch(h.url+'/residences/centurion-park-ari-soi-5-1br')).text();
  assert.match(detail,new RegExp(`href="${path}"`));
  await db.prepare("UPDATE listings SET development_project='test project',university='Other Campus' WHERE id=?").bind(listing.id).run();
  assert.equal((await db.prepare("SELECT COUNT(*) n FROM discovery_places WHERE kind='project' AND lower(name)='test project'").first()).n,1);
  assert.equal((await db.prepare("SELECT place_id FROM listing_places WHERE listing_id=? AND kind='project'").bind(listing.id).first()).place_id,project.id);
  await db.prepare("UPDATE listings SET deleted_at=CURRENT_TIMESTAMP WHERE id=?").bind(listing.id).run();
  assert.equal((await db.prepare('SELECT COUNT(*) n FROM listing_places WHERE listing_id=?').bind(listing.id).first()).n,0);
  html = await (await fetch(h.url+path)).text();
  assert.match(html,/Custom project description\./); assert.equal(cards(html),0);
  await db.prepare('UPDATE listings SET deleted_at=NULL WHERE id=?').bind(listing.id).run();
  assert.equal((await db.prepare('SELECT COUNT(*) n FROM listing_places WHERE listing_id=?').bind(listing.id).first()).n,3);
  for (const route of ['/neighbourhoods','/areas','/projects','/universities']) assert.equal((await fetch(h.url+route)).status,200);
});

test('residence name search and pagination compose with facets and tolerate invalid URLs', async t => {
  const h = await appHarness(); t.after(h.close);
  await fetch(h.url+'/api/listings');
  const db = await h.mf.getD1Database('DB');
  const columns = (await db.prepare('PRAGMA table_info(listings)').all()).results.map(row => row.name).filter(name => name !== 'id');
  const select = columns.map(name => ['slug','name'].includes(name) ? '?' : name).join(',');
  await db.batch(Array.from({length:53}, (_,index) => db.prepare(`INSERT INTO listings (${columns.join(',')}) SELECT ${select} FROM listings WHERE slug='centurion-park-ari-soi-5-1br'`).bind(`demo-${index}`,`Demo Residence ${index}`)));
  const page = async query => { const response = await fetch(h.url+'/residences?'+query); assert.equal(response.status,200); return response.text(); };
  assert.equal(cards(await page('q=demo')),10);
  assert.equal(cards(await page('q=DEMO&pageSize=25')),25);
  assert.equal(cards(await page('q=Demo&pageSize=50')),50);
  let html=await page('q=Demo&page=6'); assert.equal(cards(html),3); assert.match(html,/Showing <!-- -->51<!-- -->–<!-- -->53<!-- --> of <!-- -->53/);
  assert.equal(cards(await page('q=Demo&page=999')),3);
  for (const invalid of ['-1','Infinity','NaN','1.5']) assert.equal(cards(await page(`q=Demo&page=${invalid}&pageSize=99`)),10);
  assert.equal(cards(await page('q=Demo&area=Rama+9')),0);
  assert.equal(cards(await page('q=Demo&area=Ari&budget=25k-plus')),0);
  assert.equal(cards(await page('q=Demo&area=Ari&budget=20k-25k')),10);
});


test('existing inventory backfills relationships without replacing place descriptions', async t => {
  const h=await appHarness(); t.after(h.close);
  await fetch(h.url+'/api/listings');
  const db=await h.mf.getD1Database('DB');
  await db.prepare("UPDATE listings SET university='Legacy Campus',development_project='Legacy Project' WHERE slug='centurion-park-ari-soi-5-1br'").run();
  for (const sql of ['DROP TRIGGER listing_places_insert','DROP TRIGGER listing_places_update','DROP TABLE listing_places','DROP TABLE discovery_places']) await db.prepare(sql).run();
  for (const sql of (await readFile('drizzle/0010_fair_mathemanic.sql','utf8')).split('--> statement-breakpoint').map(x=>x.trim()).filter(Boolean)) await db.prepare(sql).run();
  assert.equal((await db.prepare('SELECT COUNT(*) n FROM listing_places').first()).n,0);
  assert.equal((await fetch(h.url+'/universities')).status,200);
  const parent=await db.prepare("SELECT id FROM discovery_places WHERE kind='university' AND name='Legacy Campus'").first();
  assert.ok(parent);
  await db.prepare('UPDATE discovery_places SET description=? WHERE id=?').bind('Keep this description',parent.id).run();
  await fetch(h.url+'/universities');
  assert.equal((await db.prepare('SELECT description FROM discovery_places WHERE id=?').bind(parent.id).first()).description,'Keep this description');
  assert.equal((await db.prepare("SELECT COUNT(*) n FROM listing_places WHERE place_id=?").bind(parent.id).first()).n,1);
});
