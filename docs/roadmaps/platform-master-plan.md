---
title: Neta Platform Master Planı
status: active
current_phase: M0-complete
last_updated: 2026-09-02
owners:
  - platform
  - backend-api
  - mobile
  - security
---

# Neta platform master planı

## 1. Ürün kararı

Neta üç ürün yüzeyinden oluşur:

1. `neta-web`: ürünü anlatan public landing sitesi.
2. `neta-app`: kullanıcının kendi sunucusunda çalıştırdığı web uygulaması ve
   kanonik backend.
3. `neta-mobile`: App Store ve Google Play'de Neta tarafından bir kez
   yayınlanan, farklı self-hosted Neta instance'larına bağlanabilen evrensel
   mobil istemci.

Self-host eden kişinin mobil uygulamayı fork etmesi, bundle ID değiştirmesi veya
ayrı mağaza build'i alması temel kullanım akışının parçası olmayacaktır. Mobil
uygulama ilk bağlantıda instance domain'ini elle alır veya domain ile tek
kullanımlık pairing secret'ını taşıyan bir QR kod okur. Hesaplar ilk ürün
sürümünde merkezi Neta hesabında değil, bağlanılan self-hosted instance'ta
yaşar.

Bu karar mevcut mobil uygulamadaki build-time tek-instance modelini değiştirir.
`EXPO_PUBLIC_NETA_ORIGIN` production zorunluluğu ve domain/pairing akışını
yasaklayan eski release gate'leri, ilgili yeni faz tamamlandığında kaldırılacak
veya yeni ürün sözleşmesine göre yeniden yazılacaktır. Eski mobil redesign
belgeleri tarihsel uygulama kanıtıdır; bundan sonraki ürün önceliği için bu
belge üst seviye doğruluk kaynağıdır.

## 2. Başarı ölçütü ve kapsam sınırı

İlk production hedefi şu uçtan uca senaryodur:

1. Kullanıcı Neta'yı tek Node.js process, SQLite ve persistent volume ile kendi
   domain'inde yayınlar.
2. Web üzerinden owner hesabını ve marka ayarlarını oluşturur.
3. Resmî Neta Mobile uygulamasını mağazadan indirir.
4. Domain'i girerek veya web uygulamasının ürettiği QR'ı okutarak instance'ı
   doğrular.
5. Instance hesabıyla güvenli biçimde giriş yapar.
6. Owner'ın temel müşteri, proje, görev ve takvim akışları web ve mobilde aynı
   domain servisleri üzerinden çalışır.
7. Owner'ın davet ettiği müşteri kendi rolüyle giriş yaptığında yalnız kendisine
   açılan portal verisini görür.
8. Instance upgrade, backup/restore veya mobil token yenileme süreçleri tenant
   izolasyonunu ve session güvenliğini bozmaz.

İlk release kapsamı dışında kalanlar:

- Neta Cloud veya merkezi tenant veritabanı.
- Kod ile domain çözmek için merkezi instance directory/relay.
- Aynı SQLite dosyasına yazan yatay ölçekli birden fazla app replica'sı.
- Kullanıcıya özel white-label App Store/Play Store binary'si.
- Tam çevrimdışı mutation kuyruğu ve conflict merge motoru.
- Web ile React Native arasında görsel component paylaşımı.

Yalnız kısa bir kodun domain bilinmeden çalışması merkezi ve güvenilir bir
resolver gerektirir. Bu servis ilk fazda kurulmayacaktır. İlk pairing sözleşmesi
QR içinde `origin + secret`, manuel akışta ise `domain + code` kullanır.

## 3. Monorepo hedefi

```text
apps/
  neta-app/              Next.js self-hosted ürün + API
  neta-web/              Next.js public landing
  neta-mobile/           Expo/React Native iOS ve Android
packages/
  api-contracts/         Wire DTO, runtime guard ve API sabitleri
  design-tokens/         Platformdan bağımsız renk/spacing tokenları
docs/
  mobile/                Mobil ADR, runbook ve tarihsel faz kayıtları
  roadmaps/              Üst seviye aktif yol haritaları
  self-hosted-redesign/  Self-hosted mimari ve geçiş kayıtları
tools/
  desktop-assistant/     Ürün workspace'inden ayrılmış yardımcı araç
```

Repo kuralları:

- Tek package manager `pnpm@11.5.1`, tek `pnpm-lock.yaml` ve tek
  `pnpm-workspace.yaml` kullanılır.
- Uygulama paket adları sırasıyla `@neta/app`, `@neta/web` ve `@neta/mobile`dır.
- Uygulamalar birbirinin kaynak klasörüne relative import yapmaz; paylaşım
  yalnız `packages/*` üzerinden olur.
- `api-contracts` backend presenter testleri ile mobil runtime guard'larının
  ortak sınırıdır. DB entity tipi bu pakete konmaz.
- `design-tokens` DOM veya React Native component'i içermez.
- Root `package.json` yalnız orkestrasyon yapar; uygulama bağımlılıkları ilgili
  app manifestinde kalır.
- Docker yalnız `@neta/app` dependency graph'ını kurar ve standalone çıktıyı
  çalıştırır. Landing ve mobil kaynakları production app image'ına girmez.
- Environment dosyaları app-localdır. Compose değişkenleri repository kökündeki
  deployment ortamından gelir.

## 4. Hedef runtime mimarisi

```mermaid
flowchart LR
  W[Web browser] --> WA[Next web UI]
  M[Neta Mobile] --> V1[/api/v1]
  WA --> WS[Web actions/routes]
  V1 --> AR[Ortak auth + actor resolver]
  WS --> AR
  AR --> DS[Domain/application services]
  DS --> R[Repositories]
  DS --> FS[File/i18n/branding/AI services]
  R --> DB[(SQLite)]
  FS --> VOL[(Persistent data volume)]
```

Temel ilke: mobil için ikinci bir backend veya ikinci bir iş kuralı katmanı
oluşturulmaz. Web action ve `/api/v1` transport katmanları farklı olabilir;
authorization, transaction ve domain invariants aynı service/repository
katmanından geçer.

Bir v1 request'in zorunlu hattı:

```text
cookie veya bearer auth
  -> aktif user/session çözümü
  -> server-side role/tenant actor
  -> input parse ve validation
  -> domain/application service
  -> wire presenter
  -> versioned JSON envelope
```

Request body içindeki `userId`, `ownerId`, `clientId` veya scope hiçbir zaman
authorization kaynağı değildir. Client kaynağı başka tenant'a aitse varlığını
sızdırmamak için tercih edilen sonuç `404` olacaktır.

## 5. Mevcut durum ve doğrulanmış açıklar

### Tamamlanan temel

- Self-hosted Next.js runtime, Better Auth, SQLite/Drizzle ve yerel dosya alanı
  mevcut.
- Instance discovery, meta, health ve localization bootstrap'ı mevcut.
- Mobil tarafta origin normalizasyonu, aynı-origin discovery kontrolü,
  instance-scoped storage, SecureStore ve cookie/bearer header köprüsü mevcut.
- Mobil owner ve portal ekranlarının önemli bölümü ile wire guard'lar mevcut.
- Monorepo fiziksel dizilimi ve tek workspace/lockfile düzeni tamamlandı.

### Release'i bloke eden açıklar

- Mobil production build halen `EXPO_PUBLIC_NETA_ORIGIN` ile tek instance'a
  bağlanıyor; kullanıcıya domain veya QR bağlantı ekranı sunulmuyor.
- Eski mobil phase gate'i instance switching ve pairing kodunu bilinçli olarak
  yasaklıyor.
- Backend `/api/v1` yüzeyi yalnız bootstrap seviyesinde; dashboard, clients,
  projects, tasks, calendar, finance, journal, files, chat, settings ve portal
  resource route'ları eksik.
- `/me`, preferences ve localization catalog sözleşmelerinde backend ile mobil
  parser arasında alan adı/response şekli farkları var.
- Capability ilanı ile gerçekten çalışan route grupları aynı şeyi ifade etmiyor.
- Backend'de kalıcı pairing challenge, device session, refresh rotation,
  idempotency ve optimistic concurrency altyapısı yok.
- `packages/api-contracts` henüz backend tarafından kanonik response contract'ı
  olarak tüketilmiyor.

Endpoint seviyesindeki ayrıntılı envanter ve 18 backend uygulama fazı için
[`Neta Backend Mobil API Ana Uygulama Planı`](../neta-backend-mobile-api-master-plan.md)
kullanılır. Bu belge ürün sırasını ve release kararlarını, o belge ise route
uygulama ayrıntısını yönetir.

## 6. Değişmez teknik kararlar

### 6.1 Instance kimliği

- Domain kimlik değildir. Kanonik kimlik server'ın ürettiği kalıcı
  `instanceId` değeridir.
- Mobil registry anahtarı `instanceId`, bağlantı metadata'sı `origin` olur.
- Aynı origin farklı `instanceId` döndürürse restore/reinstall olasılığı
  kullanıcıya gösterilir; eski credential sessizce gönderilmez.
- Redirect en fazla üç hop izlenir; HTTPS'ten HTTP'ye downgrade ve origin dışına
  credential taşıma yasaktır.

### 6.2 Auth

- Web cookie auth çalışmaya devam eder.
- V1 auth resolver hem geçerli Better Auth cookie'sini hem server'ın yönettiği
  opaque bearer device token'ını aynı actor modeline dönüştürür.
- Mobilde email/password + güvenli session ilk bağlantı için en kısa teslim
  yoludur. Pairing bunun üstüne parola yazmadan bağlanma ve cihaz yönetimi ekler.
- Access token 15 dakika, refresh token varsayılan 30 gün; refresh her kullanımda
  rotate edilir.
- Raw token ve pairing secret DB, log, analytics, URL veya audit payload'ına
  yazılmaz; yalnız keyed digest saklanır.
- Password change, user disable, logout-all ve restore token family'lerini
  geçersiz kılar.

### 6.3 API

- Major sürüm URL'dedir: `/api/v1`.
- Başarı `{ ok: true, data }`, hata `{ ok: false, error }` zarfıdır.
- Tüm v1 yanıtları `X-Neta-API-Version: 1` taşır.
- Timestamp UTC ISO-8601, business date `YYYY-MM-DD`, para integer minor unit
  ve ISO currency code'dur.
- Liste endpoint'leri deterministik sıralama, opaque cursor ve üst sınırı 100
  olan limit kullanır.
- Mutation'lar gerektiğinde `Idempotency-Key`; update/delete işlemleri
  optimistic concurrency version'ı kullanır.
- Capability ancak endpoint, contract, authorization ve live smoke kapıları
  geçtiğinde `available` olur.

### 6.4 Veri ve deployment

- SQLite nedeniyle production `@neta/app` tek writer process/replica olarak
  çalışır.
- Migration startup'ta idempotent uygulanır; schema downgrade desteklenmez.
- Backup DB ile upload ağacını birlikte ele alır.
- Restore sonrasında device token epoch rotate edilir.
- Public internet deployment'ında HTTPS ve doğru canonical origin zorunludur.

## 7. Öncelikli API matrisi

| Grup | Minimum endpointler | Rol | Sıra |
| --- | --- | --- | --- |
| Bootstrap | discovery, health, meta, catalog | public | P0 |
| Session | me, preferences, sign-in/out | owner/client | P0 |
| Owner core | dashboard, clients, projects, tasks | owner | P0 |
| Owner planning | calendar | owner | P1 |
| Owner records | finance, journal | owner | P1 |
| Workspace | profile, general, appearance, locale, security | owner | P1 |
| Files | upload, list, download, delete | owner/client-scope | P1 |
| Portal | projects, tasks, revisions, profile | client | P2 |
| Intelligence | chat, project risk, finance analysis | owner | P2 |
| Devices | challenge, exchange, refresh, list, revoke | owner/device | P2 |

P0 bitmeden mobil mağaza beta'sı “feature complete” sayılmaz. P1 owner parity,
P2 portal/pairing ve ileri özelliklerdir. Pairing P2 olsa da manuel domain +
email/password bağlantısı P0'da çalışır; böylece API teslimi pairing
kriptografisine kilitlenmez.

## 8. Fazlı uygulama planı

### M0 — Monorepo standardizasyonu

Durum: tamamlandı.

Teslimler:

- Üç ürün `apps/neta-app`, `apps/neta-web`, `apps/neta-mobile` altına taşındı.
- Ortak paketler `packages/*`, mobil belgeler `docs/mobile` altına alındı.
- Root workspace filtreleri, app adları, Expo Metro alias'ları, CI path filtreleri
  ve Docker/standalone yolları yeni düzene uyarlandı.
- Ayrı repository metadata'ları çalışma ağacından çıkarılıp local artifact olarak
  korundu; canonical kaynak root Git repository oldu.

Çıkış kapısı:

- Root install/frozen-lockfile, recursive package list, üç app typecheck/lint,
  iki web build'i ve mobil release gate'i geçer.
- Docker release boundary yeni app path'lerini doğrular.

### P0 — Ürün ve contract freeze

Amaç: Eski build-time fork modeli ile evrensel app hedefi arasındaki çelişkiyi
kod yazmaya başlamadan kapatmak.

Teslimler:

- Bu belgedeki ürün kararı için ADR: tek resmî binary, instance-owned account,
  ilk sürümde tek aktif instance.
- `packages/api-contracts` içinde discovery, meta, me, error envelope,
  pagination ve capability isimlerinin kanonik export'ları.
- `/me`, `PATCH /me/preferences` ve catalog field uyumsuzluklarının dondurulmuş
  fixture'ları.
- Capability isimleri için granular sözlük ve server/mobile kullanım tablosu.
- Eski tek-instance phase gate'inin kaldırılması için test değişim listesi.

Kabul:

- Aynı fixture backend presenter ve mobil runtime guard testinden geçer.
- `planned` capability mobilde kullanılabilir özellik açmaz.
- Açık karar kalmaz: disabled user `401/403` politikası, currency summary ve
  project assets pagination şekli kayda alınır.

### P1 — Monorepo contract ve CI omurgası

Amaç: Backend ile mobilin aynı wire sözleşmesini derleme ve test aşamasında
paylaşması.

Teslimler:

- `@neta/api-contracts`, `@neta/app` dependency'si olur.
- Backend route input'ları için Zod; output'lar için explicit presenter katmanı
  eklenir. Ham DB record response'a verilmez.
- Contract değişikliklerinde app + mobile consumer testlerini çalıştıran CI job.
- Root komutları: affected olmayan basit filtre yaklaşımı korunur; cache/build
  orkestratörü ancak ölçülmüş ihtiyaç oluşursa eklenir.
- Ownership: `packages/api-contracts` değişikliği backend ve mobile review ister.

Kabul:

- Contract paketi değiştiğinde iki consumer da aynı CI koşusunda typecheck olur.
- App veya package altında ikinci lockfile/workspace oluşamaz.
- API fixture snapshot'larında secret ve internal field taraması vardır.

### P2 — Bootstrap doğruluğu ve manuel instance bağlantısı

Amaç: Mağazadan gelen generic binary'nin domain ile güvenli biçimde
bağlanabilmesi.

Backend teslimleri:

- Discovery/meta/health/catalog ve `/me` kontrat düzeltmeleri.
- Truthful capability üretimi.
- Canonical origin/proxy/HTTPS doğrulaması ve kontrollü CORS/auth-origin ayarı.
- Eksik v1 route'ları için HTML yerine stabil JSON hata davranışı.

Mobil teslimleri:

- Production config'ten zorunlu `EXPO_PUBLIC_NETA_ORIGIN` kaldırılır; bu değer
  yalnız development/demo override olur.
- İlk açılış state machine'i:
  `welcome -> enter-domain -> verifying -> sign-in -> ready`.
- Domain normalize, discovery/meta `instanceId` eşleştirme, TLS/redirect kontrolü,
  hata ve retry yüzeyleri.
- Registry'ye instance kaydı ve tek aktif instance seçimi.
- Login sonrası session materyalinin Keychain/Keystore destekli SecureStore'da
  instance scope ile saklanması.

Kabul:

- Temiz production build iki farklı gerçek test instance'ına yeniden build
  olmadan sırayla bağlanabilir.
- Hatalı TLS, HTML response, farklı-origin link, değişen `instanceId`, eski API
  sürümü ve minimum client sürümü kontrollü UI üretir.
- Credential hiçbir discovery/meta request'ine veya doğrulanmamış origin'e gitmez.

### P3 — Owner P0 read vertical slice

Amaç: Geniş fakat yarım API yerine güvenilir ilk günlük kullanım dilimi.

Sıra:

1. Dashboard overview.
2. Client list/detail.
3. Project list/detail.
4. Task list/detail.

Her resource için birlikte teslim edilir:

- Route + strict query schema.
- Actor scope + cross-tenant negatif test.
- Service çağrısı + presenter.
- Contract fixture + mobil parser.
- Loading/empty/error/offline-cache UI.
- Capability ve live smoke.

Kabul:

- Web ve mobil aynı seeded DB için semantik olarak aynı kayıtları gösterir.
- Mobilde production mock/fallback başarı verisi yoktur.
- Pagination tekrar/atlama üretmez; locale ve timezone görünür alanlarda
  tutarlıdır.

### P4 — Owner core mutations

Amaç: Client, project ve task yaşam döngüsünü mobilde tamamlamak.

Teslimler:

- Create/update/archive/delete route'ları ve formları.
- İlişki seçimleri server-authorized lookup ile yapılır; raw ID form alanı olmaz.
- Update/delete optimistic concurrency ve kullanıcıya çözüm sunan `409` UI.
- Create mutation'larda kalıcı idempotency kayıtları ve retry semantiği.
- Request abort, double-submit ve ağ kesintisi testleri.

Kabul:

- Aynı idempotency key aynı actor + endpoint + body için tek side effect üretir.
- Aynı key farklı payload'da conflict verir.
- Stale version yeni veriyi ezmez.
- Web'den oluşturulan kayıt mobilde, mobilden oluşturulan kayıt webde görünür.

### P5 — Owner P1 parity

Amaç: Takvim, finans, günlük, dosya ve ayarlar ile owner kullanımını beta
seviyesine getirmek.

Uygulama sırası:

1. Calendar read/write ve timezone sınırları.
2. Finance read/write, currency grouping ve summary.
3. Journal read/write ve privacy-safe cache/log politikası.
4. Profile/security/session yönetimi.
5. General/appearance/localization/AI settings.
6. File upload/download/delete ve gerçek metadata sanitization.

Kabul:

- Dosya type/size/ownership server-side doğrulanır; yarım upload DB/fiziksel
  dosya bırakmaz.
- AI/provider secret'ları hiçbir GET response'unda geri dönmez.
- Journal/chat içeriği log, notification preview veya crash metadata'sına girmez.
- Locale değişimi bootstrap ve dinamik domain içeriklerinde tutarlıdır.

### P6 — Güvenli device pairing

Amaç: Kullanıcıya mobilde parola yazmadan, webde doğrulanmış owner session'ı ile
cihaz bağlama seçeneği vermek.

Akış:

```text
Web owner step-up
  -> 5 dakikalık tek kullanımlık challenge
  -> QR: origin + secret (manuel: domain + code)
  -> mobile discovery doğrulaması
  -> atomic exchange
  -> access + rotating refresh token family
  -> cihaz listesi / revoke
```

Schema:

- `pairing_challenges`: id, user, digest, expiry, attempts, requested scopes,
  consumed/locked timestamps.
- `device_sessions`: family, user, install/device metadata, token digests,
  expiry, last-used, revoked/compromised timestamps.
- `instance_settings.deviceTokenEpoch`: backup restore ve global revoke sınırı.
- `auth_audit_events`: redacted lifecycle olayları.

Güvenlik kapıları:

- 256-bit QR secret; manuel kod Crockford Base32 ve daha dar rate limit.
- User ve instance başına aktif challenge sınırı.
- Exchange `BEGIN IMMEDIATE` transaction ile tek başarı verir.
- Refresh reuse bütün family'yi compromised/revoked yapar.
- Raw code/token DB ve structured log taramasında bulunmaz.
- Remote HTTP reddedilir; yalnız açık development loopback istisnası vardır.
- Owner device listesinde token değil, ad/platform/created/last-used gösterilir.

### P7 — Client portal mobil kapsamı

Amaç: Davetli müşterinin yalnız kendi portal verisini güvenli ve basit biçimde
görmesi.

Teslimler:

- Client auth/session bootstrap ve role-based navigation.
- Kendi project/task/revision/file read yüzeyi.
- Revision ve izin verilen profile/preferences mutations.
- Davet kabulü/deep-link sözleşmesi.
- Owner pairing ile client pairing'in scope ve capability olarak ayrılması.

Kabul:

- Client A hiçbir identifier manipülasyonuyla Client B verisini okuyamaz,
  değiştiremez veya varlığını doğrulayamaz.
- Owner-only endpoint client için kapalıdır.
- Portal file URL'leri süreli veya authorization kontrollüdür.
- Invite/deep link başka instance credential'ını yeniden kullanmaz.

### P8 — AI/chat, bildirim ve ileri özellikler

Amaç: Core parity sonrasında pahalı ve güvenlik duyarlı yüzeyleri eklemek.

- Native NDJSON streaming chat, cancel/retry ve timeout.
- Project risk ve finance analysis presenter'ları.
- Self-hosted push notification için ayrı opt-in mimari kararı; merkezi push
  relay yoksa platform kısıtları açıkça belgelenir.
- Payload privacy sınıflandırması; özel içerik notification veya telemetry'ye
  konmaz.

Bu faz P0/P1 route'larını geciktiremez.

### P9 — Store release ve operasyon

Release kapıları:

- iOS/Android temiz production export ve signed build.
- Gerçek cihazlarda domain connect, login, token restore, logout ve revoke.
- En az iki bağımsız HTTPS self-hosted instance ile E2E.
- Supported minimum server/client version matrisi.
- Upgrade, rollback, backup/restore ve token epoch runbook'u.
- Privacy policy, support URL, store listing ve incident response sahibi.
- Dependency/SBOM, secret scan ve production source-map politikası.
- Crash/telemetry varsayılanı kapalı; eklenirse açık kullanıcı/instance opt-in.

No-go koşulları:

- Capability ile canlı route kapsamı uyuşmuyorsa.
- Portal cross-tenant negatif testi yoksa.
- Restore eski mobile token'ı yeniden geçerli kılıyorsa.
- Production mobil kodunda mock başarı yolu varsa.
- Remote HTTP veya TLS bypass mümkünse.
- App iki gerçek instance'a rebuild olmadan bağlanamıyorsa.

### P10 — Sonraki ürün seçenekleri

Core release sonrasında ayrı karar gerektirir:

- Çoklu kayıtlı instance ve hızlı switch.
- Merkezi kısa kod -> domain resolver.
- Universal/app links ile davet ve pairing.
- Background sync ve sınırlı offline mutation queue.
- White-label build otomasyonu.
- Neta Cloud yönetim katmanı.

Bu seçeneklerin hiçbiri ilk self-host + resmî mobil release'in önkoşulu değildir.

## 9. Mobil bağlantı state machine'i

```text
unconfigured
  -> verifying_instance
      -> incompatible | unreachable | untrusted
      -> unauthenticated
          -> password_sign_in -> authenticated
          -> pairing_exchange -> authenticated
authenticated
  -> refreshing
      -> authenticated
      -> expired/compromised -> unauthenticated
authenticated
  -> instance_identity_changed -> explicit_reconnect
authenticated
  -> user_disabled/revoked -> unauthenticated + cache purge
```

Kurallar:

- Navigation yalnız bu state'ten türetilir; ekranlar bağımsız auth tahmini
  yapmaz.
- Cache key en az `instanceId + userId + role + locale + resource` içerir.
- Logout/revoke/identity change ilgili instance'ın credential ve private cache'ini
  temizler.
- Public branding/catalog cache'i private session'dan ayrıdır.
- İlk release tek aktif instance sunar; storage modelinin instance-scoped kalması
  gelecekte switch eklemeyi kolaylaştırır.

## 10. Test stratejisi

| Katman | Zorunlu test |
| --- | --- |
| Contract | DTO guard, fixture, backward-compatible additive field |
| Domain | invariant, transaction rollback, role/scope |
| API | input, envelope, header, status, presenter redaction |
| Auth | cookie/bearer eşdeğer actor, expiry, disabled/revoked |
| Security | cross-tenant, brute force, token reuse, log/DB secret scan |
| Mobile unit | URL, discovery, state machine, secure storage, parser |
| Mobile integration | login, retry, cache isolation, mutation conflict |
| Browser regression | Mevcut web action ve portal davranışı |
| E2E | İki instance, owner/client, iOS/Android, backup/restore |
| Release | lint, typecheck, build/export, dependency ve secret scan |

Test fixture seti en az şunları içerir:

- Owner ve iki farklı client.
- Client project ve side project.
- Aynı isimli ama farklı tenant kayıtları.
- Çok para birimli finans kayıtları.
- UTC gün sınırı ve DST geçişi.
- Büyük görsel, bozuk MIME, EXIF/GPS metadata.
- Expired/consumed/locked pairing challenge.
- Concurrent update, duplicate mutation ve concurrent refresh.

## 11. CI ve release düzeni

PR kontrolleri değişen alanla ilişkili consumer'ları çalıştırır:

- `apps/neta-app/**`: app lint/typecheck, API/domain smoke, app build.
- `apps/neta-web/**`: landing lint/typecheck/build.
- `apps/neta-mobile/**`: mobile check ve production export.
- `packages/api-contracts/**`: app + mobile bütün contract kapıları.
- `packages/design-tokens/**`: mobile ve kullanan diğer consumer kontrolleri.
- root manifest/lock/workspace/Docker: bütün workspace kontrolleri.

Main/release branch ayrıca Docker image smoke, migration, readiness ve iki
instance E2E çalıştırır. Store submission yalnız immutable Git tag, doğrulanmış
native build numarası ve yayın checklist'i üzerinden yapılır.

## 12. Risk kaydı

| Risk | Etki | Kontrol |
| --- | --- | --- |
| Web ve API iş kuralı ayrışması | Veri/invariant farkı | Ortak service, ince transport |
| Capability overclaim | Mobilde kırık ekran | Test + live smoke sonrası available |
| Self-host proxy yanlışlığı | Auth/TLS problemi | Canonical origin ve proxy diagnostics |
| SQLite multi-replica | Corruption/lock | Tek replica açık kuralı ve health check |
| Pairing brute force | Account takeover | Kısa TTL, digest, attempt/rate limit |
| Refresh token reuse | Kalıcı session hırsızlığı | Rotation ve family compromise |
| Restore token resurrection | Eski token yeniden aktif | Device token epoch rotation |
| Client tenant sızıntısı | Kritik veri ihlali | Server actor scope + negatif test |
| Contract drift | Mobil parser failure | Ortak package + fixture consumer test |
| Store binary tek domaine bağlı | Ürün hedefi bozulur | İki instance rebuildsiz E2E gate |
| Hassas cache/log | Privacy ihlali | Scope'lu cache, redaction, tarama |
| Büyük monorepo CI süresi | Yavaş teslim | Filtreli job; ölçüm sonrası cache |

## 13. PR büyüklüğünde yürütme sırası

1. Monorepo taşınması ve path düzeltmeleri. `[tamamlandı]`
2. Root/Docker/CI doğrulama ve temiz baseline tag'i.
3. Evrensel mobil ürün ADR'ı ve eski gate kararının supersede edilmesi.
4. Contract package bootstrap/me/catalog fixture freeze.
5. Backend contract consumer ve presenter iskeleti.
6. `/me`, preferences, catalog ve capability doğruluk düzeltmeleri.
7. Mobile runtime-origin config ve connect state machine.
8. Domain/discovery ekranı ve iki-instance E2E.
9. Ortak API auth/actor resolver.
10. Pagination/concurrency/idempotency altyapısı.
11. Dashboard read vertical slice.
12. Clients read + mutation slice.
13. Projects read + mutation slice.
14. Tasks read + mutation slice.
15. Calendar, finance ve journal grupları.
16. Profile, security, settings ve localization.
17. Files ve metadata sanitization.
18. Pairing schema/service/API.
19. Pairing mobile QR/manual UX ve revoke lifecycle.
20. Client portal izolasyonlu API + mobile parity.
21. Chat/AI ve opsiyonel notification kararı.
22. İki-instance release E2E, backup/restore ve store submission.

Her PR tek bir dikey davranış veya altyapı sınırı taşır. Route ile onun contract,
authorization ve consumer testi farklı PR'lara bölünmez.

## 14. Global Definition of Done

Bir faz ancak aşağıdakilerin tümü sağlandığında tamamdır:

- Kod, schema/migration ve dokümantasyon birlikte teslim edilmiştir.
- Lint, strict typecheck, unit/integration ve ilgili build geçer.
- Başarı, validation, unauthenticated, forbidden/not-found, conflict ve internal
  error davranışları testlidir.
- Owner/client tenant izolasyonu ve secret redaction doğrulanmıştır.
- Capability gerçeği yansıtır; eksik endpoint kullanıcıya kontrollü görünür.
- Mevcut web davranışı regresyon testinden geçer.
- Mobil production yolunda mock veya debug credential yoktur.
- Operasyonel değişiklik için upgrade/rollback notu vardır.
- İlgili acceptance maddeleri gerçek runtime smoke ile kanıtlanmıştır.

## 15. Bir sonraki uygulanacak iş

Monorepo baseline kontrolleri yeşil olduktan sonra doğrudan P0 ile başlanmalıdır:

1. Evrensel mobil app ADR'ını kabul etmek.
2. Eski build-time origin ve pairing yasağı testlerini yeni hedefe göre
   değiştirmek.
3. `api-contracts` bootstrap fixture'larını backend ve mobile için ortaklaştırmak.
4. `/me`, preferences ve catalog uyumsuzluklarını ilk küçük vertical slice olarak
   kapatmak.

Bu sıra, büyük resource API yatırımından önce mobilin gerçekten herhangi bir
self-hosted instance'a güvenli biçimde bağlanabildiğini kanıtlar.
