import { env } from "cloudflare:workers";
import { getAdminUser, isSameOrigin } from "../../../../lib/admin";
import { adminActorFor, apiErrorResponse, getAdminListing, saveListing } from "../../../../lib/admin-listings";
import type { ImportEnv } from "../../../../lib/imports/core";
import { ensureListings } from "../../../../lib/listings";

type Context = { params: Promise<{ id: string }> };
const listingId = async (context: Context) => { const id = Number((await context.params).id); return Number.isSafeInteger(id) && id > 0 ? id : null; };

/** Everything the edit form needs: facts, ordered attachments and any hand-curated gallery. */
export async function GET(_request: Request, context: Context) {
  if (!(await getAdminUser())) return Response.json({ error: "Sign in required" }, { status: 401 });
  const id = await listingId(context);
  if (!id) return Response.json({ error: "Listing not found" }, { status: 404 });
  try { return Response.json(await getAdminListing(env as unknown as ImportEnv, id), { headers: { "cache-control": "no-store" } }); }
  catch (error) { return apiErrorResponse(error, "Could not load the listing. Please retry."); }
}

/** Replaces the listing's facts, cover, video link and ordered photos and videos. */
export async function PUT(request: Request, context: Context) {
  const user = await getAdminUser();
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid request origin" }, { status: 403 });
  const id = await listingId(context);
  if (!id) return Response.json({ error: "Listing not found" }, { status: 404 });
  try {
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!body || typeof body !== "object" || Array.isArray(body)) return Response.json({ error: "Expected a JSON object" }, { status: 400 });
    return Response.json(await saveListing(env as unknown as ImportEnv, adminActorFor(user), id, body));
  } catch (error) { return apiErrorResponse(error, "Could not save the listing. Your changes are still in the form; please retry."); }
}

export async function PATCH(request: Request, context: Context) {
  if (!(await getAdminUser())) return Response.json({ error: "Sign in required" }, { status: 401 });
  const { id } = await context.params;
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid request origin" }, { status: 403 });
  const body = await request.json() as { status?: string };
  if (!body.status || !["available", "viewing", "rented", "verify"].includes(body.status)) return Response.json({ error: "Invalid status" }, { status: 400 });
  await ensureListings();
  await env.DB.prepare("UPDATE listings SET status = ?, publication_version = publication_version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ?").bind(body.status, Number(id)).run();
  return Response.json({ ok: true });
}
