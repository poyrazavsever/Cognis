import { execFileSync } from "node:child_process";

for (const [command, args] of [
  [process.execPath, ["scripts/phase7-backend-boundary.mjs"]],
  [process.execPath, ["scripts/phase7-domain-smoke.mjs"]],
  [process.execPath, ["scripts/phase1-auth-smoke.mjs"]],
]) {
  execFileSync(command, args, { cwd: process.cwd(), stdio: "inherit" });
}

console.log("Phase 7 AI and business backend smoke passed.");
