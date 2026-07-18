import { execFileSync } from "node:child_process";

for (const [command, args] of [
  [process.execPath, ["scripts/phase9-api-boundary.mjs"]],
  [process.execPath, ["scripts/phase1-auth-smoke.mjs"]],
]) {
  execFileSync(command, args, { cwd: process.cwd(), stdio: "inherit" });
}

console.log("Phase 9 mobile API smoke passed.");
