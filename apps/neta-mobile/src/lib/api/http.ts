import { NetaClientError, redactErrorMessage, serverErrorMessage } from './errors.ts';

const DEFAULT_TIMEOUT_MS = 10_000;
const MAX_REDIRECTS = 3;

type FetchJsonOptions = RequestInit & {
  missingEndpointMessage?: string;
  timeoutMs?: number;
};

export type JsonResponse<T> = {
  data: T;
  response: Response;
};

export async function fetchJson<T>(
  input: string,
  options: FetchJsonOptions = {},
): Promise<JsonResponse<T>> {
  const response = await fetchWithRedirects(input, options);
  const text = await response.text();
  const parsed = tryJsonParse(text);

  if (!response.ok) {
    if (!parsed.ok && response.status === 404 && options.missingEndpointMessage) {
      throw new NetaClientError(
        'MISSING_CAPABILITY',
        options.missingEndpointMessage,
        response.status,
      );
    }

    const apiCode = parsed.ok ? readApiErrorCode(parsed.value) : null;
    if (apiCode) {
      throw new NetaClientError(apiCode, serverErrorMessage(apiCode), response.status);
    }
    throw new NetaClientError(
      statusErrorCode(response.status),
      (parsed.ok ? readSafeApiErrorMessage(parsed.value) : null) ??
        `Sunucu ${response.status} yanıtı döndürdü.`,
      response.status,
    );
  }

  if (!parsed.ok) {
    throw new NetaClientError('SERVER_ERROR', 'Sunucu JSON olmayan yanıt döndürdü.', response.status);
  }

  return { data: unwrapEnvelope<T>(parsed.value), response };
}

function statusErrorCode(status: number): 'AUTH_REQUIRED' | 'FORBIDDEN' | 'NOT_FOUND' | 'CONFLICT' | 'VALIDATION_ERROR' | 'SERVER_ERROR' {
  if (status === 401) return 'AUTH_REQUIRED';
  if (status === 403) return 'FORBIDDEN';
  if (status === 404) return 'NOT_FOUND';
  if (status === 409) return 'CONFLICT';
  if (status === 400 || status === 422) return 'VALIDATION_ERROR';
  return 'SERVER_ERROR';
}

export function createApiUrl(baseUrl: string, path: string): string {
  return new URL(path.replace(/^\//, ''), ensureTrailingSlash(baseUrl)).toString();
}

export function unwrapEnvelope<T>(value: unknown): T {
  if (isRecord(value) && value.ok === true && 'data' in value) {
    return value.data as T;
  }

  if (isRecord(value) && value.ok === false) {
    const apiCode = readApiErrorCode(value);
    if (apiCode) throw new NetaClientError(apiCode, serverErrorMessage(apiCode));
    throw new NetaClientError('SERVER_ERROR', readSafeApiErrorMessage(value) ?? 'Sunucu hata döndürdü.');
  }

  return value as T;
}

async function fetchWithRedirects(
  input: string,
  options: FetchJsonOptions,
  redirectCount = 0,
): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const { missingEndpointMessage: _missingEndpointMessage, timeoutMs: _timeoutMs, ...requestOptions } = options;

  try {
    const response = await fetch(input, {
      ...requestOptions,
      headers: {
        Accept: 'application/json',
        ...requestOptions.headers,
      },
      redirect: 'manual',
      signal: controller.signal,
    });

    if (isRedirect(response.status)) {
      if (redirectCount >= MAX_REDIRECTS) {
        throw new NetaClientError('INVALID_DISCOVERY', 'Çok fazla yönlendirme alındı.');
      }

      const location = response.headers.get('location');

      if (!location) {
        throw new NetaClientError('INVALID_DISCOVERY', 'Yönlendirme adresi eksik.');
      }

      const nextUrl = new URL(location, input).toString();

      if (new URL(input).protocol === 'https:' && new URL(nextUrl).protocol === 'http:') {
        throw new NetaClientError('UNTRUSTED_ORIGIN', 'HTTPS bağlantı HTTP adresine düşürülemez.');
      }

      return fetchWithRedirects(nextUrl, options, redirectCount + 1);
    }

    return response;
  } finally {
    clearTimeout(timeout);
  }
}

function ensureTrailingSlash(value: string): string {
  return value.endsWith('/') ? value : `${value}/`;
}

function isRedirect(status: number): boolean {
  return status >= 300 && status < 400;
}

function tryJsonParse(text: string): { ok: true; value: unknown } | { ok: false } {
  if (!text) {
    return { ok: true, value: null };
  }

  try {
    return { ok: true, value: JSON.parse(text) as unknown };
  } catch {
    return { ok: false };
  }
}

function readSafeApiErrorMessage(value: unknown): string | null {
  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.message === 'string') {
    return redactErrorMessage(value.message);
  }

  if (isRecord(value.error) && typeof value.error.message === 'string') {
    return redactErrorMessage(value.error.message);
  }

  return null;
}

function readApiErrorCode(value: unknown): 'UPSTREAM_ERROR' | 'UPSTREAM_TIMEOUT' | 'SERVICE_UNAVAILABLE' | null {
  if (!isRecord(value)) return null;
  const raw = typeof value.code === 'string' ? value.code : isRecord(value.error) ? value.error.code : null;
  return raw === 'UPSTREAM_ERROR' || raw === 'UPSTREAM_TIMEOUT' || raw === 'SERVICE_UNAVAILABLE' ? raw : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
