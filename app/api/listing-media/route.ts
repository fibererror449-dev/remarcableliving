import { env } from "cloudflare:workers";
import { getAdminUser, isSameOrigin } from "../../../lib/admin";
import { adminActorFor, apiErrorResponse, registerLibraryMedia } from "../../../lib/admin-listings";
import type { ImportEnv } from "../../../lib/imports/core";
import { storeMedia } from "../../../lib/imports/media";

/**
 * Adds a photo or video for the listing form. Send the raw file (Content-Type set to its media
 * type, X-File-Name URL-encoded) to upload it, or JSON {"libraryKey": "uploads/…"} to reuse a
 * media-library file. Either way the reply's id goes into the listing's media list; the file
 * stays private until a saved listing uses it.
 */
export async function POST(request: Request) {
  const user = await getAdminUser();
  if (!user) return Response.json({ error: "Admin access required" }, { status: 403 });
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid request origin" }, { status: 403 });
  const storage = env as unknown as ImportEnv;
  try {
    if (request.headers.get("content-type")?.startsWith("application/json")) {
      const body = await request.json().catch(() => ({})) as { libraryKey?: unknown };
      return Response.json({ item: await registerLibraryMedia(storage, body.libraryKey) }, { status: 201 });
    }
    const size = Number(request.headers.get("content-length"));
    if (!Number.isSafeInteger(size) || size < 1 || !request.body) return Response.json({ error: "Choose a non-empty file and try again." }, { status: 400 });
    let name: string;
    try { name = decodeURIComponent(request.headers.get("x-file-name") || "upload"); }
    catch { return Response.json({ error: "Invalid filename" }, { status: 400 }); }
    const { id, mime, size: stored, name: storedName } = await storeMedia(storage, adminActorFor(user), { mime: request.headers.get("content-type") ?? "", size, name, body: request.body });
    return Response.json({ item: { id, mime, size: stored, name: storedName } }, { status: 201 });
  } catch (error) { return apiErrorResponse(error, "Upload failed. Your file has not been added; please retry."); }
}
