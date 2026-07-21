import "server-only";

import { eq } from "drizzle-orm";
import { z } from "zod";
import type { ColorMode } from "@/lib/color-mode";
import { getSqliteConnection } from "@/server/db/client";
import { instanceLocales, userPreferences } from "@/server/db/schema";
import { assertEnabledActor, type DomainActor } from "@/server/domain/actor";
import { DomainError } from "@/server/domain/errors";

const colorModeInputSchema = z.object({
  colorMode: z.enum(["light", "dark", "system"]),
});
const languageInputSchema = z.object({
  language: z.string().trim().regex(/^[a-z]{2}(?:-[A-Z]{2}[0-9]?)?$/),
});

export type PublicUserPreferences = {
  colorMode: ColorMode;
  language: string;
};

export function getUserPreferences(actor: DomainActor): PublicUserPreferences {
  assertEnabledActor(actor);

  const row = getSqliteConnection().db
    .select({
      colorMode: userPreferences.colorMode,
      language: userPreferences.language,
    })
    .from(userPreferences)
    .where(eq(userPreferences.ownerUserId, actor.authUserId))
    .get();

  return {
    colorMode: (row?.colorMode as ColorMode | undefined) ?? "system",
    language: row?.language ?? "tr",
  };
}

export function updateColorModePreference(
  actor: DomainActor,
  input: unknown,
): PublicUserPreferences {
  assertEnabledActor(actor);

  const parsed = colorModeInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new DomainError("VALIDATION_ERROR", "Renk modu tercihi geçersiz.");
  }

  const { db } = getSqliteConnection();
  db.insert(userPreferences)
    .values({
      ownerUserId: actor.authUserId,
      colorMode: parsed.data.colorMode,
    })
    .onConflictDoUpdate({
      target: userPreferences.ownerUserId,
      set: {
        colorMode: parsed.data.colorMode,
        updatedAt: new Date().toISOString(),
      },
    })
    .run();

  return {
    colorMode: parsed.data.colorMode,
    language: getUserPreferences(actor).language,
  };
}

export function updateLanguagePreference(
  actor: DomainActor,
  input: unknown,
): PublicUserPreferences {
  assertEnabledActor(actor);

  const parsed = languageInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new DomainError("VALIDATION_ERROR", "Dil tercihi geçersiz.");
  }

  const { db } = getSqliteConnection();
  const locale = db
    .select({
      code: instanceLocales.code,
      status: instanceLocales.status,
    })
    .from(instanceLocales)
    .where(eq(instanceLocales.code, parsed.data.language))
    .get();
  if (!locale || locale.status !== "active") {
    throw new DomainError("VALIDATION_ERROR", "Dil tercihi aktif bir dil olmalıdır.");
  }

  db.insert(userPreferences)
    .values({
      ownerUserId: actor.authUserId,
      language: parsed.data.language,
    })
    .onConflictDoUpdate({
      target: userPreferences.ownerUserId,
      set: {
        language: parsed.data.language,
        updatedAt: new Date().toISOString(),
      },
    })
    .run();

  const preferences = getUserPreferences(actor);
  return {
    ...preferences,
    language: parsed.data.language,
  };
}
