import Constants from 'expo-constants';
import * as FileSystem from 'expo-file-system/legacy';
import { Platform } from 'react-native';

import {
  isDeleteResult,
  isFileAsset,
  type DeleteResult,
  type FileAsset,
  type FileAssetKind,
} from '@neta/api-contracts';

import { NetaClientError } from '@/lib/api/errors';
import { createApiUrl, unwrapEnvelope } from '@/lib/api/http';
import { getNativeAuthHeaders } from '@/lib/auth/native-auth-client';
import type { MeProfile, StoredInstance } from '@/lib/instance/types';
import { requestResource, type ResourceResult } from '@/lib/resource/api-client';

import { expectedVisibility, type PickedFile, validatePickedFile } from './policy';

export type FileUploadProgress = { fraction: number; sentBytes: number; totalBytes: number };
export type FileUploadController = { cancel: () => Promise<void>; start: () => Promise<FileAsset> };

export async function createFileUploadController(instance: StoredInstance, user: MeProfile, file: PickedFile, kind: FileAssetKind, projectId: string | undefined, onProgress: (progress: FileUploadProgress) => void): Promise<FileUploadController> {
  const validationError = validatePickedFile(file, kind);
  if (validationError) throw new NetaClientError('VALIDATION_ERROR', validationError);
  if (kind === 'project_asset' && !projectId?.trim()) throw new NetaClientError('VALIDATION_ERROR', 'Project dosyası için proje ID gerekli.');
  const visibility = expectedVisibility(kind);
  const authHeaders = await getNativeAuthHeaders(instance);
  const task = FileSystem.createUploadTask(createApiUrl(instance.apiBaseUrl, 'files'), file.uri, {
    fieldName: 'file',
    headers: {
      Accept: 'application/json',
      'Accept-Language': user.preferences?.locale ?? instance.defaultLocale,
      'Idempotency-Key': `file-${kind}-${Date.now().toString(36)}`,
      'X-Neta-Client': 'mobile',
      'X-Neta-Client-Version': Constants.expoConfig?.version ?? '0.0.0',
      'X-Neta-Platform': Platform.OS,
      ...authHeaders,
    },
    httpMethod: 'POST',
    mimeType: file.mimeType ?? undefined,
    parameters: {
      kind,
      originalName: file.name,
      ...(projectId?.trim() ? { projectId: projectId.trim() } : {}),
      visibility,
    },
    sessionType: FileSystem.FileSystemSessionType.FOREGROUND,
    uploadType: FileSystem.FileSystemUploadType.MULTIPART,
  }, ({ totalBytesExpectedToSend, totalBytesSent }) => {
    onProgress({ fraction: totalBytesExpectedToSend > 0 ? Math.min(1, totalBytesSent / totalBytesExpectedToSend) : 0, sentBytes: totalBytesSent, totalBytes: totalBytesExpectedToSend });
  });
  return {
    cancel: () => task.cancelAsync(),
    start: async () => {
      const result = await task.uploadAsync();
      if (!result) throw new NetaClientError('UNKNOWN', 'Dosya yükleme iptal edildi.');
      if (result.status < 200 || result.status >= 300) throw new NetaClientError(result.status === 413 ? 'VALIDATION_ERROR' : 'SERVER_ERROR', `Dosya yükleme ${result.status} ile başarısız oldu.`, result.status);
      let raw: unknown;
      try { raw = result.body ? JSON.parse(result.body) : null; } catch { throw new NetaClientError('SERVER_ERROR', 'Dosya API JSON olmayan yanıt döndürdü.'); }
      const asset = unwrapEnvelope<unknown>(raw);
      if (!isFileAsset(asset) || asset.kind !== kind || asset.visibility !== visibility || !isInstanceBoundUrl(instance, asset.url) || isImage(asset.mimeType) && !asset.metadataSanitized || (projectId?.trim() ?? null) !== asset.projectId) {
        throw new NetaClientError('SERVER_ERROR', 'Dosya API güvenli v1 kontratını karşılamıyor.');
      }
      return asset;
    },
  };
}

export function listProjectAssets(instance: StoredInstance, user: MeProfile, projectId: string): Promise<ResourceResult<FileAsset[]>> {
  return requestResource(instance, user, { cachePolicy: 'short', filters: { projectId }, parser: (value) => parseAssets(value, instance, projectId), path: `projects/${encodeURIComponent(projectId)}/assets`, resource: 'files' });
}

export function deleteProjectAsset(instance: StoredInstance, user: MeProfile, projectId: string, assetId: string): Promise<ResourceResult<DeleteResult>> {
  return requestResource(instance, user, { invalidates: ['files', 'projects', 'portal'], method: 'DELETE', parser: parseDelete, path: `projects/${encodeURIComponent(projectId)}/assets/${encodeURIComponent(assetId)}`, resource: 'files' });
}

function parseAssets(value: unknown, instance: StoredInstance, projectId: string): FileAsset[] {
  if (!Array.isArray(value) || !value.every((asset) => isFileAsset(asset) && asset.projectId === projectId && isInstanceBoundUrl(instance, asset.url) && asset.kind === 'project_asset' && (!isImage(asset.mimeType) || asset.metadataSanitized))) throw new NetaClientError('SERVER_ERROR', 'Project assets API kontratı beklenen güvenli formatta değil.');
  return value;
}
function parseDelete(value: unknown): DeleteResult { if (!isDeleteResult(value)) throw new NetaClientError('SERVER_ERROR', 'File delete API kontratı beklenen formatta değil.'); return value; }
function isImage(mimeType: string): boolean { return mimeType.startsWith('image/'); }
function isInstanceBoundUrl(instance: StoredInstance, value: string): boolean { try { return new URL(value).origin === new URL(instance.origin).origin; } catch { return false; } }
