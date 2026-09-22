CREATE TABLE `agent_credentials` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`name` text NOT NULL,
	`token_hash` text NOT NULL,
	`scopes` text NOT NULL,
	`expires_at` integer NOT NULL,
	`revoked_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `agent_credentials_token_hash_unique` ON `agent_credentials` (`token_hash`);--> statement-breakpoint
CREATE TABLE `import_audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`subject` text NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `import_guards` (
	`id` text PRIMARY KEY NOT NULL,
	`valid` integer NOT NULL,
	CONSTRAINT "import_guard_valid" CHECK("import_guards"."valid" = 1)
);
--> statement-breakpoint
CREATE TABLE `import_jobs` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`request_key` text NOT NULL,
	`payload_hash` text NOT NULL,
	`row_count` integer NOT NULL,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `import_request_identity` ON `import_jobs` (`actor`,`request_key`);--> statement-breakpoint
CREATE TABLE `import_rows` (
	`id` text PRIMARY KEY NOT NULL,
	`job_id` text NOT NULL,
	`row_index` integer NOT NULL,
	`result` text NOT NULL,
	FOREIGN KEY (`job_id`) REFERENCES `import_jobs`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `import_row_identity` ON `import_rows` (`job_id`,`row_index`);--> statement-breakpoint
CREATE TABLE `import_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`namespace` text NOT NULL,
	`reference` text NOT NULL,
	`current_draft` text,
	`generation` integer DEFAULT 0 NOT NULL,
	`listing_id` integer,
	FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `import_source_identity` ON `import_sources` (`namespace`,`reference`);--> statement-breakpoint
CREATE TABLE `listing_drafts` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`revision` integer NOT NULL,
	`payload` text NOT NULL,
	`payload_hash` text NOT NULL,
	`base_version` integer,
	`state` text DEFAULT 'pending' NOT NULL,
	`actor` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `import_sources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `draft_revision` ON `listing_drafts` (`source_id`,`revision`);