import { cp, mkdir, stat } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const standaloneDir = path.join(rootDir, ".next", "standalone");

async function requireDirectory(directory, label) {
  const info = await stat(directory).catch(() => null);

  if (!info?.isDirectory()) {
    throw new Error(`${label} bulunamadı: ${directory}`);
  }
}

await requireDirectory(standaloneDir, "Next.js standalone çıktısı");
await requireDirectory(path.join(rootDir, ".next", "static"), "Next.js static çıktısı");
await requireDirectory(path.join(rootDir, "public"), "Public dizini");

await mkdir(path.join(standaloneDir, ".next"), { recursive: true });
await cp(path.join(rootDir, ".next", "static"), path.join(standaloneDir, ".next", "static"), {
  recursive: true,
  force: true,
});
await cp(path.join(rootDir, "public"), path.join(standaloneDir, "public"), {
  recursive: true,
  force: true,
});

console.log("Standalone runtime assets prepared.");
