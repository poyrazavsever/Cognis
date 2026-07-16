import path from "node:path";
import { DomainError } from "../domain/errors";

export function resolveStoragePath(uploadsDir: string, storagePath: string): string {
  if (
    !storagePath ||
    path.isAbsolute(storagePath) ||
    storagePath.includes("\\") ||
    storagePath.includes("\0")
  ) {
    throw invalidPath();
  }

  const segments = storagePath.split("/");
  if (segments.some((segment) => !segment || segment === "." || segment === "..")) {
    throw invalidPath();
  }

  const root = path.resolve(uploadsDir);
  const resolved = path.resolve(root, ...segments);
  if (!resolved.startsWith(`${root}${path.sep}`)) {
    throw invalidPath();
  }
  return resolved;
}

export function buildStoragePath(directory: string, id: string, extension: string): string {
  if (!/^[a-z-]+$/.test(directory) || !/^[a-zA-Z0-9-]+$/.test(id) || !/^[a-z0-9]+$/.test(extension)) {
    throw invalidPath();
  }
  return `${directory}/${id}.${extension}`;
}

function invalidPath() {
  return new DomainError("VALIDATION_ERROR", "Geçersiz dosya yolu.");
}
