import { cookies, headers } from "next/headers";
import { cache } from "react";
import { DEFAULT_LOCALE } from "../../lib/i18n";
import { getSessionContextFromHeaders } from "../auth/session";
import { getSqliteConnection } from "../db/client";
import { clients, instanceI18nSettings, instanceLocales, userPreferences } from "../db/schema";
import { eq } from "drizzle-orm";
import { directionForLocale, LOCALE_COOKIE, normalizeLocaleCode } from "./locale";

export type ResolvedLocale = {
  locale: string;
  requestedLocale: string | null;
  defaultLocale: string;
  direction: "ltr" | "rtl";
  source: "user" | "client" | "cookie" | "instance" | "fallback";
};

export const resolveRequestLocale = cache(async (): Promise<ResolvedLocale> => {
  const requestHeaders = await headers();
  const cookieStore = await cookies();
  const context = await getSessionContextFromHeaders(requestHeaders);
  const { db } = getSqliteConnection();

  const settings = db.select().from(instanceI18nSettings).where(eq(instanceI18nSettings.key, "default")).get();
  const defaultLocale = settings?.defaultLocale ?? DEFAULT_LOCALE;
  const cookieLocale = normalizeLocaleCode(cookieStore.get(LOCALE_COOKIE)?.value);
  let requestedLocale: string | null = null;
  let source: ResolvedLocale["source"] = "fallback";

  if (context?.profile.role === "client" && context.profile.clientId) {
    requestedLocale = normalizeLocaleCode(
      db
        .select({ portalLocale: clients.portalLocale })
        .from(clients)
        .where(eq(clients.id, context.profile.clientId))
        .get()?.portalLocale,
    );
    source = requestedLocale ? "client" : source;
  }

  if (!requestedLocale && context) {
    requestedLocale = normalizeLocaleCode(
      db
        .select({ language: userPreferences.language })
        .from(userPreferences)
        .where(eq(userPreferences.ownerUserId, context.profile.authUserId))
        .get()?.language,
    );
    source = requestedLocale ? "user" : source;
  }

  if (!requestedLocale && cookieLocale) {
    requestedLocale = cookieLocale;
    source = "cookie";
  }

  if (!requestedLocale) {
    requestedLocale = defaultLocale;
    source = "instance";
  }

  const localeRow = db
    .select({
      code: instanceLocales.code,
      status: instanceLocales.status,
      textDirection: instanceLocales.textDirection,
    })
    .from(instanceLocales)
    .where(eq(instanceLocales.code, requestedLocale))
    .get();
  const locale = localeRow && localeRow.status !== "archived"
    ? localeRow.code
    : defaultLocale || DEFAULT_LOCALE;

  return {
    locale,
    requestedLocale,
    defaultLocale,
    direction: directionForLocale(locale, localeRow?.textDirection),
    source,
  };
});
