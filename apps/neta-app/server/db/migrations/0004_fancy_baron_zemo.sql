CREATE TABLE `files` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`uploaded_by_user_id` text NOT NULL,
	`auth_user_id` text,
	`project_id` text,
	`kind` text NOT NULL,
	`visibility` text DEFAULT 'private' NOT NULL,
	`storage_path` text NOT NULL,
	`original_name` text NOT NULL,
	`mime_type` text NOT NULL,
	`byte_size` integer NOT NULL,
	`sha256` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`uploaded_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`auth_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "files_kind_check" CHECK("files"."kind" in ('avatar', 'branding_logo', 'branding_icon', 'project_asset')),
	CONSTRAINT "files_visibility_check" CHECK("files"."visibility" in ('private', 'portal', 'public_branding')),
	CONSTRAINT "files_byte_size_check" CHECK("files"."byte_size" > 0),
	CONSTRAINT "files_sha256_check" CHECK(length("files"."sha256") = 64),
	CONSTRAINT "files_storage_path_check" CHECK("files"."storage_path" not like '/%' and instr("files"."storage_path", '..') = 0),
	CONSTRAINT "files_resource_check" CHECK((
        ("files"."kind" = 'avatar' and "files"."auth_user_id" is not null and "files"."project_id" is null and "files"."visibility" = 'private')
        or ("files"."kind" in ('branding_logo', 'branding_icon') and "files"."auth_user_id" is null and "files"."project_id" is null and "files"."visibility" = 'public_branding')
        or ("files"."kind" = 'project_asset' and "files"."auth_user_id" is null and "files"."project_id" is not null and "files"."visibility" in ('private', 'portal'))
      ))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `files_storage_path_unique` ON `files` (`storage_path`);--> statement-breakpoint
CREATE INDEX `files_owner_kind_idx` ON `files` (`owner_user_id`,`kind`);--> statement-breakpoint
CREATE INDEX `files_auth_user_id_idx` ON `files` (`auth_user_id`);--> statement-breakpoint
CREATE INDEX `files_project_id_idx` ON `files` (`project_id`);--> statement-breakpoint
CREATE INDEX `files_sha256_idx` ON `files` (`sha256`);--> statement-breakpoint
CREATE TABLE `instance_branding` (
	`id` text PRIMARY KEY DEFAULT 'default' NOT NULL,
	`owner_user_id` text NOT NULL,
	`application_name` text DEFAULT 'Neta' NOT NULL,
	`short_name` text DEFAULT 'Neta' NOT NULL,
	`primary_color` text DEFAULT '#C81E1E' NOT NULL,
	`accent_color` text DEFAULT '#E6EDF5' NOT NULL,
	`light_logo_file_id` text,
	`dark_logo_file_id` text,
	`icon_file_id` text,
	`default_color_mode` text DEFAULT 'system' NOT NULL,
	`radius_scale` text DEFAULT 'default' NOT NULL,
	`organization_name` text,
	`support_email` text,
	`portal_welcome_text` text,
	`portal_footer_text` text,
	`updated_by_user_id` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`light_logo_file_id`) REFERENCES `files`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`dark_logo_file_id`) REFERENCES `files`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`icon_file_id`) REFERENCES `files`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`updated_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE restrict,
	CONSTRAINT "instance_branding_id_check" CHECK("instance_branding"."id" = 'default'),
	CONSTRAINT "instance_branding_primary_color_check" CHECK("instance_branding"."primary_color" glob '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
	CONSTRAINT "instance_branding_accent_color_check" CHECK("instance_branding"."accent_color" glob '#[0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f][0-9A-Fa-f]'),
	CONSTRAINT "instance_branding_color_mode_check" CHECK("instance_branding"."default_color_mode" in ('light', 'dark', 'system')),
	CONSTRAINT "instance_branding_radius_scale_check" CHECK("instance_branding"."radius_scale" in ('compact', 'default', 'soft'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `instance_branding_owner_unique` ON `instance_branding` (`owner_user_id`);