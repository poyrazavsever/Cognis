import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireFreelancer } from "@/server/auth/session";
import { getPublicBranding } from "@/server/branding/runtime";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, profile } = await requireFreelancer();
  const branding = getPublicBranding();
  const displayName = profile.displayName || user.name || user.email.split("@")[0] || "Neta Kullanıcısı";

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
        applicationName: branding.applicationName,
        organizationName: branding.organizationName,
        lightLogoUrl: branding.lightLogoUrl,
        darkLogoUrl: branding.darkLogoUrl,
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
