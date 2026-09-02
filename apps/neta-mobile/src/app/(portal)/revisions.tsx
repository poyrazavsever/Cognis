import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import type { PortalRevision, PortalRevisionStatus } from '@neta/api-contracts';

import { Button, EmptyState, Skeleton, Toast } from '@/components/ui';
import { listPortalRevisions } from '@/features/portal/api';
import { PortalHeading, PortalRevisionCard, portalListContentStyle } from '@/features/portal/components';
import { toClientError, type NetaClientError } from '@/lib/api/errors';
import { useSession } from '@/providers/session-provider';
import { useTheme } from '@/providers/theme-provider';
import { radius, spacing } from '@/theme/tokens';

const statuses: readonly { label: string; value?: PortalRevisionStatus }[] = [{ label: 'Tümü' }, { label: 'Bekliyor', value: 'pending' }, { label: 'İşleniyor', value: 'in_progress' }, { label: 'Tamam', value: 'completed' }, { label: 'Reddedildi', value: 'rejected' }];

export default function PortalRevisionsScreen() {
  const session = useSession(); const { colors } = useTheme(); const [items, setItems] = useState<PortalRevision[]>([]); const [status, setStatus] = useState<PortalRevisionStatus>(); const [error, setError] = useState<NetaClientError | null>(null); const [loading, setLoading] = useState(false);
  const load = useCallback(async () => { if (session.status !== 'authenticated' || session.role !== 'client') return; setLoading(true); setError(null); try { const filters = status ? { status } : {}; setItems((await listPortalRevisions(session.instance, session.user, filters)).data.items); } catch (value) { setError(toClientError(value, 'Revizyonlar alınamadı.')); } finally { setLoading(false); } }, [session, status]);
  useEffect(() => { const id = setTimeout(() => void load(), 0); return () => clearTimeout(id); }, [load]);
  const header = <><PortalHeading description="Gönderdiğin revizyon talepleri ve güncel durumları" title="Revizyonlar" /><View accessibilityLabel="Revizyon durumu" accessibilityRole="radiogroup" style={styles.filters}>{statuses.map((item) => { const selected = item.value === status; return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} key={item.label} onPress={() => setStatus(item.value)} style={[styles.filter, { backgroundColor: selected ? colors.primary : colors.surfaceMuted, borderColor: colors.border }]}><Text style={{ color: selected ? colors.primaryForeground : colors.text }}>{item.label}</Text></Pressable>; })}</View>{error && items.length ? <Toast message={error.message} tone="danger" /> : null}</>;
  return <FlatList contentContainerStyle={portalListContentStyle} data={items} keyExtractor={(item) => item.id} ListEmptyComponent={loading ? <Skeleton height={150} /> : <EmptyState action={error ? <Button onPress={() => void load()}>Tekrar dene</Button> : undefined} description={error?.message ?? 'Henüz revizyon talebin yok.'} title={error ? 'Revizyonlar yüklenemedi' : 'Revizyon bulunamadı'} />} ListHeaderComponent={header} refreshControl={<RefreshControl colors={[colors.primary]} onRefresh={() => void load()} refreshing={loading} tintColor={colors.primary} />} renderItem={({ item }) => <PortalRevisionCard revision={item} />} />;
}
const styles = StyleSheet.create({ filter: { borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center', minHeight: 48, paddingHorizontal: spacing.md }, filters: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm } });
