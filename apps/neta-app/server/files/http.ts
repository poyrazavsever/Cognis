export function fileResponse(
  metadata: { mimeType: string; originalName: string; sha256: string },
  bytes: Uint8Array,
  cacheControl: string,
) {
  return new Response(bytes as BodyInit, {
    headers: {
      "Cache-Control": cacheControl,
      "Content-Disposition": `inline; filename*=UTF-8''${encodeURIComponent(metadata.originalName)}`,
      "Content-Length": String(bytes.byteLength),
      "Content-Type": metadata.mimeType,
      ETag: `"${metadata.sha256}"`,
      "X-Content-Type-Options": "nosniff",
    },
  });
}
