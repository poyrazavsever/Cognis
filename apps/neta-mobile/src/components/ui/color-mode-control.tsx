import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/providers/theme-provider';
import { type ColorMode, spacing } from '@/theme/tokens';

const options: readonly { label: string; value: ColorMode }[] = [
  { label: 'Sistem', value: 'system' },
  { label: 'Açık', value: 'light' },
  { label: 'Koyu', value: 'dark' },
];

export function ColorModeControl() {
  const { colorMode, colors, setColorMode } = useTheme();

  return (
    <View accessibilityRole="radiogroup" style={[styles.container, { backgroundColor: colors.surfaceMuted }]}>
      {options.map((option) => {
        const selected = colorMode === option.value;

        return (
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            key={option.value}
            onPress={() => setColorMode(option.value)}
            style={({ pressed }) => [
              styles.option,
              selected && { backgroundColor: colors.primary },
              pressed && styles.pressed,
            ]}
          >
            <Text
              style={[
                styles.label,
                { color: selected ? colors.primaryForeground : colors.textMuted },
              ]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'flex-start',
    borderRadius: 12,
    padding: spacing.xs,
  },
  option: {
    minHeight: 48,
    minWidth: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
    paddingHorizontal: spacing.md,
  },
  pressed: {
    opacity: 0.78,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
});
