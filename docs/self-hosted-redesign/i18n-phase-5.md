---
title: Faz 5 Çok Dilli Domain İçerikleri
description: Proje, görev, planlama alanı ve portal metinleri için content translation altyapısı.
phase: 5
status: completed
last_updated: 2026-07-19
---

# Faz 5 Çok Dilli Domain İçerikleri

Faz-5, UI katalog çevirilerinden farklı olarak kullanıcı/veri içeriklerini
locale bazlı saklayan domain katmanını devreye aldı.

## Tamamlananlar

- `content_translations` tablosu için ortak registry ve field sözleşmesi
  oluşturuldu.
- `ContentTranslationService` eklendi.
- FormData içindeki çok dilli alanları okuyup default locale zorunluluğunu
  kontrol eden parser eklendi.
- Proje, görev ve planlama alanı create/update/delete akışları content
  translations ile senkronlandı.
- Default locale değerleri eski temel kolonlara projection olarak yazılmaya
  devam ediyor.
- Liste/detay okuma akışlarında proje, görev ve planlama alanı içerikleri
  seçili locale'e göre resolve ediliyor.
- Liste ekranlarında çeviriler batch okunuyor; N+1 pattern'i oluşmuyor.
- Proje oluşturma/düzenleme formu tab'lı çok dilli alanlara taşındı.
- Görev oluşturma/düzenleme formu tab'lı çok dilli alanlara taşındı.
- Proje detayındaki planlama alanı ve proje görev ekleme formları tab'lı çok
  dilli alanlara taşındı.
- Genel ayarlar içinde portal karşılama/footer metinleri `branding` entity'si
  olarak çok dilli hale getirildi.
- 0008 migration'a eski Türkçe içerikleri `tr` content translation kayıtlarına
  taşıyan idempotent backfill eklendi.
- Faz-5 smoke testi eklendi.

## Domain sözleşmesi

İlk kapsamda aktif entity/field seti:

- `project`: `name`, `description`, `coverImageAlt`
- `planning_section`: `title`, `content`
- `task`: `title`, `description`
- `branding`: `portalWelcome`, `portalFooter`

Default locale'de required olan alanlar boş bırakılamaz. Diğer locale'ler
opsiyoneldir ve eksik kaldığında okuma tarafı default locale'e düşer.

## Verification

Çalıştırılan komutlar:

```bash
pnpm i18n:phase5-smoke
pnpm typecheck
pnpm build
git diff --check
```

Sonuçlar başarılı. `pnpm build` sırasında mevcut Next edge runtime static
generation uyarısı tekrar görüldü; Faz-5 kaynaklı yeni bir hata değil.
