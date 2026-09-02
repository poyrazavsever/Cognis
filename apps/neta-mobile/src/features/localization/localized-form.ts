export type LocalizedEntity = 'calendar' | 'client' | 'finance' | 'journal' | 'project' | 'task';

const requiredFields: Record<LocalizedEntity, readonly string[]> = {
  calendar: ['name'], client: ['name'], finance: ['category'], journal: ['moodLabel', 'note'], project: ['name'], task: ['name'],
};

export function buildLocalizedPayload<T extends Record<string, string | null>>(entity: LocalizedEntity, locale: string, fields: T): Record<string, T> {
  const normalizedLocale = locale.trim(); if (!normalizedLocale) throw new Error('Source locale is required.');
  const normalized = Object.fromEntries(Object.entries(fields).map(([key, value]) => [key, typeof value === 'string' ? value.trim() || null : null])) as T;
  for (const field of requiredFields[entity]) { if (!normalized[field]) throw new Error(`${entity}.${field} is required.`); }
  return { [normalizedLocale]: normalized };
}

export function findMissingLocalizedLocales<T extends Record<string, Record<string, string | null>>>(entity: LocalizedEntity, activeLocales: readonly string[], translations: T): string[] {
  return activeLocales.filter((locale) => requiredFields[entity].some((field) => !translations[locale]?.[field]?.trim()));
}
