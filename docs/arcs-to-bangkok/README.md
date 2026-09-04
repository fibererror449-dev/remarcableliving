# Arcs to Bangkok — drop-in animation

A world map whose arcs fly from 38 origin cities and converge on Bangkok.
Canvas 2D, **no dependencies**, no build step, ~280 lines.

| file | what it is |
|---|---|
| `arcs-to-bangkok.js` | the animation, as an ES module exporting `mountArcs(canvas)` |
| `ArcsToBangkok.tsx` | React client component wrapping it — drop straight into the app |
| `standalone.html` | open in a browser to see it run with nothing else |
| `arcs-core.js` | the raw extraction, for reference only |

Verified running: mounts cleanly, paints ~14% of the canvas, honours
`prefers-reduced-motion` by showing the final composed frame instead of a blank
box.

## Use it in the site

```tsx
import ArcsToBangkok from "@/docs/arcs-to-bangkok/ArcsToBangkok";

<ArcsToBangkok />
<ArcsToBangkok height="60vh" background="#0B161E" />
```

Move the two files wherever components live — `app/components/` is fine. The
wrapper needs a height; the canvas fills it. Nothing else is required.

---

## Prompt to hand to GPT / Codex

> Add the existing "arcs to Bangkok" animation as a new section on the page.
>
> The animation is already written and working. Do **not** rewrite it, do not
> reimplement it with a library, and do not change its drawing code. Use these
> files as they are:
>
> - `arcs-to-bangkok.js` — exports `mountArcs(canvasEl)`, returns `{ destroy() }`
> - `ArcsToBangkok.tsx` — React client component, already wraps the above
>
> Task: move both files into the components directory and render
> `<ArcsToBangkok />` as its own section. Give the section a heading and short
> copy; the animation is the visual.
>
> Constraints:
> - No new dependencies. It is plain Canvas 2D and must stay that way.
> - Keep the `"use client"` directive. It needs the DOM.
> - Keep the `role="img"` and `aria-label` on the canvas. The information must
>   not exist only inside a canvas.
> - Keep the `prefers-reduced-motion` branch. Reduced-motion visitors must get
>   the finished frame, never an empty box.
> - The wrapper needs an explicit height or the canvas collapses to zero.
> - Call `destroy()` on unmount. It is already wired in the React component;
>   do not drop it, or the rAF loop leaks on navigation.
>
> Verify: `npm run build` passes, the section renders on desktop and mobile,
> and it still paints with reduced motion forced on.

---

## What it does, so nobody "improves" it wrongly

**Projection** — sinusoidal, `x = cx + dLon·k·cos(lat)`. Equal-area, so the
landmasses stay honest. Not Mercator.

**Landmass** — a 60×25 bitmask at 6° cells, verified against 21 known cities on
land and 9 open-ocean points. Rasterised **once** to an offscreen canvas. Never
redraw a static layer per frame.

**Arcs** — quadratic Bézier, control point offset perpendicular to the chord, so
each arc bows away from the straight line and neighbouring arcs separate rather
than overlapping.

**Labels** — placed only where they do not collide with an already-placed label.
At narrow widths most are suppressed by design; that is the collision test
working, not a bug.

**Timing** — 3800 ms for the full convergence, then a slow pulse at the
destination. Pass `{ durationMs }` to change it.

To change the origin cities, edit `ORIGINS`. To change the destination, edit
`BKK`. Nothing else needs to move.
