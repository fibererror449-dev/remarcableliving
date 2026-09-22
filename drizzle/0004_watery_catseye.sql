CREATE TABLE `import_media` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`content_hash` text NOT NULL,
	`object_key` text NOT NULL,
	`mime` text NOT NULL,
	`size` integer NOT NULL,
	`name` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `import_media_content` ON `import_media` (`actor`,`content_hash`);--> statement-breakpoint
CREATE TABLE `listing_media` (
	`id` text PRIMARY KEY NOT NULL,
	`listing_id` integer NOT NULL,
	`media_id` text NOT NULL,
	`position` integer NOT NULL,
	`caption` text DEFAULT '' NOT NULL,
	`attribution` text NOT NULL,
	`cover` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`media_id`) REFERENCES `import_media`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `listing_media_identity` ON `listing_media` (`listing_id`,`media_id`);--> statement-breakpoint
CREATE INDEX `listing_media_lookup` ON `listing_media` (`media_id`);