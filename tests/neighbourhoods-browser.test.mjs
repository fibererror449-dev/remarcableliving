import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {appHarness} from './app-harness.mjs';

test('three ordered sections filter independently, retain selections and show only top cards',async t=>{
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
    assert.deepEqual(await page.locator('.discovery-section > header h2').allTextContents(),['Neighbourhoods','Development projects','Universities']);
    const areas=page.locator('#neighbourhoods');
    const projects=page.locator('#projects');
    const universities=page.locator('#universities');
    const names=section=>section.locator('.property-info h3').allTextContents();
    for(const section of [areas,projects,universities]){
      assert.ok(await section.locator('.property-card').count()<=3);
      assert.ok(await section.locator('.neighbourhood-card').count()<=3);
    }
    const areaPreview=await names(areas);
    await universities.getByLabel('University',{exact:true}).selectOption('Test University A');
    assert.equal((await names(universities)).length,2);
    assert.deepEqual(await names(areas),areaPreview);
    await projects.getByLabel('Development project',{exact:true}).selectOption('RHYTHM EKKAMAI ESTATE');
    assert.equal((await names(projects)).length,2);
    assert.equal((await names(universities)).length,2);
    await areas.getByLabel('Neighbourhood',{exact:true}).selectOption('Rama 9');
    assert.equal((await names(areas)).length,2);
    assert.equal((await names(projects)).length,2);
    assert.equal((await names(universities)).length,2);
    await page.reload({waitUntil:'networkidle'});
    assert.equal(await areas.getByLabel('Neighbourhood',{exact:true}).inputValue(),'Rama 9');
    assert.equal(await projects.getByLabel('Development project',{exact:true}).inputValue(),'RHYTHM EKKAMAI ESTATE');
    assert.equal(await universities.getByLabel('University',{exact:true}).inputValue(),'Test University A');
    await universities.getByLabel('University',{exact:true}).selectOption('Kasem Bundit University');
    await universities.getByRole('heading',{name:'No residences listed here yet.'}).waitFor();
    assert.equal((await names(areas)).length,2);
    assert.equal((await names(projects)).length,2);
    await universities.getByRole('button',{name:'Clear university',exact:true}).first().click();
    assert.equal((await names(universities)).length,3);
    assert.equal(await universities.getByRole('link',{name:/View all/}).count(),0);
    const ari=areas.locator('.neighbourhood-rail').getByRole('button',{name:/Ari/});
    await ari.click();
    assert.equal(await ari.getAttribute('aria-pressed'),'true');
    assert.ok((await names(areas)).every(name=>/Ari|Centurion/.test(name)));
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${width}px: no overflow`);
    await page.screenshot({path:`/private/tmp/discovery-sections-${width}.png`,fullPage:true});
    const link=projects.getByRole('link',{name:/View all/});
    const href=new URL(await link.getAttribute('href'),h.url);
    assert.equal(href.searchParams.get('project'),'RHYTHM EKKAMAI ESTATE');
    assert.equal(href.searchParams.has('area'),false);
    assert.equal(href.searchParams.has('university'),false);
    await link.click();
    await page.waitForURL('**/residences?**');
    assert.equal((await page.locator('.collection .property-info h3').allTextContents()).length,2);
    await page.close();
  }
});

test('an unassigned university shows a useful empty state without hiding other sections',async t=>{
  const h=await appHarness();t.after(h.close);
  const browser=await chromium.launch({headless:true});t.after(()=>browser.close());
  const page=await browser.newPage();
  await page.goto(h.url+'/neighbourhoods?university=Kasem+Bundit+University',{waitUntil:'networkidle'});
  assert.equal(await page.locator('#neighbourhoods .property-card').count(),3);
  assert.equal(await page.locator('#projects .property-card').count(),3);
  assert.equal(await page.locator('#universities .property-card').count(),0);
  await page.locator('#universities').getByRole('button',{name:'Clear university',exact:true}).first().click();
  await page.getByRole('heading',{name:'University shortlists are coming soon.'}).waitFor();
  assert.equal(await page.locator('#universities .neighbourhood-card').count(),0);
});
