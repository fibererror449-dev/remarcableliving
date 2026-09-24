# How to use the listing import API
Wire formats: rest.md, helper.md, mcp.md, oauth.md. Nothing works until production has the
migrations applied and `IMPORTS_ENABLED=1` (see ../verification.md).

## For the admin
1. Sign in at /admin/imports. Under Agent access, create a credential and copy the `rli_…` token
   (shown once). For Claude or ChatGPT, register the app's exact callback under Chat connections and
   give the app the server URL `https://www.remarcableliving.co/mcp`, the client ID and the secret.
2. Give your agent a prompt from /admin/help plus the token (or the connected app) and the Drive folders.
3. Review each draft from the agent's report at /admin/imports: fill in the missing facts, check the
   photos and cover, then publish or reject. Agents cannot publish.

## Agent prompt
The prompt now lives in `lib/agent-guides.ts`: `fullAgentGuide` is the complete brief that used to be
here, and `agentJobs` holds one short, self-contained brief per job (MCP, REST, create, edit, media,
bulk import, checking an import). Admins copy them from the "For AI agents" section of /admin/help.
