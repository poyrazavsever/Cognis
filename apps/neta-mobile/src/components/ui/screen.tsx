import type { PropsWithChildren } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppShell } from '@/components/navigation/app-shell';

import { useTheme } from '@/providers/theme-provider';
import { useAppEnvironment } from '@/providers/app-environment-provider';
import { spacing } from '@/theme/tokens';

type ScreenProps = PropsWithChildren<{
  centered?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  keyboardAvoiding?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  scroll?: boolean;
}>;

export function Screen({ centered = false, children, contentStyle, keyboardAvoiding, onRefresh, refreshing = false, scroll = false }: ScreenProps) {
  const { colors } = useTheme();
  const { isOnline } = useAppEnvironment();
  const { width } = useWindowDimensions();
  const shell = useAppShell();
  const horizontalPadding = width >= 768 ? spacing.xl : spacing.lg;
  const content = (
    <View
      style={[
        styles.content,
        centered && styles.centered,
        {
          maxWidth: width >= 768 ? 720 : undefined,
          paddingHorizontal: horizontalPadding,
        },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <SafeAreaView {...(shell ? { edges: ['left', 'right', 'bottom'] as const } : {})} style={[styles.screen, { backgroundColor: colors.background }]}>
      {!isOnline ? <View accessibilityLiveRegion="assertive" accessibilityRole="alert" style={[styles.offline, { backgroundColor: colors.warning }]}><Text style={[styles.offlineText, { color: colors.background }]}>Çevrimdışı · kayıtlı veriler salt okunur gösterilebilir</Text></View> : null}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={keyboardAvoiding ?? scroll}
        style={styles.keyboardAvoidingView}
      >
        {scroll ? (
          <ScrollView
            automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
            contentContainerStyle={styles.scrollContent}
            contentInsetAdjustmentBehavior="automatic"
            keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
            keyboardShouldPersistTaps="handled"
            refreshControl={onRefresh ? <RefreshControl colors={[colors.primary]} onRefresh={onRefresh} progressBackgroundColor={colors.surfaceElevated} refreshing={refreshing} tintColor={colors.primary} /> : undefined}
          >
            {content}
          </ScrollView>
        ) : (
          content
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: {
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    flex: 1,
    alignSelf: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  offline: { alignItems: 'center', minHeight: 36, justifyContent: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
  offlineText: { fontSize: 13, fontWeight: '800', textAlign: 'center' },
  screen: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});
