import { createHash } from "node:crypto";
import { DomainError } from "../domain/errors";
import type { FileKind } from "../domain/types";

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

const allowedImages = {
  "image/jpeg": { extension: "jpg", matches: isJpeg },
  "image/png": { extension: "png", matches: isPng },
  "image/webp": { extension: "webp", matches: isWebp },
  "image/gif": { extension: "gif", matches: isGif },
} as const;

export type AllowedMimeType = keyof typeof allowedImages;

export type ValidatedUpload = {
  bytes: Uint8Array;
  byteSize: number;
  mimeType: AllowedMimeType;
  extension: string;
  originalName: string;
  sha256: string;
};

export function validateUpload(input: {
  kind: FileKind;
  originalName: string;
  claimedMimeType: string;
  bytes: Uint8Array;
}): ValidatedUpload {
  const byteSize = input.bytes.byteLength;
  if (byteSize === 0) {
    throw new DomainError("VALIDATION_ERROR", "Boş dosya yüklenemez.");
  }
  if (byteSize > MAX_UPLOAD_BYTES) {
    throw new DomainError("VALIDATION_ERROR", "Dosya boyutu 5 MB sınırını aşıyor.", {
      maximumBytes: MAX_UPLOAD_BYTES,
    });
  }

  const mimeType = input.claimedMimeType.toLowerCase() as AllowedMimeType;
  const policy = allowedImages[mimeType];
  if (!policy || (input.kind === "branding_icon" && mimeType !== "image/png")) {
    throw new DomainError(
      "VALIDATION_ERROR",
      "Yalnızca JPEG, PNG, WebP ve desteklenen alanlarda GIF görselleri kabul edilir; uygulama ikonu PNG olmalı ve SVG desteklenmez.",
    );
  }
  if (!policy.matches(input.bytes)) {
    throw new DomainError("VALIDATION_ERROR", "Dosya içeriği bildirilen MIME türüyle uyuşmuyor.");
  }

  return {
    bytes: input.bytes,
    byteSize,
    mimeType,
    extension: policy.extension,
    originalName: normalizeOriginalName(input.originalName),
    sha256: createHash("sha256").update(input.bytes).digest("hex"),
  };
}

export function normalizeOriginalName(value: string): string {
  const normalized = value
    .normalize("NFKC")
    .replace(/[\u0000-\u001f\u007f]/g, "")
    .replace(/[\\/]/g, "-")
    .trim()
    .slice(0, 255);
  return normalized || "upload";
}

function isJpeg(bytes: Uint8Array) {
  return bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
}

function isPng(bytes: Uint8Array) {
  const signature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  return bytes.length >= signature.length && signature.every((value, index) => bytes[index] === value);
}

function isWebp(bytes: Uint8Array) {
  return bytes.length >= 12 && ascii(bytes, 0, 4) === "RIFF" && ascii(bytes, 8, 12) === "WEBP";
}

function isGif(bytes: Uint8Array) {
  const header = ascii(bytes, 0, 6);
  return header === "GIF87a" || header === "GIF89a";
}

function ascii(bytes: Uint8Array, start: number, end: number): string {
  return String.fromCharCode(...bytes.slice(start, end));
}
