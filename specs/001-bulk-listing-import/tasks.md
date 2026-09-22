# Tasks: Bulk listing imports
## Setup and foundations
- [x] T001 Initialize Spec Kit and record approved contract in specs/001-bulk-listing-import/spec.md.
- [x] T002 Add local Worker HTTP test harness in tests/import-harness.mjs.
## US1 — Agent prepares inventory (FR-001–004,009)
- [x] T003 [US1] Red/green credential-to-draft HTTP flow in tests/import-api.test.mjs and lib/agent-api.ts.
- [x] T004 [US1] Red/green validation of partial facts in lib/imports/validation.ts.
- [x] T005 [US1] Red/green replay, concurrency and revision persistence in lib/imports/service.ts.
## US3 — Media transfer (FR-006,007)
- [x] T006 [US3] Red/green private uploads, deduplication and ranges in lib/imports/media.ts.
## US2 — Review and publication (FR-005,007,010)
- [x] T007 [US2] Red/green stale-safe publication and review in lib/imports/service.ts.
- [x] T008 [US2] Red/green browser review in app/admin/ImportReview.tsx and tests/import-browser.test.mjs.
- [x] T009 [US2] Red/green approved public gallery rendering in app/residences/[slug]/page.tsx.
## US3 — Client connections (FR-001,008)
- [x] T010 [US3] Red/green OAuth and MCP HTTP contract in lib/imports/oauth.ts and lib/imports/mcp.ts.
- [x] T011 [US3] Red/green resumable helper in scripts/import-listings.mjs; publish contracts/ and quickstart.md.
## Rollout and convergence (FR-011, SC-001–006)
- [x] T012 Review tests, types, existing rendering; reconcile specs and code in verification.md.
- [ ] T013 Deploy additive migrations with agent access disabled; verify hosted authentication.
      Pending: needs production access; preconditions in verification.md.
- [ ] T014 Verify connected Claude and ChatGPT import, then record convergence evidence.
      Pending: needs the owner's Claude and ChatGPT accounts.

Dependency order follows task order, except media precedes review by design. Each task contains
multiple vertical cycles: write ONE behavior test, observe failure, implement, repeat. Do not write
all tests first. Independent read-only protocol research can run alongside foundations; implementation
stays sequential. First independently useful increment is credential + incomplete draft retrieval.
