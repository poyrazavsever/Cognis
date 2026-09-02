import { Platform } from 'react-native';

import { NetaClientError } from '@/lib/api/errors';
import { createApiUrl, fetchJson } from '@/lib/api/http';
import { secureStorage } from '@/lib/storage/secure-storage';

import type { MeProfile, StoredInstance } from '../instance/types';
import { normalizeBearerToken, normalizeSetCookieHeader } from './auth-material';

type SignInResponse = {
  user?: unknown;
  token?: unknown;
};

type NativeAuthClient = {
  getMe: () => Promise<MeProfile>;
  signInEmail: (email: string, password: string) => Promise<MeProfile>;
  signOut: () => Promise<void>;
};

const SESSION_NAME = 'auth.session';
const COOKIE_NAME = 'auth.cookie';
const BEARER_NAME = 'auth.bearer';

export function createNativeAuthClient(instance: StoredInstance): NativeAuthClient {
  return {
    getMe: () => getMe(instance),
    signInEmail: (email, password) => signInEmail(instance, email, password),
    signOut: () => signOut(instance),
  };
}

export async function clearNativeAuthSession(instanceId: string): Promise<void> {
  await Promise.all([
    secureStorage.remove(instanceId, SESSION_NAME),
    secureStorage.remove(instanceId, COOKIE_NAME),
    secureStorage.remove(instanceId, BEARER_NAME),
  ]);
}

export async function getNativeAuthHeaders(instanceOrId: StoredInstance | string): Promise<Record<string, string>> {
  const instanceId = typeof instanceOrId === 'string' ? instanceOrId : instanceOrId.instanceId;
  const bearer = normalizeBearerToken(await secureStorage.get(instanceId, BEARER_NAME));
  if (bearer) return { Authorization: `Bearer ${bearer}` };
  const cookie = await secureStorage.get(instanceId, COOKIE_NAME);
  return cookie ? { Cookie: cookie } : {};
}

async function signInEmail(
  instance: StoredInstance,
  email: string,
  password: string,
): Promise<MeProfile> {
  const trimmedEmail = email.trim();

  if (!trimmedEmail || !password) {
    throw new NetaClientError('AUTH_FAILED', 'Email ve şifre gerekli.');
  }

  const response = await authFetch<SignInResponse>(instance, '/api/auth/sign-in/email', {
    body: JSON.stringify({ email: trimmedEmail, password }),
    method: 'POST',
  });

  await persistAuthMaterial(instance.instanceId, response.response, response.data);

  return getMe(instance);
}

async function signOut(instance: StoredInstance): Promise<void> {
  try {
    await authFetch(instance, '/api/auth/sign-out', { method: 'POST' });
  } finally {
    await clearNativeAuthSession(instance.instanceId);
  }
}

async function getMe(instance: StoredInstance): Promise<MeProfile> {
  const { data } = await authFetch<unknown>(instance, createApiUrl(instance.apiBaseUrl, 'me'));
  const profile = normalizeMeProfile(data);

  if (profile.disabled) {
    await clearNativeAuthSession(instance.instanceId);
    throw new NetaClientError('AUTH_REQUIRED', 'Bu kullanıcı devre dışı bırakılmış.');
  }

  await secureStorage.set(instance.instanceId, SESSION_NAME, JSON.stringify(profile));

  return profile;
}

async function authFetch<T>(
  instance: StoredInstance,
  pathOrUrl: string,
  options: RequestInit = {},
) {
  const authHeaders = await getNativeAuthHeaders(instance);
  const url = pathOrUrl.startsWith('http') ? pathOrUrl : new URL(pathOrUrl, instance.origin).toString();

  return fetchJson<T>(url, {
    ...options,
    credentials: 'include',
    headers: {
      'Accept-Language': instance.defaultLocale,
      'Content-Type': 'application/json',
      'X-Neta-Client': 'mobile',
      'X-Neta-Platform': Platform.OS,
      ...authHeaders,
      ...options.headers,
    },
  });
}

async function persistAuthMaterial(
  instanceId: string,
  response: Response,
  body: SignInResponse,
): Promise<void> {
  const cookie = normalizeSetCookieHeader(response.headers.get('set-cookie'));
  const token = normalizeBearerToken(response.headers.get('set-auth-token')) ?? normalizeBearerToken(body.token);

  if (cookie) {
    await secureStorage.set(instanceId, COOKIE_NAME, cookie);
  }

  if (token) {
    await secureStorage.set(instanceId, BEARER_NAME, token);
  }
}

export function normalizeMeProfile(value: unknown): MeProfile {
  if (!isRecord(value)) {
    throw new NetaClientError('AUTH_REQUIRED', 'Oturum doğrulanamadı.');
  }

  const user = isRecord(value.user) ? value.user : value;
  const role = readRole(user.role ?? value.role);

  if (!role) {
    throw new NetaClientError('AUTH_REQUIRED', 'Kullanıcı rolü okunamadı.');
  }

  const profile: MeProfile = {
    disabled: value.disabled === true || user.disabled === true,
    email: readString(user.email),
    id: readString(user.id) ?? readString(value.id) ?? 'me',
    name: readString(user.name) ?? readString(user.displayName),
    role,
  };

  const preferences = isRecord(user.preferences) ? user.preferences : value.preferences;
  if (isRecord(preferences)) {
    profile.preferences = {
      colorMode: readColorMode(preferences.colorMode),
      locale: readString(preferences.locale),
      timezone: readString(preferences.timezone),
    };
  }

  return profile;
}

function readRole(value: unknown): MeProfile['role'] | null {
  if (value === 'freelancer' || value === 'owner' || value === 'admin') {
    return 'freelancer';
  }

  if (value === 'client' || value === 'customer') {
    return 'client';
  }

  return null;
}

function readColorMode(value: unknown): 'light' | 'dark' | 'system' | null {
  return value === 'light' || value === 'dark' || value === 'system' ? value : null;
}

function readString(value: unknown): string | null {
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
