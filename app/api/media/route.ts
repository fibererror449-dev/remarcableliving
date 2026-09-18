import { env } from "cloudflare:workers";
import { getAdminUser, isSameOrigin } from "../../../lib/admin";
import { MAX_UPLOAD_BYTES, MEDIA_TYPES } from "../../../lib/uploads";

const bucket = () => (env as unknown as { MEDIA: R2Bucket }).MEDIA;
export async function GET(request: Request) {
  if (!(await getAdminUser())) return Response.json({ error: "Admin access required" }, { status: 403 });
  try {
    const cursor = new URL(request.url).searchParams.get("cursor") || undefined;
    const options = { prefix: "uploads/", limit: 40, cursor, include: ["httpMetadata", "customMetadata"] };
    const result = await bucket().list(options);
    return Response.json({ items: result.objects.map((object) => ({
      key: object.key, url: `/media/${object.key.slice(8)}`, name: object.customMetadata?.name || object.key,
      type: object.httpMetadata?.contentType || "application/octet-stream", size: object.size, uploaded: object.uploaded.toISOString(),
    })), cursor: result.truncated ? result.cursor : null }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    console.error("Media library unavailable", error);
    return Response.json({ error: "Media storage is unavailable. Please try again." }, { status: 503 });
  }
}

export async function POST(request: Request) {
  if (!(await getAdminUser())) return Response.json({ error: "Admin access required" }, { status: 403 });
  if (!isSameOrigin(request)) return Response.json({ error: "Invalid request origin" }, { status: 403 });
  const type = request.headers.get("content-type") || "";
  const extension = MEDIA_TYPES[type];
  if (!extension) return Response.json({ error: "Choose a JPG, PNG, WebP, GIF, MP4, WebM or MOV file." }, { status: 415 });
  const size = Number(request.headers.get("content-length"));
  if (!Number.isSafeInteger(size) || size <= 0 || !request.body) return Response.json({ error: "Choose a non-empty file and try again." }, { status: 400 });
  if (size > MAX_UPLOAD_BYTES) return Response.json({ error: "Files must be 50 MB or smaller." }, { status: 413 });
  let name: string;
  try { name = decodeURIComponent(request.headers.get("x-file-name") || "upload").slice(0, 180); }
  catch { return Response.json({ error: "Invalid filename" }, { status: 400 }); }
  const id = `${crypto.randomUUID()}.${extension}`;
  const key = `uploads/${id}`;
  try {
    // Stream directly to storage; do not buffer videos in the Worker.
    await bucket().put(key, request.body, { httpMetadata: { contentType: type, cacheControl: "public, max-age=31536000, immutable" }, customMetadata: { name } });
    return Response.json({ item: { key, url: `/media/${id}`, name, type, size, uploaded: new Date().toISOString() } }, { status: 201 });
  } catch (error) {
    console.error("Media upload failed", error);
    return Response.json({ error: "Upload failed. Your file has not been added; please retry." }, { status: 503 });
  }
}
