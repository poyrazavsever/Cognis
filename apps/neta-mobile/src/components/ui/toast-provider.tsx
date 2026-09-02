import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/providers/theme-provider';
import { radius, shadow, spacing } from '@/theme/tokens';

import { AppIcon } from './app-icon';
import type { FeedbackTone } from './info-box';

type ToastInput = { actionLabel?: string; duration?: number; message: string; onAction?: () => void; title?: string; tone?: FeedbackTone };
type ToastItem = ToastInput & { id: string };
type ToastContextValue = { dismissToast: (id: string) => void; showToast: (toast: ToastInput) => string };
const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const showToast = useCallback((toast: ToastInput) => {
    const id = `toast-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
    setItems((current) => [...current.slice(-1), { ...toast, id }]);
    return id;
  }, []);
  const dismissToast = useCallback((id: string) => setItems((current) => current.filter((item) => item.id !== id)), []);
  const value = useMemo(() => ({ dismissToast, showToast }), [dismissToast, showToast]);
  return <ToastContext.Provider value={value}>{children}<ToastViewport dismiss={dismissToast} items={items} /></ToastContext.Provider>;
}

export function useToast(): ToastContextValue {
  const value = useContext(ToastContext);
  if (!value) throw new Error('useToast must be used within ToastProvider.');
  return value;
}

function ToastViewport({ dismiss, items }: { dismiss: (id: string) => void; items: ToastItem[] }) {
  const insets = useSafeAreaInsets();
  return <View pointerEvents="box-none" style={[styles.viewport, { top: insets.top + spacing.sm }]}>{items.map((item) => <ToastOverlay dismiss={dismiss} item={item} key={item.id} />)}</View>;
}

function ToastOverlay({ dismiss, item }: { dismiss: (id: string) => void; item: ToastItem }) {
  const { colors } = useTheme();
  useEffect(() => {
    const timeout = setTimeout(() => dismiss(item.id), item.duration ?? (item.tone === 'danger' ? 6500 : 4200));
    return () => clearTimeout(timeout);
  }, [dismiss, item.duration, item.id, item.tone]);
  const tone = item.tone ?? 'info';
  const toneColor = { danger: colors.danger, info: colors.info, success: colors.success, warning: colors.warning }[tone];
  const icon = { danger: { ios: 'exclamationmark.triangle.fill', android: 'error' }, info: { ios: 'info.circle.fill', android: 'info' }, success: { ios: 'checkmark.circle.fill', android: 'check_circle' }, warning: { ios: 'exclamationmark.circle.fill', android: 'warning' } }[tone] as Parameters<typeof AppIcon>[0]['name'];
  return (
    <View accessibilityLiveRegion="polite" accessibilityRole={tone === 'danger' ? 'alert' : undefined} style={[styles.toast, { backgroundColor: colors.surfaceElevated, borderColor: colors.borderStrong }, shadow.floating]}>
      <AppIcon color={toneColor} name={icon} />
      <View style={styles.copy}>{item.title ? <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text> : null}<Text style={[styles.message, { color: colors.textMuted }]}>{item.message}</Text>{item.actionLabel ? <Pressable accessibilityRole="button" onPress={() => { item.onAction?.(); dismiss(item.id); }}><Text style={[styles.action, { color: colors.primary }]}>{item.actionLabel}</Text></Pressable> : null}</View>
      <Pressable accessibilityLabel="Bildirimi kapat" accessibilityRole="button" hitSlop={8} onPress={() => dismiss(item.id)} style={styles.close}><AppIcon color={colors.textSubtle} name={{ ios: 'xmark', android: 'close' }} size={17} /></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  action: { fontSize: 14, fontWeight: '800', paddingVertical: spacing.xs },
  close: { alignItems: 'center', height: 40, justifyContent: 'center', width: 40 },
  copy: { flex: 1, gap: spacing.xs },
  message: { fontSize: 14, lineHeight: 20 },
  title: { fontSize: 15, fontWeight: '800' },
  toast: { alignItems: 'flex-start', borderRadius: radius.lg, borderWidth: StyleSheet.hairlineWidth, flexDirection: 'row', gap: spacing.sm, padding: spacing.md, width: '100%' },
  viewport: { alignItems: 'center', gap: spacing.sm, left: spacing.md, maxWidth: 480, position: 'absolute', right: spacing.md, zIndex: 1000 },
});
