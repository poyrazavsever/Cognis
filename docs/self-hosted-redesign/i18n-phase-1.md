---
title: Faz 1 Locale Veri Modeli ve Service Katmani
description: Cok dillilik icin SQLite semasi, seed, locale yonetimi servisi ve smoke sonuclari.
phase: 1
status: completed
last_updated: 2026-07-19
---

# Faz 1 Locale Veri Modeli ve Service Katmani

Faz-1, cok dillilik icin runtime'a girmeden once gerekli kalici veri modelini
ve owner-only locale yonetimi kurallarini ekledi.

## Eklenen veri modeli

| Tablo veya kolon | Amac |
| --- | --- |
| `instance_locales` | Instance icindeki aktif, draft, archived ve test dillerini tutar. |
| `instance_i18n_settings` | Varsayilan locale ve katalog versiyonunu tutar. |
| `instance_ui_translations` | Built-in katalog ustune yazilacak instance UI cevirilerini tutar. |
| `content_translations` | Domain entity/field/locale bazli icerik cevirilerini tutar. |
| `clients.portal_locale` | Musteri portal dilini tutar. |
| `portal_invitations.locale` | Auth oncesi davet ekraninin dilini tutar. |
| `user_preferences.language` | Sabit `tr/en` constraint yerine 2-12 karakter locale kodu kabul eder. |

Migration `tr` ve `en` built-in locale'lerini seed eder, varsayilan instance
dilini `tr` olarak olusturur ve mevcut preference verisini kayipsiz tasir.

## Service kurallari

`I18nService` ile asagidaki kurallar kilitlendi:

- Locale yonetimi yalnizca freelancer/owner actor tarafindan yapilabilir.
- Disabled actor islem yapamaz.
- Locale kodu kisa BCP47 formatinda dogrulanir: `tr`, `en`, `fr`, `ar-XB`.
- `tr` ve `en` built-in, aktif ve arsivlenemez diller olarak korunur.
- Fallback locale mevcut ve arsivlenmemis olmak zorundadir.
- Locale kendi kendine fallback olamaz.
- Fallback zinciri dongu olusturamaz.
- Varsayilan dil yalnizca `active` locale olabilir.
- Default, fallback, user preference, client portal veya invitation tarafindan
  kullanilan locale arsivlenemez.

## Verification

Calistirilan komutlar:

```bash
pnpm typecheck
pnpm i18n:phase1-smoke
pnpm build
pnpm phase9:smoke
```

Sonuclar basarili. Build sirasinda mevcut Next edge runtime statik uretim uyarisi
tekrar goruldu; Faz-1 ile ilgili yeni bir hata degil.

`i18n:phase1-smoke` su kapilari kontrol eder:

- Yeni migration tablolarini ve kolonlarini dogrular.
- `tr/en` seed ve default `tr` ayarini dogrular.
- `user_preferences.language` alaninin `fr` gibi yeni locale degeri kabul
  ettigini dogrular.
- Owner/client negatif authorization testlerini calistirir.
- Invalid locale, duplicate built-in locale, self fallback ve fallback cycle
  durumlarini reddeder.
- Draft locale'in default yapilamadigini dogrular.
- Referansli ve built-in locale'in arsivlenemedigini dogrular.
- Backup alip restore eder; `instance_i18n_settings` ve `content_translations`
  verisinin restore sonrasinda korundugunu dogrular.

## Faz-2'ye kalan sinir

Bu faz henuz UI metinlerini cevirmedi ve runtime translator eklemedi. Faz-2'de
built-in kataloglar, locale resolver, formatter ve client/server translator
katmani bu veri modelini kullanacak.
