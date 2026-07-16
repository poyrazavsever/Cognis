import "server-only";

import { and, eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/server/auth/auth";
import type { UserRole } from "@/server/auth/types";
import { getSqliteConnection } from "@/server/db/client";
import { appProfiles, clients } from "@/server/db/schema";

type BetterAuthSession = NonNullable<Awaited<ReturnType<typeof auth.api.getSession>>>;

export type SessionContext = {
  session: BetterAuthSession["session"];
  user: BetterAuthSession["user"];
  profile: {
    id: number;
    authUserId: string;
    email: string;
    displayName: string;
    role: UserRole;
    clientId: string | null;
    disabled: boolean;
  };
};

export const getSessionContext = cache(async (): Promise<SessionContext | null> => {
  return getSessionContextFromHeaders(await headers());
});

export async function getSessionContextFromHeaders(
  requestHeaders: Headers,
): Promise<SessionContext | null> {
  const session = await auth.api.getSession({
    headers: requestHeaders,
    query: {
      disableCookieCache: true,
    },
  });

  if (!session) {
    return null;
  }

  const profile = getProfileByAuthUserId(session.user.id);

  if (
    !profile ||
    profile.disabled ||
    profile.authUserId !== session.user.id ||
    (profile.role === "client" && !profile.clientId)
  ) {
    return null;
  }

  return {
    session: session.session,
    user: session.user,
    profile,
  };
}

export async function requireSession(): Promise<SessionContext> {
  const context = await getSessionContext();

  if (!context) {
    redirect("/login");
  }

  return context;
}

export async function requireFreelancer(): Promise<SessionContext> {
  const context = await requireSession();

  if (context.profile.role !== "freelancer") {
    redirect("/portal");
  }

  return context;
}

export async function requireClientUser(): Promise<SessionContext> {
  const context = await requireSession();

  if (context.profile.role !== "client" || !context.profile.clientId) {
    redirect("/");
  }

  return context;
}

export function getProfileByAuthUserId(authUserId: string): SessionContext["profile"] | null {
  const { db } = getSqliteConnection();
  const [profile] = db
    .select({
      id: appProfiles.id,
      authUserId: appProfiles.authUserId,
      email: appProfiles.email,
      displayName: appProfiles.displayName,
      role: appProfiles.role,
      clientId: appProfiles.clientId,
      disabled: appProfiles.disabled,
    })
    .from(appProfiles)
    .where(eq(appProfiles.authUserId, authUserId))
    .limit(1)
    .all();

  if (!profile) {
    return null;
  }

  if (profile.role === "client") {
    if (!profile.clientId) return null;

    const linkedClient = db
      .select({ id: clients.id })
      .from(clients)
      .where(
        and(
          eq(clients.id, profile.clientId),
          eq(clients.authUserId, profile.authUserId),
        ),
      )
      .get();

    if (!linkedClient) return null;
  }

  return profile;
}
