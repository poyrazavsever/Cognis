import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const mobileRoot = new URL('../', import.meta.url);
const repositoryRoot = new URL('../../../', import.meta.url);
const failures = [];
const inventory = JSON.parse(await readFile(new URL('docs/mobile/redesign-phase-0/route-api-inventory.json', repositoryRoot), 'utf8'));
const sourceFiles = await collect(new URL('src/', mobileRoot));
const source = (await Promise.all(sourceFiles.map((file) => readFile(file, 'utf8')))).join('\n');

for (const forbidden of [
  ['business route/feature', /features\/business|\(owner\)\/business/],
  ['domain connection action', /connectDomain|disconnectInstance/],
  ['device pairing action', /pairDevice|auth\/pairing/],
  ['pairing token family', /token-family|TOKEN_FAMILY/],
]) {
  if (forbidden[1].test(source)) failures.push(`Kaldırılmış mobil kapsam bulundu: ${forbidden[0]}`);
}

for (const required of ['business-records', 'domain-entry', 'instance-switching', 'device-pairing']) {
  if (!inventory.removedMobileScope.includes(required)) failures.push(`Envanter silme listesinde eksik: ${required}`);
}

for (const route of ['src/app/(public)/onboarding.tsx', 'src/app/(public)/login.tsx']) {
  try { await readFile(new URL(route, mobileRoot)); } catch { failures.push(`Eksik public route: ${route}`); }
}

const appConfig = await readFile(new URL('app.config.ts', mobileRoot), 'utf8');
if (!appConfig.includes('EXPO_PUBLIC_NETA_ORIGIN')) failures.push('app.config.ts tek-instance origin kullanmıyor.');

if (failures.length) {
  process.stderr.write(`${failures.join('\n')}\n`);
  process.exitCode = 1;
}

async function collect(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const url = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directory);
    if (entry.isDirectory()) files.push(...await collect(url));
    else if (/\.[cm]?[jt]sx?$/.test(entry.name)) files.push(url);
  }
  return files.sort((left, right) => path.basename(left.pathname).localeCompare(path.basename(right.pathname)));
}
