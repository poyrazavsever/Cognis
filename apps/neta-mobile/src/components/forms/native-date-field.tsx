import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { AppIcon, Button } from '@/components/ui';
import { useTheme } from '@/providers/theme-provider';
import { radius, spacing } from '@/theme/tokens';

export function NativeDateField({ label, onChange, value }: { label: string; onChange: (value: Date | null) => void; value: Date | null }) {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const select = (event: DateTimePickerEvent, selected?: Date) => {
    setOpen(false);
    if (event.type === 'set' && selected) onChange(selected);
  };
  return <View style={styles.container}><Text style={[styles.label, { color: colors.text }]}>{label}</Text><Pressable accessibilityLabel={`${label}, ${value ? formatDate(value) : 'seçilmedi'}`} accessibilityRole="button" onPress={() => setOpen(true)} style={({ pressed }) => [styles.field, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }, pressed && { backgroundColor: colors.surfacePressed }]}><AppIcon color={colors.primary} name={{ ios: 'calendar', android: 'calendar_month' }} /><Text style={[styles.value, { color: value ? colors.text : colors.textMuted }]}>{value ? formatDate(value) : 'Tarih seç'}</Text><AppIcon color={colors.textSubtle} name={{ ios: 'chevron.down', android: 'expand_more' }} size={18} /></Pressable>{open ? <View style={Platform.OS === 'ios' ? styles.iosPicker : styles.androidPicker}><DateTimePicker display={Platform.OS === 'ios' ? 'compact' : 'default'} mode="date" onChange={select} value={value ?? new Date()} /></View> : null}{value ? <Button onPress={() => onChange(null)} variant="ghost">Tarihi temizle</Button> : null}</View>;
}

function formatDate(value: Date): string { return new Intl.DateTimeFormat(undefined, { dateStyle: 'long' }).format(value); }
const styles = StyleSheet.create({ androidPicker: { alignItems: 'flex-start' }, container: { gap: spacing.sm }, field: { alignItems: 'center', borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.sm, minHeight: 52, paddingHorizontal: spacing.md }, iosPicker: { alignItems: 'flex-start' }, label: { fontSize: 14, fontWeight: '700' }, value: { flex: 1, fontSize: 16 } });
