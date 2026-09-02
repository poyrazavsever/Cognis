import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { type Href, router, useFocusEffect } from 'expo-router';

import type { ClientListItem, ClientStatus, PaginatedResponse } from '@neta/api-contracts';

import { AppIcon, Badge, Button, Card, EmptyState, InfoBox, Screen, Skeleton, TextField } from '@/components/ui';
import { listClients, type ClientListFilters } from '@/features/clients/api';
import { toClientError, type NetaClientError } from '@/lib/api/errors';
import { formatDateTime } from '@/lib/resource/format';
import { useSession } from '@/providers/session-provider';
import { useTheme } from '@/providers/theme-provider';
import { radius, spacing } from '@/theme/tokens';

const statuses: readonly { label: string; value: ClientStatus | undefined }[] = [
  { label: 'Tümü', value: undefined },
  { label: 'Aktif', value: 'active' },
  { label: 'Duraklatıldı', value: 'paused' },
  { label: 'Arşiv', value: 'archived' },
];

export default function ClientsScreen() {
  const { colors } = useTheme();
  const session = useSession();
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<ClientStatus | undefined>();
  const [page, setPage] = useState<PaginatedResponse<ClientListItem> | null>(null);
  const [error, setError] = useState<NetaClientError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const requestRef = useRef(0);

  const loadClients = useCallback(async () => {
    if (session.status !== 'authenticated' || session.role !== 'freelancer') return;
    const requestId = ++requestRef.current;
    setIsLoading(true);
    setError(null);
    try {
      const filters: ClientListFilters = {};
      if (debouncedSearch.trim()) filters.search = debouncedSearch.trim();
      if (status) filters.status = status;
      const result = await listClients(session.instance, session.user, filters);
      if (requestId === requestRef.current) setPage(result.data);
    } catch (loadError) {
      if (requestId === requestRef.current) setError(toClientError(loadError, 'Müşteriler alınamadı.'));
    } finally {
      if (requestId === requestRef.current) setIsLoading(false);
    }
  }, [debouncedSearch, session, status]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 300);
    return () => clearTimeout(timeout);
  }, [search]);

  useFocusEffect(useCallback(() => {
    void loadClients();
    return () => { requestRef.current += 1; };
  }, [loadClients]));

  return (
    <Screen onRefresh={() => void loadClients()} refreshing={isLoading && page !== null} scroll>
      <View style={styles.content}>
        <View style={styles.headingRow}>
          <View style={styles.headingCopy}>
            <Badge tone="primary">Müşteriler</Badge>
            <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>Müşteri ilişkileri</Text>
            <Text style={[styles.description, { color: colors.textMuted }]}>İletişim, proje geçmişi, aktiviteler ve portal erişimi tek yerde.</Text>
          </View>
          <Button accessibilityHint="Müşteri formunu modal olarak açar" onPress={() => router.push('/(forms)/client' as Href)}>Yeni müşteri</Button>
        </View>

        <Card style={styles.filters}>
          <TextField autoCapitalize="none" autoCorrect={false} clearButtonMode="while-editing" label="Müşterilerde ara" onChangeText={setSearch} placeholder="Ad veya e-posta" returnKeyType="search" value={search} />
          <View accessibilityLabel="Müşteri durumu" accessibilityRole="radiogroup" style={styles.filterRow}>
            {statuses.map((item) => <FilterChip key={item.label} label={item.label} onPress={() => setStatus(item.value)} selected={item.value === status} />)}
          </View>
        </Card>

        {error ? <InfoBox action={<Button onPress={() => void loadClients()} variant="ghost">Tekrar dene</Button>} description={error.message} title="Müşteriler yüklenemedi" tone="danger" /> : null}
        {isLoading && !page ? <><ListSkeleton /><ListSkeleton /></> : null}
        {!isLoading && page?.items.length === 0 ? <EmptyState action={<Button onPress={() => router.push('/(forms)/client' as Href)}>İlk müşteriyi ekle</Button>} description="Arama veya filtreyi değiştir ya da yeni bir müşteri oluştur." title="Müşteri bulunamadı" /> : null}

        <View style={styles.list}>
          {page?.items.map((client) => <ClientRow client={client} key={client.id} locale={session.instance?.defaultLocale ?? 'tr'} />)}
        </View>
      </View>
    </Screen>
  );
}

function ClientRow({ client, locale }: { client: ClientListItem; locale: string }) {
  const { colors } = useTheme();
  return <Pressable accessibilityHint="Müşteri detayını açar" accessibilityLabel={`${client.displayName}, ${client.projectCount} proje`} accessibilityRole="button" onPress={() => router.push({ pathname: '/(owner)/clients/[id]', params: { id: client.id } } as unknown as Href)} style={({ pressed }) => pressed && { opacity: 0.8 }}><Card style={styles.clientCard}><View style={[styles.avatar, { backgroundColor: colors.primary }]}><Text style={[styles.avatarText, { color: colors.primaryForeground }]}>{initials(client.displayName)}</Text></View><View style={styles.clientCopy}><View style={styles.row}><Text numberOfLines={1} style={[styles.itemTitle, { color: colors.text }]}>{client.displayName}</Text><Badge tone={client.status === 'archived' ? 'neutral' : client.status === 'paused' ? 'warning' : 'success'}>{statusLabel(client.status)}</Badge></View><Text numberOfLines={1} style={[styles.description, { color: colors.textMuted }]}>{client.email ?? client.phone ?? 'İletişim bilgisi yok'}</Text><Text style={[styles.caption, { color: colors.textSubtle }]}>{client.projectCount} proje · {pipelineLabel(client.pipelineStatus)} · {formatDateTime(client.updatedAt, locale)}</Text></View><AppIcon color={colors.textSubtle} name={{ ios: 'chevron.right', android: 'chevron_right' }} size={18} /></Card></Pressable>;
}

function FilterChip({ label, onPress, selected }: { label: string; onPress: () => void; selected: boolean }) {
  const { colors } = useTheme();
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: selected }} onPress={onPress} style={[styles.chip, { backgroundColor: selected ? colors.primary : colors.surfaceMuted, borderColor: colors.border }]}><Text style={{ color: selected ? colors.primaryForeground : colors.text }}>{label}</Text></Pressable>;
}

function ListSkeleton() { return <Card style={styles.clientCard}><Skeleton height={48} width={48} /><View style={styles.clientCopy}><Skeleton height={18} width="55%" /><Skeleton height={14} /><Skeleton height={12} width="72%" /></View></Card>; }
function initials(value: string) { return value.split(/\s+/).slice(0, 2).map((part) => part[0]?.toLocaleUpperCase()).join(''); }
function statusLabel(value: ClientStatus) { return { active: 'Aktif', archived: 'Arşiv', paused: 'Duraklatıldı' }[value]; }
function pipelineLabel(value: ClientListItem['pipelineStatus']) { return { contacted: 'İletişimde', lead: 'Potansiyel', lost: 'Kaybedildi', proposal_sent: 'Teklif gönderildi', won: 'Kazanıldı' }[value]; }

const styles = StyleSheet.create({
  avatar: { alignItems: 'center', borderRadius: radius.lg, height: 48, justifyContent: 'center', width: 48 },
  avatarText: { fontSize: 15, fontWeight: '900' },
  caption: { fontSize: 12, lineHeight: 17 },
  chip: { borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center', minHeight: 48, paddingHorizontal: spacing.md },
  clientCard: { alignItems: 'center', flexDirection: 'row', gap: spacing.md },
  clientCopy: { flex: 1, gap: spacing.xs },
  content: { gap: spacing.md, paddingVertical: spacing.xl },
  description: { fontSize: 14, lineHeight: 21 },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  filters: { gap: spacing.md },
  headingCopy: { flex: 1, gap: spacing.sm, minWidth: 220 },
  headingRow: { alignItems: 'flex-end', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'space-between' },
  itemTitle: { flex: 1, fontSize: 17, fontWeight: '800' },
  list: { gap: spacing.sm },
  row: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm },
  title: { fontSize: 30, fontWeight: '900', letterSpacing: -0.6 },
});
