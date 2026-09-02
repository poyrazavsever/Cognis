import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import type { ClientActivity } from '@neta/api-contracts';

import { ChoiceChips, FormSheet, useKeyboardForm } from '@/components/forms';
import { InfoBox, TextField, useToast } from '@/components/ui';
import { createClientActivity } from '@/features/clients/api';
import { toClientError } from '@/lib/api/errors';
import { useSession } from '@/providers/session-provider';
import { useTheme } from '@/providers/theme-provider';

type Field = 'note';
const options: readonly { label: string; value: ClientActivity['type'] }[] = [{ label: 'Not', value: 'note' }, { label: 'Telefon', value: 'call' }, { label: 'Toplantı', value: 'meeting' }, { label: 'E-posta', value: 'email' }];
export default function ClientActivityFormRoute() {
  const { clientId } = useLocalSearchParams<{ clientId?: string }>(); const session = useSession(); const { colors } = useTheme(); const { showToast } = useToast(); const keyboard = useKeyboardForm<Field>();
  const initial = useMemo(() => ({ note: '', type: 'note' as ClientActivity['type'] }), []); const [form, setForm] = useState(initial); const [fieldError, setFieldError] = useState<string | null>(null); const [error, setError] = useState<string | null>(null); const [submitting, setSubmitting] = useState(false); const [saved, setSaved] = useState(false);
  useEffect(() => { if (saved) router.back(); }, [saved]);
  const submit = async () => { if (!clientId || session.status !== 'authenticated' || session.role !== 'freelancer') return; if (!form.note.trim()) { setFieldError('Aktivite notu zorunludur.'); keyboard.focusFirstError({ note: 'error' }, ['note']); return; } setSubmitting(true); setError(null); try { await createClientActivity(session.instance, session.user, clientId, { note: form.note.trim(), occurredAt: new Date().toISOString(), type: form.type }); setSaved(true); showToast({ message: 'Aktivite müşteri geçmişine eklendi.', title: 'Aktivite kaydedildi', tone: 'success' }); } catch (submitError) { setError(toClientError(submitError, 'Aktivite kaydedilemedi.').message); } finally { setSubmitting(false); } };
  return <FormSheet dirty={!saved && JSON.stringify(form) !== JSON.stringify(initial)} onSubmit={() => void submit()} scrollRef={keyboard.scrollRef} submitLabel="Aktiviteyi kaydet" submitting={submitting} title="Yeni aktivite"><Text style={[styles.lead, { color: colors.textMuted }]}>Müşteriyle yapılan son teması kısa ve aranabilir biçimde kaydet.</Text>{error ? <InfoBox description={error} title="Kaydedilemedi" tone="danger" /> : null}<ChoiceChips label="Aktivite türü" onSelect={(type) => setForm((value) => ({ ...value, type }))} options={options} selected={form.type} /><TextField error={fieldError ?? undefined} label="Not" multiline onChangeText={(note) => { setForm((value) => ({ ...value, note })); setFieldError(null); }} onFocus={() => keyboard.onFocus('note')} ref={keyboard.register('note')} textAlignVertical="top" value={form.note} /></FormSheet>;
}
const styles = StyleSheet.create({ lead: { fontSize: 15, lineHeight: 22 } });
