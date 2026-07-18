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
const distDir = `.next-phase1-auth-smoke-${Date.now()}`;
const nextGeneratedConfigFiles = ["next-env.d.ts", "tsconfig.json"].map((file) => ({
  file,
  content: fs.readFileSync(path.join(process.cwd(), file), "utf8"),
}));
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
  NETA_MINIMUM_MOBILE_VERSION: "1.2.3-smoke.1",
  NEXT_DIST_DIR: distDir,
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

  const discoveryResponses = await Promise.all(
    Array.from({ length: 4 }, () => fetch(`${baseUrl}/.well-known/neta`)),
  );
  const discoveryDocuments = await Promise.all(
    discoveryResponses.map(async (response) => {
      assert.equal(response.status, 200, "Neta discovery must be public");
      assert.match(
        response.headers.get("cache-control") ?? "",
        /public/,
        "Discovery must declare its public cache policy",
      );
      assert.equal(response.headers.get("set-cookie"), null, "Discovery must not create a session");
      return response.json();
    }),
  );
  const discovery = discoveryDocuments[0];
  assert.equal(discovery.protocol, "neta");
  assert.equal(discovery.discoveryVersion, 1);
  assert.match(discovery.instanceId, /^[0-9a-f-]{36}$/i);
  assert.equal(discovery.api.version, "1");
  assert.equal(discovery.api.baseUrl, `${baseUrl}/api/v1`);
  assert.equal(discovery.api.metaUrl, `${baseUrl}/api/v1/meta`);
  assert.equal(discovery.security.httpsRequired, true);
  assert.deepEqual(
    new Set(discoveryDocuments.map((document) => document.instanceId)),
    new Set([discovery.instanceId]),
    "Concurrent discovery must return one stable instance id",
  );

  const publicMeta = await jsonRequest("/api/v1/meta");
  assert.equal(publicMeta.response.status, 200);
  assert.equal(publicMeta.response.headers.get("x-neta-api-version"), "1");
  assert.equal(publicMeta.payload.ok, true);
  assert.equal(publicMeta.payload.data.instance.id, discovery.instanceId);
  assert.match(
    publicMeta.payload.data.instance.createdAt,
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/,
    "Instance timestamps must use UTC ISO-8601",
  );
  assert.equal(publicMeta.payload.data.client.minimumSupportedVersion, "1.2.3-smoke.1");
  assert.equal(publicMeta.payload.data.links.me, `${baseUrl}/api/v1/me`);
  assert.deepEqual(publicMeta.payload.data.client.platforms, ["ios", "android"]);
  assert.deepEqual(
    publicMeta.payload.data.capabilities.find(
      (capability) => capability.id === "auth.device-pairing",
    ),
    {
      id: "auth.device-pairing",
      version: 1,
      status: "planned",
      access: "freelancer",
    },
  );

  const publicV1Health = await jsonRequest("/api/v1/health");
  assert.equal(publicV1Health.response.status, 200);
  assert.deepEqual(
    {
      ok: publicV1Health.payload.ok,
      status: publicV1Health.payload.data.status,
      migrationsApplied: publicV1Health.payload.data.checks.migrationsApplied,
    },
    { ok: true, status: "ok", migrationsApplied: true },
  );

  const anonymousMe = await jsonRequest("/api/v1/me");
  assert.equal(anonymousMe.response.status, 401);
  assert.equal(anonymousMe.response.headers.get("x-neta-api-version"), "1");
  assert.deepEqual(
    { ok: anonymousMe.payload.ok, code: anonymousMe.payload.error.code },
    { ok: false, code: "UNAUTHENTICATED" },
  );

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
    assert.deepEqual(
      db.prepare("select instance_id as instanceId from instance_settings").all(),
      [{ instanceId: discovery.instanceId }],
      "Discovery identity must be persisted exactly once",
    );
    const ownerMe = await jsonRequest("/api/v1/me", { cookie: ownerCookie });
    assert.equal(ownerMe.response.status, 200);
    assert.deepEqual(
      {
        id: ownerMe.payload.data.user.id,
        email: ownerMe.payload.data.user.email,
        role: ownerMe.payload.data.user.role,
        clientId: ownerMe.payload.data.user.clientId,
      },
      {
        id: ownerUserId,
        email: ownerEmail,
        role: "freelancer",
        clientId: null,
      },
    );
    assert.equal(ownerMe.payload.data.preferences.colorMode, "system");
    assert.doesNotMatch(
      JSON.stringify(ownerMe.payload),
      /token|password/i,
      "The me contract must not expose session tokens or password material",
    );
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
    db.prepare("update projects set revision_quota = ? where id = ?").run(2, "project-alpha");
    db.prepare(
      "insert into projects (id, owner_user_id, client_id, name, status) values (?, ?, ?, ?, ?)",
    ).run("project-foreign", ownerUserId, "client-expired", "Foreign Project", "active");
    db.prepare(
      "insert into tasks (id, owner_user_id, client_id, project_id, title, status, priority, is_public_to_client) values (?, ?, ?, ?, ?, ?, ?, ?)",
    ).run("task-portal-public", ownerUserId, "client-alpha", "project-alpha", "Portal Public Task", "todo", "medium", 1);
    db.prepare(
      "insert into tasks (id, owner_user_id, client_id, project_id, title, status, priority, is_public_to_client) values (?, ?, ?, ?, ?, ?, ?, ?)",
    ).run("task-portal-private", ownerUserId, "client-alpha", "project-alpha", "Portal Private Task", "todo", "medium", 0);
    db.prepare(
      "insert into project_planning_sections (id, owner_user_id, project_id, category, title, content, metadata, sort_order) values (?, ?, ?, ?, ?, ?, ?, ?)",
    ).run("planning-portal", ownerUserId, "project-alpha", "overview", "Portal Plan", "Visible planning content", "{}", 0);
    db.prepare(
      "insert into finance_transactions (id, owner_user_id, type, amount_minor, currency, transaction_date, payment_status) values (?, ?, ?, ?, ?, ?, ?)",
    ).run(
      "phase7-finance",
      ownerUserId,
      "income",
      10_000,
      "TRY",
      new Date().toISOString().slice(0, 10),
      "paid",
    );
    db.prepare(
      "insert into chat_sessions (id, owner_user_id, title) values (?, ?, ?)",
    ).run("phase7-chat", ownerUserId, "Phase 7 Chat");
    db.prepare(
      "insert into proposals (id, owner_user_id, client_id, project_id, title, amount_minor, currency, status) values (?, ?, ?, ?, ?, ?, ?, ?)",
    ).run("phase7-proposal", ownerUserId, "client-alpha", "project-alpha", "Phase 7 Proposal", 25_000, "TRY", "draft");
    db.prepare(
      "insert into invoices (id, owner_user_id, client_id, project_id, invoice_number, amount_minor, currency, status, issue_date) values (?, ?, ?, ?, ?, ?, ?, ?, ?)",
    ).run("phase7-invoice", ownerUserId, "client-alpha", "project-alpha", "P7-001", 25_000, "TRY", "draft", "2026-07-17");
    db.prepare(
      "insert into subscriptions (id, owner_user_id, name, amount_minor, currency, billing_cycle, status) values (?, ?, ?, ?, ?, ?, ?)",
    ).run("phase7-subscription", ownerUserId, "Phase 7 Hosting", 5_000, "TRY", "monthly", "active");

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

    for (const pathname of [
      "/",
      "/clients",
      "/clients/client-alpha",
      "/projects",
      "/projects/project-alpha",
      "/tasks",
      "/calendar",
      "/finance",
      "/journal",
      "/analytics",
      "/settings",
      "/chat",
      "/business/proposals",
      "/business/invoices",
      "/business/subscriptions",
    ]) {
      const page = await fetch(`${baseUrl}${pathname}`, {
        headers: { cookie: ownerCookie },
        redirect: "manual",
      });
      assert.equal(page.status, 200, `Freelancer SSR route failed: ${pathname}`);
      assert.doesNotMatch(await page.text(), /lib\/supabase|supabase\.co/i, `SSR output leaked Supabase: ${pathname}`);
    }

    for (const [pathname, body] of [
      ["/api/finance-analysis", undefined],
      ["/api/project-risk", { projectId: "project-alpha" }],
    ]) {
      const anonymousAi = await jsonRequest(pathname, {
        method: "POST",
        body,
      });
      assert.equal(anonymousAi.response.status, 401, `Anonymous AI request must fail: ${pathname}`);

      const missingAiSettings = await jsonRequest(pathname, {
        method: "POST",
        cookie: ownerCookie,
        body,
      });
      assert.equal(missingAiSettings.response.status, 400, `Missing AI key must fail: ${pathname}`);
    }
    const chatBody = {
      id: "phase7-client-chat",
      sessionId: "phase7-chat",
      trigger: "submit-message",
      messageId: "phase7-user-message",
      messages: [{
        id: "phase7-user-message",
        role: "user",
        parts: [{ type: "text", text: "Projeyi özetle" }],
      }],
    };
    const anonymousChat = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "content-type": "application/json", origin: baseUrl },
      body: JSON.stringify(chatBody),
    });
    assert.equal(anonymousChat.status, 401, "Anonymous chat request must fail");

    const invalidChatRequest = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: ownerCookie,
        origin: baseUrl,
      },
      body: JSON.stringify({
        id: "phase7-invalid-chat",
        sessionId: "phase7-chat",
        trigger: "submit-message",
        messages: [],
      }),
    });
    assert.equal(invalidChatRequest.status, 400);
    assert.equal(invalidChatRequest.headers.get("x-neta-error-code"), "VALIDATION_ERROR");
    assert.match(
      await invalidChatRequest.text(),
      /"messages" alanı boş olamaz/,
      "Chat validation errors must identify the invalid request field",
    );

    const missingChatSettings = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: ownerCookie,
        origin: baseUrl,
      },
      body: JSON.stringify(chatBody),
    });
    assert.equal(missingChatSettings.status, 400, "Missing AI key must fail: /api/chat");
    assert.match(
      await missingChatSettings.text(),
      /AI sağlayıcısı ve API anahtarı/,
      "The AI SDK v6 transport envelope must pass request validation and reach provider settings",
    );
    assert.equal(
      db.prepare("select count(*) as value from chat_messages where session_id = ?")
        .get("phase7-chat").value,
      0,
      "A rejected AI request must not append chat messages",
    );

    const anonymousUpload = await uploadFile("avatar", { fileName: "anonymous.png" });
    assert.equal(anonymousUpload.response.status, 401, "Anonymous file upload must fail");
    assert.deepEqual(
      { ok: anonymousUpload.payload.ok, code: anonymousUpload.payload.error.code },
      { ok: false, code: "UNAUTHENTICATED" },
      "File API errors must use the standard envelope",
    );

    const lightLogoUpload = await uploadFile("branding_logo", {
      cookie: ownerCookie,
      fileName: "light-logo.png",
    });
    const darkLogoUpload = await uploadFile("branding_logo", {
      cookie: ownerCookie,
      fileName: "dark-logo.png",
    });
    const faviconUpload = await uploadFile("branding_icon", {
      cookie: ownerCookie,
      fileName: "favicon.png",
    });
    for (const upload of [lightLogoUpload, darkLogoUpload, faviconUpload]) {
      assert.equal(upload.response.status, 201, JSON.stringify(upload.payload));
      assert.equal(upload.payload.ok, true, "File API success must use the standard envelope");
    }
    const lightLogoFileId = lightLogoUpload.payload.data.id;
    const darkLogoFileId = darkLogoUpload.payload.data.id;
    const faviconFileId = faviconUpload.payload.data.id;
    const brandingUpdate = await jsonRequest("/api/branding", {
      method: "PATCH",
      cookie: ownerCookie,
      body: {
        applicationName: "Neta Smoke Meta",
        organizationName: "Neta Smoke Studio",
        shortName: "Neta Smoke",
        primaryColor: "#336699",
        accentColor: "#F0CC22",
        lightLogoFileId,
        darkLogoFileId,
        iconFileId: faviconFileId,
      },
    });
    assert.equal(brandingUpdate.response.ok, true, JSON.stringify(brandingUpdate.payload));
    assert.equal(brandingUpdate.payload.data.applicationName, "Neta Smoke Meta");
    assert.equal(brandingUpdate.payload.data.organizationName, "Neta Smoke Studio");
    assert.notEqual(
      brandingUpdate.payload.data.lightLogoUrl,
      brandingUpdate.payload.data.darkLogoUrl,
      "Light and dark logo assets must remain distinct",
    );
    const brandedLoginHtml = await (await fetch(`${baseUrl}/login`)).text();
    assert.match(brandedLoginHtml, /Neta Smoke Studio/, "Workspace branding must be server-rendered");
    assert.match(brandedLoginHtml, /Neta Smoke Meta/, "Meta title must be server-rendered");
    assert.match(brandedLoginHtml, new RegExp(`/api/branding/assets/${lightLogoFileId}`));
    assert.match(brandedLoginHtml, new RegExp(`/api/branding/assets/${darkLogoFileId}`));
    assert.match(brandedLoginHtml, new RegExp(`/api/branding/assets/${faviconFileId}`));
    assert.doesNotMatch(
      brandedLoginHtml,
      /href="\/favicon\.ico"/,
      "Static favicon metadata must not override the active branding favicon",
    );
    assert.match(brandedLoginHtml, /--poyraz-primary:#336699/, "Brand tokens must be present in first HTML response");
    const dynamicManifest = await (await fetch(`${baseUrl}/manifest.webmanifest`)).json();
    assert.equal(dynamicManifest.name, "Neta Smoke Studio", "Manifest must use workspace branding");
    assert.equal(dynamicManifest.short_name, "Neta Smoke");
    assert.equal(dynamicManifest.icons[0].src, `/api/branding/assets/${faviconFileId}`);
    const brandedMeta = await jsonRequest("/api/v1/meta");
    assert.equal(brandedMeta.payload.data.instance.applicationName, "Neta Smoke Meta");
    assert.equal(brandedMeta.payload.data.instance.metaTitle, "Neta Smoke Meta");
    assert.equal(brandedMeta.payload.data.instance.workspaceName, "Neta Smoke Studio");
    assert.equal(
      brandedMeta.payload.data.branding.lightLogoUrl,
      `${baseUrl}/api/branding/assets/${lightLogoFileId}`,
      "Mobile metadata must expose the absolute light logo URL",
    );
    assert.equal(
      brandedMeta.payload.data.branding.darkLogoUrl,
      `${baseUrl}/api/branding/assets/${darkLogoFileId}`,
      "Mobile metadata must expose the absolute dark logo URL",
    );
    assert.equal(
      brandedMeta.payload.data.branding.faviconUrl,
      `${baseUrl}/api/branding/assets/${faviconFileId}`,
      "Mobile metadata must expose the absolute favicon URL",
    );
    const publicLogo = await fetch(`${baseUrl}/api/branding/assets/${lightLogoFileId}`);
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
    db.prepare(
      "insert into project_revisions (id, owner_user_id, project_id, client_id, requested_by_user_id, description, status) values (?, ?, ?, ?, ?, ?, ?)",
    ).run(
      "revision-portal",
      ownerUserId,
      "project-alpha",
      "client-alpha",
      clientAuthUserId,
      "Portal Revision Request",
      "pending",
    );

    const replayed = await acceptInvite(rawClientToken);
    assert.equal(replayed.response.status, 409, "Accepted invitation must be single-use");

    const clientSignIn = await authPost("/api/auth/sign-in/email", {
      email: "client@example.com",
      password: "Client-Password-123",
    });
    assert.equal(clientSignIn.response.ok, true, JSON.stringify(clientSignIn.payload));
    const clientCookie = cookieHeader(clientSignIn.response);
    const clientMe = await jsonRequest("/api/v1/me", { cookie: clientCookie });
    assert.equal(clientMe.response.status, 200);
    assert.deepEqual(
      {
        role: clientMe.payload.data.user.role,
        clientId: clientMe.payload.data.user.clientId,
      },
      { role: "client", clientId: "client-alpha" },
    );

    for (const [pathname, body] of [
      ["/api/finance-analysis", undefined],
      ["/api/project-risk", { projectId: "project-alpha" }],
    ]) {
      const forbiddenAi = await jsonRequest(pathname, {
        method: "POST",
        cookie: clientCookie,
        body,
      });
      assert.equal(forbiddenAi.response.status, 403, `Client AI access must fail: ${pathname}`);
    }
    const forbiddenClientChat = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        cookie: clientCookie,
        origin: baseUrl,
      },
      body: JSON.stringify(chatBody),
    });
    assert.equal(forbiddenClientChat.status, 403, "Client chat access must fail");

    for (const pathname of [
      "/portal",
      "/portal/projects",
      "/portal/projects/project-alpha",
      "/portal/tasks",
      "/portal/revisions",
    ]) {
      const page = await fetch(`${baseUrl}${pathname}`, {
        headers: { cookie: clientCookie },
        redirect: "manual",
      });
      assert.equal(page.status, 200, `Portal SSR route failed: ${pathname}`);
      const html = await page.text();
      assert.doesNotMatch(html, /lib\/supabase|supabase\.co/i, `Portal SSR output leaked Supabase: ${pathname}`);
      if (pathname === "/portal") assert.match(html, /Neta Smoke Studio/, "Portal must render local branding");
      if (pathname === "/portal/tasks" || pathname === "/portal/projects/project-alpha") {
        assert.match(html, /Portal Public Task/, `Public task missing from ${pathname}`);
        assert.doesNotMatch(html, /Portal Private Task/, `Private task leaked from ${pathname}`);
      }
      if (pathname === "/portal/projects/project-alpha") {
        assert.match(html, /Visible planning content/, "Portal planning section must be visible");
      }
      if (pathname === "/portal/revisions") {
        assert.match(html, /Portal Revision Request/, "Portal revision history must be visible");
      }
    }

    const foreignProject = await fetch(`${baseUrl}/portal/projects/project-foreign`, {
      headers: { cookie: clientCookie },
      redirect: "manual",
    });
    assert.equal(foreignProject.status, 404, "Client must not open another client's project");

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
    const revokedClientMe = await jsonRequest("/api/v1/me", { cookie: clientCookie });
    assert.equal(revokedClientMe.response.status, 401, "Disabled client API session must be rejected");

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
  fs.rmSync(path.join(process.cwd(), distDir), { recursive: true, force: true });
  for (const snapshot of nextGeneratedConfigFiles) {
    fs.writeFileSync(path.join(process.cwd(), snapshot.file), snapshot.content);
  }
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
