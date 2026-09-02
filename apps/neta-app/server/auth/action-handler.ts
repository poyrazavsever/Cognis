import "server-only";

import { parseSetCookieHeader, splitSetCookieHeader, toCookieOptions } from "better-auth/cookies";
import { cookies, headers } from "next/headers";
import { auth } from "@/server/auth/auth";
import { getServerConfig } from "@/server/config";

type SetCookieHeaders = Headers & {
  getSetCookie?: () => string[];
};

export async function callAuthAction<TResponse>(
  pathname: `/${string}`,
  body?: Record<string, unknown>,
): Promise<TResponse> {
  const requestHeaders = new Headers(await headers());
  requestHeaders.set("content-type", "application/json");

  const response = await auth.handler(
    new Request(`${getServerConfig().appUrl}/api/auth${pathname}`, {
      method: "POST",
      headers: requestHeaders,
      body: JSON.stringify(body ?? {}),
    }),
  );

  await applyResponseCookies(response.headers);

  const payload = await readJsonPayload(response);

  if (!response.ok) {
    throw new Error(getAuthErrorMessage(payload));
  }

  return payload as TResponse;
}

async function applyResponseCookies(responseHeaders: Headers): Promise<void> {
  const cookieStore = await cookies();

  for (const header of getSetCookieValues(responseHeaders)) {
    for (const [name, attributes] of parseSetCookieHeader(header)) {
      cookieStore.set(name, attributes.value, toCookieOptions(attributes));
    }
  }
}

function getSetCookieValues(headersList: Headers): string[] {
  const getSetCookie = (headersList as SetCookieHeaders).getSetCookie;

  if (typeof getSetCookie === "function") {
    return getSetCookie.call(headersList);
  }

  const header = headersList.get("set-cookie");
  return header ? splitSetCookieHeader(header) : [];
}

async function readJsonPayload(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type");

  if (!contentType?.includes("application/json")) {
    return null;
  }

  return response.json();
}

function getAuthErrorMessage(payload: unknown): string {
  if (payload && typeof payload === "object" && "message" in payload) {
    const message = (payload as { message?: unknown }).message;

    if (typeof message === "string" && message.trim().length > 0) {
      return message;
    }
  }

  return "Kimlik do\u011frulama iste\u011fi tamamlanamad\u0131.";
}
