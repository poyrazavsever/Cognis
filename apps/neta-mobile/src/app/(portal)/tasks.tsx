import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import type { PortalTask, TaskStatus } from '@neta/api-contracts';

import { Button, EmptyState, Skeleton, Toast } from '@/components/ui';
import { listPortalTasks } from '@/features/portal/api';
import { PortalHeading, PortalTaskCard, portalListContentStyle } from '@/features/portal/components';
import { toClientError, type NetaClientError } from '@/lib/api/errors';
import { useSession } from '@/providers/session-provider';
import { useTheme } from '@/providers/theme-provider';
import { radius, spacing } from '@/theme/tokens';

const statuses: readonly { label: string; value?: TaskStatus }[] = [{ label: 'Tümü' }, { label: 'Bekliyor', value: 'todo' }, { label: 'Devam', value: 'in_progress' }, { label: 'Tamam', value: 'done' }, { label: 'İptal', value: 'cancelled' }];

export default function PortalTasksScreen() {
  const session = useSession(); const { colors } = useTheme(); const [items, setItems] = useState<PortalTask[]>([]); const [status, setStatus] = useState<TaskStatus>(); const [error, setError] = useState<NetaClientError | null>(null); const [loading, setLoading] = useState(false);
  const load = useCallback(async () => { if (session.status !== 'authenticated' || session.role !== 'client') return; setLoading(true); setError(null); try { const filters = status ? { status } : {}; setItems((await listPortalTasks(session.instance, session.user, filters)).data.items); } catch (value) { setError(toClientError(value, 'Görevler alınamadı.')); } finally { setLoading(false); } }, [session, status]);
  useEffect(() => { const id = setTimeout(() => void load(), 0); return () => clearTimeout(id); }, [load]);
  const header = <><PortalHeading description="Freelancer tarafından seninle paylaşılan görevler" title="Görevler" /><View accessibilityLabel="Görev durumu" accessibilityRole="radiogroup" style={styles.filters}>{statuses.map((item) => { const selected = item.value === status; return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} key={item.label} onPress={() => setStatus(item.value)} style={[styles.filter, { backgroundColor: selected ? colors.primary : colors.surfaceMuted, borderColor: colors.border }]}><Text style={{ color: selected ? colors.primaryForeground : colors.text }}>{item.label}</Text></Pressable>; })}</View>{error && items.length ? <Toast message={error.message} tone="danger" /> : null}</>;
  return <FlatList contentContainerStyle={portalListContentStyle} data={items} keyExtractor={(item) => item.id} ListEmptyComponent={loading ? <Skeleton height={150} /> : <EmptyState action={error ? <Button onPress={() => void load()}>Tekrar dene</Button> : undefined} description={error?.message ?? 'Bu filtrede paylaşılmış görev yok.'} title={error ? 'Görevler yüklenemedi' : 'Görev bulunamadı'} />} ListHeaderComponent={header} refreshControl={<RefreshControl colors={[colors.primary]} onRefresh={() => void load()} refreshing={loading} tintColor={colors.primary} />} renderItem={({ item }) => <PortalTaskCard task={item} />} />;
}
const styles = StyleSheet.create({ filter: { borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center', minHeight: 48, paddingHorizontal: spacing.md }, filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm } });
