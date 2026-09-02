import type { PropsWithChildren } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/providers/theme-provider';
import { radius, spacing } from '@/theme/tokens';

type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

type BadgeProps = PropsWithChildren<{
  tone?: BadgeTone;
}>;

export function Badge({ children, tone = 'neutral' }: BadgeProps) {
  const { colors } = useTheme();
  const toneColor = {
    danger: colors.danger,
    neutral: colors.textMuted,
    primary: colors.primary,
    success: colors.success,
    warning: colors.warning,
  }[tone];

  return (
    <View style={[styles.badge, { backgroundColor: `${toneColor}1F` }]}>
      <Text style={[styles.label, { color: toneColor }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
  },
});
