import "server-only";

import { NextResponse } from "next/server";
import { DomainError } from "../domain/errors";

export function apiSuccess<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ ok: true, data }, init);
}

export function apiError(error: unknown): NextResponse {
  if (error instanceof DomainError) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      },
      { status: error.status },
    );
  }

  console.error("Unhandled API error", error);
  return NextResponse.json(
    { ok: false, error: { code: "INTERNAL_ERROR", message: "Beklenmeyen bir sunucu hatası oluştu." } },
    { status: 500 },
  );
}
