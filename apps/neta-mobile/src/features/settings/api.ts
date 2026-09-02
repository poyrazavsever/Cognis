import Constants from 'expo-constants';
import { fetch as expoFetch } from 'expo/fetch';
import { File } from 'expo-file-system';
import { Platform } from 'react-native';

import {
  isAiSettings,
  isAppearanceAsset,
  isAppearanceSettings,
  isAuthSessionInfo,
  isDeleteResult,
  isGeneralSettings,
  type AiSettings,
  type AiSettingsMutationPayload,
  type AppearanceAsset,
  type AppearanceAssetKind,
  type AppearanceMutationPayload,
  type AppearanceSettings,
  type AuthSessionInfo,
  type DeleteResult,
  type GeneralSettings,
  type MePreferencesMutationPayload,
  type MeProfileMutationPayload,
  type PasswordMutationPayload,
} from '@neta/api-contracts';

import { NetaClientError } from '@/lib/api/errors';
import { createApiUrl, unwrapEnvelope } from '@/lib/api/http';
import { getNativeAuthHeaders, normalizeMeProfile } from '@/lib/auth/native-auth-client';
import type { MeProfile, StoredInstance } from '@/lib/instance/types';
import { requestResource, type ResourceResult } from '@/lib/resource/api-client';

export function updateMeProfile(instance: StoredInstance, user: MeProfile, payload: MeProfileMutationPayload): Promise<ResourceResult<MeProfile>> {
  return requestResource(instance, user, { body: payload, invalidates: ['me'], method: 'PATCH', parser: parseMe, path: 'me/profile', resource: 'me' });
}
export function updateMePreferences(instance: StoredInstance, user: MeProfile, payload: MePreferencesMutationPayload): Promise<ResourceResult<MeProfile>> {
  return requestResource(instance, user, { body: payload, invalidates: ['me', 'localization'], method: 'PATCH', parser: parseMe, path: 'me/preferences', resource: 'me' });
}
export function changePassword(instance: StoredInstance, user: MeProfile, payload: PasswordMutationPayload): Promise<ResourceResult<DeleteResult>> {
  return requestResource(instance, user, { body: payload, method: 'POST', parser: parseDelete, path: 'me/password', resource: 'me' });
}
export function listAuthSessions(instance: StoredInstance, user: MeProfile): Promise<ResourceResult<AuthSessionInfo[]>> {
  return requestResource(instance, user, { cachePolicy: 'short', parser: parseSessions, path: 'me/sessions', resource: 'me' });
}
export function revokeAuthSession(instance: StoredInstance, user: MeProfile, id: string): Promise<ResourceResult<DeleteResult>> {
  return requestResource(instance, user, { method: 'DELETE', parser: parseDelete, path: `me/sessions/${encodeURIComponent(id)}`, resource: 'me' });
}
export function revokeAllAuthSessions(instance: StoredInstance, user: MeProfile): Promise<ResourceResult<DeleteResult>> {
  return requestResource(instance, user, { method: 'DELETE', parser: parseDelete, path: 'me/sessions', resource: 'me' });
}
export function getGeneralSettings(instance: StoredInstance, user: MeProfile): Promise<ResourceResult<GeneralSettings>> { return requestResource(instance, user, { cachePolicy: 'short', parser: parseGeneral, path: 'settings/general', resource: 'settings' }); }
export function updateGeneralSettings(instance: StoredInstance, user: MeProfile, payload: GeneralSettings): Promise<ResourceResult<GeneralSettings>> { return requestResource(instance, user, { body: payload, invalidates: ['settings', 'dashboard'], method: 'PATCH', parser: parseGeneral, path: 'settings/general', resource: 'settings' }); }
export function getAppearanceSettings(instance: StoredInstance, user: MeProfile): Promise<ResourceResult<AppearanceSettings>> { return requestResource(instance, user, { cachePolicy: 'short', parser: parseAppearance, path: 'settings/appearance', resource: 'settings' }); }
export function updateAppearanceSettings(instance: StoredInstance, user: MeProfile, payload: AppearanceMutationPayload): Promise<ResourceResult<AppearanceSettings>> { return requestResource(instance, user, { body: payload, method: 'PATCH', parser: parseAppearance, path: 'settings/appearance', resource: 'settings' }); }
export function getAiSettings(instance: StoredInstance, user: MeProfile): Promise<ResourceResult<AiSettings>> { return requestResource(instance, user, { cachePolicy: 'short', parser: parseAi, path: 'settings/ai', resource: 'settings' }); }
export function updateAiSettings(instance: StoredInstance, user: MeProfile, payload: AiSettingsMutationPayload): Promise<ResourceResult<AiSettings>> { return requestResource(instance, user, { body: payload, method: 'PATCH', parser: parseAi, path: 'settings/ai', resource: 'settings' }); }

export async function uploadAppearanceAsset(instance: StoredInstance, user: MeProfile, kind: AppearanceAssetKind, uri: string): Promise<AppearanceAsset> {
  const file = new File(uri);
  if (!file.exists || file.size > 5 * 1024 * 1024) throw new NetaClientError('SERVER_ERROR', 'Görsel 5 MB veya daha küçük olmalıdır.');
  const form = new FormData(); form.append('kind', kind); form.append('file', file);
  const response = await expoFetch(createApiUrl(instance.apiBaseUrl, 'settings/appearance/assets'), { body: form, credentials: 'include', headers: await nativeHeaders(instance, user), method: 'POST' });
  const parsed = await readResponse(response);
  if (!isAppearanceAsset(parsed) || parsed.kind !== kind || !isInstanceBoundUrl(instance, parsed.url)) throw contractError('Appearance asset');
  return parsed;
}

export function deleteAppearanceAsset(instance: StoredInstance, user: MeProfile, kind: AppearanceAssetKind): Promise<ResourceResult<DeleteResult>> {
  return requestResource(instance, user, { method: 'DELETE', parser: parseDelete, path: `settings/appearance/assets/${kind}`, resource: 'settings' });
}

async function nativeHeaders(instance: StoredInstance, user: MeProfile): Promise<Record<string, string>> { return { Accept: 'application/json', 'Accept-Language': user.preferences?.locale ?? instance.defaultLocale, 'X-Neta-Client': 'mobile', 'X-Neta-Client-Version': Constants.expoConfig?.version ?? '0.0.0', 'X-Neta-Platform': Platform.OS, ...await getNativeAuthHeaders(instance) }; }
async function readResponse(response: Response): Promise<unknown> { const body = await response.json() as unknown; if (!response.ok) throw new NetaClientError('SERVER_ERROR', `Asset yükleme ${response.status} ile başarısız oldu.`, response.status); return unwrapEnvelope(body); }
function parseMe(value: unknown): MeProfile { return normalizeMeProfile(value); }
function parseSessions(value: unknown): AuthSessionInfo[] { if (!Array.isArray(value) || !value.every(isAuthSessionInfo)) throw contractError('Sessions'); return value; }
function parseGeneral(value: unknown): GeneralSettings { if (!isGeneralSettings(value)) throw contractError('General settings'); return value; }
function parseAppearance(value: unknown): AppearanceSettings { if (!isAppearanceSettings(value)) throw contractError('Appearance settings'); return value; }
function parseAi(value: unknown): AiSettings { if (!isAiSettings(value)) throw contractError('AI settings'); return value; }
function parseDelete(value: unknown): DeleteResult { if (!isDeleteResult(value)) throw contractError('Mutation'); return value; }
function contractError(name: string): NetaClientError { return new NetaClientError('SERVER_ERROR', `${name} API kontratı beklenen formatta değil.`); }
function isInstanceBoundUrl(instance: StoredInstance, value: string): boolean { try { return new URL(value).origin === new URL(instance.origin).origin; } catch { return false; } }
