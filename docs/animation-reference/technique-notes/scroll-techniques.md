# Scroll techniques

Every technique here is the same idea in different clothes: **derive a 0→1 progress value from scroll position, then drive everything from it.** Progress-driven animation is automatically reversible, resolution-independent, and interruptible — which is why it looks right on the way back up, and why one-shot triggers don't.

## Contents

1. The progress primitive
2. Pinned scene (the container everything else lives in)
3. Scroll-scrubbed video
4. Image sequence on canvas (the reliable version)
5. Beat-synced text
6. Reversible reveals
7. Section progress indicator
8. Performance and degradation

---

## 1. The progress primitive

```js
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));

// 0 when the section's top hits the viewport top,
// 1 when its bottom reaches the viewport bottom.
function sectionProgress(section) {
  const rect = section.getBoundingClientRect();
  const scrollable = section.offsetHeight - window.innerHeight;
  if (scrollable <= 0) return 0;
  return clamp(-rect.top / scrollable);
}
```

Read scroll state inside a `requestAnimationFrame` loop, never directly in the scroll handler — scroll fires far more often than the screen repaints, and layout reads inside it cause forced reflow.

```js
let ticking = false;
addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => { render(); ticking = false; });
}, { passive: true });
```

Add easing to the raw progress when motion feels mechanical — a light smoothing (lerp toward the target each frame) gives weight without decoupling from the scrollbar.

## 2. Pinned scene

The structural unit of scroll storytelling: a tall section whose child sticks to the viewport while the section scrolls past. The section's height *is* the duration of the scene.

```html
<section class="scene" style="height: 400vh">
  <div class="scene__stage"><!-- sticky, 100vh --></div>
</section>
```

```css
.scene__stage { position: sticky; top: 0; height: 100vh; overflow: hidden; }
```

`400vh` gives roughly three viewport-heights of scrolling for the scene to play through. Longer means slower; tune per breakpoint, because the same height reads much faster on a short phone viewport.

Avoid `position: fixed` for this — sticky keeps the element in flow, so sections before and after behave normally.

## 3. Scroll-scrubbed video

Seeking a video from scroll is the fastest way to a cinematic hero, and the most likely to stutter. It works when the file cooperates:

```html
<video id="hero" src="hero.mp4" muted playsinline preload="auto"></video>
```

```js
const v = document.getElementById('hero');
function render() {
  if (!v.duration) return;
  v.currentTime = sectionProgress(scene) * v.duration;
}
```

Requirements, all of them load-bearing:

- `muted` and `playsinline` — without both, iOS refuses inline playback and may show native controls.
- **Short keyframe interval.** Seeking only lands on keyframes; a video encoded with a keyframe every 2 seconds will visibly snap between them. Re-encode with a keyframe every 5–10 frames for scrubbing. This is the single most common cause of "why is it jumpy".
- `preload="auto"` plus a loading state, so scrubbing doesn't start before enough is buffered.
- Keep the file short (10–20s) and small. Duration is scroll distance, not screen time.

Prefer `v.fastSeek?.(t) ?? (v.currentTime = t)` where available — it trades exactness for smoothness, which is the right trade during a scrub.

## 4. Image sequence on canvas

More predictable than video scrubbing, at the cost of a heavier initial load. Use it when the hero must not stutter.

```js
const frames = 120;
const imgs = [];
let loaded = 0;
for (let i = 0; i < frames; i++) {
  const img = new Image();
  img.src = `frames/${String(i).padStart(4, '0')}.webp`;
  img.onload = () => { if (++loaded === frames) start(); };
  imgs.push(img);
}

const ctx = canvas.getContext('2d', { alpha: false });
function render() {
  const i = Math.min(frames - 1, Math.round(sectionProgress(scene) * (frames - 1)));
  const img = imgs[i];
  if (img?.complete) ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
}
```

Keep frames as WebP or AVIF, sized to the largest viewport you actually support — not the source resolution. 120 frames at 1600px wide is a realistic budget; 240 frames at 4K is not.

## 5. Beat-synced text

The beat sheet is data, so the copy and the visual can never drift apart:

```js
const beats = [
  { at: 0.00, until: 0.22, text: 'She reaches for it.' },
  { at: 0.28, until: 0.55, text: 'The moment before it falls.' },
  { at: 0.62, until: 1.00, text: 'And everything changes.' },
];

function render() {
  const p = sectionProgress(scene);
  beats.forEach((b, i) => {
    const el = beatEls[i];
    const on = p >= b.at && p <= b.until;
    el.style.opacity = on ? 1 : 0;
    el.style.transform = `translateY(${on ? 0 : 12}px)`;
  });
}
```

Because state is recomputed from progress every frame, scrolling back up restores the text automatically. That is the fix for the near-universal bug where copy appears once and never returns.

Leave gaps between beats (`until` of one before `at` of the next) so one line clears before the next arrives — overlapping text reads as a glitch.

## 5b. Verifying reveals (read this before debugging one)

`IntersectionObserver` callbacks and CSS transitions are both delivered on the browser's rendering step. In any context that isn't painting frames — a hidden tab, a background preview pane, most headless setups — observers never fire and transitions freeze at their first computed frame. A perfectly correct reveal then looks completely broken, and a `getComputedStyle` read taken "after the transition settles" returns the start value no matter how long you wait.

Don't debug the implementation until you've ruled this out. Verify the **state machine** instead of the trigger:

1. Assert the hidden state — `opacity: 0`, the transform applied, the stagger delays resolved.
2. Toggle the class yourself, exactly as the observer would.
3. Assert the revealed state.
4. Remove it and assert the hidden state returns — waiting past the full transition, or reading mid-transition will lie to you.

That separates "my logic is wrong" from "this environment isn't rendering". To check the trigger itself, front the tab and allow multiple seconds — delivery can lag badly. And when a transitioned value reads as identity, re-read it with `transition: none` applied: if the correct value appears, the cascade was always right and only the animation was frozen.

## 6. Reversible reveals

For content outside a pinned scene, `IntersectionObserver` is right — but don't unobserve after the first hit unless the reveal is genuinely one-shot:

```js
const io = new IntersectionObserver(entries => {
  entries.forEach(e => e.target.classList.toggle('is-in', e.isIntersecting));
}, { threshold: 0.25, rootMargin: '0px 0px -10% 0px' });
```

In a grid, stagger by position **within the row**, not by index in the list. A naive `index * 60ms` makes the first card of row two wait behind all of row one, so it lands late and out of rhythm with the row it belongs to. Group by `offsetTop` and let each row count from zero, recomputing on resize since the column count changes at breakpoints.

Stagger children with a CSS custom property rather than JS timers, so it stays cheap:

```css
.is-in > * { transition: opacity .6s ease, transform .6s cubic-bezier(.2,.7,.2,1); transition-delay: calc(var(--i) * 60ms); }
```

Always pair the reveal class with `:focus-within`. An element at `opacity: 0` still contains focusable children, so a keyboard user tabbing through a grid lands on invisible targets with no idea where they are — the accessibility bug that ships with almost every scroll-reveal on the web.

```css
.card.is-in, .card:focus-within { opacity: 1; transform: none; }
```

One more judgment call: **don't animate numbers that carry commitment.** A count-up dramatises a soft statistic ("10M+ users") well, but on a price, a dosage, or a deadline it runs the reader through a series of wrong values and reads as instability. Reveal those from behind a mask instead — they arrive, they don't compute.

## 7. Section progress indicator

Dots, a ring, or a scrub bar down one edge. Track which section owns the viewport centre:

```js
const active = sections.findIndex(s => {
  const r = s.getBoundingClientRect();
  return r.top <= innerHeight / 2 && r.bottom >= innerHeight / 2;
});
```

Match the indicator's shape to the page's geometry — a ring belongs on a page built from circles, a bar on one built from rules. A shape that echoes the layout is the difference between an indicator that looks bolted on and one that looks designed.

## 7b. Entrances, and two cascade traps

A deliberate entrance is usually a class flipped on a container (`is-ready`) with per-element `transition-delay` staged from a custom property. Two failure modes account for most broken entrances:

**An animation utility must never own `transform` on an element that uses `transform` to position itself.** A generic `.fade { transform: translateY(14px) }` paired with `.is-ready .fade { transform: none }` (specificity 0,2,0) outranks `.thing { transform: translateX(-50%) }` (0,1,0) — so the element snaps out of position at the exact moment the entrance finishes. Keep positioning on the outer element and put the utility on an inner one. A scroll-driven fade and an entrance fade on two nested elements multiply cleanly; on one element they fight.

**Shorthands reset the longhands they omit.** `transition: opacity .25s ease` wipes any `transition-delay` set by an earlier rule of equal specificity, silently un-staging that element. Set `transition-property`/`-duration`/`-delay` separately whenever a delay comes from elsewhere.

**Gate a font-dependent entrance on `document.fonts.ready`** — text that animates in a fallback face and then snap-swaps is more conspicuous than no animation. Always race the gate against a timeout, or a slow or blocked font host leaves the content permanently invisible:

```js
Promise.race([
  document.fonts?.ready ?? Promise.resolve(),
  new Promise(r => setTimeout(r, 1200)),
]).then(() => root.classList.add('is-ready'));
```

**Masked line reveals clip descenders.** A line rising out of an `overflow: hidden` mask sized to its line box loses the tails of y, p, g, j. Give the mask room and pull it back so layout doesn't shift: `padding-bottom: .14em; margin-bottom: -.14em`. Verify with `scrollHeight === clientHeight`.

## 7c. Canvas layers: cache what never moves

A static layer redrawn every frame caps how much of it you can afford. Rasterise it once into an offscreen canvas on layout and blit that each frame instead:

```js
function buildLayer(){
  cache = document.createElement('canvas');
  cache.width = W * DPR; cache.height = H * DPR;
  var g = cache.getContext('2d');
  g.setTransform(DPR, 0, 0, DPR, 0, 0);
  /* …draw the expensive static thing once… */
}
// per frame:
ctx.globalAlpha = fade; ctx.drawImage(cache, 0, 0, W, H); ctx.globalAlpha = 1;
```

Rebuild it in the resize handler, never in the render loop. This is what makes a dense field affordable — the difference between a loose stipple and something that reads as substance is usually four times the elements, which is free once cached and unaffordable when it isn't.

**Reserve space for text over a canvas.** When labels are drawn onto a canvas that sits behind page copy, place them greedily — try one side of the anchor, then the other, and skip the label if neither is clear. Feed the copy block's own measured rect in as a no-go zone, taking the union of the actual text boxes rather than the padded column, or the guard swallows half the frame and every label disappears. Dots and texture behind type read as atmosphere; a word behind a headline reads as a mistake.

**Judge density by measuring, not by squinting.** Read the pixels back and check both coverage and mean alpha:

```js
const d = ctx.getImageData(0, 0, c.width, c.height).data;
let painted = 0, sum = 0;
for (let i = 3; i < d.length; i += 4) if (d[i]) { painted++; sum += d[i]; }
// painted / (c.width*c.height) → coverage;  sum / painted → mean alpha
```

A mean alpha around 70/255 is the signature of a layer that is technically present and visually absent. It is also the fastest way to tell "my drawing code is broken" from "this environment is not painting" — if the pixels are there, the code is fine.

**Don't gate a canvas render on `IntersectionObserver`.** An observer that fires late, or never, leaves an empty box where the graphic should be — a worse failure than a graphic that is simply already drawn. Derive the reveal from scroll position like everything else, and the canvas can never be blank when it is on screen:

```js
function layerProgress(el){
  const r = el.getBoundingClientRect();
  if (r.bottom < 0 || r.top > innerHeight) return last;   // hold state off-screen
  return clamp((innerHeight * 0.92 - r.top) / (innerHeight * 0.55), 0, 1);
}
```

## 8. Performance and degradation

- Animate `transform` and `opacity` only. Anything that touches layout (top, width, margin) will drop frames under scroll.
- Apply `will-change: transform` to the few elements actually animating, and remove it when they stop — applied broadly it costs more memory than it saves.
- **Mobile:** swap scrubbed video for a still frame or a much shorter sequence, and shorten scene heights. A phone that has to decode and seek video every frame will stall.
- **`prefers-reduced-motion`:** ship a real static path — final frame visible, all copy present, no pinning. Reduced motion means fewer moving things, not a broken page.
- Give the hero a deliberate load state; assets arriving mid-entrance is what makes an otherwise good page feel cheap.
