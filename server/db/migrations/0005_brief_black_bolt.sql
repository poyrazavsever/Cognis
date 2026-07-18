CREATE TABLE `user_ai_settings` (
	`owner_user_id` text PRIMARY KEY NOT NULL,
	`provider` text DEFAULT 'gemini' NOT NULL,
	`model` text,
	`encrypted_api_key` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "user_ai_settings_provider_check" CHECK("user_ai_settings"."provider" in ('gemini', 'openai', 'groq', 'ollama'))
);
