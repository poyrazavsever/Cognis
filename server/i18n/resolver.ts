import "server-only";

import { eq } from "drizzle-orm";
import { cache } from "react";
import {
  resolveLocalePolicy,
  type LocaleResolution,
} from "../../lib/i18n/locale-resolution";
import type { SessionContext } from "../auth/session";
import { getSessionContext } from "../auth/session";
import { getSqliteConnection } from "../db/client";
import {
  clients,
  instanceI18nSettings,
  instanceLocales,
  userPreferences,
} from "../db/schema";

export type ResolvedLocale = LocaleResolution;

type LocaleContext = ReturnType<typeof readLocaleContext>;

export const resolvePublicLocale = cache(async (): Promise<ResolvedLocale> => {
  return resolveFromContext(readLocaleContext(), []);
});

export async function resolveInvitationLocale(
  invitationLocale: string | null | undefined,
): Promise<ResolvedLocale> {
  return resolveFromContext(readLocaleContext(), [
    { locale: invitationLocale, source: "invitation" },
  ]);
}

export async function resolveFreelancerLocale(
  providedContext?: SessionContext,
): Promise<ResolvedLocale> {
  const context = providedContext ?? await getSessionContext();
  const localeContext = readLocaleContext();
  const preference = context
    ? readUserPreference(localeContext, context.profile.authUserId)
    : null;

  return resolveFromContext(localeContext, [
    { locale: preference, source: "user" },
  ]);
}

export async function resolvePortalLocale(
  providedContext?: SessionContext,
): Promise<ResolvedLocale> {
  const context = providedContext ?? await getSessionContext();
  const localeContext = readLocaleContext();
  const preference = context
    ? readUserPreference(localeContext, context.profile.authUserId)
    : null;
  const clientDefault = context?.profile.clientId
    ? localeContext.db
      .select({ portalLocale: clients.portalLocale })
      .from(clients)
      .where(eq(clients.id, context.profile.clientId))
      .get()?.portalLocale
    : null;

  return resolveFromContext(localeContext, [
    { locale: preference, source: "user" },
    { locale: clientDefault, source: "client" },
  ]);
}

export const resolveRootLocale = cache(async (): Promise<ResolvedLocale> => {
  const context = await getSessionContext();
  if (!context) return resolvePublicLocale();
  if (context.profile.role === "client") return resolvePortalLocale(context);
  return resolveFreelancerLocale(context);
});

function readLocaleContext() {
  const { db } = getSqliteConnection();
  const settings = db
    .select({ defaultLocale: instanceI18nSettings.defaultLocale })
    .from(instanceI18nSettings)
    .where(eq(instanceI18nSettings.key, "default"))
    .get();
  const locales = db
    .select({
      code: instanceLocales.code,
      status: instanceLocales.status,
      textDirection: instanceLocales.textDirection,
    })
    .from(instanceLocales)
    .all();

  return {
    db,
    defaultLocale: settings?.defaultLocale ?? "tr",
    locales,
  };
}

function readUserPreference(context: LocaleContext, authUserId: string) {
  return context.db
    .select({ language: userPreferences.language })
    .from(userPreferences)
    .where(eq(userPreferences.ownerUserId, authUserId))
    .get()?.language ?? null;
}

function resolveFromContext(
  context: LocaleContext,
  candidates: Parameters<typeof resolveLocalePolicy>[0]["candidates"],
) {
  return resolveLocalePolicy({
    activeLocales: context.locales,
    defaultLocale: context.defaultLocale,
    candidates,
  });
}
