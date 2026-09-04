# Extracting design DNA

The goal is a written spec precise enough to build from without looking at the reference again. "Dark and minimal" fails that test; a type scale, six hex values, and a spacing ratio pass it. Everything vague you leave in the spec is a decision the model will fill with its default pattern.

Write the result to `design-dna.md` in the project. It outranks your own judgment for the rest of the build.

## From a still image

Work through these in order — each one is a decision the reference already made for you.

**Layout** — Column grid and gutters. Where the content sits in the frame (is the hero text at the optical third, hard left, baseline-anchored?). How much negative space, and where it's concentrated. Whether sections share one rhythm or deliberately break it.

**Type** — Two faces at most in the reference, usually. Name the classification even if you can't name the font: geometric sans, grotesque, transitional serif, mono. Measure the scale as ratios (display : heading : body : caption). Note tracking on the display size — tight negative tracking on large type is one of the most reliable "designed" signals. Note case and weight contrast.

**Color** — Sample actual pixels, don't estimate. You want the background, the surface, the primary text, the secondary text, the accent, and the border. Note the *relationship*: is the accent warm against a cool ground? Is the palette two-tone with one accent, or a full spread? Count how many distinct hues actually appear — usually fewer than you'd guess.

**Depth and finish** — Corner radii (and whether they're consistent). Shadow: spread, blur, opacity, and direction. Borders: hairline or heavy, solid or translucent. Grain, noise, or texture overlay. Blur/glass effects and what's behind them.

**Imagery** — Subject treatment, crop, color grade, whether it bleeds to the edge or sits inset.

## From video or a screen recording

Everything above from a representative frame, plus the motion:

- **Beat structure.** Sample frames at intervals and list what changes at each: scene, text, camera, state. This becomes the beat sheet directly.
- **Duration per beat**, in scroll terms — which beats hold and which pass quickly.
- **Easing feel.** Does motion start fast and settle (ease-out), or drift in (ease-in-out)? Overshoot or none?
- **What moves versus what stays.** Usually far less moves than it appears; identify the anchor.
- **Entrance.** How the first frame arrives, and how long the page holds before anything happens.

For generated footage intended as a scroll-scrubbed hero: keep motion continuous and single-directional, avoid cuts (a cut mid-scrub reads as a bug), and prefer footage that loops or ends near where it began.

## From a live site

Screenshots tell you *what*. The code tells you *how* — and "how" is the part that transfers to your own build and into the user's vocabulary.

1. **Read the real markup.** Structure, section order, semantic containers, the classes carrying layout.
2. **Fetch the actual CSS and JS files**, not a summary of them. The technique lives in specific values: the cubic-bezier, the transform origin, the scroll-progress formula, the custom property names. A summarizing fetch strips exactly those.
3. **Inspect computed values** for anything you can't read off the source — resolved font stacks, final colors after cascade, the real spacing scale.
4. **Name the mechanism** in plain terms once you find it: "pinned section with canvas image sequence", "CSS scroll-driven animation with a view timeline", "IntersectionObserver with staggered custom-property delays". If the user asked how a site does something, this sentence is the answer they wanted.

Read what the site serves publicly. Don't lift assets, copy, fonts you don't have a license for, or brand marks — take the mechanism and rebuild it with the project's own content.

## Verify any data layer against answers you did not design around

Maps, masks, coordinate sets and lookup tables authored by hand or generated are the one part of a build that can be confidently, invisibly wrong. Before styling anything on top of one, probe it with known answers — and include probes you did **not** have in mind while building it, because the ones you did are the ones you already fitted:

- A landmass mask: assert that a spread of real cities fall on land **and** that open-ocean points fall on water. Coastal cities are where coarse grids fail; include several deliberately.
- Plotted coordinates: assert relative ordering that must hold (this city east of that one, this one south of the equator) rather than exact pixels.
- Derived figures: recompute them a second way and compare.

A graphic that is subtly wrong undermines everything around it, and no amount of visual polish rescues it. Ten seconds of assertions is the cheapest confidence in the build.

## The output

```markdown
# Design DNA — <reference name>

## Layout
Grid: … | Content anchor: … | Negative space: …

## Type
Display: <classification, size, weight, tracking>
Body: …
Scale ratio: …

## Color
--bg: #… | --surface: #… | --text: #… | --muted: #… | --accent: #… | --line: #…
Relationship: …

## Depth
Radius: … | Shadow: … | Border: … | Texture: …

## Motion  (video/site references only)
Beat sheet:
| # | scroll range | visual | copy |
Easing: … | Anchor element: … | Entrance: …

## What we take / what we change
Take: …
Change: …   ← content, brand, palette shift, or structural twist that makes it ours
```

That last section matters. Fill it in deliberately — it's what separates a reference-grounded original from a clone, and it's the part the user should have an opinion about.
