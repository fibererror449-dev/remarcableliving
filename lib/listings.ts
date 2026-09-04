import { env } from "cloudflare:workers";

export type ListingStatus = "available" | "viewing" | "rented" | "verify";
export type Listing = {
  id: number; slug: string; name: string; district: string; rent: number;
  bedrooms: number; bathrooms: number; sizeSqm: number; floor: string;
  stationType: string; stationName: string; walkMinutes: number;
  latitude: number; longitude: number; image: string; status: ListingStatus;
  sourceUrl: string; lastVerified: string; description: string;
};

export const fallbackListings: Listing[] = [
  { id: 8, slug: "baan-klang-krung-siam-2br", name: "Baan Klang Krung Siam · 2 Bedrooms", district: "Ratchathewi", rent: 30000, bedrooms: 2, bathrooms: 2, sizeSqm: 74, floor: "21", stationType: "BTS", stationName: "Ratchathewi", walkMinutes: 3, latitude: 13.751667, longitude: 100.5325, image: "/properties/baan-klang-krung-siam.jpg", status: "available", sourceUrl: "", lastVerified: "2026-08-21", description: "A furnished 74 sq m two-bedroom, two-bathroom home on the 21st floor, with an open living and dining area, a full kitchen, broad city windows, and BTS Ratchathewi close by." },
  { id: 7, slug: "centurion-park-ari-soi-5-1br", name: "Centurion Park · 1 Bedroom", district: "Ari", rent: 25000, bedrooms: 1, bathrooms: 1, sizeSqm: 62, floor: "—", stationType: "BTS", stationName: "Ari", walkMinutes: 8, latitude: 13.7827372, longitude: 100.5416299, image: "/properties/centurion-park-ari.jpg", status: "available", sourceUrl: "", lastVerified: "2026-08-20", description: "Fully renovated 62 sq m one-bedroom home on Ari Soi 5, with a separate sleeping area, generous work-from-home space, a full kitchen, and a private balcony." },
  { id: 1, slug: "centric-ari-station-1br", name: "Centric Ari Station · 1 Bedroom", district: "Ari", rent: 17000, bedrooms: 1, bathrooms: 1, sizeSqm: 28, floor: "17", stationType: "BTS", stationName: "Ari", walkMinutes: 3, latitude: 13.7797, longitude: 100.5447, image: "/properties/centric-ari-station/06-living-room-rug-edited.png", status: "available", sourceUrl: "https://propertyhub.in.th/en/condo-for-rent/bts-ari/price-not-more-than-20-thousand-thb", lastVerified: "2026-08-13", description: "Furnished one-bedroom option close to BTS Ari, cafés, offices, and La Villa." },
  { id: 2, slug: "noble-around-ari-1br", name: "Noble Around Ari · 1 Bedroom", district: "Ari", rent: 20000, bedrooms: 1, bathrooms: 1, sizeSqm: 26.58, floor: "High floor", stationType: "BTS", stationName: "Ari", walkMinutes: 2, latitude: 13.7799, longitude: 100.5444, image: "/bangkok/skyline.jpg", status: "verify", sourceUrl: "https://propertyhub.in.th/en/listings/condo-for-rent-noble-around-ari-new-condo-high-rise-good-location-bts-ari-220-m--cca00ac7---4235431", lastVerified: "2026-08-13", description: "Compact city-view home near BTS Ari with full furniture and building facilities." },
  { id: 3, slug: "thru-thonglor-1br", name: "Thru Thonglor · 1 Bedroom", district: "Thonglor", rent: 23000, bedrooms: 1, bathrooms: 1, sizeSqm: 37, floor: "16", stationType: "BTS", stationName: "Thong Lo", walkMinutes: 18, latitude: 13.7382, longitude: 100.5838, image: "/bangkok/night-city.jpg", status: "verify", sourceUrl: "https://propertyhub.in.th/en/condo-for-rent/project-thru-thonglor", lastVerified: "2026-08-13", description: "Larger one-bedroom layout in the Thonglor corridor with easy access to cafés and nightlife." },
  { id: 5, slug: "supalai-veranda-rama9-1br", name: "Supalai Veranda Rama 9 · 1 Bedroom", district: "Rama 9", rent: 17000, bedrooms: 1, bathrooms: 1, sizeSqm: 42, floor: "28", stationType: "MRT", stationName: "Phra Ram 9", walkMinutes: 14, latitude: 13.7566, longitude: 100.5778, image: "/bangkok/bang-wa.jpg", status: "available", sourceUrl: "https://propertyhub.in.th/en/condo-for-rent/project-supalai-veranda-rama-9/2", lastVerified: "2026-08-13", description: "High-floor one-bedroom residence with practical space near the Rama 9 business district." },
  { id: 6, slug: "belle-grand-rama9-1br", name: "Belle Grand Rama 9 · 1 Bedroom", district: "Rama 9", rent: 20000, bedrooms: 1, bathrooms: 1, sizeSqm: 42, floor: "22", stationType: "MRT", stationName: "Phra Ram 9", walkMinutes: 8, latitude: 13.7561, longitude: 100.5668, image: "/bangkok/night-city.jpg", status: "verify", sourceUrl: "https://propertyhub.in.th/en/condo-for-rent/the-ninth-tower", lastVerified: "2026-08-12", description: "Central Rama 9 option with generous one-bedroom space and convenient MRT access." },
];

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS listings (id INTEGER PRIMARY KEY AUTOINCREMENT, slug TEXT NOT NULL UNIQUE, name TEXT NOT NULL, district TEXT NOT NULL, rent INTEGER NOT NULL, bedrooms INTEGER NOT NULL DEFAULT 1, bathrooms INTEGER NOT NULL DEFAULT 1, size_sqm REAL NOT NULL, floor TEXT NOT NULL DEFAULT '—', station_type TEXT NOT NULL, station_name TEXT NOT NULL, walk_minutes INTEGER NOT NULL, latitude REAL NOT NULL, longitude REAL NOT NULL, image TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'verify', source_url TEXT NOT NULL DEFAULT '', last_verified TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`,
  `CREATE INDEX IF NOT EXISTS idx_listings_status_district ON listings(status, district)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS idx_listings_slug ON listings(slug)`,
];

export async function ensureListings(): Promise<void> {
  const db = env.DB;
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
  try { await ensureListings(); const result = await env.DB.prepare(`SELECT * FROM listings ${includeClosed ? "" : "WHERE status != 'rented'"} ORDER BY CASE status WHEN 'available' THEN 0 WHEN 'viewing' THEN 1 ELSE 2 END, updated_at DESC`).all(); return result.results.map((row) => mapRow(row as Record<string, unknown>)); } catch { return fallbackListings; }
}

export async function getListing(slug: string): Promise<Listing | null> {
  try { await ensureListings(); const row = await env.DB.prepare("SELECT * FROM listings WHERE slug = ?").bind(slug).first<Record<string, unknown>>(); return row ? mapRow(row) : null; } catch { return fallbackListings.find((listing) => listing.slug === slug) ?? null; }
}
