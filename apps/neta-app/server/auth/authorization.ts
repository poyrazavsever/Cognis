import "server-only";

import type { SessionContext } from "@/server/auth/session";
import type { UserRole } from "@/server/auth/types";

export class AuthorizationError extends Error {
  constructor(
    message = "Bu işlem için yetkiniz yok.",
    public readonly code: "UNAUTHENTICATED" | "FORBIDDEN" | "NOT_FOUND" = "FORBIDDEN",
  ) {
    super(message);
    this.name = "AuthorizationError";
  }
}

export function assertRole(context: SessionContext | null, allowedRoles: readonly UserRole[]): void {
  if (!context) {
    throw new AuthorizationError("Oturum gerekli.", "UNAUTHENTICATED");
  }

  if (!allowedRoles.includes(context.profile.role)) {
    throw new AuthorizationError();
  }
}

export function assertSameOwner(context: SessionContext | null, ownerAuthUserId: string): void {
  if (!context) {
    throw new AuthorizationError("Oturum gerekli.", "UNAUTHENTICATED");
  }

  if (context.user.id !== ownerAuthUserId) {
    throw new AuthorizationError("Kaynak bulunamadı.", "NOT_FOUND");
  }
}

export function assertEnabledUser(context: SessionContext | null): void {
  if (!context) {
    throw new AuthorizationError("Oturum gerekli.", "UNAUTHENTICATED");
  }

  if (context.profile.disabled) {
    throw new AuthorizationError();
  }
}

