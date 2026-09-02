export type NetaErrorCode =
  | 'NETWORK_ERROR'
  | 'TIMEOUT'
  | 'INVALID_DOMAIN'
  | 'INVALID_DISCOVERY'
  | 'NOT_NETA'
  | 'UNTRUSTED_ORIGIN'
  | 'INCOMPATIBLE_CLIENT'
  | 'MISSING_CAPABILITY'
  | 'UNHEALTHY'
  | 'AUTH_REQUIRED'
  | 'AUTH_FAILED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_ERROR'
  | 'UNSUPPORTED_LOCALE'
  | 'SERVER_ERROR'
  | 'UPSTREAM_ERROR'
  | 'UPSTREAM_TIMEOUT'
  | 'SERVICE_UNAVAILABLE'
  | 'UNKNOWN';

export class NetaClientError extends Error {
  readonly code: NetaErrorCode;
  readonly status: number | undefined;

  constructor(code: NetaErrorCode, message: string, status?: number) {
    super(message);
    this.name = 'NetaClientError';
    this.code = code;
    this.status = status;
  }
}

export function upstreamErrorMessage(code: 'UPSTREAM_ERROR' | 'UPSTREAM_TIMEOUT' | 'SERVICE_UNAVAILABLE'): string {
  if (code === 'UPSTREAM_TIMEOUT') return 'AI sağlayıcısı zamanında yanıt vermedi.';
  if (code === 'SERVICE_UNAVAILABLE') return 'AI sağlayıcısı henüz yapılandırılmamış veya kullanılamıyor.';
  return 'AI yanıtı oluşturulurken sağlayıcı hatası oluştu.';
}

export function serverErrorMessage(code: 'UPSTREAM_ERROR' | 'UPSTREAM_TIMEOUT' | 'SERVICE_UNAVAILABLE'): string {
  return upstreamErrorMessage(code);
}

export function redactErrorMessage(message: string): string {
  return /(api[-_ ]?key|secret|password|bearer|authorization|(?:access|refresh|reset|invitation)[-_ ]?token|token)\s*[:=]/i.test(message) ||
    /\bBearer\s+[A-Za-z0-9._~+/=-]+/i.test(message) ||
    /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\b/.test(message)
    ? 'Sunucu isteği güvenli biçimde tamamlanamadı.'
    : message;
}

export function toClientError(error: unknown, fallbackMessage = 'İşlem tamamlanamadı.'): NetaClientError {
  if (error instanceof NetaClientError) {
    return error;
  }

  if (error instanceof Error && error.name === 'AbortError') {
    return new NetaClientError('TIMEOUT', 'Sunucu zamanında yanıt vermedi.');
  }

  if (error instanceof TypeError) {
    return new NetaClientError('NETWORK_ERROR', 'Sunucuya ulaşılamadı.');
  }

  return new NetaClientError('UNKNOWN', fallbackMessage);
}
