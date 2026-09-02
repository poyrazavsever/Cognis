import { access, readFile } from 'node:fs/promises';

const root = new URL('../', import.meta.url);
const failures = [];
const required = [
  'src/app/(forms)/calendar-event.tsx',
  'src/app/(forms)/finance-record.tsx',
  'src/app/(forms)/journal-entry.tsx',
  'src/app/(forms)/ai-settings.tsx',
  'src/app/(forms)/appearance-settings.tsx',
  'src/app/(forms)/owner-preferences.tsx',
  'src/app/(forms)/owner-profile.tsx',
  'src/app/(forms)/owner-security.tsx',
  'src/app/(forms)/workspace-settings.tsx',
  'src/features/chat/scroll-policy.test.ts',
  'src/features/files/document-picker.ts',
  'src/features/files/policy.test.ts',
  'src/features/journal/trend.test.ts',
  'src/features/portal/authorization.test.ts',
  'src/app/(forms)/project-risk.tsx',
  'src/app/(portal-forms)/_layout.tsx',
  'src/app/(portal-forms)/portal-profile.tsx',
  'src/app/(portal-forms)/portal-revision.tsx',
  'src/app/(portal-forms)/portal-security.tsx',
  '../../docs/mobile/redesign-phase-8-11/README.md',
];
for (const file of required) {
  try { await access(new URL(file, root)); } catch { failures.push(`Eksik Faz 8–11 teslimi: ${file}`); }
}

for (const [file, checks] of Object.entries({
  'src/app/(forms)/calendar-event.tsx': ['NativeDateTimeField', 'RelationPickerField', 'updateCalendarEvent', 'deleteCalendarEvent', 'version'],
  'src/app/(forms)/finance-record.tsx': ['RelationPickerField', 'version'],
  'src/app/(forms)/journal-entry.tsx': ['version', 'Not içeriği uygulama loglarına ve bildirim önizlemesine yazılmaz.'],
  'src/app/(forms)/project-risk.tsx': ['RelationPickerField', 'submitDisabled'],
  'src/app/(owner)/chat.tsx': ['AbortController', 'FlatList', 'isNearChatEnd', 'setTimeout(() =>', 'Üretimi durdur', 'Son mesajı yeniden dene'],
  'src/app/(owner)/files.tsx': ['RelationPickerField', 'FileUploadPanel'],
  'src/app/(owner)/finance.tsx': ['accessibilityViewIsModal', 'setAccessibilityFocus', 'requestFinanceAnalysis', 'Yeniden dene'],
  'src/app/(owner)/journal.tsx': ['calculateJournalTrend', 'Aylık eğilim'],
  'src/app/(owner)/settings.tsx': ['SettingsSection', '/(owner)/locales', '/(owner)/files'],
  'src/app/(owner)/_layout.tsx': ['name="files" options={{ href: null }}', 'name="locales" options={{ href: null }}'],
  'src/app/(owner)/locales.tsx': ['FlatList', 'automaticallyAdjustKeyboardInsets', 'pickSingleDocument'],
  'src/app/(forms)/appearance-settings.tsx': ['pickSingleDocument', 'validateBrandAsset', 'uploadAppearanceAsset'],
  'src/app/(portal-forms)/portal-revision.tsx': ['submitDisabled={!isOnline', 'session.role !== \'client\''],
  'src/features/files/document-picker.ts': ["await import('expo-document-picker')", 'result.assets?.[0]'],
  'src/features/files/file-upload-panel.tsx': ['relationMissing', 'uploader.cancel', 'uploader.retry'],
  'src/features/files/use-file-upload.ts': ['cancelledRef', 'controllerRef.current?.cancel'],
  'src/features/portal/api.ts': ['assertPortalActor', 'assertPortalPath', 'matchesPortalProjectScope', 'isInstanceBoundUrl'],
  'src/features/settings/api.ts': ['parsed.kind !== kind', 'isInstanceBoundUrl'],
})) {
  const source = await readFile(new URL(file, root), 'utf8');
  for (const check of checks) if (!source.includes(check)) failures.push(`${file}: ${check} eksik`);
}

for (const file of [
  'src/app/(forms)/appearance-settings.tsx',
  'src/app/(owner)/locales.tsx',
  'src/features/files/file-upload-panel.tsx',
]) {
  const source = await readFile(new URL(file, root), 'utf8');
  if (/from ['"]expo-document-picker['"]/.test(source)) failures.push(`${file}: DocumentPicker eager import ediliyor`);
}

for (const file of [
  'src/app/(forms)/calendar-event.tsx',
  'src/app/(forms)/finance-record.tsx',
  'src/app/(forms)/project-risk.tsx',
]) {
  const source = await readFile(new URL(file, root), 'utf8');
  if (/label=["'`](?:Müşteri|Proje|Görev) ID["'`]/.test(source)) failures.push(`${file}: ham ilişki ID alanı kullanılıyor`);
}

if (failures.length) {
  process.stderr.write(`${failures.join('\n')}\n`);
  process.exitCode = 1;
}
