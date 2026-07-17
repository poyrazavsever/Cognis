import "server-only";

import type { NextResponse } from "next/server";
import { apiError, apiSuccess } from "../responses";
import { NETA_API_VERSION } from "./contracts";

export function apiV1Success<T>(
  data: T,
  init?: ResponseInit,
): NextResponse {
  return withV1Headers(apiSuccess(data, init));
}

export function apiV1Error(error: unknown): NextResponse {
  return withV1Headers(apiError(error));
}

function withV1Headers(response: NextResponse): NextResponse {
  response.headers.set("X-Neta-API-Version", NETA_API_VERSION);
  if (!response.headers.has("Cache-Control")) {
    response.headers.set("Cache-Control", "private, no-store");
  }
  return response;
}
