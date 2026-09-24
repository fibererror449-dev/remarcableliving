import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {appHarness} from './app-harness.mjs';

const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=','base64');

test('admin sees media counts, edits a listing, uploads a photo, adds a YouTube link and publishes',async t=>{
  const h=await appHarness();t.after(h.close);
  const browser=await chromium.launch({headless:true});t.after(()=>browser.close());
  const context=await browser.newContext({extraHTTPHeaders:{'oai-authenticated-user-id':'test-admin','oai-authenticated-user-email':'admin@example.test'}});
  const page=await context.newPage();
  await page.goto(h.url+'/admin');
  const counts=page.getByLabel('Media for Centurion Park · 1 Bedroom',{exact:true});
  await counts.getByText('Cover photo only',{exact:true}).waitFor();
  await counts.getByText('No video',{exact:true}).waitFor();
  await page.getByRole('button',{name:'Edit Centurion Park · 1 Bedroom',exact:true}).click();
  await page.getByRole('heading',{name:'Edit Centurion Park · 1 Bedroom',exact:true}).waitFor();
  assert.equal(await page.getByLabel('Rent (THB / month)',{exact:true}).inputValue(),'25000');
  await page.getByLabel('Rent (THB / month)',{exact:true}).fill('26000');
  await page.locator('.editor-drop input[type=file]').first().setInputFiles({name:'bedroom.png',mimeType:'image/png',buffer:png});
  await page.getByText('1 file uploaded. Save the listing to publish it.',{exact:true}).waitFor();
  await page.getByLabel('Caption',{exact:true}).fill('Bedroom');
  await page.getByRole('button',{name:'YouTube link',exact:true}).click();
  await page.getByLabel('YouTube link',{exact:true}).fill('https://www.youtube.com/shorts/dQw4w9WgXcQ');
  await page.locator('iframe[title="Video preview"]').waitFor();
  await page.getByRole('button',{name:'Save changes',exact:true}).click();
  await page.getByText('Listing saved.').waitFor();
  await counts.getByText('1 photo',{exact:true}).waitFor();
  await counts.getByText('YouTube video',{exact:true}).waitFor();
  await page.getByRole('heading',{name:'Add listing',exact:true}).waitFor();
  const live=await (await context.request.get(h.url+'/residences/centurion-park-ari-soi-5-1br')).text();
  assert.match(live,/฿26,000/);
  assert.match(live,/Bedroom · Owner-supplied/);
  assert.match(live,/youtube-nocookie\.com\/embed\/dQw4w9WgXcQ/);
});
