import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/providers/theme-provider';
import { radius, spacing } from '@/theme/tokens';

import { AppIcon, type AppIconName } from './app-icon';

export function ListRow({ description, icon, onPress, title, trailing }: { description?: string | undefined; icon: AppIconName; onPress?: (() => void) | undefined; title: string; trailing?: ReactNode }) {
  const { colors } = useTheme();
  const content = <><View style={[styles.icon, { backgroundColor: colors.surfaceMuted }]}><AppIcon color={colors.primary} name={icon} /></View><View style={styles.copy}><Text style={[styles.title, { color: colors.text }]}>{title}</Text>{description ? <Text numberOfLines={2} style={[styles.description, { color: colors.textMuted }]}>{description}</Text> : null}</View>{trailing ?? (onPress ? <AppIcon color={colors.textSubtle} name={{ ios: 'chevron.right', android: 'chevron_right' }} size={18} /> : null)}</>;
  if (!onPress) return <View style={styles.row}>{content}</View>;
  return <Pressable accessibilityHint="Açmak için dokun" accessibilityRole="button" onPress={onPress} style={({ pressed }) => [styles.row, pressed && { backgroundColor: colors.surfacePressed }]}>{content}</Pressable>;
}

const styles = StyleSheet.create({
  copy: { flex: 1, gap: spacing.xs },
  description: { fontSize: 13, lineHeight: 18 },
  icon: { alignItems: 'center', borderRadius: radius.md, height: 42, justifyContent: 'center', width: 42 },
  row: { alignItems: 'center', borderRadius: radius.md, flexDirection: 'row', gap: spacing.md, minHeight: 64, paddingHorizontal: spacing.sm, paddingVertical: spacing.sm },
  title: { fontSize: 16, fontWeight: '700', lineHeight: 21 },
});
