import { access, readFile } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import process from 'node:process';

const root = new URL('../', import.meta.url);
const failures = [];
const packageJson = JSON.parse(await readFile(new URL('package.json', root), 'utf8'));
const podfileLock = await readFile(new URL('ios/Podfile.lock', root), 'utf8');
const settingsGradle = await readFile(new URL('android/settings.gradle', root), 'utf8');
const configPlugin = await readFile(new URL('plugins/with-neta-ios-fixes.cjs', root), 'utf8');
const projectRoot = fileURLToPath(root);
const autolinkingBin = fileURLToPath(new URL('node_modules/.bin/expo-modules-autolinking', root));

for (const [dependency, nativeName] of [
  ['expo-document-picker', 'ExpoDocumentPicker'],
  ['@react-native-community/datetimepicker', 'RNDateTimePicker'],
]) {
  if (!packageJson.dependencies?.[dependency]) failures.push(`package.json: ${dependency} eksik`);
  if (!podfileLock.includes(nativeName)) failures.push(`ios/Podfile.lock: ${nativeName} eksik`);
}

if (!settingsGradle.includes('expoAutolinking')) failures.push('android/settings.gradle: Expo autolinking eksik');
if (!configPlugin.includes("phase.alwaysOutOfDate = '1'")) failures.push('iOS Dev Launcher dependency-analysis düzeltmesi eksik');

try {
  const expoResolution = JSON.parse(execFileSync(autolinkingBin, ['resolve', '--platform', 'android', '--json'], { cwd: projectRoot, encoding: 'utf8' }));
  const expoPackages = new Set((expoResolution.modules ?? []).map((module) => module.packageName));
  for (const dependency of ['expo-document-picker', 'expo-file-system']) {
    if (!expoPackages.has(dependency)) failures.push(`Android Expo autolinking: ${dependency} resolve edilmedi`);
  }

  const reactNativeResolution = JSON.parse(execFileSync(autolinkingBin, ['react-native-config', '--platform', 'android', '--json'], { cwd: projectRoot, encoding: 'utf8' }));
  if (!reactNativeResolution.dependencies?.['@react-native-community/datetimepicker']?.platforms?.android) {
    failures.push('Android React Native autolinking: RNDateTimePicker resolve edilmedi');
  }
} catch (error) {
  failures.push(`Android autolinking çözümlemesi çalışmadı: ${error instanceof Error ? error.message : 'bilinmeyen hata'}`);
}

const sourceFiles = await readSourceTree(new URL('src/', root));
for (const file of sourceFiles) {
  const source = await readFile(file, 'utf8');
  if (/from ['"]expo-haptics['"]|\bHaptics\.|\bVibration\./.test(source)) failures.push(`${file.pathname}: onaysız haptic çağrısı`);
}
if (packageJson.dependencies?.['expo-haptics']) failures.push('expo-haptics kullanılmıyorken native bağımlılık olarak eklenmiş');

try {
  const manifest = await readFile(new URL('ios/Pods/Manifest.lock', root), 'utf8');
  if (manifest !== podfileLock) failures.push('Podfile.lock ile Pods/Manifest.lock senkron değil; pnpm ios:pods çalıştır');
} catch {
  // Clean CI checkout has no Pods directory; Podfile.lock remains the reproducible source.
}

for (const file of ['android/gradlew', 'ios/Neta.xcworkspace/contents.xcworkspacedata']) {
  try { await access(new URL(file, root)); } catch { failures.push(`Native proje dosyası eksik: ${file}`); }
}

if (failures.length) { process.stderr.write(`${failures.join('\n')}\n`); process.exitCode = 1; }

async function readSourceTree(directory) {
  const { readdir } = await import('node:fs/promises');
  const results = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const url = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directory);
    if (entry.isDirectory()) results.push(...await readSourceTree(url));
    else if (/\.[jt]sx?$/.test(entry.name)) results.push(url);
  }
  return results;
}
