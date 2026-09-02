import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import type { ClientDetail, ClientPipelineStatus, ClientStatus } from '@neta/api-contracts';

import { ChoiceChips, FormSheet, useKeyboardForm } from '@/components/forms';
import { InfoBox, TextField, useToast } from '@/components/ui';
import { createClient, getClientDetail, updateClient } from '@/features/clients/api';
import { buildClientPayload, type ClientFormErrors, type ClientFormState, validateClientForm } from '@/features/clients/form';
import { toClientError } from '@/lib/api/errors';
import { useSession } from '@/providers/session-provider';
import { useTheme } from '@/providers/theme-provider';
import { spacing } from '@/theme/tokens';

type FocusField = 'name' | 'email' | 'phone';
const statusOptions: readonly { label: string; value: ClientStatus }[] = [{ label: 'Aktif', value: 'active' }, { label: 'Duraklatıldı', value: 'paused' }, { label: 'Arşiv', value: 'archived' }];
const pipelineOptions: readonly { label: string; value: ClientPipelineStatus }[] = [{ label: 'Potansiyel', value: 'lead' }, { label: 'İletişimde', value: 'contacted' }, { label: 'Teklif', value: 'proposal_sent' }, { label: 'Kazanıldı', value: 'won' }, { label: 'Kaybedildi', value: 'lost' }];

export default function ClientFormRoute() {
  const { clientId } = useLocalSearchParams<{ clientId?: string }>();
  const session = useSession(); const { colors } = useTheme(); const { showToast } = useToast(); const keyboard = useKeyboardForm<FocusField>();
  const empty = useMemo<ClientFormState>(() => ({ email: '', name: '', phone: '', pipelineStatus: 'lead', sourceLocale: session.instance?.defaultLocale ?? 'tr', status: 'active' }), [session.instance?.defaultLocale]);
  const [form, setForm] = useState(empty); const [baseline, setBaseline] = useState(JSON.stringify(empty)); const [errors, setErrors] = useState<ClientFormErrors>({}); const [loading, setLoading] = useState(Boolean(clientId)); const [submitting, setSubmitting] = useState(false); const [saved, setSaved] = useState(false); const [submitError, setSubmitError] = useState<string | null>(null);
  useEffect(() => { if (saved) router.back(); }, [saved]);

  useEffect(() => { if (!clientId || session.status !== 'authenticated' || session.role !== 'freelancer') return; let active = true; void getClientDetail(session.instance, session.user, clientId).then((result) => { if (!active) return; const next = fromDetail(result.data, empty.sourceLocale); setForm(next); setBaseline(JSON.stringify(next)); }).catch((error) => active && setSubmitError(toClientError(error, 'Müşteri formu yüklenemedi.').message)).finally(() => active && setLoading(false)); return () => { active = false; }; }, [clientId, empty.sourceLocale, session]);
  const submit = async () => { if (session.status !== 'authenticated' || session.role !== 'freelancer') return; const nextErrors = validateClientForm(form); setErrors(nextErrors); if (Object.keys(nextErrors).length) { keyboard.focusFirstError(nextErrors, ['name', 'email']); return; } setSubmitting(true); setSubmitError(null); try { const result = clientId ? await updateClient(session.instance, session.user, clientId, buildClientPayload(form)) : await createClient(session.instance, session.user, buildClientPayload(form)); setSaved(true); showToast({ message: 'Müşteri bilgileri güncel listeye yansıtıldı.', title: result.data.displayName, tone: 'success' }); } catch (error) { setSubmitError(toClientError(error, 'Müşteri kaydedilemedi.').message); } finally { setSubmitting(false); } };

  return <FormSheet dirty={!saved && !loading && JSON.stringify(form) !== baseline} onSubmit={() => void submit()} scrollRef={keyboard.scrollRef} submitLabel={clientId ? 'Değişiklikleri kaydet' : 'Müşteriyi oluştur'} submitting={submitting || loading} title={clientId ? 'Müşteriyi düzenle' : 'Yeni müşteri'}><Text style={[styles.lead, { color: colors.textMuted }]}>Temel iletişim ve satış aşamasını düzenle. Çok dilli ad varsayılan içerik dilinde kaydedilir.</Text>{submitError ? <InfoBox description={submitError} title="Form kullanılamıyor" tone="danger" /> : null}<TextField error={errors.name} label={`Müşteri adı (${form.sourceLocale})`} onChangeText={(name) => { setForm((value) => ({ ...value, name })); setErrors((value) => ({ ...value, name: undefined })); }} onFocus={() => keyboard.onFocus('name')} ref={keyboard.register('name')} returnKeyType="next" value={form.name} /><TextField autoCapitalize="none" autoComplete="email" autoCorrect={false} error={errors.email} keyboardType="email-address" label="E-posta" onChangeText={(email) => { setForm((value) => ({ ...value, email })); setErrors((value) => ({ ...value, email: undefined })); }} onFocus={() => keyboard.onFocus('email')} ref={keyboard.register('email')} returnKeyType="next" value={form.email} /><TextField keyboardType="phone-pad" label="Telefon" onChangeText={(phone) => setForm((value) => ({ ...value, phone }))} onFocus={() => keyboard.onFocus('phone')} ref={keyboard.register('phone')} value={form.phone} /><ChoiceChips label="Satış aşaması" onSelect={(pipelineStatus) => setForm((value) => ({ ...value, pipelineStatus }))} options={pipelineOptions} selected={form.pipelineStatus} /><ChoiceChips label="Durum" onSelect={(status) => setForm((value) => ({ ...value, status }))} options={statusOptions} selected={form.status ?? 'active'} /></FormSheet>;
}

function fromDetail(value: ClientDetail, locale: string): ClientFormState { return { email: value.email ?? '', name: value.translations[locale]?.name ?? value.displayName, phone: value.phone ?? '', pipelineStatus: value.pipelineStatus, sourceLocale: locale, status: value.status }; }
const styles = StyleSheet.create({ lead: { fontSize: 15, lineHeight: 22, marginBottom: spacing.xs } });
