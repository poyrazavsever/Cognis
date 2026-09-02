import assert from "node:assert/strict";
import { resolveLocalePolicy } from "../lib/i18n/locale-resolution";

const locales = [
  { code: "tr", status: "active", textDirection: "ltr" },
  { code: "en", status: "active", textDirection: "ltr" },
  { code: "fr", status: "active", textDirection: "ltr" },
  { code: "de", status: "archived", textDirection: "ltr" },
  { code: "ar", status: "active", textDirection: "rtl" },
] as const;

const publicLocale = resolveLocalePolicy({
  activeLocales: locales,
  defaultLocale: "en",
  candidates: [],
});
assert.equal(publicLocale.locale, "en");
assert.equal(publicLocale.source, "instance");

const freelancerLocale = resolveLocalePolicy({
  activeLocales: locales,
  defaultLocale: "tr",
  candidates: [{ locale: "en", source: "user" }],
});
assert.equal(freelancerLocale.locale, "en");
assert.equal(freelancerLocale.source, "user");

const portalPreference = resolveLocalePolicy({
  activeLocales: locales,
  defaultLocale: "tr",
  candidates: [
    { locale: "en", source: "user" },
    { locale: "fr", source: "client" },
  ],
});
assert.equal(portalPreference.locale, "en", "Personal preference must win over the client default");

const portalDefault = resolveLocalePolicy({
  activeLocales: locales,
  defaultLocale: "tr",
  candidates: [
    { locale: null, source: "user" },
    { locale: "fr", source: "client" },
  ],
});
assert.equal(portalDefault.locale, "fr");
assert.equal(portalDefault.source, "client");

const invitationLocale = resolveLocalePolicy({
  activeLocales: locales,
  defaultLocale: "tr",
  candidates: [{ locale: "fr", source: "invitation" }],
});
assert.equal(invitationLocale.locale, "fr");
assert.equal(invitationLocale.source, "invitation");

const archivedPreference = resolveLocalePolicy({
  activeLocales: locales,
  defaultLocale: "tr",
  candidates: [{ locale: "de", source: "user" }],
});
assert.equal(archivedPreference.locale, "tr");
assert.equal(archivedPreference.source, "instance");

const invalidDefault = resolveLocalePolicy({
  activeLocales: locales,
  defaultLocale: "de",
  candidates: [],
});
assert.equal(invalidDefault.locale, "tr");
assert.equal(invalidDefault.source, "fallback");

const rtlLocale = resolveLocalePolicy({
  activeLocales: locales,
  defaultLocale: "tr",
  candidates: [{ locale: "ar", source: "user" }],
});
assert.equal(rtlLocale.direction, "rtl");

console.log("I18n V2 phase 1 locale policy smoke passed.");
