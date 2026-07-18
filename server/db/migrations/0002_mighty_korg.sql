ALTER TABLE `app_profiles` ADD `client_id` text;--> statement-breakpoint
CREATE UNIQUE INDEX `app_profiles_client_id_unique` ON `app_profiles` (`client_id`);