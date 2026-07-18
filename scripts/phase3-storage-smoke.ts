import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/better-sqlite3";
import * as schema from "../server/db/schema";
import { BrandingService, contrastRatio, deriveAccentColor } from "../server/branding/service";
import type { DomainActor } from "../server/domain/actor";
import { DomainError } from "../server/domain/errors";
import { resolveStoragePath } from "../server/files/paths";
import { MAX_UPLOAD_BYTES } from "../server/files/policy";
import { FileService } from "../server/files/service";
import { DomainService } from "../server/services/domain";

const dataDir = process.argv[2];
assert.ok(dataDir, "Data directory is required");
const databasePath = path.join(dataDir, "neta.db");
const uploadsDir = path.join(dataDir, "uploads");
const tmpDir = path.join(dataDir, "tmp");
const sqlite = new Database(databasePath);
sqlite.pragma("foreign_keys = ON");
const db = drizzle({ client: sqlite, schema });
let generatedId = 0;
const fileService = new FileService(db, { uploadsDir, tmpDir }, () => `file-${++generatedId}`);
const brandingService = new BrandingService(db);
const domainService = new DomainService(db, () => `domain-${++generatedId}`);

const ownerOne: DomainActor = { authUserId: "owner-1", role: "freelancer", clientId: null, disabled: false };
const ownerTwo: DomainActor = { authUserId: "owner-2", role: "freelancer", clientId: null, disabled: false };
const clientOne: DomainActor = { authUserId: "client-user-1", role: "client", clientId: "client-1", disabled: false };
const clientTwo: DomainActor = { authUserId: "client-user-2", role: "client", clientId: "client-2", disabled: false };
const spoofedClient: DomainActor = { authUserId: "client-user-2", role: "client", clientId: "client-1", disabled: false };
const png = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);

try {
  for (const actor of [ownerOne, ownerTwo, clientOne, clientTwo]) {
    db.insert(schema.user).values({
      id: actor.authUserId,
      name: actor.authUserId,
      email: `${actor.authUserId}@example.com`,
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).run();
  }
  domainService.createClient(ownerOne, { id: "client-1", name: "Client One" });
  domainService.createClient(ownerOne, { id: "client-2", name: "Client Two" });
  domainService.createClient(ownerTwo, { id: "client-other", name: "Other Client" });
  db.update(schema.clients).set({ authUserId: clientOne.authUserId }).where(eq(schema.clients.id, "client-1")).run();
  db.update(schema.clients).set({ authUserId: clientTwo.authUserId }).where(eq(schema.clients.id, "client-2")).run();
  domainService.createProject(ownerOne, { id: "project-1", name: "Portal Project", clientId: "client-1", status: "active" });
  domainService.createProject(ownerOne, { id: "project-2", name: "Private Project", clientId: "client-2", status: "active" });
  domainService.createProject(ownerTwo, { id: "project-other", name: "Other Project", clientId: "client-other", status: "active" });

  const ownerAvatar = fileService.upload(ownerOne, imageInput("avatar", "../owner avatar.png"));
  const clientAvatar = fileService.upload(clientOne, imageInput("avatar", "client.png"));
  assert.equal(ownerAvatar.storagePath, `avatars/${ownerAvatar.id}.png`);
  assert.equal(ownerAvatar.originalName, "..-owner avatar.png");
  assert.equal(db.select({ image: schema.user.image }).from(schema.user).where(eq(schema.user.id, ownerOne.authUserId)).get()?.image, `/api/files/${ownerAvatar.id}`);
  assert.deepEqual(fileService.read(clientOne, clientAvatar.id).bytes, Buffer.from(png));
  const collisionService = new FileService(db, { uploadsDir, tmpDir }, () => ownerAvatar.id);
  assert.throws(
    () => collisionService.upload(ownerOne, imageInput("avatar", "collision.png")),
    /EEXIST/,
    "A generated path collision must never overwrite the existing file",
  );
  assert.deepEqual(fileService.read(ownerOne, ownerAvatar.id).bytes, Buffer.from(png));
  assertDomainError(() => fileService.read(clientOne, ownerAvatar.id), "NOT_FOUND");
  assertDomainError(() => fileService.read(ownerTwo, ownerAvatar.id), "NOT_FOUND");

  const lightLogo = fileService.upload(ownerOne, imageInput("branding_logo", "light-logo.png"));
  const darkLogo = fileService.upload(ownerOne, imageInput("branding_logo", "dark-logo.png"));
  const icon = fileService.upload(ownerOne, imageInput("branding_icon", "icon.png"));
  assertDomainError(() => fileService.readPublicBranding(lightLogo.id), "NOT_FOUND");
  const branding = brandingService.update(ownerOne, {
    applicationName: "Studio Portal Meta",
    shortName: "Studio",
    organizationName: "Studio Portal",
    primaryColor: "#336699",
    lightLogoFileId: lightLogo.id,
    darkLogoFileId: darkLogo.id,
    iconFileId: icon.id,
    defaultColorMode: "dark",
    radiusScale: "soft",
  });
  assert.equal(branding.applicationName, "Studio Portal Meta");
  assert.equal(branding.organizationName, "Studio Portal");
  assert.equal(branding.primaryColor, "#336699");
  assert.equal(branding.accentColor, deriveAccentColor("#336699"), "Accent palette must derive from the single primary color");
  assert.notEqual(branding.darkLogoUrl, branding.lightLogoUrl, "Light and dark logos must remain distinct");
  assert.equal(fileService.readPublicBranding(lightLogo.id).metadata.id, lightLogo.id);
  assert.equal(fileService.readPublicBranding(darkLogo.id).metadata.id, darkLogo.id);
  assert.equal(fileService.readPublicBranding(icon.id).metadata.id, icon.id);
  assert.ok(contrastRatio(branding.primaryColor, branding.cssVariables["--poyraz-primary-foreground"]) >= 4.5);
  assert.equal(
    branding.cssVariables["--poyraz-accent"],
    undefined,
    "Poyraz must own the light/dark semantic accent surface",
  );
  assert.equal(
    branding.cssVariables["--poyraz-accent-foreground"],
    undefined,
    "Poyraz must own the light/dark semantic accent foreground",
  );
  assert.equal(
    branding.cssVariables["--poyraz-accent-hover"],
    undefined,
    "Poyraz must own the light/dark semantic accent hover surface",
  );
  assertDomainError(() => brandingService.update(clientOne, { applicationName: "Attack" }), "FORBIDDEN");
  assertDomainError(() => brandingService.update(ownerTwo, { applicationName: "Attack" }), "FORBIDDEN");
  assertDomainError(() => brandingService.update(ownerOne, { primaryColor: "red" }), "VALIDATION_ERROR");

  const portalAsset = fileService.upload(ownerOne, {
    ...imageInput("project_asset", "cover.png"),
    projectId: "project-1",
    portalVisible: true,
  });
  const privateAsset = fileService.upload(ownerOne, {
    ...imageInput("project_asset", "private.png"),
    projectId: "project-1",
    portalVisible: false,
  });
  assert.equal(fileService.read(clientOne, portalAsset.id).metadata.id, portalAsset.id);
  assertDomainError(() => fileService.read(clientOne, privateAsset.id), "NOT_FOUND");
  assertDomainError(() => fileService.read(clientTwo, portalAsset.id), "NOT_FOUND");
  assertDomainError(() => fileService.read(spoofedClient, portalAsset.id), "FORBIDDEN");
  assertDomainError(
    () => fileService.upload(clientOne, { ...imageInput("project_asset", "attack.png"), projectId: "project-1" }),
    "FORBIDDEN",
  );
  assertDomainError(
    () => fileService.upload(ownerOne, { ...imageInput("project_asset", "foreign.png"), projectId: "project-other" }),
    "NOT_FOUND",
  );

  assertDomainError(() => fileService.upload(ownerOne, { ...imageInput("avatar", "fake.png"), claimedMimeType: "image/jpeg" }), "VALIDATION_ERROR");
  assertDomainError(() => fileService.upload(ownerOne, { ...imageInput("avatar", "fake.svg"), claimedMimeType: "image/svg+xml" }), "VALIDATION_ERROR");
  assertDomainError(() => fileService.upload(ownerOne, { ...imageInput("avatar", "large.png"), bytes: new Uint8Array(MAX_UPLOAD_BYTES + 1) }), "VALIDATION_ERROR");
  assertDomainError(() => fileService.upload(ownerOne, { ...imageInput("avatar", "bad.png"), bytes: Uint8Array.from([1, 2, 3]) }), "VALIDATION_ERROR");

  for (const candidate of ["../secret", "/etc/passwd", "project-assets/../../secret", "project-assets\\secret"] ) {
    assertDomainError(() => resolveStoragePath(uploadsDir, candidate), "VALIDATION_ERROR");
  }

  const outsidePath = path.join(dataDir, "outside.png");
  fs.writeFileSync(outsidePath, png);
  const symlinkPath = path.join(uploadsDir, "project-assets", "symlink.png");
  fs.symlinkSync(outsidePath, symlinkPath);
  db.insert(schema.files).values({
    id: "symlink-file",
    ownerUserId: ownerOne.authUserId,
    uploadedByUserId: ownerOne.authUserId,
    projectId: "project-1",
    kind: "project_asset",
    visibility: "private",
    storagePath: "project-assets/symlink.png",
    originalName: "symlink.png",
    mimeType: "image/png",
    byteSize: png.byteLength,
    sha256: "0".repeat(64),
  }).run();
  assertDomainError(() => fileService.read(ownerOne, "symlink-file"), "NOT_FOUND");
  fileService.delete(ownerOne, "symlink-file");
  assert.equal(fs.readFileSync(outsidePath).byteLength, png.byteLength, "Deleting symlink metadata must not delete target");

  assert.throws(
    () => sqlite.prepare("insert into files (id, owner_user_id, uploaded_by_user_id, project_id, kind, visibility, storage_path, original_name, mime_type, byte_size, sha256) values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run("invalid-path", ownerOne.authUserId, ownerOne.authUserId, "project-1", "project_asset", "private", "../escape.png", "escape.png", "image/png", 1, "0".repeat(64)),
    /CHECK constraint failed/,
  );

  const avatarPath = resolveStoragePath(uploadsDir, ownerAvatar.storagePath);
  assert.ok(fs.existsSync(avatarPath));
  fileService.delete(ownerOne, ownerAvatar.id);
  assert.equal(fs.existsSync(avatarPath), false);
  assert.equal(db.select({ image: schema.user.image }).from(schema.user).where(eq(schema.user.id, ownerOne.authUserId)).get()?.image, null);

  const logoPath = resolveStoragePath(uploadsDir, lightLogo.storagePath);
  fileService.delete(ownerOne, lightLogo.id);
  assert.equal(fs.existsSync(logoPath), false);
  assert.equal(brandingService.getPublic().lightLogoFileId, null, "Deleting a logo must clear branding reference");
  assert.equal(
    brandingService.getPublic().lightLogoUrl,
    brandingService.getPublic().darkLogoUrl,
    "Missing light logo must safely fall back to the configured dark logo",
  );

  console.log("Phase 3 storage smoke passed: uploads, authorization, path safety, branding and deletion verified.");
} finally {
  sqlite.close();
}

function imageInput(kind: "avatar" | "branding_logo" | "branding_icon" | "project_asset", originalName: string) {
  return { kind, originalName, claimedMimeType: "image/png", bytes: png } as const;
}

function assertDomainError(run: () => unknown, code: DomainError["code"]) {
  assert.throws(run, (error) => error instanceof DomainError && error.code === code);
}
