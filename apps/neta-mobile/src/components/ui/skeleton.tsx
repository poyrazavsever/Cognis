import { StyleSheet, View, type ViewStyle } from 'react-native';

import { useTheme } from '@/providers/theme-provider';
import { radius } from '@/theme/tokens';

type SkeletonProps = {
  height?: number;
  radiusValue?: number;
  style?: ViewStyle;
  width?: number | `${number}%`;
};

export function Skeleton({ height = 16, radiusValue = radius.sm, style, width = '100%' }: SkeletonProps) {
  const { colors } = useTheme();

  return (
    <View
      accessibilityRole="progressbar"
      style={[
        styles.skeleton,
        {
          backgroundColor: colors.surfaceMuted,
          borderRadius: radiusValue,
          height,
          width,
        },
        style,
      ]}
    />
  );
}

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
  },
});
