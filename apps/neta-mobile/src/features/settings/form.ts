import type { AiSettingsMutationPayload } from '@neta/api-contracts';

export function buildAiSettingsPayload(provider: AiSettingsMutationPayload['provider'], model: string, apiKey: string, currentPassword: string): AiSettingsMutationPayload {
  const payload: AiSettingsMutationPayload = { model: model.trim(), provider };
  if (!payload.model) throw new Error('AI model is required.');
  if (apiKey.trim()) payload.apiKey = apiKey.trim();
  if (currentPassword) payload.currentPassword = currentPassword;
  return payload;
}

export function validateBrandAsset(mimeType: string | null | undefined, size: number | null | undefined): string | null {
  if (!mimeType || !['image/png', 'image/jpeg', 'image/webp'].includes(mimeType)) return 'Yalnız PNG, JPEG veya WebP yüklenebilir.';
  if (!size || size > 5 * 1024 * 1024) return 'Görsel 5 MB veya daha küçük olmalıdır.';
  return null;
}

export function validateAppearance(primaryColor: string | null, accentColor: string | null, radiusScale: 'compact' | 'default' | 'soft'): string | null {
  if (primaryColor && !/^#[0-9a-f]{6}$/i.test(primaryColor)) return 'Primary renk #RRGGBB biçiminde olmalıdır.';
  if (accentColor && !/^#[0-9a-f]{6}$/i.test(accentColor)) return 'Accent renk #RRGGBB biçiminde olmalıdır.';
  if (!['compact', 'default', 'soft'].includes(radiusScale)) return 'Geçerli bir radius stili seç.';
  return null;
}
