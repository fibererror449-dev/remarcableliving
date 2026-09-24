import { ApiError, audit, scopes, type Actor, type ImportEnv } from "./imports/core";
import { listingSchema } from "./imports/validation";
import { ensureListings, listListings } from "./listings";
import type { AdminListing, AdminListingDetail, AttachedMedia, Listing, MediaAttribution, MediaSummary } from "./listings-data";
import { curatedResidence } from "./residence-galleries";
import { MEDIA_TYPES } from "./uploads";
import { parseVideoLink, VIDEO_LINK_HELP } from "./video";

// Admin create/edit of published listings. Photos and uploaded videos are listing_media rows (the
// same table approved imports use), so every attached file is counted here and shown on the page.

const PLACEHOLDER_COVER = "/bangkok/skyline.jpg";
const MAX_MEDIA = 60;
const labels: Record<string, string> = { name: "Name", district: "District", rent: "Rent", bedrooms: "Bedrooms", bathrooms: "Bathrooms", sizeSqm: "Size", floor: "Floor", stationType: "Station type", stationName: "Station", walkMinutes: "Walk minutes", latitude: "Latitude", longitude: "Longitude", lastVerified: "Last verified date", status: "Status", sourceUrl: "Original listing URL", description: "Description", image: "Cover image", videoUrl: "Video link" };
const required = ["name", "district", "rent", "sizeSqm", "stationType", "stationName", "walkMinutes", "latitude", "longitude", "lastVerified"];
const texts: Record<string, number> = { name: 200, district: 120, floor: 80, stationName: 120, description: 10000, sourceUrl: 2000, videoUrl: 2000, image: 2000, lastVerified: 10, status: 20, stationType: 20 };
const attributions: MediaAttribution[] = ["owner", "agent", "admin"];

type MediaInput = { id: string; caption: string; attribution: MediaAttribution };
type ListingInput = Omit<Listing, "id" | "slug" | "videoUrl"> & { videoUrl: string; media: MediaInput[] };
type MediaRow = { id: string; mime: string; name: string; size: number };

export function adminActorFor(user: { email: string }): Actor {
  const email = user.email.trim().toLowerCase();
  return { id: `admin:${email}`, owner: email, scopes, admin: true };
}

export function apiErrorResponse(error: unknown, fallback: string) {
  if (error instanceof ApiError) return Response.json({ error: error.message, details: error.details }, { status: error.status, headers: { "cache-control": "no-store" } });
  console.error(fallback, error instanceof Error ? error.message : "unknown");
  return Response.json({ error: fallback }, { status: 503, headers: { "cache-control": "no-store" } });
}

function isBlank(value: unknown) { return value === undefined || value === null || (typeof value === "string" && !value.trim()); }

/** Accepts form strings or JSON numbers; reports every problem at once with readable field names. */
export function parseListingInput(body: Record<string, unknown>): ListingInput {
  const errors: string[] = [];
  const text = (key: string, fallback = "") => {
    const value = body[key];
    if (isBlank(value)) return fallback;
    if (typeof value !== "string" || value.trim().length > texts[key]) { errors.push(`${labels[key]} must be text of at most ${texts[key]} characters`); return fallback; }
    return value.trim();
  };
  const number = (key: string, fallback: number) => {
    const [min, max, integer] = listingSchema.fields.numbers[key];
    if (isBlank(body[key])) return fallback;
    const value = typeof body[key] === "string" ? Number(body[key]) : body[key];
    if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max || (integer && !Number.isInteger(value))) { errors.push(`${labels[key]} must be ${integer ? "a whole number" : "a number"} from ${min} to ${max}`); return fallback; }
    return value;
  };
  const missing = required.filter((key) => isBlank(body[key]));
  if (missing.length) errors.push(`Complete the required fields: ${missing.map((key) => labels[key]).join(", ")}`);
  const input: ListingInput = {
    name: text("name"), district: text("district"), rent: number("rent", 0), bedrooms: number("bedrooms", 1), bathrooms: number("bathrooms", 1),
    sizeSqm: number("sizeSqm", 0), floor: text("floor", "—"), stationType: text("stationType"), stationName: text("stationName"),
    walkMinutes: number("walkMinutes", 0), latitude: number("latitude", 0), longitude: number("longitude", 0), image: text("image"),
    status: (text("status", "verify") as Listing["status"]), sourceUrl: text("sourceUrl"), lastVerified: text("lastVerified"),
    description: text("description"), videoUrl: text("videoUrl"), media: [],
  };
  if (input.stationType && !listingSchema.fields.stationType.includes(input.stationType)) errors.push("Station type must be BTS or MRT");
  if (!listingSchema.fields.status.includes(input.status)) errors.push("Status must be available, viewing, verify or rented");
  if (input.lastVerified && (!/^\d{4}-\d{2}-\d{2}$/.test(input.lastVerified) || !Number.isFinite(Date.parse(input.lastVerified)) || new Date(input.lastVerified).toISOString().slice(0, 10) !== input.lastVerified)) errors.push("Last verified date must be a real YYYY-MM-DD date");
  if (input.sourceUrl) { try { const url = new URL(input.sourceUrl); if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) throw new Error(); } catch { errors.push("Original listing URL must be an http(s) link"); } }
  if (input.image && !(/^\/(?!\/)/.test(input.image) || /^https:\/\//.test(input.image))) errors.push("Cover image must be a site path such as /media/… or an https link");
  if (input.videoUrl) {
    const link = parseVideoLink(input.videoUrl);
    if (link) input.videoUrl = link.href;
    else errors.push(`Video link not recognised. ${VIDEO_LINK_HELP} To use a video file, upload it instead`);
  }
  const media = body.media ?? [];
  if (!Array.isArray(media) || media.length > MAX_MEDIA) errors.push(`Attach at most ${MAX_MEDIA} photos and videos`);
  else for (const item of media as Record<string, unknown>[]) {
    const attribution = item?.attribution ?? "owner";
    if (!item || typeof item.id !== "string" || item.id.length > 100 || (item.caption !== undefined && (typeof item.caption !== "string" || item.caption.length > 500)) || !attributions.includes(attribution as MediaAttribution)) { errors.push("Each photo or video needs a valid id, a caption of at most 500 characters and a supplier"); break; }
    if (input.media.some((entry) => entry.id === item.id)) { errors.push("The same photo or video is attached twice"); break; }
    input.media.push({ id: item.id, caption: typeof item.caption === "string" ? item.caption.trim() : "", attribution: attribution as MediaAttribution });
  }
  if (errors.length) throw new ApiError(400, "Check the listing details", errors);
  return input;
}

async function mediaRows(env: ImportEnv, ids: string[]) {
  if (!ids.length) return [];
  return (await env.DB.prepare(`SELECT id,mime,name,size FROM import_media WHERE id IN (${ids.map(() => "?").join(",")})`).bind(...ids).all<MediaRow>()).results;
}

/** Resolves the cover: an attached photo, a site/https image, or the first attached photo. */
function coverFor(input: ListingInput, rows: MediaRow[]) {
  const photos = input.media.filter((item) => rows.find((row) => row.id === item.id)?.mime.startsWith("image/"));
  const attached = /^\/listing-media\/([^/?#]+)$/.exec(input.image)?.[1];
  if (attached && !photos.some((photo) => photo.id === attached)) throw new ApiError(400, "Check the listing details", ["The cover must be one of this listing's photos"]);
  // A stock skyline must never stand in for a unit that has real photos.
  if ((!input.image || input.image === PLACEHOLDER_COVER) && photos.length) return `/listing-media/${photos[0].id}`;
  return input.image || PLACEHOLDER_COVER;
}

async function freeSlug(env: ImportEnv, name: string) {
  const base = name.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 70) || "residence";
  const taken = new Set((await env.DB.prepare("SELECT slug FROM listings WHERE slug = ? OR slug LIKE ?").bind(base, `${base}-%`).all<{ slug: string }>()).results.map((row) => row.slug));
  for (let suffix = 1; ; suffix++) { const slug = suffix === 1 ? base : `${base}-${suffix}`; if (!taken.has(slug)) return slug; }
}

/** Creates (id null) or replaces a listing's facts, cover, video link and ordered media in one batch. */
export async function saveListing(env: ImportEnv, actor: Actor, id: number | null, body: Record<string, unknown>) {
  const input = parseListingInput(body);
  const rows = await mediaRows(env, input.media.map((item) => item.id));
  const unknown = input.media.filter((item) => !rows.some((row) => row.id === item.id));
  if (unknown.length) throw new ApiError(400, "Check the listing details", [`${unknown.length} attached file${unknown.length === 1 ? " is" : "s are"} no longer available; remove and upload again`]);
  const image = coverFor(input, rows);
  await ensureListings();
  const existing = id === null ? null : await env.DB.prepare("SELECT slug FROM listings WHERE id = ?").bind(id).first<{ slug: string }>();
  if (id !== null && !existing) throw new ApiError(404, "Listing not found");
  const slug = existing?.slug ?? await freeSlug(env, input.name);
  const values = [input.name, input.district, input.rent, input.bedrooms, input.bathrooms, input.sizeSqm, input.floor, input.stationType, input.stationName, input.walkMinutes, input.latitude, input.longitude, image, input.status, input.sourceUrl, input.lastVerified, input.description, input.videoUrl];
  const listingId = "(SELECT id FROM listings WHERE slug = ?)";
  const statements = [existing
    // Bumping publication_version makes any pending import revision of this unit stale.
    ? env.DB.prepare("UPDATE listings SET name=?,district=?,rent=?,bedrooms=?,bathrooms=?,size_sqm=?,floor=?,station_type=?,station_name=?,walk_minutes=?,latitude=?,longitude=?,image=?,status=?,source_url=?,last_verified=?,description=?,video_url=?,publication_version=publication_version+1,updated_at=CURRENT_TIMESTAMP WHERE slug=?").bind(...values, slug)
    : env.DB.prepare("INSERT INTO listings (name,district,rent,bedrooms,bathrooms,size_sqm,floor,station_type,station_name,walk_minutes,latitude,longitude,image,status,source_url,last_verified,description,video_url,slug,publication_version) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,1)").bind(...values, slug),
  env.DB.prepare(`DELETE FROM listing_media WHERE listing_id = ${listingId}`).bind(slug)];
  for (const [position, item] of input.media.entries()) statements.push(env.DB.prepare(`INSERT INTO listing_media (id,listing_id,media_id,position,caption,attribution,cover) VALUES (?,${listingId},?,?,?,?,?)`).bind(crypto.randomUUID(), slug, item.id, position, item.caption, item.attribution, image === `/listing-media/${item.id}` ? 1 : 0));
  statements.push(audit(env, actor, existing ? "listing.updated" : "listing.created", slug));
  await env.DB.batch(statements);
  const saved = await env.DB.prepare("SELECT id FROM listings WHERE slug = ?").bind(slug).first<{ id: number }>();
  return { id: saved?.id, slug, url: `/residences/${slug}` };
}

function summarise(listing: Listing, counts?: { photos: number; videos: number }): MediaSummary {
  const curated = curatedResidence(listing.slug);
  const link = listing.videoUrl ? parseVideoLink(listing.videoUrl) : null;
  return {
    photos: curated.gallery.length + (counts?.photos ?? 0),
    cover: Boolean(listing.image) && !listing.image.startsWith("/bangkok/"),
    video: link ? link.kind : (curated.video || counts?.videos) ? "upload" : null,
  };
}

/** Every listing, including rented ones, with the photo count and video the public page shows. */
export async function listAdminListings(env: ImportEnv): Promise<AdminListing[]> {
  const listings = await listListings(true);
  const counts = new Map<number, { photos: number; videos: number }>();
  try {
    const result = await env.DB.prepare("SELECT p.listing_id, SUM(m.mime LIKE 'image/%') AS photos, SUM(m.mime LIKE 'video/%') AS videos FROM listing_media p JOIN import_media m ON m.id = p.media_id GROUP BY p.listing_id").all<{ listing_id: number; photos: number; videos: number }>();
    for (const row of result.results) counts.set(Number(row.listing_id), { photos: Number(row.photos), videos: Number(row.videos) });
  } catch (error) { console.error("Media counts unavailable", error instanceof Error ? error.message : "unknown"); }
  return listings.map((listing) => ({ ...listing, media: summarise(listing, counts.get(listing.id)) }));
}

export async function getAdminListing(env: ImportEnv, id: number): Promise<AdminListingDetail> {
  const [listing] = (await listListings(true)).filter((entry) => entry.id === id);
  if (!listing) throw new ApiError(404, "Listing not found");
  const media = (await env.DB.prepare("SELECT m.id, m.mime, m.name, m.size, p.caption, p.attribution FROM listing_media p JOIN import_media m ON m.id = p.media_id WHERE p.listing_id = ? ORDER BY p.position").bind(id).all<AttachedMedia>()).results;
  const curated = curatedResidence(listing.slug);
  return { listing, media, curated: { photos: curated.gallery.length, video: Boolean(curated.video) } };
}

const libraryKey = new RegExp(`^uploads/[a-f0-9-]{36}\\.(${[...new Set(Object.values(MEDIA_TYPES))].join("|")})$`);
/** Makes a media-library upload attachable to listings; the same file always maps to one media id. */
export async function registerLibraryMedia(env: ImportEnv, key: unknown): Promise<MediaRow> {
  if (typeof key !== "string" || !libraryKey.test(key)) throw new ApiError(400, "Choose a file from the media library");
  const object = await env.MEDIA.head(key);
  const mime = object?.httpMetadata?.contentType ?? "";
  if (!object || !MEDIA_TYPES[mime]) throw new ApiError(404, "That library file no longer exists");
  const name = (object.customMetadata?.name || key.slice(8)).slice(0, 180);
  await env.DB.prepare("INSERT OR IGNORE INTO import_media (id,actor,content_hash,object_key,mime,size,name,created_at) VALUES (?,?,?,?,?,?,?,?)").bind(crypto.randomUUID(), "admin:library", `library:${key}`, key, mime, object.size, name, Date.now()).run();
  const row = await env.DB.prepare("SELECT id,mime,name,size FROM import_media WHERE actor = 'admin:library' AND content_hash = ?").bind(`library:${key}`).first<MediaRow>();
  if (!row) throw new ApiError(503, "Media storage is unavailable. Please try again.");
  return row;
}
