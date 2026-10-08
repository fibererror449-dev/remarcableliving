import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {appHarness} from './app-harness.mjs';

// Choosing an area in the neighbourhood rail filters the residences beside (or, on phones, below) it
// and leaves their heading on screen, so the matching homes are easy to spot.
test('a neighbourhood filters the residences and keeps them in view',async t=>{
  const h=await appHarness();t.after(h.close);
  const browser=await chromium.launch({headless:true});t.after(()=>browser.close());
  for (const [width,height] of [[1440,900],[390,844]]) {
    const page=await browser.newPage({viewport:{width,height}});
    await page.goto(h.url+'/neighbourhoods',{waitUntil:'networkidle'});
    const cards=page.locator('.area-listings .property-card');
    const districts=()=>page.$$eval('.area-listings .property-info > p.meta',els=>els.map(el=>el.textContent.split(' · ')[0]));
    const total=await cards.count();
    const ari=page.locator('.neighbourhood-rail').getByRole('button',{name:/Ari/});
    const expected=Number((await ari.locator('b').textContent()).match(/\d+/)[0]);
    assert.ok(expected>0&&expected<total,`${width}px: sample data has Ari and other areas`);

    await ari.click();
    assert.equal(await ari.getAttribute('aria-pressed'),'true');
    assert.deepEqual(await districts(),Array(expected).fill('Ari'),`${width}px: only Ari residences remain`);
    const top=await page.locator('.area-listings-head').evaluate(el=>el.getBoundingClientRect().top);
    const nav=await page.evaluate(()=>parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--nav-height')));
    assert.ok(top>=nav-1&&top<=height*.6,`${width}px: residences heading on screen (top ${top})`);

    await page.getByRole('button',{name:`Show all ${total} →`}).click();
    assert.equal(await ari.getAttribute('aria-pressed'),'false');
    assert.equal(await cards.count(),total,`${width}px: Show all restores every residence`);
    await page.close();
  }
});

test('university and project filters combine with neighbourhoods, survive reload and carry into residences',async t=>{
  const h=await appHarness();t.after(h.close);
  const admin={'oai-authenticated-user-id':'test-admin','oai-authenticated-user-email':'admin@example.test'};
  const listings=(await (await fetch(h.url+'/api/listings?admin=1',{headers:admin})).json()).listings;
  const tagged=[
    ['centurion-park-ari-soi-5-1br','Test University A','RHYTHM EKKAMAI ESTATE'],
    ['centric-ari-station-1br','Test University A','AP Thai The Bangkok'],
    ['supalai-veranda-rama9-1br','Test University B','RHYTHM EKKAMAI ESTATE'],
  ];
  for(const [slug,university,developmentProject] of tagged){
    const listing=listings.find(entry=>entry.slug===slug);
    assert.ok(listing);
    const response=await fetch(`${h.url}/api/listings/${listing.id}`,{method:'PUT',headers:{...admin,origin:h.url,'content-type':'application/json'},body:JSON.stringify({...listing,university,developmentProject,media:[]})});
    assert.equal(response.status,200,await response.clone().text());
  }
  const browser=await chromium.launch({headless:true});t.after(()=>browser.close());
  for(const [width,height] of [[1440,900],[390,844]]){
    const page=await browser.newPage({viewport:{width,height}});
    await page.goto(h.url+'/neighbourhoods',{waitUntil:'networkidle'});
    const names=()=>page.locator('.area-listings .property-info h3').allTextContents();
    const university=page.getByLabel('University',{exact:true});
    const project=page.getByLabel('Development project',{exact:true});
    await university.selectOption('Test University A');
    assert.equal((await names()).length,2);
    await project.selectOption('RHYTHM EKKAMAI ESTATE');
    assert.deepEqual(await names(),['Centurion Park · 1 Bedroom']);
    assert.equal(new URL(page.url()).searchParams.get('university'),'Test University A');
    assert.equal(new URL(page.url()).searchParams.get('project'),'RHYTHM EKKAMAI ESTATE');
    await page.reload({waitUntil:'networkidle'});
    assert.equal(await university.inputValue(),'Test University A');
    assert.equal(await project.inputValue(),'RHYTHM EKKAMAI ESTATE');
    assert.deepEqual(await names(),['Centurion Park · 1 Bedroom']);
    await page.locator('.neighbourhood-rail').getByRole('button',{name:/Rama 9/}).click();
    await page.getByRole('heading',{name:'No residences match these filters yet.'}).waitFor();
    assert.equal((await names()).length,0);
    await page.getByRole('button',{name:'Clear filters',exact:true}).first().click();
    assert.equal(await university.inputValue(),'');
    assert.equal(await project.inputValue(),'');
    assert.equal((await names()).length,listings.length);
    assert.equal(new URL(page.url()).search,'');
    await university.selectOption('Test University A');
    await project.selectOption('AP Thai The Bangkok');
    await page.getByRole('link',{name:'Open with filters →'}).click();
    await page.waitForURL('**/residences?**');
    assert.deepEqual(await page.locator('.collection .property-info h3').allTextContents(),['Centric Ari Station · 1 Bedroom']);
    assert.equal(await university.inputValue(),'Test University A');
    assert.equal(await project.inputValue(),'AP Thai The Bangkok');
    await page.getByLabel('Monthly budget').selectOption('Under ฿20,000');
    await page.reload({waitUntil:'networkidle'});
    assert.deepEqual(await page.locator('.collection .property-info h3').allTextContents(),['Centric Ari Station · 1 Bedroom']);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}px: no horizontal overflow`);
    await page.close();
  }
});
