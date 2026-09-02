import type { ConfigContext, ExpoConfig } from 'expo/config';

const APP_ENV = readEnvironment(process.env.EXPO_PUBLIC_APP_ENV);
const APP_NAME = process.env.NETA_APP_NAME?.trim() || 'Neta';
const APP_SLUG = readSlug(process.env.NETA_APP_SLUG, 'neta');
const APP_SCHEME = readScheme(process.env.NETA_APP_SCHEME, 'neta');
const IOS_BUNDLE_ID = readIdentifier(process.env.NETA_IOS_BUNDLE_ID, 'com.neta.mobile', 'iOS bundle ID');
const ANDROID_PACKAGE = readIdentifier(process.env.NETA_ANDROID_PACKAGE, 'com.neta.mobile', 'Android package');
const APP_VERSION = readSemver(process.env.NETA_APP_VERSION, '0.1.0');
const IOS_BUILD_NUMBER = readPositiveIntegerString(process.env.NETA_IOS_BUILD_NUMBER, '1', 'iOS build number');
const ANDROID_VERSION_CODE = Number(readPositiveIntegerString(process.env.NETA_ANDROID_VERSION_CODE, '1', 'Android version code'));
const NETA_ORIGIN = readNetaOrigin(process.env.EXPO_PUBLIC_NETA_ORIGIN, APP_ENV);

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: APP_NAME,
  slug: APP_SLUG,
  version: APP_VERSION,
  orientation: 'default',
  icon: './assets/logo/iconLogo.png',
  scheme: APP_SCHEME,
  platforms: ['ios', 'android'],
  userInterfaceStyle: 'automatic',
  ios: {
    buildNumber: IOS_BUILD_NUMBER,
    bundleIdentifier: IOS_BUNDLE_ID,
    icon: './assets/logo/iconLogo.png',
    supportsTablet: true,
  },
  android: {
    package: ANDROID_PACKAGE,
    versionCode: ANDROID_VERSION_CODE,
    softwareKeyboardLayoutMode: 'resize',
    adaptiveIcon: {
      backgroundColor: '#FFF8F8',
      foregroundImage: './assets/logo/iconLogo.png',
    },
  },
  plugins: [
    'expo-router',
    'expo-font',
    'expo-sharing',
    ['expo-secure-store', { configureAndroidBackup: true }],
    [
      'expo-splash-screen',
      {
        backgroundColor: '#FFF8F8',
        dark: { backgroundColor: '#12090A' },
        image: './assets/logo/iconLogo.png',
        imageWidth: 160,
      },
    ],
    './plugins/with-neta-ios-fixes.cjs',
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    environment: APP_ENV,
    netaOrigin: NETA_ORIGIN,
  },
});

function readEnvironment(value: string | undefined): 'development' | 'preview' | 'production' {
  if (!value || value === 'development') return 'development';
  if (value === 'preview' || value === 'production') return value;
  throw new Error('EXPO_PUBLIC_APP_ENV development, preview veya production olmalıdır.');
}

function readNetaOrigin(value: string | undefined, environment: string): string {
  const fallback = environment === 'development' ? 'http://localhost:3000' : '';
  const candidate = value?.trim() || fallback;
  if (!candidate) throw new Error('Preview/production build için EXPO_PUBLIC_NETA_ORIGIN zorunludur.');
  let url: URL;
  try { url = new URL(candidate); } catch { throw new Error('EXPO_PUBLIC_NETA_ORIGIN geçerli bir absolute origin olmalıdır.'); }
  if ((url.protocol !== 'https:' && url.protocol !== 'http:') || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('EXPO_PUBLIC_NETA_ORIGIN yalnız HTTP(S) origin olmalı; path/query/credential içeremez.');
  }
  if (environment !== 'development' && url.protocol !== 'https:') {
    throw new Error('Preview/production EXPO_PUBLIC_NETA_ORIGIN HTTPS olmalıdır.');
  }
  return url.origin;
}

function readSlug(value: string | undefined, fallback: string): string {
  const result = value?.trim() || fallback;
  if (!/^[a-z0-9][a-z0-9-_]*$/.test(result)) throw new Error('NETA_APP_SLUG geçersiz.');
  return result;
}

function readScheme(value: string | undefined, fallback: string): string {
  const result = value?.trim() || fallback;
  if (!/^[a-z][a-z0-9+.-]*$/.test(result)) throw new Error('NETA_APP_SCHEME geçersiz.');
  return result;
}

function readIdentifier(value: string | undefined, fallback: string, label: string): string {
  const result = value?.trim() || fallback;
  if (!/^[A-Za-z][A-Za-z0-9]*(?:\.[A-Za-z0-9_-]+)+$/.test(result)) throw new Error(`${label} geçersiz.`);
  return result;
}

function readSemver(value: string | undefined, fallback: string): string {
  const result = value?.trim() || fallback;
  if (!/^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(result)) throw new Error('NETA_APP_VERSION semver biçiminde olmalıdır.');
  return result;
}

function readPositiveIntegerString(value: string | undefined, fallback: string, label: string): string {
  const result = value?.trim() || fallback;
  if (!/^[1-9]\d*$/.test(result)) throw new Error(`${label} pozitif tam sayı olmalıdır.`);
  return result;
}
