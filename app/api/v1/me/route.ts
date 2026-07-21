import { apiV1Error, apiV1Success } from "@/server/api/v1/responses";
import { negotiateLocale } from "@/server/api/v1/localization";
import { domainActorFromSession } from "@/server/auth/domain-actor";
import { getSessionContextFromHeaders } from "@/server/auth/session";
import { getServerConfig } from "@/server/config";
import { getSqliteConnection } from "@/server/db/client";
import { clients } from "@/server/db/schema";
import { DomainError } from "@/server/domain/errors";
import { getPublicLocalizationMetadata } from "@/server/i18n/runtime";
import { getUserPreferences } from "@/server/settings/preferences";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const context = await getSessionContextFromHeaders(new Headers(request.headers));
    if (!context) {
      throw new DomainError("UNAUTHENTICATED", "Authentication required.", {
        messageKey: "api.errors.unauthenticated",
      });
    }
    const requestUrl = new URL(request.url);
    const preferences = getUserPreferences(domainActorFromSession(context));
    const portalLocale = context.profile.clientId
      ? getSqliteConnection().db
          .select({ portalLocale: clients.portalLocale })
          .from(clients)
          .where(eq(clients.id, context.profile.clientId))
          .get()?.portalLocale ?? null
      : null;
    const resolvedLocale = negotiateLocale({
      metadata: getPublicLocalizationMetadata(),
      requestedLocale: requestUrl.searchParams.get("locale"),
      acceptLanguage: request.headers.get("accept-language"),
      preferredLocale: preferences.language,
      portalLocale,
    });

    return apiV1Success({
      user: {
        id: context.user.id,
        email: context.profile.email,
        displayName: context.profile.displayName,
        role: context.profile.role,
        clientId: context.profile.clientId,
        imageUrl: absoluteOptionalUrl(context.user.image),
      },
      session: {
        expiresAt: context.session.expiresAt.toISOString(),
      },
      preferences,
      localization: {
        userPreferenceLocale: preferences.language,
        clientDefaultLocale: portalLocale,
        resolvedLocale: resolvedLocale.locale,
        requestedLocale: resolvedLocale.requestedLocale,
        instanceDefaultLocale: resolvedLocale.defaultLocale,
        source: resolvedLocale.source,
        fallbackChain: resolvedLocale.fallbackChain,
      },
    });
  } catch (error) {
    return apiV1Error(error);
  }
}

function absoluteOptionalUrl(value: string | null | undefined): string | null {
  return value ? new URL(value, `${getServerConfig().appUrl}/`).toString() : null;
}
