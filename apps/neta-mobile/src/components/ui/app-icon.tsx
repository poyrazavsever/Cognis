import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, Text, View, type ColorValue } from 'react-native';

export type AppIconName = SymbolViewProps['name'];

export function AppIcon({ color, name, size = 22 }: { color: ColorValue; name: AppIconName; size?: number }) {
  return (
    <SymbolView
      fallback={<View style={[styles.fallback, { height: size, width: size }]}><Text style={{ color, fontSize: Math.max(12, size - 6) }}>•</Text></View>}
      name={name}
      resizeMode="scaleAspectFit"
      size={size}
      tintColor={color}
      type="hierarchical"
      weight="semibold"
    />
  );
}

const styles = StyleSheet.create({ fallback: { alignItems: 'center', justifyContent: 'center' } });
