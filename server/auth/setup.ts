import "server-only";

import { count, eq } from "drizzle-orm";
import { getSqliteConnection } from "@/server/db/client";
import { appProfiles, appSetupState, authAuditEvents, user as authUsers } from "@/server/db/schema";
import type { AuthAuditEventType } from "@/server/auth/types";
import { getDefaultDisplayName, normalizeAuthEmail } from "@/server/auth/validation";

const FIRST_FREELANCER_SETUP_KEY = "first_freelancer";
const SETUP_LOCK_TTL_MS = 10 * 60 * 1000;

export type FirstFreelancerSetupState = {
  available: boolean;
  locked: boolean;
  errorMessage?: string;
};

export async function getFirstFreelancerSetupState(): Promise<FirstFreelancerSetupState> {
  try {
    return readFirstFreelancerSetupState();
  } catch (error) {
    return {
      available: false,
      locked: false,
      errorMessage:
        error instanceof Error
          ? error.message
          : "İlk kurulum durumu okunamadı.",
    };
  }
}

export function readFirstFreelancerSetupState(): FirstFreelancerSetupState {
  const { db } = getSqliteConnection();
  const [{ value: freelancerCount }] = db
    .select({ value: count() })
    .from(appProfiles)
    .where(eq(appProfiles.role, "freelancer"))
    .all();

  if (freelancerCount > 0) {
    return { available: false, locked: false };
  }

  const [setupState] = db
    .select()
    .from(appSetupState)
    .where(eq(appSetupState.key, FIRST_FREELANCER_SETUP_KEY))
    .limit(1)
    .all();

  if (!setupState) {
    return { available: true, locked: false };
  }

  if (setupState.status === "completed") {
    return { available: false, locked: false };
  }

  if (setupState.status === "pending" && setupState.lockedBy) {
    const repaired = repairFirstFreelancerSetupForEmail(setupState.lockedBy);

    if (repaired) {
      return { available: false, locked: false };
    }
  }

  const lockedAt = setupState.lockedAt?.getTime() ?? 0;
  const isStale = Date.now() - lockedAt > SETUP_LOCK_TTL_MS;

  return {
    available: isStale,
    locked: !isStale,
    errorMessage: isStale ? undefined : "İlk kurulum şu anda başka bir istek tarafından işleniyor.",
  };
}

export function repairFirstFreelancerSetupForEmail(email: string): boolean {
  const normalizedEmail = normalizeAuthEmail(email);
  const { db } = getSqliteConnection();

  return db.transaction((tx) => {
    const [{ value: freelancerCount }] = tx
      .select({ value: count() })
      .from(appProfiles)
      .where(eq(appProfiles.role, "freelancer"))
      .all();

    if (freelancerCount > 0) {
      return false;
    }

    const [authUser] = tx
      .select({
        id: authUsers.id,
        email: authUsers.email,
        name: authUsers.name,
      })
      .from(authUsers)
      .where(eq(authUsers.email, normalizedEmail))
      .limit(1)
      .all();

    if (!authUser) {
      return false;
    }

    completeFirstFreelancerSetupInTransaction(tx, authUser);
    return true;
  });
}

export async function reserveFirstFreelancerSetup(email: string): Promise<boolean> {
  const normalizedEmail = normalizeAuthEmail(email);
  const { db } = getSqliteConnection();

  return db.transaction((tx) => {
    const [{ value: freelancerCount }] = tx
      .select({ value: count() })
      .from(appProfiles)
      .where(eq(appProfiles.role, "freelancer"))
      .all();

    if (freelancerCount > 0) {
      return false;
    }

    const [setupState] = tx
      .select()
      .from(appSetupState)
      .where(eq(appSetupState.key, FIRST_FREELANCER_SETUP_KEY))
      .limit(1)
      .all();

    const now = new Date();

    if (setupState?.status === "completed") {
      return false;
    }

    if (setupState?.status === "pending") {
      const lockedAt = setupState.lockedAt?.getTime() ?? 0;
      const lockBelongsToSameEmail = setupState.lockedBy === normalizedEmail;

      if (!lockBelongsToSameEmail && Date.now() - lockedAt <= SETUP_LOCK_TTL_MS) {
        return false;
      }
    }

    tx.insert(appSetupState)
      .values({
        key: FIRST_FREELANCER_SETUP_KEY,
        status: "pending",
        lockedBy: normalizedEmail,
        lockedAt: now,
        updatedAt: now,
      })
      .onConflictDoUpdate({
        target: appSetupState.key,
        set: {
          status: "pending",
          lockedBy: normalizedEmail,
          lockedAt: now,
          updatedAt: now,
        },
      })
      .run();

    tx.insert(authAuditEvents)
      .values({
        type: "setup_started",
        email: normalizedEmail,
        metadata: { source: "better_auth_user_create" },
      })
      .run();

    return true;
  });
}

export async function completeFirstFreelancerSetup(user: {
  id: string;
  email: string;
  name?: string | null;
}): Promise<void> {
  const normalizedEmail = normalizeAuthEmail(user.email);
  const now = new Date();
  const { db } = getSqliteConnection();

  db.transaction((tx) => {
    completeFirstFreelancerSetupInTransaction(tx, {
      id: user.id,
      email: normalizedEmail,
      name: user.name ?? null,
    });
  });
}

type SetupTransaction = Parameters<Parameters<ReturnType<typeof getSqliteConnection>["db"]["transaction"]>[0]>[0];

function completeFirstFreelancerSetupInTransaction(
  tx: SetupTransaction,
  user: {
    id: string;
    email: string;
    name?: string | null;
  },
): void {
  const normalizedEmail = normalizeAuthEmail(user.email);
  const now = new Date();

  tx.insert(appProfiles)
    .values({
      authUserId: user.id,
      email: normalizedEmail,
      displayName: user.name || getDefaultDisplayName(normalizedEmail),
      role: "freelancer",
      disabled: false,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoNothing()
    .run();

  tx.insert(appSetupState)
    .values({
      key: FIRST_FREELANCER_SETUP_KEY,
      status: "completed",
      lockedBy: normalizedEmail,
      lockedAt: now,
      completedAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: appSetupState.key,
      set: {
        status: "completed",
        lockedBy: normalizedEmail,
        completedAt: now,
        updatedAt: now,
      },
    })
    .run();

  tx.insert(authAuditEvents)
    .values({
      type: "setup_completed",
      authUserId: user.id,
      email: normalizedEmail,
      metadata: { role: "freelancer", repaired: true },
    })
    .run();
}

export async function recordAuthAuditEvent(input: {
  type: AuthAuditEventType;
  authUserId?: string | null;
  email?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<void> {
  const { db } = getSqliteConnection();

  db.insert(authAuditEvents)
    .values({
      type: input.type,
      authUserId: input.authUserId ?? null,
      email: input.email ? normalizeAuthEmail(input.email) : null,
      metadata: input.metadata ?? null,
    })
    .run();
}
