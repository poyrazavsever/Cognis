<img src="apps/neta-app/public/logo/lightLogoLong.png" height="160" alt="Neta" />

# Neta

Neta; freelancer'ların müşteri, proje, görev, takvim, finans, günlük, AI ve sınırlı müşteri portalı akışlarını kendi sunucularında yönetebildiği bir Next.js uygulamasıdır.

Self-hosted v3 runtime'ı harici bir BaaS istemez:

- Next.js App Router ve React
- Better Auth
- SQLite (`better-sqlite3`) ve Drizzle ORM
- Yerel persistent dosya alanı
- Poyraz UI v3
- İsteğe bağlı Google, OpenAI, Groq veya Ollama AI sağlayıcısı

Supabase yalnızca eski bir Neta kurulumundan veri aktarmak için opsiyonel kaynak olabilir. Uygulamanın build veya runtime aşamasında Supabase projesi, paketi ya da environment değişkeni gerekmez.

## Monorepo yapısı

Tüm ürün yüzeyleri tek pnpm workspace ve tek `pnpm-lock.yaml` ile yönetilir:

```text
apps/neta-app/                  @neta/app — self-hosted Next.js uygulaması ve API
apps/neta-web/                  @neta/web — public landing sitesi
apps/neta-mobile/               @neta/mobile — Expo iOS/Android uygulaması
packages/api-contracts/         web ve mobilin ortak API sözleşmeleri
packages/design-tokens/         ortak tasarım tokenları
docs/                           mimari kararlar, runbook'lar ve yol haritaları
tools/desktop-assistant/        ürün dışı yardımcı masaüstü aracı
```

Bağımlılık kurulumunu yalnız repository kökünde yapın. Temel geliştirme komutları:

```bash
pnpm app:dev                    # web app, http://localhost:3000
pnpm web:dev                    # landing, http://localhost:3001
pnpm mobile:start               # Expo/Metro
pnpm dev:all                    # üçünü birlikte çalıştırır
```

Uygulama bazlı komutlar pnpm filtreleriyle de çalıştırılabilir; örneğin
`pnpm --filter @neta/web build` veya `pnpm --filter @neta/mobile check`.

## Çalışma modeli

Bir Neta instance'ı tek freelancer/owner ve birden fazla davetli müşteri hesabı için tasarlanmıştır. Uygulama tek bir uzun ömürlü Node.js process'i ve tek bir persistent data volume ile çalışır; aynı SQLite dosyasına yazan yatay ölçekli birden fazla replica desteklenmez.

Kalıcı veri ağacı:

```text
/app/data/
  neta.db
  uploads/
  backups/
  tmp/
```

## Gereksinimler

- Node.js 24 (`.nvmrc`)
- pnpm 11.5.1 (lokal geliştirme ve Docker build için; sürüm `packageManager` alanında sabittir)
- Production'da kalıcı disk/volume
- Localhost dışındaki production kurulumunda HTTPS reverse proxy

## Lokal kurulum

```bash
pnpm install --frozen-lockfile
cp apps/neta-app/.env.example apps/neta-app/.env.local
openssl rand -base64 32
```

Kökteki `pnpm-lock.yaml` bütün workspace'in tek canonical dependency lockfile'ıdır. Alt uygulamalarda ayrı lockfile veya workspace tanımı tutulmaz. Lokal kurulum, CI ve Docker image aynı çözümü kullanır.

Üretilen secret'ı `apps/neta-app/.env.local` içindeki `BETTER_AUTH_SECRET` alanına koyun, ardından:

```bash
pnpm dev
```

`pnpm dev` ve `pnpm start`, Next.js başlamadan önce bekleyen SQLite migration'larını otomatik ve idempotent olarak uygular. Migration'ı uygulamadan bağımsız çalıştırmak için `pnpm db:migrate` kullanılabilir.

`http://localhost:3000/register` adresinden ilk owner hesabını oluşturun. İlk başarılı kurulumdan sonra public kayıt atomik olarak kapanır.

## Environment sözleşmesi

Minimum production örneği:

```env
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://neta.example.com
APP_URL=https://neta.example.com
BETTER_AUTH_SECRET=openssl-ile-uretilmis-en-az-32-karakter-secret
DATA_DIR=/app/data
```

Opsiyonel alanlar:

- `BETTER_AUTH_URL`: Auth callback base URL override'ı.
- `TRUSTED_ORIGINS`: Virgülle ayrılmış ek güvenilir origin listesi; wildcard reddedilir.
- `DATABASE_PATH`: Varsayılan `DATA_DIR/neta.db` yerine özel SQLite yolu.
- `OLLAMA_BASE_URL`: Varsayılan `http://127.0.0.1:11434/v1`.
- `AI_REQUEST_TIMEOUT_MS`: AI istek timeout'u; varsayılan `30000`.
- `NETA_MINIMUM_MOBILE_VERSION`: Mobil istemcilere ilan edilen opsiyonel SemVer alt sınırı.

AI provider API key'leri environment'a yazılmaz; owner ayarından girilir, server-side şifreli saklanır ve browser'a geri dönmez.

## Docker ile production

```bash
export BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
export APP_URL="https://neta.example.com"
export NEXT_PUBLIC_SITE_URL="$APP_URL"
docker compose up -d --build
```

Compose; `/app/data` için named volume bağlar, migration'ları uygulamadan önce çalıştırır, non-root user kullanır ve readiness healthcheck tanımlar. Domain/HTTPS sonlandırmasını Caddy, Traefik, Nginx, Coolify veya Dokploy üzerinden yapın.

Health endpoint'leri:

- `/api/health/live`: Process liveness.
- `/api/health/ready`: SQLite, data directory ve migration readiness.
- `/api/health`: Hafif uyumluluk endpoint'i.

Coolify ve Dokploy'da repository'nin `Dockerfile` dosyasını kullanın, internal portu `3000` seçin ve `/app/data` yoluna persistent volume bağlayın. Tek replica kullanın. Ayrıntılı production ve upgrade runbook'u: [Faz 8 import/release rehberi](docs/self-hosted-redesign/phase-8-import-release.md).

## İlk owner ve müşteri daveti

İlk açılışta `/register` üzerinden freelancer hesabı oluşturulur. Sonraki kullanıcılar public kayıt olamaz.

Müşteri erişimi için:

1. Owner müşteri kaydını oluşturur.
2. Müşteri detayından süreli, tek kullanımlık davet üretir.
3. Müşteri linki açıp kendi şifresini belirler.
4. Better Auth hesabı ilgili müşteri kaydına transaction içinde bağlanır.

Davet token'ının yalnızca hash'i saklanır. Eski Supabase Auth şifre/session verileri import edilmez; taşınan müşteriler yeniden davet edilmelidir.

## Marka özelleştirmesi

`Ayarlar > Genel` alanındaki workspace adı, meta title, kısa uygulama adı, açık/koyu tema logoları, favicon, ana renk ve görünüm tercihi SQLite'ta tutulur ve root layout'a server-side uygulanır. Görseller yerel upload alanında saklanır. Branding mutation'ı yalnızca owner rolüne açıktır; portal aynı güvenli public marka çıktısını kullanır. `/api/v1/meta` bu markayı absolute asset URL'leriyle, `/api/v1/me` ise oturum sahibinin renk modu tercihiyle mobil istemcilere sunar.

## Backup ve restore

Online SQLite snapshot ve upload ağacı:

```bash
pnpm db:backup
pnpm db:backup -- --retention-count 14
```

`BACKUP_RETENTION_COUNT=14` aynı retention politikasını cron ortamından verebilir. Her backup; byte size ve SHA-256 içeren bir manifest üretir.

Restore sırasında uygulamayı durdurun:

```bash
pnpm db:restore -- --from /path/to/neta-backup --force
```

Farklı bir data directory'ye prova:

```bash
pnpm db:restore -- --from /path/to/neta-backup --target /tmp/neta-restore-test --force
```

Restore önce manifest bütünlüğünü doğrular, dosyaları stage eder ve DB/upload ağacını aynı filesystem üzerinde atomik swap ile değiştirir. Hata olursa önceki hedef geri alınır. Backup'ları ayrıca host dışındaki şifreli bir konuma kopyalayın.

## Upgrade

1. Mevcut sürümde backup alın ve geri yükleme provasını yapın.
2. Yeni image/tag'i indirin veya build edin.
3. Uygulamayı tek replica ile başlatın; container startup migration'ları deterministik uygular.
4. `/api/health/ready`, login, müşteri, proje ve portal akışlarını kontrol edin.
5. Sorunda eski image'i ve upgrade öncesi backup'ı kullanarak rollback yapın.

SQLite şema downgrade'i desteklenmez; yalnızca eski application image'ine dönmek yeterli değildir.

## Eski Supabase verisini aktarma

Önce bu instance'ta owner hesabını oluşturun, ardından export bundle üzerinde dry-run çalıştırın:

```bash
pnpm db:import:supabase -- \
  --from /secure/path/neta-export \
  --owner-user-id BETTER_AUTH_OWNER_ID \
  --dry-run
```

Raporu doğruladıktan ve backup aldıktan sonra aynı komutu `--dry-run` olmadan çalıştırın. Bundle formatı, normalization kararları, dosya yapısı ve production cutover/rollback adımları [Faz 8 rehberinde](docs/self-hosted-redesign/phase-8-import-release.md) tanımlıdır.

## Mobil istemci ve instance discovery

React Native istemcileri bir Neta kurulumunu şu public endpoint'lerle tanıyabilir:

```text
GET /.well-known/neta
GET /api/v1/meta
GET /api/v1/health
GET /api/v1/me
```

`/.well-known/neta` kalıcı instance kimliğini ve API URL'sini, `/api/v1/meta` marka/sürüm/capability sözleşmesini döndürür. `/api/v1/me` Better Auth session gerektirir ve token veya secret döndürmez.

Device pairing henüz runtime'a açılmamıştır; capability `planned` durumundadır. Mobil bağlantı algoritması ve API version kuralları [Faz 9 rehberinde](docs/self-hosted-redesign/phase-9-mobile-api.md), gelecek pairing/token güvenliği [ADR-0018](docs/self-hosted-redesign/adr-0018-device-pairing.md) belgesinde tanımlıdır.

Landing, self-hosted app, ortak backend API ve tek evrensel mobil uygulamanın hedef mimarisi ile uygulama sırası [platform master planında](docs/roadmaps/platform-master-plan.md) tanımlıdır.

## Kalite kontrolleri

Workspace genelindeki temel kontroller:

```bash
pnpm lint:all
pnpm typecheck:all
pnpm build:all
pnpm mobile:check
```

Web app'e özel release kontrolleri:

```bash
pnpm typecheck
pnpm phase8:release-boundary
pnpm phase8:import-smoke
pnpm phase9:smoke
pnpm build
```

`phase8:release-boundary`; Supabase, PWA ve browser database bağımlılıklarının runtime'a geri dönmesini engeller.

Güncel teknik yayın durumu, doğrulama kanıtları, kalıntı güvenlik riskleri ve gerçek production cutover sınırı: [2026-07-18 release-readiness raporu](docs/self-hosted-redesign/release-readiness-2026-07-18.md).

## Lisans

Bu proje kişisel self-hosting amacıyla geliştirilen proprietary bir projedir.
