import { useCallback, useEffect, useRef, useState } from 'react';

import type { FileAsset, FileAssetKind } from '@neta/api-contracts';

import { toClientError, type NetaClientError } from '@/lib/api/errors';
import type { MeProfile, StoredInstance } from '@/lib/instance/types';

import { createFileUploadController, type FileUploadController, type FileUploadProgress } from './api';
import type { PickedFile } from './policy';

export type FileUploadState = {
  asset: FileAsset | null;
  error: NetaClientError | null;
  isUploading: boolean;
  progress: FileUploadProgress;
};

const EMPTY_PROGRESS = { fraction: 0, sentBytes: 0, totalBytes: 0 };

export function useFileUpload(instance: StoredInstance | null, user: MeProfile | null) {
  const controllerRef = useRef<FileUploadController | null>(null);
  const cancelledRef = useRef(false);
  const retryRef = useRef<{ file: PickedFile; kind: FileAssetKind; projectId?: string } | null>(null);
  const [state, setState] = useState<FileUploadState>({ asset: null, error: null, isUploading: false, progress: EMPTY_PROGRESS });

  const upload = useCallback(async (file: PickedFile, kind: FileAssetKind, projectId?: string) => {
    if (!instance || !user) return;
    cancelledRef.current = false;
    retryRef.current = { file, kind, ...(projectId ? { projectId } : {}) };
    setState((current) => ({ ...current, error: null, isUploading: true, progress: EMPTY_PROGRESS }));
    try {
      const controller = await createFileUploadController(instance, user, file, kind, projectId, (progress) => setState((current) => ({ ...current, progress })));
      controllerRef.current = controller;
      const asset = await controller.start();
      setState({ asset, error: null, isUploading: false, progress: { fraction: 1, sentBytes: file.size ?? 0, totalBytes: file.size ?? 0 } });
    } catch (value) {
      if (!cancelledRef.current) setState((current) => ({ ...current, error: toClientError(value, 'Dosya yüklenemedi.'), isUploading: false }));
    } finally { controllerRef.current = null; }
  }, [instance, user]);

  const cancel = useCallback(async () => { cancelledRef.current = true; await controllerRef.current?.cancel(); setState((current) => ({ ...current, error: null, isUploading: false })); }, []);
  const retry = useCallback(async () => { const value = retryRef.current; if (value) await upload(value.file, value.kind, value.projectId); }, [upload]);
  const reset = useCallback(() => { retryRef.current = null; setState({ asset: null, error: null, isUploading: false, progress: EMPTY_PROGRESS }); }, []);
  useEffect(() => () => { cancelledRef.current = true; void controllerRef.current?.cancel(); }, []);
  return { cancel, reset, retry, state, upload };
}
