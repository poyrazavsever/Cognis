---
title: Faz 0 Baseline Sonuclari
description: Cok dillilik calismasi baslamadan onceki build, typecheck ve smoke referansi.
phase: 0
status: completed
last_updated: 2026-07-19
---

# Faz 0 Baseline Sonuclari

Bu baseline, cok dillilik kod degisikliklerinden onceki saglik referansidir.
Sonraki fazlarda yeni hata olup olmadigini anlamak icin bu komut setiyle
karsilastirma yapilacak.

## Komut sonuclari

| Komut | Sonuc | Not |
| --- | --- | --- |
| `pnpm typecheck` | Basarili | `tsc --noEmit` hatasiz tamamlandi. |
| `pnpm build` | Basarili | Next.js 16.2.10 production build ve standalone hazirlama tamamlandi. |
| `pnpm phase9:smoke` | Basarili | API boundary, auth/invitation ve mobile API smoke kapilari gecti. |

## Build notu

`pnpm build` sirasinda su Next.js uyarisi goruldu:

```text
Using edge runtime on a page currently disables static generation for that page
```

Bu Faz-0 icin yeni bir hata degil; mevcut route/runtime tercihinden kaynaklanan
uyari olarak kaydedildi.

## Faz-1 icin baseline beklentisi

Faz-1 sonunda en az asagidaki komutlar tekrar calistirilmelidir:

- `pnpm typecheck`
- `pnpm build`
- Locale migration eklendikten sonra ilgili DB smoke komutu
- Varsa yeni `i18n` service unit/smoke komutu

Faz-5 ve Faz-6 gibi domain/portal davranisi degisen fazlarda `phase6:smoke` ve
portal-specific fixture testleri de baseline setine eklenmelidir.
