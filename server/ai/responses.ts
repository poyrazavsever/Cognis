import "server-only";

import { NextResponse } from "next/server";
import { normalizeAiError } from "./provider";

export function aiJsonError(error: unknown): NextResponse {
  const normalized = normalizeAiError(error);
  return NextResponse.json(
    { error: normalized.message, code: normalized.code },
    { status: normalized.status },
  );
}
