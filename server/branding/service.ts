import { z } from "zod";
import { requireOwnerScope, type DomainActor } from "../domain/actor";
import type { DomainDatabase } from "../domain/database";
import { DomainError, notFound } from "../domain/errors";
import {
  brandingColorModes,
  brandingRadiusScales,
  type BrandingColorMode,
  type BrandingRadiusScale,
} from "../domain/types";
import { createBrandingRepository } from "../repositories/branding";
import { createFileRepository } from "../repositories/files";

const hexColorSchema = z.string().trim().regex(/^#[0-9a-fA-F]{6}$/).transform((value) => value.toUpperCase());
const nullableFileId = z.string().trim().min(1).max(128).nullable().optional();

export const brandingUpdateSchema = z.object({
  applicationName: z.string().trim().min(1).max(80).optional(),
  shortName: z.string().trim().min(1).max(24).optional(),
  primaryColor: hexColorSchema.optional(),
  accentColor: hexColorSchema.optional(),
  lightLogoFileId: nullableFileId,
  darkLogoFileId: nullableFileId,
  iconFileId: nullableFileId,
  defaultColorMode: z.enum(brandingColorModes).optional(),
  radiusScale: z.enum(brandingRadiusScales).optional(),
  organizationName: z.string().trim().max(120).nullable().optional(),
  supportEmail: z.email().nullable().optional(),
  portalWelcomeText: z.string().trim().max(2_000).nullable().optional(),
  portalFooterText: z.string().trim().max(1_000).nullable().optional(),
});

export const DEFAULT_BRANDING = {
  applicationName: "Neta",
  shortName: "Neta",
  primaryColor: "#C81E1E",
  accentColor: "#E6EDF5",
  lightLogoFileId: null,
  darkLogoFileId: null,
  iconFileId: null,
  defaultColorMode: "system" as const,
  radiusScale: "default" as const,
  organizationName: null,
  supportEmail: null,
  portalWelcomeText: null,
  portalFooterText: null,
};

export type BrandingSettings = {
  applicationName: string;
  shortName: string;
  primaryColor: string;
  accentColor: string;
  lightLogoFileId: string | null;
  darkLogoFileId: string | null;
  iconFileId: string | null;
  defaultColorMode: BrandingColorMode;
  radiusScale: BrandingRadiusScale;
  organizationName: string | null;
  supportEmail: string | null;
  portalWelcomeText: string | null;
  portalFooterText: string | null;
};

export type PublicBranding = BrandingSettings & {
  lightLogoUrl: string | null;
  darkLogoUrl: string | null;
  iconUrl: string | null;
  cssVariables: Record<`--${string}`, string>;
};

export class BrandingService {
  private readonly repository;
  private readonly files;

  constructor(private readonly db: DomainDatabase) {
    this.repository = createBrandingRepository(db);
    this.files = createFileRepository(db);
  }

  getPublic(): PublicBranding {
    const stored = this.repository.get();
    const settings = stored
      ? {
          applicationName: stored.applicationName,
          shortName: stored.shortName,
          primaryColor: stored.primaryColor,
          accentColor: stored.accentColor,
          lightLogoFileId: stored.lightLogoFileId,
          darkLogoFileId: stored.darkLogoFileId,
          iconFileId: stored.iconFileId,
          defaultColorMode: stored.defaultColorMode,
          radiusScale: stored.radiusScale,
          organizationName: stored.organizationName,
          supportEmail: stored.supportEmail,
          portalWelcomeText: stored.portalWelcomeText,
          portalFooterText: stored.portalFooterText,
        }
      : DEFAULT_BRANDING;

    const fallbackLogoId = settings.lightLogoFileId ?? settings.darkLogoFileId;
    const lightLogoId = settings.lightLogoFileId ?? fallbackLogoId;
    const darkLogoId = settings.darkLogoFileId ?? fallbackLogoId;
    return {
      ...settings,
      lightLogoUrl: publicAssetUrl(lightLogoId),
      darkLogoUrl: publicAssetUrl(darkLogoId),
      iconUrl: publicAssetUrl(settings.iconFileId),
      cssVariables: buildBrandingTokens(settings.primaryColor, settings.accentColor, settings.radiusScale),
    };
  }

  update(actor: DomainActor, input: unknown): PublicBranding {
    const scope = requireOwnerScope(actor);
    const parsed = brandingUpdateSchema.safeParse(input);
    if (!parsed.success) {
      throw new DomainError("VALIDATION_ERROR", "Marka ayarları geçersiz.", {
        fields: parsed.error.flatten().fieldErrors,
      });
    }

    this.assertBrandingFile(scope.ownerUserId, parsed.data.lightLogoFileId, "logo");
    this.assertBrandingFile(scope.ownerUserId, parsed.data.darkLogoFileId, "logo");
    this.assertBrandingFile(scope.ownerUserId, parsed.data.iconFileId, "icon");

    const existing = this.repository.get();
    if (existing && existing.ownerUserId !== scope.ownerUserId) {
      throw new DomainError("FORBIDDEN", "Instance marka ayarları başka bir owner'a ait.");
    }

    if (existing) {
      this.repository.update({ ...parsed.data, updatedByUserId: scope.ownerUserId });
    } else {
      this.repository.create({
        id: "default",
        ownerUserId: scope.ownerUserId,
        updatedByUserId: scope.ownerUserId,
        ...DEFAULT_BRANDING,
        ...parsed.data,
      });
    }
    return this.getPublic();
  }

  private assertBrandingFile(
    ownerUserId: string,
    fileId: string | null | undefined,
    expected: "logo" | "icon",
  ): void {
    if (fileId === undefined || fileId === null) return;
    const file = this.files.get(fileId);
    if (!file || file.ownerUserId !== ownerUserId) throw notFound("Marka dosyası");
    const expectedKind = expected === "icon" ? "branding_icon" : "branding_logo";
    if (file.kind !== expectedKind || file.visibility !== "public_branding") {
      throw new DomainError("INVARIANT_VIOLATION", "Dosya marka alanıyla uyumlu değil.");
    }
  }
}

export function buildBrandingTokens(
  primary: string,
  accent: string,
  radiusScale: "compact" | "default" | "soft",
): Record<`--${string}`, string> {
  const radii = {
    compact: ["0.25rem", "0.375rem", "0.5rem", "0.625rem", "0.75rem"],
    default: ["0.375rem", "0.5rem", "0.75rem", "1rem", "1.25rem"],
    soft: ["0.5rem", "0.75rem", "1rem", "1.25rem", "1.5rem"],
  }[radiusScale];
  const primaryForeground = readableForeground(primary);
  const accentForeground = readableForeground(accent);

  return {
    "--poyraz-primary": primary,
    "--poyraz-primary-foreground": primaryForeground,
    "--poyraz-primary-200": `color-mix(in srgb, ${primary} 28%, var(--poyraz-surface))`,
    "--poyraz-primary-600": mixHex(primary, "#000000", 0.08),
    "--poyraz-primary-700": mixHex(primary, "#000000", 0.14),
    "--poyraz-primary-800": mixHex(primary, "#000000", 0.28),
    "--poyraz-primary-900": mixHex(primary, "#000000", 0.4),
    "--poyraz-primary-hover": mixHex(primary, "#000000", 0.14),
    "--poyraz-primary-active": mixHex(primary, "#000000", 0.28),
    "--poyraz-primary-dark": mixHex(primary, "#000000", 0.4),
    "--poyraz-primary-muted": `color-mix(in srgb, ${primary} 12%, var(--poyraz-surface))`,
    "--poyraz-primary-muted-foreground": primary,
    "--poyraz-accent": accent,
    "--poyraz-accent-foreground": accentForeground,
    "--poyraz-accent-hover": mixHex(accent, accentForeground, 0.1),
    "--poyraz-ring": primary,
    "--poyraz-focus-ring": primary,
    "--poyraz-radius-xs": radii[0],
    "--poyraz-radius-sm": radii[1],
    "--poyraz-radius-md": radii[2],
    "--poyraz-radius-lg": radii[3],
    "--poyraz-radius-xl": radii[4],
  };
}

export function contrastRatio(first: string, second: string): number {
  const firstLuminance = luminance(first);
  const secondLuminance = luminance(second);
  return (Math.max(firstLuminance, secondLuminance) + 0.05) / (Math.min(firstLuminance, secondLuminance) + 0.05);
}

function readableForeground(background: string): "#000000" | "#FFFFFF" {
  return contrastRatio(background, "#000000") >= contrastRatio(background, "#FFFFFF")
    ? "#000000"
    : "#FFFFFF";
}

function luminance(color: string): number {
  const [red, green, blue] = hexChannels(color).map((channel) => {
    const normalized = channel / 255;
    return normalized <= 0.03928
      ? normalized / 12.92
      : ((normalized + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function mixHex(base: string, overlay: string, overlayWeight: number): string {
  const baseChannels = hexChannels(base);
  const overlayChannels = hexChannels(overlay);
  const channels = baseChannels.map((channel, index) =>
    Math.round(channel * (1 - overlayWeight) + overlayChannels[index] * overlayWeight),
  );
  return `#${channels.map((channel) => channel.toString(16).padStart(2, "0")).join("")}`.toUpperCase();
}

function hexChannels(color: string): [number, number, number] {
  return [
    Number.parseInt(color.slice(1, 3), 16),
    Number.parseInt(color.slice(3, 5), 16),
    Number.parseInt(color.slice(5, 7), 16),
  ];
}

function publicAssetUrl(fileId: string | null): string | null {
  return fileId ? `/api/branding/assets/${fileId}` : null;
}
