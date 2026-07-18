"use client";

import { AppShell, type AppShellBranding } from "@/components/layout/app-shell";
import { portalSidebarData } from "@/config/portal-sidebar";
import type { ColorMode } from "@/lib/color-mode";

type PortalShellProps = {
  branding: AppShellBranding;
  children: React.ReactNode;
  colorMode: ColorMode;
  user: {
    email: string;
    displayName: string;
    shortName: string;
    avatarUrl: string | null;
  };
  progress?: number;
};

export function PortalShell({ branding, children, colorMode, user, progress }: PortalShellProps) {
  return (
    <AppShell
      branding={branding}
      colorMode={colorMode}
      homeHref="/portal"
      navGroups={portalSidebarData}
      settingsHref="/portal/settings"
      user={user}
      progress={progress}
    >
      {children}
    </AppShell>
  );
}
