export type StoredInstance = {
  apiBaseUrl: string;
  apiVersion: string;
  catalogVersion: number;
  defaultColorMode: 'light' | 'dark' | 'system';
  defaultLocale: string;
  discoveryVersion: number;
  enabledLocales: string[];
  faviconUrl: string | null;
  instanceId: string;
  lastConnectedAt: string;
  lightLogoUrl: string | null;
  darkLogoUrl: string | null;
  origin: string;
  primaryColor: string | null;
  accentColor: string | null;
  workspaceName: string;
  capabilities?: string[];
};

export type PublicCatalog = {
  locale: string;
  messages: Record<string, string>;
  version: number;
};

export type DiscoveryResult = {
  catalog: PublicCatalog | null;
  instance: StoredInstance;
};

export type SessionRole = 'freelancer' | 'client';

export type MeProfile = {
  id: string;
  email: string | null;
  name: string | null;
  role: SessionRole;
  disabled?: boolean;
  preferences?: {
    colorMode?: 'light' | 'dark' | 'system' | null;
    locale?: string | null;
    timezone?: string | null;
  };
};
