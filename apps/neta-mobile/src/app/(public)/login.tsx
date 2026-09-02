import * as Linking from 'expo-linking';
import { Image, StyleSheet, Text, TextInput, View } from 'react-native';
import { useMemo, useRef, useState } from 'react';

import { Badge, Button, Card, ColorModeControl, Screen, TextField, Toast } from '@/components/ui';
import { createPasswordResetFallback } from '@/features/linking/deep-link';
import { useSession } from '@/providers/session-provider';
import { useTheme } from '@/providers/theme-provider';
import { spacing } from '@/theme/tokens';

export default function LoginScreen() {
  const session = useSession();
  const { colors, resolvedColorMode } = useTheme();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [externalError, setExternalError] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const fallbackLogo = resolvedColorMode === 'dark' ? require('../../../assets/logo/lightLogoLong.png') : require('../../../assets/logo/blackLogoLong.png');
  const logo = useMemo(() => {
    const remote = resolvedColorMode === 'dark' ? session.instance?.darkLogoUrl : session.instance?.lightLogoUrl;
    return remote ? { uri: remote } : fallbackLogo;
  }, [fallbackLogo, resolvedColorMode, session.instance]);

  const submit = () => {
    const next: typeof errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) next.email = 'Geçerli bir email adresi gir.';
    if (!password) next.password = 'Şifre zorunludur.';
    if (Object.keys(next).length) {
      setErrors(next);
      requestAnimationFrame(() => (next.email ? emailRef : passwordRef).current?.focus());
      return;
    }
    setErrors({});
    void session.login(email, password);
  };

  const resetPassword = async () => {
    const url = session.instance ? createPasswordResetFallback(session.instance.origin) : null;
    if (!url) { setExternalError('Şifre sıfırlama adresi hazır değil.'); return; }
    try { setExternalError(null); await Linking.openURL(url); } catch { setExternalError('Şifre sıfırlama sayfası açılamadı.'); }
  };

  return (
    <Screen centered scroll>
      <View style={styles.content}>
        <Image accessibilityIgnoresInvertColors accessibilityLabel="Neta" resizeMode="contain" source={logo} style={styles.logo} />
        <View style={styles.heading}>
          <Text accessibilityRole="header" style={[styles.title, { color: colors.text }]}>{session.instance?.workspaceName ?? 'Neta’ya giriş yap'}</Text>
          <Text style={[styles.description, { color: colors.textMuted }]}>Email ve şifrenle çalışma alanına devam et.</Text>
        </View>
        <Card style={styles.form}>
          <View style={styles.row}><Badge tone={session.instance ? 'success' : 'danger'}>{session.instance ? 'Sunucu hazır' : 'Sunucuya ulaşılamadı'}</Badge><ColorModeControl /></View>
          {!session.instance ? <Button loading={session.isBusy} onPress={() => void session.retryBootstrap()} variant="secondary">Bağlantıyı tekrar dene</Button> : null}
          <TextField autoCapitalize="none" autoComplete="email" autoCorrect={false} editable={!session.isBusy && Boolean(session.instance)} error={errors.email} keyboardType="email-address" label="Email" onChangeText={(value) => { setEmail(value); setErrors((current) => current.password ? { password: current.password } : {}); }} onSubmitEditing={() => passwordRef.current?.focus()} ref={emailRef} returnKeyType="next" textContentType="username" value={email} />
          <TextField autoComplete="current-password" editable={!session.isBusy && Boolean(session.instance)} error={errors.password} label="Şifre" onChangeText={(value) => { setPassword(value); setErrors((current) => current.email ? { email: current.email } : {}); }} onSubmitEditing={submit} ref={passwordRef} returnKeyType="go" secureTextEntry textContentType="password" value={password} />
          <Button disabled={!session.instance} loading={session.isBusy} onPress={submit}>Giriş yap</Button>
          <Button disabled={session.isBusy} onPress={() => void resetPassword()} variant="ghost">Şifremi unuttum</Button>
        </Card>
        {session.error ? <Toast message={session.error.message} tone="danger" /> : null}
        {externalError ? <Toast message={externalError} tone="danger" /> : null}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { flex: 1, gap: spacing.lg, justifyContent: 'center', paddingVertical: spacing.xl },
  description: { fontSize: 17, lineHeight: 25 },
  form: { gap: spacing.md },
  heading: { gap: spacing.sm },
  logo: { height: 64, width: 180 },
  row: { alignItems: 'center', flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'space-between' },
  title: { fontSize: 34, fontWeight: '900', letterSpacing: -0.8 },
});
