export const clientStatuses = ["active", "paused", "archived"] as const;
export const clientPipelineStages = ["lead", "contacted", "proposal_sent", "won", "lost"] as const;
export const clientActivityTypes = ["note", "call", "meeting", "email"] as const;
export const projectTypes = ["client_project", "side_project"] as const;
export const projectStatuses = ["planning", "active", "paused", "completed", "cancelled"] as const;
export const projectProgressTypes = ["manual", "auto"] as const;
export const taskStatuses = ["todo", "in_progress", "done", "cancelled"] as const;
export const taskPriorities = ["low", "medium", "high", "urgent"] as const;
export const calendarEventTypes = ["meeting", "focus", "deadline", "personal", "finance"] as const;
export const financeTransactionTypes = ["income", "expense"] as const;
export const paymentStatuses = ["planned", "pending", "paid", "cancelled"] as const;
export const planningSectionCategories = [
  "overview",
  "problem",
  "goal",
  "audience",
  "scope",
  "design_system",
  "color_palette",
  "typography",
  "assets",
  "notes",
] as const;
export const revisionStatuses = ["pending", "in_progress", "completed", "rejected"] as const;
export const chatMessageRoles = ["system", "user", "assistant", "tool"] as const;
export const proposalStatuses = ["draft", "sent", "accepted", "rejected"] as const;
export const contractStatuses = ["draft", "active", "completed", "cancelled"] as const;
export const invoiceStatuses = ["draft", "sent", "paid", "overdue", "cancelled"] as const;
export const subscriptionBillingCycles = ["weekly", "monthly", "yearly"] as const;
export const subscriptionStatuses = ["active", "cancelled"] as const;

export type ClientStatus = (typeof clientStatuses)[number];
export type ClientPipelineStage = (typeof clientPipelineStages)[number];
export type ClientActivityType = (typeof clientActivityTypes)[number];
export type ProjectType = (typeof projectTypes)[number];
export type ProjectStatus = (typeof projectStatuses)[number];
export type ProjectProgressType = (typeof projectProgressTypes)[number];
export type TaskStatus = (typeof taskStatuses)[number];
export type TaskPriority = (typeof taskPriorities)[number];
export type CalendarEventType = (typeof calendarEventTypes)[number];
export type FinanceTransactionType = (typeof financeTransactionTypes)[number];
export type PaymentStatus = (typeof paymentStatuses)[number];
export type PlanningSectionCategory = (typeof planningSectionCategories)[number];
export type RevisionStatus = (typeof revisionStatuses)[number];
export type ChatMessageRole = (typeof chatMessageRoles)[number];
export type ProposalStatus = (typeof proposalStatuses)[number];
export type ContractStatus = (typeof contractStatuses)[number];
export type InvoiceStatus = (typeof invoiceStatuses)[number];
export type SubscriptionBillingCycle = (typeof subscriptionBillingCycles)[number];
export type SubscriptionStatus = (typeof subscriptionStatuses)[number];

export const fileKinds = ["avatar", "branding_logo", "branding_icon", "project_asset"] as const;
export type FileKind = (typeof fileKinds)[number];

export const fileVisibilities = ["private", "portal", "public_branding"] as const;
export type FileVisibility = (typeof fileVisibilities)[number];

export const brandingColorModes = ["light", "dark", "system"] as const;
export type BrandingColorMode = (typeof brandingColorModes)[number];

export const brandingRadiusScales = ["compact", "default", "soft"] as const;
export type BrandingRadiusScale = (typeof brandingRadiusScales)[number];
