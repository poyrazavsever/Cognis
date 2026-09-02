import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const failures = [];
const requiredFiles = [
  'src/app/(owner)/clients/[id].tsx',
  'src/app/(owner)/projects/[id].tsx',
  'src/app/(owner)/tasks/[id].tsx',
  'src/app/(forms)/client.tsx',
  'src/app/(forms)/client-activity.tsx',
  'src/app/(forms)/invitation.tsx',
  'src/app/(forms)/project.tsx',
  'src/app/(forms)/task.tsx',
  '../../docs/mobile/redesign-phase-6-7/README.md',
];

for (const file of requiredFiles) {
  try { await access(new URL(file, root)); } catch { failures.push(`Eksik Faz 6–7 teslimi: ${file}`); }
}

const projectForm = await readFile(new URL('src/app/(forms)/project.tsx', root), 'utf8');
const taskForm = await readFile(new URL('src/app/(forms)/task.tsx', root), 'utf8');
const relationPicker = await readFile(new URL('src/components/forms/relation-picker-field.tsx', root), 'utf8');
const projectDetail = await readFile(new URL('src/app/(owner)/projects/[id].tsx', root), 'utf8');

for (const [condition, message] of [
  [projectForm.includes('RelationPickerField'), 'Proje formunda müşteri relation picker eksik'],
  [(taskForm.match(/<RelationPickerField/g)?.length ?? 0) === 2, 'Görev formunda müşteri/proje relation picker eksik'],
  [relationPicker.includes('accessibilityViewIsModal') && relationPicker.includes('setAccessibilityFocus'), 'Relation picker modal focus yönetimi eksik'],
  [relationPicker.includes('Eşleşen seçenek bulunamadı'), 'Relation picker arama/empty state eksik'],
  [projectDetail.includes("'overview' | 'plan' | 'tasks' | 'revisions' | 'assets'"), 'Proje segmented detail bölümleri eksik'],
  [projectDetail.includes('Bu yüzey sahte veri göstermez'), 'Eksik backend endpoint state’i görünür değil'],
]) {
  if (!condition) failures.push(message);
}

if (failures.length) {
  process.stderr.write(`${failures.join('\n')}\n`);
  process.exitCode = 1;
}
