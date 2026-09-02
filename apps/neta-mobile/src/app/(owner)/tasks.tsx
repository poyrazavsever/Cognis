import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { type Href, router, useFocusEffect } from 'expo-router';

import type { PaginatedResponse, TaskListItem, TaskStatus } from '@neta/api-contracts';

import { Badge, Button, Card, EmptyState, Screen, Skeleton, TextField, Toast } from '@/components/ui';
import {
  completeTask,
  listTasks,
  updateTaskStatus,
  type TaskListFilters,
} from '@/features/tasks/api';
import { toClientError, type NetaClientError } from '@/lib/api/errors';
import { formatDateTime } from '@/lib/resource/format';
import { useSession } from '@/providers/session-provider';
import { useTheme } from '@/providers/theme-provider';
import { spacing } from '@/theme/tokens';

type ViewMode = 'list' | 'kanban';

const statuses: readonly { label: string; value: TaskStatus | undefined }[] = [
  { label: 'Tümü', value: undefined },
  { label: 'Yapılacak', value: 'todo' },
  { label: 'Devam', value: 'in_progress' },
  { label: 'Tamam', value: 'done' },
  { label: 'İptal', value: 'cancelled' },
];

const nextStatus: Record<TaskStatus, TaskStatus> = {
  cancelled: 'todo',
  done: 'todo',
  in_progress: 'done',
  todo: 'in_progress',
};

export default function TasksScreen() {
  const { colors } = useTheme();
  const session = useSession();
  const locale = session.user?.preferences?.locale ?? session.instance?.defaultLocale ?? 'tr';
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [status, setStatus] = useState<TaskStatus | undefined>();
  const [page, setPage] = useState<PaginatedResponse<TaskListItem> | null>(null);
  const [error, setError] = useState<NetaClientError | null>(null);
  const [rollbackMessage, setRollbackMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingTaskId, setPendingTaskId] = useState<string | null>(null);
  const listRequestRef = useRef(0);

  const loadTasks = useCallback(async () => {
    if (session.status !== 'authenticated' || session.role !== 'freelancer') {
      return;
    }

    const requestId = ++listRequestRef.current;
    setIsLoading(true);
    setError(null);

    try {
      const filters: TaskListFilters = {};
      if (debouncedSearch) filters.search = debouncedSearch;
      if (status) filters.status = status;
      const result = await listTasks(session.instance, session.user, filters);
      if (requestId === listRequestRef.current) setPage(result.data);
    } catch (loadError) {
      if (requestId === listRequestRef.current) {
        setError(toClientError(loadError, 'Görevler alınamadı.'));
      }
    } finally {
      if (requestId === listRequestRef.current) setIsLoading(false);
    }
  }, [debouncedSearch, session, status]);

  useEffect(() => {
    const timeout = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(timeout);
  }, [search]);

  useFocusEffect(useCallback(() => {
    void loadTasks();
    return () => { listRequestRef.current += 1; };
  }, [loadTasks]));

  const changeStatus = async (task: TaskListItem) => {
    if (session.status !== 'authenticated' || session.role !== 'freelancer' || pendingTaskId) return;
    const previousPage = page;
    const statusValue = nextStatus[task.status];
    setRollbackMessage(null);
    setPendingTaskId(task.id);
    setPage((current) =>
      current
        ? {
            ...current,
            items: current.items.map((item) =>
              item.id === task.id ? { ...item, status: statusValue } : item,
            ),
          }
        : current,
    );

    try {
      const result =
        statusValue === 'done'
          ? await completeTask(session.instance, session.user, task.id)
          : await updateTaskStatus(session.instance, session.user, task.id, {
              status: statusValue,
            });
      setPage((current) =>
        current
          ? {
              ...current,
              items: current.items.map((item) =>
                item.id === task.id ? { ...item, ...result.data } : item,
              ),
            }
          : current,
      );
    } catch (statusError) {
      setPage(previousPage);
      setRollbackMessage(toClientError(statusError, 'Durum güncellenemedi.').message);
    } finally {
      setPendingTaskId(null);
    }
  };

  const items = page?.items ?? [];
  const visibleItems =
    viewMode === 'kanban'
      ? statuses.flatMap((statusOption) =>
          statusOption.value ? items.filter((item) => item.status === statusOption.value) : [],
        )
      : items;

  return (
    <Screen scroll>
      <View style={styles.content}>
        <Badge tone="primary">Görevler</Badge>
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>Görev yönetimi</Text>
        <Button accessibilityHint="Yeni görev formunu modal olarak açar" onPress={() => router.push('/(forms)/task' as Href)}>Yeni görev</Button>
        <View accessibilityLabel="Görünüm" accessibilityRole="radiogroup" style={styles.filterRow}>
          {(['list', 'kanban'] as const).map((mode) => (
            <FilterButton
              key={mode}
              label={mode === 'list' ? 'Liste' : 'Kanban'}
              onPress={() => setViewMode(mode)}
              selected={viewMode === mode}
            />
          ))}
        </View>

        <Card style={styles.card}>
          <TextField
            autoCapitalize="none"
            autoCorrect={false}
            clearButtonMode="while-editing"
            label="Ara"
            onChangeText={setSearch}
            onSubmitEditing={() => setDebouncedSearch(search.trim())}
            placeholder="Görev adı"
            returnKeyType="search"
            value={search}
          />
          <View accessibilityLabel="Görev durumu" accessibilityRole="radiogroup" style={styles.filterRow}>
            {statuses.map((item) => (
              <FilterButton
                key={item.label}
                label={item.label}
                onPress={() => setStatus(item.value)}
                selected={item.value === status}
              />
            ))}
          </View>
        </Card>

        {isLoading && !page ? <ListSkeleton /> : null}
        {error ? <Toast message={error.message} tone="danger" /> : null}
        {rollbackMessage ? <Toast message={`Değişiklik geri alındı. ${rollbackMessage}`} tone="danger" /> : null}
        {!isLoading && page && visibleItems.length === 0 ? (
          <EmptyState description="Bu filtreyle görev bulunamadı." title="Görev yok" />
        ) : null}

        {visibleItems.map((task, index) => {
          const showColumnTitle =
            viewMode === 'kanban' && (index === 0 || visibleItems[index - 1]?.status !== task.status);
          return (
            <View key={task.id} style={styles.cardGroup}>
              {showColumnTitle ? (
                <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>
                  {statusLabel(task.status)}
                </Text>
              ) : null}
              <Card style={styles.card}>
                <Pressable
                  accessibilityHint="Görev detayını açar"
                  accessibilityLabel={`${task.title}, ${statusLabel(task.status)}, ${task.priority}`}
                  accessibilityRole="button"
                  onPress={() => router.push({ pathname: '/(owner)/tasks/[id]', params: { id: task.id } } as unknown as Href)}
                >
                  <Text style={[styles.itemTitle, { color: colors.text }]}>{task.title}</Text>
                  <Text style={[styles.description, { color: colors.textMuted }]}>
                    {task.projectName ?? 'Proje yok'} · {task.clientName ?? 'Müşteri yok'}
                  </Text>
                  {task.dueAt ? (
                    <Text style={[styles.caption, { color: colors.textMuted }]}>Son tarih {formatDateTime(task.dueAt, locale)}</Text>
                  ) : null}
                </Pressable>
                <Button
                  loading={pendingTaskId === task.id}
                  onPress={() => void changeStatus(task)}
                  variant="secondary"
                >
                  {task.status === 'done' ? 'Yeniden aç' : 'Sonraki duruma taşı'}
                </Button>
              </Card>
            </View>
          );
        })}

      </View>
    </Screen>
  );
}

function FilterButton({ label, onPress, selected }: { label: string; onPress: () => void; selected: boolean }) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ checked: selected }}
      onPress={onPress}
      style={[styles.filterButton, { backgroundColor: selected ? colors.primary : colors.surfaceMuted, borderColor: colors.border }]}
    >
      <Text style={{ color: selected ? colors.primaryForeground : colors.textMuted }}>{label}</Text>
    </Pressable>
  );
}

function ListSkeleton() {
  return <Card style={styles.card}><Skeleton height={20} width="55%" /><Skeleton height={14} /><Skeleton height={14} width="70%" /></Card>;
}

function statusLabel(status: TaskStatus): string {
  return { cancelled: 'İptal', done: 'Tamamlandı', in_progress: 'Devam ediyor', todo: 'Yapılacak' }[status];
}

const styles = StyleSheet.create({
  caption: { fontSize: 13, lineHeight: 18 },
  card: { gap: spacing.md },
  cardGroup: { gap: spacing.sm },
  content: { gap: spacing.md, paddingVertical: spacing.xl },
  description: { fontSize: 15, lineHeight: 22 },
  filterButton: { minHeight: 48, minWidth: 48, borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, justifyContent: 'center', paddingHorizontal: spacing.md },
  filterRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  itemTitle: { fontSize: 18, fontWeight: '700', marginBottom: spacing.xs },
  sectionTitle: { fontSize: 20, fontWeight: '700' },
  switchRow: { minHeight: 48, alignItems: 'center', borderWidth: StyleSheet.hairlineWidth, borderRadius: 8, flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'space-between', padding: spacing.md },
  title: { fontSize: 30, fontWeight: '700' },
});
