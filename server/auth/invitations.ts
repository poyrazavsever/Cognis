import "server-only";

import { createHash, randomBytes, randomUUID } from "node:crypto";
import { hashPassword } from "better-auth/crypto";
import { and, eq } from "drizzle-orm";
import { z } from "zod";
import type { SessionContext } from "@/server/auth/session";
import { getServerConfig } from "@/server/config";
import { getSqliteConnection } from "@/server/db/client";
import {
  account,
  appProfiles,
  authAuditEvents,
  portalInvitations,
  session,
  user,
} from "@/server/db/schema";
import { getDefaultDisplayName, normalizeAuthEmail } from "@/server/auth/validation";

const DEFAULT_INVITATION_TTL_HOURS = 72;

const createInvitationSchema = z.object({
  clientId: z.string().trim().min(1).max(128),
  email: z.email().transform(normalizeAuthEmail),
  expiresInHours: z.number().int().min(1).max(168).default(DEFAULT_INVITATION_TTL_HOURS),
});

const acceptInvitationSchema = z.object({
  token: z.string().trim().min(32).max(256),
  displayName: z.string().trim().min(1).max(120),
  password: z.string().min(8).max(128),
});

export type PortalInvitationErrorCode =
  | "FORBIDDEN"
  | "INVALID_INPUT"
  | "INVITATION_NOT_FOUND"
  | "INVITATION_NOT_PENDING"
  | "INVITATION_EXPIRED"
  | "CLIENT_ALREADY_LINKED"
  | "EMAIL_ALREADY_REGISTERED";

export class PortalInvitationError extends Error {
  constructor(
    public readonly code: PortalInvitationErrorCode,
    message: string,
  ) {
    super(message);
    this.name = "PortalInvitationError";
  }
}

export type PortalInvitationPreview = {
  email: string;
  expiresAt: Date;
  status: "pending" | "accepted" | "revoked" | "expired";
};

export async function createPortalInvitation(
  actor: SessionContext,
  input: z.input<typeof createInvitationSchema>,
): Promise<{ id: number; invitationUrl: string; expiresAt: Date }> {
  assertFreelancerActor(actor);

  const parsed = parseOrThrow(createInvitationSchema, input);
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashInvitationToken(rawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + parsed.expiresInHours * 60 * 60 * 1000);
  const { db } = getSqliteConnection();

  const invitationId = db.transaction((tx) => {
    const [linkedProfile] = tx
      .select({ id: appProfiles.id })
      .from(appProfiles)
      .where(eq(appProfiles.clientId, parsed.clientId))
      .limit(1)
      .all();

    if (linkedProfile) {
      throw new PortalInvitationError(
        "CLIENT_ALREADY_LINKED",
        "Bu müşteri için portal hesabı zaten mevcut.",
      );
    }

    const replacedInvitations = tx
      .select({ id: portalInvitations.id, email: portalInvitations.email })
      .from(portalInvitations)
      .where(
        and(
          eq(portalInvitations.clientId, parsed.clientId),
          eq(portalInvitations.status, "pending"),
        ),
      )
      .all();

    tx.update(portalInvitations)
      .set({ status: "revoked" })
      .where(
        and(
          eq(portalInvitations.clientId, parsed.clientId),
          eq(portalInvitations.status, "pending"),
        ),
      )
      .run();

    for (const replaced of replacedInvitations) {
      tx.insert(authAuditEvents)
        .values({
          type: "invitation_revoked",
          authUserId: actor.user.id,
          email: replaced.email,
          metadata: { invitationId: replaced.id, reason: "replaced", clientId: parsed.clientId },
        })
        .run();
    }

    const inserted = tx
      .insert(portalInvitations)
      .values({
        tokenHash,
        clientId: parsed.clientId,
        email: parsed.email,
        status: "pending",
        expiresAt,
        createdByUserId: actor.user.id,
        createdAt: now,
      })
      .returning({ id: portalInvitations.id })
      .get();

    tx.insert(authAuditEvents)
      .values({
        type: "invitation_created",
        authUserId: actor.user.id,
        email: parsed.email,
        metadata: {
          invitationId: inserted.id,
          clientId: parsed.clientId,
          expiresAt: expiresAt.toISOString(),
        },
      })
      .run();

    return inserted.id;
  });

  return {
    id: invitationId,
    invitationUrl: `${getServerConfig().appUrl}/invite/${rawToken}`,
    expiresAt,
  };
}

export function getPortalInvitationPreview(rawToken: string): PortalInvitationPreview | null {
  if (!isPlausibleToken(rawToken)) {
    return null;
  }

  const { db } = getSqliteConnection();
  const [invitation] = db
    .select({
      id: portalInvitations.id,
      email: portalInvitations.email,
      status: portalInvitations.status,
      expiresAt: portalInvitations.expiresAt,
    })
    .from(portalInvitations)
    .where(eq(portalInvitations.tokenHash, hashInvitationToken(rawToken)))
    .limit(1)
    .all();

  if (!invitation) {
    return null;
  }

  if (invitation.status === "pending" && invitation.expiresAt.getTime() <= Date.now()) {
    db.transaction((tx) => {
      const result = tx
        .update(portalInvitations)
        .set({ status: "expired" })
        .where(
          and(
            eq(portalInvitations.id, invitation.id),
            eq(portalInvitations.status, "pending"),
          ),
        )
        .run();

      if (result.changes > 0) {
        tx.insert(authAuditEvents)
          .values({
            type: "invitation_expired",
            email: invitation.email,
            metadata: { invitationId: invitation.id },
          })
          .run();
      }
    });

    return { ...invitation, status: "expired" };
  }

  return invitation;
}

export async function acceptPortalInvitation(input: {
  token: string;
  displayName?: string;
  password: string;
}): Promise<{ authUserId: string; clientId: string; email: string }> {
  const preview = getPortalInvitationPreview(input.token);

  if (!preview) {
    await recordInvitationFailure(null, "INVITATION_NOT_FOUND");
    throw new PortalInvitationError("INVITATION_NOT_FOUND", "Davet bağlantısı geçersiz.");
  }

  if (preview.status === "expired") {
    await recordInvitationFailure(preview.email, "INVITATION_EXPIRED");
    throw new PortalInvitationError("INVITATION_EXPIRED", "Davet bağlantısının süresi dolmuş.");
  }

  if (preview.status !== "pending") {
    await recordInvitationFailure(preview.email, "INVITATION_NOT_PENDING");
    throw new PortalInvitationError(
      "INVITATION_NOT_PENDING",
      "Bu davet daha önce kullanılmış veya iptal edilmiş.",
    );
  }

  const parsed = parseOrThrow(acceptInvitationSchema, {
    ...input,
    displayName: input.displayName || getDefaultDisplayName(preview.email),
  });
  const passwordHash = await hashPassword(parsed.password);
  const tokenHash = hashInvitationToken(parsed.token);
  const authUserId = randomUUID();
  const accountId = randomUUID();
  const now = new Date();
  const { db } = getSqliteConnection();

  try {
    return db.transaction((tx) => {
      const [invitation] = tx
        .select()
        .from(portalInvitations)
        .where(eq(portalInvitations.tokenHash, tokenHash))
        .limit(1)
        .all();

      if (!invitation) {
        throw new PortalInvitationError("INVITATION_NOT_FOUND", "Davet bağlantısı geçersiz.");
      }

      if (invitation.status !== "pending") {
        throw new PortalInvitationError(
          "INVITATION_NOT_PENDING",
          "Bu davet daha önce kullanılmış veya iptal edilmiş.",
        );
      }

      if (invitation.expiresAt.getTime() <= now.getTime()) {
        tx.update(portalInvitations)
          .set({ status: "expired" })
          .where(eq(portalInvitations.id, invitation.id))
          .run();
        throw new PortalInvitationError("INVITATION_EXPIRED", "Davet bağlantısının süresi dolmuş.");
      }

      const [existingUser] = tx
        .select({ id: user.id })
        .from(user)
        .where(eq(user.email, invitation.email))
        .limit(1)
        .all();

      if (existingUser) {
        throw new PortalInvitationError(
          "EMAIL_ALREADY_REGISTERED",
          "Bu e-posta adresiyle kayıtlı bir hesap zaten var.",
        );
      }

      const [linkedProfile] = tx
        .select({ id: appProfiles.id })
        .from(appProfiles)
        .where(eq(appProfiles.clientId, invitation.clientId))
        .limit(1)
        .all();

      if (linkedProfile) {
        throw new PortalInvitationError(
          "CLIENT_ALREADY_LINKED",
          "Bu müşteri için portal hesabı zaten mevcut.",
        );
      }

      tx.insert(user)
        .values({
          id: authUserId,
          name: parsed.displayName,
          email: invitation.email,
          emailVerified: false,
          createdAt: now,
          updatedAt: now,
        })
        .run();

      tx.insert(account)
        .values({
          id: accountId,
          accountId: authUserId,
          providerId: "credential",
          userId: authUserId,
          password: passwordHash,
          createdAt: now,
          updatedAt: now,
        })
        .run();

      tx.insert(appProfiles)
        .values({
          authUserId,
          email: invitation.email,
          displayName: parsed.displayName,
          role: "client",
          clientId: invitation.clientId,
          disabled: false,
          createdAt: now,
          updatedAt: now,
        })
        .run();

      const accepted = tx
        .update(portalInvitations)
        .set({ status: "accepted", acceptedAt: now })
        .where(
          and(
            eq(portalInvitations.id, invitation.id),
            eq(portalInvitations.status, "pending"),
          ),
        )
        .run();

      if (accepted.changes !== 1) {
        throw new PortalInvitationError(
          "INVITATION_NOT_PENDING",
          "Davet başka bir istek tarafından kullanıldı.",
        );
      }

      tx.insert(authAuditEvents)
        .values({
          type: "invitation_accepted",
          authUserId,
          email: invitation.email,
          metadata: { invitationId: invitation.id, clientId: invitation.clientId },
        })
        .run();

      return { authUserId, clientId: invitation.clientId, email: invitation.email };
    });
  } catch (error) {
    const code = error instanceof PortalInvitationError ? error.code : "transaction_failed";
    await recordInvitationFailure(preview.email, code);
    throw error;
  }
}

export function revokePortalInvitation(actor: SessionContext, invitationId: number): void {
  assertFreelancerActor(actor);
  const { db } = getSqliteConnection();

  db.transaction((tx) => {
    const [invitation] = tx
      .select({ id: portalInvitations.id, email: portalInvitations.email })
      .from(portalInvitations)
      .where(
        and(
          eq(portalInvitations.id, invitationId),
          eq(portalInvitations.status, "pending"),
        ),
      )
      .limit(1)
      .all();

    if (!invitation) {
      throw new PortalInvitationError(
        "INVITATION_NOT_PENDING",
        "Aktif davet bulunamadı.",
      );
    }

    tx.update(portalInvitations)
      .set({ status: "revoked" })
      .where(eq(portalInvitations.id, invitation.id))
      .run();
    tx.insert(authAuditEvents)
      .values({
        type: "invitation_revoked",
        authUserId: actor.user.id,
        email: invitation.email,
        metadata: { invitationId },
      })
      .run();
  });
}

export function setClientPortalAccess(
  actor: SessionContext,
  clientId: string,
  enabled: boolean,
): void {
  assertFreelancerActor(actor);
  const { db } = getSqliteConnection();

  db.transaction((tx) => {
    const [profile] = tx
      .select({ authUserId: appProfiles.authUserId, email: appProfiles.email })
      .from(appProfiles)
      .where(and(eq(appProfiles.clientId, clientId), eq(appProfiles.role, "client")))
      .limit(1)
      .all();

    if (!profile) {
      throw new PortalInvitationError("INVITATION_NOT_FOUND", "Müşteri portal hesabı bulunamadı.");
    }

    tx.update(appProfiles)
      .set({ disabled: !enabled, updatedAt: new Date() })
      .where(eq(appProfiles.authUserId, profile.authUserId))
      .run();

    if (!enabled) {
      tx.delete(session).where(eq(session.userId, profile.authUserId)).run();
    }

    tx.insert(authAuditEvents)
      .values({
        type: enabled ? "client_access_enabled" : "client_access_disabled",
        authUserId: actor.user.id,
        email: profile.email,
        metadata: { clientId, targetAuthUserId: profile.authUserId },
      })
      .run();
  });
}

export function hashInvitationToken(rawToken: string): string {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}

function assertFreelancerActor(actor: SessionContext): void {
  if (actor.profile.disabled || actor.profile.role !== "freelancer") {
    throw new PortalInvitationError("FORBIDDEN", "Bu işlem için yetkiniz yok.");
  }
}

function isPlausibleToken(value: string): boolean {
  return typeof value === "string" && value.length >= 32 && value.length <= 256;
}

function parseOrThrow<TSchema extends z.ZodType>(
  schema: TSchema,
  input: unknown,
): z.output<TSchema> {
  const result = schema.safeParse(input);

  if (!result.success) {
    throw new PortalInvitationError("INVALID_INPUT", "Girilen bilgiler geçersiz.");
  }

  return result.data;
}

async function recordInvitationFailure(email: string | null, reason: string): Promise<void> {
  const { db } = getSqliteConnection();
  db.insert(authAuditEvents)
    .values({
      type: "invitation_accept_failed",
      email,
      metadata: { reason },
    })
    .run();
}
