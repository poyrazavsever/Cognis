import { buildChatContext } from "@/server/ai/context";
import { getAiRuntime, normalizeAiError } from "@/server/ai/provider";
import { domainActorFromSession } from "@/server/auth/domain-actor";
import { getSessionContextFromHeaders } from "@/server/auth/session";
import { DomainError } from "@/server/domain/errors";
import { resolveFreelancerLocale } from "@/server/i18n/resolver";
import { createTranslator } from "@/server/i18n/translator";
import { getDomainService } from "@/server/services/runtime";
import {
  convertToModelMessages,
  safeValidateUIMessages,
  streamText,
  type UIMessage,
} from "ai";
import { z } from "zod";

export const maxDuration = 120;

const requestSchema = z.object({
  sessionId: z.string().trim().min(1).max(160),
  sourceLocale: z.string().trim().min(2).max(12).optional(),
  messages: z.array(z.unknown()).min(1).max(100),
  id: z.string().trim().min(1).max(160).optional(),
  trigger: z.enum(["submit-message", "regenerate-message"]).optional(),
  messageId: z.string().trim().min(1).max(160).optional(),
});

export async function POST(request: Request) {
  try {
    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 256_000) {
      throw new DomainError("VALIDATION_ERROR", "Chat request is too large.", {
        reason: "request_too_large",
      });
    }

    const context = await getSessionContextFromHeaders(new Headers(request.headers));
    if (!context) {
      throw new DomainError("UNAUTHENTICATED", "Authentication is required.");
    }
    if (context.profile.role !== "freelancer") {
      throw new DomainError("FORBIDDEN", "This action is only available to freelancer accounts.");
    }

    const requestBody = await readJsonBody(request);
    const parsed = requestSchema.safeParse(requestBody);
    if (!parsed.success) {
      throw new DomainError(
        "VALIDATION_ERROR",
        "Chat request is invalid.",
        {
          reason: describeRequestIssues(parsed.error.issues),
          issues: parsed.error.issues.map((issue) => ({
            code: issue.code,
            path: issue.path.join(".") || "body",
          })),
        },
      );
    }

    const validated = await safeValidateUIMessages<UIMessage>({
      messages: parsed.data.messages,
    });
    if (!validated.success) {
      throw new DomainError(
        "VALIDATION_ERROR",
        "Message format is invalid.",
        { reason: "invalid_message_format" },
      );
    }

    const latestMessage = validated.data.at(-1);
    const latestText = latestMessage ? getMessageText(latestMessage).trim() : "";
    if (latestMessage?.role !== "user" || !latestText || latestText.length > 8_000) {
      throw new DomainError("VALIDATION_ERROR", "A valid user message is required.", {
        reason: "invalid_user_message",
      });
    }

    const actor = domainActorFromSession(context);
    const resolvedLocale = await resolveFreelancerLocale(context);
    const responseLocale = parsed.data.sourceLocale ?? resolvedLocale.locale;
    const translator = createTranslator(responseLocale, ["chat", "common"]);
    const service = getDomainService();
    service.getChatSession(actor, parsed.data.sessionId);
    const runtime = getAiRuntime(actor);
    const userContext = buildChatContext(service, actor);
    const history = service
      .listChatMessages(actor, parsed.data.sessionId)
      .slice(-40)
      .filter(isConversationMessage)
      .map(toUiMessage);

    service.addChatMessage(actor, {
      sessionId: parsed.data.sessionId,
      role: "user",
      content: latestText,
      sourceLocale: responseLocale,
    });

    const result = streamText({
      model: runtime.model,
      timeout: runtime.timeout,
      system: translator.t("chat.systemPrompt", { context: userContext }),
      messages: await convertToModelMessages([
        ...history,
        {
          id: crypto.randomUUID(),
          role: "user",
          parts: [{ type: "text", text: latestText }],
        },
      ]),
      onFinish: async ({ text }) => {
        if (text.trim()) {
          service.addChatMessage(actor, {
            sessionId: parsed.data.sessionId,
            role: "assistant",
            content: text,
            sourceLocale: responseLocale,
          });
        }
      },
    });

    return result.toUIMessageStreamResponse({
      onError: (error) => normalizeAiError(error).message,
    });
  } catch (error) {
    const normalized = normalizeAiError(error);
    return new Response(chatErrorResponseBody(normalized), {
      status: normalized.status,
      headers: {
        "cache-control": "no-store",
        "content-type": "text/plain; charset=utf-8",
        "x-neta-error-code": normalized.code,
      },
    });
  }
}

function chatErrorResponseBody(error: DomainError) {
  const detail = typeof error.details?.reason === "string"
    ? error.details.reason
    : error.message;

  switch (error.code) {
    case "VALIDATION_ERROR":
      return `chat.errors.invalidDetailed|${detail}`;
    case "UNAUTHENTICATED":
      return "chat.errors.unauthenticated";
    case "FORBIDDEN":
      return "chat.errors.forbidden";
    case "NOT_FOUND":
      return "chat.errors.sessionNotFound";
    case "UPSTREAM_TIMEOUT":
      return "chat.errors.timeout";
    case "SERVICE_UNAVAILABLE":
      return "chat.errors.serviceUnavailable";
    case "UPSTREAM_ERROR":
      return `chat.errors.providerDetailed|${detail}`;
    default:
      return "chat.errors.communication";
  }
}

async function readJsonBody(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new DomainError(
      "VALIDATION_ERROR",
      "Chat request must contain a valid JSON body.",
      { reason: "invalid_json" },
    );
  }
}

function describeRequestIssues(issues: z.core.$ZodIssue[]): string {
  return issues
    .slice(0, 3)
    .map((issue) => {
      const field = issue.path.join(".") || "body";
      switch (issue.code) {
        case "invalid_type":
          return `${field}: invalid_type`;
        case "too_small":
          return `${field}: too_small`;
        case "too_big":
          return `${field}: too_big`;
        case "invalid_value":
          return `${field}: invalid_value`;
        default:
          return `${field}: invalid`;
      }
    })
    .join("; ");
}

function toUiMessage(message: {
  id: string;
  role: "user" | "assistant";
  content: string;
}): UIMessage {
  return {
    id: message.id,
    role: message.role,
    parts: [{ type: "text", text: message.content }],
  };
}

function isConversationMessage<T extends { role: string }>(
  message: T,
): message is T & { role: "user" | "assistant" } {
  return message.role === "user" || message.role === "assistant";
}

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((part) => part.type === "text")
    .map((part) => part.text)
    .join("");
}
