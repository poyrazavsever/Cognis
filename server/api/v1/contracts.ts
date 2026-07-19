import type { PublicBranding } from "../../branding/service";
import type { InstanceIdentity } from "../../instance/service";
import type { getPublicLocalizationMetadata } from "../../i18n/runtime";
import { buildLocalizationContract } from "./localization";

export const NETA_PROTOCOL = "neta" as const;
export const NETA_DISCOVERY_VERSION = 1 as const;
export const NETA_API_VERSION = "1" as const;
export const NETA_API_BASE_PATH = "/api/v1" as const;

export type CapabilityStatus = "available" | "planned";
export type CapabilityAccess = "public" | "session" | "freelancer" | "client";

export type NetaCapability = {
  id: string;
  version: number;
  status: CapabilityStatus;
  access: CapabilityAccess;
};

export type NetaLocalizedResponse<TResource> = {
  resource: TResource;
  localized: TResource;
  locale: string;
  fallbackChain: string[];
};

export type NetaTranslationMutationShape = Record<
  string,
  Record<string, string | null>
>;

export const NETA_CAPABILITIES = [
  { id: "instance.discovery", version: 1, status: "available", access: "public" },
  { id: "instance.branding", version: 1, status: "available", access: "public" },
  { id: "instance.localization", version: 1, status: "available", access: "public" },
  { id: "auth.better-auth-cookie", version: 1, status: "available", access: "session" },
  { id: "files.local", version: 1, status: "available", access: "session" },
  { id: "freelancer.core", version: 1, status: "available", access: "freelancer" },
  { id: "portal.client", version: 1, status: "available", access: "client" },
  { id: "ai.assistant", version: 1, status: "available", access: "freelancer" },
  { id: "auth.device-pairing", version: 1, status: "planned", access: "freelancer" },
] as const satisfies readonly NetaCapability[];

export type NetaDiscoveryDocument = {
  protocol: typeof NETA_PROTOCOL;
  discoveryVersion: typeof NETA_DISCOVERY_VERSION;
  instanceId: string;
  applicationName: string;
  workspaceName: string;
  api: {
    version: typeof NETA_API_VERSION;
    baseUrl: string;
    metaUrl: string;
    healthUrl: string;
  };
  security: {
    httpsRequired: true;
    insecureLoopbackAllowed: true;
  };
  localization: {
    defaultLocale: string;
    supportedLocales: Array<{
      code: string;
      name: string;
      nativeName: string;
      status: string;
      textDirection: string;
    }>;
    catalogVersion: number;
  };
  capabilities: readonly NetaCapability[];
};

export type NetaInstanceMetadata = {
  protocol: {
    name: typeof NETA_PROTOCOL;
    discoveryVersion: typeof NETA_DISCOVERY_VERSION;
    apiVersion: typeof NETA_API_VERSION;
  };
  server: {
    version: string;
  };
  instance: {
    id: string;
    createdAt: string;
    applicationName: string;
    workspaceName: string;
    metaTitle: string;
    shortName: string;
    organizationName: string | null;
  };
  branding: {
    primaryColor: string;
    accentColor: string;
    defaultColorMode: PublicBranding["defaultColorMode"];
    radiusScale: PublicBranding["radiusScale"];
    lightLogoUrl: string | null;
    darkLogoUrl: string | null;
    iconUrl: string | null;
    faviconUrl: string | null;
  };
  localization: ReturnType<typeof buildLocalizationContract>;
  contracts: {
    localizedResponse: {
      resource: "original database record";
      localized: "locale-resolved record";
      locale: "resolved locale code";
      fallbackChain: "ordered locale fallback chain";
    };
    ownerMutationTranslations: {
      field: "translations";
      shape: "Record<locale, Record<field, string | null>>";
      unsupportedLocaleCode: "UNSUPPORTED_LOCALE";
    };
  };
  client: {
    minimumSupportedVersion: string | null;
    platforms: readonly ["ios", "android"];
  };
  authentication: {
    sessionMethod: "better-auth-cookie";
    devicePairing: "planned";
  };
  capabilities: readonly NetaCapability[];
  links: {
    discovery: string;
    apiBase: string;
    health: string;
    me: string;
  };
};

type ContractInput = {
  appUrl: string;
  serverVersion: string;
  minimumMobileClientVersion: string | null;
  identity: InstanceIdentity;
  branding: PublicBranding;
  localization: ReturnType<typeof getPublicLocalizationMetadata>;
};

export function buildDiscoveryDocument(
  input: ContractInput,
): NetaDiscoveryDocument {
  const apiBaseUrl = absoluteUrl(input.appUrl, NETA_API_BASE_PATH);
  return {
    protocol: NETA_PROTOCOL,
    discoveryVersion: NETA_DISCOVERY_VERSION,
    instanceId: input.identity.instanceId,
    applicationName: input.branding.applicationName,
    workspaceName: input.branding.organizationName ?? input.branding.applicationName,
    api: {
      version: NETA_API_VERSION,
      baseUrl: apiBaseUrl,
      metaUrl: absoluteUrl(input.appUrl, `${NETA_API_BASE_PATH}/meta`),
      healthUrl: absoluteUrl(input.appUrl, `${NETA_API_BASE_PATH}/health`),
    },
    security: {
      httpsRequired: true,
      insecureLoopbackAllowed: true,
    },
    localization: {
      defaultLocale: input.localization.defaultLocale,
      supportedLocales: input.localization.supportedLocales.map((locale) => ({
        code: locale.code,
        name: locale.name,
        nativeName: locale.nativeName,
        status: locale.status,
        textDirection: locale.textDirection,
      })),
      catalogVersion: input.localization.catalogVersion,
    },
    capabilities: NETA_CAPABILITIES,
  };
}

export function buildInstanceMetadata(
  input: ContractInput,
): NetaInstanceMetadata {
  return {
    protocol: {
      name: NETA_PROTOCOL,
      discoveryVersion: NETA_DISCOVERY_VERSION,
      apiVersion: NETA_API_VERSION,
    },
    server: {
      version: input.serverVersion,
    },
    instance: {
      id: input.identity.instanceId,
      createdAt: input.identity.createdAt,
      applicationName: input.branding.applicationName,
      workspaceName: input.branding.organizationName ?? input.branding.applicationName,
      metaTitle: input.branding.applicationName,
      shortName: input.branding.shortName,
      organizationName: input.branding.organizationName,
    },
    branding: {
      primaryColor: input.branding.primaryColor,
      accentColor: input.branding.accentColor,
      defaultColorMode: input.branding.defaultColorMode,
      radiusScale: input.branding.radiusScale,
      lightLogoUrl: absoluteOptionalUrl(input.appUrl, input.branding.lightLogoUrl),
      darkLogoUrl: absoluteOptionalUrl(input.appUrl, input.branding.darkLogoUrl),
      iconUrl: absoluteOptionalUrl(input.appUrl, input.branding.iconUrl),
      faviconUrl: absoluteOptionalUrl(input.appUrl, input.branding.iconUrl),
    },
    localization: buildLocalizationContract(input.localization),
    contracts: {
      localizedResponse: {
        resource: "original database record",
        localized: "locale-resolved record",
        locale: "resolved locale code",
        fallbackChain: "ordered locale fallback chain",
      },
      ownerMutationTranslations: {
        field: "translations",
        shape: "Record<locale, Record<field, string | null>>",
        unsupportedLocaleCode: "UNSUPPORTED_LOCALE",
      },
    },
    client: {
      minimumSupportedVersion: input.minimumMobileClientVersion,
      platforms: ["ios", "android"],
    },
    authentication: {
      sessionMethod: "better-auth-cookie",
      devicePairing: "planned",
    },
    capabilities: NETA_CAPABILITIES,
    links: {
      discovery: absoluteUrl(input.appUrl, "/.well-known/neta"),
      apiBase: absoluteUrl(input.appUrl, NETA_API_BASE_PATH),
      health: absoluteUrl(input.appUrl, `${NETA_API_BASE_PATH}/health`),
      me: absoluteUrl(input.appUrl, `${NETA_API_BASE_PATH}/me`),
    },
  };
}

function absoluteOptionalUrl(baseUrl: string, value: string | null): string | null {
  return value ? absoluteUrl(baseUrl, value) : null;
}

function absoluteUrl(baseUrl: string, pathname: string): string {
  return new URL(pathname, `${baseUrl}/`).toString();
}
