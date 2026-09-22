# Implementation Plan: Bulk listing imports
## Summary
Implement the approved import → draft → review → publish flow. Retain vinext, Sites D1/R2 and SIWC.
## Technical Context
TypeScript, React, Cloudflare Worker fetch routes; prepared D1 statements; R2 streaming media.
Tests: node:test + Miniflare HTTP integration, existing rendering tests, Playwright browser flow.
## Constitution Check
PASS: drafts isolated, missing facts retained, agent privilege separated, additive migrations,
public interfaces approved by user, no Drive credentials. No complexity exception.
## Project Structure
lib/imports contains schema validation, persistence, authentication, media and OAuth services.
lib/agent-api.ts dispatches HTTP at the Worker boundary; browser routes use existing admin auth.
Admin import UI extends /admin. Public pages load approved attachment metadata.
## Design
- D1 source identity unique(namespace, reference); append-only draft versions, one current pointer.
- Import request key unique(actor,key), request hash; each row commits result and draft in one batch.
- Optimistic compare-and-swap source generation; retry conflicts. Publication batch uses a database
  guard to fail atomically when current draft or live version differs from the reviewed baseline.
- Keep draft payload as canonical JSON; validate supplied fields strictly, allow missing fields.
- Media content hashes scoped to actor deduplicate retries; stream bytes to private R2 prefix.
- Browser admin issues scoped credentials; hashes only. MCP OAuth uses D1 opaque tokens,
  PKCE S256, one-use code/consent, rotating refresh grants; existing SIWC handles identity.
- Feature flag IMPORTS_ENABLED gates agent calls. Admin review remains available for rollback.
- REST and stateless MCP share application services. Agent tools never publish/manage credentials.
## Rollout
Additive migrations; deploy flag off. Verify edge header/auth behavior, enable small smoke import,
then validate actual chat clients. Do not record external checks as passed without evidence.
## Sources
Spec Kit 1.0.6; mattpocock/skills engineering/tdd (2026-09-22 source; pinned revision in research).
