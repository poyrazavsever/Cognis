import { requireFreelancerBackend } from "@/server/web/freelancer";
import { SecuritySettingsForm } from "./security-settings-form";

export default async function SecuritySettingsPage() {
  await requireFreelancerBackend();
  return <SecuritySettingsForm />;
}
