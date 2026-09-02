import Constants from 'expo-constants';

const supportedEnvironments = ['development', 'preview', 'production'] as const;

export type AppEnvironment = (typeof supportedEnvironments)[number];

function isAppEnvironment(value: unknown): value is AppEnvironment {
  return typeof value === 'string' && supportedEnvironments.includes(value as AppEnvironment);
}

const configuredEnvironment = Constants.expoConfig?.extra?.environment;
const configuredOrigin = Constants.expoConfig?.extra?.netaOrigin;

export const appEnvironment: AppEnvironment = isAppEnvironment(configuredEnvironment)
  ? configuredEnvironment
  : 'development';

export const netaOrigin = readConfiguredOrigin(configuredOrigin);

function readConfiguredOrigin(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Neta origin build yapılandırmasında bulunamadı.');
  }

  const url = new URL(value);
  if ((url.protocol !== 'https:' && url.protocol !== 'http:') || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('Neta origin build yapılandırması geçersiz.');
  }

  return url.origin;
}
