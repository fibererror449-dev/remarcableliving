CREATE TABLE `oauth_clients` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`redirect_uris` text NOT NULL,
	`secret_hash` text NOT NULL,
	`created_at` integer NOT NULL,
	`revoked_at` integer
);
--> statement-breakpoint
CREATE TABLE `oauth_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`code_hash` text NOT NULL,
	`client_id` text NOT NULL,
	`owner` text NOT NULL,
	`redirect_uri` text NOT NULL,
	`code_challenge` text NOT NULL,
	`resource` text NOT NULL,
	`scopes` text NOT NULL,
	`expires_at` integer NOT NULL,
	`consumed_at` integer,
	`grant_id` text,
	FOREIGN KEY (`client_id`) REFERENCES `oauth_clients`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`grant_id`) REFERENCES `oauth_grants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `oauth_codes_code_hash_unique` ON `oauth_codes` (`code_hash`);--> statement-breakpoint
CREATE TABLE `oauth_consents` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`client_id` text NOT NULL,
	`owner` text NOT NULL,
	`redirect_uri` text NOT NULL,
	`code_challenge` text NOT NULL,
	`resource` text NOT NULL,
	`scopes` text NOT NULL,
	`state` text,
	`expires_at` integer NOT NULL,
	`consumed_at` integer,
	FOREIGN KEY (`client_id`) REFERENCES `oauth_clients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `oauth_consents_token_hash_unique` ON `oauth_consents` (`token_hash`);--> statement-breakpoint
CREATE TABLE `oauth_grants` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`owner` text NOT NULL,
	`resource` text NOT NULL,
	`scopes` text NOT NULL,
	`created_at` integer NOT NULL,
	`revoked_at` integer,
	FOREIGN KEY (`client_id`) REFERENCES `oauth_clients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `oauth_grants_client` ON `oauth_grants` (`client_id`);--> statement-breakpoint
CREATE TABLE `oauth_tokens` (
	`id` text PRIMARY KEY NOT NULL,
	`token_hash` text NOT NULL,
	`grant_id` text NOT NULL,
	`kind` text NOT NULL,
	`expires_at` integer NOT NULL,
	`consumed_at` integer,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`grant_id`) REFERENCES `oauth_grants`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `oauth_tokens_token_hash_unique` ON `oauth_tokens` (`token_hash`);--> statement-breakpoint
CREATE INDEX `oauth_tokens_grant` ON `oauth_tokens` (`grant_id`);