"use client";

import { AppShell } from "@/components/layout/app-shell";
import { sidebarData } from "@/config/sidebar";

type DashboardShellProps = {
  children: React.ReactNode;
  user: {
    email: string;
    displayName: string;
    shortName: string;
    avatarUrl: string | null;
  };
};

export function DashboardShell({ children, user }: DashboardShellProps) {
  return (
    <AppShell homeHref="/" navGroups={sidebarData} settingsHref="/settings" user={user}>
      {children}
    </AppShell>
  );
}
