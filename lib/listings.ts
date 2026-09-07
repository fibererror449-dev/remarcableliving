import type { D1Database } from "@cloudflare/workers-types";
import { fallbackListings, type Listing, type ListingStatus } from "./listings-data";

export { fallbackListings };
export type { Listing, ListingStatus };

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS listings (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL, district TEXT NOT NULL, rent INTEGER NOT NULL, bedrooms INTEGER NOT NULL DEFAULT 1, bathrooms INTEGER NOT NULL DEFAULT 1, size_sqm REAL NOT NULL, floor TEXT NOT NULL DEFAULT '—', station_type TEXT NOT NULL, station_name TEXT NOT NULL, walk_minutes INTEGER NOT NULL, latitude REAL NOT NULL, longitude REAL NOT NULL, image TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'verify', source_url TEXT NOT NULL DEFAULT '', last_verified TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS idx_listings_status_district ON listings(status, district)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_listings_slug ON listings(slug)`,
];

// Resolved lazily so the built worker can also be imported by the Node test
// harness, where the "cloudflare:" scheme does not exist and callers fall back.
async function getDb(): Promise<D1Database> {
  const { env } = await import("cloudflare:workers");
  return env.DB;
}

export async function ensureListings(): Promise<void> {
  const db = await getDb();
  await db.batch(schemaStatements.map((statement) => db.prepare(statement)));
  const count = await db.prepare("SELECT COUNT(*) AS count FROM listings").first<{ count: number }>();
  const listingsToSeed = (count?.count ?? 0) > 0
    ? fallbackListings.filter((listing) => ["centurion-park-ari-soi-5-1br", "baan-klang-krung-siam-2br"].includes(listing.slug))
    : fallbackListings;
  for (const listing of listingsToSeed) {
    await db.prepare(`INSERT OR IGNORE INTO listings (slug,name,district,rent,bedrooms,bathrooms,size_sqm,floor,station_type,station_name,walk_minutes,latitude,longitude,image,status,source_url,last_verified,description) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).bind(listing.slug, listing.name, listing.district, listing.rent, listing.bedrooms, listing.bathrooms, listing.sizeSqm, listing.floor, listing.stationType, listing.stationName, listing.walkMinutes, listing.latitude, listing.longitude, listing.image, listing.status, listing.sourceUrl, listing.lastVerified, listing.description).run();
  }
}

function mapRow(row: Record<string, unknown>): Listing {
  return { id: Number(row.id), slug: String(row.slug), name: String(row.name), district: String(row.district), rent: Number(row.rent), bedrooms: Number(row.bedrooms), bathrooms: Number(row.bathrooms), sizeSqm: Number(row.size_sqm), floor: String(row.floor), stationType: String(row.station_type), stationName: String(row.station_name), walkMinutes: Number(row.walk_minutes), latitude: Number(row.latitude), longitude: Number(row.longitude), image: String(row.image), status: row.status as ListingStatus, sourceUrl: String(row.source_url), lastVerified: String(row.last_verified), description: String(row.description) };
}

export async function listListings(includeClosed = false): Promise<Listing[]> {
  try { await ensureListings(); const db = await getDb(); const result = await db.prepare(`SELECT * FROM listings ${includeClosed ? "" : "WHERE status != 'rented'"} ORDER BY CASE status WHEN 'available' THEN 0 WHEN 'viewing' THEN 1 ELSE 2 END, updated_at DESC`).all(); return result.results.map((row) => mapRow(row as Record<string, unknown>)); } catch { return fallbackListings; }
}

export async function getListing(slug: string): Promise<Listing | null> {
  try { await ensureListings(); const db = await getDb(); const row = await db.prepare("SELECT * FROM listings WHERE slug = ?").bind(slug).first<Record<string, unknown>>(); return row ? mapRow(row) : (fallbackListings.find((listing) => listing.slug === slug) ?? null); } catch { return fallbackListings.find((listing) => listing.slug === slug) ?? null; }
}
