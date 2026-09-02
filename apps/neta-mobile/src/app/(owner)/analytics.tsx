import { StyleSheet, Text, View } from 'react-native';
import { type Href, router } from 'expo-router';

import { Button, Card, InfoBox, Screen } from '@/components/ui';
import { useTheme } from '@/providers/theme-provider';
import { spacing } from '@/theme/tokens';

export default function AnalyticsScreen() {
  const { colors } = useTheme();
  return (
    <Screen scroll contentStyle={styles.content}>
      <View style={styles.heading}><Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>Analizler</Text><Text style={[styles.description, { color: colors.textMuted }]}>Performans, gelir ve iş akışı trendlerini tek yerde incele.</Text></View>
      <InfoBox description="Analytics verileri mevcut dashboard aggregate yanıtında geliyor. Ayrı analytics API teslim edilene kadar burada sahte grafik gösterilmiyor." title="Backend teslimi bekleniyor" tone="info" />
      <Card style={styles.card}><Text style={[styles.cardTitle, { color: colors.text }]}>Güncel özet</Text><Text style={{ color: colors.textMuted }}>Doğrulanmış dashboard metriklerini Ana Sayfa üzerinden görebilirsin.</Text><Button onPress={() => router.navigate('/(owner)' as Href)} variant="secondary">Ana Sayfaya git</Button></Card>
    </Screen>
  );
}

const styles = StyleSheet.create({ card: { gap: spacing.md }, cardTitle: { fontSize: 18, fontWeight: '800' }, content: { gap: spacing.lg, paddingBottom: spacing.xl, paddingTop: spacing.lg }, description: { fontSize: 16, lineHeight: 24 }, heading: { gap: spacing.sm }, title: { fontSize: 34, fontWeight: '900' } });
