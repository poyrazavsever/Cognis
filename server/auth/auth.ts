import "server-only";

import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { getServerConfig } from "@/server/config";
import { getSqliteConnection } from "@/server/db/client";
import * as schema from "@/server/db/schema";
import {
  authorizeSessionCreation,
  completeFirstFreelancerSetup,
  recordAuthAuditEvent,
  reserveFirstFreelancerSetup,
} from "@/server/auth/setup";

const config = getServerConfig();

export const auth = betterAuth({
  appName: "Neta",
  baseURL: config.appUrl,
  trustedOrigins: config.trustedOrigins,
  secret: config.betterAuthSecret,
  database: drizzleAdapter(getSqliteConnection().db, {
    provider: "sqlite",
    schema,
    transaction: false,
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: false,
  },
  rateLimit: {
    enabled: true,
    window: 60,
    max: 60,
    customRules: {
      "/sign-in/email": {
        window: 60,
        max: 10,
      },
      "/sign-up/email": {
        window: 300,
        max: 3,
      },
    },
  },
  advanced: {
    useSecureCookies: config.secureCookies,
    cookiePrefix: "neta",
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      secure: config.secureCookies,
      path: "/",
    },
  },
  databaseHooks: {
    user: {
      create: {
        before: async (user) => {
          const isReserved = await reserveFirstFreelancerSetup(user.email);
          return isReserved;
        },
        after: async (user) => {
          await completeFirstFreelancerSetup(user);
        },
      },
    },
    session: {
      create: {
        before: async (session) => authorizeSessionCreation(session.userId),
        after: async (session) => {
          await recordAuthAuditEvent({
            type: "login_succeeded",
            authUserId: session.userId,
            metadata: { source: "session_create" },
          });
        },
      },
      delete: {
        after: async (session) => {
          await recordAuthAuditEvent({
            type: "logout_succeeded",
            authUserId: session.userId,
            metadata: { source: "session_delete" },
          });
        },
      },
    },
  },
  plugins: [nextCookies()],
});

export type Auth = typeof auth;
