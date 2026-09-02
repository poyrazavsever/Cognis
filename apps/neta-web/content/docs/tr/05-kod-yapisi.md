---
title: Kod Yapısı
description: Neta'nın frontend, backend, database, auth ve script yapısını açıklar.
order: 5
---

# Kod Yapısı

Neta, Next.js App Router üzerine kurulu self-hosted bir web uygulamasıdır. Backend mantığı Next.js server tarafında çalışır. Database SQLite, ORM Drizzle, auth ise Better Auth ile yönetilir.

## Genel Mimari

Neta'nın güncel mimarisi dış BaaS servislerine bağımlı değildir.

Ana parçalar:

- Next.js App Router
- React server ve client componentleri
- Better Auth
- SQLite
- better-sqlite3
- Drizzle ORM
- Local file storage
- Poyraz UI v3
- Docker standalone runtime

## Klasör Yapısı

Genel klasör yapısı şu şekildedir:

```text
app/
components/
config/
hooks/
lib/
public/
scripts/
server/
docs/
```

## app/

`app/` klasörü Next.js App Router sayfalarını ve route yapılarını içerir.

Bu klasörde dashboard, auth, portal ve API route yapıları bulunur.

Örnek kullanım alanları:

- Sayfalar
- Layout'lar
- Server actions
- API route handler'ları
- Dashboard client ekranları
- Portal ekranları

Route grupları uygulamanın farklı bölümlerini ayırmak için kullanılabilir.

## components/

`components/` klasörü ortak UI bileşenlerini içerir.

Neta'da hedef, uygulama içinde mümkün olduğunca Poyraz UI v3 bileşenlerini kullanmaktır. Bu sayede tasarım dili tek bir yerde kalır ve dark/light mod davranışı daha tutarlı olur.

Ortak bileşenler burada tutulabilir:

- Sidebar
- Header
- Form parçaları
- Modal içerikleri
- Empty state yapıları
- UI yardımcıları

## server/

`server/` klasörü uygulamanın backend tarafındaki ana mantığını içerir.

Burada domain servisleri, database şeması, migrationlar, repository benzeri veri erişim yapıları ve server-only yardımcılar bulunabilir.

Bu katmanda amaç, business logic'i doğrudan UI componentlerinin içine yaymamaktır.

## Database Katmanı

Neta SQLite kullanır.

Ana teknolojiler:

- `better-sqlite3`
- `drizzle-orm`
- Drizzle migrationları

SQLite seçiminin nedeni self-host deneyimini hafifletmektir. Kullanıcının ayrı bir PostgreSQL, Supabase veya managed database servisi kurması gerekmez.

Production'da database dosyası genellikle şu path altında bulunur:

```text
/app/data/neta.db
```

## Migration Yapısı

Migrationlar uygulama başlamadan önce çalıştırılır.

Docker runtime içinde startup komutu migrationları uygular ve ardından Next.js standalone server başlar.

Genel akış:

```text
node scripts/migrate.mjs
node server.js
```

Migrationlar idempotent çalışacak şekilde tasarlanmalıdır. Böylece container restart edildiğinde aynı migration tekrar güvenli biçimde kontrol edilir.

## Auth Katmanı

Kimlik doğrulama Better Auth ile yapılır.

Neta'daki auth modeli iki ana kullanıcı tipini destekler:

- Owner
- Müşteri portal kullanıcısı

İlk owner `/register` üzerinden oluşturulur. İlk owner oluşturulduktan sonra public kayıt kapanır.

Müşteri kullanıcıları owner tarafından oluşturulan davet akışıyla sisteme dahil edilir.

## Storage Katmanı

Dosyalar lokal filesystem üzerinde tutulur.

Logo, favicon, upload dosyaları ve backup çıktıları `/app/data` altında saklanır.

Örnek:

```text
/app/data/
  uploads/
  backups/
  tmp/
```

Bu alan Docker deploy sırasında persistent volume olarak bağlanmalıdır.

## lib/

`lib/` klasörü uygulama genelinde kullanılan yardımcı fonksiyonları ve ortak client/server araçlarını içerir.

Burada genellikle şu tür dosyalar bulunur:

- Formatlama yardımcıları
- URL yardımcıları
- Auth client helperları
- Tema ve görünüm yardımcıları
- Genel utility fonksiyonları

## config/

`config/` klasörü uygulama konfigürasyonuyla ilgili sabitleri veya merkezi ayarları barındırabilir.

Environment değerleri doğrudan her yerde okunmak yerine mümkün olduğunca merkezi helperlar üzerinden kullanılmalıdır.

## scripts/

`scripts/` klasörü operasyonel komutları içerir.

Bu scriptler geliştirme, release ve self-host operasyonlarında kullanılır.

Örnek script türleri:

- Migration
- Backup
- Restore
- Release boundary kontrolü
- Import smoke testi
- Supabase export bundle import aracı
- Standalone paket hazırlığı

## Poyraz UI

Neta'nın arayüzünde Poyraz UI v3 kullanılmalıdır.

Amaç, uygulamada farklı tasarım sistemlerinin karışmasını engellemektir. Button, dropdown, modal, input ve benzeri temel bileşenlerde Poyraz UI tercih edilmelidir.

Özellikle dark/light modda özel CSS yazmak yerine önce Poyraz UI'ın doğru variant ve effect kullanımı kontrol edilmelidir.

## API Yapısı

Neta içinde hem web arayüzü hem de ileride mobil istemciler için kullanılabilecek API endpointleri bulunur.

Örnek public endpointler:

```text
GET /.well-known/neta
GET /api/v1/meta
GET /api/v1/health
```

Oturum isteyen endpoint:

```text
GET /api/v1/me
```

Bu yapı mobil istemcilerin Neta instance'ını tanıyabilmesi için temel oluşturur.

## Supabase'siz Yapı

Güncel kod yapısında Supabase runtime bağımlılığı bulunmaz.

Uygulama şu servislere ihtiyaç duymaz:

- Supabase Auth
- Supabase PostgreSQL
- Supabase Storage
- Supabase Edge Functions

Eski Supabase kurulumlarından veri taşımak için offline import scriptleri tutulabilir. Bu scriptler runtime'a dahil değildir.

## Build ve Runtime

Production build Next.js standalone output üretir.

Docker runtime bu standalone çıktıyı çalıştırır. Böylece production container gereksiz development dosyalarıyla şişmez.

Runtime içinde:

- Migration çalışır.
- Server başlar.
- `/app/data` volume'u kullanılır.
- Health endpointleri kontrol edilir.

## Özet

Neta'nın kod yapısı tek bir self-hosted Next.js uygulamasını sade şekilde çalıştırmak üzerine kuruludur. Frontend, backend, auth, database ve storage aynı repo içinde yönetilir. Bu yapı deployment'ı kolaylaştırır ve freelancerın kendi sunucusunda bağımsız çalışmasını sağlar.
