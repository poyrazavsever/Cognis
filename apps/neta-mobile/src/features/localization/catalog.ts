export const bootstrapTr = {
  'mobile-settings.title': 'Ayarlar',
  'mobile-settings.profile': 'Profil',
  'mobile-settings.security': 'Güvenlik',
  'mobile-settings.workspace': 'Çalışma alanı',
  'mobile-settings.appearance': 'Görünüm',
  'mobile-settings.ai': 'Yapay zekâ',
  'mobile-settings.language': 'Kişisel dil',
  'mobile-locales.title': 'Dil yönetimi',
  'mobile-common.save': 'Kaydet',
  'mobile-common.retry': 'Tekrar dene',
  'mobile-common.cancel': 'Vazgeç',
  'mobile-errors.offline': 'Bu işlem için internet bağlantısı gerekir.',
  'mobile-accessibility.selected': 'Seçili',
} as const;

export const bootstrapEn: Record<keyof typeof bootstrapTr, string> = {
  'mobile-settings.title': 'Settings',
  'mobile-settings.profile': 'Profile',
  'mobile-settings.security': 'Security',
  'mobile-settings.workspace': 'Workspace',
  'mobile-settings.appearance': 'Appearance',
  'mobile-settings.ai': 'Artificial intelligence',
  'mobile-settings.language': 'Personal language',
  'mobile-locales.title': 'Language management',
  'mobile-common.save': 'Save',
  'mobile-common.retry': 'Retry',
  'mobile-common.cancel': 'Cancel',
  'mobile-errors.offline': 'An internet connection is required for this action.',
  'mobile-accessibility.selected': 'Selected',
};

export type BootstrapKey = keyof typeof bootstrapTr;

export function resolveMessage(key: BootstrapKey, locale: string, remote: Record<string, string> | null): string {
  return remote?.[key] ?? (locale.toLowerCase().startsWith('en') ? bootstrapEn[key] : bootstrapTr[key]);
}

export function catalogKeysMatch(): boolean {
  const tr = Object.keys(bootstrapTr).sort(); const en = Object.keys(bootstrapEn).sort();
  return tr.length === en.length && tr.every((key, index) => key === en[index]);
}

export function isRtlLocale(locale: string): boolean { return /^(ar|fa|he|ur)(-|$)/i.test(locale); }
