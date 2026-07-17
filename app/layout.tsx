import type { Metadata, Viewport } from "next";
import type { CSSProperties } from "react";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Toaster } from "poyraz-ui/molecules";
import { getPublicBranding } from "@/server/branding/runtime";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist-sans" });
const colorModeScript = `(() => {
  const root = document.documentElement;
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  const apply = () => root.classList.toggle("dark", root.dataset.colorMode === "dark" || (root.dataset.colorMode === "system" && media.matches));
  apply();
  if (root.dataset.colorMode === "system") media.addEventListener("change", apply);
})();`;

export function generateMetadata(): Metadata {
  const branding = getPublicBranding();
  return {
    title: { default: branding.applicationName, template: `%s · ${branding.applicationName}` },
    description: "Self-hosted freelancer operating dashboard",
    manifest: "/manifest.webmanifest",
    icons: branding.iconUrl ? { icon: branding.iconUrl, apple: branding.iconUrl } : undefined,
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const branding = getPublicBranding();
  return (
    <html
      lang="tr"
      className={cn("font-sans", geist.variable, branding.defaultColorMode === "dark" && "dark")}
      data-color-mode={branding.defaultColorMode}
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
