---
title: Faz 0 Migration ve Geri Donus Sozlesmesi
description: Cok dillilik calismasi icin expand/migrate/contract sirasi ve backup kurallari.
phase: 0
status: completed
last_updated: 2026-07-19
---

# Faz 0 Migration ve Geri Donus Sozlesmesi

Bu sozlesme Faz-1'den itibaren veritabani degisikliklerinin nasil yapilacagini
tanımlar. Neta self-host bir urun oldugu icin migration'lar veri kaybi riski
tasimamali ve rollback hikayesi basit kalmalidir.

## Uygulama sirasi

1. Expand

Yeni tablolar ve yeni nullable kolonlar eklenir. Mevcut kolonlar kaldirilmaz,
renamelenmez ve zorunlu hale getirilmez.

2. Backfill

Mevcut Turkce veriler instance default locale'i kabul edilerek
`content_translations` icine kopyalanir. Orijinal kolonlar okunabilir kalir.

3. Dual read

Okuma katmani once translation resolver'a bakar, eksikse mevcut kolona duser.
Bu asamada eski veriler ve yeni veriler ayni anda calisir.

4. Dual write

Formlar instance default locale alanini hem mevcut kolona hem translation
tablosuna yazar. Ek locale'ler sadece translation tablosuna yazilir.

5. Contract

Ancak en az bir release sonra eski kolonlarin kaldirilmasi veya tamamen internal
fallback haline getirilmesi tartisilir. Ilk cok dillilik fazlarinda contract
adimi yapilmayacak.

## Backup adimlari

Her schema migration oncesi:

```bash
pnpm db:backup
```

Backup dosyasi deploy notuna yazilmalidir. Dokploy veya Docker deploy'da volume
path'i kontrol edilmeden migration calistirilmamalidir.

## Geri donus adimlari

Migration sonrasi kritik hata varsa:

1. Uygulama yeni surumden onceki image/commit'e geri alinir.
2. SQLite dosyasi backup'tan restore edilir.
3. `pnpm db:restore <backup-file>` veya host tarafindaki manuel restore adimi
   kullanilir.
4. Restore sonrasi `pnpm phase9:smoke` ile health/API temel davranisi kontrol
   edilir.

## Faz bazli DB dokunuslari

| Faz | DB degisikligi | Risk | Not |
| --- | --- | --- | --- |
| Faz-1 | Locale ve translation tablolari, `clients.portal_locale`, `portal_invitations.locale`, preference check constraint genisletme | Orta | Expand only. |
| Faz-2 | DB yok veya yalnizca katalog version seed'i | Dusuk | Runtime/cache agirlikli. |
| Faz-3 | UI translation CRUD | Orta | Admin-only mutation ve audit gerekli. |
| Faz-5 | Domain content translations dual write | Yuksek | Backfill ve resolver testleri sart. |
| Faz-6 | Portal locale davet akisi | Orta | Auth oncesi davet dili kritik. |
| Faz-8 | API contract genisletme | Dusuk/Orta | Backward compatible response alanlari eklenir. |

## Non-goal

Ilk cok dillilik release'inde asagidakiler yapilmayacak:

- Mevcut `projects.name`, `tasks.title` gibi kolonlari kaldirmak.
- Otomatik makine cevirisi eklemek.
- Public route'lara locale prefix eklemek.
- Chat/gunluk/revizyon taleplerini otomatik cevirmek.
- Kullanici yazili icerigini farkli locale'e sessizce overwrite etmek.
