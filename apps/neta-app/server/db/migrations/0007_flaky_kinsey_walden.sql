CREATE TABLE `instance_settings` (
	`key` text PRIMARY KEY NOT NULL,
	`instance_id` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `instance_settings_instance_id_unique` ON `instance_settings` (`instance_id`);