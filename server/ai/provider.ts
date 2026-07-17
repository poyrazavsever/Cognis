import "server-only";

import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createGroq } from "@ai-sdk/groq";
import { createOpenAI } from "@ai-sdk/openai";
import { APICallError, NoSuchModelError, type LanguageModel } from "ai";
import { getServerConfig } from "../config";
import type { DomainActor } from "../domain/actor";
import { DomainError } from "../domain/errors";
import { getAiRuntimeSettings } from "../settings/ai";

const defaultModels = {
  gemini: "gemini-1.5-pro-latest",
  groq: "llama-3.1-8b-instant",
  openai: "gpt-4o",
  ollama: "llama3.2",
} as const;

export type AiRuntime = {
  model: LanguageModel;
  provider: keyof typeof defaultModels;
  modelName: string;
  timeout: number;
};

export function getAiRuntime(actor: DomainActor): AiRuntime {
  const settings = getAiRuntimeSettings(actor);
  const modelName = settings.model ?? defaultModels[settings.provider];
  const config = getServerConfig();

  if (settings.provider !== "ollama" && !settings.apiKey) {
    throw new DomainError(
      "VALIDATION_ERROR",
      "Ayarlardan bir AI sağlayıcısı ve API anahtarı seçmelisiniz.",
    );
  }

  let model: LanguageModel;
  switch (settings.provider) {
    case "gemini":
      model = createGoogleGenerativeAI({ apiKey: settings.apiKey ?? "" })(modelName);
      break;
    case "groq":
      model = createGroq({ apiKey: settings.apiKey ?? "" })(modelName);
      break;
    case "ollama":
      model = createOpenAI({
        apiKey: "ollama",
        baseURL: config.ollamaBaseUrl,
      })(modelName);
      break;
    default:
      model = createOpenAI({ apiKey: settings.apiKey ?? "" })(modelName);
  }

  return {
    model,
    provider: settings.provider,
    modelName,
    timeout: config.aiRequestTimeoutMs,
  };
}

export function normalizeAiError(error: unknown): DomainError {
  if (error instanceof DomainError) return error;

  const name = error instanceof Error ? error.name : "";
  if (name === "AbortError" || name === "TimeoutError") {
    return new DomainError(
      "UPSTREAM_TIMEOUT",
      "AI sağlayıcısı zamanında yanıt vermedi. Lütfen tekrar deneyin.",
    );
  }

  if (NoSuchModelError.isInstance(error)) {
    return new DomainError(
      "VALIDATION_ERROR",
      "Seçili AI modeli kullanılamıyor. Ayarlardaki model adını kontrol edin.",
    );
  }

  if (APICallError.isInstance(error)) {
    if (error.statusCode === 401 || error.statusCode === 403) {
      return new DomainError(
        "VALIDATION_ERROR",
        "AI sağlayıcısı API anahtarını reddetti. Ayarlardaki anahtarı kontrol edin.",
      );
    }
    if (error.statusCode === 404) {
      return new DomainError(
        "VALIDATION_ERROR",
        "Seçili AI modeli sağlayıcıda bulunamadı. Model adını kontrol edin.",
      );
    }
    if (error.statusCode === 429) {
      return new DomainError(
        "SERVICE_UNAVAILABLE",
        "AI sağlayıcısının kullanım limiti aşıldı. Kısa süre sonra tekrar deneyin.",
      );
    }
    if (error.statusCode && error.statusCode >= 500) {
      return new DomainError(
        "UPSTREAM_ERROR",
        "AI sağlayıcısı geçici bir sunucu hatası döndürdü. Biraz sonra tekrar deneyin.",
      );
    }
  }

  console.error("AI provider request failed", error);
  return new DomainError(
    "UPSTREAM_ERROR",
    "AI sağlayıcısına ulaşılamadı. Sağlayıcı ayarlarını kontrol edip tekrar deneyin.",
  );
}
