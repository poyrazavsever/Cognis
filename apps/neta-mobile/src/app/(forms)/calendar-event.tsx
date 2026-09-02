import { useEffect, useMemo, useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import type { CalendarEventDetail, CalendarEventType, ClientListItem, ProjectListItem, TaskListItem } from '@neta/api-contracts';

import { ChoiceChips, FormSheet, NativeDateTimeField, RelationPickerField, useKeyboardForm } from '@/components/forms';
import { Button, InfoBox, TextField, useToast } from '@/components/ui';
import { createCalendarEvent, deleteCalendarEvent, getCalendarEventDetail, updateCalendarEvent } from '@/features/calendar/api';
import { buildCalendarEventPayload, type CalendarEventFormErrors, type CalendarEventFormState, validateCalendarEventForm } from '@/features/calendar/form';
import { listClients } from '@/features/clients/api'; import { listProjects } from '@/features/projects/api'; import { listTasks } from '@/features/tasks/api';
import { toClientError } from '@/lib/api/errors'; import { useSession } from '@/providers/session-provider'; import { useTheme } from '@/providers/theme-provider';

type Field = 'title' | 'description';
const types: readonly { label: string; value: CalendarEventType }[] = [{ label: 'Toplantı', value: 'meeting' }, { label: 'Odak', value: 'focus' }, { label: 'Son tarih', value: 'deadline' }, { label: 'Kişisel', value: 'personal' }, { label: 'Finans', value: 'finance' }];

export default function CalendarEventFormRoute() {
  const { eventId, startAt: initialStartAt } = useLocalSearchParams<{ eventId?: string; startAt?: string }>();
  const session = useSession(); const { colors } = useTheme(); const { showToast } = useToast(); const keyboard = useKeyboardForm<Field>();
  const locale = session.user?.preferences?.locale ?? session.instance?.defaultLocale ?? 'tr';
  const start = useMemo(() => initialStartAt && !Number.isNaN(Date.parse(initialStartAt)) ? new Date(initialStartAt) : nextHour(new Date()), [initialStartAt]);
  const empty = useMemo<CalendarEventFormState>(() => ({ clientId: '', description: '', endAt: new Date(start.getTime() + 3_600_000), projectId: '', sourceLocale: session.instance?.defaultLocale ?? 'tr', startAt: start, taskId: '', title: '', type: 'meeting' }), [session.instance?.defaultLocale, start]);
  const [form, setForm] = useState(empty); const [baseline, setBaseline] = useState(JSON.stringify(empty)); const [version, setVersion] = useState<string | null>(null); const [readOnly, setReadOnly] = useState(false);
  const [clients, setClients] = useState<ClientListItem[]>([]); const [projects, setProjects] = useState<ProjectListItem[]>([]); const [tasks, setTasks] = useState<TaskListItem[]>([]);
  const [errors, setErrors] = useState<CalendarEventFormErrors>({}); const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(true); const [saved, setSaved] = useState(false);
  useEffect(() => { if (saved) router.back(); }, [saved]);
  useEffect(() => {
    if (session.status !== 'authenticated' || session.role !== 'freelancer') return;
    let active = true;
    void Promise.all([listClients(session.instance, session.user, {}), listProjects(session.instance, session.user, {}), listTasks(session.instance, session.user, {}), eventId ? getCalendarEventDetail(session.instance, session.user, eventId) : Promise.resolve(null)])
      .then(([clientPage, projectPage, taskPage, detail]) => { if (!active) return; setClients(clientPage.data.items); setProjects(projectPage.data.items); setTasks(taskPage.data.items); if (detail) { const next = fromDetail(detail.data, empty.sourceLocale); setForm(next); setBaseline(JSON.stringify(next)); setVersion(detail.data.version); setReadOnly(detail.data.readOnly); } })
      .catch((value) => active && setError(toClientError(value, 'Etkinlik formu yüklenemedi.').message))
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, [empty.sourceLocale, eventId, session]);

  const submit = async () => {
    if (readOnly || session.status !== 'authenticated' || session.role !== 'freelancer') return;
    const next = validateCalendarEventForm(form); setErrors(next);
    if (Object.keys(next).length) { keyboard.focusFirstError(next, ['title']); return; }
    setLoading(true); setError(null);
    try { const payload = { ...buildCalendarEventPayload(form), ...(eventId ? { version } : {}) }; const result = eventId ? await updateCalendarEvent(session.instance, session.user, eventId, payload) : await createCalendarEvent(session.instance, session.user, payload); setSaved(true); showToast({ message: eventId ? 'Etkinlik güncellendi.' : 'Etkinlik takvime eklendi.', title: result.data.title, tone: 'success' }); }
    catch (value) { setError(toClientError(value, 'Etkinlik kaydedilemedi.').message); }
    finally { setLoading(false); }
  };
  const remove = async () => { if (!eventId || readOnly || session.status !== 'authenticated' || session.role !== 'freelancer') return; setLoading(true); try { await deleteCalendarEvent(session.instance, session.user, eventId); setSaved(true); showToast({ message: 'Etkinlik silindi.', tone: 'success' }); } catch (value) { setError(toClientError(value, 'Etkinlik silinemedi.').message); } finally { setLoading(false); } };

  return <FormSheet dirty={!saved && !loading && !readOnly && JSON.stringify(form) !== baseline} onSubmit={() => void submit()} scrollRef={keyboard.scrollRef} submitDisabled={readOnly} submitLabel={eventId ? 'Değişiklikleri kaydet' : 'Etkinliği oluştur'} submitting={loading} title={eventId ? 'Etkinlik detayı' : 'Yeni etkinlik'}>
    <Text style={[styles.lead, { color: colors.textMuted }]}>Tarih ve saati native seçiciden, ilişkileri kayıt listesinden seç.</Text>
    {readOnly ? <InfoBox description="Bu etkinlik görev veya finans kaydından üretilir. Kaynak kaydı üzerinden düzenlenmelidir." title="Salt okunur etkinlik" tone="info" /> : null}
    {error ? <InfoBox description={error} title="İşlem yapılamadı" tone="danger" /> : null}
    <TextField editable={!readOnly} error={errors.title} label={`Başlık (${form.sourceLocale})`} onChangeText={(title) => setForm((value) => ({ ...value, title }))} onFocus={() => keyboard.onFocus('title')} ref={keyboard.register('title')} value={form.title} />
    <TextField editable={!readOnly} label="Açıklama" multiline onChangeText={(description) => setForm((value) => ({ ...value, description }))} onFocus={() => keyboard.onFocus('description')} ref={keyboard.register('description')} value={form.description} />
    {!readOnly ? <><ChoiceChips label="Etkinlik türü" onSelect={(type) => setForm((value) => ({ ...value, type }))} options={types} selected={form.type} /><NativeDateTimeField label="Başlangıç" locale={locale} onChange={(startAt) => setForm((value) => ({ ...value, startAt }))} value={form.startAt} /><NativeDateTimeField label="Bitiş" locale={locale} onChange={(endAt) => setForm((value) => ({ ...value, endAt }))} value={form.endAt} />{errors.range ? <InfoBox description={errors.range} tone="danger" /> : null}<RelationPickerField label="Müşteri" onChange={(clientId) => setForm((value) => ({ ...value, clientId: clientId ?? '' }))} options={clients.map((item) => ({ id: item.id, label: item.displayName }))} value={form.clientId || null} /><RelationPickerField label="Proje" onChange={(projectId) => setForm((value) => ({ ...value, projectId: projectId ?? '' }))} options={projects.map((item) => ({ id: item.id, label: item.title }))} value={form.projectId || null} /><RelationPickerField label="Görev" onChange={(taskId) => setForm((value) => ({ ...value, taskId: taskId ?? '' }))} options={tasks.map((item) => ({ id: item.id, label: item.title }))} value={form.taskId || null} /></> : null}
    {eventId && !readOnly ? <Button onPress={() => Alert.alert('Etkinlik silinsin mi?', 'Bu işlem geri alınamaz.', [{ style: 'cancel', text: 'Vazgeç' }, { style: 'destructive', text: 'Sil', onPress: () => void remove() }])} variant="ghost">Etkinliği sil</Button> : null}
  </FormSheet>;
}

function fromDetail(value: CalendarEventDetail, locale: string): CalendarEventFormState { const translated = value.translations[locale] ?? Object.values(value.translations)[0]; return { clientId: value.clientId ?? '', description: translated?.description ?? '', endAt: new Date(value.endAt), projectId: value.projectId ?? '', sourceLocale: locale, startAt: new Date(value.startAt), taskId: value.taskId ?? '', title: translated?.name ?? value.title, type: value.type }; }
function nextHour(value: Date) { const result = new Date(value); result.setHours(result.getHours() + 1, 0, 0, 0); return result; }
const styles = StyleSheet.create({ lead: { fontSize: 15, lineHeight: 22 } });
