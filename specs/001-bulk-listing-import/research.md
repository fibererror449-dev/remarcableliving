# Research and decisions
- Spec Kit CLI 1.0.6 installed locally; Codex skills integration initialized in-place.
- Use separate draft JSON revisions: preserves current non-null published schema and public queries.
- Prefer Miniflare D1/R2 over mocks; no database queries as behavioral assertions.
- Use source generation + atomic SQL batch guards rather than process-local locks (Workers concurrent).
- MCP: stateless Streamable HTTP JSON; notifications 202; GET 405; negotiate supported versions.
- OAuth: D1-backed opaque hashed codes/tokens; existing SIWC consent. Canonical issuer from config;
  PKCE S256; resource binding; explicit callback registration; one-use consent; refresh reuse revocation.
- Admin-managed OAuth client registration avoids unbounded public registration and supports exact
  connection-specific callbacks. No CIMD advertised. No arbitrary remote metadata requests.
- Sources: https://modelcontextprotocol.io/specification/2025-11-25/basic/authorization
  https://modelcontextprotocol.io/specification/2025-11-25/basic/transports
  https://developers.openai.com/plugins/build/auth
  https://support.claude.com/en/articles/11175166-get-started-with-custom-connectors-using-remote-mcp
  https://github.com/mattpocock/skills/blob/main/skills/engineering/tdd/SKILL.md
- Public interfaces confirmed by user: REST, MCP, admin review/publish UI, public listing pages.
