export const I18N_NAMESPACES = [
  "common",
  "auth",
  "navigation",
  "dashboard",
  "clients",
  "projects",
  "tasks",
  "calendar",
  "finance",
  "journal",
  "chat",
  "settings",
  "portal",
  "status",
  "validation",
  "api",
  "analytics",
  "business",
] as const;

export type I18nNamespace = (typeof I18N_NAMESPACES)[number];
export type LocaleCode = string;
export type TextDirection = "ltr" | "rtl";
export type TranslationValues = Record<string, string | number | boolean | Date | null | undefined>;
export type TranslationCatalog = Record<I18nNamespace, Record<string, string>>;

export type LocaleDescriptor = {
  code: LocaleCode;
  name: string;
  nativeName: string;
  status: "draft" | "active" | "archived" | "test";
  fallbackLocale: LocaleCode | null;
  textDirection: TextDirection;
  builtIn: boolean;
};
