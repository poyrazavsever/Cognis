import { execFileSync } from "node:child_process";

for (const [command, args] of [
  [process.execPath, ["scripts/phase6-portal-boundary.mjs"]],
  [process.execPath, ["scripts/phase2-domain-smoke.mjs"]],
  [process.execPath, ["scripts/phase3-storage-smoke.mjs"]],
  [process.execPath, ["scripts/phase1-auth-smoke.mjs"]],
]) {
  execFileSync(command, args, { cwd: process.cwd(), stdio: "inherit" });
}

console.log("Phase 6 portal backend smoke passed.");
