import "server-only";

import { NextResponse } from "next/server";
import { normalizeAiError } from "./provider";
import type { TranslationValues } from "@/lib/i18n";

export function aiJsonError(
  error: unknown,
  t?: (key: string, values?: TranslationValues) => string,
): NextResponse {
  const normalized = normalizeAiError(error);
  const reason = typeof normalized.details?.reason === "string"
    ? normalized.details.reason
    : "provider_unreachable";
  const translatedReason = t ? t(`finance.ai.errorReasons.${reason}`) : normalized.message;
  const fallbackReason = translatedReason === `finance.ai.errorReasons.${reason}`
    ? normalized.message
    : translatedReason;
  return NextResponse.json(
    {
      error: t
        ? t("finance.ai.errorWithReason", { reason: fallbackReason })
        : normalized.message,
      code: normalized.code,
      reason,
    },
    { status: normalized.status },
  );
}
