import { type PropsWithChildren, type RefObject, useEffect } from 'react';
import { Alert, Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useNavigation, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button, IconButton } from '@/components/ui';
import { useTheme } from '@/providers/theme-provider';
import { spacing } from '@/theme/tokens';
import { finishPerformanceMeasure, recordPerformanceSample } from '@/lib/performance/metrics';

export function FormSheet({ children, dirty, onSubmit, scrollRef, submitDisabled = false, submitLabel = 'Kaydet', submitting, title }: PropsWithChildren<{ dirty: boolean; onSubmit: () => void; scrollRef: RefObject<ScrollView | null>; submitDisabled?: boolean; submitLabel?: string; submitting: boolean; title: string }>) {
  const navigation = useNavigation();
  const { colors } = useTheme();
  useEffect(() => {
    const effectStartedAt = performance.now();
    const frame = requestAnimationFrame(() => recordPerformanceSample('modal-open', performance.now() - effectStartedAt));
    const keyboardSubscription = Keyboard.addListener('keyboardDidShow', () => { finishPerformanceMeasure('keyboard-open'); });
    return () => { cancelAnimationFrame(frame); keyboardSubscription.remove(); };
  }, []);

  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !dirty });
    return navigation.addListener('beforeRemove', (event) => {
      if (!dirty) return;
      event.preventDefault();
      Alert.alert('Değişiklikler kaybolsun mu?', 'Kaydedilmemiş form verileri silinecek.', [
        { text: 'Forma dön', style: 'cancel' },
        { text: 'Değişiklikleri sil', style: 'destructive', onPress: () => navigation.dispatch(event.data.action) },
      ]);
    });
  }, [dirty, navigation]);

  return (
    <SafeAreaView edges={['left', 'right', 'bottom']} style={[styles.safe, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0} style={styles.flex}>
        <View style={[styles.header, { backgroundColor: colors.background, borderBottomColor: colors.border }]}><IconButton icon={{ ios: 'xmark', android: 'close' }} label="Formu kapat" onPress={() => router.back()} /><Text accessibilityRole="header" numberOfLines={2} style={[styles.title, { color: colors.text }]}>{title}</Text><View style={styles.headerSpacer} /></View>
        <ScrollView automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'} contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic" keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'} keyboardShouldPersistTaps="handled" ref={scrollRef}>{children}</ScrollView>
        <View style={[styles.footer, { backgroundColor: colors.surfaceElevated, borderTopColor: colors.border }]}><Button disabled={submitDisabled} loading={submitting} onPress={onSubmit}>{submitLabel}</Button></View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({ content: { gap: spacing.md, padding: spacing.lg, paddingBottom: spacing.xl }, flex: { flex: 1 }, footer: { borderTopWidth: StyleSheet.hairlineWidth, padding: spacing.md }, header: { alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.sm, minHeight: 60, paddingHorizontal: spacing.md }, headerSpacer: { height: 48, width: 48 }, safe: { flex: 1 }, title: { flex: 1, fontSize: 19, fontWeight: '900', textAlign: 'center' } });
