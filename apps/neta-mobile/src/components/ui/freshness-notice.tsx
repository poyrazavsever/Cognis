import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/providers/theme-provider';
import { radius, spacing } from '@/theme/tokens';

export function FreshnessNotice({ cachedAt, isStale }: { cachedAt: number | null; isStale: boolean }) {
  const { colors } = useTheme();
  if (!cachedAt) return null;
  const timestamp = new Intl.DateTimeFormat(undefined, { dateStyle: 'short', timeStyle: 'short' }).format(new Date(cachedAt));
  return <View accessibilityLiveRegion="polite" style={[styles.container, { backgroundColor: `${isStale ? colors.warning : colors.textMuted}1F` }]}><Text style={{ color: isStale ? colors.warning : colors.textMuted }}>{isStale ? `Çevrimdışı kayıt · son güncelleme ${timestamp}` : `Önbellekten gösteriliyor · ${timestamp}`}</Text></View>;
}
const styles = StyleSheet.create({ container: { borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm } });
