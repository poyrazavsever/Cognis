import { PortalShell } from "@/components/layout/portal-shell";
import { getPublicBranding } from "@/server/branding/runtime";
import { resolvePortalLocale } from "@/server/i18n/resolver";
import { createTranslator, getClientI18nPayload } from "@/server/i18n/translator";
import { getUserPreferences } from "@/server/settings/preferences";
import { requirePortalBackend } from "@/server/web/portal";

export default async function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { context, actor, service } = await requirePortalBackend();
  const resolvedLocale = await resolvePortalLocale(context);
  const t = createTranslator(resolvedLocale.locale, ["navigation", "portal", "common"]).t;
  const { user, profile } = context;
  const branding = getPublicBranding();
  const preferences = getUserPreferences(actor);
  const projects = service.listProjects(actor);
  const progress = projects.length
    ? Math.round(projects.reduce((sum, project) => sum + project.progress, 0) / projects.length)
    : 0;
  const displayName = profile.displayName || user.name || user.email.split("@")[0] || "Müşteri";

  const shortName =
    displayName
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join("")
      .slice(0, 2) || "MS";

  return (
    <PortalShell
      branding={{
        applicationName: branding.organizationName ?? branding.applicationName,
        organizationName: branding.organizationName,
        lightLogoUrl: branding.lightLogoUrl,
        darkLogoUrl: branding.darkLogoUrl,
      }}
      colorMode={preferences.colorMode}
      user={{
        email: user.email,
        displayName,
        shortName,
        avatarUrl: user.image || null,
      }}
      progress={progress}
      i18n={getClientI18nPayload(resolvedLocale.locale, ["navigation", "portal", "common", "status", "validation"])}
      labels={{
        skipToContent: t("navigation.shell.skipToContent"),
        homeAriaLabel: t("navigation.shell.homeAriaLabel", { app: branding.organizationName ?? branding.applicationName }),
        mobileMenuAriaLabel: t("navigation.shell.mobileMenuAriaLabel"),
        mobileMenuTooltip: t("navigation.shell.mobileMenuTooltip"),
        logoAlt: t("navigation.shell.logoAlt", { app: branding.organizationName ?? branding.applicationName }),
        progressTitle: t("navigation.shell.progressTitle"),
        progressValue: t("navigation.shell.progressValue", { progress }),
        progressAriaLabel: t("navigation.shell.progressAriaLabel"),
        accountMenuAriaLabel: t("navigation.shell.accountMenuAriaLabel", { name: displayName }),
        signOut: t("navigation.account.signOut"),
        signingOut: t("navigation.account.signingOut"),
        signOutError: t("navigation.account.signOutError"),
        settings: t("navigation.items.settings"),
      }}
    >
      {children}
    </PortalShell>
  );
}
