---
title: Neta Self-Hosted v3 Release Readiness
description: 2026-07-18 Supabase çıkışı, dependency, build, runtime, Docker ve production cutover denetimi.
status: release-candidate
audited_at: 2026-07-18
---

# Neta Self-Hosted v3 release readiness — 2026-07-18

## Sonuç

Repository teknik olarak Supabase'siz self-host release adayıdır.

- Uygulamanın build veya runtime aşamasında Supabase paketi, client/helper, environment değişkeni, SQL ağacı veya servis bağlantısı yoktur.
- İş verisi SQLite + Drizzle, auth Better Auth, dosyalar persistent local data volume üzerinden çalışır.
- Supabase environment değişkenleri özellikle unset edilerek production build ve standalone runtime doğrulanmıştır.
- Temiz Docker build, startup migration, non-root runtime, healthcheck, persistent volume ve restart smoke başarılıdır.
- Lokal geliştirme ve Docker aynı `pnpm@11.5.1` ile tek canonical `pnpm-lock.yaml` kullanır.

Bu sonuç gerçek production cutover'ın yapıldığı anlamına gelmez. Production verisi ve altyapı yetkisi workspace'te bulunmadığı için son export/import, DNS ve gerçek kullanıcı smoke adımları ortam sahibi tarafından yürütülmelidir.

## Supabase denetimi

Kaldırılan aktif release kalıntıları:

- `supabase/` altındaki PostgreSQL schema, migration, seed ve setup dosyaları
- `docs/database/` altındaki eski Supabase/PostgreSQL migration kayıtları
- Supabase kurulumunu anlatan çelişkili numaralı v2 belgeleri
- takip edilen geçici `.artifacts` logları ve Python bytecode çıktısı

Doğrulanan sınırlar:

- `@supabase/ssr` ve `@supabase/supabase-js` dependency/lockfile ağacında yok
- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` ve `SUPABASE_SERVICE_ROLE_KEY` runtime sözleşmesinde yok
- `app`, `components`, `config`, `lib`, `server`, proxy ve Next config içinde Supabase runtime importu yok
- `.next` production server/static çıktısında Supabase paket, env veya `supabase.co` referansı yok
- release boundary eski `supabase/` ve `docs/database/` ağaçlarının yeniden eklenmesini hata olarak kabul ediyor

Repository'de kalan `supabase` kelimeleri tarihsel dönüşüm belgeleri, regresyon sınırı testleri ve offline veri import aracıdır. `scripts/import-supabase.mjs` hazırlanmış bir export bundle'ını diskten okur; Supabase SDK kullanmaz, Supabase'e bağlanmaz ve uygulama runtime'ına import edilmez. Mevcut kurulumların verisini korumak için bilinçli olarak tutulmuştur.

## Bu denetimde düzeltilen release sorunları

1. Repo genelindeki ESLint hata ve uyarıları giderildi; props-state senkronizasyon effect'leri deterministik override modellerine taşındı, `any` kullanımları tiplendi ve görseller Next Image'a alındı.
2. `next/font/google` kaldırıldı. Üretim build'i artık Google Fonts ağına bağlanmadan sistem font stack'iyle deterministik tamamlanır.
3. Standalone build'in public ve static asset'leri eksiksiz paketlemesi için `postbuild` hazırlığı eklendi.
4. `pnpm start`, `output: standalone` ile uyumsuz `next start` yerine doğrudan standalone server'ı çalıştırır.
5. Docker ve lokal geliştirme arasındaki npm/pnpm lockfile ayrışması kaldırıldı. `package-lock.json` silindi; Docker frozen canonical pnpm lockfile kullanır.
6. Docker native dependency build scriptleri `pnpm-workspace.yaml` içindeki dar allowlist ile sınırlandı.
7. Docker build'deki gereksiz ikinci dependency kurulumu kaldırıldı.

## Doğrulama kanıtları

Başarılı kontroller:

- `pnpm lint`
- `pnpm typecheck`
- Faz 1 migration, persistence, backup retention, restore ve checksum smoke
- Faz 2 auth/domain smoke
- Faz 3 storage smoke
- Faz 4 UI boundary
- Faz 5 freelancer backend boundary/smoke
- Faz 6 portal boundary/smoke ve cross-client negatif akışlar
- Faz 7 AI/business boundary/smoke
- Faz 8 offline import dry-run/apply/idempotency/rollback smoke
- Faz 8 source ve build artifact release boundary
- Faz 9 API boundary/smoke
- Supabase environment değişkenleri olmadan production build
- Standalone migration, liveness, readiness, `/register`, public asset ve static CSS smoke
- Docker Node 22 build, Next 16.2.10, non-root `nextjs` user, startup migration ve readiness
- Aynı persistent volume ile Docker restart sonrası readiness
- `git diff --check`

Readiness yanıtında `dataDirWritable`, `databaseReachable` ve `migrationsApplied` kontrollerinin tamamı `true` dönmüştür.

## Güvenlik audit'i

Canonical production ağacında high veya critical advisory yoktur. `pnpm audit --prod` iki moderate bulgu raporlar:

1. Eski esbuild, Better Auth'ın opsiyonel Drizzle Kit/tooling zinciri üzerinden gelir. Advisory, esbuild development server'ın başka sitelere okunabilir yanıt vermesiyle ilgilidir; Neta production container'ı esbuild development server çalıştırmaz.
2. Next'in kendi içinde taşıdığı eski PostCSS sürümü için stringify advisory'si vardır. Neta production'da kullanıcıdan CSS alıp build/stringify etmez; PostCSS yalnızca güvenilen source build'inde çalışır.

Audit'in önerdiği zorunlu downgrade/force fix framework ve migration tooling'i uyumsuz sürümlere taşıdığı için uygulanmamıştır. Upstream Next ve Drizzle/Better Auth zinciri güncellendiğinde lockfile yenilenip audit tekrar çalıştırılmalıdır.

## Yayın öncesi kalan zorunlu dış adımlar

Gerçek production deploy için aşağıdakiler hâlâ ortam sahibinin sorumluluğundadır:

- güçlü ve benzersiz `BETTER_AUTH_SECRET`
- HTTPS reverse proxy ve doğru `APP_URL`, `NEXT_PUBLIC_SITE_URL`, gerekirse `TRUSTED_ORIGINS`
- kalıcı `/app/data` volume'u ve host-level şifreli/off-site backup
- mevcut kurulum varsa maintenance/read-only, final export, import dry-run/final import
- gerçek satır, dosya ve checksum karşılaştırması
- owner hesabı ve kritik owner/client akışlarının production smoke'u
- DNS geçişi ve tanımlı rollback penceresi

Ürün seviyesinde Faz 10'un sayfa bazlı responsive, accessibility, light/dark ve kullanıcı kabul checklist'leri master planda açık kalmaktadır. Bu maddeler teknik Supabase çıkışını engellemez; “Neta Self-Hosted v3 tamamen tamamlandı” etiketi için ayrıca kapatılmalıdır.
