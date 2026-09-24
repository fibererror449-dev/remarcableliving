import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {appHarness} from './app-harness.mjs';

// A smooth scroll to the listings would fast-forward every scroll-driven hero scene on the way.
test('homepage links jump straight to the listings without replaying the hero',async t=>{
  const h=await appHarness();t.after(h.close);
  const browser=await chromium.launch({headless:true});t.after(()=>browser.close());
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.goto(h.url+'/');
  const positions=async click=>{
    await page.evaluate(()=>{window.scrollTo({top:0,behavior:'instant'});window.__samples=[];const start=performance.now();const tick=()=>{window.__samples.push(Math.round(scrollY));if(performance.now()-start<1000)requestAnimationFrame(tick);};requestAnimationFrame(tick);});
    await click();
    await page.waitForTimeout(1100);
    return [...new Set(await page.evaluate(()=>window.__samples))];
  };
  for (const [label,click] of [['Condo/Apartment',()=>page.getByRole('navigation',{name:'Primary navigation'}).getByRole('link',{name:'Condo/Apartment'}).click()],['Skip to search',()=>page.getByRole('link',{name:'Skip to search'}).click()]]) {
    const seen=await positions(click);
    assert.equal(seen.length,2,`${label} passed through ${seen.join(', ')}`);
    assert.ok(seen[1]>0,`${label} did not move`);
    const target=await page.locator(label==='Skip to search'?'#search':'#residences').boundingBox();
    assert.ok(target && target.y>=-1 && target.y<900,`${label} left its target off screen (top ${target?.y})`);
  }
});
