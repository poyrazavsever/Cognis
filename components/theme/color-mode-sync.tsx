"use client";

import { useEffect } from "react";
import {
  COLOR_MODE_COOKIE,
  COLOR_MODE_COOKIE_MAX_AGE,
  type ColorMode,
} from "@/lib/color-mode";

export function ColorModeSync({ colorMode }: { colorMode: ColorMode }) {
  useEffect(() => {
    applyColorMode(colorMode);
  }, [colorMode]);

  return null;
}

export function applyColorMode(colorMode: ColorMode): void {
  const root = document.documentElement;
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  root.dataset.colorMode = colorMode;
  root.classList.toggle("dark", colorMode === "dark" || (colorMode === "system" && prefersDark));

  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COLOR_MODE_COOKIE}=${colorMode}; Path=/; Max-Age=${COLOR_MODE_COOKIE_MAX_AGE}; SameSite=Lax${secure}`;
}
