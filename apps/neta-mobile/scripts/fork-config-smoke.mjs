import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = new URL('../', import.meta.url);
const projectRoot = fileURLToPath(root);
const expoBin = fileURLToPath(new URL('node_modules/.bin/expo', root));
const baseEnv = {
  ...process.env,
  EXPO_PUBLIC_APP_ENV: 'production',
  EXPO_PUBLIC_NETA_ORIGIN: 'https://neta.example.com',
  NETA_ANDROID_PACKAGE: 'com.example.neta',
  NETA_APP_NAME: 'Example Neta',
  NETA_APP_SCHEME: 'exampleneta',
  NETA_APP_SLUG: 'example-neta',
  NETA_APP_VERSION: '1.2.3',
  NETA_ANDROID_VERSION_CODE: '42',
  NETA_IOS_BUILD_NUMBER: '17',
  NETA_IOS_BUNDLE_ID: 'com.example.neta',
};

const config = JSON.parse(execFileSync(expoBin, ['config', '--type', 'public', '--json'], {
  cwd: projectRoot,
  encoding: 'utf8',
  env: baseEnv,
}));

const failures = [];
if (config.name !== 'Example Neta' || config.slug !== 'example-neta' || config.scheme !== 'exampleneta') failures.push('Fork uygulama kimliği env değerlerinden üretilmedi');
if (config.version !== '1.2.3' || config.ios?.buildNumber !== '17' || config.android?.versionCode !== 42) failures.push('Fork store sürüm değerleri env değerlerinden üretilmedi');
if (config.ios?.bundleIdentifier !== 'com.example.neta' || config.android?.package !== 'com.example.neta') failures.push('Fork bundle/package kimliği env değerlerinden üretilmedi');
if (config.extra?.netaOrigin !== 'https://neta.example.com' || config.extra?.environment !== 'production') failures.push('Production Neta origin/environment config içine doğru yazılmadı');

try {
  execFileSync(expoBin, ['config', '--type', 'public', '--json'], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: { ...baseEnv, EXPO_PUBLIC_NETA_ORIGIN: 'http://neta.example.com' },
    stdio: 'pipe',
  });
  failures.push('Production config HTTP origin ile başarısız olmadı');
} catch {
  // Expected: preview/production builds accept HTTPS origins only.
}

if (failures.length) {
  process.stderr.write(`${failures.join('\n')}\n`);
  process.exitCode = 1;
}
