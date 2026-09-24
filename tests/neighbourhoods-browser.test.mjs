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
