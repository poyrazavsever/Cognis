import { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { type Href, router, useFocusEffect } from 'expo-router';

import type { JournalEntryListItem } from '@neta/api-contracts';

import { Badge, Button, Card, EmptyState, InfoBox, Screen, Skeleton } from '@/components/ui';
import { createVisibleMonthDays, createVisibleMonthRange, moveMonth, toLocalCalendarKey } from '@/features/calendar/date';
import { listJournalEntries } from '@/features/journal/api';
import { calculateJournalTrend, type JournalTrendMetric } from '@/features/journal/trend';
import { toClientError } from '@/lib/api/errors';
import { useSession } from '@/providers/session-provider';
import { useTheme } from '@/providers/theme-provider';
import { radius, spacing } from '@/theme/tokens';

type Mode = 'calendar' | 'list';

export default function JournalScreen() {
  const session = useSession();
  const { colors } = useTheme();
  const locale = session.user?.preferences?.locale ?? session.instance?.defaultLocale ?? 'tr';
  const [mode, setMode] = useState<Mode>('calendar');
  const [month, setMonth] = useState(new Date());
  const [items, setItems] = useState<JournalEntryListItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const range = useMemo(() => createVisibleMonthRange(month), [month]);
  const days = useMemo(() => createVisibleMonthDays(month), [month]);
  const byDate = useMemo(() => new Map(items.map((item) => [item.date, item])), [items]);
  const trend = useMemo(() => calculateJournalTrend(items), [items]);

  const load = useCallback(async () => {
    if (session.status !== 'authenticated' || session.role !== 'freelancer') return;
    setLoading(true); setError(null);
    try { setItems((await listJournalEntries(session.instance, session.user, range.from, range.to)).data.items); }
    catch (value) { setError(toClientError(value, 'Günlük kayıtları alınamadı.').message); }
    finally { setLoading(false); }
  }, [range, session]);

  useFocusEffect(useCallback(() => { void load(); }, [load]));
  const openDate = (date: string) => router.push(`/journal-entry?date=${encodeURIComponent(date)}` as Href);

  return <Screen onRefresh={() => void load()} refreshing={loading && items.length > 0} scroll>
    <View style={styles.content}>
      <View style={styles.heading}>
        <View style={styles.copy}>
          <Badge tone="primary">Günlük</Badge>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>Günlük ve iyi oluş</Text>
          <Text style={[styles.description, { color: colors.textMuted }]}>Ruh hali, enerji ve kişisel notlarını özel olarak takip et.</Text>
        </View>
        <Button onPress={() => openDate(toLocalCalendarKey(new Date()))}>Bugünü yaz</Button>
      </View>
      <View accessibilityLabel="Günlük görünümü" accessibilityRole="radiogroup" style={styles.row}>
        <Choice label="Takvim" onPress={() => setMode('calendar')} selected={mode === 'calendar'} />
        <Choice label="Liste" onPress={() => setMode('list')} selected={mode === 'list'} />
      </View>
      <Card style={styles.card}>
        <View style={styles.month}>
          <Button accessibilityLabel="Önceki ay" onPress={() => setMonth((value) => moveMonth(value, -1))} variant="ghost">Önceki</Button>
          <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>{new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(month)}</Text>
          <Button accessibilityLabel="Sonraki ay" onPress={() => setMonth((value) => moveMonth(value, 1))} variant="ghost">Sonraki</Button>
        </View>
        {mode === 'calendar' ? <ScrollView accessibilityLabel="Günlük ay günleri" horizontal>
          <View style={styles.grid}>{days.map((day) => {
            const key = toLocalCalendarKey(day); const item = byDate.get(key);
            return <Pressable accessibilityLabel={`${new Intl.DateTimeFormat(locale, { dateStyle: 'full' }).format(day)}, ${item ? 'kayıt var' : 'kayıt yok'}`} accessibilityRole="button" key={key} onPress={() => openDate(key)} style={[styles.day, item && { backgroundColor: colors.primary }]}>
              <Text style={{ color: item ? colors.primaryForeground : colors.text }}>{day.getDate()}</Text>
              {item ? <Text style={{ color: colors.primaryForeground }}>•</Text> : null}
            </Pressable>;
          })}</View>
        </ScrollView> : null}
      </Card>
      {items.length ? <Card accessibilityLabel={`Aylık iyi oluş özeti, ${items.length} kayıt`} style={styles.card}>
        <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>Aylık eğilim</Text>
        <View style={styles.trendRow}>
          <TrendMetric label="Ruh hali" metric={trend.mood} />
          <TrendMetric label="Enerji" metric={trend.energy} />
          <TrendMetric label="Memnuniyet" metric={trend.satisfaction} />
        </View>
      </Card> : null}
      {error ? <InfoBox action={<Button onPress={() => void load()} variant="ghost">Tekrar dene</Button>} description={error} title="Günlük yüklenemedi" tone="danger" /> : null}
      {loading && !items.length ? <Skeleton height={140} /> : null}
      {mode === 'list' && !loading && items.length === 0 ? <EmptyState action={<Button onPress={() => openDate(toLocalCalendarKey(new Date()))}>İlk kaydı yaz</Button>} description="Bu tarih aralığında günlük kaydı yok." title="Günlük boş" /> : null}
      {mode === 'list' ? <View style={styles.list}>{items.map((item) => <Pressable accessibilityHint="Günlük kaydını düzenler" accessibilityLabel={`${item.date}, ruh hali ${item.mood}/5`} accessibilityRole="button" key={item.id} onPress={() => openDate(item.date)}>
        <Card style={styles.card}><Text style={[styles.sectionTitle, { color: colors.text }]}>{item.date}</Text><Text style={[styles.description, { color: colors.textMuted }]}>{item.moodLabel} · Ruh {item.mood}/5 · Enerji {item.energy}/5 · Memnuniyet {item.satisfaction}/5</Text></Card>
      </Pressable>)}</View> : null}
      <InfoBox description="Kişisel not içeriği bildirim önizlemesine, liste etiketine veya telemetriye eklenmez." title="Gizlilik" />
    </View>
  </Screen>;
}

function TrendMetric({ label, metric }: { label: string; metric: JournalTrendMetric }) {
  const { colors } = useTheme();
  const direction = metric.delta === null || metric.delta === 0 ? '—' : metric.delta > 0 ? `↑ ${metric.delta}` : `↓ ${Math.abs(metric.delta)}`;
  return <View accessible accessibilityLabel={`${label} ortalaması ${metric.average ?? 'veri yok'}, değişim ${direction}`} style={[styles.trendMetric, { backgroundColor: colors.surfaceMuted }]}>
    <Text style={[styles.description, { color: colors.textMuted }]}>{label}</Text>
    <Text style={[styles.trendValue, { color: colors.text }]}>{metric.average ?? '—'}<Text style={{ color: metric.delta !== null && metric.delta < 0 ? colors.warning : colors.success }}> {direction}</Text></Text>
  </View>;
}

function Choice({ label, onPress, selected }: { label: string; onPress: () => void; selected: boolean }) {
  const { colors } = useTheme();
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress} style={[styles.choice, { backgroundColor: selected ? colors.primary : colors.surfaceMuted, borderColor: colors.border }]}><Text style={{ color: selected ? colors.primaryForeground : colors.text }}>{label}</Text></Pressable>;
}

const styles = StyleSheet.create({
  card: { gap: spacing.md }, choice: { borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center', minHeight: 48, paddingHorizontal: spacing.md }, content: { gap: spacing.md, paddingVertical: spacing.xl }, copy: { flex: 1, gap: spacing.sm }, day: { alignItems: 'center', borderRadius: radius.md, height: 48, justifyContent: 'center', width: 48 }, description: { fontSize: 14, lineHeight: 21 }, grid: { flexDirection: 'row', flexWrap: 'wrap', width: 336 }, heading: { alignItems: 'flex-end', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'space-between' }, list: { gap: spacing.sm }, month: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, sectionTitle: { fontSize: 19, fontWeight: '900' }, title: { fontSize: 30, fontWeight: '900', letterSpacing: -0.6 }, trendMetric: { borderRadius: radius.md, flex: 1, gap: spacing.xs, minWidth: 100, padding: spacing.md }, trendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, trendValue: { fontSize: 18, fontWeight: '900' },
});
