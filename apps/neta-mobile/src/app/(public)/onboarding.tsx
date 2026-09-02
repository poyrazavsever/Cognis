import { router, type Href } from 'expo-router';
import { Image, StyleSheet, Text, View } from 'react-native';

import { Button, Card, Screen } from '@/components/ui';
import { useOnboarding } from '@/providers/onboarding-provider';
import { useTheme } from '@/providers/theme-provider';
import { spacing } from '@/theme/tokens';

const benefits = [
  ['Tek bir çalışma alanı', 'Bu uygulama, yayınlayan kişinin güvenilir Neta sunucusuna özel olarak yapılandırıldı.'],
  ['İşlerin her yerde', 'Müşteri, proje, görev ve finans akışlarını mobilde takip et.'],
  ['Rolüne uygun deneyim', 'Girişten sonra owner veya müşteri portalı otomatik ve güvenli biçimde açılır.'],
] as const;

export default function OnboardingScreen() {
  const { complete } = useOnboarding();
  const { colors, resolvedColorMode } = useTheme();
  const finish = async () => { await complete(); router.replace('/login' as Href); };

  return (
    <Screen scroll>
      <View style={styles.content}>
        <Image accessibilityIgnoresInvertColors accessibilityLabel="Neta" resizeMode="contain" source={resolvedColorMode === 'dark' ? require('../../../assets/logo/lightLogoLong.png') : require('../../../assets/logo/blackLogoLong.png')} style={styles.logo} />
        <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>Neta her zaman yanında.</Text>
        <Text style={[styles.lead, { color: colors.textMuted }]}>Kendi sunucunda, kendi verilerinle, dikkat dağıtmayan bir çalışma alanı.</Text>
        <View style={styles.list}>
          {benefits.map(([title, description], index) => (
            <Card key={title} style={styles.card}>
              <View accessible accessibilityLabel={`${index + 1}. ${title}. ${description}`} style={[styles.number, { backgroundColor: colors.primary }]}><Text style={[styles.numberText, { color: colors.primaryForeground }]}>{index + 1}</Text></View>
              <View style={styles.copy}><Text style={[styles.cardTitle, { color: colors.text }]}>{title}</Text><Text style={[styles.cardText, { color: colors.textMuted }]}>{description}</Text></View>
            </Card>
          ))}
        </View>
        <Button accessibilityHint="Onboarding'i tamamlar ve giriş ekranını açar" onPress={() => void finish()}>Başlayalım</Button>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'flex-start', flexDirection: 'row', gap: spacing.md },
  cardText: { fontSize: 15, lineHeight: 22 },
  cardTitle: { fontSize: 17, fontWeight: '800' },
  content: { flex: 1, gap: spacing.lg, justifyContent: 'center', paddingVertical: spacing.xl },
  copy: { flex: 1, gap: spacing.xs },
  lead: { fontSize: 18, lineHeight: 27 },
  list: { gap: spacing.sm },
  logo: { height: 52, width: 150 },
  number: { alignItems: 'center', borderRadius: 18, height: 36, justifyContent: 'center', width: 36 },
  numberText: { fontSize: 15, fontWeight: '900' },
  title: { fontSize: 36, fontWeight: '900', letterSpacing: -1.1, lineHeight: 42 },
});
