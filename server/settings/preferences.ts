import "server-only";

import { eq } from "drizzle-orm";
import { z } from "zod";
import type { ColorMode } from "@/lib/color-mode";
import { getSqliteConnection } from "@/server/db/client";
import { userPreferences } from "@/server/db/schema";
import { assertEnabledActor, type DomainActor } from "@/server/domain/actor";
import { DomainError } from "@/server/domain/errors";

const colorModeInputSchema = z.object({
  colorMode: z.enum(["light", "dark", "system"]),
});

export type PublicUserPreferences = {
  colorMode: ColorMode;
};

export function getUserPreferences(actor: DomainActor): PublicUserPreferences {
  assertEnabledActor(actor);

  const row = getSqliteConnection().db
    .select({ colorMode: userPreferences.colorMode })
    .from(userPreferences)
    .where(eq(userPreferences.ownerUserId, actor.authUserId))
    .get();

  return {
    colorMode: (row?.colorMode as ColorMode | undefined) ?? "system",
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

  return { colorMode: parsed.data.colorMode };
}
