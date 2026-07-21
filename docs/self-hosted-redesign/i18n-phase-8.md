---
title: I18n Faz 8 — API v1 ve mobil hazırlık
status: completed
completed_at: 2026-07-19
---

# I18n Faz 8 — API v1 ve mobil hazırlık

Bu fazda self-host instance içindeki dil modeli, gelecekteki React Native
istemcilerinin güvenli şekilde keşfedebileceği bir API v1 sözleşmesine
taşındı. Değişiklikler geriye uyumludur; mevcut v1 response alanları
değiştirilmedi, sadece additive alanlar eklendi.

## Tamamlananlar

- `instance.localization` capability kaydı eklendi.
- `/.well-known/neta` discovery document içine additive locale özeti eklendi.
- `/api/v1/meta` içinde localization contract genişletildi:
  - `supportedLocales`
  - `fallbacks`
  - `catalogVersion`
  - `negotiator`
  - `responseContract`
- `/api/v1/me` response'u kullanıcının dil bilgisini ayrı döner:
  - `language`
  - `portalLocale`
  - `resolvedLocale`
  - `requestedLocale`
  - `source`
  - `fallbackChain`
- `Accept-Language` parser ve locale negotiation helper'ı eklendi.
- Gelecek resource endpoint'leri için localized response contract'ı yazıldı.
- Owner mutation contract'ında `translations` shape'i standartlaştırıldı:
  `Record<locale, Record<field, string | null>>`.
- `UNSUPPORTED_LOCALE` hata kodu API response mapping'e eklendi.
- API hata response'larında client localization için `messageKey` kullanımı
  netleştirildi.
- `tr`, `en`, `fr` için contract fixture'ları eklendi.
- `i18n:phase8-smoke` mobile localization negotiation ve contract shape'lerini
  runtime olarak doğrulayacak şekilde eklendi.

## Mobil istemci davranışı

Mobil istemci ilk açılışta `/.well-known/neta` endpoint'ine gider ve
`instance.localization` capability'sini kontrol eder. Capability bilinmiyorsa
istemci bunu fatal hata olarak ele almamalı; capability listesi additive olduğu
için unknown capability değerleri yok sayılmalıdır.

Dil seçimi için önerilen sıra:

1. Kullanıcının explicit seçimi varsa `/api/v1/me?locale=xx` ile gönder.
2. Explicit seçim yoksa `Accept-Language` header'ını gönder.
3. Server `/api/v1/me.data.localization.resolvedLocale` değerini gerçek kaynak
   kabul et.

`locale` query param'ı aktif olmayan bir locale'e işaret ederse API
`UNSUPPORTED_LOCALE` döner. `Accept-Language` içinde desteklenmeyen değer varsa
server sessizce instance default locale'e düşebilir.

Hata response'larında kullanıcıya gösterilecek metin mobile client tarafından
locale'e göre çözülmelidir. Server bu amaçla `error.details.messageKey`
alanını döndürür:

```json
{
  "ok": false,
  "error": {
    "code": "UNSUPPORTED_LOCALE",
    "message": "Unsupported locale.",
    "details": {
      "messageKey": "validation.unsupportedLocale",
      "requestedLocale": "fr"
    }
  }
}
```

## Resource response contract

Gelecek `/api/v1/projects`, `/api/v1/tasks`, `/api/v1/clients` gibi resource
endpoint'leri şu shape'i kullanmalı:

```ts
{
  resource: TResource;
  localized: TResource;
  locale: string;
  fallbackChain: string[];
}
```

Bu contract sayesinde mobil taraf original kaydı ve locale çözülmüş kaydı aynı
anda taşıyabilir.

## Mutation translations contract

Owner/freelancer mutation endpoint'leri çok dilli alanları şu shape ile kabul
etmeli:

```ts
{
  translations: {
    tr: { name: "Marka sitesi", description: "..." },
    en: { name: "Brand website", description: "..." },
    fr: { name: "Site de marque", description: "..." }
  }
}
```

Server sadece authorized owner mutation'larında bu alanı kabul eder. Müşteri
portal oturumu `translations` mutation contract'ını kullanamaz; portal locale
yalnızca kendi okuma response'unu etkiler.

## Cache ve URL notları

- `/.well-known/neta` ve `/api/v1/meta` public cache kullanır.
- Metadata içindeki URL'ler `APP_URL` üzerinden absolute üretilir.
- Locale catalog değişikliklerinde `catalogVersion` artacağı için mobil istemci
  meta cache'ini güvenli şekilde invalidate edebilir.

## Fixture'lar

- `docs/self-hosted-redesign/i18n-phase-8-fixtures/api-v1-locale-tr.json`
- `docs/self-hosted-redesign/i18n-phase-8-fixtures/api-v1-locale-en.json`
- `docs/self-hosted-redesign/i18n-phase-8-fixtures/api-v1-locale-fr.json`

## Verification

Çalıştırılan komutlar:

```bash
pnpm i18n:phase8-smoke
pnpm typecheck
pnpm build
pnpm phase9:smoke
git diff --check
```
