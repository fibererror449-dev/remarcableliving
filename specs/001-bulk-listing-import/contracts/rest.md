# REST contract — agent imports (v1)
Source of truth: lib/agent-api.ts, lib/imports/*.ts. Covered by tests/import-api.test.mjs and
tests/import-helper.test.mjs. Paths are relative to the site origin (SITE_URL).

## Authentication
- `Authorization: Bearer rli_…` — credential issued by an admin in /admin/imports (1–90 days, revocable).
  Only a hash is stored; the token is shown once. Agents cannot publish or manage credentials.
- Scopes: GET needs `listings:read`; POST /api/v1/media needs `media:write`; other POSTs need
  `listings:write`. Issued credentials currently carry all three.
- Kill switch: unless `IMPORTS_ENABLED=1`, every agent call returns 503
  `Agent imports are disabled`.

## Errors
JSON `{error, details?}`, `cache-control: no-store`. `details` is an array of messages when present.
| Status | Meaning |
| --- | --- |
| 400 | Malformed JSON, batch shape, missing Idempotency-Key, bad upload headers/length |
| 401 | Missing, unknown, expired or revoked credential (or owner no longer an admin) |
| 403 | Credential lacks the scope |
| 404 | Unknown endpoint, import, draft or media |
| 409 | Idempotency-Key reused with different content (final) · `Concurrent import busy…` (retry) |
| 413 | JSON body over 1 MiB · file over 50 MiB or longer than its Content-Length |
| 415 | JSON endpoint without `application/json` · unsupported media type · bytes don't match type |
| 503 | Imports disabled, or storage temporarily unavailable (retry) |
The two 409s differ only in message text; clients retry when it contains `busy`.

## Listing rows
`{reference, name, …facts, media?, coverId?}` — reference 1–120 chars (trimmed), name 1–200.
Optional facts and limits: GET /api/v1/listing-schema. Unknown fields are errors; missing facts are
not, they become publication `blockers`. `media`: ≤60 `{id, caption? (≤500), attribution:
owner|agent|admin}`, no repeated id. A reference repeated within one request is invalid.

## Endpoints
**GET /api/v1/listing-schema** → 200 `{version, requiredForDraft, requiredForPublication, fields,
limits:{listings:50, jsonBytes:1048576, fileBytes:52428800}, example}`.

**POST /api/v1/imports/validate** — body `{namespace, listings[1..50]}`, ≤1 MiB, no other keys;
namespace `^[a-zA-Z0-9][a-zA-Z0-9._-]{0,119}$`. Writes nothing. 400 if the batch shape is wrong.
→ 200 `{results:[{index, outcome:'valid'|'invalid', errors[], blockers[]}]}`. `blockers` lists
missing publication fields only; attachment problems appear on the draft (below).

**POST /api/v1/imports** — same body plus header `Idempotency-Key` (1–200 chars).
→ 201 `{id, complete, results[]}`, in row order; `index` is the position in this request:
- `{index, reference, outcome:'created'|'updated'|'unchanged', draftId, reviewUrl}`; `reviewUrl`
  is a relative admin path (`/admin/imports/<draftId>`).
- `{index, outcome:'invalid', errors[]}` — no reference or draft. Other rows still commit.
Semantics:
- Keys are scoped to the credential. Same key + same content (canonical JSON, key order ignored)
  returns the original result with 201, including after a partial failure (finished rows are kept,
  the rest continue). Same key + different content → 409, final.
- Identity is (namespace, reference). `created`: first draft. `updated`: new pending revision; any
  older pending draft becomes superseded. `unchanged`: same payload as the current draft, which is
  returned. Each row's draft and result commit together. Nothing is published.
- 409 `busy` and 503 are safe to retry with the same key and body.

**GET /api/v1/imports/:id** → 200, same shape as the POST result.

**GET /api/v1/drafts/:id** → 200 `{id, revision, state:'pending'|'published'|'rejected'|
'superseded', current, namespace, reference, payload, attachments[], blockers[], published}`.
`attachments` lists `{id, mime, size, name}` for the draft's media. `blockers` adds
attachment problems (`Unknown attachment: <id>`, `Cover must be a photo`, `Cover must be included
in media`). `published` is the live listing's facts or null. Other stored columns may appear.

**POST /api/v1/media** — raw bytes, ≤50 MiB. Headers: `content-type` one of image/jpeg, image/png,
image/webp, image/gif, video/mp4, video/webm, video/quicktime; `content-length` (required, ≥1);
`x-file-name` (optional, URI-encoded, kept to 180 chars). Bytes are checked against the type.
→ 201 `{id, mime, size, name, url:'/api/v1/media/<id>'}`. Identical bytes from the same credential
return the first upload's record (same id), so retries are safe. Media stays private until a
listing using it is published.

**GET|HEAD /api/v1/media/:id** → bytes, `cache-control: private, no-store`; `Range: bytes=a-b`
→ 206, unsatisfiable → 416.

## Limits
50 rows and 1 MiB per JSON request; 60 attachments per listing; 50 MiB per file.

## Admin endpoints (browser session, same-origin writes)
Signed-in allowed admin only; non-GET requests must carry this site's `Origin`. Agents get 401.
- `GET /api/admin/imports/drafts` → current revision per unit · `GET|PATCH /api/admin/imports/drafts/:id`
  (PATCH takes a full payload and appends a revision) · `POST …/:id/publish` (422 blockers, 409 stale)
  · `POST …/:id/reject` · `GET|HEAD /api/admin/imports/media/:id`.
- `GET|POST /api/admin/imports/credentials`, `DELETE …/:id` (revoke). GET adds `importsEnabled`.
- `GET|POST /api/admin/imports/oauth-clients`, `DELETE …/:id` (revokes every grant): see oauth.md.
- Published media: `GET|HEAD /listing-media/:id`, public only once a published listing uses it,
  `cache-control: public, max-age=300`, ranges as above.
