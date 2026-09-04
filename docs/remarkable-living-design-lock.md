# REMARCABLE LIVING design lock

This is the project-level source of truth for visual changes. It adapts the useful parts of reference-grounded design skills without allowing a generic skill to overwrite the existing brand, listing evidence, or conversion flow.

## Product outcome

Help a Bangkok renter understand the available home, asking rent, location context, and next contact action with as little uncertainty as possible. Visual distinction supports that outcome; it does not outrank it.

## Locked brand grammar

- Editorial Cormorant display type for brand moments and headings; clear sans-serif type for utility copy and controls.
- Ink, warm paper, muted gold, restrained green, and evidence-led photography.
- Large editorial headings balanced by compact uppercase utility labels.
- Square or restrained geometry. Do not introduce generic glass cards, purple gradients, pill-heavy interfaces, emoji icons, or invented luxury signals.
- Motion is limited to orientation, feedback, and continuity. **SUPERSEDED
  2026-09-03 for the landing page only, by the owner's explicit decision: the
  landing page takes the full cinematic treatment and should read as expensive.
  See `docs/ANIMATION-HANDOFF.md`. This clause still governs every other
  surface — admin, inventory, residence pages, forms.** Prefer 180–300 ms interaction feedback; retain the existing slow hero image movement only because reduced-motion users receive a static version.

## Information and evidence rules

- Never invent listing facts, availability, rent, walking time, names, testimonials, statistics, badges, or neighbourhood claims.
- Preserve supplied media order, attribution, captions, watermarks, and source labels.
- Keep “confirm” language wherever availability or rent is not independently current.
- A design score, generated critique, or attractive screenshot is not proof of conversion or correctness.

## Interaction rules

- Every keyboard-operable control must have a visible focus state.
- Hover feedback must not be the only indication of an action.
- Do not animate high-frequency search and filter operations.
- Respect `prefers-reduced-motion` for every animation and transition.
- Touch targets should remain usable without requiring pixel-precise tapping.

## Change order

1. Confirm the user task and the evidence that may be shown.
2. Inspect the current source and rendered page before changing it.
3. Fix structure, comprehension, accessibility, and responsive behavior before decorative polish.
4. Make one bounded change set and keep facts, media, branding, and unrelated routes unchanged.
5. Run automated tests, inspect desktop and mobile renderings, and check keyboard behavior.
6. Save a separate Sites version only after its exact source commit has been pushed.
7. Public deployment requires separate owner approval.

## Acceptance gate

A change is worth keeping only if it preserves factual accuracy and brand identity, introduces no responsive or keyboard regression, and makes a named user task clearer or easier. “Looks more expensive” by itself is not acceptance evidence.
