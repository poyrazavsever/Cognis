import { cp, mkdir, stat } from "node:fs/promises";
import path from "node:path";

const rootDir = process.cwd();
const standaloneDir = path.join(rootDir, ".next", "standalone");
const standaloneAppDir = path.join(standaloneDir, "apps", "neta-app");

async function requireDirectory(directory, label) {
  const info = await stat(directory).catch(() => null);

  if (!info?.isDirectory()) {
    throw new Error(`${label} bulunamadı: ${directory}`);
  }
}

await requireDirectory(standaloneDir, "Next.js standalone çıktısı");
await requireDirectory(standaloneAppDir, "Neta App standalone çıktısı");
await requireDirectory(path.join(rootDir, ".next", "static"), "Next.js static çıktısı");
await requireDirectory(path.join(rootDir, "public"), "Public dizini");

await mkdir(path.join(standaloneAppDir, ".next"), { recursive: true });
await cp(path.join(rootDir, ".next", "static"), path.join(standaloneAppDir, ".next", "static"), {
  recursive: true,
  force: true,
});
await cp(path.join(rootDir, "public"), path.join(standaloneAppDir, "public"), {
  recursive: true,
  force: true,
});

console.log("Standalone runtime assets prepared.");
