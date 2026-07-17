import { PortalShell } from "@/components/layout/portal-shell";
import { getPublicBranding } from "@/server/branding/runtime";
import { getUserPreferences } from "@/server/settings/preferences";
import { requirePortalBackend } from "@/server/web/portal";

export default async function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { context, actor, service } = await requirePortalBackend();
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
    >
      {children}
    </PortalShell>
  );
}
