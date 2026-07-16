"use client";

import { AppShell, type AppShellBranding } from "@/components/layout/app-shell";
import { sidebarData } from "@/config/sidebar";

type DashboardShellProps = {
  branding: AppShellBranding;
  children: React.ReactNode;
  user: {
    email: string;
    displayName: string;
    shortName: string;
    avatarUrl: string | null;
  };
};

export function DashboardShell({ branding, children, user }: DashboardShellProps) {
  return (
    <AppShell branding={branding} homeHref="/" navGroups={sidebarData} settingsHref="/settings" user={user}>
      {children}
    </AppShell>
  );
}
