import assert from "node:assert/strict";
import {
  buildLocalizationContract,
  negotiateLocale,
  parseAcceptLanguage,
  UNSUPPORTED_LOCALE_CODE,
  type ApiLocalizationMetadata,
} from "../server/api/v1/localization";
import {
  NETA_CAPABILITIES,
  type NetaLocalizedResponse,
  type NetaTranslationMutationShape,
} from "../server/api/v1/contracts";
import { DomainError } from "../server/domain/errors";

const metadata: ApiLocalizationMetadata = {
  defaultLocale: "tr",
  supportedLocales: [
    {
      code: "tr",
      name: "Turkish",
      nativeName: "Türkçe",
      status: "active",
      fallbackLocale: null,
      textDirection: "ltr",
      builtIn: true,
    },
    {
      code: "en",
      name: "English",
      nativeName: "English",
      status: "active",
      fallbackLocale: "tr",
      textDirection: "ltr",
      builtIn: true,
    },
    {
      code: "fr",
      name: "French",
      nativeName: "Français",
      status: "draft",
      fallbackLocale: "en",
      textDirection: "ltr",
      builtIn: false,
    },
  ],
  fallbacks: {
    en: "tr",
    fr: "en",
  },
  catalogVersion: 7,
};

assert.deepEqual(parseAcceptLanguage("fr-FR, en-US;q=0.9, tr;q=0.7"), ["fr-FR", "en-US", "tr"]);
assert.deepEqual(parseAcceptLanguage("en;q=0.4, tr;q=0.9"), ["tr", "en"]);

const queryLocale = negotiateLocale({
  metadata,
  requestedLocale: "en",
  acceptLanguage: "tr;q=0.9",
});
assert.equal(queryLocale.locale, "en");
assert.equal(queryLocale.source, "query");
assert.deepEqual(queryLocale.fallbackChain, ["en", "tr"]);

const baseLanguageMatch = negotiateLocale({
  metadata,
  acceptLanguage: "en-US,en;q=0.9",
});
assert.equal(baseLanguageMatch.locale, "en");
assert.equal(baseLanguageMatch.requestedLocale, "en-US");
assert.equal(baseLanguageMatch.source, "accept-language");

assert.throws(
  () => negotiateLocale({ metadata, requestedLocale: "fr" }),
  (error) =>
    error instanceof DomainError &&
    error.code === UNSUPPORTED_LOCALE_CODE &&
    error.message === "Unsupported locale." &&
    error.details?.messageKey === "validation.unsupportedLocale" &&
    error.details?.requestedLocale === "fr",
);

const contract = buildLocalizationContract(metadata);
assert.equal(contract.negotiator.queryParam, "locale");
assert.equal(contract.negotiator.header, "Accept-Language");
assert.equal(contract.negotiator.unsupportedLocaleCode, UNSUPPORTED_LOCALE_CODE);
assert.equal(contract.responseContract.localizedResourceField, "localized");
assert.equal(contract.responseContract.translationsField, "translations");

assert.equal(
  NETA_CAPABILITIES.some((capability) => capability.id === "instance.localization" && capability.status === "available"),
  true,
);

const localizedResponse: NetaLocalizedResponse<{ title: string }> = {
  resource: { title: "Marka sitesi" },
  localized: { title: "Brand website" },
  locale: "en",
  fallbackChain: ["en", "tr"],
};
assert.equal(localizedResponse.localized.title, "Brand website");

const mutationShape: NetaTranslationMutationShape = {
  tr: { title: "Marka sitesi" },
  en: { title: "Brand website", description: null },
};
assert.equal(mutationShape.en.title, "Brand website");

console.log("I18n phase 8 mobile API localization smoke passed.");
