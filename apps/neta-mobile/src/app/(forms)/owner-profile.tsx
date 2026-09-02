import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { FormSheet, useKeyboardForm } from '@/components/forms';
import { InfoBox, TextField, useToast } from '@/components/ui';
import { updateMeProfile } from '@/features/settings/api';
import { toClientError } from '@/lib/api/errors';
import { useSession } from '@/providers/session-provider';

type Field = 'name';

export default function OwnerProfileFormRoute() {
  const session = useSession(); const { showToast } = useToast(); const keyboard = useKeyboardForm<Field>();
  const [name, setName] = useState(session.user?.name ?? ''); const [baseline] = useState(name); const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(false); const [saved, setSaved] = useState(false);
  useEffect(() => { if (saved) router.back(); }, [saved]);
  const submit = async () => { if (session.status !== 'authenticated' || session.role !== 'freelancer') return; if (!name.trim()) { keyboard.focusFirstError({ name: true }, ['name']); return; } setLoading(true); setError(null); try { await updateMeProfile(session.instance, session.user, { name: name.trim() }); await session.refreshSession(); setSaved(true); showToast({ message: 'Profil güncellendi.', tone: 'success' }); } catch (value) { setError(toClientError(value, 'Profil güncellenemedi.').message); } finally { setLoading(false); } };
  return <FormSheet dirty={!saved && name !== baseline} onSubmit={() => void submit()} scrollRef={keyboard.scrollRef} submitting={loading} title="Profili düzenle">{error ? <InfoBox description={error} title="Kaydedilemedi" tone="danger" /> : null}<TextField error={!name.trim() ? 'Görünen ad zorunludur.' : undefined} label="Görünen ad" onChangeText={setName} onFocus={() => keyboard.onFocus('name')} ref={keyboard.register('name')} value={name} /><TextField editable={false} label="E-posta" value={session.user?.email ?? 'E-posta yok'} /></FormSheet>;
}
