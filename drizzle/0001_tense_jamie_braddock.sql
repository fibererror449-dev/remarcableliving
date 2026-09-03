CREATE TABLE `imported_inventory_units` (
	`ref` text PRIMARY KEY NOT NULL,
	`project` text NOT NULL,
	`floor` text,
	`unit_type` text,
	`area_sqm` real,
	`direction` text,
	`price_monthly` integer,
	`photo_url` text,
	`status` text DEFAULT 'available' NOT NULL,
	`imported_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_imported_inventory_project_price` ON `imported_inventory_units` (`project`,`price_monthly`);--> statement-breakpoint
CREATE INDEX `idx_imported_inventory_status` ON `imported_inventory_units` (`status`);
