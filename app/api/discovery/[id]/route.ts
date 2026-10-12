import { env } from "cloudflare:workers";
import { getAdminUser, isSameOrigin } from "../../../../lib/admin";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await getAdminUser())) return Response.json({ error: "Sign in required" }, { status: 401 });
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid request origin" }, { status: 403 });
  const id = Number((await params).id);
  if (!Number.isSafeInteger(id) || id <= 0) return Response.json({ error: "Invalid place" }, { status: 400 });
  const body: unknown = await request.json().catch(() => null);
  if (!body || typeof body !== "object" || !("description" in body) || typeof body.description !== "string" || !body.description.trim() || body.description.length > 5000) return Response.json({ error: "Description must contain 1–5000 characters" }, { status: 400 });
  const result = await env.DB.prepare("UPDATE discovery_places SET description=? WHERE id=?").bind(body.description.trim(), id).run();
  return result.meta.changes ? Response.json({ ok: true }) : Response.json({ error: "Place not found" }, { status: 404 });
}
