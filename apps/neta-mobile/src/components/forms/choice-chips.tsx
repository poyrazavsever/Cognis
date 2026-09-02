import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/providers/theme-provider';
import { radius, spacing } from '@/theme/tokens';

export function ChoiceChips<T extends string | number>({ label, onSelect, options, selected }: { label: string; onSelect: (value: T) => void; options: readonly { label: string; value: T }[]; selected: T }) {
  const { colors } = useTheme();
  return <View style={styles.group}><Text style={[styles.label, { color: colors.text }]}>{label}</Text><View accessibilityLabel={label} accessibilityRole="radiogroup" style={styles.options}>{options.map((option) => { const checked = option.value === selected; return <Pressable accessibilityRole="radio" accessibilityState={{ checked }} key={option.value} onPress={() => onSelect(option.value)} style={[styles.option, { backgroundColor: checked ? colors.primary : colors.surfaceMuted, borderColor: colors.border }]}><Text style={{ color: checked ? colors.primaryForeground : colors.text }}>{option.label}</Text></Pressable>; })}</View></View>;
}

const styles = StyleSheet.create({ group: { gap: spacing.sm }, label: { fontSize: 14, fontWeight: '700' }, option: { borderRadius: radius.pill, borderWidth: StyleSheet.hairlineWidth, justifyContent: 'center', minHeight: 48, paddingHorizontal: spacing.md }, options: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm } });
