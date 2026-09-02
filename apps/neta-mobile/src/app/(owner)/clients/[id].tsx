import { useCallback, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { type Href, router, useFocusEffect, useLocalSearchParams } from 'expo-router';

import type { ClientActivity, ClientDetail } from '@neta/api-contracts';

import { Badge, Button, Card, EmptyState, InfoBox, ListRow, Screen, Skeleton, useToast } from '@/components/ui';
import type { AppIconName } from '@/components/ui/app-icon';
import { archiveClient, getClientDetail, listClientActivities } from '@/features/clients/api';
import { toClientError } from '@/lib/api/errors';
import { formatDateTime } from '@/lib/resource/format';
import { useSession } from '@/providers/session-provider';
import { useTheme } from '@/providers/theme-provider';
import { spacing } from '@/theme/tokens';

export default function ClientDetailRoute() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const session = useSession();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const [client, setClient] = useState<ClientDetail | null>(null);
  const [activities, setActivities] = useState<ClientActivity[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [archiving, setArchiving] = useState(false);

  const load = useCallback(async () => {
    if (!id || session.status !== 'authenticated' || session.role !== 'freelancer') return;
    setLoading(true); setError(null);
    try {
      const [detail, activityPage] = await Promise.all([
        getClientDetail(session.instance, session.user, id),
        listClientActivities(session.instance, session.user, id),
      ]);
      setClient(detail.data); setActivities(activityPage.data.items);
    } catch (loadError) { setError(toClientError(loadError, 'Müşteri detayı alınamadı.').message); }
    finally { setLoading(false); }
  }, [id, session]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));

  const confirmArchive = () => Alert.alert('Müşteri arşivlensin mi?', 'Müşteri listede arşiv durumuna taşınacak.', [
    { style: 'cancel', text: 'Vazgeç' },
    { style: 'destructive', text: 'Arşivle', onPress: () => void runArchive() },
  ]);
  const runArchive = async () => {
    if (!id || session.status !== 'authenticated' || session.role !== 'freelancer') return;
    setArchiving(true);
    try { const result = await archiveClient(session.instance, session.user, id); setClient(result.data); showToast({ message: 'Müşteri arşive taşındı.', title: result.data.displayName, tone: 'success' }); }
    catch (archiveError) { showToast({ message: toClientError(archiveError, 'Müşteri arşivlenemedi.').message, title: 'İşlem başarısız', tone: 'danger' }); }
    finally { setArchiving(false); }
  };

  if (loading && !client) return <Screen scroll><View style={styles.content}><Skeleton height={116} /><Skeleton height={180} /><Skeleton height={220} /></View></Screen>;
  if (error && !client) return <Screen centered contentStyle={styles.centered}><InfoBox action={<Button onPress={() => void load()}>Tekrar dene</Button>} description={error} title="Müşteri açılamadı" tone="danger" /></Screen>;
  if (!client) return <Screen centered contentStyle={styles.centered}><EmptyState description="Müşteri kaydı bulunamadı." title="Kayıt yok" /></Screen>;

  const locale = session.instance?.defaultLocale ?? 'tr';
  return <Screen onRefresh={() => void load()} refreshing={loading} scroll><View style={styles.content}>
    {error ? <InfoBox description={error} title="Bazı bilgiler yenilenemedi" tone="warning" /> : null}
    <Card style={styles.hero}><View style={styles.row}><View style={styles.copy}><Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{client.displayName}</Text><Text style={[styles.subtitle, { color: colors.textMuted }]}>{client.company ?? client.email ?? 'Müşteri profili'}</Text></View><Badge tone={client.status === 'active' ? 'success' : client.status === 'paused' ? 'warning' : 'neutral'}>{client.status}</Badge></View><View style={styles.actions}><Button onPress={() => router.push({ pathname: '/(forms)/client', params: { clientId: id } } as unknown as Href)} variant="secondary">Düzenle</Button><Button onPress={() => router.push({ pathname: '/(forms)/invitation', params: { clientId: id, email: client.email ?? '' } } as unknown as Href)}>Portal daveti</Button></View></Card>

    <Card><ListRow description={client.email ?? 'Eklenmemiş'} icon={{ ios: 'envelope.fill', android: 'mail' }} title="E-posta" /><ListRow description={client.phone ?? 'Eklenmemiş'} icon={{ ios: 'phone.fill', android: 'call' }} title="Telefon" /><ListRow description={`${client.projectCount} proje · ${client.pipelineStatus}`} icon={{ ios: 'folder.fill', android: 'folder' }} title="İş ilişkisi" /><ListRow description={client.portalStatus ?? 'disabled'} icon={{ ios: 'person.badge.key.fill', android: 'key' }} title="Portal erişimi" /></Card>

    <View style={styles.sectionHeading}><View style={styles.copy}><Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>Aktiviteler</Text><Text style={[styles.subtitle, { color: colors.textMuted }]}>Görüşme ve not geçmişi</Text></View><Button onPress={() => router.push({ pathname: '/(forms)/client-activity', params: { clientId: id } } as unknown as Href)} variant="secondary">Aktivite ekle</Button></View>
    {activities.length === 0 ? <EmptyState description="Bu müşteri için henüz aktivite bulunmuyor." title="Aktivite yok" /> : <Card>{activities.map((activity) => <ListRow description={`${activity.note} · ${formatDateTime(activity.createdAt, locale)}`} icon={activityIcon(activity.type)} key={activity.id} title={activityLabel(activity.type)} />)}</Card>}

    {client.status !== 'archived' ? <Button loading={archiving} onPress={confirmArchive} variant="ghost">Müşteriyi arşivle</Button> : null}
  </View></Screen>;
}

function activityLabel(type: ClientActivity['type']) { return { call: 'Telefon görüşmesi', email: 'E-posta', meeting: 'Toplantı', note: 'Not' }[type]; }
function activityIcon(type: ClientActivity['type']): AppIconName { return ({ call: { ios: 'phone.fill', android: 'call' }, email: { ios: 'envelope.fill', android: 'mail' }, meeting: { ios: 'person.2.fill', android: 'group' }, note: { ios: 'note.text', android: 'notes' } } as const)[type]; }
const styles = StyleSheet.create({ actions: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, centered: { maxWidth: 560, padding: spacing.lg }, content: { gap: spacing.md, paddingVertical: spacing.xl }, copy: { flex: 1, gap: spacing.xs }, hero: { gap: spacing.lg }, row: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md }, sectionHeading: { alignItems: 'center', flexDirection: 'row', gap: spacing.md, justifyContent: 'space-between' }, sectionTitle: { fontSize: 22, fontWeight: '900' }, subtitle: { fontSize: 14, lineHeight: 20 }, title: { fontSize: 28, fontWeight: '900', letterSpacing: -0.5 } });
