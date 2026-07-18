import { buildProjectRiskContext } from "@/server/ai/context";
import { getAiRuntime } from "@/server/ai/provider";
import { aiJsonError } from "@/server/ai/responses";
import { domainActorFromSession } from "@/server/auth/domain-actor";
import { getSessionContextFromHeaders } from "@/server/auth/session";
import { DomainError } from "@/server/domain/errors";
import { getDomainService } from "@/server/services/runtime";
import { generateText } from "ai";
import { NextResponse } from "next/server";
import { z } from "zod";

export const maxDuration = 120;

const requestSchema = z.object({
  projectId: z.string().trim().min(1).max(160).optional(),
}).strict();

export async function POST(request: Request) {
  try {
    const context = await getSessionContextFromHeaders(new Headers(request.headers));
    if (!context) {
      throw new DomainError("UNAUTHENTICATED", "Oturum gerekli.");
    }
    if (context.profile.role !== "freelancer") {
      throw new DomainError("FORBIDDEN", "Bu işlem yalnızca freelancer hesabına açıktır.");
    }

    const parsed = requestSchema.safeParse(await request.json());
    if (!parsed.success) {
      throw new DomainError("VALIDATION_ERROR", "Proje risk isteği geçersiz.");
    }

    const actor = domainActorFromSession(context);
    const projectContext = buildProjectRiskContext(
      getDomainService(),
      actor,
      parsed.data.projectId,
    );
    const runtime = getAiRuntime(actor);
    const { text } = await generateText({
      model: runtime.model,
      timeout: runtime.timeout,
      system: `Sen bir proje yönetim uzmanısın.
Verilen proje bilgilerini analiz ederek kısa, net ve aksiyon odaklı bir risk ve durum raporu oluştur.
Türkçe yanıt ver; yalnızca sağlanan verilere dayan ve belirsizlikleri açıkça belirt.`,
      prompt: `Aşağıdaki server-side proje bağlamındaki riskleri ve önerileri belirt:\n\n${projectContext}`,
    });

    return NextResponse.json({ text });
  } catch (error) {
    return aiJsonError(error);
  }
}
