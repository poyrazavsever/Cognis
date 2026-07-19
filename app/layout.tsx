import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import { cookies } from "next/headers";
import "./globals.css";
import { cn } from "@/lib/utils";
import {
  COLOR_MODE_COOKIE,
  isColorMode,
} from "@/lib/color-mode";
import { Toaster } from "poyraz-ui/molecules";
import { getPublicBranding } from "@/server/branding/runtime";
import { resolveRequestLocale } from "@/server/i18n/resolver";

const colorModeScript = `(() => {
  const root = document.documentElement;
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const apply = () => root.classList.toggle("dark", root.dataset.colorMode === "dark" || (root.dataset.colorMode === "system" && media.matches));
  apply();
  media.addEventListener("change", apply);
})();`;

export function generateMetadata(): Metadata {
  const branding = getPublicBranding();
  const faviconUrl = branding.iconUrl ?? "/logo/iconLogo.png";
  return {
    title: { default: branding.applicationName, template: `%s · ${branding.applicationName}` },
    description: "Self-hosted freelancer operating dashboard",
    manifest: "/manifest.webmanifest",
    icons: {
      icon: [{ url: faviconUrl, type: "image/png" }],
      shortcut: [{ url: faviconUrl, type: "image/png" }],
      apple: [{ url: faviconUrl, type: "image/png" }],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: branding.shortName,
    },
  };
}

export function generateViewport(): Viewport {
  return { themeColor: getPublicBranding().primaryColor };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const branding = getPublicBranding();
  const cookieColorMode = (await cookies()).get(COLOR_MODE_COOKIE)?.value;
  const colorMode = isColorMode(cookieColorMode)
    ? cookieColorMode
    : branding.defaultColorMode;
  const locale = await resolveRequestLocale();

  return (
    <html
      lang={locale.locale}
      dir={locale.direction}
      className={cn("font-sans", colorMode === "dark" && "dark")}
      data-color-mode={colorMode}
      style={branding.cssVariables as CSSProperties}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: colorModeScript }} />
      </head>
      <body>
        {children}
        <Toaster closeButton richColors position="top-right" />
      </body>
    </html>
  );
}
