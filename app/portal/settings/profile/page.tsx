import { requirePortalBackend } from "@/server/web/portal";
import { PortalProfileForm } from "./portal-profile-form";

export default async function PortalProfileSettingsPage() {
  const { context } = await requirePortalBackend();
  const [firstName = "", ...lastNameParts] = context.profile.displayName.trim().split(/\s+/);

  return (
    <PortalProfileForm
      initial={{
        firstName,
        lastName: lastNameParts.join(" "),
        email: context.user.email,
        avatarUrl: context.user.image ?? "",
      }}
    />
  );
}
