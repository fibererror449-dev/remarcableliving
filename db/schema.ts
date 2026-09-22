import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex, check } from "drizzle-orm/sqlite-core";

export const listings = sqliteTable("listings", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  publicationVersion: integer("publication_version").notNull().default(0),
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

// Agent drafts never enter the public listings table before human approval.
export const agentCredentials = sqliteTable("agent_credentials", {
  id: text("id").primaryKey(), owner: text("owner").notNull(), name: text("name").notNull(),
  tokenHash: text("token_hash").notNull().unique(), scopes: text("scopes").notNull(),
  expiresAt: integer("expires_at").notNull(), revokedAt: integer("revoked_at"),
  createdAt: integer("created_at").notNull(),
});
export const importSources = sqliteTable("import_sources", {
  id: text("id").primaryKey(), namespace: text("namespace").notNull(), reference: text("reference").notNull(),
  currentDraft: text("current_draft"), generation: integer("generation").notNull().default(0),
  listingId: integer("listing_id").references(()=>listings.id),
}, t=>[uniqueIndex("import_source_identity").on(t.namespace,t.reference)]);
export const listingDrafts = sqliteTable("listing_drafts", {
  id: text("id").primaryKey(), sourceId: text("source_id").notNull().references(()=>importSources.id),
  revision: integer("revision").notNull(), payload: text("payload").notNull(), payloadHash: text("payload_hash").notNull(),
  baseVersion: integer("base_version"), state: text("state").notNull().default("pending"),
  actor: text("actor").notNull(), createdAt: integer("created_at").notNull(),
}, t=>[uniqueIndex("draft_revision").on(t.sourceId,t.revision)]);
export const importJobs = sqliteTable("import_jobs", {
  id: text("id").primaryKey(), actor: text("actor").notNull(), requestKey: text("request_key").notNull(),
  payloadHash: text("payload_hash").notNull(), rowCount: integer("row_count").notNull(), createdAt: integer("created_at").notNull(),
}, t=>[uniqueIndex("import_request_identity").on(t.actor,t.requestKey)]);
export const importRows = sqliteTable("import_rows", {
  id: text("id").primaryKey(), jobId: text("job_id").notNull().references(()=>importJobs.id),
  rowIndex: integer("row_index").notNull(), result: text("result").notNull(),
}, t=>[uniqueIndex("import_row_identity").on(t.jobId,t.rowIndex)]);
export const importAudit = sqliteTable("import_audit", {
  id: text("id").primaryKey(), actor: text("actor").notNull(), action: text("action").notNull(),
  subject: text("subject").notNull(), createdAt: integer("created_at").notNull(),
});
// A failed guard aborts the entire D1 batch, including all subsequent writes.
export const importGuards = sqliteTable("import_guards", {
  id: text("id").primaryKey(), valid: integer("valid").notNull(),
}, t=>[check("import_guard_valid",sql`${t.valid} = 1`)]);

export const importMedia = sqliteTable("import_media", {
  id: text("id").primaryKey(), actor: text("actor").notNull(), contentHash: text("content_hash").notNull(),
  objectKey: text("object_key").notNull(), mime: text("mime").notNull(), size: integer("size").notNull(),
  name: text("name").notNull(), createdAt: integer("created_at").notNull(),
},t=>[uniqueIndex("import_media_content").on(t.actor,t.contentHash)]);
export const listingMedia = sqliteTable("listing_media", {
  id: text("id").primaryKey(), listingId: integer("listing_id").notNull().references(()=>listings.id),
  mediaId: text("media_id").notNull().references(()=>importMedia.id), position: integer("position").notNull(),
  caption: text("caption").notNull().default(""), attribution: text("attribution").notNull(), cover: integer("cover").notNull().default(0),
},t=>[uniqueIndex("listing_media_identity").on(t.listingId,t.mediaId),index("listing_media_lookup").on(t.mediaId)]);

// Chat-client OAuth: admin-registered clients, one-use consent and codes, rotating grants.
export const oauthClients = sqliteTable("oauth_clients", {
  id: text("id").primaryKey(), name: text("name").notNull(), redirectUris: text("redirect_uris").notNull(),
  secretHash: text("secret_hash").notNull(), createdAt: integer("created_at").notNull(), revokedAt: integer("revoked_at"),
});
export const oauthConsents = sqliteTable("oauth_consents", {
  id: text("id").primaryKey(), tokenHash: text("token_hash").notNull().unique(), clientId: text("client_id").notNull().references(()=>oauthClients.id),
  owner: text("owner").notNull(), redirectUri: text("redirect_uri").notNull(), codeChallenge: text("code_challenge").notNull(),
  resource: text("resource").notNull(), scopes: text("scopes").notNull(), state: text("state"),
  expiresAt: integer("expires_at").notNull(), consumedAt: integer("consumed_at"),
});
export const oauthGrants = sqliteTable("oauth_grants", {
  id: text("id").primaryKey(), clientId: text("client_id").notNull().references(()=>oauthClients.id), owner: text("owner").notNull(),
  resource: text("resource").notNull(), scopes: text("scopes").notNull(), createdAt: integer("created_at").notNull(), revokedAt: integer("revoked_at"),
},t=>[index("oauth_grants_client").on(t.clientId)]);
export const oauthCodes = sqliteTable("oauth_codes", {
  id: text("id").primaryKey(), codeHash: text("code_hash").notNull().unique(), clientId: text("client_id").notNull().references(()=>oauthClients.id),
  owner: text("owner").notNull(), redirectUri: text("redirect_uri").notNull(), codeChallenge: text("code_challenge").notNull(),
  resource: text("resource").notNull(), scopes: text("scopes").notNull(), expiresAt: integer("expires_at").notNull(),
  consumedAt: integer("consumed_at"), grantId: text("grant_id").references(()=>oauthGrants.id),
});
export const oauthTokens = sqliteTable("oauth_tokens", {
  id: text("id").primaryKey(), tokenHash: text("token_hash").notNull().unique(), grantId: text("grant_id").notNull().references(()=>oauthGrants.id),
  kind: text("kind").notNull(), expiresAt: integer("expires_at").notNull(), consumedAt: integer("consumed_at"), createdAt: integer("created_at").notNull(),
},t=>[index("oauth_tokens_grant").on(t.grantId)]);
