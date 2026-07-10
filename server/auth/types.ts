export const userRoles = ["freelancer", "client"] as const;

export type UserRole = (typeof userRoles)[number];

export type SetupStatus = "pending" | "completed";

export type AuthAuditEventType =
  | "setup_started"
  | "setup_completed"
  | "login_succeeded"
  | "login_failed"
  | "logout_succeeded";

