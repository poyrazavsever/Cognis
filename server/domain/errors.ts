export type DomainErrorCode =
  | "VALIDATION_ERROR"
  | "UNSUPPORTED_LOCALE"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "INVARIANT_VIOLATION"
  | "UPSTREAM_ERROR"
  | "UPSTREAM_TIMEOUT"
  | "SERVICE_UNAVAILABLE";

const statusByCode: Record<DomainErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNSUPPORTED_LOCALE: 400,
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INVARIANT_VIOLATION: 422,
  UPSTREAM_ERROR: 502,
  UPSTREAM_TIMEOUT: 504,
  SERVICE_UNAVAILABLE: 503,
};

export class DomainError extends Error {
  readonly status: number;

  constructor(
    public readonly code: DomainErrorCode,
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "DomainError";
    this.status = statusByCode[code];
  }
}

export function notFound(resource = "Kaynak"): DomainError {
  return new DomainError("NOT_FOUND", `${resource} bulunamadı.`);
}

export function conflict(message: string): DomainError {
  return new DomainError("CONFLICT", message);
}
