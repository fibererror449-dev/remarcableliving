# Reusable briefs

Templates for the recurring moments in a cinematic build. Adapt them; the structure is what matters, not the wording.

## 1. Build brief (Stage 3)

```
Build the static layout described in design-dna.md, matching reference/<file>.

Rules:
- design-dna.md and the reference image are the single source of truth.
  Where your judgment disagrees with them, they win.
- Plain HTML/CSS/JS. No build step, no package install.
- No scroll animation yet — layout, type, color, and spacing only.
- Back up the current state before each substantial pass.
- After each pass: render the page, screenshot it, compare against the
  reference section by section, and fix the largest mismatches first.
- Stop when the comparison passes or after 5 rounds, whichever is first.
  Then report what still differs and let me decide.

Sections: <list>
Real copy: <supply it, or say "write it">
```

## 2. Fresh-eyes review (inside Stage 3)

Run this as a separate pass, ideally with a clean context, so it isn't defending its own work:

```
Compare <built page screenshot> against <reference> using design-dna.md.

Report only material differences, ranked by visual impact, each as:
  element → what the reference does → what the build does → the fix

Ignore differences under ~5% and anything the DNA file marks as
"what we change". Finish with a single verdict: PASS or REVISE.
```

The cap matters: a reviewer with no stopping condition will always find one more thing, and the build never ships.

## 3. Scroll layer brief (Stage 4)

```
Add the scroll layer to the approved static page. Read
references/scroll-techniques.md first and follow its progress-driven
approach — every animated value derives from a 0→1 scroll progress,
so the whole sequence is reversible on the way back up.

Beat sheet:
| # | scroll range | visual | copy |
| 1 | 0.00–0.22    | …      | …    |

Constraints:
- Pinned scene, transform/opacity only.
- Text must reappear when scrolling back up.
- Mobile: <still frame | short sequence>, shorter scene heights.
- prefers-reduced-motion: static final frame, all copy visible.
- Generated media at low resolution until timing is approved.
```

## 4. Turning a vague complaint into a precise fix

When the report is "the top bit looks weird", restate before acting. The four slots are what make a fix land:

```
Element:   the watch strap in the upper-right of the hero background
Location:  roughly x 78%, y 12%, overlapping the wordmark
Current:   a second bright leather strap floats there, unattached
Target:    remove it entirely; extend the background gradient through it
Scope:     this only — leave everything else alone
```

Scoping is the half people skip, and it's why unrelated things change.

## 5. Course-correcting mid-run

When a long run is heading the wrong way, stop it rather than waiting for it to finish, then:

```
Stop the current direction. My earlier instruction was wrong —
I said <X>, which produced <result>. What I actually want is <Y>.
Discard the <X> work and continue from <last good state>.
```

Owning the bad instruction explicitly beats layering a correction on top of it; otherwise both instructions stay live and the output splits the difference.

## 6. Learning from a reference site

```
Read the HTML for <url>, then fetch its actual CSS and JS files —
not summaries; I need the real values.

Explain how <specific effect> is implemented: the mechanism in one
sentence, the key values (easing, transforms, progress math), and the
minimal version I'd write to reproduce it in plain HTML/CSS/JS.
```

Do this every time an effect surprises you. It's the fastest route from "I like that" to "I can ask for that by name."


## 7. Patching a large file programmatically

Scripted edits on a long single-file page are fast and, done carelessly, silently destructive. Two rules earn their keep:

**Assert that every anchor is unique before you use it.** Section markers repeat — a comment like `/* ---------- process ---------- */` commonly appears in both the stylesheet and the script of the same file. Slicing between two markers where the end marker also occurs *before* the start yields a reversed, empty slice, and `replace("", new, 1)` then inserts the new block at **position 0** — above the doctype — while leaving the old block untouched. The page still loads, so nothing looks wrong until behaviour is inexplicably stale.

```python
def uniq(marker):
    assert text.count(marker) == 1, "ambiguous anchor: %r" % marker
    return marker

start = text.index(uniq(START))
end   = text.index(END, start)      # always bound the end search AFTER start
```

**Assert the post-conditions, not just the edit.** After writing, check the file still begins with `<!doctype html>`, that exactly one copy of the thing you replaced exists, and that the old version is gone — using a discriminator unique to the old version, not a string both versions share. The tells for this class of bug are a mojibake page title (content pushed above the charset declaration) and behaviour matching code you thought you deleted.
