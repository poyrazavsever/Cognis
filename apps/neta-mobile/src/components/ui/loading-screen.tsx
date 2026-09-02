import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/providers/theme-provider';
import { spacing } from '@/theme/tokens';

type LoadingScreenProps = {
  label: string;
};

export function LoadingScreen({ label }: LoadingScreenProps) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityRole="progressbar"
      accessibilityLabel={label}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <ActivityIndicator color={colors.primary} size="small" />
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  label: {
    fontSize: 15,
  },
});
