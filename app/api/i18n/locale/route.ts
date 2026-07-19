import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { getSqliteConnection } from "@/server/db/client";
import { instanceLocales } from "@/server/db/schema";
import { DomainError } from "@/server/domain/errors";
import { buildLocaleCookie, normalizeLocaleCode } from "@/server/i18n/locale";
import { eq } from "drizzle-orm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const locale = normalizeLocaleCode(typeof payload.locale === "string" ? payload.locale : null);
    if (!locale) {
      throw new DomainError("VALIDATION_ERROR", "validation.invalidLocale", {
        messageKey: "validation.invalidLocale",
      });
    }

    const row = getSqliteConnection().db
      .select({ code: instanceLocales.code, status: instanceLocales.status })
      .from(instanceLocales)
      .where(eq(instanceLocales.code, locale))
      .get();
    if (!row || row.status === "archived") {
      throw new DomainError("UNSUPPORTED_LOCALE", "validation.unsupportedLocale", {
        messageKey: "validation.unsupportedLocale",
      });
    }

    (await cookies()).set(buildLocaleCookie(row.code));
    return NextResponse.json({ ok: true, data: { locale: row.code } });
  } catch (error) {
    const normalized = error instanceof DomainError
      ? error
      : new DomainError("VALIDATION_ERROR", "validation.unsupportedLocale", {
        messageKey: "validation.unsupportedLocale",
      });
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: normalized.code,
          message: normalized.message,
          messageKey: normalized.details?.messageKey,
        },
      },
      { status: normalized.status },
    );
  }
}
