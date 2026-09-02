import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { FormSheet, useKeyboardForm } from '@/components/forms';
import { InfoBox, TextField, useToast } from '@/components/ui';
import { inviteClientPortal } from '@/features/clients/api';
import { toClientError } from '@/lib/api/errors';
import { useSession } from '@/providers/session-provider';
import { useTheme } from '@/providers/theme-provider';

type Field = 'email' | 'locale';
export default function InvitationFormRoute() {
  const params = useLocalSearchParams<{ clientId?: string; email?: string }>(); const session = useSession(); const { colors } = useTheme(); const { showToast } = useToast(); const keyboard = useKeyboardForm<Field>();
  const initial = useMemo(() => ({ email: params.email ?? '', locale: session.instance?.defaultLocale ?? 'tr' }), [params.email, session.instance?.defaultLocale]);
  const [form, setForm] = useState(initial); const [error, setError] = useState<string | null>(null); const [fieldError, setFieldError] = useState<string | null>(null); const [submitting, setSubmitting] = useState(false); const [saved, setSaved] = useState(false);
  useEffect(() => { if (saved) router.back(); }, [saved]);
  const submit = async () => { if (!params.clientId || session.status !== 'authenticated' || session.role !== 'freelancer') return; if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) { setFieldError('Geçerli bir e-posta adresi gir.'); keyboard.focusFirstError({ email: 'error' }, ['email']); return; } setSubmitting(true); setError(null); try { await inviteClientPortal(session.instance, session.user, params.clientId, { defaultLocale: form.locale.trim(), email: form.email.trim() }); setSaved(true); showToast({ message: `${form.email.trim()} adresine portal daveti gönderildi.`, title: 'Davet hazır', tone: 'success' }); } catch (submitError) { setError(toClientError(submitError, 'Portal daveti gönderilemedi.').message); } finally { setSubmitting(false); } };
  return <FormSheet dirty={!saved && JSON.stringify(form) !== JSON.stringify(initial)} onSubmit={() => void submit()} scrollRef={keyboard.scrollRef} submitLabel="Daveti gönder" submitting={submitting} title="Portal daveti"><Text style={[styles.lead, { color: colors.textMuted }]}>Müşteri bu bağlantıyla yalnızca kendisine açık proje, görev ve revizyonları görür.</Text>{error ? <InfoBox description={error} title="Davet gönderilemedi" tone="danger" /> : null}<TextField autoCapitalize="none" autoComplete="email" autoCorrect={false} error={fieldError ?? undefined} keyboardType="email-address" label="Davet e-postası" onChangeText={(email) => { setForm((value) => ({ ...value, email })); setFieldError(null); }} onFocus={() => keyboard.onFocus('email')} ref={keyboard.register('email')} value={form.email} /><TextField autoCapitalize="none" label="Portal dili" onChangeText={(locale) => setForm((value) => ({ ...value, locale }))} onFocus={() => keyboard.onFocus('locale')} ref={keyboard.register('locale')} value={form.locale} /></FormSheet>;
}
const styles = StyleSheet.create({ lead: { fontSize: 15, lineHeight: 22 } });
