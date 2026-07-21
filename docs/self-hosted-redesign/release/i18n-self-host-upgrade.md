---
title: Çok Dilli Sistem Self-host Upgrade Prosedürü
description: Neta i18n V2 geçişi için backup, migration, backfill, integrity ve release kabul adımları.
last_updated: 2026-07-21
---

# Çok Dilli Sistem Self-host Upgrade Prosedürü

Bu prosedür mevcut self-host kurulumlarda eski tek dilli içerikleri yeni
`content_translations` modeline güvenli şekilde taşımak için kullanılır.

## 1. Yayın öncesi hazırlık

1. Uygulamanın mevcut sürümünü durdurmadan önce kalıcı data dizinini doğrula:
   `DATA_DIR` ve `DATABASE_PATH` production değerleri Dokploy/host tarafında
   aynı volume'u göstermeli.
2. Mutlaka yedek al:
   `pnpm db:backup`
3. Yeni migration'ları uygula:
   `pnpm db:migrate`

## 2. Backfill

Önce dry-run çalıştır:

```bash
pnpm i18n:backfill
```

Çıktıdaki `planned` sayısı eklenecek çeviri satırlarını gösterir. Sonuç doğruysa
yazma modunu çalıştır:

```bash
pnpm i18n:backfill -- --write
```

Script idempotent çalışır; aynı kayıt/alan/locale için var olan çeviriyi ezmez.
Kaynak dil instance default locale'dir. Default ayar bulunamazsa güvenli fallback
olarak `tr` kullanılır.

## 3. Integrity raporu ve cleanup

Rapor modunda çalıştır:

```bash
pnpm i18n:integrity -- --report-only
```

Rapor; kullanıcı dil tercihi, müşteri portal dili, davet dili, bilinmeyen locale,
desteklenmeyen field ve orphan translation satırlarını listeler.

Yalnız orphan/desteklenmeyen `content_translations` satırlarını temizlemek için:

```bash
pnpm i18n:integrity -- --fix
```

Kullanıcı tercihi veya müşteri portal dili gibi ürün kararı gerektiren tutarsızlıklar
otomatik değiştirilmez; admin panelinden düzeltilmelidir.

## 4. Release gate

Kod tarafı hızlı kalite kapısı:

```bash
pnpm i18n:release-gate
pnpm typecheck
pnpm lint
pnpm build
```

`i18n:release-gate` şu kontrolleri yapar:

- TR/EN katalog key parity.
- Interpolation değişken parity.
- Login/register/forgot/reset auth ekranlarında dil seçici regresyonu.
- Bilgilendirme amaçlı hard-coded text sample raporu.

Browser smoke için kontrol listesi:

- `/login`, `/register`, `/forgot-password`, `/reset-password` ekranlarında dil
  seçici yok.
- Owner dili yalnız `/settings/language` üzerinden değişiyor.
- Portal dili yalnız `/portal/settings/language` üzerinden ve aktif diller
  arasından değişiyor.
- Dashboard, müşteri, proje, görev, takvim, finans, günlük, sohbet ve portal
  sayfaları TR/EN çalışıyor.
- Custom locale draft -> active -> archived akışı deneniyor.
- RTL test locale ile sidebar, header, dialog ve form tab'ları kırılmıyor.
- Create/edit formlarında çevrilebilir alanlar aktif dil sayısı kadar tab
  gösteriyor.

## 5. Rollback

Eğer migration veya backfill sonrası kritik problem çıkarsa:

1. Uygulamayı durdur.
2. Alınan yedeği geri yükle:
   `pnpm db:restore`
3. Eski image/sürüm ile uygulamayı tekrar başlat.

SQLite dosyası ve upload klasörü aynı volume içinde tutulduğu için restore
öncesinde ilgili volume'un yanlışlıkla silinmediğinden emin ol.

## 6. Büyük veri fixture ölçümü

Yayın adayı image'da en az bir büyük fixture ile şu süreler ölçülmeli:

- `pnpm db:migrate`
- `pnpm i18n:backfill -- --write`
- `pnpm i18n:integrity -- --report-only`
- İlk dashboard ve portal dashboard render süresi

Ölçüm sonucunda translation liste okumalarında N+1 belirtisi görülürse ilgili
sayfanın batch resolver kullanımı tekrar denetlenmelidir.
