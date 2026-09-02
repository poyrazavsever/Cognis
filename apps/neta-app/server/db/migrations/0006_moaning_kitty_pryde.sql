CREATE TABLE `user_preferences` (
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
	CONSTRAINT "user_preferences_currency_check" CHECK(length("user_preferences"."default_currency") = 3),
	CONSTRAINT "user_preferences_language_check" CHECK("user_preferences"."language" in ('tr', 'en')),
	CONSTRAINT "user_preferences_color_mode_check" CHECK("user_preferences"."color_mode" in ('light', 'dark', 'system'))
);
