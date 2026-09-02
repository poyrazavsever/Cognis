import { readdir, readFile } from 'node:fs/promises';
import { extname } from 'node:path';

const appRoot = new URL('../src/app/', import.meta.url);
const files = await walk(appRoot);
const violations = [];
for (const file of files) {
  const source = await readFile(file, 'utf8');
  if (/>\s*mobile-[a-z-]+\.[a-z0-9_.-]+\s*</i.test(source) || /(?:label|title|description)=["']mobile-[a-z-]+\./i.test(source)) violations.push(file.pathname);
}
if (violations.length) {
  process.stderr.write(`Raw i18n keys found in production UI:\n${violations.join('\n')}\n`);
  process.exitCode = 1;
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(entries.map((entry) => {
    const url = new URL(`${entry.name}${entry.isDirectory() ? '/' : ''}`, directory);
    return entry.isDirectory() ? walk(url) : ['.tsx', '.ts'].includes(extname(entry.name)) ? [url] : [];
  }));
  return nested.flat();
}
