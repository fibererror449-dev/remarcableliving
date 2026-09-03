CREATE TABLE `listings` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`slug` text NOT NULL,
	`name` text NOT NULL,
	`district` text NOT NULL,
	`rent` integer NOT NULL,
	`bedrooms` integer DEFAULT 1 NOT NULL,
	`bathrooms` integer DEFAULT 1 NOT NULL,
	`size_sqm` real NOT NULL,
	`floor` text DEFAULT '—' NOT NULL,
	`station_type` text NOT NULL,
	`station_name` text NOT NULL,
	`walk_minutes` integer NOT NULL,
	`latitude` real NOT NULL,
	`longitude` real NOT NULL,
	`image` text NOT NULL,
	`status` text DEFAULT 'verify' NOT NULL,
	`source_url` text DEFAULT '' NOT NULL,
	`last_verified` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `listings_slug_unique` ON `listings` (`slug`);
--> statement-breakpoint
CREATE INDEX `idx_listings_status_district` ON `listings` (`status`,`district`);
