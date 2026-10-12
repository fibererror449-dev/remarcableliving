CREATE TABLE `discovery_places` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`kind` text NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `discovery_place_name` ON `discovery_places` (`kind`,lower("name"));--> statement-breakpoint
CREATE UNIQUE INDEX `discovery_place_id_kind` ON `discovery_places` (`id`,`kind`);--> statement-breakpoint
CREATE TABLE `listing_places` (
	`listing_id` integer NOT NULL,
	`place_id` integer NOT NULL,
	`kind` text NOT NULL,
	FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`place_id`) REFERENCES `discovery_places`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `listing_place_kind` ON `listing_places` (`listing_id`,`kind`);--> statement-breakpoint
CREATE INDEX `listing_place_parent` ON `listing_places` (`place_id`);
--> statement-breakpoint
CREATE TRIGGER listing_places_insert AFTER INSERT ON listings BEGIN
INSERT OR IGNORE INTO discovery_places(kind,name) SELECT 'area', trim(NEW.district) WHERE trim(NEW.district) != '';
INSERT INTO listing_places(listing_id,place_id,kind) SELECT NEW.id,id,'area' FROM discovery_places WHERE kind='area' AND lower(name)=lower(trim(NEW.district)) AND NEW.deleted_at IS NULL;
INSERT OR IGNORE INTO discovery_places(kind,name) SELECT 'project', trim(CASE WHEN trim(NEW.development_project) != '' THEN NEW.development_project WHEN instr(NEW.name, ' · ') > 0 THEN substr(NEW.name, 1, instr(NEW.name, ' · ') - 1) ELSE '' END) WHERE trim(CASE WHEN trim(NEW.development_project) != '' THEN NEW.development_project WHEN instr(NEW.name, ' · ') > 0 THEN substr(NEW.name, 1, instr(NEW.name, ' · ') - 1) ELSE '' END) != '';
INSERT INTO listing_places(listing_id,place_id,kind) SELECT NEW.id,id,'project' FROM discovery_places WHERE kind='project' AND lower(name)=lower(trim(CASE WHEN trim(NEW.development_project) != '' THEN NEW.development_project WHEN instr(NEW.name, ' · ') > 0 THEN substr(NEW.name, 1, instr(NEW.name, ' · ') - 1) ELSE '' END)) AND NEW.deleted_at IS NULL;
INSERT OR IGNORE INTO discovery_places(kind,name) SELECT 'university', trim(NEW.university) WHERE trim(NEW.university) != '';
INSERT INTO listing_places(listing_id,place_id,kind) SELECT NEW.id,id,'university' FROM discovery_places WHERE kind='university' AND lower(name)=lower(trim(NEW.university)) AND NEW.deleted_at IS NULL;
END;

--> statement-breakpoint
CREATE TRIGGER listing_places_update AFTER UPDATE OF name,district,development_project,university,deleted_at ON listings BEGIN
DELETE FROM listing_places WHERE listing_id=NEW.id;
INSERT OR IGNORE INTO discovery_places(kind,name) SELECT 'area', trim(NEW.district) WHERE trim(NEW.district) != '';
INSERT INTO listing_places(listing_id,place_id,kind) SELECT NEW.id,id,'area' FROM discovery_places WHERE kind='area' AND lower(name)=lower(trim(NEW.district)) AND NEW.deleted_at IS NULL;
INSERT OR IGNORE INTO discovery_places(kind,name) SELECT 'project', trim(CASE WHEN trim(NEW.development_project) != '' THEN NEW.development_project WHEN instr(NEW.name, ' · ') > 0 THEN substr(NEW.name, 1, instr(NEW.name, ' · ') - 1) ELSE '' END) WHERE trim(CASE WHEN trim(NEW.development_project) != '' THEN NEW.development_project WHEN instr(NEW.name, ' · ') > 0 THEN substr(NEW.name, 1, instr(NEW.name, ' · ') - 1) ELSE '' END) != '';
INSERT INTO listing_places(listing_id,place_id,kind) SELECT NEW.id,id,'project' FROM discovery_places WHERE kind='project' AND lower(name)=lower(trim(CASE WHEN trim(NEW.development_project) != '' THEN NEW.development_project WHEN instr(NEW.name, ' · ') > 0 THEN substr(NEW.name, 1, instr(NEW.name, ' · ') - 1) ELSE '' END)) AND NEW.deleted_at IS NULL;
INSERT OR IGNORE INTO discovery_places(kind,name) SELECT 'university', trim(NEW.university) WHERE trim(NEW.university) != '';
INSERT INTO listing_places(listing_id,place_id,kind) SELECT NEW.id,id,'university' FROM discovery_places WHERE kind='university' AND lower(name)=lower(trim(NEW.university)) AND NEW.deleted_at IS NULL;
END;
