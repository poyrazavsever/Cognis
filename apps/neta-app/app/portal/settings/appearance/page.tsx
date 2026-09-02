import { getUserPreferences } from "@/server/settings/preferences";
import { requirePortalBackend } from "@/server/web/portal";
import { PortalAppearanceForm } from "./portal-appearance-form";

export default async function PortalAppearanceSettingsPage() {
  const { actor } = await requirePortalBackend();
  const preferences = getUserPreferences(actor);

  return <PortalAppearanceForm initialColorMode={preferences.colorMode} />;
}
