"use client";

import { AppShell, type AppShellBranding } from "@/components/layout/app-shell";
import { sidebarData } from "@/config/sidebar";
import type { ColorMode } from "@/lib/color-mode";

type DashboardShellProps = {
  branding: AppShellBranding;
  children: React.ReactNode;
  colorMode: ColorMode;
  user: {
    email: string;
    displayName: string;
    shortName: string;
    avatarUrl: string | null;
  };
};

export function DashboardShell({ branding, children, colorMode, user }: DashboardShellProps) {
  return (
    <AppShell
      branding={branding}
      colorMode={colorMode}
      homeHref="/"
      navGroups={sidebarData}
      settingsHref="/settings"
      user={user}
    >
      {children}
    </AppShell>
  );
}
