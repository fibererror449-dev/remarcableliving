# How to fill listing-data-template.csv

One row per unit, not per building. If you have three units in XT Phayathai,
duplicate the row three times and give each its own rent, size and floor.

The station columns are pre-filled as a starting guess — correct any that are
wrong. **Leave latitude/longitude blank; I will compute them, along with the
door-to-door commute time to each university.** That is the number exchange
students actually decide on, and no competitor publishes it.

| column | what to put | leave blank if |
|---|---|---|
| rent | monthly THB, digits only, e.g. `18000` | you do not have it |
| sizeSqm | usable sq m, e.g. `28.5` | — |
| floor | `17`, or `High floor`, or `—` | — |
| walkMinutes | your own measured walk to the station | you have not walked it |
| status | `available` / `viewing` / `verify` | default is `verify` |
| lastVerified | `YYYY-MM-DD`, the day you last confirmed it | — |
| furnished | `full` / `partial` / `none` | — |
| billsIncluded | `yes` / `no` / `partial` | — |
| sixMonthOk | `yes` / `no` — will the owner accept a 6-month lease? | unknown |
| depositMonths | usually `2` | — |
| photoOrigin | `mark` (you shot it) / `owner` / `agent` / `none` | — |

## Rules that apply to every row, from CODEX-AUDIT-BRIEF.md §2

- **Never guess a number.** Blank is fine; invented is not. A blank cell means
  the page says nothing. A wrong cell means the page lies.
- **photoOrigin is not optional.** A listing with no real unit photo cannot
  publish a photo chip at all, and must never show a `/bangkok/*.jpg` stock
  skyline captioned as owner-supplied. That is described in the audit as "the
  single fastest way to be filed as a scam via reverse image search."
- **sixMonthOk is the column that matters most for this audience.** An exchange
  student needs exactly 6 months. A building that only does 12-month leases is
  not a listing for them, however good it looks.
