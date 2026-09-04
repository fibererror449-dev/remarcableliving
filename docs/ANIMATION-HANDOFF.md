# Animation handoff — for Codex

**Author:** Claude, 2026-09-03. **Reference implementation:**
`docs/animation-reference/arrival.html` — a complete, working, standalone page
(1,371 lines, no build step, no dependencies). Open it in a browser and scroll
it before writing anything. Every technique below is already working in there.

---

## 0. Owner decision — read this first

**Marc has explicitly asked for the full cinematic treatment. The goal is that
the page reads as expensive.** This overrides the motion restriction in
`docs/remarkable-living-design-lock.md` ("Motion is limited to orientation,
feedback, and continuity. Prefer 180–300 ms"). That line no longer governs this
work. Do not revert to it, and do not quietly trim scenes back toward it.

Sequencing is unchanged and is the repo's own rule, not a preference: Phase A of
`CODEX-AUDIT-BRIEF.md` (money, identity, photo provenance) still ships first.
The animation lands on a site people already believe.

---

## 1. Port all of it

Every scene in `arrival.html`, in full:

- **World-arc hero** — 38 origin cities, arcs converging on Bangkok. States the
  proposition without a sentence: you are there, we are here, this is the
  journey.
- **Campus map** — Bangkok, the transit lines, the universities, each building's
  distance to the nearest campus. `uhomes.com` runs 1,637 Bangkok listings and
  never names a station; this is the number the audience decides on.
- **Pinned process scene** — sticky scrubbed sequence, `procRender()` @1233.
- **Listing reveal** — staggered card entrance, `stagger()` @1198.
- **Grain overlay** — inline SVG turbulence, no external asset.
- **Ghost numerals** — oversized section indices.
- **Scroll-progress bar.**

---

## 2. What actually makes it read expensive

This is the part that decides whether the result looks like money or looks like
a template with effects bolted on. Quantity of motion is not the variable —
execution is. A page with six polished scenes reads expensive; the same six
scenes at 45 fps with mismatched easing read cheap, and no amount of additional
effect repairs it.

**Easing.** One curve everywhere: `--ease: cubic-bezier(.22,1,.36,1)`, already
defined in the reference. Long decelerations. Nothing linear, nothing that
bounces or overshoots — bounce is the single most reliable signal of a cheap
page.

**Duration.** Scene transitions 600–1200 ms. Micro-feedback (hover, focus,
button press) 180–300 ms. Expensive motion is slower than instinct says, and
never laggy — those are different axes.

**Scrub, do not trigger.** Motion tied continuously to scroll position reads as
craft; motion that fires on a threshold reads as a widget. This is also why the
reference derives everything from `getBoundingClientRect()` rather than from
observers.

**One thing moves at a time.** In any focal area, a single element carries the
motion. Two competing animations in one viewport is the visual signature of a
free template.

**Restraint in palette.** The reference palette is already disciplined —
`--ground:#0B161E`, `--gold:#C9A961`, and very little else. Expensive means few
colours held consistently, not more colours.

**Typographic contrast.** One family, wide weight range, large size jumps,
tight display tracking (`-.035em`). Geist across the whole page; hierarchy comes
from weight and scale, never from a second typeface.

**Space.** Generous margins, and resist filling them. Density reads as cheap
faster than almost anything else.

**60 fps or it is not expensive.** Jank destroys the effect completely and
instantly. Test on a mid-range Android phone, not a laptop. If a scene cannot
hold frame rate, cut that scene rather than shipping it stuttering.

**Photography is load-bearing.** No effect survives a stock skyline. The audit
already flags the six `/bangkok/*.jpg` Unsplash images as the site's biggest
credibility problem; they are also the reason it cannot look expensive. Real
unit photography does more for perceived value than every animation here
combined.

---

## 3. Technique map — line numbers in `arrival.html`

| technique | lines | note |
|---|---|---|
| Single `requestAnimationFrame` loop | `frame(ts)` @1280 | **One** loop drives every scene. Do not add per-element scroll listeners. |
| Scroll-derived progress | `procRender()` @1233, `cityProgress()` @1271 | `progress = -rect.top / (el.offsetHeight - innerHeight)`, clamped 0–1. Derives state from position, so it is correct after a resize, a jump-scroll, or a reload mid-page. |
| Pinned scene | `position:sticky` @~479 | Tall parent, sticky child. No JS pinning, no scroll-jacking. |
| Sinusoidal map projection | `pj()` @761 | `x = cx + dLon·k·cos(lat)`. Equal-area, so landmasses stay honest. |
| Arc geometry | `ctrl()` @765, `qp()` @771 | Quadratic Bézier; control point offset perpendicular to the chord. |
| Landmass mask | `isLand()` @664, `buildLand()` @726 | 60×25 bitmask, verified 21/21 cities on land and 9/9 ocean points on water. Rasterised **once** to an offscreen canvas — never redraw static layers per frame. |
| Label collision avoidance | `hits()` @774, `chits()` @907 | Rect-overlap test against already-placed labels; skip on collision. |
| Nearest-station computation | `kmBetween()` @891, `nearestStation()` @896 | Haversine. Reuse this for campus distances. |
| Staggered reveal | `stagger()` @1198, `IntersectionObserver` @1211 | Uses `classList.toggle`, **not** `unobserve` — so it replays when scrolling back up. |
| Reduced motion | `reduce` @631, CSS @43, @331, @390 | Checked in JS *and* CSS. Non-negotiable. |

---

## 4. Hard constraints

- **Do not change the framework or package manager.** vinext + Vite + npm.
  No GSAP, no Framer Motion, no Lenis. The reference uses zero libraries and
  runs at 60 fps; adding a 40 KB animation library to a page whose whole
  argument is trustworthiness is a bad trade.
- **Do not break the font fix.** `app/layout.tsx` and `app/globals.css` carry
  the `next/font` variable on `<html>` and Geist-only display type. Geist has
  **no italic** on Google Fonts — adding `style: ["normal","italic"]` fails the
  build with `Unknown style 'italic' for font 'Geist'`.
- **`next/image` optimisation does not run on this platform.** Pre-generate
  WebP at fixed sizes. Canvas scenes must be DPR-aware (`devicePixelRatio`),
  see `wsetup()` @696.
- **Respect `prefers-reduced-motion` in both CSS and JS.** A reduced-motion
  visitor must get the final composed state, not a blank canvas — the failure
  mode is a scene gated on an observer that never fires, leaving an empty box.
- **Never animate search or filter results.** Design lock, interaction rules.
- **Every keyboard-operable control keeps a visible focus state.**

---

## 5. Two failures this reference already solved

**Do not gate canvas drawing on `IntersectionObserver`.** An earlier version did
and the campus map rendered blank — the observer fired before layout settled and
never fired again. Derive from scroll position instead (`cityProgress()` @1271).

**Watch the CSS cascade on reveal utilities.** A `.fade{transform:none}` rule at
specificity (0,2,0) will silently outrank a positioning `transform` at (0,1,0),
and elements jump out of place the moment the entrance completes. Put the reveal
class on an inner wrapper, never on the positioned element. Related: shorthand
`transition: opacity .25s ease` wipes any `transition-delay` set earlier.

---

## 6. Order of work

1. Phase A of `CODEX-AUDIT-BRIEF.md`. Do not skip it to do this.
2. Port the campus map first — it is the load-bearing one, and it needs the real
   listing coordinates that `docs/listing-data-template.csv` will supply.
3. Port the world-arc hero.
4. Stop. Re-read §2 before adding anything else.

## 7. Definition of done

- `npm run build` and `npm test` pass; the font fix intact.
- 60 fps while scrolling on a mid-range phone, not just a laptop.
- With `prefers-reduced-motion: reduce`, every scene shows its final composed
  state and nothing is blank.
- Full keyboard traverse with visible focus throughout.
- Every canvas has a meaningful text alternative; no information exists *only*
  inside a canvas.
- No new runtime dependency in `package.json`.
