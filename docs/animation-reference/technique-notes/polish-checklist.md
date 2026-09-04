# Polish: where "expensive" comes from

No single item here is noticeable. Together they're the entire difference between a page that reads as generated and one that reads as made. Work the list after the layout and motion are settled — polishing an unresolved layout is wasted effort.

## The AI-slop list — check yourself against this first

These are the defaults a model reaches for when nothing grounds it. Each one, on its own, is a tell:

- Purple/violet or indigo→pink gradient anywhere near the hero
- Three feature cards in a row, each with a generic outline icon
- Neon accents on near-black, with a faint grid or "glow" behind the hero
- Everything centered, every section the same height and rhythm
- Glassmorphism with nothing meaningful behind the glass
- Emoji as bullets or section markers
- Generic body copy: "Seamlessly transform your workflow", "Powered by AI", "Built for teams"
- Uniform 16px-ish type with no display size and no scale contrast
- A hero that's a headline, a subhead, and two buttons — and nothing else

If a page has three or more of these, don't patch them individually — go back to the reference and rebuild the section from the DNA.

## Typography

- One display size that is genuinely large — the biggest type on the page should feel slightly uncomfortable. Timid display type is the most common cause of "flat".
- Negative letter-spacing on display sizes (roughly -0.02em to -0.04em), normal or slightly positive on small text.
- Line-height inverse to size: tight on display (~1.05), open on body (~1.6).
- Measure capped around 65–75 characters. Full-width body copy reads as unconsidered.
- **Test the display line for wrapping at every width, not just yours.** A headline built as two masked lines breaks its own structure the moment one of them wraps, and the constraint is the ratio of column width to font size — so a `clamp()` that looks right at 1440 can wrap at 1600 when the column is capped in `rem` while the font keeps growing in `vw`. Measure each line's rendered height against one line-height across a dozen widths; the longest line sets the ceiling, not taste.
- Two faces maximum. A single face with real weight contrast usually beats a mediocre pairing.

## Color and surface

- Fewer hues than feels right. One accent, used sparingly, earns more attention than three.
- Text at two or three levels (primary / secondary / muted) rather than one flat color.
- Hairline borders at low opacity of the text color, not a separate grey.
- Section-to-section value shifts: a bright section between two dark ones resets the eye and makes both read better. Long stretches of one value flatten regardless of content.

## Motion and feedback

- A deliberate entrance — a short hold, then content arriving in sequence. Instant full-page paint feels cheaper than a 400ms considered load.
- Hover states that actually respond: a shift in elevation, color, or scale — not just a cursor change.
- Numbers count up when they scroll into view.
- Content reveals with a stagger, not all at once.
- A scroll progress indicator on any page long enough to lose your place in.
- Transitions between sections that share a motion language — if one section slides, others shouldn't fade.
- Easing: `cubic-bezier(.2,.7,.2,1)` and its relatives read as designed; `ease` and `linear` read as default.

## Craft details

- Real content. Placeholder copy undermines everything above it — write the actual words, or ask for them.
- Focus states visible for keyboard users.
- Images sized and formatted correctly (WebP/AVIF, explicit dimensions to prevent layout shift).
- A considered 404 and a favicon, if the page is going anywhere real.
- Selection color set to match the palette — a one-line detail that signals someone was paying attention.

## The test

Screenshot the finished page next to the reference. Squint at both. If the *value structure* and *rhythm* read the same at a squint, the build is faithful. If the reference reads richer, the difference is almost always type scale contrast or section-to-section value shift — check those two before anything else.
