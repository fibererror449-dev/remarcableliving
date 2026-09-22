# Feature Specification: Bulk listing imports

**Feature Branch**: `codex/bulk-listing-import`
**Created**: 2026-09-22
**Status**: Approved for implementation
**Input**: Implement the approved bulk import plan with Spec Kit and Matt Pocock TDD.

## User Scenarios & Testing
### User Story 1 — Agent prepares inventory (P1)
An admin delegates extraction from Drive to a coding or chat agent. The agent submits known facts
and retrieves draft outcomes without making anything public.
**Independent test**: issue a credential, submit a name/unit reference, retrieve an incomplete draft.
**Acceptance**: unauthorized callers fail; missing facts are reported, not invented; invalid rows do
not prevent valid rows succeeding; retries return the original result; updates use stable unit identity.

### User Story 2 — Admin reviews and publishes (P1)
The admin sees differences, completes facts, reviews media and publishes or rejects a revision.
**Independent test**: publish a complete draft and inspect its public page, then submit an update.
**Acceptance**: drafts remain private; live content stays unchanged pending approval; stale reviews
cannot overwrite newer changes; agents cannot publish; approved galleries and videos display correctly.

### User Story 3 — Agents transfer media and connect (P2)
Agents upload photos/videos, preserve attribution and use chat tools or a command-line helper.
**Independent test**: upload, attach, retrieve through an authorized draft, publish and play a video.
**Acceptance**: private media stays private; valid ranges work; oversize/unsupported uploads fail;
revoked credentials stop working; all clients share the same business rules.

### Edge Cases
Concurrent imports/retries; duplicate unit references; partial failures; malformed numbers, dates,
JSON or URLs; missing media; stale publication; expired/revoked authorization; source-link leakage.

## Requirements
- **FR-001** Authenticate agents with scoped, expiring, revocable access; admin alone manages access.
- **FR-002** Save incomplete drafts with source namespace, stable unit reference and name.
- **FR-003** Validate at most 50 rows/1 MiB, return per-row results and publication blockers.
- **FR-004** Deduplicate identical submissions and retries; changed data becomes a new revision.
- **FR-005** Human edit/reject/publish flow with differences and atomic stale-safe publication.
- **FR-006** Ordered real photos, cover selection, attribution and videos; 50 MiB maximum per file.
- **FR-007** Separate private draft/provenance/media from public listing and media delivery.
- **FR-008** Equivalent authenticated REST and MCP capabilities, plus resilient Node import helper.
- **FR-009** Storage failures are explicit; no fallback inventory masquerading as successful writes.
- **FR-010** Preserve legacy public/admin behavior and separate imported inventory.
- **FR-011** Audit history and an agent-import kill switch initially disabled.

### Key Entities
Source unit; draft revision; published listing; attachment; import job/row; credential; OAuth client,
consent/code/grant; audit event.

## Success Criteria
- **SC-001** Mixed batches report every row; replay creates zero duplicates.
- **SC-002** No unpublished fact or media is visible through anonymous public access.
- **SC-003** Approved content appears on public pages and sitemap; pending edits do not change it.
- **SC-004** Admin can review in the browser; an agent cannot publish.
- **SC-005** Both chat clients complete an authenticated connected draft-import smoke test.
- **SC-006** Existing rendering and admin regression tests pass.

## Clarifications — 2026-09-22
User chose review; create/update; both agent types; agent-owned Drive access; photos and videos;
incomplete drafts; helper fallback; all four public test seams.

## Assumptions
Stable unit IDs come from source, not building names. Provenance is private. No Drive sync,
OCR service, video transcoding, app-directory submission or geocoding. Existing units may be linked
explicitly by an admin; identity is never guessed. Chat access depends on provider account settings.
