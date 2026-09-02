import { type Href, router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { Badge, Card, InfoBox, ListRow, Screen } from '@/components/ui';
import { useLocalization } from '@/providers/localization-provider';
import { useSession } from '@/providers/session-provider';
import { useTheme } from '@/providers/theme-provider';
import { spacing } from '@/theme/tokens';

const go = (href: string) => router.push(href as Href);

export default function SettingsScreen() {
  const session = useSession(); const { rtlRestartRequired, t } = useLocalization(); const { colors } = useTheme();
  return <Screen scroll contentStyle={styles.screen}><View style={styles.content}>
    <Badge tone="primary">Owner</Badge>
    <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{t('mobile-settings.title')}</Text>
    <Text style={[styles.description, { color: colors.textMuted }]}>Hesabını, çalışma alanını ve içerik araçlarını tek merkezden yönet.</Text>
    {rtlRestartRequired ? <InfoBox description="RTL değişikliğinin tamamlanması için uygulamayı yeniden başlat." title="Yeniden başlatma gerekli" tone="warning" /> : null}
    <SettingsSection title="Hesap">
      <ListRow description={session.user?.email ?? 'Ad ve hesap bilgileri'} icon={{ ios: 'person.crop.circle', android: 'person' }} onPress={() => go('/owner-profile')} title="Profil" />
      <ListRow description="Şifre ve açık oturumlar" icon={{ ios: 'lock.shield', android: 'security' }} onPress={() => go('/owner-security')} title="Güvenlik" />
      <ListRow description="Kişisel dil, tema ve zaman dilimi" icon={{ ios: 'slider.horizontal.3', android: 'tune' }} onPress={() => go('/owner-preferences')} title="Tercihler" />
    </SettingsSection>
    <SettingsSection title="Çalışma alanı">
      <ListRow description="Workspace adı ve portal metinleri" icon={{ ios: 'building.2', android: 'business' }} onPress={() => go('/workspace-settings')} title="Genel" />
      <ListRow description="Renkler, köşe stili ve marka görselleri" icon={{ ios: 'paintpalette', android: 'palette' }} onPress={() => go('/appearance-settings')} title="Görünüm ve marka" />
      <ListRow description="Provider, model ve gizli anahtar" icon={{ ios: 'sparkles', android: 'auto_awesome' }} onPress={() => go('/ai-settings')} title="AI ayarları" />
    </SettingsSection>
    <SettingsSection title="İçerik ve medya">
      <ListRow description="Aktif diller ve çeviri katalogları" icon={{ ios: 'globe', android: 'language' }} onPress={() => go('/(owner)/locales')} title="Dil yönetimi" />
      <ListRow description="Marka ve proje dosyaları" icon={{ ios: 'folder.fill', android: 'folder' }} onPress={() => go('/(owner)/files')} title="Dosya ve medya" />
    </SettingsSection>
  </View></Screen>;
}

function SettingsSection({ children, title }: React.PropsWithChildren<{ title: string }>) { const { colors } = useTheme(); return <Card style={styles.card}><Text accessibilityRole="header" style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>{children}</Card>; }
const styles = StyleSheet.create({ card: { gap: spacing.xs }, content: { gap: spacing.lg }, description: { fontSize: 15, lineHeight: 22 }, screen: { paddingBottom: spacing.xl, paddingTop: spacing.md }, sectionTitle: { fontSize: 20, fontWeight: '900', marginBottom: spacing.xs }, title: { fontSize: 30, fontWeight: '900' } });
