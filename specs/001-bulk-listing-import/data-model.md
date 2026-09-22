# Data model
Existing listings remains the published projection; add integer publication version (default 0).
import_sources: UUID, namespace, reference, current draft, generation, optional listing ID.
listing_drafts: UUID, source ID, revision, payload JSON/hash, baseline listing version, state, actor/time.
import_jobs: UUID, actor, idempotency key, payload hash, row count/time.
import_rows: job + index unique, durable outcome JSON; row and side effects commit together.
import_media: UUID, actor, content hash unique per actor, private object key, MIME/size/name/time.
listing_media: listing + attachment + position, caption, attribution, cover flag; public projection.
agent_credentials: UUID, owner email, name, token hash, scopes, expiry/revocation.
oauth_clients: UUID, name, exact redirect list. oauth_consents/codes/grants/tokens: hashed opaque
values, client/resource/scopes/admin binding, expiration and consumed/revoked markers.
import_audit: event UUID, actor/action/source/draft/import IDs and time. No payloads or credentials.
Validation: source namespace and reference 1–120 chars, name 1–200; strict optional typed property
facts; no unknown fields; missing publish requirements reported separately from malformed input.
Transitions: pending → published/rejected/superseded. Edits append pending revision, never mutate one.
