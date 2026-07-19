CREATE TABLE `content_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`entity_type` text NOT NULL,
	`entity_id` text NOT NULL,
	`field` text NOT NULL,
	`locale` text NOT NULL,
	`value` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT "content_translations_entity_type_check" CHECK("content_translations"."entity_type" in ('branding', 'calendar_event', 'client', 'planning_section', 'project', 'task')),
	CONSTRAINT "content_translations_field_check" CHECK(length("content_translations"."field") between 1 and 64),
	CONSTRAINT "content_translations_locale_check" CHECK(length("content_translations"."locale") between 2 and 12)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `content_translations_entity_field_locale_unique` ON `content_translations` (`entity_type`,`entity_id`,`field`,`locale`);--> statement-breakpoint
CREATE INDEX `content_translations_locale_idx` ON `content_translations` (`locale`);--> statement-breakpoint
CREATE INDEX `content_translations_entity_locale_idx` ON `content_translations` (`entity_type`,`entity_id`,`locale`);--> statement-breakpoint
INSERT INTO `content_translations` (`entity_type`, `entity_id`, `field`, `locale`, `value`)
SELECT 'project', `id`, 'name', 'tr', `name` FROM `projects` WHERE coalesce(trim(`name`), '') != ''
ON CONFLICT(`entity_type`, `entity_id`, `field`, `locale`) DO UPDATE SET
  `value` = excluded.`value`,
  `updated_at` = cast(unixepoch('subsecond') * 1000 as integer);--> statement-breakpoint
INSERT INTO `content_translations` (`entity_type`, `entity_id`, `field`, `locale`, `value`)
SELECT 'project', `id`, 'description', 'tr', `description` FROM `projects` WHERE coalesce(trim(`description`), '') != ''
ON CONFLICT(`entity_type`, `entity_id`, `field`, `locale`) DO UPDATE SET
  `value` = excluded.`value`,
  `updated_at` = cast(unixepoch('subsecond') * 1000 as integer);--> statement-breakpoint
INSERT INTO `content_translations` (`entity_type`, `entity_id`, `field`, `locale`, `value`)
SELECT 'project', `id`, 'coverImageAlt', 'tr', `cover_image_alt` FROM `projects` WHERE coalesce(trim(`cover_image_alt`), '') != ''
ON CONFLICT(`entity_type`, `entity_id`, `field`, `locale`) DO UPDATE SET
  `value` = excluded.`value`,
  `updated_at` = cast(unixepoch('subsecond') * 1000 as integer);--> statement-breakpoint
INSERT INTO `content_translations` (`entity_type`, `entity_id`, `field`, `locale`, `value`)
SELECT 'task', `id`, 'title', 'tr', `title` FROM `tasks` WHERE coalesce(trim(`title`), '') != ''
ON CONFLICT(`entity_type`, `entity_id`, `field`, `locale`) DO UPDATE SET
  `value` = excluded.`value`,
  `updated_at` = cast(unixepoch('subsecond') * 1000 as integer);--> statement-breakpoint
INSERT INTO `content_translations` (`entity_type`, `entity_id`, `field`, `locale`, `value`)
SELECT 'task', `id`, 'description', 'tr', `description` FROM `tasks` WHERE coalesce(trim(`description`), '') != ''
ON CONFLICT(`entity_type`, `entity_id`, `field`, `locale`) DO UPDATE SET
  `value` = excluded.`value`,
  `updated_at` = cast(unixepoch('subsecond') * 1000 as integer);--> statement-breakpoint
INSERT INTO `content_translations` (`entity_type`, `entity_id`, `field`, `locale`, `value`)
SELECT 'planning_section', `id`, 'title', 'tr', `title` FROM `project_planning_sections` WHERE coalesce(trim(`title`), '') != ''
ON CONFLICT(`entity_type`, `entity_id`, `field`, `locale`) DO UPDATE SET
  `value` = excluded.`value`,
  `updated_at` = cast(unixepoch('subsecond') * 1000 as integer);--> statement-breakpoint
INSERT INTO `content_translations` (`entity_type`, `entity_id`, `field`, `locale`, `value`)
SELECT 'planning_section', `id`, 'content', 'tr', `content` FROM `project_planning_sections` WHERE coalesce(trim(`content`), '') != ''
ON CONFLICT(`entity_type`, `entity_id`, `field`, `locale`) DO UPDATE SET
  `value` = excluded.`value`,
  `updated_at` = cast(unixepoch('subsecond') * 1000 as integer);--> statement-breakpoint
INSERT INTO `content_translations` (`entity_type`, `entity_id`, `field`, `locale`, `value`)
SELECT 'branding', `id`, 'portalWelcome', 'tr', `portal_welcome_text` FROM `instance_branding` WHERE coalesce(trim(`portal_welcome_text`), '') != ''
ON CONFLICT(`entity_type`, `entity_id`, `field`, `locale`) DO UPDATE SET
  `value` = excluded.`value`,
  `updated_at` = cast(unixepoch('subsecond') * 1000 as integer);--> statement-breakpoint
INSERT INTO `content_translations` (`entity_type`, `entity_id`, `field`, `locale`, `value`)
SELECT 'branding', `id`, 'portalFooter', 'tr', `portal_footer_text` FROM `instance_branding` WHERE coalesce(trim(`portal_footer_text`), '') != ''
ON CONFLICT(`entity_type`, `entity_id`, `field`, `locale`) DO UPDATE SET
  `value` = excluded.`value`,
  `updated_at` = cast(unixepoch('subsecond') * 1000 as integer);--> statement-breakpoint
CREATE TABLE `instance_i18n_settings` (
	`key` text PRIMARY KEY DEFAULT 'default' NOT NULL,
	`default_locale` text DEFAULT 'tr' NOT NULL,
	`catalog_version` integer DEFAULT 1 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `instance_locales` (
	`code` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`native_name` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`fallback_locale` text,
	`text_direction` text DEFAULT 'ltr' NOT NULL,
	`built_in` integer DEFAULT false NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT "instance_locales_code_check" CHECK("instance_locales"."code" glob '[a-z][a-z]' or "instance_locales"."code" glob '[a-z][a-z]-[A-Z][A-Z]' or "instance_locales"."code" glob '[a-z][a-z]-[A-Z][A-Z][0-9]'),
	CONSTRAINT "instance_locales_status_check" CHECK("instance_locales"."status" in ('draft', 'active', 'archived', 'test')),
	CONSTRAINT "instance_locales_direction_check" CHECK("instance_locales"."text_direction" in ('ltr', 'rtl')),
	CONSTRAINT "instance_locales_not_self_fallback_check" CHECK("instance_locales"."fallback_locale" is null or "instance_locales"."fallback_locale" != "instance_locales"."code")
);
--> statement-breakpoint
CREATE INDEX `instance_locales_status_idx` ON `instance_locales` (`status`);--> statement-breakpoint
CREATE INDEX `instance_locales_fallback_idx` ON `instance_locales` (`fallback_locale`);--> statement-breakpoint
INSERT INTO `instance_locales` (`code`, `name`, `native_name`, `status`, `fallback_locale`, `text_direction`, `built_in`, `sort_order`)
VALUES
  ('tr', 'Turkish', 'Türkçe', 'active', null, 'ltr', 1, 10),
  ('en', 'English', 'English', 'active', 'tr', 'ltr', 1, 20)
ON CONFLICT(`code`) DO UPDATE SET
  `name` = excluded.`name`,
  `native_name` = excluded.`native_name`,
  `status` = excluded.`status`,
  `fallback_locale` = excluded.`fallback_locale`,
  `text_direction` = excluded.`text_direction`,
  `built_in` = excluded.`built_in`,
  `sort_order` = excluded.`sort_order`,
  `updated_at` = cast(unixepoch('subsecond') * 1000 as integer);--> statement-breakpoint
CREATE TABLE `instance_ui_translations` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`locale` text NOT NULL,
	`namespace` text NOT NULL,
	`translation_key` text NOT NULL,
	`value` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	CONSTRAINT "instance_ui_translations_locale_check" CHECK(length("instance_ui_translations"."locale") between 2 and 12),
	CONSTRAINT "instance_ui_translations_namespace_check" CHECK(length("instance_ui_translations"."namespace") between 1 and 64),
	CONSTRAINT "instance_ui_translations_key_check" CHECK(length("instance_ui_translations"."translation_key") between 1 and 160)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `instance_ui_translations_locale_key_unique` ON `instance_ui_translations` (`locale`,`namespace`,`translation_key`);--> statement-breakpoint
CREATE INDEX `instance_ui_translations_locale_namespace_idx` ON `instance_ui_translations` (`locale`,`namespace`);--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_user_preferences` (
	`owner_user_id` text PRIMARY KEY NOT NULL,
	`timezone` text DEFAULT 'Europe/Istanbul' NOT NULL,
	`default_currency` text DEFAULT 'TRY' NOT NULL,
	`language` text DEFAULT 'tr' NOT NULL,
	`date_format` text DEFAULT 'dd.MM.yyyy' NOT NULL,
	`color_mode` text DEFAULT 'system' NOT NULL,
	`sidebar_collapsed` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "user_preferences_currency_check" CHECK(length("__new_user_preferences"."default_currency") = 3),
	CONSTRAINT "user_preferences_language_check" CHECK(length("__new_user_preferences"."language") between 2 and 12),
	CONSTRAINT "user_preferences_color_mode_check" CHECK("__new_user_preferences"."color_mode" in ('light', 'dark', 'system'))
);
--> statement-breakpoint
INSERT INTO `__new_user_preferences`("owner_user_id", "timezone", "default_currency", "language", "date_format", "color_mode", "sidebar_collapsed", "created_at", "updated_at") SELECT "owner_user_id", "timezone", "default_currency", "language", "date_format", "color_mode", "sidebar_collapsed", "created_at", "updated_at" FROM `user_preferences`;--> statement-breakpoint
DROP TABLE `user_preferences`;--> statement-breakpoint
ALTER TABLE `__new_user_preferences` RENAME TO `user_preferences`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
UPDATE `user_preferences`
SET `language` = 'tr'
WHERE length(`language`) < 2 OR length(`language`) > 12;--> statement-breakpoint
INSERT INTO `instance_i18n_settings` (`key`, `default_locale`, `catalog_version`)
VALUES ('default', 'tr', 1)
ON CONFLICT(`key`) DO UPDATE SET
  `default_locale` = CASE
    WHEN `instance_i18n_settings`.`default_locale` IS NULL OR `instance_i18n_settings`.`default_locale` = '' THEN excluded.`default_locale`
    ELSE `instance_i18n_settings`.`default_locale`
  END,
  `catalog_version` = max(`instance_i18n_settings`.`catalog_version`, excluded.`catalog_version`),
  `updated_at` = cast(unixepoch('subsecond') * 1000 as integer);--> statement-breakpoint
ALTER TABLE `portal_invitations` ADD `locale` text DEFAULT 'tr' NOT NULL;--> statement-breakpoint
CREATE INDEX `portal_invitations_locale_idx` ON `portal_invitations` (`locale`);--> statement-breakpoint
ALTER TABLE `clients` ADD `portal_locale` text;--> statement-breakpoint
CREATE INDEX `clients_portal_locale_idx` ON `clients` (`portal_locale`);
