import type { PropsWithChildren } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useTheme } from '@/providers/theme-provider';
import { radius, spacing } from '@/theme/tokens';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = PropsWithChildren<
  Omit<PressableProps, 'children' | 'style'> & {
    loading?: boolean;
    style?: StyleProp<ViewStyle>;
    variant?: ButtonVariant;
  }
>;

export function Button({
  accessibilityRole = 'button',
  children,
  disabled,
  loading = false,
  style,
  variant = 'primary',
  ...props
}: ButtonProps) {
  const { colors } = useTheme();
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole={accessibilityRole}
      accessibilityState={{ busy: loading, disabled: isDisabled }}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.base,
        variant === 'primary' && { backgroundColor: colors.primary },
        variant === 'secondary' && {
          backgroundColor: colors.surfaceMuted,
          borderColor: colors.border,
          borderWidth: StyleSheet.hairlineWidth,
        },
        variant === 'ghost' && { backgroundColor: 'transparent' },
        pressed && !isDisabled && variant === 'primary' && { backgroundColor: colors.primaryPressed },
        pressed && !isDisabled && variant !== 'primary' && { backgroundColor: colors.surfacePressed },
        pressed && !isDisabled && styles.pressed,
        isDisabled && styles.disabled,
        style,
      ]}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.primaryForeground : colors.primary} />
      ) : null}
      <Text
        style={[
          styles.label,
          { color: variant === 'primary' ? colors.primaryForeground : colors.text },
        ]}
      >
        {children}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: 48,
    minWidth: 48,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
  },
  disabled: {
    opacity: 0.52,
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
  pressed: {
    opacity: 0.9,
  },
});
