# OAuth contract — chat-client connections
Source of truth: lib/imports/oauth.ts. Covered by tests/import-mcp.test.mjs and
tests/import-browser.test.mjs. Issuer and resource come from `SITE_ORIGIN` (fallback: request origin).

## Discovery
- `GET /.well-known/oauth-protected-resource[/mcp]` → `{resource:<origin>/mcp,
  authorization_servers:[<origin>], scopes_supported, bearer_methods_supported:['header']}`.
- `GET /.well-known/oauth-authorization-server` → issuer, `/oauth/authorize`, `/oauth/token`,
  response type `code`, grants `authorization_code` + `refresh_token`, PKCE `S256` only, token auth
  `none | client_secret_post | client_secret_basic`, `authorization_response_iss_parameter_supported`.
  No registration endpoint and no client ID metadata documents: clients are registered by an admin.

## Clients
Admin registers `{name, redirectUris[1..5]}` (https, or http on localhost; no fragments) under
/admin/imports → `{id, clientSecret}`; the secret is shown once and stored hashed. Redirect URIs are
matched exactly. A client that sends a secret must send the right one; public clients rely on PKCE.
Revoking a client revokes all its grants immediately.

## Authorization code flow
1. `GET /oauth/authorize?response_type=code&client_id&redirect_uri&code_challenge&
   code_challenge_method=S256&state?&scope?&resource?`. Unknown client or unregistered redirect →
   400 page, never a redirect. Other errors redirect with `error`, `state`, `iss`. `resource`
   defaults to and must equal `<origin>/mcp`. Default scopes: listings:read listings:write media:write.
2. Not signed in → 302 `/signin-with-chatgpt?return_to=…`. Signed in but not an admin → 403.
   Admin → consent page (no framing) with a one-use consent token valid 10 minutes.
3. `POST /oauth/authorize` (same origin, same admin) `consent, decision=allow|deny` → 302 to the
   callback with `code` (one-use, 5 minutes) or `error=access_denied`, plus `state` and `iss`.
4. `POST /oauth/token` (form) `grant_type=authorization_code, code, redirect_uri, client_id,
   code_verifier, resource?` → `{access_token (1 h), token_type:'Bearer', expires_in, refresh_token
   (30 days), scope}`. The first attempt consumes the code; replaying a redeemed code revokes the
   grant it created.
5. `grant_type=refresh_token, refresh_token, client_id` rotates both tokens. Replaying a used refresh
   token revokes the grant. Errors: 400 `invalid_request|invalid_grant|unsupported_grant_type`,
   401 `invalid_client`.
All codes, consents and tokens are random 256-bit values stored as SHA-256 hashes. Access also
requires the owner to remain in ADMIN_EMAILS. Kill switch off → 503 on /oauth/*.
