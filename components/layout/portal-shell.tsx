"use client";

import { AppShell, type AppShellBranding } from "@/components/layout/app-shell";
import { portalSidebarData } from "@/config/portal-sidebar";

type PortalShellProps = {
  branding: AppShellBranding;
  children: React.ReactNode;
  user: {
    email: string;
    displayName: string;
    shortName: string;
    avatarUrl: string | null;
  };
  progress?: number;
};

export function PortalShell({ branding, children, user, progress }: PortalShellProps) {
  return (
    <AppShell
      branding={branding}
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
