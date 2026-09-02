import { useEffect, useMemo, useState } from 'react';
import { Alert, Text } from 'react-native';
import { router } from 'expo-router';
import type { AuthSessionInfo } from '@neta/api-contracts';
import { FormSheet, useKeyboardForm } from '@/components/forms';
import { Button, InfoBox, ListRow, TextField, useToast } from '@/components/ui';
import { changePassword, listAuthSessions, revokeAuthSession } from '@/features/settings/api';
import { toClientError } from '@/lib/api/errors';
import { useSession } from '@/providers/session-provider';
import { useTheme } from '@/providers/theme-provider';

type Field = 'current' | 'next';

export default function OwnerSecurityFormRoute() {
  const session = useSession(); const { colors } = useTheme(); const { showToast } = useToast(); const keyboard = useKeyboardForm<Field>(); const initial = useMemo(() => ({ current: '', next: '' }), []);
  const [form, setForm] = useState(initial); const [sessions, setSessions] = useState<AuthSessionInfo[]>([]); const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(false); const [saved, setSaved] = useState(false);
  useEffect(() => { if (saved) router.back(); }, [saved]);
  useEffect(() => { if (session.status !== 'authenticated' || session.role !== 'freelancer') return; let active = true; void listAuthSessions(session.instance, session.user).then((result) => active && setSessions(result.data)).catch((value) => active && setError(toClientError(value, 'Oturumlar alınamadı.').message)); return () => { active = false; }; }, [session]);
  const submit = async () => { if (session.status !== 'authenticated' || session.role !== 'freelancer') return; if (!form.current || form.next.length < 8) { setError('Mevcut şifreyi ve en az 8 karakterli yeni şifreyi gir.'); keyboard.focusFirstError({ current: !form.current, next: form.next.length < 8 }, ['current', 'next']); return; } setLoading(true); setError(null); try { await changePassword(session.instance, session.user, { currentPassword: form.current, newPassword: form.next, revokeOtherSessions: true }); setSaved(true); showToast({ message: 'Şifre değiştirildi; diğer oturumlar kapatıldı.', tone: 'success' }); } catch (value) { setError(toClientError(value, 'Şifre değiştirilemedi.').message); } finally { setLoading(false); } };
  const revoke = (item: AuthSessionInfo) => Alert.alert('Oturum kapatılsın mı?', item.deviceLabel, [{ style: 'cancel', text: 'Vazgeç' }, { style: 'destructive', text: 'Kapat', onPress: () => void performRevoke(item.id) }]);
  const performRevoke = async (id: string) => { if (session.status !== 'authenticated' || session.role !== 'freelancer') return; try { await revokeAuthSession(session.instance, session.user, id); setSessions((value) => value.filter((item) => item.id !== id)); showToast({ message: 'Oturum kapatıldı.', tone: 'success' }); } catch (value) { setError(toClientError(value, 'Oturum kapatılamadı.').message); } };
  return <FormSheet dirty={!saved && JSON.stringify(form) !== JSON.stringify(initial)} onSubmit={() => void submit()} scrollRef={keyboard.scrollRef} submitLabel="Şifreyi değiştir" submitting={loading} title="Güvenlik">{error ? <InfoBox description={error} title="İşlem yapılamadı" tone="danger" /> : null}<TextField autoComplete="current-password" label="Mevcut şifre" onChangeText={(current) => setForm((value) => ({ ...value, current }))} onFocus={() => keyboard.onFocus('current')} ref={keyboard.register('current')} secureTextEntry value={form.current} /><TextField autoComplete="new-password" label="Yeni şifre" onChangeText={(next) => setForm((value) => ({ ...value, next }))} onFocus={() => keyboard.onFocus('next')} ref={keyboard.register('next')} secureTextEntry value={form.next} /><Text accessibilityRole="header" style={{ color: colors.text, fontSize: 19, fontWeight: '900' }}>Açık oturumlar</Text>{sessions.map((item) => <ListRow description={item.current ? 'Bu cihaz' : item.lastActiveAt} icon={{ ios: 'iphone', android: 'smartphone' }} key={item.id} onPress={item.current ? undefined : () => revoke(item)} title={item.deviceLabel} />)}{sessions.length === 0 ? <Button disabled variant="ghost">Açık oturum bulunamadı</Button> : null}</FormSheet>;
}
