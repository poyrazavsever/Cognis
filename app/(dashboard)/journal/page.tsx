import { JournalClient, type DailyLogItem } from "@/app/(dashboard)/journal/journal-client";
import { requireFreelancerBackend } from "@/server/web/freelancer";

export default async function JournalPage() {
  const { actor, service } = await requireFreelancerBackend();
  const logs: DailyLogItem[] = service.listJournalEntries(actor)
    .slice(0, 180)
    .flatMap((entry) =>
      entry.moodScore == null || entry.energyScore == null
        ? []
        : [{
            id: entry.id,
            log_date: entry.entryDate,
            mood_score: entry.moodScore,
            energy_score: entry.energyScore,
            work_satisfaction_score: entry.workSatisfactionScore,
            note: entry.note,
          }],
    );

  return <JournalClient logs={logs} />;
}
