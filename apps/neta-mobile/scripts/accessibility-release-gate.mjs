import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';

const files = execFileSync('rg', ['--files', 'src/app', 'src/components'], { encoding: 'utf8' }).trim().split('\n').filter((file) => /\.tsx$/.test(file));
const failures = [];
for (const file of files) {
  const source = readFileSync(file, 'utf8');
  if (/allowFontScaling\s*=\s*\{false\}/.test(source)) failures.push(`${file}: font scaling kapatılamaz`);
  if (/<(?:TouchableOpacity|TouchableHighlight|TouchableWithoutFeedback)\b/.test(source)) failures.push(`${file}: ortak 48dp Button/Pressable semantiğini kullan`);
  for (const match of source.matchAll(/<Pressable\b([\s\S]*?)>/g)) {
    if (!/accessibilityRole=/.test(match[1] ?? '')) failures.push(`${file}: accessibilityRole olmayan Pressable`);
  }
}

const shell = readFileSync('src/components/navigation/app-shell.tsx', 'utf8');
for (const [pattern, message] of [
  [/accessibilityRole="tab"/, 'bottom navigation tab semantiği eksik'],
  [/accessibilityViewIsModal/, 'Others sheet modal focus sınırı eksik'],
  [/setAccessibilityFocus/, 'Others sheet focus geri dönüşü eksik'],
  [/reduceMotion \? 'none' : 'slide'/, 'Reduce Motion sheet davranışı eksik'],
]) {
  if (!pattern.test(shell)) failures.push(`src/components/navigation/app-shell.tsx: ${message}`);
}
if (failures.length) {
  process.stderr.write(`${failures.join('\n')}\n`);
  process.exit(1);
}
