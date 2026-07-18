import { buildFinanceAnalysisContext } from "@/server/ai/context";
import { getAiRuntime } from "@/server/ai/provider";
import { aiJsonError } from "@/server/ai/responses";
import { domainActorFromSession } from "@/server/auth/domain-actor";
import { getSessionContextFromHeaders } from "@/server/auth/session";
import { DomainError } from "@/server/domain/errors";
import { getDomainService } from "@/server/services/runtime";
import { generateText } from "ai";
import { NextResponse } from "next/server";

export const maxDuration = 120;

export async function POST(request: Request) {
  try {
    const context = await getSessionContextFromHeaders(new Headers(request.headers));
    if (!context) {
      throw new DomainError("UNAUTHENTICATED", "Oturum gerekli.");
    }
    if (context.profile.role !== "freelancer") {
      throw new DomainError("FORBIDDEN", "Bu işlem yalnızca freelancer hesabına açıktır.");
    }

    const actor = domainActorFromSession(context);
    const analysisContext = buildFinanceAnalysisContext(getDomainService(), actor);
    if (!analysisContext.hasData) {
      return NextResponse.json({
        text: "Son 30 güne ait finansal işlem bulunmadığı için analiz yapamıyorum. Lütfen yeni gelir veya gider ekleyin.",
      });
    }

    const runtime = getAiRuntime(actor);
    const { text } = await generateText({
      model: runtime.model,
      timeout: runtime.timeout,
      system: `Sen profesyonel bir finans danışmanısın.
Verilen finansal verilere dayanarak kısa, motive edici ve yapıcı bir finansal durum raporu sun.
Markdown başlıklar kullan, Türkçe konuş ve hukuki ya da finansal kesin hüküm verme.`,
      prompt: `Aşağıdaki server-side finans özetine göre durum ve uygulanabilir öneriler sun:\n\n${analysisContext.text}`,
    });

    return NextResponse.json({ text });
  } catch (error) {
    return aiJsonError(error);
  }
}
