---
title: Faz 3 Yerel Storage ve Instance Branding
description: Güvenli local filesystem, dosya metadata, authorized file route'ları, backup checksum ve server-rendered branding sözleşmesi.
status: complete
last_updated: 2026-07-16
---

# Faz 3 Yerel Storage ve Instance Branding

Faz 3, avatar, branding ve project asset içeriklerinin Supabase Storage yerine instance'ın persistent data volume'ünde saklanabileceği güvenli backend temelini kurar. Mevcut feature sayfalarının bu servislere taşınması ilgili dikey sayfa fazlarında yapılacaktır; file ve branding çekirdeğinin kendisi Supabase, browser veya UI bağımlılığı taşımaz.

## Veri modeli

`0004_fancy_baron_zemo.sql` iki tablo ekler:

- `files`: owner/uploader, avatar subject veya project ilişkisi, tür, visibility, relative storage path, MIME, byte size ve SHA-256 metadata'sı;
- `instance_branding`: tek instance kaydı, uygulama isimleri, logo/icon file referansları, primary/accent renkleri, color mode, radius ve portal metinleri.

`files` tablosu tür-kaynak-visibility kombinasyonlarını SQLite CHECK constraint'iyle sınırlar. Mutlak path, `..`, sıfır/negatif byte size ve geçersiz checksum metadata seviyesinde de reddedilir. File foreign key'leri `restrict` kullanır; bir user veya project silinmesi physical dosyayı atlayarak orphan üretemez. Branding file referansları dosya silindiğinde `set null` olur.

## Filesystem sözleşmesi

Dosyalar yalnızca aşağıdaki servis tarafından üretilen relative path'lerde tutulur:

```text
uploads/
  avatars/<generated-id>.<detected-extension>
  branding/<generated-id>.<detected-extension>
  project-assets/<generated-id>.<detected-extension>
```

Actor, project ID veya original filename path üretiminde kullanılmaz. `resolveStoragePath` absolute path, backslash, boş segment, `.` ve `..` segmentlerini reddeder; çözülmüş path'in uploads root altında kaldığını ikinci kez doğrular.

Upload sırası:

1. Role/resource authorization ve policy doğrulanır.
2. İçerik instance `tmp/` alanına `wx` ve `0600` ile yazılır.
3. Hedef path'e overwrite etmeyen hard-link ile atomik publish edilir.
4. File metadata ve avatar `user.image` değişikliği `BEGIN IMMEDIATE` transaction'da yazılır.
5. Transaction başarısızsa yalnızca o işlemde oluşturulan physical dosya kaldırılır.

Delete işleminde dosya önce aynı data volume içindeki trash path'e taşınır, metadata transaction'ı tamamlanır, sonra trash kaldırılır. DB işlemi başarısızsa dosya eski yerine alınır. Avatar silinirse halen ilgili dosyayı gösteren `user.image` alanı da aynı transaction'da temizlenir.

Download sırasında metadata authorization yeniden uygulanır. File descriptor `O_NOFOLLOW` ile açılır; symbolic link izlenmez ve physical size metadata ile eşleşmelidir. Response `nosniff`, doğru Content-Type, byte length, ETag ve kontrollü cache header'ları taşır.

## Dosya politikası

- Maksimum dosya boyutu: 5 MiB.
- Allowlist: JPEG, PNG, WebP ve avatar/project/logo için GIF.
- Branding icon/favicon için yalnızca PNG kabul edilir; manifest MIME sözleşmesi sabit ve güvenli kalır.
- MIME yalnızca browser beyanından alınmaz; JPEG/PNG/WebP/GIF magic byte imzası içerikten doğrulanır.
- SVG ilk sürümde kabul edilmez. Böylece SVG script/external reference sanitizasyon bağımlılığı eklenmez.
- Original filename yalnızca download adı olarak normalize edilir; storage path'e girmez.

## Authorization matrisi

| Kaynak | Upload | Authenticated read | Public read | Delete |
| --- | --- | --- | --- | --- |
| Avatar | Aktif owner veya client, yalnızca kendisi | Owner veya avatar subject | Yok | Owner veya avatar subject |
| Branding logo/icon | Yalnızca owner | Owner | Yalnızca aktif branding kaydınca referanslanan dosya | Owner |
| Private project asset | Yalnızca project owner | Owner | Yok | Owner |
| Portal project asset | Yalnızca project owner | Owner veya projeye bağlı client | Yok | Owner |

Unauthorized resource varlığı sızdırmamak için cross-owner/cross-client read çoğunlukla `NOT_FOUND` döner. Branding public route'u `public_branding` visibility tek başına yeterli saymaz; dosyanın aktif `instance_branding` kaydındaki light logo, dark logo veya icon alanlarından birinde referanslanması gerekir.

Route sınırları:

- `POST /api/files`: authenticated multipart upload;
- `GET /api/files/:id`: authenticated authorized download;
- `DELETE /api/files/:id`: authorized delete;
- `GET /api/branding/assets/:id`: kontrollü public branding asset;
- `GET /api/branding`: public, secret içermeyen instance markası;
- `PATCH /api/branding`: owner-only branding mutation.

## Branding ve ilk render

Primary/accent değerleri yalnızca altı haneli hex olarak kabul edilir ve normalize edilir. Her renk için siyah/beyaz foreground arasından WCAG contrast oranı yüksek olan seçilir; smoke test en az 4.5:1 oranını doğrular. Hover/pressed, ring ve radius tokenları server-side üretilir.

Root layout her request'te branding'i SQLite'tan okur ve semantic CSS custom property'lerini doğrudan `<html style>` üzerinde üretir. `data-color-mode` ve dark class ilk HTML'de bulunur; system dark tercihi CSS media query ile uygulanır. Bu nedenle token veya color mode için hydration sonrası browser düzeltmesi ve ilk render parlaması gerekmez.

Metadata title, Apple web app adı, theme color ve icon da branding'den üretilir. `manifest.webmanifest` dinamik olarak application name, short name, primary color ve icon referansını kullanır. Light/dark logo alanlarından biri boşsa diğeri fallback olur; file silmek foreign key `set null` ile varsayılan asset durumuna döner. Dashboard ve client portal aynı root layout tokenlarını kullanır.

## Backup ve restore

Backup mevcut davranışını koruyarak SQLite dosyasını ve `uploads/` ağacını aynı backup klasörüne kopyalar; manifest her dosya için size ve SHA-256 içerir. Restore artık kopyalamadan önce:

- manifest formatını ve her path'in backup root içinde kalmasını;
- symlink bulunmadığını;
- size ve SHA-256 eşleşmesini;
- manifest dışında doğrulanmamış ek dosya bulunmadığını

kontrol eder. Bozuk veya sonradan değiştirilmiş bir upload içeren backup reddedilir.

## Doğrulama kapsamı

`npm run phase3:storage-smoke`, migration uygulanmış gerçek SQLite ve gerçek geçici filesystem üzerinde şunları doğrular:

- avatar, logo/icon ve private/portal project asset upload/read/delete;
- client avatar subject, project-client visibility ve cross-owner negatifleri;
- MIME allowlist, magic byte, 5 MiB limit ve SVG reddi;
- absolute/traversal/backslash path reddi ve symlink takip etmeme;
- DB CHECK constraint'leri ve physical/metadata delete tutarlılığı;
- owner-only branding mutation, file-kind eşleşmesi, logo fallback ve file silme;
- primary/accent normalization ve foreground contrast.

Uçtan uca auth smoke gerçek Next.js Route Handler'ları üzerinden anonymous error envelope, authenticated multipart upload, public referenced logo, client portal/private ayrımı, client avatar upload/delete, server-rendered token/metadata ve dinamik manifest'i test eder. Runtime backup smoke upload restore'unu ve bozuk checksum reddini doğrular.

| Kontrol | Sonuç |
| --- | --- |
| `npm run typecheck` | Başarılı |
| Değişen Faz 3 TypeScript dosyalarında targeted ESLint | 0 error, 0 warning |
| `npm run phase3:storage-smoke` | Başarılı |
| `node scripts/phase1-auth-smoke.mjs` | Başarılı; file/branding HTTP ve SSR dahil |
| `node scripts/phase1-smoke.mjs` | Başarılı; uploads backup/restore ve bozuk checksum reddi dahil |
| `pnpm db:generate` | Schema drift yok |
| `npm run build` | Başarılı; file/branding route'ları ve dinamik manifest üretildi |

Repo geneli lint, önceki fazlardan kayıtlı UI/AI baseline dosyalarında 31 error ve 18 warning ile açık kalır. Faz 3 dosyalarının targeted lint kontrolü temizdir.
