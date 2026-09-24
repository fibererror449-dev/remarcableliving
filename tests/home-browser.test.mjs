import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {appHarness} from './app-harness.mjs';

// A smooth scroll to or from the listings would fast-forward (or rewind) every scroll-driven hero scene.
async function homepage(t) {
  const h=await appHarness();t.after(h.close);
  const browser=await chromium.launch({headless:true});t.after(()=>browser.close());
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const positions=async act=>{
    await page.evaluate(()=>{window.__samples=[];const start=performance.now();const tick=()=>{window.__samples.push(Math.round(scrollY));if(performance.now()-start<1000)requestAnimationFrame(tick);};requestAnimationFrame(tick);});
    await act();
    await page.waitForTimeout(1100);
    return [...new Set(await page.evaluate(()=>window.__samples))];
  };
  const top=selector=>page.evaluate(s=>Math.round(document.querySelector(s).getBoundingClientRect().top),selector);
  return {h,page,positions,top};
}

test('homepage links, Back and Forward jump straight between the hero and the listings',async t=>{
  const {h,page,positions,top}=await homepage(t);
  await page.goto(h.url+'/');
  await page.evaluate(()=>scrollTo({top:3000,behavior:'instant'}));
  const nav=()=>page.getByRole('navigation',{name:'Primary navigation'}).getByRole('link',{name:'Condo/Apartment'}).click();
  const steps=[
    ['Condo/Apartment',nav,'#residences'],
    ['Back',()=>page.goBack(),null],
    ['Forward',()=>page.goForward(),'#residences'],
    ['Skip to search',()=>page.evaluate(()=>document.querySelector('a[href="#search"]').click()),'#search'],
    ['Back to the listings',()=>page.goBack(),'#residences'],
  ];
  for (const [label,act,target] of steps) {
    const seen=await positions(act);
    assert.equal(seen.length,2,`${label} passed through ${seen.join(', ')}`);
    // The search bar stops just below the pinned site nav; the listings start behind its top padding.
    const offset=target==='#search'?await page.evaluate(()=>document.querySelector('.home-nav .site-nav').offsetHeight):0;
    if (target) assert.equal(await top(target),offset,`${label} did not land on ${target}`);
    else assert.equal(seen[1],3000,'Back returns to where the visitor was in the hero');
  }
});

test('a shared /#residences link opens on the listings, and Back from a listing returns to the same spot directly',async t=>{
  const {h,page,top}=await homepage(t);
  // Back reloads the homepage, so record every scroll position from the first script onwards.
  await page.addInitScript(()=>{window.__arrival=[];addEventListener('scroll',()=>window.__arrival.push(Math.round(scrollY)),{passive:true});});
  await page.goto(h.url+'/#residences');
  // The browser's own anchor scroll lands inside the hero; the page corrects it once hydrated.
  await page.waitForFunction(()=>Math.round(document.getElementById('residences').getBoundingClientRect().top)===0,null,{timeout:5000});
  // Browse a little further down the listings before opening one.
  await page.evaluate(()=>scrollBy({top:300,behavior:'instant'}));
  await page.evaluate(()=>document.querySelector('#residences a[href^="/residences/"]').click());
  await page.waitForURL(/\/residences\/.+/);
  await page.goBack();
  await page.waitForURL(/#residences$/);
  await page.waitForTimeout(1500);
  assert.equal(await top('#residences'),-300);
  const arrival=[...new Set(await page.evaluate(()=>window.__arrival))];
  assert.ok(arrival.length<=1,`Back scrolled through ${arrival.join(', ')}`);
});
