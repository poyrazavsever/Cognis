---
title: Phase 1 Runtime, SQLite and Deploy Skeleton
description: Faz 1 kapsamında eklenen Next.js standalone, SQLite, Drizzle migration, health, Docker ve backup/restore kanıtları.
status: complete
last_updated: 2026-07-16
---

# Phase 1 Runtime, SQLite and Deploy Skeleton

Bu dosya Faz 1 için uygulanan runtime iskeletini ve local doğrulama sonuçlarını kaydeder. Bu faz feature migration yapmaz; Supabase ve Poyraz UI runtime'ı henüz kaldırılmadı.

## Eklenen runtime yüzeyi

- `server/config.ts`: Zod ile server config parse eder, `DATA_DIR` ve `DATABASE_PATH` yollarını çözer.
- `server/db/client.ts`: `better-sqlite3` singleton connection, Drizzle client ve SQLite PRAGMA ayarlarını yönetir.
- `server/db/transaction.ts`: nested çağrılarda yeni transaction açmadan aynı connection üzerinde çalışan synchronous transaction helper.
- `server/db/health.ts`: readiness için data dir yazılabilirlik, `SELECT 1` ve migration table kontrolü.
- `server/db/schema/*`: Faz 1 runtime smoke tabloları.
- `server/db/migrations/*`: Drizzle tarafından üretilen ilk SQLite migration ve journal metadata.
- `app/api/health/live/route.ts`: process liveness endpoint'i.
- `app/api/health/ready/route.ts`: DB/data/migration readiness endpoint'i.
- `scripts/migrate.mjs`: production startup öncesi migration runner.
- `scripts/backup.mjs`: SQLite backup API kullanan backup POC.
- `scripts/restore.mjs`: overwrite guard içeren restore POC.
- `scripts/phase1-smoke.mjs`: migration, persistence, backup ve restore smoke.
- `Dockerfile`: multi-stage Next standalone image.
- `docker-compose.yml`: tek app service, named volume ve readiness healthcheck.

## Config davranışı

- `DATA_DIR` verilmezse development/test için `.data`, production için `/app/data` kullanılır.
- `DATABASE_PATH` verilmezse `DATA_DIR/neta.db` kullanılır.
- Relative path değerleri `process.cwd()` üzerinden absolute hale getirilir.
- Uygulama `data`, `uploads`, `backups` ve `tmp` dizinlerini kontrollü oluşturur.
- Secret değerler config validation çıktısına yazılmaz; mevcut config modülü boot sırasında değer dump etmez.
- Production build sırasında route modüllerinin SQLite başlatması için her worker/process ayrı bir geçici data dizini kullanır; production runtime varsayılanı `/app/data` olarak kalır.
- `APP_URL`, `NEXT_PUBLIC_SITE_URL`, `BETTER_AUTH_SECRET` ve `TRUSTED_ORIGINS` Compose ortam sözleşmesinde açıktır.

## SQLite davranışı

Connection açılırken uygulanan PRAGMA değerleri:

- `foreign_keys = ON`
- `journal_mode = WAL`
- `synchronous = NORMAL`
- `busy_timeout = 5000`

Connection `globalThis.__netaSqliteConnection` ile process içinde singleton tutulur. Development hot reload sırasında aynı process içinde duplicate connection oluşmaması hedeflenir.

## Migration davranışı

İlk migration:

- `server/db/migrations/0000_wise_reaper.sql`
- Tablolar: `runtime_checks`, `runtime_events`
- Journal: `server/db/migrations/meta/_journal.json`

Migration runner request sırasında çalışmaz. Docker startup komutu önce `node scripts/migrate.mjs`, sonra `node server.js` çalıştırır.

## Health endpoint sonuçları

Local dev server:

- Komut: `npm.cmd run dev -- --hostname 127.0.0.1 --port 3010`
- `/api/health/live`: HTTP 200, `{"status":"ok", ...}`
- `/api/health/ready`: HTTP 200, `dataDirWritable=true`, `databaseReachable=true`, `migrationsApplied=true`

Health response DB path, data path, schema path veya secret döndürmez.

## Doğrulama sonuçları

2026-07-16 güncel local sonuçları:

| Komut | Sonuç | Not |
| --- | --- | --- |
| `npm.cmd run db:generate` | Başarılı | İlk Drizzle migration üretildi. |
| `npm.cmd run db:migrate` | Başarılı | `.data/neta.db` üzerine migration uygulandı. |
| `npm.cmd run db:migrate` ikinci çalıştırma | Başarılı | Aynı DB üzerinde idempotency smoke geçti. |
| `npm.cmd run phase1:smoke` | Başarılı | Temp data dir, migration, persistence, backup ve restore geçti. |
| `npm.cmd run typecheck` | Başarılı | TypeScript temiz. |
| `npm.cmd run build` | Başarılı | Next.js production build geçti, standalone output etkin. |
| `node scripts/phase1-auth-smoke.mjs` | Başarılı | Localhost üzerinde setup, login/logout, invitation ve negatif role/token senaryoları geçti. |
| `docker compose config` | Başarılı | Production secret ve URL env sözleşmesi çözüldü. |
| `npm.cmd run lint` | Başarısız | Eski feature baseline'ında 31 error, 18 warning; değişen Faz 1 dosyalarında targeted lint temiz. |
| `docker compose build` | Çalıştırılamadı | Docker Desktop/Linux engine çalışmıyor: daemon socket bulunamadı. Docker runtime smoke henüz doğrulanmadı. |

## Backup/restore POC

`scripts/backup.mjs`:

- SQLite `backup()` API kullanır.
- Backup klasörü `DATA_DIR/backups/neta-<timestamp>` altında oluşur.
- `neta.db`, `uploads/` kopyası ve `manifest.json` üretir.
- Manifest her dosya için byte ve SHA-256 içerir.

`scripts/restore.mjs`:

- `--from <backup-dir>` zorunlu.
- `--target <data-dir>` ile ayrı restore hedefi verilebilir.
- Var olan DB üzerine yazmak için `--force` gerekir.

Eksik kalan restore sertliği:

- Restore manifest checksum doğrulaması henüz uygulanmadı.
- Docker içinde native SQLite smoke henüz çalıştırılamadı.

## Docker durumu

Dockerfile kararları:

- `node:22-bookworm-slim`
- `npm ci`
- `next.config.ts` içinde `output: "standalone"`
- Runtime user: `nextjs`
- Persistent volume: `/app/data`
- Startup: migration, sonra standalone `server.js`

Compose kararları:

- Tek application service: `neta`
- Named volume: `neta-data:/app/data`
- Healthcheck: `/api/health/ready`
- Restart policy: `unless-stopped`
- Replica sayısı tanımlı değil; hedef single instance.

Docker doğrulaması açık istisna:

- Local Docker daemon çalışmadığı için `docker compose build`, `docker compose up`, native SQLite Linux runtime ve container restart persistence testleri yapılamadı.
