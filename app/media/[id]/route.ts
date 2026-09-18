import { env } from "cloudflare:workers";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (!/^[a-f0-9-]{36}\.(jpg|png|webp|gif|mp4|webm|mov)$/.test(id)) return new Response("Not found", { status: 404 });
  try {
    const bucket = (env as unknown as { MEDIA: R2Bucket }).MEDIA;
    const rangeHeader = request.headers.get("range");
    let range: { offset: number; length: number } | undefined;
    if (rangeHeader) {
      const meta = await bucket.head(`uploads/${id}`);
      if (!meta) return new Response("Not found", { status: 404 });
      const match = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
      const invalid = () => new Response("Invalid byte range", { status: 416, headers: { "content-range": `bytes */${meta.size}` } });
      if (!match || (!match[1] && !match[2])) return invalid();
      const offset = match[1] ? Number(match[1]) : Math.max(0, meta.size - Number(match[2]));
      const end = match[1] && match[2] ? Math.min(Number(match[2]), meta.size - 1) : meta.size - 1;
      if (!Number.isSafeInteger(offset) || !Number.isSafeInteger(end) || offset >= meta.size || end < offset) return invalid();
      range = { offset, length: end - offset + 1 };
    }
    const object = await bucket.get(`uploads/${id}`, range ? { range } : undefined);
    if (!object) return new Response("Not found", { status: 404 });
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("accept-ranges", "bytes");
    headers.set("x-content-type-options", "nosniff");
    if (range) {
      const { offset, length } = range;
      headers.set("content-range", `bytes ${offset}-${offset + length - 1}/${object.size}`);
      headers.set("content-length", String(length));
      return new Response(object.body as unknown as BodyInit, { status: 206, headers });
    }
    headers.set("content-length", String(object.size));
    return new Response(object.body as unknown as BodyInit, { headers });
  } catch (error) {
    console.error("Media read failed", error);
    return new Response("Media temporarily unavailable", { status: 503 });
  }
}
