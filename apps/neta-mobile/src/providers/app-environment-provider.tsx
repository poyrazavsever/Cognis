import NetInfo from '@react-native-community/netinfo';
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';

type AppEnvironmentState = {
  appState: AppStateStatus;
  isOnline: boolean;
};

const AppEnvironmentContext = createContext<AppEnvironmentState | null>(null);

export function AppEnvironmentProvider({ children }: PropsWithChildren) {
  const [appState, setAppState] = useState<AppStateStatus>(AppState.currentState);
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    const appStateSubscription = AppState.addEventListener('change', setAppState);
    const networkSubscription = NetInfo.addEventListener((state) => {
      setIsOnline(state.isConnected !== false && state.isInternetReachable !== false);
    });

    return () => {
      appStateSubscription.remove();
      networkSubscription();
    };
  }, []);

  const value = useMemo(() => ({ appState, isOnline }), [appState, isOnline]);

  return <AppEnvironmentContext.Provider value={value}>{children}</AppEnvironmentContext.Provider>;
}

export function useAppEnvironment(): AppEnvironmentState {
  const value = useContext(AppEnvironmentContext);

  if (!value) {
    throw new Error('useAppEnvironment must be used within AppEnvironmentProvider.');
  }

  return value;
}
