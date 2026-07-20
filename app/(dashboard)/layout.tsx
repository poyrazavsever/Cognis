import { DashboardShell } from "@/components/layout/dashboard-shell";
import { domainActorFromSession } from "@/server/auth/domain-actor";
import { requireFreelancer } from "@/server/auth/session";
import { getPublicBranding } from "@/server/branding/runtime";
import { resolveFreelancerLocale } from "@/server/i18n/resolver";
import { createTranslator, getClientI18nPayload } from "@/server/i18n/translator";
import { getUserPreferences } from "@/server/settings/preferences";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const context = await requireFreelancer();
  const { user, profile } = context;
  const branding = getPublicBranding();
  const preferences = getUserPreferences(domainActorFromSession(context));
  const resolvedLocale = await resolveFreelancerLocale(context);
  const translator = createTranslator(resolvedLocale.locale, [
    "common",
    "navigation",
    "status",
    "validation",
  ]);
  const t = translator.t;
  const displayName = profile.displayName || user.name || user.email.split("@")[0] || t("navigation.account.defaultUser", { fallback: "Neta Kullanıcısı" });

  const shortName =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("")
      .slice(0, 2) || "MS";

  return (
    <DashboardShell
      branding={{
        applicationName: branding.organizationName ?? branding.applicationName,
        organizationName: branding.organizationName,
        lightLogoUrl: branding.lightLogoUrl,
        darkLogoUrl: branding.darkLogoUrl,
      }}
      colorMode={preferences.colorMode}
      i18n={getClientI18nPayload(resolvedLocale.locale, [
        "common",
        "navigation",
        "status",
        "validation",
      ])}
      labels={{
        skipToContent: t("navigation.shell.skipToContent"),
        homeAriaLabel: t("navigation.shell.homeAriaLabel", { app: branding.applicationName }),
        mobileMenuAriaLabel: t("navigation.shell.mobileMenuAriaLabel"),
        mobileMenuTooltip: t("navigation.shell.mobileMenuTooltip"),
        logoAlt: t("navigation.shell.logoAlt", { app: branding.applicationName }),
        progressTitle: t("navigation.shell.progressTitle"),
        progressValue: t("navigation.shell.progressValue"),
        progressAriaLabel: t("navigation.shell.progressAriaLabel"),
        accountMenuAriaLabel: t("navigation.shell.accountMenuAriaLabel"),
        settings: t("navigation.items.settings"),
        signOut: t("navigation.account.signOut"),
        signingOut: t("navigation.account.signingOut"),
        signOutError: t("navigation.account.signOutError"),
      }}
      user={{
        email: user.email,
        displayName,
        shortName,
        avatarUrl: user.image || null,
      }}
    >
      {children}
    </DashboardShell>
  );
}
