import { requireFreelancerBackend } from "@/server/web/freelancer";
import { ProfileSettingsForm } from "./profile-settings-form";

export default async function ProfileSettingsPage() {
  const { context } = await requireFreelancerBackend();
  const [firstName = "", ...lastNameParts] = context.profile.displayName.trim().split(/\s+/);

  return (
    <ProfileSettingsForm
      initial={{
        firstName,
        lastName: lastNameParts.join(" "),
        email: context.user.email,
        avatarUrl: context.user.image ?? "",
      }}
    />
  );
}
