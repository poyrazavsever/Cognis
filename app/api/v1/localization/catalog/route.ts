import { apiV1Error, apiV1Success } from "@/server/api/v1/responses";
import { negotiateLocale } from "@/server/api/v1/localization";
import { getCatalogVersion, getResolvedCatalog } from "@/server/i18n/catalog";
import { getPublicLocalizationMetadata } from "@/server/i18n/runtime";
import { I18N_NAMESPACES, type I18nNamespace } from "@/lib/i18n";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const namespaceSet = new Set<string>(I18N_NAMESPACES);

export function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const metadata = getPublicLocalizationMetadata();
    const resolved = negotiateLocale({
      metadata,
      requestedLocale: url.searchParams.get("locale"),
      acceptLanguage: request.headers.get("accept-language"),
    });
    const namespaces = parseNamespaces(url.searchParams.get("namespaces"));
    const catalog = getResolvedCatalog(resolved.locale, namespaces, metadata.catalogVersion);

    return apiV1Success({
      locale: catalog.locale,
      requestedLocale: resolved.requestedLocale,
      defaultLocale: resolved.defaultLocale,
      source: resolved.source,
      fallbackChain: catalog.fallbackChain,
      catalogVersion: getCatalogVersion(),
      namespaces: catalog.namespaces,
      messages: catalog.messages,
    }, {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    return apiV1Error(error);
  }
}

function parseNamespaces(value: string | null): I18nNamespace[] {
  if (!value) return [...I18N_NAMESPACES];
  const namespaces = value
    .split(",")
    .map((item) => item.trim())
    .filter((item): item is I18nNamespace => namespaceSet.has(item));
  return namespaces.length ? namespaces : [...I18N_NAMESPACES];
}
