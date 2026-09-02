import { StyleSheet, Text, View } from 'react-native';

import { Badge, Button, Card, EmptyState, InfoBox, ListRow, Screen, Skeleton, TextField, useToast } from '@/components/ui';
import { useTheme } from '@/providers/theme-provider';
import { spacing } from '@/theme/tokens';

/** Renderable development fixture; intentionally not registered as a production route. */
export function ComponentGalleryScreen() {
  const { colors } = useTheme();
  const { showToast } = useToast();
  return <Screen scroll contentStyle={styles.content}><Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>Neta UI Gallery</Text><View style={styles.row}><Badge tone="primary">Primary</Badge><Badge tone="success">Success</Badge><Badge tone="warning">Warning</Badge><Badge tone="danger">Danger</Badge></View><Card style={styles.stack}><TextField label="Normal alan" placeholder="Değer" /><TextField error="Bu alan zorunludur." label="Hatalı alan" /><View style={styles.row}><Button onPress={() => showToast({ message: 'Değişiklikler kaydedildi.', title: 'Başarılı', tone: 'success' })}>Toast göster</Button><Button onPress={() => undefined} variant="secondary">Secondary</Button></View></Card><InfoBox description="Bu bilgi kutusu light/dark semantic surface kullanır." title="Bilgi" /><InfoBox description="Yeniden denemeden önce bağlantını kontrol et." title="İşlem tamamlanamadı" tone="danger" /><Card><ListRow description="Açıklamalı, 48dp ve screen-reader uyumlu" icon={{ ios: 'gearshape.fill', android: 'settings' }} onPress={() => undefined} title="Liste satırı" /></Card><Skeleton height={96} /><EmptyState description="Filtreyi değiştir veya yeni bir kayıt oluştur." title="Sonuç bulunamadı" /></Screen>;
}

const styles = StyleSheet.create({ content: { gap: spacing.lg, paddingVertical: spacing.xl }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }, stack: { gap: spacing.md }, title: { fontSize: 32, fontWeight: '900' } });
