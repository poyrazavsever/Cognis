import { enUS, fr, tr } from "date-fns/locale";

export function getDateFnsLocale(locale: string) {
  const normalized = locale.split("-")[0];
  if (normalized === "tr") return tr;
  if (normalized === "fr") return fr;
  return enUS;
}

export function getDocumentDateFnsLocale() {
  if (typeof document === "undefined") return tr;
  return getDateFnsLocale(document.documentElement.lang || "tr");
}
