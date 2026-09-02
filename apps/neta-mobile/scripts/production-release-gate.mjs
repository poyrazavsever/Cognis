import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const root = new URL('../', import.meta.url);
const failures = [];
const packageJson = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
const appConfig = await readFile(new URL('app.config.ts', root), 'utf8');
const sourceFiles = await collectSourceFiles(new URL('src/', root));

for (const dependency of Object.keys(packageJson.dependencies ?? {})) {
  if (/sentry|bugsnag|crashlytics|analytics|telemetry/i.test(dependency)) {
    failures.push(`Opt-in kararı olmadan telemetry/crash bağımlılığı: ${dependency}`);
  }
}

for (const file of sourceFiles) {
  const source = await readFile(file.url, 'utf8');
  if (/console\.(?:debug|error|info|log|warn)\s*\(/.test(source)) failures.push(`${file.name}: production console çağrısı`);
  if (/EXPO_PUBLIC_[A-Z0-9_]*(?:API_KEY|PASSWORD|SECRET|TOKEN)/.test(source)) failures.push(`${file.name}: public environment secret adı`);
}

if (!/version:\s*APP_VERSION/.test(appConfig)) failures.push('app.config.ts: doğrulanmış semver app version eksik');
if (!/buildNumber:\s*IOS_BUILD_NUMBER/.test(appConfig)) failures.push('app.config.ts: doğrulanmış iOS buildNumber eksik');
if (!/versionCode:\s*ANDROID_VERSION_CODE/.test(appConfig)) failures.push('app.config.ts: doğrulanmış Android versionCode eksik');
if (!/scheme:\s*APP_SCHEME/.test(appConfig)) failures.push('app.config.ts: custom scheme eksik');

for (const requiredDocument of [
  '../../docs/mobile/phase-21/README.md',
  '../../docs/mobile/phase-21/adr-0021-self-hosted-notifications.md',
  '../../docs/mobile/phase-22/README.md',
  '../../docs/mobile/phase-22/privacy-and-support.md',
  '../../docs/mobile/phase-22/store-listing.md',
  '../../docs/mobile/phase-22/release-operations.md',
  '../../docs/mobile/neta-mobile-redesign-master-plan.md',
  '../../docs/mobile/redesign-phase-0/README.md',
  '../../docs/mobile/redesign-phase-0/route-api-inventory.json',
  '../../docs/mobile/redesign-phase-2-3/README.md',
  '../../docs/mobile/redesign-phase-6-7/README.md',
  '../../docs/mobile/redesign-phase-8-11/README.md',
  '../../docs/mobile/redesign-phase-12/README.md',
  '../../docs/mobile/redesign-phase-12/fork-release-runbook.md',
  '../../docs/mobile/redesign-phase-12/native-a11y-matrix.md',
]) {
  try { await readFile(new URL(requiredDocument, root)); } catch { failures.push(`Eksik release dokümanı: ${requiredDocument}`); }
}

if (failures.length > 0) {
  process.stderr.write(`${failures.join('\n')}\n`);
  process.exitCode = 1;
}

async function collectSourceFiles(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const url = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directory);
    if (entry.isDirectory()) files.push(...await collectSourceFiles(url));
    else if (/\.[cm]?[jt]sx?$/.test(entry.name) && !entry.name.endsWith('.test.ts')) files.push({ name: path.relative(new URL('.', root).pathname, url.pathname), url });
  }
  return files;
}
