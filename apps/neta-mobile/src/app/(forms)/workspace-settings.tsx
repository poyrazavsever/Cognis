import { useEffect, useState } from 'react';
import { router } from 'expo-router';
import type { GeneralSettings } from '@neta/api-contracts';
import { FormSheet, useKeyboardForm } from '@/components/forms';
import { InfoBox, TextField, useToast } from '@/components/ui';
import { getGeneralSettings, updateGeneralSettings } from '@/features/settings/api';
import { toClientError } from '@/lib/api/errors';
import { useSession } from '@/providers/session-provider';

type Field = 'workspaceName' | 'companyName' | 'portalFooter';
const empty: GeneralSettings = { companyName: null, portalFooter: null, workspaceName: '' };

export default function WorkspaceSettingsFormRoute() {
  const session = useSession(); const { showToast } = useToast(); const keyboard = useKeyboardForm<Field>();
  const [form, setForm] = useState(empty); const [baseline, setBaseline] = useState(JSON.stringify(empty)); const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(true); const [saved, setSaved] = useState(false);
  useEffect(() => { if (saved) router.back(); }, [saved]);
  useEffect(() => { if (session.status !== 'authenticated' || session.role !== 'freelancer') return; let active = true; void getGeneralSettings(session.instance, session.user).then((result) => { if (active) { setForm(result.data); setBaseline(JSON.stringify(result.data)); } }).catch((value) => active && setError(toClientError(value, 'Workspace ayarları alınamadı.').message)).finally(() => active && setLoading(false)); return () => { active = false; }; }, [session]);
  const submit = async () => { if (session.status !== 'authenticated' || session.role !== 'freelancer') return; if (!form.workspaceName.trim()) { keyboard.focusFirstError({ workspaceName: true }, ['workspaceName']); return; } const payload = { companyName: form.companyName?.trim() || null, portalFooter: form.portalFooter?.trim() || null, workspaceName: form.workspaceName.trim() }; setLoading(true); setError(null); try { await updateGeneralSettings(session.instance, session.user, payload); setSaved(true); showToast({ message: 'Workspace ayarları güncellendi.', tone: 'success' }); } catch (value) { setError(toClientError(value, 'Workspace ayarları kaydedilemedi.').message); } finally { setLoading(false); } };
  return <FormSheet dirty={!saved && JSON.stringify(form) !== baseline} onSubmit={() => void submit()} scrollRef={keyboard.scrollRef} submitting={loading} title="Workspace ayarları">{error ? <InfoBox description={error} title="Kaydedilemedi" tone="danger" /> : null}<TextField error={!form.workspaceName.trim() ? 'Workspace adı zorunludur.' : undefined} label="Workspace adı" onChangeText={(workspaceName) => setForm((value) => ({ ...value, workspaceName }))} onFocus={() => keyboard.onFocus('workspaceName')} ref={keyboard.register('workspaceName')} value={form.workspaceName} /><TextField label="Şirket adı" onChangeText={(companyName) => setForm((value) => ({ ...value, companyName }))} onFocus={() => keyboard.onFocus('companyName')} ref={keyboard.register('companyName')} value={form.companyName ?? ''} /><TextField label="Portal alt bilgi metni" multiline onChangeText={(portalFooter) => setForm((value) => ({ ...value, portalFooter }))} onFocus={() => keyboard.onFocus('portalFooter')} ref={keyboard.register('portalFooter')} value={form.portalFooter ?? ''} /></FormSheet>;
}
