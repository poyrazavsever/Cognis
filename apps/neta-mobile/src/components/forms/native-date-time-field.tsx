import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, StyleSheet, Text, View } from 'react-native';

import { Button } from '@/components/ui';
import { useTheme } from '@/providers/theme-provider';
import { spacing } from '@/theme/tokens';

export function NativeDateTimeField({ label, locale, onChange, value }: { label: string; locale: string; onChange: (value: Date) => void; value: Date }) {
  const { colors } = useTheme(); const [mode, setMode] = useState<'date' | 'time' | null>(null);
  const select = (event: DateTimePickerEvent, selected?: Date) => { if (Platform.OS === 'android') setMode(null); if (event.type !== 'set' || !selected || !mode) return; const next = new Date(value); if (mode === 'date') next.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate()); else next.setHours(selected.getHours(), selected.getMinutes(), 0, 0); onChange(next); };
  return <View style={styles.field}><Text style={[styles.label, { color: colors.text }]}>{label}</Text><View style={styles.row}><Button accessibilityLabel={`${label} tarihi`} onPress={() => setMode('date')} variant="secondary">{new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(value)}</Button><Button accessibilityLabel={`${label} saati`} onPress={() => setMode('time')} variant="secondary">{new Intl.DateTimeFormat(locale, { timeStyle: 'short' }).format(value)}</Button></View>{mode ? <View><DateTimePicker display={Platform.OS === 'ios' ? 'spinner' : 'default'} mode={mode} onChange={select} value={value} />{Platform.OS === 'ios' ? <Button onPress={() => setMode(null)} variant="ghost">Bitti</Button> : null}</View> : null}</View>;
}
const styles = StyleSheet.create({ field: { gap: spacing.sm }, label: { fontSize: 14, fontWeight: '700' }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm } });
