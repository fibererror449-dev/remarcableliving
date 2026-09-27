import test from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import jsQR from 'jsqr';
import { appHarness } from './app-harness.mjs';

test('the exported iPhone image scans to the permanent business-card redirect', async () => {
  const { data, info } = await sharp('public/business-card/mark-iphone.png').ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  assert.equal(info.width, 1290);
  assert.equal(info.height, 2796);
  const qr = jsQR(new Uint8ClampedArray(data), info.width, info.height);
  assert.equal(qr?.data, 'https://www.remarcableliving.co/m/7k9q');
});

test('the back of the business card scans to the existing Talk to Mark WhatsApp link', async () => {
  const { data, info } = await sharp('public/business-card/mark-back.png').resize({ width: 1800 }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const qr = jsQR(new Uint8ClampedArray(data), info.width, info.height);
  assert.equal(qr?.data, 'https://wa.me/66634962466');
});

test('QR redirect leads to an unlisted card with contact actions and image downloads', async () => {
  const app = await appHarness();
  try {
    const redirect = await fetch(`${app.url}/m/7k9q`, { redirect: 'manual' });
    assert.equal(redirect.status, 302);
    const destination = new URL(redirect.headers.get('location'));
    assert.equal(destination.pathname, '/card/mark-7k9q');
    assert.equal(redirect.headers.get('cache-control'), 'no-store');
    assert.match(redirect.headers.get('x-robots-tag'), /noindex/);
    const card = await fetch(destination);
    assert.equal(card.status, 200);
    const html = await card.text();
    assert.match(html, /name="robots" content="[^"]*noindex/);
    assert.match(html, /href="https:\/\/wa.me\/66634962466"/);
    assert.match(html, /href="tel:\+66962984509"/);
    assert.match(html, /href="mailto:info@remarcableliving.co"/);
    const qrPage = await fetch(`${app.url}/card/mark-7k9q/qr`);
    assert.equal(qrPage.status, 200);
    assert.match(await qrPage.text(), /href="\/business-card\/mark-iphone.png"/);
    for (const asset of ['mark-front.svg', 'mark-back.svg', 'mark-qr.svg', 'mark-iphone.png', 'manifest.webmanifest', 'apple-touch-icon.png']) {
      const response = await fetch(`${app.url}/business-card/${asset}`);
      assert.equal(response.status, 200, asset);
    }
    const sitemap = await (await fetch(`${app.url}/sitemap.xml`)).text();
    assert.doesNotMatch(sitemap, /mark-7k9q|\/m\/7k9q/);
  } finally { await app.close(); }
});
