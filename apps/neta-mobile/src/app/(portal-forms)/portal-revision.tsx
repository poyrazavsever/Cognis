import { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import { FormSheet, useKeyboardForm } from '@/components/forms';
import { InfoBox, TextField, useToast } from '@/components/ui';
import { createPortalRevision } from '@/features/portal/api';
import { buildRevisionRequest, validateRevisionRequest } from '@/features/portal/form';
import { toClientError } from '@/lib/api/errors';
import { useAppEnvironment } from '@/providers/app-environment-provider';
import { useSession } from '@/providers/session-provider';
import { useTheme } from '@/providers/theme-provider';

type Field = 'description';

export default function PortalRevisionFormRoute() {
  const { projectId, locale } = useLocalSearchParams<{ projectId?: string; locale?: string }>();
  const session = useSession();
  const { isOnline } = useAppEnvironment();
  const { colors } = useTheme();
  const { showToast } = useToast();
  const keyboard = useKeyboardForm<Field>();
  const initial = useMemo(() => ({ description: '' }), []);
  const [form, setForm] = useState(initial);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { if (saved) router.back(); }, [saved]);

  const submit = async () => {
    if (!isOnline || !projectId || !locale || session.status !== 'authenticated' || session.role !== 'client') return;
    const errors = validateRevisionRequest(form.description, locale);
    if (errors.description || errors.sourceLocale) {
      setFieldError(errors.description ?? errors.sourceLocale ?? 'Formu kontrol et.');
      keyboard.focusFirstError({ description: 'error' }, ['description']);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await createPortalRevision(session.instance, session.user, projectId, buildRevisionRequest(form.description, locale));
      setSaved(true);
      showToast({ message: 'Talebin proje ekibine iletildi.', title: 'Revizyon gönderildi', tone: 'success' });
    } catch (value) {
      setError(toClientError(value, 'Revizyon gönderilemedi.').message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormSheet
      dirty={!saved && form.description !== initial.description}
      onSubmit={() => void submit()}
      scrollRef={keyboard.scrollRef}
      submitDisabled={!isOnline || !projectId || !locale}
      submitLabel="Talebi gönder"
      submitting={loading}
      title="Revizyon talebi"
    >
      {!isOnline ? <InfoBox description="Bağlantı gelene kadar talep gönderilemez." title="Çevrimdışı" tone="warning" /> : null}
      {error ? <InfoBox description={error} title="Gönderilemedi" tone="danger" /> : null}
      <Text style={[styles.lead, { color: colors.textMuted }]}>İstediğin değişikliği net ve uygulanabilir biçimde açıkla. Talep {locale} dilinde kaydedilir.</Text>
      <TextField
        editable={isOnline}
        error={fieldError ?? undefined}
        label={`Açıklama (${locale})`}
        multiline
        onChangeText={(description) => { setForm({ description }); setFieldError(null); }}
        onFocus={() => keyboard.onFocus('description')}
        ref={keyboard.register('description')}
        textAlignVertical="top"
        value={form.description}
      />
    </FormSheet>
  );
}

const styles = StyleSheet.create({ lead: { fontSize: 15, lineHeight: 22 } });
