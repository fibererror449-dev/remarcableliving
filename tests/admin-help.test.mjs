import test from 'node:test';
import assert from 'node:assert/strict';
import {chromium} from '@playwright/test';
import {appHarness} from './app-harness.mjs';

const admin={'oai-authenticated-user-id':'test-admin','oai-authenticated-user-email':'admin@example.test'};
const site='https://www.remarcableliving.co';
const decode=html=>html.replace(/&quot;/g,'"').replace(/&#x27;/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&');
const help=async (h,headers=admin)=>decode(await (await fetch(h.url+'/admin/help',{headers})).text());
const brief=(html,id)=>new RegExp(`<pre id="agent-${id}-text"[^>]*>([\\s\\S]*?)</pre>`).exec(html)[1];

test('How-to is admin-only and lists every guide and agent brief',async t=>{
  const h=await appHarness();t.after(h.close);
  const anonymous=await fetch(h.url+'/admin/help',{redirect:'manual'});
  assert.ok([302,303,307].includes(anonymous.status));
  assert.match(await help(h,{'oai-authenticated-user-id':'visitor','oai-authenticated-user-email':'visitor@example.test'}),/Admin access required/);
  const html=await help(h);
  assert.match(html,/AI connections are on\./);
  for(const text of ['For you','Add a new listing','Give an AI assistant access','For AI agents','Copy the complete guide','Connect with MCP','Use the REST API','Create a listing','Edit a listing','Add photos and a video','Bulk import from Drive or files','Check an import',`${site}/mcp`]) assert.ok(html.includes(text),text);
  assert.equal(html.match(/aria-label="Copy instructions: /g)?.length,7);
});

test('How-to warns when agent imports are switched off',async t=>{
  const h=await appHarness({IMPORTS_ENABLED:'0'});t.after(h.close);
  const html=await help(h);
  assert.match(html,/AI connections are off\./);
  assert.match(html,/IMPORTS_ENABLED=1/);
});

test('the MCP brief names exactly the tools the live server lists',async t=>{
  const h=await appHarness();t.after(h.close);
  const issued=await fetch(h.url+'/api/admin/imports/credentials',{method:'POST',headers:{...admin,origin:h.url,'content-type':'application/json'},body:JSON.stringify({name:'help test',expiresInDays:1})});
  assert.equal(issued.status,201);
  const {token}=await issued.json();
  const listed=await (await fetch(h.url+'/mcp',{method:'POST',headers:{authorization:`Bearer ${token}`,'content-type':'application/json',accept:'application/json, text/event-stream'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/list'})})).json();
  const named=new Set(brief(await help(h),'mcp').match(/\b(?:get|validate|upload|import)_[a-z_]+\b/g));
  assert.deepEqual([...named].sort(),listed.result.tools.map(tool=>tool.name).sort());
});

test('admin opens How-to, copies a brief, and the admin-screen route names real form labels',async t=>{
  const h=await appHarness();t.after(h.close);
  const browser=await chromium.launch({headless:true});t.after(()=>browser.close());
  const context=await browser.newContext({extraHTTPHeaders:admin});
  await context.grantPermissions(['clipboard-read','clipboard-write'],{origin:h.url});
  const page=await context.newPage();
  await page.goto(h.url+'/admin');
  await page.getByRole('link',{name:'How-to',exact:true}).click();
  await page.getByRole('heading',{name:'How-to',exact:true}).waitFor();

  await page.getByRole('button',{name:'Copy instructions: Connect with MCP',exact:true}).click();
  await page.getByText('Copied. Paste it into your AI assistant.',{exact:true}).waitFor();
  const shown=await page.locator('#agent-mcp-text').textContent();
  assert.equal(await page.evaluate(()=>navigator.clipboard.readText()),shown);
  assert.ok(shown.includes(`URL: ${site}/mcp`));

  assert.equal(await page.locator('#guide-photos').getAttribute('open'),null);
  await page.getByRole('navigation',{name:'How-to contents'}).getByRole('link',{name:'Add photos',exact:true}).click();
  assert.equal(await page.locator('#guide-photos').getAttribute('open'),'');
  await page.getByText('Photos only appear on the website after you save the listing.',{exact:true}).waitFor();

  const labels=/Fill the fields by their labels: ([^\n]+?)\. The form/.exec(await page.locator('#agent-create-listing-text').textContent())[1].split(', ');
  assert.ok(labels.length>10);
  await page.goto(h.url+'/admin');
  await page.getByRole('heading',{name:'Add listing',exact:true}).waitFor();
  // Compare visible label text: a select's accessible name also carries its current option.
  const form=await page.locator('#listing-editor label').evaluateAll(nodes=>nodes.map(node=>node.firstChild?.textContent?.trim()));
  for(const label of labels) assert.ok(form.includes(label),`listing form has no "${label}" label`);
});
