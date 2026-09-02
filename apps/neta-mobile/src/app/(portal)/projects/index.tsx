import { useCallback, useEffect, useState } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { type Href, useRouter } from 'expo-router';

import type { PortalProjectSummary } from '@neta/api-contracts';

import { Button, EmptyState, Skeleton, Toast } from '@/components/ui';
import { listPortalProjects } from '@/features/portal/api';
import { PortalHeading, PortalProjectCard, portalListContentStyle } from '@/features/portal/components';
import { toClientError, type NetaClientError } from '@/lib/api/errors';
import { useSession } from '@/providers/session-provider';
import { useTheme } from '@/providers/theme-provider';

export default function PortalProjectsScreen() {
  const session = useSession(); const { colors } = useTheme(); const router = useRouter();
  const [items, setItems] = useState<PortalProjectSummary[]>([]); const [locale, setLocale] = useState('tr'); const [error, setError] = useState<NetaClientError | null>(null); const [loading, setLoading] = useState(false);
  const load = useCallback(async () => { if (session.status !== 'authenticated' || session.role !== 'client') return; setLoading(true); setError(null); try { const result = (await listPortalProjects(session.instance, session.user)).data; setItems(result.items); setLocale(result.locale); } catch (value) { setError(toClientError(value, 'Projeler alınamadı.')); } finally { setLoading(false); } }, [session]);
  useEffect(() => { const id = setTimeout(() => void load(), 0); return () => clearTimeout(id); }, [load]);
  return <FlatList contentContainerStyle={portalListContentStyle} data={items} keyExtractor={(item) => item.id} ListEmptyComponent={loading ? <Skeleton height={150} /> : <EmptyState action={error ? <Button onPress={() => void load()}>Tekrar dene</Button> : undefined} description={error ? error.message : 'Henüz sana atanmış bir proje yok.'} title={error ? 'Projeler yüklenemedi' : 'Proje bulunamadı'} />} ListHeaderComponent={<><PortalHeading description="Sana açık projeler ve ilerleme durumları" title="Projeler" />{error && items.length > 0 ? <Toast message={error.message} tone="danger" /> : null}</>} refreshControl={<RefreshControl colors={[colors.primary]} onRefresh={() => void load()} refreshing={loading} tintColor={colors.primary} />} renderItem={({ item }) => <PortalProjectCard locale={locale} onPress={() => router.push({ pathname: '/(portal)/projects/[id]', params: { id: item.id } } as unknown as Href)} project={item} />} />;
}
