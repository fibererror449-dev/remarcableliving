# Quickstart
1. `npx playwright install chromium` once, then `npm test` (builds; applies migrations to local D1).
2. Sign in to /admin/imports as an allowed admin; create an expiring API credential.
3. Set SITE_URL and IMPORT_API_TOKEN only in your shell. Agent fetches files from Drive locally.
4. Run scripts/import-listings.mjs --validate-only, then without it to upload files and submit
   batches (≤50 rows, ≤1 MiB). Re-run after any interruption; it resumes (contracts/helper.md).
5. Open the returned review links; complete missing facts, choose real cover photo and publish.
6. Under Chat connections, register the client's exact callback; give it the server URL, client ID
   and secret (contracts/oauth.md, contracts/mcp.md).
7. Confirm draft privacy and refresh/revocation behavior in both clients before wider rollout.
See contracts/ for wire formats. Feature flag IMPORTS_ENABLED defaults off; set to 1 for agent tests.
Live external chat checks require user-account access; local protocol tests alone are insufficient.
