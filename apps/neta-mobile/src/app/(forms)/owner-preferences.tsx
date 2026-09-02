import { useEffect, useMemo, useState } from 'react';
import { router } from 'expo-router';
import type { MePreferencesMutationPayload } from '@neta/api-contracts';
import { ChoiceChips, FormSheet, useKeyboardForm } from '@/components/forms';
import { InfoBox, TextField, useToast } from '@/components/ui';
import { updateMePreferences } from '@/features/settings/api';
import { toClientError } from '@/lib/api/errors';
import { useSession } from '@/providers/session-provider';
import { useTheme } from '@/providers/theme-provider';
import type { ColorMode } from '@/theme/tokens';

type Field = 'locale' | 'timezone';
const modes: readonly { label: string; value: ColorMode }[] = [{ label: 'Sistem', value: 'system' }, { label: 'Açık', value: 'light' }, { label: 'Koyu', value: 'dark' }];

export default function OwnerPreferencesFormRoute() {
  const session = useSession(); const { setColorMode } = useTheme(); const { showToast } = useToast(); const keyboard = useKeyboardForm<Field>();
  const initial = useMemo(() => ({ colorMode: session.user?.preferences?.colorMode ?? 'system' as ColorMode, locale: session.user?.preferences?.locale ?? session.instance?.defaultLocale ?? 'tr', timezone: session.user?.preferences?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone }), [session]);
  const [form, setForm] = useState(initial); const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(false); const [saved, setSaved] = useState(false);
  useEffect(() => { if (saved) router.back(); }, [saved]);
  const submit = async () => { if (session.status !== 'authenticated' || session.role !== 'freelancer') return; const errors = { locale: !form.locale.trim(), timezone: !form.timezone.trim() }; if (errors.locale || errors.timezone) { keyboard.focusFirstError(errors, ['locale', 'timezone']); return; } const payload: MePreferencesMutationPayload = { colorMode: form.colorMode, locale: form.locale.trim(), timezone: form.timezone.trim() }; setLoading(true); setError(null); try { await updateMePreferences(session.instance, session.user, payload); setColorMode(form.colorMode); await session.refreshSession(); setSaved(true); showToast({ message: 'Tercihler güncellendi.', tone: 'success' }); } catch (value) { setError(toClientError(value, 'Tercihler güncellenemedi.').message); } finally { setLoading(false); } };
  return <FormSheet dirty={!saved && JSON.stringify(form) !== JSON.stringify(initial)} onSubmit={() => void submit()} scrollRef={keyboard.scrollRef} submitting={loading} title="Tercihler">{error ? <InfoBox description={error} title="Kaydedilemedi" tone="danger" /> : null}<ChoiceChips label="Tema" onSelect={(colorMode) => setForm((value) => ({ ...value, colorMode }))} options={modes} selected={form.colorMode} /><TextField autoCapitalize="none" label="Dil" onChangeText={(locale) => setForm((value) => ({ ...value, locale }))} onFocus={() => keyboard.onFocus('locale')} ref={keyboard.register('locale')} value={form.locale} /><TextField autoCapitalize="none" label="Zaman dilimi" onChangeText={(timezone) => setForm((value) => ({ ...value, timezone }))} onFocus={() => keyboard.onFocus('timezone')} ref={keyboard.register('timezone')} value={form.timezone} /></FormSheet>;
}
