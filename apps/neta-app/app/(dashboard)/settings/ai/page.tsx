import { getPublicAiSettings } from "@/server/settings/ai";
import { requireFreelancerBackend } from "@/server/web/freelancer";
import { AiSettingsForm } from "./ai-settings-form";

export default async function AiSettingsPage() {
  const { actor } = await requireFreelancerBackend();
  const settings = getPublicAiSettings(actor);
  return <AiSettingsForm initial={settings} />;
}
