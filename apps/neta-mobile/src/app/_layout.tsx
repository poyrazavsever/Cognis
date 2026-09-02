import { Stack, type ErrorBoundaryProps } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Platform, StyleSheet, Text, useColorScheme, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { AppEnvironmentProvider } from '@/providers/app-environment-provider';
import { redactErrorMessage } from '@/lib/api/errors';
import { SessionProvider } from '@/providers/session-provider';
import { LocalizationProvider } from '@/providers/localization-provider';
import { ThemeProvider, useTheme } from '@/providers/theme-provider';
import { OnboardingProvider } from '@/providers/onboarding-provider';
import { createThemeTokens, spacing } from '@/theme/tokens';
import { ToastProvider } from '@/components/ui';

export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const colors = createThemeTokens(useColorScheme() === 'dark' ? 'dark' : 'light').colors;

  return (
    <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
      <Text accessibilityRole="header" style={[styles.errorTitle, { color: colors.text }]}>
        Beklenmeyen bir hata oluştu
      </Text>
      <Text style={[styles.errorMessage, { color: colors.textMuted }]}>{redactErrorMessage(error.message)}</Text>
      <Text
        accessibilityRole="button"
        onPress={retry}
        style={[styles.retry, { color: colors.primary }]}
      >
        Tekrar dene
      </Text>
    </View>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AppEnvironmentProvider>
          <SessionProvider>
            <OnboardingProvider>
              <LocalizationProvider><ToastProvider><RootNavigator /></ToastProvider></LocalizationProvider>
            </OnboardingProvider>
          </SessionProvider>
        </AppEnvironmentProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

function RootNavigator() {
  const { resolvedColorMode } = useTheme();

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(forms)" options={{ animation: 'slide_from_bottom', presentation: Platform.OS === 'ios' ? 'formSheet' : 'modal', sheetAllowedDetents: [0.92], sheetGrabberVisible: false }} />
        <Stack.Screen name="(portal-forms)" options={{ animation: 'slide_from_bottom', presentation: Platform.OS === 'ios' ? 'formSheet' : 'modal', sheetAllowedDetents: [0.92], sheetGrabberVisible: false }} />
      </Stack>
      <StatusBar style={resolvedColorMode === 'dark' ? 'light' : 'dark'} />
    </>
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    padding: spacing.xl,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorMessage: {
    textAlign: 'center',
  },
  retry: {
    fontSize: 16,
    fontWeight: '600',
    padding: spacing.md,
  },
});
