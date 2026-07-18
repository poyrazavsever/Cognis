# Faz 6 — Müşteri portalı backend geçişi

Tarih: 2026-07-16

## Kapsam

Bu faz, mevcut portal görsel yapısını koruyarak tüm portal veri okumalarını ve revizyon mutation akışını Supabase'ten Better Auth + SQLite + domain service katmanına taşır.

Taşınan route'lar:

- `/portal`
- `/portal/projects`
- `/portal/projects/:id`
- `/portal/tasks`
- `/portal/revisions`
- portal layout/session/branding adapter'ı
- proje detayındaki revizyon talebi Server Action'ı

## Veri sözleşmeleri

| Portal alanı | Yeni kaynak |
| --- | --- |
| Client kimliği | Better Auth session + iki yönlü `app_profiles.client_id` / `clients.auth_user_id` bağı |
| Proje listesi ve detayı | client-scoped `DomainService.listProjects/getProject` |
| Public görevler | `DomainService.listTasks`; `is_public_to_client = true` repository filtresi |
| Planning section | client project scope doğrulamasından sonra `listPlanningSections` |
| Revizyon geçmişi | project/client scoped revision repository |
| Revizyon talebi | actor-derived client, aktif proje ve kota kontrolüyle `BEGIN IMMEDIATE` transaction |
| Proje dosyaları | authenticated local file route; yalnızca `portal` visibility |
| Marka verisi | server-rendered local branding service |

## Yetkilendirme

- Portal actor yalnızca `requirePortalBackend()` tarafından Better Auth session'dan üretilir.
- Browser'dan `clientId`, owner ID veya auth user ID alınmaz.
- Client proje repository sorguları `projects.client_id`, `clients.id` ve `clients.auth_user_id` bağını birlikte doğrular.
- Spoofed `authUserId + clientId` actor kombinasyonu proje, görev, revizyon ve dosya erişiminde reddedilir.
- Project detail, planning, public task ve revision sorguları foreign project için `NOT_FOUND` davranışı verir.
- Private veya başka client'a ait project asset portal tarafından okunamaz.
- Revision action yalnızca `projectId` ve açıklama alır; client kimliği session actor'dan türetilir.

## Revizyon kotası

Portal detay adapter'ı toplam kotayı değil server-side hesaplanan kalan hakkı gösterir:

```text
used = rejected olmayan revision kayıtları
remaining = max(project.revision_quota - used, 0)
canRequest = project active && remaining > 0
```

Talep anındaki nihai kontrol UI sonucuna güvenmez. Service transaction içinde client-project eşleşmesini, proje durumunu ve kullanılmış kotayı yeniden hesaplar. Başarısız insert kota tüketmez.

## Dosya ve branding

- Portal-visible proje dosyası client session ile okunabilir.
- Private proje dosyası aynı project client'ı tarafından dahi okunamaz.
- Başka client'a ait portal-visible dosya `NOT_FOUND` döner.
- Client/file scope kontrolünde `clients.auth_user_id` bağı ayrıca doğrulanır.
- Portal layout application name ve logoları local branding service'ten server-side render eder.

## Doğrulama

- `pnpm phase6:portal-boundary`: sekiz portal runtime dosyasında Supabase import/env/erişimi olmadığını ve tüm server adapter'ların session-derived portal actor kullandığını doğrular.
- `pnpm phase2:domain-smoke`: cross-client, spoofed actor, private task, foreign planning/revision, inactive project ve kota negatiflerini doğrular.
- `pnpm phase3:storage-smoke`: portal/private/foreign/spoofed file authorization'ını doğrular.
- `pnpm phase6:smoke`: Better Auth client cookie ile beş portal route'unu SSR eder; local branding, public/private task ayrımı, planning ve revision geçmişini doğrular; foreign project route'unun 404 olduğunu kontrol eder.
- `pnpm typecheck`: başarılı.
- Faz 6 dosyalarında hedefli ESLint: başarılı.
- `pnpm build`: başarılı.
- `git diff --check`: başarılı.

Portal tasarımı ve UX revizyonu Faz 10'a; chat/AI ve business backend'i Faz 7'ye bırakılmıştır.
