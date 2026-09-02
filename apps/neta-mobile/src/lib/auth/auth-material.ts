export function normalizeBearerToken(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const token = value.trim();
  return token.length >= 16 && token.length <= 4096 && !/\s/.test(token) ? token : null;
}

export function normalizeSetCookieHeader(value: string | null): string | null {
  if (!value || /[\r\n\u0000]/.test(value)) return null;
  const pairs: string[] = [];
  const cookiePattern = /(?:^|,\s*)([!#$%&'*+.^_`|~0-9A-Za-z-]+)=([^;,]*)/g;
  for (const match of value.matchAll(cookiePattern)) {
    const name = match[1];
    const cookieValue = match[2]?.trim();
    if (name && cookieValue !== undefined) pairs.push(`${name}=${cookieValue}`);
  }
  return pairs.length > 0 ? [...new Set(pairs)].join('; ') : null;
}
