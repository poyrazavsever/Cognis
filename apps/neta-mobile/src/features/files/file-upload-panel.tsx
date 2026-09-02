import { useEffect, useRef } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import type { FileAsset, FileAssetKind } from '@neta/api-contracts';

import { Button, Toast } from '@/components/ui';
import { useAppEnvironment } from '@/providers/app-environment-provider';
import { useSession } from '@/providers/session-provider';
import { useTheme } from '@/providers/theme-provider';
import { radius, spacing } from '@/theme/tokens';

import { filePolicy } from './policy';
import { pickSingleDocument } from './document-picker';
import { useFileUpload } from './use-file-upload';

export function FileUploadPanel({ kind, label, onUploaded, projectId }: { kind: FileAssetKind; label: string; onUploaded?: (asset: FileAsset) => void; projectId?: string | undefined }) {
  const session = useSession(); const { colors } = useTheme(); const { isOnline } = useAppEnvironment();
  const uploader = useFileUpload(session.instance, session.user); const { state } = uploader;
  const notifiedAssetId = useRef<string | null>(null);
  const choose = async () => {
    const policy = filePolicy(kind);
    const asset = await pickSingleDocument(policy.allowedMimeTypes);
    if (!asset) return;
    await uploader.upload({ mimeType: asset.mimeType, name: asset.name, size: asset.size, uri: asset.uri }, kind, projectId);
  };
  useEffect(() => { if (state.asset && notifiedAssetId.current !== state.asset.id) { notifiedAssetId.current = state.asset.id; onUploaded?.(state.asset); } }, [onUploaded, state.asset]);
  const relationMissing = kind === 'project_asset' && !projectId;
  return <View style={styles.container}><Text style={[styles.label, { color: colors.text }]}>{label}</Text>{relationMissing ? <Text style={{ color: colors.textMuted }}>Yüklemeden önce proje seç.</Text> : null}{state.isUploading ? <View accessible accessibilityLabel={`${label} yüzde ${Math.round(state.progress.fraction * 100)} yüklendi`} accessibilityRole="progressbar" accessibilityValue={{ max: 100, min: 0, now: Math.round(state.progress.fraction * 100) }} style={[styles.track, { backgroundColor: colors.surfaceMuted }]}><View style={[styles.fill, { backgroundColor: colors.primary, width: `${Math.round(state.progress.fraction * 100)}%` }]} /></View> : null}{state.asset ? <Toast message={`${state.asset.name} güvenli biçimde yüklendi.`} tone="success" /> : null}{state.error ? <Toast message={state.error.message} tone="danger" /> : null}<View style={styles.row}><Button disabled={!isOnline || state.isUploading || relationMissing} onPress={() => void choose()} variant="secondary">Dosya seç</Button>{state.isUploading ? <Button onPress={() => void uploader.cancel()} variant="ghost">İptal</Button> : null}{state.error ? <Button disabled={!isOnline} onPress={() => void uploader.retry()} variant="ghost">Tekrar dene</Button> : null}</View></View>;
}

const styles = StyleSheet.create({ container: { gap: spacing.sm }, fill: { borderRadius: radius.pill, height: '100%' }, label: { fontSize: 15, fontWeight: '700' }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, track: { borderRadius: radius.pill, height: 10, overflow: 'hidden', width: '100%' } });
