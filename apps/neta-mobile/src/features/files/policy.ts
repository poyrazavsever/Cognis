import type { FileAssetKind, FileVisibility } from '@neta/api-contracts';

const IMAGE_MIMES = ['image/jpeg', 'image/png', 'image/webp'] as const;
const PROJECT_MIMES = [...IMAGE_MIMES, 'application/pdf'] as const;

export type PickedFile = { mimeType: string | null | undefined; name: string; size: number | null | undefined; uri: string };

export type FilePolicy = {
  allowedMimeTypes: readonly string[];
  maxBytes: number;
  visibility: FileVisibility;
};

export function filePolicy(kind: FileAssetKind): FilePolicy {
  if (kind === 'branding_icon') return { allowedMimeTypes: IMAGE_MIMES, maxBytes: 1024 * 1024, visibility: 'public_branding' };
  if (kind === 'branding_logo') return { allowedMimeTypes: IMAGE_MIMES, maxBytes: 5 * 1024 * 1024, visibility: 'public_branding' };
  if (kind === 'avatar') return { allowedMimeTypes: IMAGE_MIMES, maxBytes: 5 * 1024 * 1024, visibility: 'private' };
  return { allowedMimeTypes: PROJECT_MIMES, maxBytes: 10 * 1024 * 1024, visibility: 'portal' };
}

export function validatePickedFile(file: PickedFile, kind: FileAssetKind): string | null {
  const policy = filePolicy(kind);
  const name = file.name.trim();
  if (!name || name.length > 160 || /[\u0000-\u001F]/.test(name) || name.includes('/') || name.includes('\\')) return 'Dosya adı güvenli değil.';
  if (!file.mimeType || !policy.allowedMimeTypes.includes(file.mimeType)) return `Desteklenmeyen dosya türü: ${file.mimeType ?? 'bilinmiyor'}.`;
  if (typeof file.size !== 'number' || !Number.isSafeInteger(file.size) || file.size <= 0) return 'Dosya boyutu okunamadı.';
  if (file.size > policy.maxBytes) return `Dosya en fazla ${Math.round(policy.maxBytes / 1024 / 1024)} MB olabilir.`;
  if (!extensionMatchesMime(name, file.mimeType)) return 'Dosya uzantısı ile MIME türü eşleşmiyor.';
  return null;
}

export function expectedVisibility(kind: FileAssetKind): FileVisibility {
  return filePolicy(kind).visibility;
}

function extensionMatchesMime(name: string, mime: string): boolean {
  const extension = name.toLowerCase().split('.').pop();
  const allowed: Record<string, readonly string[]> = {
    'application/pdf': ['pdf'],
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp'],
  };
  return Boolean(extension && allowed[mime]?.includes(extension));
}
