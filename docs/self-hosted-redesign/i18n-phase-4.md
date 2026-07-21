---
title: Faz 4 Freelancer UI Migration
description: Freelancer uygulamasinda ortak shell, sidebar, dashboard ve locale-aware formatter migration sonuclari.
phase: 4
status: completed
last_updated: 2026-07-19
---

# Faz 4 Freelancer UI Migration

Faz-4, owner/freelancer uygulamasinda i18n runtime'in gercek UI yuzeylerine
baglanmasini baslatti ve teknik formatter sabitlerini kaldirdi.

## Tamamlananlar

- Dashboard layout request locale'e baglandi.
- Dashboard subtree `I18nProvider` ile sarildi.
- Sidebar grup ve linkleri katalog anahtarlarindan uretiliyor.
- App shell skip link, mobil menu, hesap dropdown'i, cikis ve progress metinleri
  locale-aware hale geldi.
- Dashboard ana sayfasi baslik, KPI label, filtre, bolum basliklari ve empty
  state metinlerinde katalog kullanmaya basladi.
- Müşteriler, projeler, görevler, finans, takvim, günlük ve sohbet ana
  header'lari katalogdan okunuyor.
- Freelancer client formatter'larinda sabit `tr-TR` kullanimi kaldirildi.
- Freelancer `date-fns/locale/tr` importlari merkezi locale mapping'e tasindi.
- `/projects` server-side sort locale-aware hale geldi.
- Faz-4 boundary script'i eklendi.
- Kalan hardcoded metin envanteri otomatik raporlanir hale geldi.

## Kalan UI metin raporu

Kalan derin form label'lari, dialog metinleri ve toast metinleri su raporda
listelendi:

- [Faz 4 hardcoded text report](i18n-phase-4-hardcoded-text-report.md)

Bu rapor Faz-4 boundary script'i tarafindan uretilir. Formatter sabitleri fail
eder; kalan kullanici metinleri sonraki UI migration dalgalarinda eritilecek
istisna envanteri olarak tutulur.

## Verification

Calistirilan komutlar:

```bash
pnpm i18n:phase4-boundary
pnpm typecheck
pnpm phase9:smoke
pnpm build
```

Sonuclar basarili. `pnpm build` sirasinda mevcut Next edge runtime static
generation uyarisi tekrar goruldu; Faz-4 kaynakli yeni bir hata degil.
