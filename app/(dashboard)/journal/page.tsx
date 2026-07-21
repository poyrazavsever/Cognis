import { JournalClient, type DailyLogItem } from "@/app/(dashboard)/journal/journal-client";
import { requireFreelancerBackend } from "@/server/web/freelancer";
import { getSqliteConnection } from "@/server/db/client";
import { ContentTranslationService, type ContentTranslationRow } from "@/server/i18n/content";
import { resolveFreelancerLocale } from "@/server/i18n/resolver";
import { getClientI18nPayload } from "@/server/i18n/translator";
import { I18nProvider } from "@/components/i18n/i18n-provider";

export default async function JournalPage() {
  const { context, actor, service } = await requireFreelancerBackend();
  const locale = await resolveFreelancerLocale(context);
  const content = new ContentTranslationService(getSqliteConnection().db);
  const localization = content.getLocalizationContext(actor);

  const rawLogs = service.listJournalEntries(actor).slice(0, 180);
  const logsTranslations = content.listBatch("journal_entry", rawLogs.map((log) => log.id));

  const logs: DailyLogItem[] = rawLogs
    .flatMap((entry) => {
      if (entry.moodScore == null || entry.energyScore == null) return [];

      const translationRows = logsTranslations.get(entry.id) ?? [];
      const resolved = content.resolveEntity("journal_entry", entry, {
        locale: locale.locale,
        defaultLocale: localization.defaultLocale,
        translations: translationRows,
      });

      return [{
        id: entry.id,
        log_date: entry.entryDate,
        mood_score: entry.moodScore,
        energy_score: entry.energyScore,
        work_satisfaction_score: entry.workSatisfactionScore,
        mood_label: resolved.moodLabel,
        note: resolved.note,
        translations: toLocalizedValues(translationRows),
      }];
    });

  const i18nPayload = await getClientI18nPayload(locale.locale, ["journal", "common"]);

  return (
    <I18nProvider {...i18nPayload}>
      <JournalClient logs={logs} localization={localization} />
    </I18nProvider>
  );
}

function toLocalizedValues(rows: ContentTranslationRow[]) {
  return rows.reduce<Record<string, Record<string, string>>>((result, row) => {
    result[row.locale] = result[row.locale] ?? {};
    result[row.locale][row.field] = row.value;
    return result;
  }, {});
}
