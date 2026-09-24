# Verification — 2026-09-22
Local evidence only. External checks (T013, T014) are pending and must not be read as passed.

## Commands (all green)
- `npm test` — build, then 41 node:test cases: 39 pass, 2 skipped (pre-existing Centric Ari media
  skips in rendered-html). Suites: rendered-html (existing pages), import-api (REST), import-mcp
  (OAuth + MCP), import-helper (CLI helper), import-public (public pages), import-browser
  (Playwright admin UI; needs `npx playwright install chromium` once).
- `npx tsc --noEmit` — clean (fixed a Cloudflare type clash that broke `worker/index.ts`).
- `npm run lint` — 12 errors / 10 warnings, all in files this feature does not add (docs/arcs-to-
  bangkok, existing residence video caption); the one new warning is `<img>` in the review preview,
  the same pattern MediaLibrary uses.
- Mutation checks on OAuth: removing refresh-reuse revocation, code-replay revocation, PKCE verifier
  comparison, consent one-use or client-revocation checks each fails a test.

## Requirements → evidence
| Req | Evidence |
| --- | --- |
| FR-001 | import-api: admin-only issue, revoke blocks; import-mcp: scoped OAuth, expiry, revocation |
| FR-002, FR-003 | import-api: incomplete draft, mixed rows, 50 rows / 1 MiB; import-helper: batching |
| FR-004 | import-api: concurrent replay, 409 on changed key, new revision; import-helper: resume |
| FR-005 | import-api: stale publish 409; import-browser: edit, reject, complete, publish |
| FR-006 | import-api: upload, dedupe, ranges, 415; import-public: ordered photos, cover, video, attribution |
| FR-007 | import-api/import-public: unpublished media 404 publicly; provenance absent from public HTML |
| FR-008 | import-mcp: same services via MCP tools; import-helper: resilient Node helper |
| FR-009 | Storage errors → 503 JSON, no fallback writes (agent-api catch-all) |
| FR-010 | rendered-html suite unchanged and passing; curated galleries untouched |
| FR-011 | `import_audit` rows for every write; IMPORTS_ENABLED off → 503 (import-mcp) |
| SC-001–004, SC-006 | As above; admin browser review and publish proven in Playwright |
| SC-005 | **Pending (T014).** Needs real Claude and ChatGPT connector runs |

## Decisions and known limits
- Agents read any draft by id (all credentials belong to admins); provenance is private, not per-agent.
- The two 409s (key reuse vs busy) differ only in message text; the helper matches `busy`.
- The kill switch returns 503, so clients retry briefly before giving up.
- `validate` reports missing facts only; attachment problems surface on the draft.
- MCP uploads are capped at 5 MiB (base64 in JSON); larger files use the helper (≤50 MiB).
- OAuth accepts public clients (PKCE) and optional client secrets; no dynamic registration.

## Rollout preconditions (T013)
1. Apply migrations 0002–0006 to production D1 before or with the deploy. `PATCH
   /api/listings/:id` now bumps `publication_version`, so existing status changes fail until 0003 runs;
   the admin listing editor and import publishing write `video_url`, which 0006 adds.
2. Set `SITE_ORIGIN=https://www.remarcableliving.co`; leave `IMPORTS_ENABLED` unset (off).
3. Confirm the Sites edge strips client-sent `oai-authenticated-*` headers (admin auth relies on it)
   and that `/signin-with-chatgpt?return_to=/oauth/authorize…` returns to the consent page.
4. Then set `IMPORTS_ENABLED=1`, import one draft with the helper, and verify privacy.

## Pending external checks (T014)
Register Claude (`https://claude.ai/api/mcp/auth_callback`) and ChatGPT callbacks as shown in each
client, connect `<SITE_ORIGIN>/mcp`, import one draft from each, refresh after an hour, revoke, and
record results here. Not yet performed.


## Cleanup review — 2026-09-23
PR #10 was already merged at 8be89a7. Reviewed the merged implementation before first deployment.
- Fixed MCP Origin validation (foreign browser origins rejected; headerless server clients allowed).
- Made authorization-code consumption + grant/token issuance one atomic D1 batch, and refresh
  consumption + rotation one atomic batch. Concurrent/replayed codes revoke the resulting grant.
- Bound refresh requests to their original resource and granted scopes.
- Enforced OAuth form sizes on actual streamed bytes, including bodies without Content-Length.
- Rejected non-string enum values instead of accepting arrays through string coercion.
- Added five public-interface regressions for these cases. TypeScript check passed. Full `npm test` passed:
  46 tests, 44 passed, 2 existing skips, 0 failures.
- Read-only production check: spoofed oai-authenticated headers on /api/media received 403.
- Deployment preserves public audience and leaves IMPORTS_ENABLED=0 until account smoke testing.
