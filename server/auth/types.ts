export const userRoles = ["freelancer", "client"] as const;

export type UserRole = (typeof userRoles)[number];

export type SetupStatus = "pending" | "completed";

export const portalInvitationStatuses = ["pending", "accepted", "revoked", "expired"] as const;

export type PortalInvitationStatus = (typeof portalInvitationStatuses)[number];

export type AuthAuditEventType =
  | "setup_started"
  | "setup_completed"
  | "setup_failed"
  | "registration_rejected"
  | "login_succeeded"
  | "login_failed"
  | "logout_succeeded"
  | "invitation_created"
  | "invitation_revoked"
  | "invitation_expired"
  | "invitation_accepted"
  | "invitation_accept_failed"
  | "client_access_disabled"
  | "client_access_enabled";
