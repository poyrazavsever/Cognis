import { DashboardShell } from "@/components/layout/dashboard-shell";
import { requireFreelancer } from "@/server/auth/session";

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { user, profile } = await requireFreelancer();
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
