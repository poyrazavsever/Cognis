import { requirePortalBackend } from "@/server/web/portal";
import { PortalSecurityForm } from "./portal-security-form";

export default async function PortalSecuritySettingsPage() {
  await requirePortalBackend();
  return <PortalSecurityForm />;
}
