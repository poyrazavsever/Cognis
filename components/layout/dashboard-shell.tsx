"use client";

import { I18nProvider } from "@/components/i18n/i18n-provider";
import { AppShell, type AppShellBranding, type AppShellLabels } from "@/components/layout/app-shell";
import { localizeSidebarData } from "@/config/sidebar";
import type { ColorMode } from "@/lib/color-mode";
import { createTranslatorFromMessages } from "@/lib/i18n";

type DashboardShellProps = {
  branding: AppShellBranding;
  children: React.ReactNode;
  colorMode: ColorMode;
  i18n: {
    locale: string;
    messages: Record<string, string>;
  };
  labels: AppShellLabels;
  user: {
    email: string;
    displayName: string;
    shortName: string;
    avatarUrl: string | null;
  };
};

export function DashboardShell({ branding, children, colorMode, i18n, labels, user }: DashboardShellProps) {
  const translator = createTranslatorFromMessages(i18n.locale, i18n.messages);
  const navGroups = localizeSidebarData(translator.t);

  return (
    <I18nProvider locale={i18n.locale} messages={i18n.messages}>
      <AppShell
        branding={branding}
        colorMode={colorMode}
        homeHref="/"
        labels={labels}
        navGroups={navGroups}
        settingsHref="/settings"
        user={user}
      >
        {children}
      </AppShell>
    </I18nProvider>
  );
}
