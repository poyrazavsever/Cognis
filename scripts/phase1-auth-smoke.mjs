import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { execFileSync, spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import Database from "better-sqlite3";

const PNG_BYTES = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);

const dataDir = path.join(process.cwd(), ".data", `phase1-auth-smoke-${Date.now()}`);
const databasePath = path.join(dataDir, "neta.db");
const port = await getAvailablePort();
const baseUrl = `http://127.0.0.1:${port}`;
const env = {
  ...process.env,
  NODE_ENV: "development",
  DATA_DIR: dataDir,
  DATABASE_PATH: databasePath,
  APP_URL: baseUrl,
  NEXT_PUBLIC_SITE_URL: baseUrl,
  BETTER_AUTH_SECRET: "phase1-auth-smoke-secret-is-longer-than-32-characters",
  TRUSTED_ORIGINS: baseUrl,
  NEXT_TELEMETRY_DISABLED: "1",
};

fs.mkdirSync(dataDir, { recursive: true });
execFileSync(process.execPath, ["scripts/migrate.mjs"], {
  cwd: process.cwd(),
  env,
  stdio: "inherit",
});

const server = spawn(
  process.execPath,
  ["node_modules/next/dist/bin/next", "dev", "--hostname", "127.0.0.1", "--port", String(port)],
  {
    cwd: process.cwd(),
    env,
    stdio: ["ignore", "pipe", "pipe"],
    detached: process.platform !== "win32",
  },
);

let serverOutput = "";
server.stdout.on("data", (chunk) => {
  serverOutput = `${serverOutput}${chunk}`.slice(-12000);
});
server.stderr.on("data", (chunk) => {
  serverOutput = `${serverOutput}${chunk}`.slice(-12000);
});

try {
  await waitForServer();

  const setupAttempts = await Promise.all([
    authPost("/api/auth/sign-up/email", {
      name: "Owner One",
      email: "owner-one@example.com",
      password: "OwnerOne-Password-123",
    }),
    authPost("/api/auth/sign-up/email", {
      name: "Owner Two",
      email: "owner-two@example.com",
      password: "OwnerTwo-Password-123",
    }),
  ]);
  const successfulSetups = setupAttempts.filter((attempt) => attempt.response.ok);
  assert.equal(successfulSetups.length, 1, "Concurrent setup must create exactly one owner");

  const setupPayload = successfulSetups[0].payload;
  const ownerEmail = setupPayload.user.email;
  let ownerCookie = cookieHeader(successfulSetups[0].response);

  const db = new Database(databasePath);
  try {
    assert.equal(
      db.prepare("select count(*) as value from app_profiles where role = 'freelancer'").get().value,
      1,
      "Exactly one freelancer profile must exist",
    );

    const ownerUserId = db
      .prepare("select auth_user_id as authUserId from app_profiles where role = 'freelancer'")
      .get().authUserId;
    const insertClient = db.prepare(
      "insert into clients (id, owner_user_id, name) values (?, ?, ?)",
    );
    for (const [clientId, name] of [
      ["client-alpha", "Alpha Client"],
      ["client-expired", "Expired Client"],
      ["client-revoked", "Revoked Client"],
    ]) {
      insertClient.run(clientId, ownerUserId, name);
    }
    db.prepare(
      "insert into projects (id, owner_user_id, client_id, name, status) values (?, ?, ?, ?, ?)",
    ).run("project-alpha", ownerUserId, "client-alpha", "Alpha Project", "active");

    const rejectedRegistration = await authPost("/api/auth/sign-up/email", {
      name: "Public Attacker",
      email: "attacker@example.com",
      password: "Attacker-Password-123",
    });
    assert.equal(rejectedRegistration.response.ok, false, "Public registration must close after setup");

    if (!ownerCookie) {
      const signedIn = await authPost("/api/auth/sign-in/email", {
        email: ownerEmail,
        password: ownerEmail.startsWith("owner-one")
          ? "OwnerOne-Password-123"
          : "OwnerTwo-Password-123",
      });
      assert.equal(signedIn.response.ok, true, "Owner must be able to sign in");
      ownerCookie = cookieHeader(signedIn.response);
    }
    assert.ok(ownerCookie, "Owner session cookie must be issued");

    const anonymousUpload = await uploadFile("avatar", { fileName: "anonymous.png" });
    assert.equal(anonymousUpload.response.status, 401, "Anonymous file upload must fail");
    assert.deepEqual(
      { ok: anonymousUpload.payload.ok, code: anonymousUpload.payload.error.code },
      { ok: false, code: "UNAUTHENTICATED" },
      "File API errors must use the standard envelope",
    );

    const logoUpload = await uploadFile("branding_logo", {
      cookie: ownerCookie,
      fileName: "logo.png",
    });
    assert.equal(logoUpload.response.status, 201, JSON.stringify(logoUpload.payload));
    assert.equal(logoUpload.payload.ok, true, "File API success must use the standard envelope");
    const logoFileId = logoUpload.payload.data.id;
    const brandingUpdate = await jsonRequest("/api/branding", {
      method: "PATCH",
      cookie: ownerCookie,
      body: {
        applicationName: "Neta Smoke Studio",
        primaryColor: "#336699",
        accentColor: "#F0CC22",
        lightLogoFileId: logoFileId,
      },
    });
    assert.equal(brandingUpdate.response.ok, true, JSON.stringify(brandingUpdate.payload));
    assert.equal(brandingUpdate.payload.data.applicationName, "Neta Smoke Studio");
    const brandedLoginHtml = await (await fetch(`${baseUrl}/login`)).text();
    assert.match(brandedLoginHtml, /Neta Smoke Studio/, "Branding metadata must be server-rendered");
    assert.match(brandedLoginHtml, /--primary:#336699/, "Brand tokens must be present in first HTML response");
    const dynamicManifest = await (await fetch(`${baseUrl}/manifest.webmanifest`)).json();
    assert.equal(dynamicManifest.name, "Neta Smoke Studio", "Manifest must use instance branding");
    const publicLogo = await fetch(`${baseUrl}/api/branding/assets/${logoFileId}`);
    assert.equal(publicLogo.status, 200, "Referenced branding asset must be publicly readable");
    assert.equal(publicLogo.headers.get("x-content-type-options"), "nosniff");
    assert.deepEqual(new Uint8Array(await publicLogo.arrayBuffer()), PNG_BYTES);

    const portalAssetUpload = await uploadFile("project_asset", {
      cookie: ownerCookie,
      fileName: "portal.png",
      projectId: "project-alpha",
      portalVisible: true,
    });
    assert.equal(portalAssetUpload.response.status, 201, JSON.stringify(portalAssetUpload.payload));
    const portalAssetFileId = portalAssetUpload.payload.data.id;
    const privateAssetUpload = await uploadFile("project_asset", {
      cookie: ownerCookie,
      fileName: "private.png",
      projectId: "project-alpha",
      portalVisible: false,
    });
    assert.equal(privateAssetUpload.response.status, 201, JSON.stringify(privateAssetUpload.payload));
    const privateAssetFileId = privateAssetUpload.payload.data.id;

    const anonymousInvite = await jsonRequest("/api/portal-invitations", {
      method: "POST",
      body: { clientId: "anonymous-client", email: "anonymous@example.com" },
    });
    assert.equal(anonymousInvite.response.status, 401, "Anonymous invitation creation must fail");

    const invalidInvite = await jsonRequest("/api/portal-invitations", {
      method: "POST",
      cookie: ownerCookie,
      body: { clientId: "", email: "not-an-email" },
    });
    assert.equal(invalidInvite.response.status, 400, "Invalid invitation input must fail");

    const missingClientInvite = await jsonRequest("/api/portal-invitations", {
      method: "POST",
      cookie: ownerCookie,
      body: { clientId: "missing-client", email: "missing@example.com" },
    });
    assert.equal(missingClientInvite.response.status, 404, "Invitation target must be an owned client");

    const firstInvite = await jsonRequest("/api/portal-invitations", {
      method: "POST",
      cookie: ownerCookie,
      body: { clientId: "client-alpha", email: "client@example.com" },
    });
    assert.equal(firstInvite.response.status, 201);
    const rawFirstToken = tokenFromUrl(firstInvite.payload.invitation.invitationUrl);
    const storedFirst = db
      .prepare("select token_hash as tokenHash, status from portal_invitations where id = ?")
      .get(firstInvite.payload.invitation.id);
    assert.notEqual(storedFirst.tokenHash, rawFirstToken, "Raw invitation token must not be stored");
    assert.equal(storedFirst.tokenHash, sha256(rawFirstToken));

    const secondInvite = await jsonRequest("/api/portal-invitations", {
      method: "POST",
      cookie: ownerCookie,
      body: { clientId: "client-alpha", email: "client@example.com" },
    });
    assert.equal(secondInvite.response.status, 201);
    assert.equal(
      db.prepare("select status from portal_invitations where id = ?").get(firstInvite.payload.invitation.id).status,
      "revoked",
      "A replacement invitation must revoke the prior active invitation",
    );

    const revokedByReplacement = await acceptInvite(rawFirstToken);
    assert.equal(revokedByReplacement.response.status, 409);

    const rawClientToken = tokenFromUrl(secondInvite.payload.invitation.invitationUrl);
    const accepted = await acceptInvite(rawClientToken);
    assert.equal(accepted.response.status, 201, JSON.stringify(accepted.payload));
    const clientAuthUserId = db
      .prepare("select auth_user_id as authUserId from app_profiles where email = ?")
      .get("client@example.com").authUserId;
    assert.deepEqual(
      db
        .prepare("select role, client_id as clientId, disabled from app_profiles where email = ?")
        .get("client@example.com"),
      { role: "client", clientId: "client-alpha", disabled: 0 },
    );
    assert.equal(
      db.prepare("select auth_user_id as authUserId from clients where id = ?").get("client-alpha")
        .authUserId,
      clientAuthUserId,
      "Accepted invitation must atomically link the domain client",
    );
    assert.notEqual(
      db.prepare("select password from account where user_id = ?").get(clientAuthUserId).password,
      "Client-Password-123",
      "Client password must be hashed",
    );

    const replayed = await acceptInvite(rawClientToken);
    assert.equal(replayed.response.status, 409, "Accepted invitation must be single-use");

    const clientSignIn = await authPost("/api/auth/sign-in/email", {
      email: "client@example.com",
      password: "Client-Password-123",
    });
    assert.equal(clientSignIn.response.ok, true, JSON.stringify(clientSignIn.payload));
    const clientCookie = cookieHeader(clientSignIn.response);

    const clientPortalAsset = await fetch(`${baseUrl}/api/files/${portalAssetFileId}`, {
      headers: { cookie: clientCookie },
    });
    assert.equal(clientPortalAsset.status, 200, "Client must read portal-visible project asset");
    const clientPrivateAsset = await fetch(`${baseUrl}/api/files/${privateAssetFileId}`, {
      headers: { cookie: clientCookie },
    });
    assert.equal(clientPrivateAsset.status, 404, "Client must not read private project asset");

    const forbiddenProjectUpload = await uploadFile("project_asset", {
      cookie: clientCookie,
      fileName: "forbidden.png",
      projectId: "project-alpha",
      portalVisible: true,
    });
    assert.equal(forbiddenProjectUpload.response.status, 403, "Client must not upload project assets");

    const clientAvatarUpload = await uploadFile("avatar", {
      cookie: clientCookie,
      fileName: "client-avatar.png",
    });
    assert.equal(clientAvatarUpload.response.status, 201, JSON.stringify(clientAvatarUpload.payload));
    const clientAvatarFileId = clientAvatarUpload.payload.data.id;
    const clientAvatar = await fetch(`${baseUrl}/api/files/${clientAvatarFileId}`, {
      headers: { cookie: clientCookie },
    });
    assert.equal(clientAvatar.status, 200, "Client must read own avatar");
    const deletedAvatar = await fetch(`${baseUrl}/api/files/${clientAvatarFileId}`, {
      method: "DELETE",
      headers: { cookie: clientCookie, origin: baseUrl },
    });
    assert.equal(deletedAvatar.status, 204, "Client must delete own avatar");

    const roleViolation = await jsonRequest("/api/portal-invitations", {
      method: "POST",
      cookie: clientCookie,
      body: { clientId: "forbidden-client", email: "forbidden@example.com" },
    });
    assert.equal(roleViolation.response.status, 403, "Client must not create invitations");

    const disableClient = await jsonRequest("/api/portal-clients/client-alpha", {
      method: "PATCH",
      cookie: ownerCookie,
      body: { enabled: false },
    });
    assert.equal(disableClient.response.ok, true);
    const revokedSession = await fetch(`${baseUrl}/api/auth/get-session`, {
      headers: { cookie: clientCookie },
    });
    assert.equal((await revokedSession.json()), null, "Disabling a client must revoke active sessions");

    const disabledSignIn = await authPost("/api/auth/sign-in/email", {
      email: "client@example.com",
      password: "Client-Password-123",
    });
    assert.equal(disabledSignIn.response.ok, false, "Disabled client must not create a session directly");

    const enableClient = await jsonRequest("/api/portal-clients/client-alpha", {
      method: "PATCH",
      cookie: ownerCookie,
      body: { enabled: true },
    });
    assert.equal(enableClient.response.ok, true);
    const enabledSignIn = await authPost("/api/auth/sign-in/email", {
      email: "client@example.com",
      password: "Client-Password-123",
    });
    assert.equal(enabledSignIn.response.ok, true, "Re-enabled client must be able to sign in");

    const expiringInvite = await jsonRequest("/api/portal-invitations", {
      method: "POST",
      cookie: ownerCookie,
      body: { clientId: "client-expired", email: "expired@example.com" },
    });
    const rawExpiredToken = tokenFromUrl(expiringInvite.payload.invitation.invitationUrl);
    db.prepare("update portal_invitations set expires_at = ? where id = ?").run(
      Date.now() - 1000,
      expiringInvite.payload.invitation.id,
    );
    const expired = await acceptInvite(rawExpiredToken);
    assert.equal(expired.response.status, 409);
    assert.equal(expired.payload.code, "INVITATION_EXPIRED");
    assert.equal(
      db.prepare("select status from portal_invitations where id = ?").get(expiringInvite.payload.invitation.id).status,
      "expired",
    );

    const manualRevokeInvite = await jsonRequest("/api/portal-invitations", {
      method: "POST",
      cookie: ownerCookie,
      body: { clientId: "client-revoked", email: "revoked@example.com" },
    });
    const rawRevokedToken = tokenFromUrl(manualRevokeInvite.payload.invitation.invitationUrl);
    const revoked = await jsonRequest(
      `/api/portal-invitations/${manualRevokeInvite.payload.invitation.id}`,
      { method: "DELETE", cookie: ownerCookie },
    );
    assert.equal(revoked.response.ok, true);
    assert.equal((await acceptInvite(rawRevokedToken)).response.status, 409);

    const auditTypes = new Set(
      db.prepare("select distinct type from auth_audit_events").all().map((row) => row.type),
    );
    for (const requiredType of [
      "setup_started",
      "setup_completed",
      "registration_rejected",
      "login_succeeded",
      "login_failed",
      "invitation_created",
      "invitation_accepted",
      "invitation_revoked",
      "invitation_expired",
      "client_access_disabled",
      "client_access_enabled",
    ]) {
      assert.ok(auditTypes.has(requiredType), `Missing audit event: ${requiredType}`);
    }

    const signOut = await authPost("/api/auth/sign-out", {}, ownerCookie);
    assert.equal(signOut.response.ok, true);
    const ownerSessionAfterLogout = await fetch(`${baseUrl}/api/auth/get-session`, {
      headers: { cookie: ownerCookie },
    });
    assert.equal(await ownerSessionAfterLogout.json(), null, "Logout must revoke owner session");
  } finally {
    db.close();
  }

  console.log("Phase 1 auth and invitation smoke passed.");
} catch (error) {
  console.error(serverOutput);
  throw error;
} finally {
  if (server.pid && process.platform !== "win32") {
    try {
      process.kill(-server.pid, "SIGTERM");
    } catch {}
  } else {
    server.kill("SIGTERM");
  }
  await Promise.race([
    new Promise((resolve) => server.once("exit", resolve)),
    new Promise((resolve) => setTimeout(resolve, 5000)),
  ]);
}

async function acceptInvite(token) {
  return jsonRequest("/api/portal-invitations/accept", {
    method: "POST",
    body: { token, displayName: "Portal Client", password: "Client-Password-123" },
  });
}

async function authPost(pathname, body, cookie) {
  return jsonRequest(pathname, { method: "POST", body, cookie });
}

async function uploadFile(kind, { cookie, fileName, projectId, portalVisible } = {}) {
  const formData = new FormData();
  formData.set("kind", kind);
  formData.set("file", new Blob([PNG_BYTES], { type: "image/png" }), fileName ?? "upload.png");
  if (projectId) formData.set("projectId", projectId);
  if (portalVisible !== undefined) formData.set("portalVisible", String(portalVisible));
  const headers = { origin: baseUrl };
  if (cookie) headers.cookie = cookie;
  const response = await fetch(`${baseUrl}/api/files`, { method: "POST", headers, body: formData });
  const text = await response.text();
  return { response, payload: text ? JSON.parse(text) : null };
}

async function jsonRequest(pathname, { method, body, cookie } = {}) {
  const headers = { origin: baseUrl };
  if (body !== undefined) headers["content-type"] = "application/json";
  if (cookie) headers.cookie = cookie;

  const response = await fetch(`${baseUrl}${pathname}`, {
    method: method ?? "GET",
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await response.text();
  const payload = text ? JSON.parse(text) : null;
  return { response, payload };
}

function cookieHeader(response) {
  const values = response.headers.getSetCookie?.() ?? [];
  const fallback = response.headers.get("set-cookie");
  return (values.length > 0 ? values : fallback ? [fallback] : [])
    .map((value) => value.split(";", 1)[0])
    .join("; ");
}

function tokenFromUrl(value) {
  return new URL(value).pathname.split("/").at(-1);
}

function sha256(value) {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

async function waitForServer() {
  const deadline = Date.now() + 60_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Next.js server exited early (${server.exitCode}).\n${serverOutput}`);
    }
    try {
      const response = await fetch(`${baseUrl}/api/health/live`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for Next.js server.\n${serverOutput}`);
}

function getAvailablePort() {
  return new Promise((resolve, reject) => {
    const listener = net.createServer();
    listener.once("error", reject);
    listener.listen(0, "127.0.0.1", () => {
      const address = listener.address();
      listener.close(() => resolve(address.port));
    });
  });
}
