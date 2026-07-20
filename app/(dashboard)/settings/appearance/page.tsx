import { getBrandingService } from "@/server/branding/runtime";
import { getUserPreferences } from "@/server/settings/preferences";
import { requireFreelancerBackend } from "@/server/web/freelancer";
import { AppearanceSettingsForm } from "./appearance-settings-form";

export default async function AppearanceSettingsPage() {
  const { actor } = await requireFreelancerBackend();
  const branding = getBrandingService().getPublic();
  const preferences = getUserPreferences(actor);

  return (
    <AppearanceSettingsForm
      initial={{
        colorMode: preferences.colorMode,
        primaryColor: branding.primaryColor,
        urls: {
          lightLogo: branding.lightLogoUrl ?? "",
          darkLogo: branding.darkLogoUrl ?? "",
          favicon: branding.iconUrl ?? "",
        },
        custom: {
          lightLogo: Boolean(branding.lightLogoFileId),
          darkLogo: Boolean(branding.darkLogoFileId),
          favicon: Boolean(branding.iconFileId),
        },
      }}
    />
  );
}
