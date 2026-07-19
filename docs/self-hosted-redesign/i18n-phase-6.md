---
title: Faz 6 Müşteri Portal Dili ve Davet Akışı
description: Portal daveti, müşteri locale persistence, portal shell ve client-facing içerik çözümleme çıktıları.
phase: 6
status: completed
last_updated: 2026-07-19
---

# Faz 6 Müşteri Portal Dili ve Davet Akışı

Faz-6, müşteri portalının davet anından itibaren seçilen dilde açılmasını ve
client-facing domain içeriklerinin müşteri locale'inde çözülmesini sağlar.

## Tamamlananlar

- Portal daveti oluşturma akışına `locale` eklendi.
- Compatibility `/api/create-client-user` adapter'ı locale kabul eder hale geldi.
- `/api/portal-invitations` sözleşmesi locale kabul eder hale geldi.
- Davet locale'i yalnız aktif dillerden seçilebiliyor.
- Davet oluştururken invitation audit metadata'sına locale eklendi.
- Davet kabulünde:
  - `clients.portal_locale` set ediliyor.
  - client `user_preferences.language` kaydı oluşturuluyor.
  - accepted audit metadata'sına locale ekleniyor.
- Davet preview response'u locale döndürüyor.
- Davet sayfası invitation locale'i ile render ediliyor.
- Portal shell `I18nProvider` ile sarıldı.
- Portal sidebar seçili locale'e göre lokalize ediliyor.
- Portal dashboard, projeler, görevler, revizyonlar ve proje detay sayfasında
  temel UI metinleri portal namespace'ine bağlandı.
- Portal tarih formatları locale-aware formatter'a taşındı.
- Portal proje, planlama ve public görev içerikleri client locale'inde resolve
  ediliyor.
- Content resolver artık client-facing fallback zincirinde locale fallback +
  default locale kullanıyor.
- Müşteri detayında portal dili gösteriliyor/değiştirilebiliyor.
- Portal dili değişince bağlı client session'ları düşürülüyor; sonraki request
  yeni locale ile açılıyor.

## Eklenen route

- `PATCH /api/portal-clients/:clientId/locale`

Bu route sadece freelancer session ile çalışır, aktif locale zorunludur ve
client başka müşterinin locale bilgisini değiştiremez.

## Verification

Çalıştırılan komutlar:

```bash
pnpm typecheck
pnpm build
pnpm phase9:smoke
git diff --check
```

Sonuçlar başarılı. `pnpm build` sırasında mevcut Next edge runtime static
generation uyarısı tekrar görüldü; Faz-6 kaynaklı yeni bir hata değil.
