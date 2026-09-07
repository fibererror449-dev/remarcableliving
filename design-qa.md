# Hero scroll repair QA — 2026-09-07

final result: passed

Scope: the local cinematic hero's half-filled screen, zoom sizing, room-transition artifacts, and handoff into the existing live pricing collection. No deployment.

## Visual truth and captured evidence

- Approved opening: `design/hero-concepts/v1/01-bangkok-opening.png` (1672×941).
- Approved kitchen: `design/hero-concepts/v1/kitchen-natural-v3.png` (1672×941).
- Latest user screen-fit reference: `codex-clipboard-eb3ace13-053a-49a0-bf06-cb62e4acbfd0.png` (988×636 cropped laptop view, supplied in conversation).
- Implementation: `http://localhost:4173/`, captured through the in-app browser.
- `design/qa/desktop-opening.png`: 1672×941 CSS viewport and screenshot; source and implementation opened in the same comparison input, no density rescaling.
- `design/qa/desktop-opening-midzoom.png`: 1672×941, progress .117; compared in the same input with the user's cropped laptop reference. Crop/zoom state differ, so comparison is of screen-edge fit, not a claim of pixel-identical typography.
- `design/qa/desktop-kitchen.png`: 1440×900 viewport; approved image and implementation opened together. Background is intentionally cover-cropped from 1672×941; nav, copy, and shade are UI overlays.
- `design/qa/desktop-pricing-midzoom.png`, `desktop-pricing-released.png`: 1440×900, final zoom and native-scroll release.
- `design/qa/mobile-opening.png`, `mobile-pricing-midzoom.png`, `mobile-pricing-released.png`: 390×844 responsive views.

## Findings and repair history

1. **Resolved P1 — half-filled laptop page.** `Object.assign` did not apply a CSS custom property. Its dependent inset/height declarations became invalid and the absolute panel shrank to content width. Use `style.setProperty`, explicit full panel width, and a full-height welcome background. Measured screen and panel widths now match (1015.706 px at desktop progress .117). Opening, intermediate zoom, and full zoom have no exposed cream half-panel.
2. **Resolved P1 — screen shrinks away during zoom.** Use a fixed HTML layout and one shared camera calculation for the photo and HTML screen. Only transforms change with scroll; type does not reflow during the desktop zoom. Opening screen edges remain aligned.
3. **Resolved P1 — unstable final handoff / dark blocks.** The real collection is inside the same sticky stage, with its final natural height reserved. There is no per-frame counter-translation against document scrolling. Limit the animated collection surface to the visible page height using overflow clipping instead of compositing the entire inventory. Only the current room crossfade pair remains visible; images are decoded before marking them ready.
4. **Resolved P2 — page jumps during image loading.** Keep story geometry reserved while images load instead of changing from a short static page into a long story.
5. **Resolved P2 — anchor overshoot.** Resolve search/collection targets from the story's document origin plus story distance, excluding the sticky element's current displacement. Verified filtered results land at collection top 0 px; static search lands within 0.1 px of the viewport top.

## Required fidelity surfaces

- **Typography:** existing brand font declarations, charcoal/gold hierarchy, italic emphasis, and copy are retained. Fixed layout prevents mid-zoom wrapping changes. Desktop and mobile headings are readable; the miniature laptop is intentionally a preview, not a reading surface.
- **Spacing/layout:** screen fills its photograph; target desktop page lands below the nav. Full-view and focused laptop-edge comparisons find no half-filled panel. Pricing uses the existing collection layout. Mobile intentionally reveals additional vertical page content as it takes over the portrait viewport.
- **Colors/tokens:** existing cream/charcoal/gold tokens and photographic shade retained. No new visual theme.
- **Image quality:** approved skyline and natural room assets retained as optimized WebP. Kitchen peninsula and laptop are fully rendered in checked frames, with no large dark block. The known missing Centric listing photo shows an honest photo-unavailable message; no substitute unit photograph was invented.
- **Copy/content:** navigation, emotional balcony ending, AI-imagery disclosure, prices wording, asking-rent disclaimer, actual filters, and listing links retained. No invented prices or availability.

## Interaction and technical verification

- Desktop forward opening zoom, full welcome page, chapter navigation to kitchen/balcony, final zoom, release, and reverse scroll.
- At progress .983 pricing was near-fullscreen; after release stage and collection shared top −54.5 px with `transform: none`. Reverse scrolling returned the same collection to the laptop transform, with the sticky stage top 0.
- Mobile shortlist, room-story traversal, final zoom, and release. Mobile release has no transform and retains the live collection.
- Reduce motion / Play story, reduced-motion search navigation, desktop search, Ari filtering (3 cards), and Show matches anchor.
- Browser error log checked: no captured JavaScript errors.
- Production build and rendered-HTML regression suite: 6 passed, 2 pre-existing skipped Centric-media tests, 0 failures.
- Targeted ESLint: 0 errors, 4 native-img advisory warnings. Optimized local WebP is used for the cinematic assets.

## Follow-up / test limits

- Browser checks sampled actual rendered states and forward/reverse gestures; this is not an exhaustive frame-rate benchmark across hardware or a claim that every browser compositor is artifact-free.
- Mobile document has approximately 2 px of non-obstructing horizontal overflow outside the clipped hero surface; no persistent controls are hidden. P3 follow-up, not expanded into an unrelated page redesign.
- Existing Centric residence detail media remains missing, as documented by the repository's skipped tests. This repair does not restore that separate gallery.

## Implementation checklist

- [x] Full-width laptop HTML and fixed zoom layout.
- [x] Bounded animation layers and native pricing handoff.
- [x] Forward/reverse desktop and mobile browser checks.
- [x] Search/filter and motion-toggle checks.
- [x] Build, regression suite, and targeted lint.
- [x] Keep changes local; no commit, push, or deployment.

# Layout below the hero — 2026-09-07

final result: passed

Scope: PR #2 implements the approved layout canvas for the homepage below the hero, the residence detail page, and the inventory page. The cinematic hero and its handoff are untouched. Admin is out of scope.

## Evidence

- Approved canvas: https://claude.ai/code/artifact/654dcf89-30f5-42dc-840a-a0107b6a4ac4
- `design/qa/layout/home-1440.png`, `home-390.png`: full homepage, reduced-motion mode so the collection sits in flow.
- `design/qa/layout/handoff-1440.png`: motion mode, story scrolled to progress 1.000; destination transform `none`, collection top equals stage top, so the hero still releases into the live collection.
- `design/qa/layout/res-1440.png`, `res-390.png`: Baan Klang Krung Siam detail. Its gallery media is absent from the repo, so every tile shows the honest fallback rather than a broken image.
- `design/qa/layout/inv-1440.png`, `inv-390.png`: inventory with 742 units.

## Checks

- Type floor: no `font-size` under 12px in `app/styles/{base,home,residence,inventory,tokens}.css`; computed h1/h2/eyebrow/body at 1440 and 390 read 93.6/100.8/13/17 px on the home and 44/39/13/16 px on mobile. The hero's own chrome keeps its existing sizes.
- `document.documentElement.scrollWidth` equals the viewport at 1440 and 390 on all three surfaces.
- No page errors or console errors on any surface.
- Server-rendered images that 404 before hydration now switch to the fallback on mount (`app/ListingImage.tsx`).
- `npm run build`, `npm test` (6 pass, 2 pre-existing skips), targeted ESLint on the changed files: 0 new errors. The `media-has-caption` error on the residence video is present on `main` and not part of this change.

## Limits

- Browser checks were headless Chrome captures and DOM measurements, not a manual keyboard traverse; focus rings come from the unchanged safeguard block in `app/globals.css`, which covers every link, button, input, and select.
- `/residences/ashton-asoke-3br-42f` 404s locally because that listing exists only in D1, not in the fallback data. Unchanged by this PR.

## Fan-out into pages — 2026-09-07

Owner asked for the homepage to stop carrying every section and for the 404s to be fixed. Live probe before the change: `/student-housing` (linked three times as "Find by university"), `/residences`, `/neighbourhoods`, `/sitemap.xml` and `/robots.txt` all returned 404; the seven residence detail pages resolved. `/residences/ashton-asoke-3br-42f` resolves in production (row present in the production D1) and 404s locally, which corrects the note above that said the reverse.

Routes now: `/` (hero + collection + explore strip), `/residences` (filters synced to `?area=&budget=`), `/neighbourhoods` (area cards, per-area residences, guide at `#guide`), `/approach`, `/contact` (`?persona=&listing=`), `/student-housing`, plus branded `not-found`, `sitemap.xml`, `robots.txt`.

Headless Chrome (puppeteer-core, dev server on 4173), reduced motion on, at 1440 and 390 — screenshots in `design/qa/fan-out/`:
- Every route 200; `/does-not-exist` 404 with the branded page; sitemap lists the seven static routes and every listing slug, omits `/admin`.
- `scrollWidth` equals the viewport on every page at both widths; no console errors; no text under 12px outside the untouched cinematic hero.
- `aria-current="page"` set on the matching nav link on every page.
- `/residences`: selecting Ari updates the URL to `/residences?area=Ari` (3 cards); adding "Under ฿20,000" gives `?area=Ari&budget=under-20k` (1 card).
- `/neighbourhoods`: selecting Thonglor sets `aria-pressed="true"`, heading "1 residence in Thonglor", link `/residences?area=Thonglor`.
- Hero handoff at progress 1.000: destination transform `none`, collection top equals stage top. "Skip to search" lands with `#search` at viewport top.
- `/contact?persona=intern&listing=Test%20Unit`: Intern tab selected, notice "Viewing request started for Test Unit."
- `/student-housing?university=Mahidol%20University`: the university card is marked current and the select is prefilled.

Known gap unchanged: Baan Klang and Centric Ari gallery media are still absent from the repo; the media manifest work is the next PR.
