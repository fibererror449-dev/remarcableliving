import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const listings = sqliteTable("listings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  district: text("district").notNull(),
  rent: integer("rent").notNull(),
  bedrooms: integer("bedrooms").notNull().default(1),
  bathrooms: integer("bathrooms").notNull().default(1),
  sizeSqm: real("size_sqm").notNull(),
  floor: text("floor").notNull().default("—"),
  stationType: text("station_type").notNull(),
  stationName: text("station_name").notNull(),
  walkMinutes: integer("walk_minutes").notNull(),
  latitude: real("latitude").notNull(),
  longitude: real("longitude").notNull(),
  image: text("image").notNull(),
  status: text("status", { enum: ["available", "viewing", "rented", "verify"] }).notNull().default("verify"),
  sourceUrl: text("source_url").notNull().default(""),
  lastVerified: text("last_verified").notNull(),
  description: text("description").notNull().default(""),
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
});

export const importedInventoryUnits = sqliteTable("imported_inventory_units", {
  ref: text("ref").primaryKey(),
  project: text("project").notNull(),
  floor: text("floor"),
  unitType: text("unit_type"),
  areaSqm: real("area_sqm"),
  direction: text("direction"),
  priceMonthly: integer("price_monthly"),
  photoUrl: text("photo_url"),
  status: text("status", { enum: ["available"] }).notNull().default("available"),
  importedAt: text("imported_at").notNull(),
}, (table) => [
  index("idx_imported_inventory_project_price").on(table.project, table.priceMonthly),
  index("idx_imported_inventory_status").on(table.status),
]);
