import "server-only";

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  APP_URL: z.string().trim().optional(),
  NEXT_PUBLIC_SITE_URL: z.string().trim().optional(),
  BETTER_AUTH_URL: z.string().trim().optional(),
  BETTER_AUTH_SECRET: z.string().trim().optional(),
  TRUSTED_ORIGINS: z.string().trim().optional(),
  DATA_DIR: z.string().trim().optional(),
  DATABASE_PATH: z.string().trim().optional(),
});

export type ServerConfig = {
  nodeEnv: "development" | "test" | "production";
  dataDir: string;
  databasePath: string;
  uploadsDir: string;
  backupsDir: string;
  tmpDir: string;
  appUrl: string;
  trustedOrigins: string[];
  secureCookies: boolean;
  betterAuthSecret?: string;
};

let cachedConfig: ServerConfig | undefined;

export function getServerConfig(): ServerConfig {
  if (cachedConfig) {
    return cachedConfig;
  }

  const parsed = envSchema.parse(process.env);
  const isProductionBuild = process.env.NEXT_PHASE === "phase-production-build";
  const defaultDataDir = isProductionBuild
    ? path.join(os.tmpdir(), `neta-production-build-${process.pid}`)
    : parsed.NODE_ENV === "production"
      ? "/app/data"
      : path.join(process.cwd(), ".data");
  const dataDir = path.resolve(
    parsed.DATA_DIR && parsed.DATA_DIR.length > 0
      ? parsed.DATA_DIR
      : defaultDataDir,
  );

  const databasePath = path.resolve(
    parsed.DATABASE_PATH && parsed.DATABASE_PATH.length > 0
      ? parsed.DATABASE_PATH
      : path.join(dataDir, "neta.db"),
  );

  const appUrl = normalizeOrigin(
    parsed.BETTER_AUTH_URL ||
      parsed.APP_URL ||
      parsed.NEXT_PUBLIC_SITE_URL ||
      "http://localhost:3000",
  );
  const secureCookies = validateAppUrlSecurity(appUrl, parsed.NODE_ENV);
  const trustedOrigins = normalizeTrustedOrigins(parsed.TRUSTED_ORIGINS, appUrl);
  const betterAuthSecret = normalizeAuthSecret(parsed.BETTER_AUTH_SECRET, parsed.NODE_ENV);

  cachedConfig = {
    nodeEnv: parsed.NODE_ENV,
    dataDir,
    databasePath,
    uploadsDir: path.join(dataDir, "uploads"),
    backupsDir: path.join(dataDir, "backups"),
    tmpDir: path.join(dataDir, "tmp"),
    appUrl,
    trustedOrigins,
    secureCookies,
    betterAuthSecret,
  };

  return cachedConfig;
}

function normalizeOrigin(value: string): string {
  const url = new URL(value);
  return url.origin;
}

function normalizeTrustedOrigins(value: string | undefined, appUrl: string): string[] {
  const origins = new Set([appUrl]);

  for (const rawOrigin of value?.split(",") ?? []) {
    const origin = rawOrigin.trim();

    if (!origin) {
      continue;
    }

    if (origin.includes("*")) {
      throw new Error("TRUSTED_ORIGINS wildcard icermemelidir.");
    }

    origins.add(normalizeOrigin(origin));
  }

  return [...origins];
}

function validateAppUrlSecurity(
  appUrl: string,
  nodeEnv: ServerConfig["nodeEnv"],
): boolean {
  const url = new URL(appUrl);
  const isHttps = url.protocol === "https:";
  const isLoopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);

  if (nodeEnv === "production" && !isHttps && !isLoopback) {
    throw new Error("Production APP_URL HTTPS kullanmalidir; HTTP yalnizca localhost icin desteklenir.");
  }

  return isHttps;
}

function normalizeAuthSecret(
  value: string | undefined,
  nodeEnv: ServerConfig["nodeEnv"],
): string | undefined {
  if (value && value.length < 32) {
    throw new Error("BETTER_AUTH_SECRET en az 32 karakter olmalidir.");
  }

  if (value) {
    return value;
  }

  if (nodeEnv === "production" && process.env.NEXT_PHASE !== "phase-production-build") {
    throw new Error("BETTER_AUTH_SECRET production runtime icin zorunludur.");
  }

  if (process.env.NEXT_PHASE === "phase-production-build") {
    return "build-time-placeholder-do-not-use-at-runtime";
  }

  return undefined;
}

export function ensureDataDirectories(config = getServerConfig()): void {
  for (const dir of [config.dataDir, config.uploadsDir, config.backupsDir, config.tmpDir]) {
    fs.mkdirSync(dir, { recursive: true });
  }
}
