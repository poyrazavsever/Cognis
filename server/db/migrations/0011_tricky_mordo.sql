PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_content_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`field` text NOT NULL,
	`locale` text NOT NULL,
	`value` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT "content_translations_entity_type_check" CHECK("__new_content_translations"."entity_type" in ('branding', 'calendar_event', 'chat_session', 'client', 'client_activity', 'finance_transaction', 'journal_entry', 'planning_section', 'proposal', 'project', 'subscription', 'task')),
	CONSTRAINT "content_translations_field_check" CHECK(length("__new_content_translations"."field") between 1 and 64),
	CONSTRAINT "content_translations_locale_check" CHECK(length("__new_content_translations"."locale") between 2 and 12)
);
--> statement-breakpoint
INSERT INTO `__new_content_translations`("id", "entity_type", "entity_id", "field", "locale", "value", "created_at", "updated_at") SELECT "id", "entity_type", "entity_id", "field", "locale", "value", "created_at", "updated_at" FROM `content_translations`;--> statement-breakpoint
DROP TABLE `content_translations`;--> statement-breakpoint
ALTER TABLE `__new_content_translations` RENAME TO `content_translations`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `content_translations_entity_field_locale_unique` ON `content_translations` (`entity_type`,`entity_id`,`field`,`locale`);--> statement-breakpoint
CREATE INDEX `content_translations_locale_idx` ON `content_translations` (`locale`);--> statement-breakpoint
CREATE INDEX `content_translations_entity_locale_idx` ON `content_translations` (`entity_type`,`entity_id`,`locale`);