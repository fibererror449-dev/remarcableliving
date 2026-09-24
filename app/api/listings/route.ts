import { env } from "cloudflare:workers";
import { getAdminUser, isSameOrigin } from "../../../lib/admin";
import { adminActorFor, apiErrorResponse, listAdminListings, saveListing } from "../../../lib/admin-listings";
import type { ImportEnv } from "../../../lib/imports/core";
import { listListings } from "../../../lib/listings";

export async function GET(request: Request) {
  const includeClosed = new URL(request.url).searchParams.get("admin") === "1";
  if (!includeClosed) return Response.json({ listings: await listListings(false) });
  if (!(await getAdminUser())) return Response.json({ error: "Sign in required" }, { status: 401 });
  // Admin view: every listing with the photo count and video its public page shows.
  return Response.json({ listings: await listAdminListings(env as unknown as ImportEnv) }, { headers: { "cache-control": "no-store" } });
}

export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user) return Response.json({ error: "Sign in required" }, { status: 401 });
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid request origin" }, { status: 403 });
  try {
    const body = await request.json().catch(() => null) as Record<string, unknown> | null;
    if (!body || typeof body !== "object" || Array.isArray(body)) return Response.json({ error: "Expected a JSON object" }, { status: 400 });
    return Response.json(await saveListing(env as unknown as ImportEnv, adminActorFor(user), null, body), { status: 201 });
  } catch (error) { return apiErrorResponse(error, "Could not add the listing. Please retry."); }
}
