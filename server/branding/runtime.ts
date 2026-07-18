import "server-only";

import { getSqliteConnection } from "../db/client";
import { BrandingService, DEFAULT_BRANDING, buildBrandingTokens, type PublicBranding } from "./service";

export function getBrandingService(): BrandingService {
  return new BrandingService(getSqliteConnection().db);
}

export function getPublicBranding(): PublicBranding {
  try {
    return getBrandingService().getPublic();
  } catch (error) {
    if (isMissingBrandingTable(error)) {
      return {
        ...DEFAULT_BRANDING,
        lightLogoUrl: null,
        darkLogoUrl: null,
        iconUrl: null,
        cssVariables: buildBrandingTokens(
          DEFAULT_BRANDING.primaryColor,
          DEFAULT_BRANDING.radiusScale,
        ),
      };
    }
    throw error;
  }
}

function isMissingBrandingTable(error: unknown): boolean {
  return error instanceof Error && error.message.includes("no such table: instance_branding");
}
