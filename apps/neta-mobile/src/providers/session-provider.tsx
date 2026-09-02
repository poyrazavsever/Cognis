import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { netaOrigin } from '@/config/environment';
import { NetaClientError, toClientError } from '@/lib/api/errors';
import { createNativeAuthClient } from '@/lib/auth/native-auth-client';
import { discoverInstance, type DiscoveryStep } from '@/lib/instance/discovery';
import {
  clearInstanceSession,
  getActiveInstance,
  saveDiscoveredInstance,
  updateStoredInstance,
} from '@/lib/instance/registry';
import type { MeProfile, StoredInstance } from '@/lib/instance/types';
import { recordPerformanceSample } from '@/lib/performance/metrics';
import { clearResourceCacheForInstance, purgeLegacyResourceCache } from '@/lib/resource/resource-cache';

import { useAppEnvironment } from './app-environment-provider';
import { useTheme } from './theme-provider';

const SESSION_STALE_MS = 60_000;

type AuthenticatedSessionState = {
  discoveryStep: DiscoveryStep;
  error: NetaClientError | null;
  instance: StoredInstance;
  isBusy: boolean;
  role: MeProfile['role'];
  status: 'authenticated';
  user: MeProfile;
};

type UnauthenticatedSessionState = {
  discoveryStep: DiscoveryStep;
  error: NetaClientError | null;
  instance: StoredInstance | null;
  isBusy: boolean;
  role: null;
  status: 'loading' | 'unauthenticated';
  user: null;
};

type SessionState = UnauthenticatedSessionState | AuthenticatedSessionState;

type SessionContextValue = SessionState & {
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  retryBootstrap: () => Promise<void>;
  updateInstance: (patch: Partial<StoredInstance>) => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const { appState, isOnline } = useAppEnvironment();
  const { setBrandColors, setColorMode } = useTheme();
  const lastSessionCheckAtRef = useRef(0);
  const [session, setSession] = useState<SessionState>(createLoadingState());

  const applyInstanceBranding = useCallback((instance: StoredInstance | null) => {
    setBrandColors({ accent: instance?.accentColor ?? null, primary: instance?.primaryColor ?? null });
  }, [setBrandColors]);

  const applyUserPreferences = useCallback((user: MeProfile) => {
    if (user.preferences?.colorMode) setColorMode(user.preferences.colorMode);
  }, [setColorMode]);

  const bootstrap = useCallback(async () => {
    const startedAt = Date.now();
    setSession((current) => ({ ...toUnauthenticated(current), error: null, isBusy: true, status: 'loading' }));
    let instance = await getActiveInstance();
    if (instance?.origin !== netaOrigin) instance = null;

    try {
      await purgeLegacyResourceCache();
      if (isOnline) {
        const result = await discoverInstance(netaOrigin, {
          onStep: (discoveryStep) => setSession((current) => ({
            ...toUnauthenticated(current), discoveryStep, error: null, isBusy: true, status: 'loading',
          })),
        });
        await saveDiscoveredInstance(result.instance, result.catalog);
        instance = result.instance;
      }

      applyInstanceBranding(instance);
      if (!instance) {
        throw new NetaClientError('NETWORK_ERROR', 'Yapılandırılan Neta alanına ulaşılamadı.');
      }

      const user = await createNativeAuthClient(instance).getMe();
      applyUserPreferences(user);
      lastSessionCheckAtRef.current = Date.now();
      setSession(authenticatedState(instance, user));
      recordPerformanceSample('warm-shell', Date.now() - startedAt);
    } catch (error) {
      const clientError = toClientError(error, 'Neta hazırlanamadı.');
      if (instance && isSessionInvalidatingError(clientError)) {
        await clearResourceCacheForInstance(instance.instanceId);
        await clearInstanceSession(instance.instanceId);
      }
      setSession({
        ...createUnauthenticatedState(instance),
        error: clientError.code === 'AUTH_REQUIRED' ? null : clientError,
      });
      recordPerformanceSample('cold-shell', Date.now() - startedAt);
    }
  }, [applyInstanceBranding, applyUserPreferences, isOnline]);

  useEffect(() => {
    const timeout = setTimeout(() => { void bootstrap(); }, 0);
    return () => clearTimeout(timeout);
  }, [bootstrap]);

  useEffect(() => {
    if (appState !== 'active' || session.status !== 'authenticated') return;
    const now = Date.now();
    if (now - lastSessionCheckAtRef.current < SESSION_STALE_MS) return;
    lastSessionCheckAtRef.current = now;
    void createNativeAuthClient(session.instance).getMe().then((user) => {
      applyUserPreferences(user);
      setSession(authenticatedState(session.instance, user));
    }).catch(async (error) => {
      const clientError = toClientError(error, 'Oturum doğrulanamadı.');
      if (!isSessionInvalidatingError(clientError)) return;
      await clearResourceCacheForInstance(session.instance.instanceId);
      await clearInstanceSession(session.instance.instanceId);
      setSession({ ...createUnauthenticatedState(session.instance), error: new NetaClientError('AUTH_REQUIRED', 'Oturum süresi doldu. Lütfen tekrar giriş yap.') });
    });
  }, [appState, applyUserPreferences, session]);

  const login = useCallback(async (email: string, password: string) => {
    if (session.status === 'authenticated' || !session.instance) return;
    setSession((current) => ({ ...toUnauthenticated(current), error: null, isBusy: true }));
    try {
      const user = await createNativeAuthClient(session.instance).signInEmail(email, password);
      applyUserPreferences(user);
      lastSessionCheckAtRef.current = Date.now();
      setSession(authenticatedState(session.instance, user));
    } catch (error) {
      setSession({ ...createUnauthenticatedState(session.instance), error: toClientError(error, 'Giriş yapılamadı.') });
    }
  }, [applyUserPreferences, session]);

  const logout = useCallback(async () => {
    if (!session.instance) return;
    const instance = session.instance;
    try {
      if (session.status === 'authenticated') await createNativeAuthClient(instance).signOut();
      else await clearInstanceSession(instance.instanceId);
    } finally {
      await clearResourceCacheForInstance(instance.instanceId);
      setSession(createUnauthenticatedState(instance));
    }
  }, [session]);

  const refreshSession = useCallback(async () => {
    if (session.status !== 'authenticated') return;
    const user = await createNativeAuthClient(session.instance).getMe();
    applyUserPreferences(user);
    setSession(authenticatedState(session.instance, user));
  }, [applyUserPreferences, session]);

  const updateInstance = useCallback(async (patch: Partial<StoredInstance>) => {
    if (!session.instance) return;
    const instance = { ...session.instance, ...patch, origin: netaOrigin };
    await updateStoredInstance(instance);
    applyInstanceBranding(instance);
    setSession((current) => ({ ...current, instance } as SessionState));
  }, [applyInstanceBranding, session.instance]);

  const value = useMemo<SessionContextValue>(() => ({
    ...session,
    login,
    logout,
    refreshSession,
    retryBootstrap: bootstrap,
    updateInstance,
  }), [bootstrap, login, logout, refreshSession, session, updateInstance]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used within SessionProvider.');
  return value;
}

function createLoadingState(): UnauthenticatedSessionState {
  return { discoveryStep: 'idle', error: null, instance: null, isBusy: true, role: null, status: 'loading', user: null };
}

function createUnauthenticatedState(instance: StoredInstance | null): UnauthenticatedSessionState {
  return { discoveryStep: instance ? 'ready-for-auth' : 'idle', error: null, instance, isBusy: false, role: null, status: 'unauthenticated', user: null };
}

function authenticatedState(instance: StoredInstance, user: MeProfile): AuthenticatedSessionState {
  return { discoveryStep: 'ready-for-auth', error: null, instance, isBusy: false, role: user.role, status: 'authenticated', user };
}

function toUnauthenticated(state: SessionState): UnauthenticatedSessionState {
  if (state.status === 'authenticated') return createUnauthenticatedState(state.instance);
  return { ...state, role: null, user: null };
}

function isSessionInvalidatingError(error: NetaClientError): boolean {
  return error.code === 'AUTH_REQUIRED' || error.code === 'FORBIDDEN';
}
