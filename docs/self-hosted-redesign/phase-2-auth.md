---
title: Phase 1 Auth and Client Invitation Implementation
description: Better Auth, SQLite setup lock, session guards, client invitation lifecycle and auth audit implementation notes.
status: complete
last_updated: 2026-07-16
---

# Phase 1 Auth and Client Invitation Implementation

Bu dosya tarihsel adı korunarak Faz 1'de tamamlanan Better Auth + SQLite auth temelini kaydeder. Domain ekranlarının Supabase veri sorgularından taşınması Faz 2 ve sonraki domain fazlarının kapsamındadır; auth ve davet yaşam döngüsü artık Supabase Auth kullanmaz.

## Tamamlanan runtime parçaları

- `server/auth/auth.ts`: Better Auth config, first-owner user hook'ları ve session oluşturma audit/guard hook'ları.
- `server/auth/setup.ts`: transaction korumalı ilk owner kilidi, stale repair, başarısız setup kilidi temizliği ve auth audit yazımı.
- `server/auth/session.ts`: web ve Route Handler için session context, disabled profile ve role/client binding kontrolleri.
- `server/auth/invitations.ts`: davet üretme, hash-only token, replacement/revoke, expiry, transaction içinde kabul ve client access enable/disable servisi.
- `app/api/portal-invitations/*`: freelancer-only create/revoke ve public invitation accept adapter'ları.
- `app/api/portal-clients/[clientId]`: client portal erişimi enable/disable adapter'ı.
- `app/invite/[token]`: davet durumu ve müşterinin kendi şifresini belirlediği kabul ekranı.
- `server/db/migrations/0002_mighty_korg.sql`: `app_profiles.client_id` identity binding ve unique index migration'ı.

## İlk owner ve public registration

- Public `/api/auth/sign-up/email`, ilk owner'dan sonra database hook seviyesinde kapanır; yalnızca `/register` UI kontrolüne dayanmaz.
- Eşzamanlı ilk kayıt istekleri `app_setup_state` kilidiyle serialize edilir.
- İlk başarılı kullanıcı `app_profiles.role = freelancer` olarak bağlanır.
- Better Auth user insert ile session insert arasındaki hook sırası için stale repair çalışır; profile tamamlanmadan session verilmez.
- Setup başarısızsa aynı e-postaya ait pending kilit temizlenir ve `setup_failed` audit olayı yazılır.

## Client invitation sözleşmesi

- Yalnızca aktif `freelancer` rolü davet oluşturabilir veya iptal edebilir.
- Token `randomBytes(32)` ile üretilir; SQLite'ta yalnızca SHA-256 hash saklanır.
- Varsayılan TTL 72 saat, servis üst sınırı 168 saattir.
- Aynı `clientId` için yeni davet önceki pending davetleri revoke eder ve bu değişiklik audit edilir.
- Kabul sırasında Better Auth `user`, credential `account`, `app_profiles` client kaydı, `client_id` identity bağı ve invitation `accepted` durumu tek SQLite transaction'ında yazılır.
- Kullanılmış, değiştirilmiş, süresi dolmuş veya revoke edilmiş token yeniden kullanılamaz.
- Disable işlemi profile'ı kapatır ve o client'ın aktif Better Auth session kayıtlarını aynı transaction'da siler.
- Disabled veya `client_id` bağı eksik client, Better Auth endpoint'ini doğrudan çağırsa bile session oluşturamaz.

`app_profiles.client_id`, Faz 1 auth sınırında opaque domain identity bağıdır. Yerel `clients` tablosu ve foreign key Faz 2 domain migration'ında eklenecektir; mevcut Supabase client sayfaları bu nedenle henüz domain açısından hibrittir.

## Audit kapsamı

Kapsanan olaylar:

- setup start/completion/failure ve kapalı registration denemesi;
- login success/failure ve logout;
- invitation create/revoke/expire/accept/accept failure;
- client access disable/enable.

Raw invitation token, parola, session token veya auth secret audit metadata'sına yazılmaz.

## Production güvenlik ve env

- Production runtime'da en az 32 karakter `BETTER_AUTH_SECRET` zorunludur.
- `APP_URL`, `NEXT_PUBLIC_SITE_URL`, opsiyonel `TRUSTED_ORIGINS` ve secret Compose sözleşmesine eklenmiştir.
- Wildcard trusted origin reddedilir.
- Cookie'ler HTTPS deployment'ta `Secure`; tüm ortamlarda `HttpOnly`, `SameSite=Lax`, `Path=/` kullanır. Local Docker'ın `http://localhost` kurulumu kontrollü istisnadır; production'da localhost dışındaki HTTP `APP_URL` boot sırasında reddedilir.
- Build worker'ları SQLite module initialization sırasında birbirini kilitlemesin diye production build her process için ayrı geçici data dizini kullanır. Runtime yolu değişmez: `/app/data`.

## Doğrulama — 2026-07-16

| Kontrol | Sonuç |
| --- | --- |
| `npm run typecheck` | Başarılı |
| Değişen Faz 1 dosyalarında targeted ESLint | 0 error, 0 warning |
| `node scripts/phase1-smoke.mjs` | Başarılı |
| `node scripts/phase2-auth-smoke.mjs` | Başarılı |
| `node scripts/phase1-auth-smoke.mjs` | Başarılı, ardışık iki çalışma |
| `npm run build` | Başarılı, standalone route çıktısı üretildi |
| `docker compose config` | Başarılı, secret ve URL env'leri çözüldü |
| Docker image/runtime smoke | Çalıştırılamadı; yerel Docker daemon aktif değil |

Uçtan uca auth smoke şu senaryoları kapsar: concurrent first setup, kayıt kapanışı, owner login/logout, token'ın hash saklanması, replacement revoke, davet kabulü, replay reddi, expired/revoked token reddi, client→freelancer role ihlali, disable ile session revoke, disabled direct login reddi ve enable sonrası login.

Repo geneli lint, Faz 0'da kaydedilmiş eski feature dosyalarındaki baseline hatalar nedeniyle kalite kapısı olarak açık kalır. Faz 1'de değiştirilen dosyalarda yeni lint bulgusu yoktur.
