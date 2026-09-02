import { useCallback, useEffect, useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';

import type { FileAsset, ProjectListItem } from '@neta/api-contracts';

import { RelationPickerField } from '@/components/forms';
import { Badge, Button, Card, EmptyState, Screen, Toast } from '@/components/ui';
import { deleteProjectAsset, listProjectAssets } from '@/features/files/api';
import { FileUploadPanel } from '@/features/files/file-upload-panel';
import { listProjects } from '@/features/projects/api';
import { toClientError, type NetaClientError } from '@/lib/api/errors';
import { useAppEnvironment } from '@/providers/app-environment-provider';
import { useSession } from '@/providers/session-provider';
import { useTheme } from '@/providers/theme-provider';
import { spacing } from '@/theme/tokens';

export default function FilesScreen() {
  const session = useSession();
  const { colors } = useTheme();
  const { isOnline } = useAppEnvironment();
  const [projectId, setProjectId] = useState('');
  const [projects, setProjects] = useState<ProjectListItem[]>([]);
  const [assets, setAssets] = useState<FileAsset[]>([]);
  const [error, setError] = useState<NetaClientError | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (session.status !== 'authenticated' || session.role !== 'freelancer') return;
    let active = true;
    void listProjects(session.instance, session.user, {}).then((result) => {
      if (active) setProjects(result.data.items);
    }).catch((value) => {
      if (active) setError(toClientError(value, 'Proje seçenekleri alınamadı.'));
    });
    return () => { active = false; };
  }, [session]);

  const loadAssets = useCallback(async () => {
    if (!projectId.trim() || session.status !== 'authenticated' || session.role !== 'freelancer') return;
    setLoading(true); setError(null);
    try { setAssets((await listProjectAssets(session.instance, session.user, projectId.trim())).data); }
    catch (value) { setError(toClientError(value, 'Project dosyaları alınamadı.')); }
    finally { setLoading(false); }
  }, [projectId, session]);

  const performRemove = async (asset: FileAsset) => {
    if (session.status !== 'authenticated' || !projectId.trim()) return;
    try { await deleteProjectAsset(session.instance, session.user, projectId.trim(), asset.id); await loadAssets(); }
    catch (value) { setError(toClientError(value, 'Dosya silinemedi.')); }
  };
  const remove = (asset: FileAsset) => Alert.alert('Dosyayı sil', `${asset.name} kalıcı olarak silinsin mi?`, [
    { text: 'Vazgeç', style: 'cancel' },
    { text: 'Sil', style: 'destructive', onPress: () => void performRemove(asset) },
  ]);

  return (
    <Screen scroll contentStyle={styles.content}>
      <Badge tone="primary">Dosya ve medya</Badge>
      <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>Güvenli upload</Text>
      <Text style={{ color: colors.textMuted }}>MIME, uzantı ve boyut cihazda doğrulanır; görsel metadata temizliği sunucu yanıtında zorunludur.</Text>
      {!isOnline ? <Toast message="Çevrimdışıyken dosya yüklenemez veya silinemez." tone="warning" /> : null}
      {error ? <Toast message={error.message} tone="danger" /> : null}
      <Card style={styles.card}>
        <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>Avatar</Text>
        <FileUploadPanel kind="avatar" label="Profil avatarı" />
      </Card>
      <Card style={styles.card}>
        <Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>Project dosyaları</Text>
        <RelationPickerField label="Proje" onChange={(value) => { setProjectId(value ?? ''); setAssets([]); }} options={projects.map((project) => ({ ...(project.clientName ? { description: project.clientName } : {}), id: project.id, label: project.title }))} value={projectId || null} />
        <FileUploadPanel kind="project_asset" label="Project asset (görsel veya PDF)" onUploaded={() => void loadAssets()} projectId={projectId.trim() || undefined} />
        <Button disabled={!projectId.trim()} loading={loading} onPress={() => void loadAssets()} variant="secondary">Dosyaları yenile</Button>
        {assets.length === 0 ? <EmptyState description="Proje seçip dosyaları yenile veya yeni dosya yükle." title="Dosya listesi boş" /> : assets.map((asset) => (
          <View key={asset.id} style={styles.assetRow}><View style={styles.flex}><Text style={{ color: colors.text }}>{asset.name}</Text><Text style={{ color: colors.textMuted }}>{asset.mimeType} · {Math.ceil(asset.sizeBytes / 1024)} KB · {asset.visibility}</Text></View><Button disabled={!isOnline} onPress={() => remove(asset)} variant="ghost">Sil</Button></View>
        ))}
      </Card>
    </Screen>
  );
}

const styles = StyleSheet.create({ assetRow: { alignItems: 'center', flexDirection: 'row', gap: spacing.sm, minHeight: 48 }, card: { gap: spacing.md }, content: { gap: spacing.lg, paddingBottom: spacing.xl, paddingTop: spacing.md }, flex: { flex: 1 }, sectionTitle: { fontSize: 20, fontWeight: '900' }, title: { fontSize: 30, fontWeight: '900' } });
