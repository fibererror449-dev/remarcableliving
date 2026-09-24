import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {appHarness} from './app-harness.mjs';

const pages=['/','/about','/contact','/inventory','/neighbourhoods','/residences','/residences/baan-klang-krung-siam-2br','/student-housing','/no-such-page'];
// Count logos in a header at the top of the viewport that a visitor can actually see.
const visibleNavs=page=>page.evaluate(()=>[...document.querySelectorAll('header .brand-logo')].filter(el=>{
  const box=el.getBoundingClientRect();
  if(box.top<-1||box.top>=120||!box.width) return false;
  for(let node=el;node;node=node.parentElement){const style=getComputedStyle(node);if(style.visibility==='hidden'||style.display==='none'||Number(style.opacity)<.5) return false;}
  return true;
}).length);

test('every page keeps exactly one logo and nav at the top while scrolling',async t=>{
  const h=await appHarness();t.after(h.close);
  const browser=await chromium.launch({headless:true});t.after(()=>browser.close());
  for (const [width,height] of [[1440,900],[390,844]]) {
    const page=await browser.newPage({viewport:{width,height}});
    for (const path of pages) {
      await page.goto(h.url+path);
      for (const fraction of [0,.5,1]) {
        await page.evaluate(f=>scrollTo({top:(document.documentElement.scrollHeight-innerHeight)*f,behavior:'instant'}),fraction);
        await page.waitForTimeout(250);
        assert.equal(await visibleNavs(page),1,`${path} at ${width}px, ${fraction*100}% down`);
      }
    }
    await page.close();
  }
});

test('the homepage hands over from the hero nav to the site nav at the listings',async t=>{
  const h=await appHarness();t.after(h.close);
  const browser=await chromium.launch({headless:true});t.after(()=>browser.close());
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  await page.goto(h.url+'/');
  const siteNav=page.locator('.home-nav');
  assert.equal(await siteNav.evaluate(el=>el.inert),true,'hidden and unfocusable during the hero');
  await page.locator('.cinema-nav').getByRole('link',{name:'Condo/Apartment'}).click();
  await page.waitForFunction(()=>!document.querySelector('.home-nav').inert);
  assert.equal(await page.locator('.cinema-nav').evaluate(el=>el.inert),true);
  await siteNav.getByRole('link',{name:'REMARCABLE LIVING home'}).click();
  await page.waitForFunction(()=>scrollY===0&&document.querySelector('.home-nav').inert);
});
