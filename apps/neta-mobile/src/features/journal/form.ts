import { isJournalEntryMutationPayload, type JournalEntryMutationPayload, type JournalScore } from '@neta/api-contracts';
import { buildLocalizedPayload } from '../localization/localized-form.ts';

export type JournalFormState = {
  energy: JournalScore;
  mood: JournalScore;
  moodLabel: string;
  note: string;
  satisfaction: JournalScore;
  sourceLocale: string;
  version?: string | null;
};

export type JournalFormErrors = Partial<Record<'moodLabel' | 'note', string | undefined>>;

export function validateJournalForm(form: JournalFormState): JournalFormErrors {
  const errors: JournalFormErrors = {};
  if (!form.moodLabel.trim()) errors.moodLabel = 'Ruh hali etiketi zorunludur.';
  if (!form.note.trim()) errors.note = 'Günlük notu zorunludur.';
  return errors;
}

export function buildJournalPayload(form: JournalFormState): JournalEntryMutationPayload {
  const payload: JournalEntryMutationPayload = {
    energy: form.energy,
    mood: form.mood,
    satisfaction: form.satisfaction,
    sourceLocale: form.sourceLocale,
    translations: buildLocalizedPayload('journal', form.sourceLocale, { moodLabel: form.moodLabel, note: form.note }),
    ...(form.version !== undefined ? { version: form.version } : {}),
  };
  if (!isJournalEntryMutationPayload(payload)) throw new Error('Journal payload is invalid.');
  return payload;
}

export function canSubmitJournal(isOnline: boolean): boolean {
  return isOnline;
}
