---
title: Faz 8 — Supabase Import ve Production Release Runbook
description: Export bundle sözleşmesi, doğrulama, cutover, backup, rollback, Docker ve upgrade operasyonları.
status: completed
last_updated: 2026-07-17
---

# Faz 8 — Supabase import ve production release runbook

Bu belge Neta self-hosted v3'ün operasyonel kaynağıdır. Eski PostgreSQL şeması, migration kayıtları ve v2 kurulum belgeleri aktif release ağacından kaldırılmıştır; gerektiğinde Git geçmişinden incelenebilir. Yeni instance kurulumu yalnızca SQLite migration'larını kullanır.

## 1. Tamamlanan runtime sınırı

- Auth yalnızca Better Auth kullanır.
- İş verisi yalnızca SQLite/Drizzle üzerinde çalışır.
- Dosyalar yalnızca `DATA_DIR/uploads` altında tutulur.
- Supabase SDK ve runtime env değişkenleri yoktur.
- PWA service worker, Dexie ve offline cache yoktur.
- Export/import aracı Supabase'e bağlanmaz; hazırlanmış offline bundle okur.

`pnpm phase8:release-boundary` bu sınırı kaynak kodda, `--build-output` argümanı ise build artifact'lerinde doğrular.

### Dependency denetimi

| Grup | Korunan doğrudan paketler | Gerekçe |
| --- | --- | --- |
| Runtime | `next`, `react`, `react-dom` | Web runtime ve SSR |
| Auth/veri | `better-auth`, `better-sqlite3`, `drizzle-orm`, `zod` | Auth, SQLite erişimi, schema ve input doğrulama |
| UI | `poyraz-ui`, `lucide-react`, `recharts`, `framer-motion`, `clsx`, `tailwind-merge`, `tailwindcss-animate` | Aktif component importları; Framer Motion auth shell'de reduced-motion ile, Recharts üç aktif ekranda kullanılır |
| Build/UI peer | `@tailwindcss/postcss`, `mermaid`, `react-hook-form` | Tailwind v4 build plugin'i; Poyraz molecule entrypoint'inin temiz pnpm/container build'inde doğrudan çözdüğü peer'ler |
| Tarih | `date-fns` | Aktif tarih filtreleme/formatlama |
| AI | `ai`, `@ai-sdk/react`, `@ai-sdk/google`, `@ai-sdk/openai`, `@ai-sdk/groq` | Chat stream'i ve kullanıcı tarafından seçilebilen aktif provider adapter'ları |

Kullanımı bulunmayan `dnd-kit`, Hook Form resolver ve UUID paketleri; Supabase SDK'ları, PWA ve Dexie paketleriyle birlikte kaldırıldı. `react-hook-form`, uygulama doğrudan form API'sini çağırmasa da Poyraz molecule bundle'ının statik import ettiği runtime peer olduğu için korundu. Temizlik sonrasında pnpm kurulum ağacı 231 paket küçüldü.

## 2. Export bundle v1

Import kökünde `export.json` ve varsa `storage/` ağacı bulunur:

```text
neta-export/
  export.json
  storage/
    avatars/
    project-assets/
```

Minimum envelope:

```json
{
  "format": "neta-supabase-export",
  "version": 1,
  "exported_at": "2026-07-17T10:00:00.000Z",
  "source": {
    "owner_user_id": "source-owner-uuid"
  },
  "tables": {
    "profiles": [],
    "clients": [],
    "client_activities": [],
    "projects": [],
    "project_planning_sections": [],
    "project_revisions": [],
    "tasks": [],
    "calendar_events": [],
    "finance_transactions": [],
    "daily_logs": [],
    "journals": [],
    "chat_sessions": [],
    "chat_messages": [],
    "proposals": [],
    "contracts": [],
    "invoices": [],
    "subscriptions": [],
    "app_settings": [],
    "document_embeddings": []
  },
  "storage": {
    "objects": []
  }
}
```

Eksik tablo anahtarları boş liste kabul edilir. Satırlar eski Supabase tablosundaki kolon adlarını kullanır. `user_id` taşıyan bütün satırlar `source.owner_user_id` ile aynı olmak zorundadır.

Storage kaydı:

```json
{
  "bucket": "project-assets",
  "object_path": "owner/project-cover.png",
  "local_path": "storage/project-assets/project-cover.png",
  "original_name": "project-cover.png",
  "mime_type": "image/png",
  "bytes": 12345,
  "sha256": "64-karakter-lowercase-hex",
  "project_id": "project-uuid",
  "portal_visible": true,
  "references": [
    {
      "type": "project_cover",
      "project_id": "project-uuid"
    }
  ]
}
```

`local_path` export root dışına çıkamaz. Desteklenen görseller PNG, JPEG, WebP ve GIF'tir; 5 MiB sınırı, byte count, SHA-256 ve magic-byte doğrulanır.

Export hazırlarken:

1. Supabase tablolarını JSON array olarak dışarı alın.
2. Yalnızca taşınacak owner'ın satırlarını bundle'a koyun.
3. `avatars` ve `project-assets` objelerini indirip relative `local_path` verin.
4. Her dosyanın byte count ve SHA-256 değerini storage manifest'e yazın.
5. Export klasörünü erişimi sınırlı, şifreli bir alanda tutun.

Auth kullanıcı export'u, access/refresh token, password hash ve secret key bundle'a eklenmemelidir. Araç böyle bir alanı kullanmaz.

## 3. Normalization ve güvenlik kararları

- Kaynak UUID/text ID'leri korunur.
- Kaynak owner kimliği hedef Better Auth owner kimliğine map edilir.
- `tasks.status=completed`, `done` olur.
- Ondalıklı para değerleri floating point kullanmadan integer minor unit'e çevrilir.
- Fatura vergi yüzdesi integer basis point'e çevrilir.
- Aynı tarihteki `daily_logs` ve `journals`, `journal_entries` içinde tek kanonik kayda birleşir.
- Birleşen journal referansları görev ve chat context'lerinde kanonik ID'ye çevrilir.
- Bilinmeyen enum, geçersiz tarih/para, duplicate ID ve eksik foreign key import'u durdurur.
- Eski AI API key'i import edilmez.
- Auth password/session verisi import edilmez.
- Eski client auth bağları temizlenir; müşteriler yeniden davet edilir.
- Tarihsel client revision actor'u geçerli principal bulunmadığında owner'a map edilir ve warning raporlanır.
- `document_embeddings` runtime'a taşınmaz; warning ile arşiv kapsamı dışında bırakılır.
- Project cover ve planning metadata içindeki taşınan storage referansları `/api/files/:id` URL'sine çevrilir.

## 4. Dry-run ve import

Hedefte migration'ları uygulayın ve ilk owner'ı `/register` üzerinden oluşturun. Owner ID'sini `user.id`/`app_profiles.auth_user_id` üzerinden belirleyin.

```bash
pnpm db:import:supabase -- \
  --from /secure/path/neta-export \
  --owner-user-id TARGET_OWNER_ID \
  --dry-run \
  --report /secure/path/import-dry-run-report.json
```

Dry-run DB veya upload alanını değiştirmez. Raporda kaynak sayıları, hedefe hazırlanmış sayılar, mevcut hedef sayıları ve warning'ler bulunur.

Apply:

```bash
pnpm db:import:supabase -- \
  --from /secure/path/neta-export \
  --owner-user-id TARGET_OWNER_ID \
  --report /secure/path/import-report.json
```

Araç boş domain hedefini varsayar. Kontrollü tekrar çalıştırma/merge gerekiyorsa:

```bash
pnpm db:import:supabase -- \
  --from /secure/path/neta-export \
  --owner-user-id TARGET_OWNER_ID \
  --allow-existing
```

Tekrar çalıştırma ID bazlı upsert'tir. Var olan aynı storage path yalnızca checksum aynıysa kabul edilir. Dosyalar DB transaction'ından önce stage edilir; DB hatasında yeni dosyalar geri alınır.

## 5. Production cutover

Gerçek production verisine erişim gerektiren bu adımlar otomatik checklist olarak işaretlenmez:

1. Mevcut Supabase sisteminin tam backup/export'unu alın.
2. Yeni Neta instance'ında owner'ı oluşturun.
3. Yeni instance'ın pre-import backup'ını alın.
4. Export bundle'ı dry-run ile doğrulayın.
5. Eski sistemi maintenance/read-only moda alın.
6. Son tablo ve storage export'unu üretin.
7. Final dry-run raporunu önceki sayımlarla karşılaştırın.
8. Import'u uygulayın.
9. Rapor, foreign key check, tablo sayıları ve storage checksum'larını doğrulayın.
10. Login, müşteri, proje, görev, finans, dosya ve portal davet akışlarını smoke test edin.
11. DNS/reverse proxy trafiğini yeni instance'a alın.
12. Client re-invite planını uygulayın.
13. Eski Supabase projesini en az 7 günlük rollback penceresi boyunca read-only tutun; daha uzun ürün/uyumluluk retention'ı gerekiyorsa bu süreyi artırın ve hemen silmeyin.

## 6. Rollback

Cutover öncesi:

```bash
pnpm db:backup -- --retention-count 14
```

Uygulamayı durdurduktan sonra doğrulama amaçlı ayrı hedefe restore:

```bash
pnpm db:restore -- \
  --from /app/data/backups/neta-TIMESTAMP \
  --target /tmp/neta-rollback-rehearsal \
  --force
```

Production rollback:

1. Yeni instance'ı maintenance'a alın ve durdurun.
2. Cutover öncesi backup'ı restore edin veya DNS'i read-only eski sisteme döndürün.
3. Restore sonrası `/api/health/ready` ve kritik akışları kontrol edin.
4. Yeni sistemde cutover sonrası yazı oluştuysa veri kaybı penceresini açıkça kaydedin; iki sistemi otomatik merge etmeyin.

`phase8:import-smoke`, pre-import backup'ı gerçek SQLite dosyasına restore ederek bu rollback yolunu fixture üzerinde doğrular.

## 7. Backup politikası

Örnek günlük cron:

```text
0 2 * * * cd /app && BACKUP_RETENTION_COUNT=14 node scripts/backup.mjs
```

- En az 14 günlük local retention önerilir.
- Backup'ı aynı diskle sınırlamayın; şifreli off-host kopya alın.
- Restore'u düzenli olarak geçici data directory üzerinde prova edin.
- Uygulama online iken backup alınabilir; restore sırasında process durmalıdır.
- Manifest dışı, değiştirilmiş veya symlink içeren backup reddedilir.

## 8. Docker, Coolify ve Dokploy

Ortak production sözleşmesi:

- Repository `Dockerfile` kullanılır.
- Internal port `3000`.
- Tek replica.
- `/app/data` persistent volume.
- `APP_URL` ve `NEXT_PUBLIC_SITE_URL` aynı HTTPS origin.
- Güçlü `BETTER_AUTH_SECRET`.
- Healthcheck `/api/health/ready`.
- Reverse proxy websocket/streaming response'ları kesmemeli ve request body limitini en az 8 MiB tutmalıdır.

Coolify/Dokploy'da Dockerfile build seçin; Nixpacks/ephemeral filesystem kullanmayın. Persistent volume deploy/rebuild sırasında silinmemelidir.

## 9. Upgrade ve rollback

1. Release tag/image'i sabitleyin.
2. Backup ve restore provasını tamamlayın.
3. Yeni image'i build edin.
4. Tek instance'ı durdurup yeni image'i başlatın.
5. Startup migration'ın başarılı olduğunu ve readiness'in `200` döndüğünü doğrulayın.
6. Kritik smoke testleri çalıştırın.

Migration sonrası geri dönüşte eski image ile birlikte upgrade öncesi DB backup'ı restore edilmelidir. Drizzle migration dosyalarını elle silmek veya SQLite şemasını elle downgrade etmek desteklenmez.

## 10. Release doğrulama komutları

```bash
pnpm phase1:smoke
pnpm phase4:ui-boundary
pnpm phase5:backend-boundary
pnpm phase6:portal-boundary
pnpm phase7:backend-boundary
pnpm phase8:import-smoke
pnpm phase8:release-boundary
pnpm typecheck
pnpm build
node scripts/phase8-release-boundary.mjs --build-output
```

Docker daemon bulunan hostta ayrıca:

```bash
docker compose config
docker compose build
docker compose up -d
curl --fail http://127.0.0.1:3000/api/health/ready
docker compose down
```

Production cutover checklist'i dış sisteme erişim, maintenance kararı ve DNS yetkisi gerektirir; fixture provası bu gerçek operasyonun yerine geçmez.
