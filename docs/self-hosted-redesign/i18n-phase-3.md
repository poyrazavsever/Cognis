---
title: Faz 3 Ayarlar Dil ve Ceviri Yonetimi
description: Ayarlar ekraninda locale yonetimi, UI translation editor, import/export ve dogrulama sonuclari.
phase: 3
status: completed
last_updated: 2026-07-19
---

# Faz 3 Ayarlar Dil ve Ceviri Yonetimi

Faz-3, Faz-1 ve Faz-2 i18n altyapisini owner tarafindan yonetilebilir hale
getirdi.

## Eklenenler

- Ayarlar sayfasina `Diller ve ceviriler` tab'i eklendi.
- Owner yeni locale ekleyebilir.
- Locale `draft`, `active`, `archived` lifecycle'i UI uzerinden yonetilebilir.
- Aktif locale instance default dili yapilabilir.
- Freelancer kendi arayuz dilini secebilir; tercih `user_preferences.language`
  ve `neta_locale` cookie'sine yazilir.
- Locale kartlarinda genel tamamlanma yuzdesi ve eksik anahtar sayisi gorunur.
- Namespace ve metin aramali UI translation editor eklendi.
- Editor Turkce ve Ingilizce referans metnini ayni satirda gosterir.
- Tekil translation override kaydedilebilir ve sifirlanabilir.
- JSON export paketi uretilebilir.
- JSON import preview ve commit akisi eklendi.
- I18n mutation'lari `runtime_events` icine `i18n.settings` olarak audit edilir.
- Import/export round-trip ve client negatif yetki smoke testi eklendi.

## Degisen dosyalar

| Alan | Dosya |
| --- | --- |
| Settings UI | `app/(dashboard)/settings/page.tsx` |
| Settings server actions | `app/(dashboard)/settings/actions.ts` |
| I18n service export/import/completion | `server/i18n/service.ts` |
| UI translation repository helpers | `server/repositories/i18n.ts` |
| User language preference service | `server/settings/preferences.ts` |
| Faz-3 smoke | `scripts/i18n-phase3-smoke.*` |

## Verification

Calistirilan komutlar:

```bash
pnpm typecheck
pnpm i18n:phase3-smoke
pnpm build
pnpm phase9:smoke
```

Sonuclar basarili. `pnpm build` sirasinda mevcut Next edge runtime static
generation uyarisi tekrar goruldu; Faz-3 kaynakli yeni bir hata degil.

## Faz-4'e kalan sinir

Bu faz ceviri yonetimini ekledi; uygulamadaki tum hardcoded metinleri henuz
katalog anahtarina tasimadi. Sayfa sayfa metin migration'i Faz-4'te yapilacak.
