import type { PropsWithChildren } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { PortalProjectSummary, PortalRevision, PortalTask } from '@neta/api-contracts';

import { Badge, Card } from '@/components/ui';
import { formatDateTime } from '@/lib/resource/format';
import { useTheme } from '@/providers/theme-provider';
import { spacing } from '@/theme/tokens';

export function PortalHeading({ description, title }: { description: string; title: string }) {
  const { colors } = useTheme();
  return <View style={styles.heading}><Badge tone="primary">Müşteri portalı</Badge><Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{title}</Text><Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text></View>;
}

export function PortalCard({ children }: PropsWithChildren) {
  return <Card style={styles.card}>{children}</Card>;
}

export function PortalProjectCard({ locale, onPress, project }: { locale: string; onPress: () => void; project: PortalProjectSummary }) {
  const { colors } = useTheme();
  return <Pressable accessibilityHint="Proje detayını açar" accessibilityLabel={`${project.title}, yüzde ${project.progress}, ${project.status}`} accessibilityRole="button" onPress={onPress}><PortalCard><View style={styles.row}><Text style={[styles.itemTitle, { color: colors.text }]}>{project.title}</Text><Badge tone={project.status === 'completed' ? 'success' : 'primary'}>%{project.progress}</Badge></View>{project.description ? <Text numberOfLines={3} style={[styles.description, { color: colors.textMuted }]}>{project.description}</Text> : null}<Meta>{project.dueDate ? `Bitiş ${project.dueDate}` : 'Bitiş tarihi yok'} · {formatDateTime(project.updatedAt, locale)}</Meta></PortalCard></Pressable>;
}

export function PortalTaskCard({ task }: { task: PortalTask }) {
  const { colors } = useTheme();
  return <PortalCard><View style={styles.row}><Text style={[styles.itemTitle, { color: colors.text }]}>{task.title}</Text><Badge tone={task.status === 'done' ? 'success' : task.status === 'cancelled' ? 'danger' : 'primary'}>{task.status}</Badge></View><Meta>{task.projectName} · {task.priority}</Meta>{task.description ? <Text style={[styles.description, { color: colors.textMuted }]}>{task.description}</Text> : null}{task.dueAt ? <Meta>Son tarih {task.dueAt}</Meta> : null}</PortalCard>;
}

export function PortalRevisionCard({ revision }: { revision: PortalRevision }) {
  const { colors } = useTheme();
  return <PortalCard><View style={styles.row}><Text style={[styles.itemTitle, { color: colors.text }]}>{revision.projectName}</Text><Badge tone={revision.status === 'completed' ? 'success' : revision.status === 'rejected' ? 'danger' : 'warning'}>{revision.status}</Badge></View><Text style={[styles.description, { color: colors.textMuted }]}>{revision.description}</Text><Meta>{revision.sourceLocale.toUpperCase()} · {revision.createdAt}</Meta></PortalCard>;
}

export function Meta({ children }: PropsWithChildren) {
  const { colors } = useTheme();
  return <Text style={[styles.meta, { color: colors.textMuted }]}>{children}</Text>;
}

export const portalListContentStyle = { alignSelf: 'center', gap: spacing.md, maxWidth: 720, paddingBottom: spacing.xl, paddingHorizontal: spacing.lg, paddingTop: spacing.md, width: '100%' } as const;

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  description: { fontSize: 15, lineHeight: 22 },
  heading: { gap: spacing.sm, marginBottom: spacing.sm },
  itemTitle: { flex: 1, fontSize: 18, fontWeight: '800' },
  meta: { fontSize: 13, lineHeight: 19 },
  row: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.sm, justifyContent: 'space-between' },
  title: { fontSize: 30, fontWeight: '900' },
});
