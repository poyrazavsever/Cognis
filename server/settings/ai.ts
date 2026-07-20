import "server-only";

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { getServerConfig } from "../config";
import { getSqliteConnection } from "../db/client";
import { userAiSettings, type AiProvider } from "../db/schema/settings";
import { requireOwnerScope, type DomainActor } from "../domain/actor";
import { DomainError } from "../domain/errors";

const inputSchema = z.object({
  provider: z.enum(["gemini", "openai", "groq", "ollama"]),
  model: z.string().trim().max(200).optional(),
  apiKey: z.string().trim().max(4_096).optional(),
});

export type PublicAiSettings = {
  provider: AiProvider;
  model: string | null;
  hasApiKey: boolean;
};

export function getPublicAiSettings(actor: DomainActor): PublicAiSettings {
  const scope = requireOwnerScope(actor);
  const row = getSqliteConnection().db
    .select()
    .from(userAiSettings)
    .where(eq(userAiSettings.ownerUserId, scope.ownerUserId))
    .get();

  return {
    provider: row?.provider ?? "gemini",
    model: row?.model ?? null,
    hasApiKey: Boolean(row?.encryptedApiKey),
  };
}

export function updateAiSettings(actor: DomainActor, input: unknown): PublicAiSettings {
  const scope = requireOwnerScope(actor);
  const parsed = inputSchema.safeParse(input);
  if (!parsed.success) {
    throw new DomainError("VALIDATION_ERROR", "Yapay zeka ayarları geçersiz.");
  }

  const { db } = getSqliteConnection();
  const current = db
    .select()
    .from(userAiSettings)
    .where(eq(userAiSettings.ownerUserId, scope.ownerUserId))
    .get();
  const encryptedApiKey = parsed.data.provider === "ollama"
    ? null
    : parsed.data.apiKey
      ? encryptSecret(parsed.data.apiKey)
      : current?.encryptedApiKey ?? null;
  const model = parsed.data.model || null;

  db.insert(userAiSettings)
    .values({
      ownerUserId: scope.ownerUserId,
      provider: parsed.data.provider,
      model,
      encryptedApiKey,
    })
    .onConflictDoUpdate({
      target: userAiSettings.ownerUserId,
      set: {
        provider: parsed.data.provider,
        model,
        encryptedApiKey,
        updatedAt: sqlNow(),
      },
    })
    .run();

  return {
    provider: parsed.data.provider,
    model,
    hasApiKey: Boolean(encryptedApiKey),
  };
}

export function getAiRuntimeSettings(actor: DomainActor): {
  provider: AiProvider;
  model: string | null;
  apiKey: string | null;
} {
  const scope = requireOwnerScope(actor);
  const row = getSqliteConnection().db
    .select()
    .from(userAiSettings)
    .where(eq(userAiSettings.ownerUserId, scope.ownerUserId))
    .get();

  return {
    provider: row?.provider ?? "gemini",
    model: row?.model ?? null,
    apiKey: row?.encryptedApiKey ? decryptSecret(row.encryptedApiKey) : null,
  };
}

function encryptionKey(): Buffer {
  const secret = getServerConfig().betterAuthSecret
    ?? "neta-development-only-ai-settings-secret";
  return createHash("sha256").update(`neta:ai-settings:${secret}`).digest();
}

function encryptSecret(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `v1.${iv.toString("base64url")}.${tag.toString("base64url")}.${ciphertext.toString("base64url")}`;
}

function decryptSecret(value: string): string {
  const [version, ivValue, tagValue, ciphertextValue] = value.split(".");
  if (version !== "v1" || !ivValue || !tagValue || !ciphertextValue) {
    throw new DomainError("INVARIANT_VIOLATION", "AI secret formatı geçersiz.");
  }
  try {
    const decipher = createDecipheriv(
      "aes-256-gcm",
      encryptionKey(),
      Buffer.from(ivValue, "base64url"),
    );
    decipher.setAuthTag(Buffer.from(tagValue, "base64url"));
    return Buffer.concat([
      decipher.update(Buffer.from(ciphertextValue, "base64url")),
      decipher.final(),
    ]).toString("utf8");
  } catch {
    throw new DomainError("INVARIANT_VIOLATION", "AI secret çözülemedi.");
  }
}

function sqlNow(): string {
  return new Date().toISOString();
}
