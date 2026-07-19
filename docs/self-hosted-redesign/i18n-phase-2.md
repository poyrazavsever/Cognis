---
title: Faz 2 Ceviri Runtime'i ve Built-in Kataloglar
description: Neta cok dillilik runtime, katalog, fallback, formatter, locale resolver ve smoke sonuclari.
phase: 2
status: completed
last_updated: 2026-07-19
---

# Faz 2 Ceviri Runtime'i ve Built-in Kataloglar

Faz-2, Faz-1'de eklenen locale veri modelini calisan runtime katmanina bagladi.
Bu faz tum sayfa metinlerini henuz migrate etmez; sayfa sayfa UI migration Faz-4
kapsaminda yapilacak.

## Eklenen runtime parcalari

| Alan | Dosya |
| --- | --- |
| I18n tipleri ve namespace listesi | `lib/i18n/types.ts` |
| Built-in katalog registry ve parity helper | `lib/i18n/catalog.ts` |
| Interpolation, plural, tarih, sayi ve para formatter | `lib/i18n/format.ts` |
| Client-safe translator | `lib/i18n/translator.ts` |
| React client provider ve hook'lar | `components/i18n/i18n-provider.tsx` |
| TR built-in katalog | `locales/tr/*` |
| EN built-in katalog | `locales/en/*` |
| Server catalog merge ve catalogVersion cache | `server/i18n/catalog.ts` |
| Locale cookie ve direction helper | `server/i18n/locale.ts` |
| Session/cookie/instance locale resolver | `server/i18n/resolver.ts` |
| Server `createTranslator` helper | `server/i18n/translator.ts` |
| Public localization metadata | `server/i18n/runtime.ts` |
| Locale cookie lifecycle route | `app/api/i18n/locale/route.ts` |

## Davranis

- Built-in `tr` ve `en` kataloglari ayni namespace/key setine sahiptir.
- Ceviri anahtarlari `namespace.key` formatinda kullanilir.
- Interpolation `{name}` formatini destekler.
- Basit plural formatinda `Intl.PluralRules` kullanilir.
- DB override, built-in katalog ustune merge edilir.
- Fallback sirasi locale kaydindaki fallback chain'e gore calisir.
- Eksik anahtar production'da ham key'e duser; development'ta console warning
  verir.
- `catalog_version` override mutation'inda artar ve cache key'ine dahil edilir.
- `<html lang>` ve `<html dir>` request locale resolver'dan gelir.
- `neta_locale` cookie'si `/api/i18n/locale` route'u uzerinden yazilir.
- `/api/v1/meta` response'u localization metadata'si dondurur.

## Verification

Calistirilan komutlar:

```bash
pnpm i18n:phase2-smoke
pnpm build
pnpm phase9:smoke
pnpm typecheck
```

Sonuclar basarili. `i18n:phase2-smoke` su kapilari dogrular:

- TR/EN katalog parity.
- Ayni translation helper ile TR ve EN render.
- Interpolation ve plural format.
- Ortak tarih ve para formatter.
- RTL direction helper.
- Fransizca eksik anahtarda EN fallback.
- DB UI translation override'in deployment olmadan okunmasi.
- Override sonrasi `catalog_version` bump ile yeni metnin okunmasi.
- Owner disi actor'un UI translation yazamamasi.

`pnpm build` sirasinda mevcut Next edge runtime static generation uyarisi tekrar
goruldu; Faz-2 kaynakli yeni bir hata degil.

## Faz-4'e kalan sinir

Bu fazda mevcut sayfa metinleri henuz topluca katalog anahtarlarina tasinmadi.
Dashboard, musteri, proje, gorev, finans, gunluk, chat ve portal ekranlarindaki
hardcoded metinlerin migration'i Faz-4 ve Faz-6 kapsaminda yapilacak.
