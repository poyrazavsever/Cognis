import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const failures = [];
const required = [
  '../../docs/mobile/redesign-phase-12/README.md',
  '../../docs/mobile/redesign-phase-12/fork-release-runbook.md',
  '../../docs/mobile/redesign-phase-12/native-a11y-matrix.md',
  'scripts/native-release-gate.mjs',
  'scripts/fork-config-smoke.mjs',
];
for (const file of required) {
  try { await access(new URL(file, root)); } catch { failures.push(`Eksik Faz 12 teslimi: ${file}`); }
}

for (const [file, checks] of Object.entries({
  'src/lib/performance/metrics.ts': ["'tab-switch'", "'modal-open'", "'keyboard-open'", "'list-scroll-frame'"],
  'src/components/forms/form-sheet.tsx': ['recordPerformanceSample', 'keyboardDidShow'],
  'src/components/navigation/app-shell.tsx': ["markPerformanceStart('tab-switch')", "finishPerformanceMeasure('tab-switch')"],
  'src/components/ui/text-field.tsx': ["markPerformanceStart('keyboard-open')"],
})) {
  const source = await readFile(new URL(file, root), 'utf8');
  for (const check of checks) if (!source.includes(check)) failures.push(`${file}: ${check} eksik`);
}

const packageJson = await readFile(new URL('package.json', root), 'utf8');
if (!packageJson.includes('fork:config-smoke')) failures.push('package.json: fork config smoke scripti eksik');

if (failures.length) { process.stderr.write(`${failures.join('\n')}\n`); process.exitCode = 1; }
