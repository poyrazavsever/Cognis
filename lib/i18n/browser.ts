import { toIntlLocale } from "./format";

export function getDocumentLocale(): string {
  if (typeof document === "undefined") return "tr";
  return document.documentElement.lang || "tr";
}

export function getDocumentIntlLocale(): string {
  return toIntlLocale(getDocumentLocale());
}
