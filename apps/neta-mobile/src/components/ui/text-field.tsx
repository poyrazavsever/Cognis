import { forwardRef, useId } from 'react';
import { StyleSheet, Text, TextInput, type TextInputProps, View } from 'react-native';

import { useTheme } from '@/providers/theme-provider';
import { radius, spacing } from '@/theme/tokens';
import { markPerformanceStart } from '@/lib/performance/metrics';

type TextFieldProps = TextInputProps & {
  error?: string | undefined;
  label: string;
};

export const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { error, label, onFocus, style, ...props },
  ref,
) {
  const { colors } = useTheme();
  const fieldId = useId();
  const errorId = `${fieldId}-error`;

  return (
    <View style={styles.container}>
      <Text nativeID={`${fieldId}-label`} style={[styles.label, { color: colors.text }]}>
        {label}
      </Text>
      <TextInput
        {...props}
        ref={ref}
        onFocus={(event) => { markPerformanceStart('keyboard-open'); onFocus?.(event); }}
        accessibilityLabel={props.accessibilityLabel ?? label}
        accessibilityHint={error ?? props.accessibilityHint}
        aria-describedby={error ? errorId : undefined}
        aria-invalid={Boolean(error)}
        placeholderTextColor={colors.textMuted}
        selectionColor={colors.primary}
        style={[
          styles.input,
          {
            backgroundColor: colors.surfaceElevated,
            borderColor: error ? colors.danger : colors.border,
            color: colors.text,
          },
          style,
        ]}
      />
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          nativeID={errorId}
          style={[styles.error, { color: colors.danger }]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
  },
  error: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    minHeight: 50,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
});
