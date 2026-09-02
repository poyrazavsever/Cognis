import { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { type Href, router } from 'expo-router';

import type { DashboardRange } from '@neta/api-contracts';

import { AppIcon, Button, Card, EmptyState, FreshnessNotice, Screen, Skeleton } from '@/components/ui';
import { getOwnerDashboardBundle, type OwnerDashboardBundle } from '@/features/owner-dashboard/api';
import { toClientError, type NetaClientError } from '@/lib/api/errors';
import { formatDashboardValue, formatDateTime } from '@/lib/resource/format';
import { useSession } from '@/providers/session-provider';
import { useTheme } from '@/providers/theme-provider';
import { radius, spacing } from '@/theme/tokens';

const ranges: readonly { label: string; value: DashboardRange }[] = [
  { label: 'Bugün', value: 'today' }, { label: 'Hafta', value: 'this_week' },
  { label: 'Ay', value: 'this_month' }, { label: 'Yıl', value: 'this_year' },
];

export default function OwnerDashboardScreen() {
  const { colors } = useTheme();
  const session = useSession();
  const [range, setRange] = useState<DashboardRange>('this_month');
  const [bundle, setBundle] = useState<OwnerDashboardBundle | null>(null);
  const [error, setError] = useState<NetaClientError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const locale = session.user?.preferences?.locale ?? session.instance?.defaultLocale ?? 'tr';

  const loadDashboard = useCallback(async () => {
    if (session.status !== 'authenticated' || session.role !== 'freelancer') return;
    setIsLoading(true); setError(null);
    try { setBundle(await getOwnerDashboardBundle(session.instance, session.user, range)); }
    catch (value) { setError(toClientError(value, 'Dashboard verisi alınamadı.')); }
    finally { setIsLoading(false); }
  }, [range, session]);

  useEffect(() => { const timeout = setTimeout(() => void loadDashboard(), 0); return () => clearTimeout(timeout); }, [loadDashboard]);
  const hasContent = Boolean(bundle?.data.dashboard.stats.length);
  const firstName = session.user?.name?.trim().split(/\s+/)[0];

  return (
    <Screen scroll contentStyle={styles.content} onRefresh={() => void loadDashboard()} refreshing={isLoading && Boolean(bundle)}>
      <View style={styles.hero}>
        <View style={styles.heroCopy}><Text style={[styles.eyebrow, { color: colors.primary }]}>GÜNÜN ÖZETİ</Text><Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>Merhaba{firstName ? `, ${firstName}` : ''}</Text><Text style={[styles.description, { color: colors.textMuted }]}>Müşterilerini, projelerini ve bugünün odağını tek bakışta yönet.</Text></View>
        <Pressable accessibilityLabel="Dashboard'u yenile" accessibilityRole="button" onPress={() => void loadDashboard()} style={({ pressed }) => [styles.refresh, { backgroundColor: colors.surfaceMuted }, pressed && { backgroundColor: colors.surfacePressed }]}><AppIcon color={colors.primary} name={{ ios: 'arrow.clockwise', android: 'refresh' }} /></Pressable>
      </View>

      <View accessibilityLabel="Dashboard tarih aralığı" accessibilityRole="radiogroup" style={[styles.rangeRow, { backgroundColor: colors.surfaceMuted }]}>{ranges.map((item) => { const selected = item.value === range; return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} key={item.value} onPress={() => setRange(item.value)} style={[styles.rangeButton, selected && { backgroundColor: colors.surfaceElevated }]}><Text style={[styles.rangeLabel, { color: selected ? colors.primary : colors.textMuted }]}>{item.label}</Text></Pressable>; })}</View>

      <View style={styles.quickRow}>
        <QuickAction icon={{ ios: 'person.badge.plus', android: 'person_add' }} label="Müşteri" onPress={() => router.navigate('/(owner)/clients' as Href)} />
        <QuickAction icon={{ ios: 'folder.badge.plus', android: 'create_new_folder' }} label="Proje" onPress={() => router.navigate('/(owner)/projects' as Href)} />
        <QuickAction icon={{ ios: 'checkmark.circle', android: 'add_task' }} label="Görev" onPress={() => router.navigate('/(forms)/task' as Href)} />
      </View>

      {isLoading && !bundle ? <DashboardSkeleton /> : null}
      {error ? <EmptyState action={<Button loading={isLoading} onPress={() => void loadDashboard()}>Tekrar dene</Button>} description={error.message} title="Dashboard alınamadı" /> : null}
      {bundle ? <FreshnessNotice cachedAt={bundle.cachedAt} isStale={bundle.isStale} /> : null}
      {!isLoading && !error && !hasContent ? <EmptyState action={<Button onPress={() => void loadDashboard()} variant="secondary">Yenile</Button>} description="Bu aralık için henüz özet veri bulunmuyor." title="Güncel veri yok" /> : null}

      {bundle ? <>
        <View style={styles.statsGrid}>{bundle.data.dashboard.stats.map((stat) => <Card accessibilityLabel={`${stat.label}: ${formatDashboardValue(stat.value, locale)}`} key={stat.id} style={styles.statCard}><Text style={[styles.statLabel, { color: colors.textMuted }]}>{stat.label}</Text><Text adjustsFontSizeToFit numberOfLines={1} style={[styles.statValue, { color: colors.text }]}>{formatDashboardValue(stat.value, locale)}</Text>{stat.trendLabel ? <Text style={[styles.statTrend, { color: colors.success }]}>{stat.trendLabel}</Text> : null}</Card>)}</View>
        <Card style={styles.summaryCard}><View style={[styles.summaryIcon, { backgroundColor: colors.infoSurface }]}><AppIcon color={colors.info} name={{ ios: 'sparkles', android: 'auto_awesome' }} /></View><View style={styles.summaryCopy}><Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>Analiz özeti</Text><Text accessibilityLabel={bundle.data.analytics.chartSummary} style={[styles.description, { color: colors.textMuted }]}>{bundle.data.analytics.chartSummary}</Text></View></Card>
        <DashboardSection items={bundle.data.dashboard.recentProjects} title="Son projeler" />
        <DashboardSection items={bundle.data.dashboard.recentClients} title="Son müşteriler" />
        <Text style={[styles.timestamp, { color: colors.textSubtle }]}>Son güncelleme {formatDateTime(bundle.data.dashboard.generatedAt, locale)}{bundle.fromCache ? ' · cache' : ''}</Text>
      </> : null}
    </Screen>
  );
}

function QuickAction({ icon, label, onPress }: { icon: Parameters<typeof AppIcon>[0]['name']; label: string; onPress: () => void }) {
  const { colors } = useTheme();
  return <Pressable accessibilityHint={`${label} ekranını açar`} accessibilityLabel={`Yeni ${label}`} accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.quickAction, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }, pressed && { backgroundColor: colors.surfacePressed }]}><View style={[styles.quickIcon, { backgroundColor: colors.surfaceMuted }]}><AppIcon color={colors.primary} name={icon} /></View><Text style={[styles.quickLabel, { color: colors.text }]}>{label}</Text></Pressable>;
}

function DashboardSection({ items, title }: { items: { id: string; subtitle: string | null; title: string }[]; title: string }) {
  const { colors } = useTheme();
  return <Card style={styles.card}><Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>{items.length ? items.map((item) => <View key={item.id} style={[styles.listRow, { borderTopColor: colors.border }]}><Text style={[styles.listTitle, { color: colors.text }]}>{item.title}</Text>{item.subtitle ? <Text style={[styles.listSubtitle, { color: colors.textMuted }]}>{item.subtitle}</Text> : null}</View>) : <Text style={[styles.description, { color: colors.textMuted }]}>Bu aralıkta kayıt yok.</Text>}</Card>;
}

function DashboardSkeleton() { return <View style={styles.statsGrid}><Skeleton height={112} width="48%" /><Skeleton height={112} width="48%" /><Skeleton height={112} width="48%" /><Skeleton height={112} width="48%" /></View>; }

const styles = StyleSheet.create({
  card: { gap: spacing.md }, content: { gap: spacing.lg, paddingBottom: spacing.xl, paddingTop: spacing.lg },
  description: { fontSize: 15, lineHeight: 22 }, eyebrow: { fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  hero: { alignItems: 'center', flexDirection: 'row', gap: spacing.md }, heroCopy: { flex: 1, gap: spacing.xs },
  listRow: { borderTopWidth: StyleSheet.hairlineWidth, gap: spacing.xs, paddingTop: spacing.md }, listSubtitle: { fontSize: 14 }, listTitle: { fontSize: 16, fontWeight: '700' },
  quickAction: { alignItems: 'center', borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, flex: 1, gap: spacing.sm, minHeight: 92, padding: spacing.sm },
  quickIcon: { alignItems: 'center', borderRadius: radius.pill, height: 42, justifyContent: 'center', width: 42 }, quickLabel: { fontSize: 13, fontWeight: '800' }, quickRow: { flexDirection: 'row', gap: spacing.sm },
  rangeButton: { alignItems: 'center', borderRadius: radius.md, flex: 1, justifyContent: 'center', minHeight: 44, paddingHorizontal: spacing.sm }, rangeLabel: { fontSize: 13, fontWeight: '800' }, rangeRow: { borderRadius: radius.lg, flexDirection: 'row', padding: spacing.xs },
  refresh: { alignItems: 'center', borderRadius: radius.pill, height: 48, justifyContent: 'center', width: 48 },
  sectionTitle: { fontSize: 19, fontWeight: '900' }, statCard: { flexBasis: '47%', flexGrow: 1, gap: spacing.sm, minHeight: 112 }, statLabel: { fontSize: 13, fontWeight: '700' }, statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, statTrend: { fontSize: 13, fontWeight: '800' }, statValue: { fontSize: 26, fontWeight: '900' },
  summaryCard: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md }, summaryCopy: { flex: 1, gap: spacing.xs }, summaryIcon: { alignItems: 'center', borderRadius: radius.md, height: 44, justifyContent: 'center', width: 44 },
  timestamp: { fontSize: 12, lineHeight: 18, textAlign: 'center' }, title: { fontSize: 34, fontWeight: '900', letterSpacing: -0.8 },
});
