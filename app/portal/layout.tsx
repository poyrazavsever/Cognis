import { PortalShell } from "@/components/layout/portal-shell";
import { requireClientUser } from "@/server/auth/session";

export default async function PortalLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, profile } = await requireClientUser();
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
      user={{
        email: user.email,
        displayName,
        shortName,
        avatarUrl: user.image || null,
      }}
      progress={0}
    >
      {children}
    </PortalShell>
  );
}
