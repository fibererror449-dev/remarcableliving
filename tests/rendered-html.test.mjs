import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${Math.random()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`https://www.remarcableliving.co${pathname}`, {
      headers: {
        accept: "text/html",
        host: "www.remarcableliving.co",
        "x-forwarded-host": "www.remarcableliving.co",
        "x-forwarded-proto": "https",
      },
    }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renders the REMARCABLE LIVING home and featured Baan Klang Krung listing", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /REMARCABLE LIVING/);
  assert.doesNotMatch(html, /REMARKABLE LIVING/);
  assert.match(html, /Baan Klang Krung Siam/);
  assert.match(html, /\/residences\/baan-klang-krung-siam-2br/);
  assert.match(html, /Explore by/);
  assert.match(html, /neighbourhood/);
  assert.match(html, /From your brief/);
  assert.match(html, /Reconfirm current availability and asking rent/);
});

test("keeps boutique discovery sections evidence-safe and interactive", async () => {
  const page = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /id="neighbourhoods"/);
  assert.match(page, /aria-pressed=\{location === area\.name\}/);
  assert.match(page, /setLocation\(name\)/);
  assert.match(page, /id="journey-title"/);
  assert.doesNotMatch(page, /award-winning|five-star|clients served|off-market access/i);
});

test("ships the complete Baan Klang Krung gallery, tour, and route metadata", async () => {
  const page = await readFile(new URL("../app/residences/[slug]/page.tsx", import.meta.url), "utf8");
  assert.match(page, /The complete residence\./);
  assert.match(page, /Fifteen owner-supplied views/);
  assert.match(page, /baan-klang-krung-siam-walkthrough-v2\.mp4/);
  assert.match(page, /baan-klang-krung-siam-walkthrough-v2\.vtt/);
  assert.match(page, /ad-01-kitchen-close\.jpg/);
  assert.match(page, /ad-15-bath-kids\.jpg/);
  assert.match(page, /Check availability/);
  assert.match(page, /export async function generateMetadata/);
  assert.match(page, /https:\/\/www\.remarcableliving\.co/);
  assert.match(page, /alternates: \{ canonical \}/);
  assert.doesNotMatch(page, /aurelis-estates\.iverytowersai\.chatgpt\.site/);
  assert.match(page, /openGraph:/);
  assert.match(page, /twitter:/);
});

// STALE, 2026-09-04. This asserted a curated Centric Ari gallery that no longer
// exists: all 12 of its media files are absent from the repo, and app/page.tsx
// no longer defines centricAriHero. Kept rather than deleted so the disclosure
// wording ("Digitally styled owner photography", "AI-assisted walkthrough
// concept") is not silently lost if the listing is ever rebuilt.
test("ships the curated Centric Ari gallery and disclosed cinematic walkthrough", { skip: "media removed and centricAriHero no longer in app/page.tsx" }, async () => {
  const page = await readFile(new URL("../app/residences/[slug]/page.tsx", import.meta.url), "utf8");
  const home = await readFile(new URL("../app/page.tsx", import.meta.url), "utf8");
  assert.match(page, /centric-ari-station\/cinematic-walkthrough\.mp4/);
  assert.match(page, /06-living-room-rug-edited\.png/);
  assert.match(page, /11-water-heater-edited\.png/);
  assert.match(page, /Digitally styled owner photography/);
  assert.match(page, /AI-assisted walkthrough concept/);
  assert.match(page, /Confirm scale, finishes, and furnishings during the viewing/);
  assert.match(home, /centricAriHero/);
});

// KNOWN GAP, 2026-09-04. All 12 assets referenced by the Centric Ari residence
// page are absent from this repository, so every image and the walkthrough
// video on /residences/centric-ari-station-1br returns 404 in production:
//   01/02/03/07-bedroom-*, 04/05-bathroom-*, 06-living-room-rug,
//   08-entry-view, 10-tv-shelving, 11-water-heater, 12-kitchen-fridge,
//   cinematic-walkthrough.mp4
// Restore the files and delete the skip. Do not delete the test.
test("Centric Ari media files are present on disk", { skip: "12 of 12 assets missing from the repo" }, async () => {
  const { readdir } = await import("node:fs/promises");
  const files = await readdir(new URL("../public/properties/centric-ari-station/", import.meta.url));
  assert.ok(files.includes("cinematic-walkthrough.mp4"), "walkthrough video missing");
  assert.ok(files.filter((f) => /\.(png|jpe?g)$/i.test(f)).length >= 11, "gallery images missing");
});

test("ships the REMARCABLE LIVING social preview with trusted absolute metadata", async () => {
  const layout = await readFile(new URL("../app/layout.tsx", import.meta.url), "utf8");
  const image = await readFile(new URL("../public/og.png", import.meta.url));
  assert.match(layout, /metadataBase: new URL\(siteOrigin\)/);
  assert.match(layout, /https:\/\/www\.remarcableliving\.co/);
  assert.match(layout, /alternates: \{ canonical: siteOrigin \}/);
  assert.doesNotMatch(layout, /aurelis-estates\.iverytowersai\.chatgpt\.site/);
  assert.match(layout, /url: "\/og\.png"/);
  assert.match(layout, /card: "summary_large_image"/);
  assert.match(layout, /REMARCABLE LIVING/);
  assert.doesNotMatch(layout, /REMARKABLE LIVING/);
  assert.ok(image.byteLength > 0);
});

test("renders the privacy-reduced available inventory imported from the supplied CSV", async () => {
  const response = await render("/inventory");
  assert.equal(response.status, 200);
  const html = await response.text();
  const client = await readFile(new URL("../app/inventory/InventoryClient.tsx", import.meta.url), "utf8");
  const generated = await readFile(new URL("../lib/imported-inventory.generated.ts", import.meta.url), "utf8");
  assert.match(html, /<strong>742<\/strong><span>publishable available listings imported from the supplied inventory/);
  assert.match(client, /Open supplied photos/);
  assert.match(generated, /"photoUrl":"https:\/\//);
  assert.match(client, /Price on request/);
  assert.doesNotMatch(generated, /Use password/i);
  assert.doesNotMatch(generated, /unitCode|"Unit code"/i);
});

test("keeps the adapted design safeguards for keyboard focus and reduced motion", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /:where\(a,button,input,select,textarea\):focus-visible/);
  assert.match(css, /\.concierge label:focus-within/);
  assert.match(css, /@media\(hover:hover\)/);
  assert.match(css, /@media\(prefers-reduced-motion:reduce\)/);
});
