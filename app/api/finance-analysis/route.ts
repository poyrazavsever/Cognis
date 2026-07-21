import { buildFinanceAnalysisContext } from "@/server/ai/context";
import { getAiRuntime } from "@/server/ai/provider";
import { aiJsonError } from "@/server/ai/responses";
import { domainActorFromSession } from "@/server/auth/domain-actor";
import { getSessionContextFromHeaders } from "@/server/auth/session";
import { DomainError } from "@/server/domain/errors";
import { resolveFreelancerLocale } from "@/server/i18n/resolver";
import { createTranslator } from "@/server/i18n/translator";
import { getDomainService } from "@/server/services/runtime";
import { generateText } from "ai";
import { NextResponse } from "next/server";

export const maxDuration = 120;

export async function POST(request: Request) {
  let t: ReturnType<typeof createTranslator>["t"] | null = null;

  try {
    const context = await getSessionContextFromHeaders(new Headers(request.headers));
    if (!context) {
      throw new DomainError("UNAUTHENTICATED", "Authentication is required.");
    }
    if (context.profile.role !== "freelancer") {
      throw new DomainError("FORBIDDEN", "This action is only available to freelancer accounts.");
    }

    const actor = domainActorFromSession(context);
    const locale = await resolveFreelancerLocale(context);
    t = createTranslator(locale.locale, ["finance", "common"]).t;
    const analysisContext = buildFinanceAnalysisContext(getDomainService(), actor);
    if (!analysisContext.hasData) {
      return NextResponse.json({
        text: t("finance.ai.noData"),
      });
    }

    const runtime = getAiRuntime(actor);
    const { text } = await generateText({
      model: runtime.model,
      timeout: runtime.timeout,
      system: t("finance.ai.systemPrompt"),
      prompt: t("finance.ai.prompt", { context: analysisContext.text }),
    });

    return NextResponse.json({ text });
  } catch (error) {
    return aiJsonError(error, t ?? undefined);
  }
}
