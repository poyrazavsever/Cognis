import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, type PropsWithChildren, useCallback, useContext, useEffect, useMemo, useState } from 'react';

import { hasCompletedOnboarding, ONBOARDING_VERSION } from '@/lib/onboarding/version';

const STORAGE_KEY = 'neta.onboarding.version';

type OnboardingContextValue = {
  complete: () => Promise<void>;
  completed: boolean;
  loading: boolean;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: PropsWithChildren) {
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    let active = true;
    void AsyncStorage.getItem(STORAGE_KEY).then((value) => {
      if (active) setCompleted(hasCompletedOnboarding(value));
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const complete = useCallback(async () => {
    await AsyncStorage.setItem(STORAGE_KEY, String(ONBOARDING_VERSION));
    setCompleted(true);
  }, []);

  const value = useMemo(() => ({ complete, completed, loading }), [complete, completed, loading]);
  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding(): OnboardingContextValue {
  const value = useContext(OnboardingContext);
  if (!value) throw new Error('useOnboarding must be used within OnboardingProvider.');
  return value;
}
