# MCP contract — agent imports
Source of truth: lib/imports/mcp.ts. Covered by tests/import-mcp.test.mjs.

## Transport
Stateless Streamable HTTP at `<SITE_ORIGIN>/mcp`. `POST` one JSON-RPC 2.0 message
(`application/json`, ≤8 MiB) → JSON reply; no sessions, no SSE. Notifications and responses → 202.
`GET`/`DELETE` → 405. `OPTIONS` answers CORS preflight (`*`, no cookies). Versions 2025-11-25,
2025-06-18, 2025-03-26: `initialize` echoes a supported version, otherwise answers 2025-11-25; an
unsupported `MCP-Protocol-Version` header → 400. Kill switch off → 503.

## Authorization
`Authorization: Bearer` with either an OAuth access token bound to this resource (oauth.md) or an
admin-issued `rli_` API credential. Missing or invalid → 401 with
`WWW-Authenticate: Bearer resource_metadata="<origin>/.well-known/oauth-protected-resource/mcp"`.
A tool outside the connection's scopes returns an `isError` result.

## Methods
`initialize`, `ping`, `tools/list`, `tools/call`; anything else → -32601.

## Tools
Same services and rules as REST (rest.md). Results carry `structuredContent` plus the same JSON as
text; business errors (validation, 404, 409, 413, 415) are `isError: true` results, not RPC errors.
| Tool | Scope | Arguments | Result |
| --- | --- | --- | --- |
| get_listing_schema | listings:read | — | as GET /api/v1/listing-schema |
| validate_listings | listings:write | namespace, listings[1..50] | as POST /api/v1/imports/validate |
| import_listings | listings:write | namespace, listings, idempotencyKey | as POST /api/v1/imports, `reviewUrl` absolute |
| get_import | listings:read | importId | as GET /api/v1/imports/:id, `reviewUrl` absolute |
| get_draft | listings:read | draftId | as GET /api/v1/drafts/:id |
| upload_media | media:write | fileName, mimeType, dataBase64 (≤5 MiB decoded) | as POST /api/v1/media |
No tool publishes, rejects, edits drafts or manages credentials or connections. Files over 5 MiB go
through the REST helper (helper.md).
