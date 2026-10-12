import { syncDiscoveryRelationships } from "./discovery-sync";
import { listListings } from "./listings";
import { toPublicListing } from "./listings-data";
import { placeKinds, type DiscoveryPlace, type PlaceKind } from "./discovery-data";

export async function loadDiscovery() {
  const listings = (await listListings()).map(toPublicListing);
  let db;
  try { db = (await import("cloudflare:workers")).env.DB; } catch { db = null; }
  if (db) {
    await syncDiscoveryRelationships(db);
    const result = await db.prepare(`SELECT p.id,p.kind,p.name,p.description,r.listing_id FROM discovery_places p LEFT JOIN listing_places r ON r.place_id=p.id ORDER BY p.name COLLATE NOCASE,p.id`).all<{ id: number; kind: PlaceKind; name: string; description: string; listing_id: number | null }>();
    const places = new Map<number, DiscoveryPlace>();
    for (const row of result.results) {
      let place = places.get(row.id);
      if (!place) { place = { id: row.id, kind: row.kind, name: row.name, description: row.description, listingIds: [] }; places.set(row.id, place); }
      if (row.listing_id !== null) place.listingIds.push(row.listing_id);
    }
    return { listings, places: [...places.values()] };
  }
  const places: DiscoveryPlace[] = [];
  for (const kind of placeKinds) {
    const groups = new Map<string, DiscoveryPlace>();
    for (const listing of listings) {
      const name = (kind === "area" ? listing.district : kind === "project" ? listing.developmentProject : listing.university)?.trim();
      if (!name) continue;
      const key = name.toLowerCase();
      let place = groups.get(key);
      if (!place) { place = { id: places.length + 1, kind, name, description: "", listingIds: [] }; places.push(place); groups.set(key, place); }
      place.listingIds.push(listing.id);
    }
  }
  return { listings, places };
}
