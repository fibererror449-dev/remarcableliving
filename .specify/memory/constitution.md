# REMARCABLE LIVING Constitution

## Core Principles
### I. Preserve published behavior
Existing listings, curated pages, browser administration and imported inventory MUST remain compatible.
Imported changes MUST stay in separate drafts until an authorized human publishes them.
### II. Evidence before publication
Unknown facts MUST remain absent. Publication MUST validate required facts and a real cover photo.
Private provenance MUST NOT become public copy. Availability and approval are separate.
### III. Test first at agreed boundaries
Use Matt Pocock TDD: one failing behavior test, then minimal implementation. Review/refactor with
passing tests. Approved seams: REST, MCP, admin browser UI and public pages. Prefer local D1/R2;
do not mock internal modules or assert private implementation details.
### IV. Least privilege and safe repetition
Agents MUST NOT publish or administer credentials. Credentials MUST expire and be revocable.
Imports MUST use stable source/unit identity and idempotency. No secrets in source or diagnostics.
### V. Durable and observable operations
Migrations own schema changes. Writes MUST fail explicitly on storage errors. Audit actor and
outcome, never raw documents or secrets. Publication MUST be atomic and reject stale drafts.

## Technology constraints
Retain Sites, Worker-compatible TypeScript, D1, R2 and admin sign-in. Agents access Drive; the site
neither stores Google credentials nor fetches arbitrary supplied URLs.

## Development workflow
Constitution → specify → clarify → plan → checklist → tasks → analyze → implement → converge.
Keep a living contract and truthful verification records. Deploy agent imports disabled initially.

## Governance
User instructions take precedence. Amendments record rationale and use semantic versioning.
Review every feature against these principles. This is the initial constitution, version 1.0.0.

**Version**: 1.0.0 | **Ratified**: 2026-09-22 | **Last Amended**: 2026-09-22
