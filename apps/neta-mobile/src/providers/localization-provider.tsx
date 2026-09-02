import { createContext, type PropsWithChildren, useContext, useEffect, useMemo, useState } from 'react';
import { I18nManager } from 'react-native';

import { isRtlLocale, resolveMessage, type BootstrapKey } from '@/features/localization/catalog';
import { getRuntimeCatalog } from '@/features/localization/api';
import { useSession } from '@/providers/session-provider';

type LocalizationContextValue = {
  locale: string;
  rtlRestartRequired: boolean;
  t: (key: BootstrapKey) => string;
};

const LocalizationContext = createContext<LocalizationContextValue | null>(null);

export function LocalizationProvider({ children }: PropsWithChildren) {
  const session = useSession();
  const locale = session.user?.preferences?.locale ?? session.instance?.defaultLocale ?? 'tr';
  const catalogKey = session.status === 'authenticated' ? `${session.instance.instanceId}:${locale}:${session.instance.catalogVersion}` : null;
  const [catalogState, setCatalogState] = useState<{ key: string; messages: Record<string, string> } | null>(null);
  const shouldBeRtl = isRtlLocale(locale);
  const rtlRestartRequired = I18nManager.isRTL !== shouldBeRtl;

  useEffect(() => {
    if (session.status !== 'authenticated' || !catalogKey) return;
    let active = true;
    void getRuntimeCatalog(session.instance, session.user, locale)
      .then((result) => { if (active && result.data.locale === locale) setCatalogState({ key: catalogKey, messages: result.data.messages }); })
      .catch(() => undefined);
    return () => { active = false; };
  }, [catalogKey, locale, session]);

  useEffect(() => {
    if (!rtlRestartRequired) return;
    I18nManager.allowRTL(shouldBeRtl); I18nManager.forceRTL(shouldBeRtl);
  }, [rtlRestartRequired, shouldBeRtl]);

  const messages = catalogState?.key === catalogKey ? catalogState.messages : null;
  const value = useMemo<LocalizationContextValue>(() => ({ locale, rtlRestartRequired, t: (key) => resolveMessage(key, locale, messages) }), [locale, messages, rtlRestartRequired]);
  return <LocalizationContext.Provider value={value}>{children}</LocalizationContext.Provider>;
}

export function useLocalization(): LocalizationContextValue {
  const value = useContext(LocalizationContext); if (!value) throw new Error('useLocalization must be used within LocalizationProvider.'); return value;
}
