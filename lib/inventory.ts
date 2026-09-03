import type { D1Database } from "@cloudflare/workers-types";
import { importedInventory, type ImportedInventoryUnit } from "./imported-inventory.generated";

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS imported_inventory_units (ref TEXT PRIMARY KEY, project TEXT NOT NULL, floor TEXT, unit_type TEXT, area_sqm REAL, direction TEXT, price_monthly INTEGER, photo_url TEXT, status TEXT NOT NULL DEFAULT 'available', imported_at TEXT NOT NULL)`,
  `CREATE INDEX IF NOT EXISTS idx_imported_inventory_project_price ON imported_inventory_units(project, price_monthly)`,
  `CREATE INDEX IF NOT EXISTS idx_imported_inventory_available ON imported_inventory_units(status) WHERE status = 'available'`,
];

export async function ensureImportedInventory(db: D1Database): Promise<void> {
  await db.batch(schemaStatements.map((statement) => db.prepare(statement)));
  const count = await db.prepare("SELECT COUNT(*) AS count FROM imported_inventory_units").first<{ count: number }>();
  if ((count?.count ?? 0) >= importedInventory.length) return;

  const insert = `INSERT OR IGNORE INTO imported_inventory_units (ref,project,floor,unit_type,area_sqm,direction,price_monthly,photo_url,status,imported_at) VALUES (?,?,?,?,?,?,?,?,?,?)`;
  for (let start = 0; start < importedInventory.length; start += 80) {
    const chunk = importedInventory.slice(start, start + 80);
    await db.batch(chunk.map((unit) => db.prepare(insert).bind(
      unit.ref,
      unit.project,
      unit.floor,
      unit.unitType,
      unit.areaSqm,
      unit.direction,
      unit.priceMonthly,
      unit.photoUrl,
      unit.status,
      unit.importedAt,
    )));
  }
}

function mapInventoryRow(row: Record<string, unknown>): ImportedInventoryUnit {
  return {
    ref: String(row.ref),
    project: String(row.project),
    floor: row.floor == null ? null : String(row.floor),
    unitType: row.unit_type == null ? null : String(row.unit_type),
    areaSqm: row.area_sqm == null ? null : Number(row.area_sqm),
    direction: row.direction == null ? null : String(row.direction),
    priceMonthly: row.price_monthly == null ? null : Number(row.price_monthly),
    photoUrl: row.photo_url == null ? null : String(row.photo_url),
    status: "available",
    importedAt: String(row.imported_at),
  };
}

export async function listImportedInventory(): Promise<ImportedInventoryUnit[]> {
  try {
    const { env } = await import("cloudflare:workers");
    await ensureImportedInventory(env.DB);
    const result = await env.DB.prepare(`SELECT * FROM imported_inventory_units WHERE status = 'available' ORDER BY project COLLATE NOCASE, price_monthly IS NULL, price_monthly, ref`).all();
    return result.results.map((row) => mapInventoryRow(row as Record<string, unknown>));
  } catch {
    return importedInventory;
  }
}
