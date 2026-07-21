"use client";

import type { ComponentProps } from "react";
import { AppShell, type AppShellBranding } from "@/components/layout/app-shell";
import { I18nProvider } from "@/components/i18n/i18n-provider";
import { localizePortalSidebarData } from "@/config/portal-sidebar";
import type { ColorMode } from "@/lib/color-mode";
import { createTranslatorFromMessages } from "@/lib/i18n";

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
  i18n: {
    locale: string;
    messages: Record<string, string>;
  };
  labels?: ComponentProps<typeof AppShell>["labels"];
};

export function PortalShell({ branding, children, colorMode, user, progress, i18n, labels }: PortalShellProps) {
  const translator = createTranslatorFromMessages(i18n.locale, i18n.messages);
  const navGroups = localizePortalSidebarData(translator.t);

  return (
    <I18nProvider locale={i18n.locale} messages={i18n.messages}>
      <AppShell
        branding={branding}
        colorMode={colorMode}
        homeHref="/portal"
        navGroups={navGroups}
        settingsHref="/portal/settings"
        user={user}
        progress={progress}
        labels={labels}
      >
        {children}
      </AppShell>
    </I18nProvider>
  );
}
