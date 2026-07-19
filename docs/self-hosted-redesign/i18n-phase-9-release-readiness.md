---
title: I18n Faz 9 — Hardening, Migrasyon ve Release Readiness
description: Çok dilli sistemin self-host production yayınına hazır olduğunu gösteren migration, backup, API, Dokploy ve operasyon raporu.
phase: 9
status: completed
last_updated: 2026-07-19
---

# I18n Faz 9 — Hardening, migrasyon ve release readiness

Faz-9, çok dilli sistemin production self-host kurulumunda güvenli şekilde
yayınlanabilmesi için migration, backup/restore, import, mobil API ve operasyon
kapılarını kapatır.

## Sonuç

Çok dilli sistem release adayıdır.

- Yeni kurulumda `tr` ve `en` aktif gelir, default locale `tr` olur.
- Eski Türkçe kolonlar `content_translations` içine `tr` locale'iyle backfill
  edilir.
- Backfill tekrar çalışan migration'da duplicate üretmez.
- `fr` custom locale, content translation, backup ve restore zincirinde korunur.
- API v1 localization sözleşmesi additive ve eski mobil client'larla uyumludur.
- Runtime Supabase bağımlılığı veya Supabase env kullanımı geri gelmemiştir.
- Built-in kataloglar standalone server bundle içinde bulunur.

## Release kapıları

### Migration

`pnpm i18n:phase9-hardening` şu migration senaryolarını gerçek temp SQLite DB
üzerinde çalıştırır:

1. Boş DB migration.
2. Boş DB üzerinde ikinci migration çalıştırması.
3. 0000–0007 arası eski schema üzerinde production-benzeri Türkçe veri.
4. 0008 i18n migration'ı sonrası Türkçe backfill doğrulaması.
5. Aynı DB üzerinde tekrar migration ve idempotent count kontrolü.

Backfill doğrulanan alanlar:

- `project.name`
- `project.description`
- `task.title`
- `planning_section.title`
- `branding.portalWelcome`

### Backup ve restore

Hardening smoke, production-benzeri DB'ye `fr` custom locale ve Fransızca proje
çevirisi ekler, backup alır ve ayrı bir data directory içine restore eder.
Restore sonrası:

- `instance_locales.fr` aktif kalır.
- `content_translations` içindeki Fransızca çeviri korunur.
- `foreign_key_check` temiz döner.

Restore failure prosedürü de test edilir: checksum'u bozulan backup restore
edilmez ve mevcut hedef DB korunur.

### Supabase import uyumu

Faz-9, Supabase import aracının Faz-8 smoke kapsamını release blocker kabul eder.
`phase8:import-smoke` şu davranışları doğrular:

- dry-run DB'yi değiştirmez;
- apply import kayıtları taşır;
- `--allow-existing` idempotent upsert yapar;
- invalid enum, eksik foreign key ve unsafe storage path reddedilir;
- pre-import backup restore ile rollback provası yapılır.

Import aracı Supabase SDK kullanmaz; offline `neta-supabase-export` bundle'ını
okur.

## Dokploy / Docker operasyon notu

Dokploy'da `/app/data` kalıcı volume olmalıdır. Bu volume şunları taşır:

- `neta.db`
- `uploads/`
- `backups/`
- `tmp/`

Production deploy öncesi:

```bash
pnpm db:backup -- --retention-count 14
```

Restore provası production volume üstüne değil, ayrı geçici hedefe yapılmalıdır:

```bash
pnpm db:restore -- \
  --from /app/data/backups/neta-TIMESTAMP \
  --target /tmp/neta-restore-rehearsal \
  --force
```

Translation tabloları `neta.db` içinde olduğu için backup/restore kapsamında
otomatik korunur:

- `instance_locales`
- `instance_i18n_settings`
- `instance_ui_translations`
- `content_translations`
- `clients.portal_locale`
- `portal_invitations.locale`
- `user_preferences.language`

## Self-host default locale

Yeni kurulumda default locale `tr` olur. Owner Ayarlar üzerinden varsayılan dili
aktif başka bir locale'e alabilir. Default locale yalnız `active` locale olabilir;
draft veya archived locale default yapılamaz.

Mobil istemciler instance dil bilgisini şu endpoint'lerden keşfeder:

- `GET /.well-known/neta`
- `GET /api/v1/meta`
- `GET /api/v1/me`

## Dil ekleme ve import/export rehberi

Owner akışı:

1. Ayarlar → Diller ve çeviriler bölümünden yeni locale ekle.
2. Locale'i önce `draft` olarak tut.
3. UI çeviri eksiklerini tamamla veya JSON import ile yükle.
4. İçerik formlarındaki locale tab'larında proje/görev/portal metinlerini gir.
5. Portal'a hazır olduğunda locale'i `active` yap.
6. Gerekirse varsayılan locale'i değiştir.

Import/export:

- UI çeviri export paketi `neta-i18n` formatındadır.
- Import yalnız owner scope ile çalışır.
- Built-in locale'ler silinmez veya archived yapılamaz.
- Bozuk namespace/key/value import'u validation ile reddedilir.

## Portal müşterisine dil atama

Müşteri portal dili iki noktada belirlenir:

1. Portal daveti oluştururken seçilen locale.
2. Müşteri detayındaki portal dili ayarı.

Davet kabul edildiğinde:

- `clients.portal_locale` set edilir;
- client user preference dili aynı locale'e alınır;
- davet kabulü sonrası login ekranı davet locale'iyle açılır.

## Mobil API localization sözleşmesi

Mobil taraf locale'i şu sırayla çözmelidir:

1. Explicit query: `/api/v1/me?locale=en`
2. Better Auth session preference
3. Client portal locale
4. `Accept-Language`
5. Instance default locale

Unsupported explicit locale için server:

```json
{
  "ok": false,
  "error": {
    "code": "UNSUPPORTED_LOCALE",
    "message": "Unsupported locale.",
    "details": {
      "messageKey": "validation.unsupportedLocale"
    }
  }
}
```

Client kullanıcıya gösterilecek metni kendi catalog'undan `messageKey` ile
çözmelidir; program akışı stabil `code` alanına bağlanmalıdır.

## Gözlem ve performans

Faz-9 smoke seviyesi performans kapıları:

- Dashboard ve portal listeleri batch content resolver kullanır; N+1 translation
  sorgusu release riski kabul edilir.
- Missing translation durumunda raw key production kullanıcı arayüzüne düşmemeli;
  fallback chain kullanılmalıdır.
- Catalog version, UI translation mutation'larında artar ve mobil meta cache
  invalidation için kullanılabilir.
- Hassas içerik loglanmamalıdır; missing translation log'u key/locale seviyesinde
  kalmalıdır.

## Verification

Çalıştırılan komutlar:

```bash
pnpm phase-i18n:boundary
pnpm i18n:phase9-hardening
pnpm i18n:phase8-smoke
pnpm i18n:phase7-smoke
pnpm i18n:phase5-smoke
pnpm i18n:phase3-smoke
pnpm i18n:phase2-smoke
pnpm i18n:phase1-smoke
pnpm phase8:import-smoke
pnpm typecheck
pnpm build
pnpm phase9:smoke
git diff --check
```

`phase9:smoke` local listener açtığı için sandbox içinde `EPERM` alabilir; bu
durumda izinli çalıştırılmalıdır.

## Release uyarısı

Bu rapor teknik release readiness sağlar. Gerçek production cutover için ortam
sahibi yine şu dış adımları yürütmelidir:

- production backup;
- maintenance/read-only penceresi;
- final Supabase export/import;
- gerçek satır ve dosya checksum karşılaştırması;
- owner/client kabul smoke'u;
- DNS/reverse proxy geçişi;
- rollback retention penceresi.
