import type { MetadataRoute } from "next";
import { getPublicBranding } from "@/server/branding/runtime";

export const dynamic = "force-dynamic";

export default function manifest(): MetadataRoute.Manifest {
  const branding = getPublicBranding();
  return {
    name: branding.applicationName,
    short_name: branding.shortName,
    description: "Self-hosted freelancer operating dashboard",
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: branding.primaryColor,
    icons: branding.iconUrl
      ? [{ src: branding.iconUrl, sizes: "any", type: "image/png" }]
      : [
          { src: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
        ],
  };
}
