---
title: Self Host ve Deploy
description: Neta'nın Docker, Dokploy, Coolify veya Compose ile nasıl self-host edileceğini açıklar.
order: 6
---

# Self Host ve Deploy

Neta self-hosted çalışacak şekilde tasarlanmıştır. Harici bir Supabase projesine, managed database servisine veya ayrı bir backend uygulamasına ihtiyaç duymaz.

Production ortamında temel ihtiyaçlar:

- Docker destekleyen bir sunucu
- HTTPS reverse proxy
- Kalıcı volume
- Güçlü auth secret
- Tek replica

## Minimum Environment

Production için önerilen minimum environment:

```env
NODE_ENV=production
DATA_DIR=/app/data
APP_URL=https://neta.example.com
NEXT_PUBLIC_SITE_URL=https://neta.example.com
BETTER_AUTH_URL=https://neta.example.com
BETTER_AUTH_SECRET=guclu-bir-secret
TRUSTED_ORIGINS=https://neta.example.com
```

`BETTER_AUTH_SECRET` güçlü ve benzersiz olmalıdır.

Secret üretmek için:

```bash
openssl rand -base64 32
```

## Kalıcı Veri Alanı

Neta'nın production verisi `/app/data` altında saklanır.

Bu klasör mutlaka persistent volume olmalıdır.

```text
/app/data/
  neta.db
  uploads/
  backups/
  tmp/
```

Bu alan silinirse database, upload edilen logolar, faviconlar ve backup dosyaları kaybolabilir.

## Docker ile Çalıştırma

Repository Dockerfile ile production build almaya hazırdır.

Docker Compose ile örnek çalışma:

```bash
export BETTER_AUTH_SECRET="$(openssl rand -base64 32)"
export APP_URL="https://neta.example.com"
export NEXT_PUBLIC_SITE_URL="$APP_URL"

docker compose up -d --build
```

Compose içinde `/app/data` için named volume bağlanır.

## Dokploy ile Deploy

Dokploy üzerinde önerilen yöntem Application + Dockerfile deploy'dur.

Temel ayarlar:

```text
Build Type: Dockerfile
Dockerfile Path: Dockerfile
Docker Context Path: .
Internal Port: 3000
Persistent Volume: /app/data
Replicas: 1
```

Environment:

```env
NODE_ENV=production
DATA_DIR=/app/data
APP_URL=https://neta.example.com
NEXT_PUBLIC_SITE_URL=https://neta.example.com
BETTER_AUTH_URL=https://neta.example.com
BETTER_AUTH_SECRET=openssl-ile-uretilmis-secret
TRUSTED_ORIGINS=https://neta.example.com
```

Domain ayarında container internal port olarak `3000` seçilmelidir.

Deploy sonrası kontrol:

```text
https://neta.example.com/api/health/live
https://neta.example.com/api/health/ready
https://neta.example.com/register
```

`/api/health/ready` başarılı dönüyorsa database, data directory ve migration kontrolleri sağlıklı demektir.

## Coolify ile Deploy

Coolify üzerinde de Dockerfile deploy kullanılabilir.

Önerilen ayarlar:

```text
Build Pack: Dockerfile
Port: 3000
Volume: /app/data
Replica: 1
```

Environment değerleri Dokploy ile aynıdır.

## Reverse Proxy ve HTTPS

Production ortamında Neta mutlaka HTTPS arkasında çalışmalıdır.

Domain:

```text
https://neta.example.com
```

şeklinde belirlenmelidir.

Environment değerlerinde domain ile birebir uyum önemlidir:

```env
APP_URL=https://neta.example.com
NEXT_PUBLIC_SITE_URL=https://neta.example.com
BETTER_AUTH_URL=https://neta.example.com
TRUSTED_ORIGINS=https://neta.example.com
```

Domain değişirse bu değerler de güncellenmelidir.

## Tek Replica Kuralı

Neta SQLite kullandığı için aynı database dosyasına yazan birden fazla replica desteklenmez.

Production'da:

```text
Replicas: 1
```

şeklinde çalıştırılmalıdır.

Yatay ölçekleme gerekiyorsa ileride farklı bir database stratejisi planlanmalıdır.

## İlk Kurulum

Deploy tamamlandıktan sonra:

```text
https://neta.example.com/register
```

adresine gidilir ve ilk owner hesabı oluşturulur.

İlk owner oluşturulduktan sonra public kayıt kapanır. Bu davranış güvenlik için bilinçli olarak uygulanır.

## Health Endpointleri

Neta health kontrolü için şu endpointleri sağlar:

```text
GET /api/health/live
GET /api/health/ready
GET /api/health
```

`live` endpoint process'in ayakta olup olmadığını gösterir.

`ready` endpoint database, migration ve data directory durumunu kontrol eder.

## Backup

Production ortamında düzenli backup alınmalıdır.

Komut:

```bash
pnpm db:backup
```

Backup dosyaları yalnızca aynı sunucuda tutulmamalıdır. Harici ve güvenli bir lokasyona kopyalanmalıdır.

## Restore

Restore işleminden önce uygulama durdurulmalıdır.

Komut:

```bash
pnpm db:restore -- --from /path/to/neta-backup --force
```

Restore sonrası uygulama tekrar başlatılır ve health endpointleri kontrol edilir.

## Upgrade

Yeni sürüme geçerken önerilen akış:

1. Backup alın.
2. Backup restore provasını yapın.
3. Yeni image veya commit ile deploy başlatın.
4. Startup migrationların başarılı tamamlandığını kontrol edin.
5. `/api/health/ready` endpointini kontrol edin.
6. Login, müşteri, proje ve portal akışlarını test edin.

SQLite şema downgrade'i desteklenmez. Bu yüzden upgrade öncesi backup önemlidir.

## Supabase'ten Geçiş

Neta'nın güncel sürümü Supabase'e ihtiyaç duymaz.

Eski bir Supabase kurulumundan veri taşınacaksa offline export bundle üzerinden import yapılabilir.

Genel akış:

```bash
pnpm db:import:supabase -- \
  --from /secure/path/neta-export \
  --owner-user-id BETTER_AUTH_OWNER_ID \
  --dry-run
```

Dry-run raporu doğrulandıktan sonra komut `--dry-run` olmadan çalıştırılır.

Supabase Auth şifreleri veya sessionları taşınmaz. Müşteri kullanıcıları yeniden davet edilmelidir.

## Yayın Öncesi Kontrol Listesi

Production'a çıkmadan önce şu kontroller yapılmalıdır:

- Domain DNS kaydı doğru.
- HTTPS aktif.
- `APP_URL` doğru.
- `NEXT_PUBLIC_SITE_URL` doğru.
- `BETTER_AUTH_URL` doğru.
- `BETTER_AUTH_SECRET` güçlü ve benzersiz.
- `/app/data` persistent volume bağlı.
- Replica sayısı 1.
- `/api/health/ready` başarılı.
- İlk owner hesabı oluşturuldu.
- Logo, favicon ve tema ayarlandı.
- Backup stratejisi belirlendi.
- Login testi yapıldı.
- Müşteri oluşturma testi yapıldı.
- Proje oluşturma testi yapıldı.
- Müşteri portal daveti test edildi.

## Özet

Neta self-host deployment için sade bir yapıya sahiptir. Tek container, tek persistent data volume ve doğru environment değerleriyle çalışır. Dokploy, Coolify veya Docker Compose üzerinde kolayca yayınlanabilir.
