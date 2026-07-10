"use client";

import { AppShell } from "@/components/layout/app-shell";
import { portalSidebarData } from "@/config/portal-sidebar";

type PortalShellProps = {
  children: React.ReactNode;
  user: {
    email: string;
    displayName: string;
    shortName: string;
    avatarUrl: string | null;
  };
  progress?: number;
};

export function PortalShell({ children, user, progress }: PortalShellProps) {
  return (
    <AppShell
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
