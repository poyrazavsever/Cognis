CREATE TABLE `calendar_events` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`client_id` text,
	`project_id` text,
	`task_id` text,
	`title` text NOT NULL,
	`description` text,
	`type` text DEFAULT 'focus' NOT NULL,
	`starts_at` integer NOT NULL,
	`ends_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "calendar_events_type_check" CHECK("calendar_events"."type" in ('meeting', 'focus', 'deadline', 'personal', 'finance')),
	CONSTRAINT "calendar_events_time_check" CHECK("calendar_events"."ends_at" is null or "calendar_events"."ends_at" >= "calendar_events"."starts_at")
);
--> statement-breakpoint
CREATE INDEX `calendar_events_owner_range_idx` ON `calendar_events` (`owner_user_id`,`starts_at`);--> statement-breakpoint
CREATE INDEX `calendar_events_project_id_idx` ON `calendar_events` (`project_id`);--> statement-breakpoint
CREATE INDEX `calendar_events_task_id_idx` ON `calendar_events` (`task_id`);--> statement-breakpoint
CREATE TABLE `chat_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`session_id` text NOT NULL,
	`role` text NOT NULL,
	`content` text NOT NULL,
	`context_journal_entry_ids` text DEFAULT '[]' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`session_id`) REFERENCES `chat_sessions`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "chat_messages_role_check" CHECK("chat_messages"."role" in ('system', 'user', 'assistant', 'tool'))
);
--> statement-breakpoint
CREATE INDEX `chat_messages_session_created_idx` ON `chat_messages` (`session_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `chat_sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`title` text NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `chat_sessions_owner_updated_idx` ON `chat_sessions` (`owner_user_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `client_activities` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`client_id` text NOT NULL,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`activity_date` integer NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "client_activities_type_check" CHECK("client_activities"."type" in ('note', 'call', 'meeting', 'email'))
);
--> statement-breakpoint
CREATE INDEX `client_activities_owner_client_idx` ON `client_activities` (`owner_user_id`,`client_id`);--> statement-breakpoint
CREATE INDEX `client_activities_client_date_idx` ON `client_activities` (`client_id`,`activity_date`);--> statement-breakpoint
CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`auth_user_id` text,
	`name` text NOT NULL,
	`company_name` text,
	`email` text,
	`phone` text,
	`website` text,
	`status` text DEFAULT 'active' NOT NULL,
	`pipeline_stage` text DEFAULT 'lead' NOT NULL,
	`next_follow_up_date` text,
	`notes` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`auth_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "clients_status_check" CHECK("clients"."status" in ('active', 'paused', 'archived')),
	CONSTRAINT "clients_pipeline_stage_check" CHECK("clients"."pipeline_stage" in ('lead', 'contacted', 'proposal_sent', 'won', 'lost'))
);
--> statement-breakpoint
CREATE UNIQUE INDEX `clients_auth_user_id_unique` ON `clients` (`auth_user_id`);--> statement-breakpoint
CREATE INDEX `clients_owner_user_id_idx` ON `clients` (`owner_user_id`);--> statement-breakpoint
CREATE INDEX `clients_owner_status_idx` ON `clients` (`owner_user_id`,`status`);--> statement-breakpoint
CREATE INDEX `clients_owner_pipeline_idx` ON `clients` (`owner_user_id`,`pipeline_stage`);--> statement-breakpoint
CREATE INDEX `clients_next_follow_up_date_idx` ON `clients` (`next_follow_up_date`);--> statement-breakpoint
CREATE TABLE `contracts` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`proposal_id` text,
	`client_id` text,
	`title` text NOT NULL,
	`content` text,
	`status` text DEFAULT 'draft' NOT NULL,
	`signed_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`proposal_id`) REFERENCES `proposals`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "contracts_status_check" CHECK("contracts"."status" in ('draft', 'active', 'completed', 'cancelled'))
);
--> statement-breakpoint
CREATE INDEX `contracts_owner_status_idx` ON `contracts` (`owner_user_id`,`status`);--> statement-breakpoint
CREATE TABLE `finance_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`client_id` text,
	`project_id` text,
	`type` text NOT NULL,
	`amount_minor` integer NOT NULL,
	`currency` text DEFAULT 'USD' NOT NULL,
	`transaction_date` text NOT NULL,
	`category` text,
	`payment_status` text DEFAULT 'planned' NOT NULL,
	`description` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "finance_transactions_type_check" CHECK("finance_transactions"."type" in ('income', 'expense')),
	CONSTRAINT "finance_transactions_amount_check" CHECK("finance_transactions"."amount_minor" >= 0),
	CONSTRAINT "finance_transactions_payment_status_check" CHECK("finance_transactions"."payment_status" in ('planned', 'pending', 'paid', 'cancelled')),
	CONSTRAINT "finance_transactions_currency_check" CHECK(length("finance_transactions"."currency") = 3)
);
--> statement-breakpoint
CREATE INDEX `finance_transactions_owner_date_idx` ON `finance_transactions` (`owner_user_id`,`transaction_date`);--> statement-breakpoint
CREATE INDEX `finance_transactions_owner_type_idx` ON `finance_transactions` (`owner_user_id`,`type`);--> statement-breakpoint
CREATE INDEX `finance_transactions_client_id_idx` ON `finance_transactions` (`client_id`);--> statement-breakpoint
CREATE INDEX `finance_transactions_project_id_idx` ON `finance_transactions` (`project_id`);--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`client_id` text,
	`project_id` text,
	`invoice_number` text NOT NULL,
	`amount_minor` integer DEFAULT 0 NOT NULL,
	`tax_basis_points` integer DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'TRY' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`issue_date` text NOT NULL,
	`due_date` text,
	`paid_at` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "invoices_status_check" CHECK("invoices"."status" in ('draft', 'sent', 'paid', 'overdue', 'cancelled')),
	CONSTRAINT "invoices_amount_check" CHECK("invoices"."amount_minor" >= 0),
	CONSTRAINT "invoices_tax_check" CHECK("invoices"."tax_basis_points" between 0 and 10000)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invoices_owner_number_unique` ON `invoices` (`owner_user_id`,`invoice_number`);--> statement-breakpoint
CREATE INDEX `invoices_owner_status_idx` ON `invoices` (`owner_user_id`,`status`);--> statement-breakpoint
CREATE TABLE `journal_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`entry_date` text NOT NULL,
	`mood_score` integer,
	`energy_score` integer,
	`work_satisfaction_score` integer,
	`mood_label` text,
	`note` text,
	`legacy_ai_metadata` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "journal_entries_mood_score_check" CHECK("journal_entries"."mood_score" is null or "journal_entries"."mood_score" between 1 and 5),
	CONSTRAINT "journal_entries_energy_score_check" CHECK("journal_entries"."energy_score" is null or "journal_entries"."energy_score" between 1 and 5),
	CONSTRAINT "journal_entries_work_score_check" CHECK("journal_entries"."work_satisfaction_score" is null or "journal_entries"."work_satisfaction_score" between 1 and 5)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `journal_entries_owner_date_unique` ON `journal_entries` (`owner_user_id`,`entry_date`);--> statement-breakpoint
CREATE INDEX `journal_entries_owner_date_idx` ON `journal_entries` (`owner_user_id`,`entry_date`);--> statement-breakpoint
CREATE TABLE `project_planning_sections` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`project_id` text NOT NULL,
	`category` text NOT NULL,
	`title` text NOT NULL,
	`content` text,
	`metadata` text DEFAULT '{}' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "project_planning_sections_category_check" CHECK("project_planning_sections"."category" in ('overview', 'problem', 'goal', 'audience', 'scope', 'design_system', 'color_palette', 'typography', 'assets', 'notes'))
);
--> statement-breakpoint
CREATE INDEX `project_planning_sections_owner_idx` ON `project_planning_sections` (`owner_user_id`);--> statement-breakpoint
CREATE INDEX `project_planning_sections_project_order_idx` ON `project_planning_sections` (`project_id`,`sort_order`);--> statement-breakpoint
CREATE TABLE `project_revisions` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`project_id` text NOT NULL,
	`client_id` text NOT NULL,
	`requested_by_user_id` text NOT NULL,
	`description` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`requested_by_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "project_revisions_status_check" CHECK("project_revisions"."status" in ('pending', 'in_progress', 'completed', 'rejected'))
);
--> statement-breakpoint
CREATE INDEX `project_revisions_owner_project_idx` ON `project_revisions` (`owner_user_id`,`project_id`);--> statement-breakpoint
CREATE INDEX `project_revisions_client_project_idx` ON `project_revisions` (`client_id`,`project_id`);--> statement-breakpoint
CREATE TABLE `projects` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`client_id` text,
	`name` text NOT NULL,
	`type` text DEFAULT 'client_project' NOT NULL,
	`description` text,
	`status` text DEFAULT 'planning' NOT NULL,
	`start_date` text,
	`due_date` text,
	`budget_amount_minor` integer,
	`currency` text DEFAULT 'USD' NOT NULL,
	`progress` integer DEFAULT 0 NOT NULL,
	`progress_type` text DEFAULT 'manual' NOT NULL,
	`revision_quota` integer DEFAULT 0 NOT NULL,
	`legacy_cover_image_path` text,
	`cover_image_alt` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "projects_type_check" CHECK("projects"."type" in ('client_project', 'side_project')),
	CONSTRAINT "projects_status_check" CHECK("projects"."status" in ('planning', 'active', 'paused', 'completed', 'cancelled')),
	CONSTRAINT "projects_progress_check" CHECK("projects"."progress" between 0 and 100),
	CONSTRAINT "projects_revision_quota_check" CHECK("projects"."revision_quota" >= 0),
	CONSTRAINT "projects_budget_check" CHECK("projects"."budget_amount_minor" is null or "projects"."budget_amount_minor" >= 0),
	CONSTRAINT "projects_currency_check" CHECK(length("projects"."currency") = 3)
);
--> statement-breakpoint
CREATE INDEX `projects_owner_user_id_idx` ON `projects` (`owner_user_id`);--> statement-breakpoint
CREATE INDEX `projects_owner_status_idx` ON `projects` (`owner_user_id`,`status`);--> statement-breakpoint
CREATE INDEX `projects_client_id_idx` ON `projects` (`client_id`);--> statement-breakpoint
CREATE INDEX `projects_due_date_idx` ON `projects` (`due_date`);--> statement-breakpoint
CREATE TABLE `proposals` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`client_id` text,
	`project_id` text,
	`title` text NOT NULL,
	`description` text,
	`amount_minor` integer DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'TRY' NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`valid_until` integer,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "proposals_status_check" CHECK("proposals"."status" in ('draft', 'sent', 'accepted', 'rejected')),
	CONSTRAINT "proposals_amount_check" CHECK("proposals"."amount_minor" >= 0)
);
--> statement-breakpoint
CREATE INDEX `proposals_owner_status_idx` ON `proposals` (`owner_user_id`,`status`);--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`name` text NOT NULL,
	`amount_minor` integer DEFAULT 0 NOT NULL,
	`currency` text DEFAULT 'TRY' NOT NULL,
	`billing_cycle` text DEFAULT 'monthly' NOT NULL,
	`next_billing_date` text,
	`status` text DEFAULT 'active' NOT NULL,
	`category` text,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "subscriptions_cycle_check" CHECK("subscriptions"."billing_cycle" in ('weekly', 'monthly', 'yearly')),
	CONSTRAINT "subscriptions_status_check" CHECK("subscriptions"."status" in ('active', 'cancelled')),
	CONSTRAINT "subscriptions_amount_check" CHECK("subscriptions"."amount_minor" >= 0)
);
--> statement-breakpoint
CREATE INDEX `subscriptions_owner_status_idx` ON `subscriptions` (`owner_user_id`,`status`);--> statement-breakpoint
CREATE INDEX `subscriptions_next_billing_date_idx` ON `subscriptions` (`next_billing_date`);--> statement-breakpoint
CREATE TABLE `tasks` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_user_id` text NOT NULL,
	`client_id` text,
	`project_id` text,
	`source_journal_entry_id` text,
	`title` text NOT NULL,
	`description` text,
	`status` text DEFAULT 'todo' NOT NULL,
	`priority` text DEFAULT 'medium' NOT NULL,
	`scheduled_date` text,
	`due_at` integer,
	`estimated_minutes` integer,
	`actual_minutes` integer,
	`ai_generated` integer DEFAULT false NOT NULL,
	`is_public_to_client` integer DEFAULT false NOT NULL,
	`created_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	`updated_at` integer DEFAULT (cast(unixepoch('subsecond') * 1000 as integer)) NOT NULL,
	FOREIGN KEY (`owner_user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`project_id`) REFERENCES `projects`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`source_journal_entry_id`) REFERENCES `journal_entries`(`id`) ON UPDATE no action ON DELETE set null,
	CONSTRAINT "tasks_status_check" CHECK("tasks"."status" in ('todo', 'in_progress', 'done', 'cancelled')),
	CONSTRAINT "tasks_priority_check" CHECK("tasks"."priority" in ('low', 'medium', 'high', 'urgent')),
	CONSTRAINT "tasks_estimated_minutes_check" CHECK("tasks"."estimated_minutes" is null or "tasks"."estimated_minutes" >= 0),
	CONSTRAINT "tasks_actual_minutes_check" CHECK("tasks"."actual_minutes" is null or "tasks"."actual_minutes" >= 0)
);
--> statement-breakpoint
CREATE INDEX `tasks_owner_user_id_idx` ON `tasks` (`owner_user_id`);--> statement-breakpoint
CREATE INDEX `tasks_owner_status_idx` ON `tasks` (`owner_user_id`,`status`);--> statement-breakpoint
CREATE INDEX `tasks_project_id_idx` ON `tasks` (`project_id`);--> statement-breakpoint
CREATE INDEX `tasks_client_id_idx` ON `tasks` (`client_id`);--> statement-breakpoint
CREATE INDEX `tasks_due_at_idx` ON `tasks` (`due_at`);