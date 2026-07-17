<img src="public/logo/lightLogoLong.png" height="160" alt="Neta" />

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

- Node.js 22
- pnpm 11 (lokal geliştirme için)
- Production'da kalıcı disk/volume
- Localhost dışındaki production kurulumunda HTTPS reverse proxy

## Lokal kurulum

```bash
pnpm install --frozen-lockfile
cp .env.example .env.local
openssl rand -base64 32
```

Üretilen secret'ı `.env.local` içindeki `BETTER_AUTH_SECRET` alanına koyun, ardından:

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

Instance adı, kısa ad, açık/koyu logo, ikon, primary/accent renk, varsayılan görünüm ve radius yoğunluğu SQLite'ta tutulur ve root layout'a server-side uygulanır. Görseller yerel upload alanında saklanır. Branding mutation'ı yalnızca owner rolüne açıktır; portal aynı güvenli public marka çıktısını kullanır.

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

## Kalite kontrolleri

```bash
pnpm typecheck
pnpm phase8:release-boundary
pnpm phase8:import-smoke
pnpm build
```

`phase8:release-boundary`; Supabase, PWA ve browser database bağımlılıklarının runtime'a geri dönmesini engeller.

## Lisans

Bu proje kişisel self-hosting amacıyla geliştirilen proprietary bir projedir.
