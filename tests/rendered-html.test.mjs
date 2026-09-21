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
  assert.match(html, /id="residences"/);
  assert.match(html, /id="search"/);
  assert.match(html, /href="\/student-housing"/);
  assert.match(html, /href="\/neighbourhoods"/);
  assert.match(html, /href="\/about"/);
  assert.match(html, /href="\/contact"/);
  assert.doesNotMatch(html, /remarcableliving\.co\/student-housing/);
});

test("fans the homepage sections out to their own routes", async () => {
  const residences = await (await render("/residences")).text();
  assert.match(residences, /class="search-strip/);
  assert.match(residences, /<h3><a [^>]*>Centurion Park/);
  assert.match(residences, /<h3><a [^>]*>Thru Thonglor/);

  const filteredResponse = await render("/residences?area=Ari&budget=under-20k");
  assert.equal(filteredResponse.status, 200);
  const filtered = await filteredResponse.text();
  // Every listing is serialised for hydration, so assert on rendered cards.
  assert.match(filtered, /<h3><a [^>]*>Centric Ari Station/);
  assert.doesNotMatch(filtered, /<h3><a [^>]*>Thru Thonglor/);
  assert.match(filtered, /Homes in/);

  const neighbourhoodsResponse = await render("/neighbourhoods");
  assert.equal(neighbourhoodsResponse.status, 200);
  const neighbourhoods = await neighbourhoodsResponse.text();
  assert.match(neighbourhoods, /Explore by/);
  assert.match(neighbourhoods, /id="neighbourhoods"/);
  assert.match(neighbourhoods, /id="guide"/);
  assert.match(neighbourhoods, /aria-pressed="false"/);

  const aboutResponse = await render("/about");
  assert.equal(aboutResponse.status, 200);
  const about = await aboutResponse.text();
  assert.match(about, /id="about"/);
  assert.match(about, /About us/);
  assert.match(about, /Who we are/);
  assert.match(about, /What we stand for/);
  assert.match(about, /From your brief/);
  assert.match(about, /Reconfirm current availability and asking rent/);
  assert.doesNotMatch(about, /Our approach/);

  const approachResponse = await render("/approach");
  assert.equal(approachResponse.status, 308);
  assert.equal(approachResponse.headers.get("location"), "/about");

  const contactResponse = await render("/contact");
  assert.equal(contactResponse.status, 200);
  const contact = await contactResponse.text();
  assert.match(contact, /Exchange student/);
  assert.match(contact, /id="exchange-intake"/);
  const intern = await (await render("/contact?persona=intern&listing=Test%20Unit")).text();
  assert.match(intern, /aria-selected="true"[^>]*>Intern</);
  assert.match(intern, /Viewing request started for Test Unit\./);

  const studentResponse = await render("/student-housing");
  assert.equal(studentResponse.status, 200);
  const student = await studentResponse.text();
  assert.match(student, /Chulalongkorn University/);
  assert.match(student, /KU Kasetsart University/);
  assert.match(student, /Dhurakij Pundit University/);
  assert.match(student, /Thammasat University, Tha Prachan Campus/);
  assert.match(student, /Thammasat University, Rangsit Campus/);
  assert.match(student, /Start With a Tap/);
  assert.match(student, /Arrive Stress-Free/);
  assert.match(student, /Send details to Mark’s Team/);
  assert.doesNotMatch(student, /Compare neighbourhoods →/);
  assert.match(student, /id="exchange-intake"/);
  assert.doesNotMatch(student, /id="intern-intake"/);
});

test("answers unknown routes with the branded 404 and publishes crawl metadata", async () => {
  const missing = await render("/does-not-exist");
  assert.equal(missing.status, 404);
  assert.match(await missing.text(), /Page not found/);

  const sitemapResponse = await render("/sitemap.xml");
  assert.equal(sitemapResponse.status, 200);
  assert.match(sitemapResponse.headers.get("content-type") ?? "", /xml/);
  const sitemap = await sitemapResponse.text();
  for (const route of ["", "/residences", "/neighbourhoods", "/about", "/contact", "/student-housing", "/inventory", "/residences/baan-klang-krung-siam-2br"]) {
    assert.match(sitemap, new RegExp(`<loc>https://www\\.remarcableliving\\.co${route.replaceAll("/", "\\/")}</loc>`));
  }
  assert.doesNotMatch(sitemap, /\/admin/);

  const robots = await (await render("/robots.txt")).text();
  assert.match(robots, /Disallow: \/admin/);
  assert.match(robots, /Sitemap: https:\/\/www\.remarcableliving\.co\/sitemap\.xml/);
});

test("keeps boutique discovery sections evidence-safe and interactive", async () => {
  const neighbourhoods = await readFile(new URL("../app/neighbourhoods/NeighbourhoodsClient.tsx", import.meta.url), "utf8");
  assert.match(neighbourhoods, /id="neighbourhoods"/);
  assert.match(neighbourhoods, /aria-pressed=\{location === area\.name\}/);
  assert.match(neighbourhoods, /setLocation\(name/);
  const journey = await readFile(new URL("../app/components/JourneySteps.tsx", import.meta.url), "utf8");
  assert.match(journey, /id="journey-title"/);
  const sources = ["../app/HomeClient.tsx", "../app/residences/ResidencesClient.tsx", "../app/neighbourhoods/NeighbourhoodsClient.tsx", "../app/about/page.tsx", "../app/components/AboutValues.tsx", "../app/components/AboutAudience.tsx", "../app/components/AboutMark.tsx", "../app/contact/page.tsx", "../app/student-housing/page.tsx", "../app/components/Manifesto.tsx", "../app/components/ExploreStrip.tsx", "../lib/site-data.ts", "../app/CinematicHero.tsx", "../app/components/SiteNav.tsx", "../app/components/SiteFooter.tsx"];
  for (const source of sources) {
    const text = await readFile(new URL(source, import.meta.url), "utf8");
    assert.doesNotMatch(text, /award-winning|five-star|clients served|off-market access/i, source);
    assert.doesNotMatch(text, /remarcableliving\.co\/student-housing/, `${source} links the old external student-housing URL`);
  }
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
test("ships the curated Centric Ari gallery and disclosed cinematic walkthrough", { skip: "media removed; centricAriHero was never carried into the homepage split (app/HomeClient.tsx)" }, async () => {
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

test("renders residence media only when the file exists in public/", async () => {
  const { collectMedia } = await import("../scripts/generate-media-manifest.mjs");
  const manifest = await readFile(new URL("../lib/media-manifest.generated.ts", import.meta.url), "utf8");
  for (const file of collectMedia()) assert.match(manifest, new RegExp(JSON.stringify(file).replaceAll(".", "\\.")), `${file} missing from the committed manifest`);
  assert.equal((manifest.match(/^ {2}"/gm) ?? []).length, collectMedia().length, "manifest lists files that no longer exist");

  const baanKlang = await (await render("/residences/baan-klang-krung-siam-2br")).text();
  assert.doesNotMatch(baanKlang, /src="\/properties\/baan-klang-krung-siam\/gallery\//);
  assert.match(baanKlang, /baan-klang-krung-siam-walkthrough-v2\.mp4/);
  assert.match(baanKlang, /photographs for this home are being updated/);

  const centurionResponse = await render("/residences/centurion-park-ari-soi-5-1br");
  assert.equal(centurionResponse.status, 200);
  assert.match(await centurionResponse.text(), /\/properties\/centurion-park-ari\.jpg/);
});
