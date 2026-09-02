import { useCallback, useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { type Href, useRouter } from 'expo-router';

import type { PortalDashboard } from '@neta/api-contracts';

import { Button, Card, EmptyState, Screen, Skeleton, Toast } from '@/components/ui';
import { getPortalDashboard } from '@/features/portal/api';
import { PortalHeading, PortalProjectCard } from '@/features/portal/components';
import { toClientError, type NetaClientError } from '@/lib/api/errors';
import { useSession } from '@/providers/session-provider';
import { useTheme } from '@/providers/theme-provider';
import { spacing } from '@/theme/tokens';

export default function PortalDashboardScreen() {
  const session = useSession(); const { colors } = useTheme();
  const router = useRouter();
  const [dashboard, setDashboard] = useState<PortalDashboard | null>(null); const [error, setError] = useState<NetaClientError | null>(null); const [loading, setLoading] = useState(false);
  const load = useCallback(async () => { if (session.status !== 'authenticated' || session.role !== 'client') return; setLoading(true); setError(null); try { setDashboard((await getPortalDashboard(session.instance, session.user)).data); } catch (value) { setError(toClientError(value, 'Portal özeti alınamadı.')); } finally { setLoading(false); } }, [session]);
  useEffect(() => { const id = setTimeout(() => void load(), 0); return () => clearTimeout(id); }, [load]);
  const openProject = (id: string) => router.push({ pathname: '/(portal)/projects/[id]', params: { id } } as unknown as Href);
  return <Screen scroll contentStyle={styles.content}><PortalHeading description={`${session.instance?.workspaceName ?? 'Neta'} projelerinin güncel özeti`} title={`Merhaba${session.user?.name ? `, ${session.user.name}` : ''}`} />{error ? <Toast message={error.message} tone="danger" /> : null}{loading && !dashboard ? <><Skeleton height={110} /><Skeleton height={140} /></> : null}{dashboard ? <><View accessibilityLabel="Portal istatistikleri" style={styles.stats}><Stat label="Aktif proje" value={dashboard.stats.activeProjects} /><Stat label="Tamamlanan proje" value={dashboard.stats.completedProjects} /><Stat label="Tamamlanan görev" value={dashboard.stats.completedTasks} /><Stat label="Bekleyen revizyon" value={dashboard.stats.pendingRevisions} /></View><Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>Projeler</Text>{dashboard.projects.map((project) => <PortalProjectCard key={project.id} locale={dashboard.locale} onPress={() => openProject(project.id)} project={project} />)}{dashboard.projects.length === 0 ? <EmptyState description="Henüz sana atanmış bir proje yok." title="Proje bulunamadı" /> : null}{dashboard.portalFooter ? <Text style={[styles.footer, { color: colors.textMuted }]}>{dashboard.portalFooter}</Text> : null}</> : null}{error ? <Button onPress={() => void load()} variant="secondary">Tekrar dene</Button> : null}</Screen>;
}

function Stat({ label, value }: { label: string; value: number }) { const { colors } = useTheme(); return <Card accessibilityLabel={`${label}: ${value}`} style={styles.stat}><Text style={[styles.statValue, { color: colors.primary }]}>{value}</Text><Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text></Card>; }
const styles = StyleSheet.create({ content: { gap: spacing.md, paddingBottom: spacing.xl, paddingTop: spacing.md }, footer: { fontSize: 13, lineHeight: 19, textAlign: 'center' }, sectionTitle: { fontSize: 21, fontWeight: '900' }, stat: { flexBasis: '47%', flexGrow: 1, gap: spacing.xs }, statLabel: { fontSize: 13 }, stats: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, statValue: { fontSize: 26, fontWeight: '900' } });
