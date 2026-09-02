"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  COLOR_MODE_COOKIE,
  COLOR_MODE_COOKIE_MAX_AGE,
} from "@/lib/color-mode";
import { getServerConfig } from "@/server/config";
import { updateColorModePreference } from "@/server/settings/preferences";
import { requirePortalBackend } from "@/server/web/portal";

export async function savePortalColorModeAction(colorMode: string) {
  try {
    const { actor } = await requirePortalBackend();
    const preferences = updateColorModePreference(actor, { colorMode });
    const config = getServerConfig();
    (await cookies()).set(COLOR_MODE_COOKIE, preferences.colorMode, {
      httpOnly: false,
      maxAge: COLOR_MODE_COOKIE_MAX_AGE,
      path: "/",
      sameSite: "lax",
      secure: config.secureCookies,
    });
    revalidatePath("/", "layout");
    revalidatePath("/portal", "layout");
    revalidatePath("/portal/settings/appearance");
    return { success: true, colorMode: preferences.colorMode };
  } catch (error) {
    console.error("Portal color mode update failed", error);
    return { errorKey: "settings.appearance.errors.colorMode" };
  }
}
