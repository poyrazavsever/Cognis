import "server-only";

import { eq } from "drizzle-orm";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { cache } from "react";
import { auth } from "@/server/auth/auth";
import type { UserRole } from "@/server/auth/types";
import { getSqliteConnection } from "@/server/db/client";
import { appProfiles } from "@/server/db/schema";

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
    disabled: boolean;
  };
};

export const getSessionContext = cache(async (): Promise<SessionContext | null> => {
  const session = await auth.api.getSession({
    headers: await headers(),
    query: {
      disableCookieCache: true,
    },
  });

  if (!session) {
    return null;
  }

  const profile = getProfileByAuthUserId(session.user.id);

  if (!profile || profile.disabled || profile.authUserId !== session.user.id) {
    return null;
  }

  return {
    session: session.session,
    user: session.user,
    profile,
  };
});

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

  if (context.profile.role !== "client") {
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
      disabled: appProfiles.disabled,
    })
    .from(appProfiles)
    .where(eq(appProfiles.authUserId, authUserId))
    .limit(1)
    .all();

  return profile ?? null;
}
