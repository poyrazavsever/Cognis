import { Pressable, StyleSheet, type PressableProps } from 'react-native';

import { useTheme } from '@/providers/theme-provider';
import { radius } from '@/theme/tokens';

import { AppIcon, type AppIconName } from './app-icon';

type IconButtonProps = Omit<PressableProps, 'children' | 'style'> & {
  icon: AppIconName;
  label: string;
  tone?: 'default' | 'primary';
};

export function IconButton({ icon, label, tone = 'default', ...props }: IconButtonProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityLabel={label}
      accessibilityRole="button"
      hitSlop={4}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: tone === 'primary' ? colors.primary : colors.surfaceMuted },
        pressed && { backgroundColor: tone === 'primary' ? colors.primaryPressed : colors.surfacePressed },
      ]}
      {...props}
    >
      <AppIcon color={tone === 'primary' ? colors.primaryForeground : colors.text} name={icon} />
    </Pressable>
  );
}

const styles = StyleSheet.create({ button: { alignItems: 'center', borderRadius: radius.pill, height: 48, justifyContent: 'center', width: 48 } });
