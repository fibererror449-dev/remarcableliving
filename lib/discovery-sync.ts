import type { D1Database } from "@cloudflare/workers-types";

// Idempotent data backfill for inventory that predates the discovery objects.
// Subsequent listing writes are maintained by the database triggers.
const statements = [
  `INSERT OR IGNORE INTO discovery_places(kind,name) SELECT 'area', trim(district) FROM listings WHERE deleted_at IS NULL AND trim(district) != ''`,
  `INSERT OR IGNORE INTO listing_places(listing_id,place_id,kind) SELECT l.id,p.id,'area' FROM listings l JOIN discovery_places p ON p.kind='area' AND lower(p.name)=lower(trim(l.district)) WHERE l.deleted_at IS NULL`,
  `INSERT OR IGNORE INTO discovery_places(kind,name) SELECT 'project', trim(CASE WHEN trim(development_project) != '' THEN development_project WHEN instr(name, ' · ') > 0 THEN substr(name, 1, instr(name, ' · ') - 1) ELSE '' END) FROM listings WHERE deleted_at IS NULL AND trim(CASE WHEN trim(development_project) != '' THEN development_project WHEN instr(name, ' · ') > 0 THEN substr(name, 1, instr(name, ' · ') - 1) ELSE '' END) != ''`,
  `INSERT OR IGNORE INTO listing_places(listing_id,place_id,kind) SELECT l.id,p.id,'project' FROM listings l JOIN discovery_places p ON p.kind='project' AND lower(p.name)=lower(trim(CASE WHEN trim(l.development_project) != '' THEN l.development_project WHEN instr(l.name, ' · ') > 0 THEN substr(l.name, 1, instr(l.name, ' · ') - 1) ELSE '' END)) WHERE l.deleted_at IS NULL`,
  `INSERT OR IGNORE INTO discovery_places(kind,name) SELECT 'university', trim(university) FROM listings WHERE deleted_at IS NULL AND trim(university) != ''`,
  `INSERT OR IGNORE INTO listing_places(listing_id,place_id,kind) SELECT l.id,p.id,'university' FROM listings l JOIN discovery_places p ON p.kind='university' AND lower(p.name)=lower(trim(l.university)) WHERE l.deleted_at IS NULL`,
];
export async function syncDiscoveryRelationships(db: D1Database) {
  const missing = await db.prepare(`SELECT l.id FROM listings l WHERE l.deleted_at IS NULL AND (
    (trim(l.district) != '' AND NOT EXISTS (SELECT 1 FROM listing_places r WHERE r.listing_id=l.id AND r.kind='area')) OR
    ((trim(l.development_project) != '' OR instr(l.name, ' · ') > 0) AND NOT EXISTS (SELECT 1 FROM listing_places r WHERE r.listing_id=l.id AND r.kind='project')) OR
    (trim(l.university) != '' AND NOT EXISTS (SELECT 1 FROM listing_places r WHERE r.listing_id=l.id AND r.kind='university'))
  ) LIMIT 1`).first();
  if (!missing) return;
  await db.batch(statements.map(statement => db.prepare(statement)));
}
