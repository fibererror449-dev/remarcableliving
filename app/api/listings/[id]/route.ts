import { env } from "cloudflare:workers";
import { getChatGPTUser } from "../../../chatgpt-auth";
import { ensureListings } from "../../../../lib/listings";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  if (!(await getChatGPTUser())) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id } = await context.params;
  const body = await request.json() as { status?: string };
  if (!body.status || !["available", "viewing", "rented", "verify"].includes(body.status)) return Response.json({ error: "Invalid status" }, { status: 400 });
  await ensureListings();
  await env.DB.prepare("UPDATE listings SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(body.status, Number(id)).run();
  return Response.json({ ok: true });
}
