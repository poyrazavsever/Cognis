import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/providers/theme-provider';
import { radius, spacing } from '@/theme/tokens';

import { AppIcon, type AppIconName } from './app-icon';

export type FeedbackTone = 'info' | 'success' | 'warning' | 'danger';

export function InfoBox({ action, description, title, tone = 'info' }: { action?: ReactNode; description: string; title?: string; tone?: FeedbackTone }) {
  const { colors } = useTheme();
  const palette = {
    danger: { icon: { ios: 'exclamationmark.triangle.fill', android: 'error' } as AppIconName, surface: colors.dangerSurface, tone: colors.danger },
    info: { icon: { ios: 'info.circle.fill', android: 'info' } as AppIconName, surface: colors.infoSurface, tone: colors.info },
    success: { icon: { ios: 'checkmark.circle.fill', android: 'check_circle' } as AppIconName, surface: colors.successSurface, tone: colors.success },
    warning: { icon: { ios: 'exclamationmark.circle.fill', android: 'warning' } as AppIconName, surface: colors.warningSurface, tone: colors.warning },
  }[tone];

  return (
    <View accessibilityLiveRegion="polite" accessibilityRole={tone === 'danger' ? 'alert' : undefined} style={[styles.container, { backgroundColor: palette.surface, borderColor: `${palette.tone}55` }]}>
      <View style={styles.icon}><AppIcon color={palette.tone} name={palette.icon} size={22} /></View>
      <View style={styles.copy}>{title ? <Text style={[styles.title, { color: colors.text }]}>{title}</Text> : null}<Text style={[styles.description, { color: colors.textMuted }]}>{description}</Text>{action}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'flex-start', borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.sm, padding: spacing.md },
  copy: { flex: 1, gap: spacing.xs },
  description: { fontSize: 14, lineHeight: 20 },
  icon: { paddingTop: 1 },
  title: { fontSize: 15, fontWeight: '800', lineHeight: 20 },
});
