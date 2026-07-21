import { cookies } from "next/headers";
import { z } from "zod";
import { apiV1Error, apiV1Success } from "@/server/api/v1/responses";
import { domainActorFromSession } from "@/server/auth/domain-actor";
import { getSessionContextFromHeaders } from "@/server/auth/session";
import { getServerConfig } from "@/server/config";
import { DomainError } from "@/server/domain/errors";
import {
  getUserPreferences,
  updateColorModePreference,
  updateLanguagePreference,
} from "@/server/settings/preferences";
import {
  COLOR_MODE_COOKIE,
  COLOR_MODE_COOKIE_MAX_AGE,
  isColorMode,
} from "@/lib/color-mode";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const inputSchema = z.object({
  colorMode: z.string().optional(),
  language: z.string().trim().min(2).max(12).optional(),
});

export async function PATCH(request: Request) {
  try {
    const context = await getSessionContextFromHeaders(new Headers(request.headers));
    if (!context) {
      throw new DomainError("UNAUTHENTICATED", "Authentication required.", {
        messageKey: "api.errors.unauthenticated",
      });
    }
    const parsed = inputSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new DomainError("VALIDATION_ERROR", "Invalid preference payload.", {
        messageKey: "validation.required",
      });
    }

    const actor = domainActorFromSession(context);
    let preferences = getUserPreferences(actor);
    if (parsed.data.language) {
      preferences = updateLanguagePreference(actor, { language: parsed.data.language });
    }
    if (parsed.data.colorMode) {
      if (!isColorMode(parsed.data.colorMode)) {
        throw new DomainError("VALIDATION_ERROR", "Invalid color mode.");
      }
      preferences = updateColorModePreference(actor, { colorMode: parsed.data.colorMode });
      const config = getServerConfig();
      (await cookies()).set(COLOR_MODE_COOKIE, preferences.colorMode, {
        httpOnly: false,
        maxAge: COLOR_MODE_COOKIE_MAX_AGE,
        path: "/",
        sameSite: "lax",
        secure: config.secureCookies,
      });
    }

    return apiV1Success({ preferences });
  } catch (error) {
    return apiV1Error(error);
  }
}
