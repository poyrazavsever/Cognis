import assert from 'node:assert/strict';
import test from 'node:test';

import { buildJournalPayload, canSubmitJournal, validateJournalForm, type JournalFormState } from './form.ts';

const form: JournalFormState = { energy: 4, mood: 3, moodLabel: 'İyi', note: 'Odaklı bir gün.', satisfaction: 5, sourceLocale: 'tr' };

test('builds localized journal payload without leaking note to list metadata', () => {
  assert.deepEqual(buildJournalPayload(form).translations.tr, { moodLabel: 'İyi', note: 'Odaklı bir gün.' });
});

test('validates private text and blocks offline mutation', () => {
  assert.deepEqual(validateJournalForm({ ...form, moodLabel: ' ', note: '' }), { moodLabel: 'Ruh hali etiketi zorunludur.', note: 'Günlük notu zorunludur.' });
  assert.equal(canSubmitJournal(false), false);
});
