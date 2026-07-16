import fs from "node:fs";
import path from "node:path";
import { and, eq } from "drizzle-orm";
import { clients, projects } from "../db/schema/domain";
import { files } from "../db/schema/storage";
import { user } from "../db/schema/auth";
import { assertEnabledActor, requireClientScope, requireOwnerScope, type DomainActor } from "../domain/actor";
import type { DomainDatabase } from "../domain/database";
import { DomainError, notFound } from "../domain/errors";
import { generateId, type IdGenerator } from "../domain/id";
import type { FileKind, FileVisibility } from "../domain/types";
import { createFileRepository } from "../repositories/files";
import { buildStoragePath, resolveStoragePath } from "./paths";
import { validateUpload } from "./policy";

export type FileStorageConfig = { uploadsDir: string; tmpDir: string };

export type FileUploadInput = {
  kind: FileKind;
  originalName: string;
  claimedMimeType: string;
  bytes: Uint8Array;
  projectId?: string;
  portalVisible?: boolean;
};

export type StoredFile = typeof files.$inferSelect;

export class FileService {
  private readonly repository;

  constructor(
    private readonly db: DomainDatabase,
    private readonly config: FileStorageConfig,
    private readonly id: IdGenerator = generateId,
  ) {
    this.repository = createFileRepository(db);
  }

  upload(actor: DomainActor, input: FileUploadInput): StoredFile {
    assertEnabledActor(actor);
    const upload = validateUpload(input);
    const fileId = this.id();
    const resource = this.resolveUploadResource(actor, input);
    const storagePath = buildStoragePath(directoryFor(input.kind), fileId, upload.extension);
    const finalPath = resolveStoragePath(this.config.uploadsDir, storagePath);
    const temporaryPath = path.join(this.config.tmpDir, `upload-${fileId}.tmp`);

    fs.mkdirSync(path.dirname(finalPath), { recursive: true });
    fs.mkdirSync(this.config.tmpDir, { recursive: true });
    fs.writeFileSync(temporaryPath, upload.bytes, { flag: "wx", mode: 0o600 });
    let finalCreated = false;

    try {
      fs.linkSync(temporaryPath, finalPath);
      finalCreated = true;
      fs.unlinkSync(temporaryPath);
      return this.db.transaction((tx) => {
        const stored = tx.insert(files).values({
          id: fileId,
          ownerUserId: resource.ownerUserId,
          uploadedByUserId: actor.authUserId,
          authUserId: resource.authUserId,
          projectId: resource.projectId,
          kind: input.kind,
          visibility: resource.visibility,
          storagePath,
          originalName: upload.originalName,
          mimeType: upload.mimeType,
          byteSize: upload.byteSize,
          sha256: upload.sha256,
        }).returning().get();

        if (input.kind === "avatar") {
          tx.update(user)
            .set({ image: `/api/files/${fileId}`, updatedAt: new Date() })
            .where(eq(user.id, actor.authUserId))
            .run();
        }
        return stored;
      }, { behavior: "immediate" });
    } catch (error) {
      safeUnlink(temporaryPath);
      if (finalCreated) safeUnlink(finalPath);
      throw error;
    }
  }

  read(actor: DomainActor, id: string): { metadata: StoredFile; bytes: Buffer } {
    assertEnabledActor(actor);
    const metadata = this.repository.get(id) ?? this.throwNotFound();
    this.assertCanRead(actor, metadata);
    return { metadata, bytes: this.readStoredBytes(metadata) };
  }

  readPublicBranding(id: string): { metadata: StoredFile; bytes: Buffer } {
    const metadata = this.repository.getPublicBrandingAsset(id) ?? this.throwNotFound();
    return { metadata, bytes: this.readStoredBytes(metadata) };
  }

  delete(actor: DomainActor, id: string): StoredFile {
    assertEnabledActor(actor);
    const metadata = this.repository.get(id) ?? this.throwNotFound();
    this.assertCanDelete(actor, metadata);

    const finalPath = resolveStoragePath(this.config.uploadsDir, metadata.storagePath);
    const trashPath = path.join(this.config.tmpDir, `delete-${metadata.id}.tmp`);
    fs.mkdirSync(this.config.tmpDir, { recursive: true });
    const exists = fs.existsSync(finalPath);
    if (exists) fs.renameSync(finalPath, trashPath);

    try {
      const removed = this.db.transaction((tx) => {
        if (metadata.kind === "avatar" && metadata.authUserId) {
          tx.update(user)
            .set({ image: null, updatedAt: new Date() })
            .where(
              and(
                eq(user.id, metadata.authUserId),
                eq(user.image, `/api/files/${metadata.id}`),
              ),
            )
            .run();
        }
        return tx.delete(files).where(eq(files.id, metadata.id)).returning().get();
      }, { behavior: "immediate" });
      if (!removed) throw notFound("Dosya");
      safeUnlink(trashPath);
      return removed;
    } catch (error) {
      if (exists && fs.existsSync(trashPath)) fs.renameSync(trashPath, finalPath);
      throw error;
    }
  }

  private resolveUploadResource(actor: DomainActor, input: FileUploadInput): {
    ownerUserId: string;
    authUserId: string | null;
    projectId: string | null;
    visibility: FileVisibility;
  } {
    if (input.kind === "avatar") {
      const ownerUserId = actor.role === "freelancer"
        ? requireOwnerScope(actor).ownerUserId
        : this.getClientOwner(actor);
      return { ownerUserId, authUserId: actor.authUserId, projectId: null, visibility: "private" };
    }

    const scope = requireOwnerScope(actor);
    if (input.kind === "branding_logo" || input.kind === "branding_icon") {
      return { ownerUserId: scope.ownerUserId, authUserId: null, projectId: null, visibility: "public_branding" };
    }

    if (!input.projectId) {
      throw new DomainError("VALIDATION_ERROR", "Project asset için projectId zorunludur.");
    }
    const project = this.db
      .select({ id: projects.id })
      .from(projects)
      .where(and(eq(projects.id, input.projectId), eq(projects.ownerUserId, scope.ownerUserId)))
      .get();
    if (!project) throw notFound("Proje");
    return {
      ownerUserId: scope.ownerUserId,
      authUserId: null,
      projectId: project.id,
      visibility: input.portalVisible ? "portal" : "private",
    };
  }

  private assertCanRead(actor: DomainActor, file: StoredFile): void {
    if (actor.role === "freelancer") {
      if (file.ownerUserId !== requireOwnerScope(actor).ownerUserId) throw notFound("Dosya");
      return;
    }
    const scope = requireClientScope(actor);
    if (file.kind === "avatar" && file.authUserId === scope.authUserId) return;
    if (file.kind === "project_asset" && file.visibility === "portal" && file.projectId) {
      this.getClientOwner(actor);
      const project = this.db
        .select({ id: projects.id })
        .from(projects)
        .where(and(eq(projects.id, file.projectId), eq(projects.clientId, scope.clientId)))
        .get();
      if (project) return;
    }
    throw notFound("Dosya");
  }

  private assertCanDelete(actor: DomainActor, file: StoredFile): void {
    if (actor.role === "freelancer" && file.ownerUserId === actor.authUserId) return;
    if (actor.role === "client" && file.kind === "avatar" && file.authUserId === actor.authUserId) return;
    throw new DomainError("FORBIDDEN", "Bu dosyayı silme yetkiniz yok.");
  }

  private getClientOwner(actor: DomainActor): string {
    const scope = requireClientScope(actor);
    const client = this.db
      .select({ ownerUserId: clients.ownerUserId })
      .from(clients)
      .where(and(eq(clients.id, scope.clientId), eq(clients.authUserId, scope.authUserId)))
      .get();
    if (!client) throw new DomainError("FORBIDDEN", "Geçerli müşteri bağı bulunamadı.");
    return client.ownerUserId;
  }

  private readStoredBytes(metadata: StoredFile): Buffer {
    const absolutePath = resolveStoragePath(this.config.uploadsDir, metadata.storagePath);
    let descriptor: number | undefined;
    try {
      descriptor = fs.openSync(absolutePath, fs.constants.O_RDONLY | fs.constants.O_NOFOLLOW);
      const stat = fs.fstatSync(descriptor);
      if (!stat.isFile() || stat.size !== metadata.byteSize) {
        throw new DomainError("INVARIANT_VIOLATION", "Dosya metadata ile uyuşmuyor.");
      }
      return fs.readFileSync(descriptor);
    } catch (error) {
      if (error instanceof DomainError) throw error;
      throw notFound("Dosya içeriği");
    } finally {
      if (descriptor !== undefined) fs.closeSync(descriptor);
    }
  }

  private throwNotFound(): never {
    throw notFound("Dosya");
  }
}

function directoryFor(kind: FileKind): string {
  if (kind === "avatar") return "avatars";
  if (kind === "project_asset") return "project-assets";
  return "branding";
}

function safeUnlink(filePath: string): void {
  try {
    fs.unlinkSync(filePath);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") throw error;
  }
}
