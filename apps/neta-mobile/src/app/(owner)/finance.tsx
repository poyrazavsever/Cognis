import { useCallback, useRef, useState } from 'react';
import { AccessibilityInfo, Modal, Pressable, ScrollView, StyleSheet, Text, View, findNodeHandle } from 'react-native';
import { type Href, router, useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { FinanceAnalysis, FinanceSummary, FinanceTransactionKind, FinanceTransactionListItem } from '@neta/api-contracts';

import { Badge, Button, Card, EmptyState, InfoBox, Screen, Skeleton } from '@/components/ui';
import { getFinanceSummary, listFinanceTransactions, requestFinanceAnalysis } from '@/features/finance/api';
import { toLocalCalendarKey } from '@/features/calendar/date';
import { toClientError } from '@/lib/api/errors'; import { formatMoney } from '@/lib/resource/format'; import { useSession } from '@/providers/session-provider'; import { useTheme } from '@/providers/theme-provider'; import { radius, spacing } from '@/theme/tokens';

export default function FinanceScreen() {
  const session = useSession(); const { colors, reduceMotion } = useTheme(); const insets = useSafeAreaInsets(); const locale = session.user?.preferences?.locale ?? session.instance?.defaultLocale ?? 'tr';
  const [month, setMonth] = useState(() => toLocalCalendarKey(new Date()).slice(0, 7)); const [kind, setKind] = useState<FinanceTransactionKind | undefined>();
  const [summary, setSummary] = useState<FinanceSummary | null>(null); const [items, setItems] = useState<FinanceTransactionListItem[]>([]);
  const [analysis, setAnalysis] = useState<FinanceAnalysis | null>(null); const [analysisOpen, setAnalysisOpen] = useState(false); const [analysisError, setAnalysisError] = useState<string | null>(null); const [analysisLoading, setAnalysisLoading] = useState(false);
  const [error, setError] = useState<string | null>(null); const [loading, setLoading] = useState(false); const requestRef = useRef(0); const analysisTriggerRef = useRef<View>(null); const analysisHeadingRef = useRef<Text>(null);

  const load = useCallback(async () => {
    if (session.status !== 'authenticated' || session.role !== 'freelancer') return;
    const requestId = ++requestRef.current; setLoading(true); setError(null);
    try { const [summaryResult, listResult] = await Promise.all([getFinanceSummary(session.instance, session.user, month), listFinanceTransactions(session.instance, session.user, { month, ...(kind ? { kind } : {}) })]); if (requestId === requestRef.current) { setSummary(summaryResult.data); setItems(listResult.data.items); } }
    catch (value) { if (requestId === requestRef.current) setError(toClientError(value, 'Finans verileri alınamadı.').message); }
    finally { if (requestId === requestRef.current) setLoading(false); }
  }, [kind, month, session]);
  useFocusEffect(useCallback(() => { void load(); return () => { requestRef.current += 1; }; }, [load]));

  const analyze = async () => {
    if (session.status !== 'authenticated' || session.role !== 'freelancer' || analysisLoading) return;
    setAnalysisOpen(true); setAnalysis(null); setAnalysisError(null); setAnalysisLoading(true);
    try { setAnalysis((await requestFinanceAnalysis(session.instance, session.user, month)).data); }
    catch (value) { setAnalysisError(toClientError(value, 'Finans analizi oluşturulamadı.').message); }
    finally { setAnalysisLoading(false); }
  };
  const closeAnalysis = () => { setAnalysisOpen(false); requestAnimationFrame(() => focus(analysisTriggerRef.current)); };
  const stats = summary ? [{ label: 'Gelir', value: summary.totals.income }, { label: 'Gider', value: summary.totals.expense }, { label: 'Net', value: summary.totals.net }, { label: 'Bekleyen', value: summary.totals.pending }] : [];

  return <><Screen onRefresh={() => void load()} refreshing={loading && summary !== null} scroll><View style={styles.content}>
    <View style={styles.heading}><View style={styles.copy}><Badge tone="primary">Finans</Badge><Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>Finans merkezi</Text><Text style={[styles.description, { color: colors.textMuted }]}>Gelir, gider ve ödeme durumlarını aylık izle.</Text></View><Button onPress={() => router.push('/finance-record' as Href)}>Yeni kayıt</Button></View>
    <Card style={styles.month}><Button accessibilityLabel="Önceki ay" onPress={() => setMonth(moveMonth(month, -1))} variant="ghost">Önceki</Button><Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>{formatMonth(month, locale)}</Text><Button accessibilityLabel="Sonraki ay" onPress={() => setMonth(moveMonth(month, 1))} variant="ghost">Sonraki</Button></Card>
    {loading && !summary ? <Skeleton height={120} /> : null}{error ? <InfoBox action={<Button onPress={() => void load()} variant="ghost">Tekrar dene</Button>} description={error} title="Finans yüklenemedi" tone="danger" /> : null}
    {summary ? <ScrollView accessibilityLabel="Finans özeti" contentContainerStyle={styles.stats} horizontal>{stats.map((stat) => <Card key={stat.label} style={styles.stat}><Text style={[styles.description, { color: colors.textMuted }]}>{stat.label}</Text><Text accessibilityLabel={`${stat.label} ${formatMoney(stat.value, locale)}`} numberOfLines={1} style={[styles.statValue, { color: colors.text }]}>{formatMoney(stat.value, locale)}</Text></Card>)}</ScrollView> : null}
    <View ref={analysisTriggerRef}><Button onPress={() => void analyze()} variant="secondary">AI finans analizi</Button></View>
    <View accessibilityLabel="Finans türü" accessibilityRole="radiogroup" style={styles.filters}><Choice label="Tümü" onPress={() => setKind(undefined)} selected={!kind} /><Choice label="Gelir" onPress={() => setKind('income')} selected={kind === 'income'} /><Choice label="Gider" onPress={() => setKind('expense')} selected={kind === 'expense'} /></View>
    {!loading && items.length === 0 ? <EmptyState action={<Button onPress={() => router.push('/finance-record' as Href)}>Kayıt ekle</Button>} description="Seçili ay ve filtrede kayıt yok." title="Finans kaydı yok" /> : null}
    <View style={styles.list}>{items.map((item) => <Pressable accessibilityHint="Finans kaydını modal olarak açar" accessibilityLabel={`${item.category}, ${formatMoney(item.amount, locale)}`} accessibilityRole="button" key={item.id} onPress={() => router.push(`/finance-record?transactionId=${encodeURIComponent(item.id)}` as Href)}><Card style={styles.record}><View style={styles.copy}><Text style={[styles.itemTitle, { color: colors.text }]}>{item.category}</Text><Text style={[styles.description, { color: colors.textMuted }]}>{item.date} · {item.paymentStatus}</Text></View><Text style={[styles.amount, { color: item.kind === 'income' ? colors.success : colors.danger }]}>{formatMoney(item.amount, locale)}</Text></Card></Pressable>)}</View>
    {summary?.taxDisclaimer ? <InfoBox description={summary.taxDisclaimer} title="Bilgilendirme" /> : null}
  </View></Screen>
  <Modal animationType={reduceMotion ? 'none' : 'slide'} onRequestClose={closeAnalysis} onShow={() => focus(analysisHeadingRef.current)} transparent visible={analysisOpen}><View style={styles.modal}><Pressable accessibilityLabel="Analizi kapat" accessibilityRole="button" onPress={closeAnalysis} style={[StyleSheet.absoluteFill, { backgroundColor: colors.overlay }]} /><View accessibilityViewIsModal style={[styles.sheet, { backgroundColor: colors.surfaceElevated, paddingBottom: Math.max(insets.bottom, spacing.lg) }]}><Text accessibilityRole="header" ref={analysisHeadingRef} style={[styles.sheetTitle, { color: colors.text }]}>AI finans analizi</Text>{analysisError ? <InfoBox action={<Button onPress={() => void analyze()} variant="ghost">Yeniden dene</Button>} description={analysisError} title="Analiz oluşturulamadı" tone="danger" /> : null}{analysisLoading ? <Skeleton height={140} /> : null}{analysis ? <View style={styles.copy}><Text style={[styles.description, { color: colors.text }]}>{analysis.summary}</Text>{analysis.recommendations.map((item) => <Text key={item} style={[styles.description, { color: colors.textMuted }]}>• {item}</Text>)}{analysis.disclaimer ? <InfoBox description={analysis.disclaimer} title="AI bilgilendirmesi" /> : null}</View> : null}<Button onPress={closeAnalysis} variant="secondary">Kapat</Button></View></View></Modal></>;
}

function focus(target: View | Text | null) { const node = findNodeHandle(target); if (node) AccessibilityInfo.setAccessibilityFocus(node); }
function Choice({ label, onPress, selected }: { label: string; onPress: () => void; selected: boolean }) { const { colors } = useTheme(); return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress} style={[styles.choice, { backgroundColor: selected ? colors.primary : colors.surfaceMuted, borderColor: colors.border }]}><Text style={{ color: selected ? colors.primaryForeground : colors.text }}>{label}</Text></Pressable>; }
function moveMonth(month: string, delta: number) { const date = new Date(`${month}-15T12:00:00`); date.setMonth(date.getMonth() + delta); return toLocalCalendarKey(date).slice(0, 7); }
function formatMonth(month: string, locale: string) { return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(new Date(`${month}-15T12:00:00`)); }
const styles = StyleSheet.create({ amount: { fontSize: 16, fontWeight: '900' }, choice: { borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center', minHeight: 48, paddingHorizontal: spacing.md }, content: { gap: spacing.md, paddingVertical: spacing.xl }, copy: { flex: 1, gap: spacing.xs }, description: { fontSize: 14, lineHeight: 21 }, filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, heading: { alignItems: 'flex-end', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'space-between' }, itemTitle: { fontSize: 17, fontWeight: '800' }, list: { gap: spacing.sm }, modal: { flex: 1, justifyContent: 'flex-end' }, month: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between' }, record: { alignItems: 'center', flexDirection: 'row', gap: spacing.md }, sectionTitle: { fontSize: 19, fontWeight: '900' }, sheet: { borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, gap: spacing.md, maxHeight: '80%', padding: spacing.lg }, sheetTitle: { fontSize: 25, fontWeight: '900' }, stat: { minWidth: 180 }, stats: { gap: spacing.md }, statValue: { fontSize: 21, fontWeight: '900' }, title: { fontSize: 30, fontWeight: '900', letterSpacing: -0.6 } });
