---
title: Neta React Native Mobil Uygulama Ana Planı
description: Domain ile self-hosted Neta instance'larına bağlanan freelancer ve müşteri mobil uygulaması için ürün, API, mimari, ekran ve yayın planı.
status: superseded
current_phase: "see neta-mobile-redesign-master-plan.md"
last_updated: 2026-07-29
owners:
  - mobile
  - backend-api
  - product
related_documents:
  - phase-0/README.md
  - phase-0/baseline-and-api-gap.md
  - phase-0/parity-and-scope.md
  - phase-0/auth-spike-and-lifecycle.md
  - phase-0/mobile-design-contract.md
  - phase-1/README.md
  - phase-2/README.md
  - phase-3/README.md
  - phase-4/README.md
  - phase-5/README.md
  - phase-6/README.md
  - phase-7/README.md
  - phase-8/README.md
  - phase-9/README.md
  - phase-10/README.md
  - phase-11/README.md
  - phase-12/README.md
  - phase-13/README.md
  - phase-13/native-streaming-protocol.md
  - phase-14/README.md
  - phase-15/README.md
  - phase-16/README.md
  - phase-17/README.md
  - phase-18/README.md
  - phase-19/README.md
  - phase-20/README.md
  - phase-21/README.md
  - phase-21/adr-0021-self-hosted-notifications.md
  - phase-21/notification-api-contract.md
  - phase-22/README.md
  - phase-22/privacy-and-support.md
  - phase-22/store-listing.md
  - phase-22/release-operations.md
  - phase-23/README.md
  - phase-23/pairing-api-contract.md
  - mobile-accessibility-baseline.md
  - phase-9-mobile-api.md
  - adr-0018-device-pairing.md
  - neta-multilingual-i18n-master-plan.md
  - neta-self-hosted-v3-master-plan.md
---

# Neta React Native Mobil Uygulama Ana Planı

> Bu plan, multi-instance/domain-entry ürün modelini temel aldığı için
> 2026-07-29 tarihinde kullanımdan kaldırıldı. Yeni canonical plan:
> [Neta Mobile Product Redesign Master Plan](./neta-mobile-redesign-master-plan.md).
> Geçmiş faz kararları ve uygulama bağlamı için bu belge korunmaktadır.

## 1. Neta nedir?

Neta; freelancer'ların ve küçük stüdyoların kendi iş süreçlerini tek bir
self-hosted sistemden yönetebildiği, aynı zamanda müşterilerine ayrı portal hesabı
açabildiği bir iş ve iletişim platformudur.

Freelancer tarafında Neta'nın ana sorumlulukları:

- Müşteri ve müşteri ilişkilerini yönetmek.
- Proje, proje planı, görev, ilerleme ve revizyon süreçlerini takip etmek.
- Takvim, finans, günlük ve analiz verilerini tek yerde toplamak.
- Teklif, fatura, sözleşme ve abonelik gibi ticari kayıtları yönetmek.
- Yapay zekâ destekli sohbet, proje risk analizi ve finans analizi sunmak.
- Workspace adı, light/dark logo, favicon, renkler, görünüm, dil ve AI
  sağlayıcısı gibi instance ayarlarını self-host eden kişinin yönetmesini sağlamak.
- Türkçe ve İngilizce ile başlamak; yeni dillerin ve domain içerik
  çevirilerinin admin tarafından eklenebilmesini sağlamak.

Müşteri portalı tarafında Neta'nın ana sorumlulukları:

- Müşterinin kendisiyle paylaşılan projeleri ve ilerlemeyi görmesi.
- Public olarak paylaşılan görevleri takip etmesi.
- Proje planını ve proje detayını kendi dilinde incelemesi.
- Revizyon hakkını görmesi ve yeni revizyon talebi oluşturması.
- Profil, şifre, tema ve adminin aktif ettiği diller arasında kendi tercihini
  yönetmesi.

Mobil uygulama ayrı bir SaaS backend'e bağlanmayacaktır. Her kullanıcı,
kendisinin veya hizmet aldığı freelancer'ın self-host ettiği Neta domain'ine
bağlanır. Dolayısıyla mobil uygulama genel bir Neta istemcisidir; veri sahibi,
kimlik sağlayıcısı ve iş mantığı girilen domain'deki Neta instance'ıdır.

## 2. Mobil ürün vizyonu

Temel akış:

```text
Uygulama açılır
  -> Kullanıcı Neta domain'ini girer
  -> Instance discovery ve güvenlik kontrolü yapılır
  -> Workspace markası, tema, diller ve yetenekler yüklenir
  -> Kullanıcı email/şifre ile giriş yapar
  -> /api/v1/me kullanıcı rolünü döndürür
  -> Freelancer ise yönetim uygulaması açılır
  -> Client ise müşteri portalı açılır
```

Tek bir iOS/Android uygulama paketi iki rolü de destekleyecektir. Aynı domain
ekranı, aynı auth altyapısı ve aynı API client kullanılır; authenticated shell
ve izin verilen ekranlar role/capability ile ayrılır.

### 2.1. Birinci sürüm hedefi

Birinci üretim sürümünde:

- iOS ve Android desteklenecek.
- Domain discovery, email/şifre girişi, güvenli oturum ve çıkış olacak.
- Freelancer için dashboard, müşteriler, projeler, görevler, takvim, finans,
  günlük, analiz, AI sohbet ve temel ayarlar bulunacak.
- Müşteri için portal dashboard, projeler, proje detayı, görevler,
  revizyonlar ve kişisel ayarlar bulunacak.
- Instance branding, light/dark tema ve instance tarafından yönetilen diller
  mobilde uygulanacak.
- Dinamik içerik formları aktif diller kadar tab/panel sunacak.
- Read cache bulunacak; internet olmadan yapılan mutation ilk sürümde sessizce
  kuyruğa alınmayacak.
- Tek aktif instance ile başlanacak; veri modeli birden fazla kayıtlı instance'a
  geçişi engellemeyecek.

### 2.2. İlk sürüm dışında kalabilecekler

- Tam offline mutation ve çakışma çözümü.
- Apple/Google sosyal giriş.
- Tablet için tamamen ayrı bilgi mimarisi; responsive two-pane destek yeterli.
- Müşteri ile freelancer arasında gerçek zamanlı genel mesajlaşma; mevcut AI
  sohbetiyle karıştırılmayacak.
- Her self-hosted instance için ayrı App Store binary/white-label build.
- Background sync ile sınırsız veri indirme.

## 3. Mevcut codebase incelemesi ve mobil hazırlık durumu

Web uygulaması Next.js 16, React 19, Better Auth, SQLite, better-sqlite3 ve
Drizzle ORM üzerindedir. Supabase uygulama runtime'ından çıkarılmıştır.
Domain iş kuralları `DomainService` ve owner/client scope kontrolleri içinde
toplandığı için aynı servislerin REST API route'larından tekrar kullanılması
mümkündür.

### 3.1. Bugün hazır olan mobil sözleşmeler

| Endpoint | Durum | Mobilde kullanımı |
| --- | --- | --- |
| `GET /.well-known/neta` | Hazır | Domain discovery, instance ID, API linkleri, diller ve capability |
| `GET /api/v1/meta` | Hazır | Workspace, branding, minimum client sürümü ve capability |
| `GET /api/v1/health` | Hazır | Instance readiness kontrolü |
| `GET /api/v1/me` | Hazır | User, role, client bağı, tercih ve locale sonucu |
| `PATCH /api/v1/me/preferences` | Hazır | Kullanıcı dil ve tema tercihi |
| `GET /api/v1/localization/catalog` | Hazır | Instance tarafından özelleştirilen UI katalogları |
| `/api/auth/*` | Web için hazır | Better Auth native entegrasyonu ve multi-domain testi gerekli |
| `POST /api/files` | Web API olarak hazır | v1 envelope, absolute URL ve mobil upload kontratı gerekli |
| `GET /api/files/:id` | Hazır | Yetkili dosya görüntüleme; native auth testi gerekli |

### 3.2. Mobil için henüz eksik backend yüzeyi

Müşteri, proje, görev, takvim, finans, günlük ve business işlemlerinin
çoğu Server Action veya doğrudan server component veri yüklemesi kullanıyor.
Mobil uygulama Server Action çağırmayacak. Bunlar `/api/v1` altında kaynak
API'lerine dönüştürülmelidir.

Mevcut `DomainService` şu alanları destekliyor ve yeni API route'ları bu katmanı
kullanmalıdır:

- Clients ve client activities.
- Projects, planning sections, project tasks ve revisions.
- Tasks.
- Calendar events.
- Finance transactions.
- Journal entries.
- Chat sessions ve messages.
- Dashboard ve analytics hesapları.
- Proposals, contracts, invoices ve subscriptions.

### 3.3. Mevcut auth kararındaki açık nokta

`phase-9-mobile-api.md` bugün Better Auth cookie session'ını ilan ediyor;
`adr-0018-device-pairing.md` ise owner cihazları için opaque access/refresh token
pairing modelini kabul edilmiş fakat uygulanmamış karar olarak tutuyor.

Güncel Better Auth, Expo istemcisi için `@better-auth/expo` ile cookie'leri
`expo-secure-store` içinde saklayan resmi bir native akış sunuyor. Hızlı MVP
için en kısa yol budur; fakat mevcut ADR sessizce geçersiz sayılamaz.

Faz 0'da zorunlu karar:

1. Multi-domain runtime base URL ile Better Auth Expo entegrasyon spike'ı yapılır.
2. Cookie izolasyonu, revoke, şifre değişikliği, disabled user ve restore
   davranışı test edilir.
3. Sonuç yeterliyse ADR-0018, resmi native secure-cookie modelini ilk sürüm
   olarak kabul edecek biçimde revize edilir; device pairing ikinci güvenlik modu
   olur.
4. Sonuç yeterli değilse ADR-0018 aynen uygulanır ve owner mobil girişi pairing
   tamamlanmadan production'a çıkmaz.
5. Client portal oturumu için de ayrı lifecycle kararı kayda geçirilir.

Bu planın geri kalanı hızlı MVP için resmi Better Auth Expo secure-cookie
entegrasyonunu varsayar; Faz 0 kalite kapısı bu varsayımı onaylamak zorundadır.

## 4. Temel mimari kararlar

### 4.1. React Native dağıtımı

Tercih edilen başlangıç:

- Expo tabanlı React Native.
- Expo Router ile typed file-based routing.
- TypeScript strict mode.
- iOS ve Android için development build; Expo Go yalnız ilk UI spike'larında.
- EAS Build kolay yol olarak desteklenir; local Xcode/Gradle build zorunlu fallback
  olarak belgelenir. Self-host backend kullanmak EAS'e bağımlı değildir.

Expo Router yeni Expo projeleri için resmi öneridir ve typed route, deep link ve
native stack/tab yapısı sağlar. Kaynaklar:

- [Expo Router introduction](https://docs.expo.dev/router/introduction/)
- [Expo authentication and protected routes](https://docs.expo.dev/router/advanced/authentication/)
- [Better Auth Expo integration](https://better-auth.com/docs/integrations/expo)
- [Expo local data storage guidance](https://docs.expo.dev/develop/user-interface/store-data/)

Sürüm numaraları plana sabitlenmeyecek. Mobil uygulama bootstrap edildiği gün
stabil Expo SDK ve onunla uyumlu React Native sürümü seçilip lockfile'a
sabitlenecektir; canary/beta sürüm production tabanı olmayacaktır.

### 4.2. Repository yerleşimi

Mevcut Next.js kökünü taşımak ilk mobil fazda gereksiz risk yaratır. Önerilen
kademeli workspace yapısı:

```text
neta/
  app/                         # mevcut Next.js web uygulaması
  server/                      # mevcut backend/domain katmanı
  mobile/                      # Expo React Native uygulaması
    src/app/                   # Expo Router route'ları
    src/features/              # dikey feature modülleri
    src/components/            # mobil ortak UI
    src/lib/                   # API, auth, i18n, theme, storage
    assets/
    app.config.ts
    eas.json
    package.json
  packages/
    api-contracts/             # transport-safe tip/schema ve API contract'ları
    design-tokens/             # DOM bağımsız semantik tokenlar
  pnpm-workspace.yaml
```

Kurallar:

- Web uygulaması ilk aşamada `apps/web` altına taşınmayacak.
- `server-only`, Next.js, Drizzle veya better-sqlite3 mobil bundle'a import
  edilmeyecek.
- Paylaşılan paketlerde yalnız JSON-safe tipler, Zod şemaları, enumlar ve saf
  yardımcılar bulunacak.
- API contract paketinin runtime bağımlılığı minimum tutulacak.

### 4.3. Poyraz UI ve mobil tasarım sistemi

Mevcut `poyraz-ui` React, Tailwind, Radix ve web DOM odaklıdır; React Native
içinde doğrudan kullanılamaz. Mobilde tasarım dili korunacak, web component
implementasyonu taşınmayacaktır.

Mobil UI yaklaşımı:

- `packages/design-tokens`: renk rolleri, spacing, radius, typography ve shadow
  değerleri.
- `mobile/src/components/ui`: `Button`, `TextField`, `SelectSheet`, `Card`,
  `StatCard`, `Badge`, `Tabs`, `SegmentedControl`, `Dialog`, `BottomSheet`,
  `Toast`, `EmptyState`, `Skeleton`, `Screen`, `Header` gibi Neta primitives.
- Başlangıçta React Native `StyleSheet` ve semantik tokenlar kullanılacak;
  yalnız gerçek ihtiyaç varsa yeni styling dependency eklenecek.
- Web'deki `default`, `secondary` ve `shine` davranışı native press/animation
  diliyle yeniden yorumlanacak. Hover mobil kontrat değildir; pressed, focused,
  disabled ve loading state'leri tanımlanacak.
- Light/dark kontrastı ve dynamic primary/accent renkleri aynı semantik rollerle
  uygulanacak.

### 4.4. İstemci katmanları

```text
Screen / Route
  -> Feature hook
    -> Query veya mutation
      -> Instance-bound API client
        -> /api/v1
          -> auth/actor
            -> DomainService
              -> repository / SQLite
```

Ekranlar ham `fetch` çağrısı yapmaz. Her istek aktif instance kaydından türetilen
API client üzerinden gider.

### 4.5. İstemci state sınırı

- Server state: TanStack Query.
- Küçük local UI state: React state/reducer.
- Aktif instance, onboarding ve public metadata: küçük bir external store veya
  context; büyük global state kütüphanesi ilk günden eklenmez.
- Token/cookie: SecureStore ve Better Auth native adapter.
- Secret olmayan instance listesi, katalog cache metadata'sı ve query cache:
  AsyncStorage veya seçilen kalıcı cache adapter.
- Form state: Basit formlarda controlled input; çok dilli/büyük formlarda
  React Hook Form ve ortak Zod şemaları.

## 5. Domain bağlantısı ve instance discovery

### 5.1. Domain giriş ekranı

Alanlar ve davranış:

- Tek input: `neta.example.com` veya `https://neta.example.com`.
- Kullanıcı protokol yazmazsa production'da `https://` eklenir.
- Path, query, fragment ve URL credential reddedilir.
- Domain normalize edilince ekranda son origin gösterilir.
- `Bağlan` aksiyonu loading, timeout ve tekrar dene durumuna sahiptir.
- Son başarılı instance, oturum yoksa hızlı seçim kartı olarak gösterilebilir.
- QR ile instance URL okuma ikinci iterasyonda eklenebilir; QR içeriği yine aynı
  validasyondan geçer.

### 5.2. Discovery state machine

```text
idle
  -> normalizing
  -> discovering
  -> validating-discovery
  -> checking-health
  -> loading-meta
  -> loading-public-catalog
  -> ready-for-auth

Her adım -> recoverable-error | incompatible | unhealthy | tls-error
```

Sıralama:

1. Origin normalize edilir.
2. `GET /.well-known/neta` en fazla tanımlı timeout ile çağrılır.
3. En fazla üç redirect izlenir; HTTPS'ten HTTP'ye downgrade reddedilir.
4. `protocol === "neta"` ve desteklenen `discoveryVersion` doğrulanır.
5. Discovery içindeki API URL'lerinin aynı güvenilir origin'de kaldığı
   doğrulanır.
6. `GET /api/v1/health` ile DB/migration readiness kontrol edilir.
7. `GET /api/v1/meta` alınır; `instance.id === discovery.instanceId`
   doğrulanır.
8. Mobil client sürümü `minimumSupportedVersion` ile karşılaştırılır.
9. Platform ve gerekli capability kontrol edilir.
10. Branding ve public localization catalog yüklenir.
11. Secret olmayan instance metadata'sı yerel kayda yazılır.
12. Auth ekranı workspace logosu ve adıyla açılır.

### 5.3. HTTP geliştirme politikası

- Production binary remote HTTP origin'e credential göndermez.
- `localhost`, `127.0.0.1`, Android emulator `10.0.2.2` ve açıkça tanımlanmış
  LAN development adresleri yalnız development build'de kullanılabilir.
- TLS sertifika hatası için `yine de devam et` butonu production'da bulunmaz.
- Instance origin değişirse credential otomatik taşınmaz.
- Aynı origin daha sonra farklı `instanceId` döndürürse restore/yeni instance
  uyarısı verilir ve eski session silinir.

### 5.4. Yerel instance kaydı

```ts
type StoredInstance = {
  origin: string;
  instanceId: string;
  apiBaseUrl: string;
  workspaceName: string;
  lightLogoUrl: string | null;
  darkLogoUrl: string | null;
  faviconUrl: string | null;
  discoveryVersion: number;
  apiVersion: string;
  catalogVersion: number;
  lastConnectedAt: string;
};
```

Secret storage key'leri `instanceId` ile namespace edilir. Aynı kullanıcının
farklı Neta kurulumlarındaki cookie veya tokenları birbirine karışmaz.

## 6. Authentication ve oturum yönetimi

### 6.1. Login akışı

1. Instance discovery tamamlanır.
2. Runtime `baseURL = instance.origin` olan Better Auth native client oluşturulur.
3. Kullanıcı email ve şifre girer.
4. Better Auth `signIn.email` akışı kullanılır.
5. Native cookie/session materyali SecureStore'da instance'a özel prefix ile tutulur.
6. `GET /api/v1/me` çağrılır.
7. `role=freelancer` owner shell'e, `role=client` portal shell'e gider.
8. `disabled`, eksik client bağı veya süresi geçmiş session 401 olarak temizlenir.

Login ekranında dil seçici olmayacak. Public auth ekranı instance default locale
ile gelir. Girişten sonra `/me.localization.resolvedLocale` kullanılır.

### 6.2. Server tarafında gerekli auth değişiklikleri

- `@better-auth/expo` server plugin'i eklenir.
- `neta://` production scheme trusted origin allowlist'e eklenir.
- Development `exp://` wildcard'ları yalnız development config'de açılır.
- Native login, logout, session refresh, password change ve cookie propagation
  gerçek cihazda test edilir.
- CORS/header davranışı reverse proxy arkasında test edilir; native client
  geldi diye web origin kontrolleri gevşetilmez.
- Auth audit event'lerine `client: mobile`, platform ve app version gibi hassas
  olmayan alanlar eklenebilir.
- Rate limit login ve password endpoint'lerinde korunur.

### 6.3. Session davranışı

- App foreground'a geldiğinde session tamamen her render'da değil, stale süresi
  dolmuşsa kontrol edilir.
- Her authenticated 401 sonrası tek bir session yenileme/doğrulama denemesi yapılır.
- Yenileme başarısızsa query cache temizlenir ve login ekranına gidilir.
- Logout server'a gönderilir; başarısız olsa bile cihazdaki session materyali
  güvenli biçimde temizlenir ve kullanıcı bilgilendirilir.
- Şifre değişikliğinde server politikasına göre mevcut/tüm session'lar revoke edilir.
- App switcher snapshot'larında hassas finans ve profil verisi gizlenebilir.

### 6.4. Register ve invitation

- Mobil uygulamadan ilk self-host admin hesabı oluşturmak v1 hedefi değildir;
  instance ilk kurulumu web üzerinden tamamlanır.
- Portal müşterisi davet linkini mobilde açtığında universal link ile app'e
  gelebilir.
- Davet kabul akışı ilk sürümde güvenli web ekranına yönlendirilebilir; tam
  native kabul daha sonraki fazda API sözleşmesiyle eklenir.
- Password reset linkleri deep link ile mobile dönebilir; ilk iterasyonda web
  fallback her zaman korunur.

## 7. API v1 genel sözleşmesi

### 7.1. Ortak yanıt

Başarı:

```json
{
  "ok": true,
  "data": {}
}
```

Hata:

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Debug/fallback message",
    "details": {
      "messageKey": "validation.project.nameRequired",
      "fieldErrors": {
        "name": ["validation.required"]
      }
    }
  }
}
```

Mobil mantık `message` string'ine bağlanmaz. Akış `code`, alan hataları
`fieldErrors`, kullanıcı metni `messageKey` ile çözülür.

### 7.2. Ortak request header'ları

- `Authorization` veya Better Auth native session header/cookie'si.
- `Accept: application/json`.
- `Accept-Language: <resolved user locale>`.
- `X-Neta-Client: mobile`.
- `X-Neta-Client-Version: <semver>`.
- `X-Neta-Platform: ios|android`.
- Mutation'larda `Idempotency-Key` desteklenmesi önerilir.

### 7.3. Listeleme sözleşmesi

Yeni liste endpoint'leri baştan cursor pagination ile tasarlanır:

```http
GET /api/v1/projects?cursor=opaque&limit=30&status=active&search=neta
```

```json
{
  "ok": true,
  "data": {
    "items": [],
    "pageInfo": {
      "nextCursor": null,
      "hasNextPage": false
    }
  }
}
```

- `limit` default 30, maksimum 100.
- Cursor opaque'tir; client DB ID/timestamp birleşimini varsaymaz.
- Filtre ve sort allowlist ile doğrulanır.
- Search normalize edilir ve maksimum uzunluğa sahiptir.

### 7.4. Tarih, para ve ID

- Timestamp: UTC ISO-8601.
- Yalnız takvim günü ifade eden alan: `YYYY-MM-DD`.
- Para: integer minor unit + ISO 4217 currency.
- Yüzde: integer 0–100 veya sözleşmede belirtilen basis point.
- ID: opaque string; client UUID olduğunu varsaymaz.
- Kullanıcı timezone'u `/me/preferences` içinde döner ve görsel formatlamada
  kullanılır.

### 7.5. Lokalize resource sözleşmesi

Detay yanıtı:

```json
{
  "resource": {},
  "localized": {},
  "locale": "en",
  "fallbackChain": ["en", "tr"]
}
```

Owner edit formu `resource` ve tüm `translations` verisini alır. Portal/read-only
ekran normalde `localized` alanını kullanır. Owner mutation:

```json
{
  "status": "active",
  "translations": {
    "tr": { "name": "Neta Mobil", "description": "..." },
    "en": { "name": "Neta Mobile", "description": "..." }
  }
}
```

### 7.6. Eşzamanlı güncelleme

- Update response `updatedAt` veya açık `version` alanı döndürür.
- Client mutation son bilinen version'ı gönderir.
- Eski kayda yazma `409 CONFLICT` döndürür.
- Mobil form kullanıcıya `Sunucudaki değişikliği yükle` ve kontrollü yeniden
  uygulama seçeneği sunar; sessiz overwrite yapmaz.

## 8. Endpoint envanteri

Bu bölüm hedef API'yi tanımlar. `Hazır` olmayan endpoint'ler, ilgili ekran
yazılmadan önce backend fazında tamamlanacaktır.

### 8.1. Public, discovery ve localization

| Method | Endpoint | Amaç | Durum |
| --- | --- | --- | --- |
| GET | `/.well-known/neta` | Instance discovery | Hazır |
| GET | `/api/v1/meta` | Marka, sürüm, capability | Hazır |
| GET | `/api/v1/health` | Readiness | Hazır |
| GET | `/api/v1/localization/catalog` | UI katalog indirme | Hazır |

### 8.2. Session ve kullanıcı

| Method | Endpoint | Rol | Amaç |
| --- | --- | --- | --- |
| POST | `/api/auth/sign-in/email` | Public | Better Auth login |
| POST | `/api/auth/sign-out` | Session | Logout |
| GET | `/api/v1/me` | Session | Rol, profil, tercih, locale |
| PATCH | `/api/v1/me/preferences` | Owner/client | Dil, tema, timezone ve desteklenen tercih alanları |
| PATCH | `/api/v1/me/profile` | Owner/client | Display name ve avatar metadata |
| POST | `/api/v1/me/password` | Owner/client | Şifre değiştirme |
| GET | `/api/v1/me/sessions` | Owner/client | Aktif cihaz/session listesi; auth modeli kararına bağlı |
| DELETE | `/api/v1/me/sessions/:id` | Owner/client | Session revoke; auth modeli kararına bağlı |

### 8.3. Owner dashboard ve analytics

| Method | Endpoint | Amaç |
| --- | --- | --- |
| GET | `/api/v1/dashboard?range=month` | Stat kartları, finans/mood trendi, son projeler/müşteriler |
| GET | `/api/v1/analytics?range=month` | Gelir-gider, proje, görev ve performans analizleri |

Dashboard toplu response vermelidir; mobil ilk açılışta 8–10 ayrı request
atılmamalıdır.

### 8.4. Clients

| Method | Endpoint | Amaç |
| --- | --- | --- |
| GET | `/api/v1/clients` | Liste, search, status ve pipeline filtreleri |
| POST | `/api/v1/clients` | Çok dilli müşteri oluşturma |
| GET | `/api/v1/clients/:id` | Detay, ilişkiler ve portal durumu |
| PATCH | `/api/v1/clients/:id` | Bilgi, durum, pipeline ve çeviri güncelleme |
| DELETE | `/api/v1/clients/:id` | Archive/delete politikasına göre kaldırma |
| GET | `/api/v1/clients/:id/activities` | Not, arama, toplantı, email aktiviteleri |
| POST | `/api/v1/clients/:id/activities` | Aktivite ekleme |
| POST | `/api/v1/clients/:id/portal-invitations` | Portal hesabı/daveti ve default locale |
| PATCH | `/api/v1/clients/:id/portal-locale` | Admin tarafından başlangıç dilini güncelleme |

### 8.5. Projects, plan, revisions ve assets

| Method | Endpoint | Amaç |
| --- | --- | --- |
| GET | `/api/v1/projects` | Liste, filtre, search |
| POST | `/api/v1/projects` | Proje ve localized alanlar oluşturma |
| GET | `/api/v1/projects/:id` | Detay, müşteri, ilerleme, çeviriler |
| PATCH | `/api/v1/projects/:id` | Proje güncelleme ve tamamlama |
| DELETE | `/api/v1/projects/:id` | Proje kaldırma |
| GET | `/api/v1/projects/:id/planning-sections` | Plan bölümleri |
| POST | `/api/v1/projects/:id/planning-sections` | Plan bölümü ekleme |
| PATCH | `/api/v1/projects/:id/planning-sections/:sectionId` | Plan güncelleme/sıralama |
| DELETE | `/api/v1/projects/:id/planning-sections/:sectionId` | Plan bölümü silme |
| GET | `/api/v1/projects/:id/revisions` | Owner revizyon listesi ve allowance |
| PATCH | `/api/v1/projects/:id/revisions/:revisionId` | Revizyon durumu |
| GET | `/api/v1/projects/:id/assets` | Proje dosyaları |
| POST | `/api/v1/projects/:id/assets` | Multipart dosya yükleme |
| DELETE | `/api/v1/projects/:id/assets/:assetId` | Proje dosyası silme |

### 8.6. Tasks

| Method | Endpoint | Amaç |
| --- | --- | --- |
| GET | `/api/v1/tasks` | Liste; status, priority, project, client ve tarih filtresi |
| POST | `/api/v1/tasks` | Localized görev oluşturma |
| GET | `/api/v1/tasks/:id` | Görev detayı |
| PATCH | `/api/v1/tasks/:id` | Alan/status güncelleme |
| DELETE | `/api/v1/tasks/:id` | Görev silme |
| POST | `/api/v1/tasks/:id/complete` | Idempotent tamamlama kısayolu |

Drag/drop mutation tek tek tüm task objesini değil `{status, position?}`
patch'ini göndermelidir. Mevcut schema kalıcı task sırası tutmuyorsa mobilde
görsel sıra değiştirme ilk sürümde server sırası vaadi vermemelidir.

### 8.7. Calendar

| Method | Endpoint | Amaç |
| --- | --- | --- |
| GET | `/api/v1/calendar/events?from=&to=` | Aralık bazlı etkinlik listesi |
| POST | `/api/v1/calendar/events` | Etkinlik oluşturma |
| GET | `/api/v1/calendar/events/:id` | Etkinlik detayı |
| PATCH | `/api/v1/calendar/events/:id` | Etkinlik güncelleme |
| DELETE | `/api/v1/calendar/events/:id` | Etkinlik silme |

Calendar API sınırsız tüm kayıtları döndürmez. Aylık görünüm bir
önceki ve sonraki görünen haftayı kapsayan date range ister.

### 8.8. Finance

| Method | Endpoint | Amaç |
| --- | --- | --- |
| GET | `/api/v1/finance/summary?month=` | Gelir, gider, brüt, KDV tahmini, net, bekleyen |
| GET | `/api/v1/finance/transactions` | Cursor listesi ve filtreler |
| POST | `/api/v1/finance/transactions` | Gelir/gider oluşturma |
| GET | `/api/v1/finance/transactions/:id` | Detay |
| PATCH | `/api/v1/finance/transactions/:id` | Güncelleme |
| DELETE | `/api/v1/finance/transactions/:id` | Silme |
| POST | `/api/v1/finance/analysis` | AI finans analizi; stabil v1 error/stream kontratı |

Vergi/KDV sonuçları hukuki/mali tavsiye olarak sunulmaz. Oran instance ayarına
taşınmadığı sürece UI hard-coded `%20` varsayımı yapmamalıdır.

### 8.9. Journal

| Method | Endpoint | Amaç |
| --- | --- | --- |
| GET | `/api/v1/journal/entries?from=&to=` | Tarih aralığı günlükleri |
| PUT | `/api/v1/journal/entries/:date` | Gün bazında idempotent create/update |
| GET | `/api/v1/journal/entries/:id` | Detay |
| PATCH | `/api/v1/journal/entries/:id` | Tarih/içerik güncelleme |
| DELETE | `/api/v1/journal/entries/:id` | Silme |

### 8.10. AI chat ve analizler

| Method | Endpoint | Amaç |
| --- | --- | --- |
| GET | `/api/v1/chat/sessions` | Sohbet listesi |
| POST | `/api/v1/chat/sessions` | Yeni sohbet |
| DELETE | `/api/v1/chat/sessions/:id` | Sohbeti silme |
| GET | `/api/v1/chat/sessions/:id/messages` | Mesaj geçmişi |
| POST | `/api/v1/chat/sessions/:id/messages` | Streaming AI mesajı |
| POST | `/api/v1/projects/:id/risk-analysis` | Proje risk analizi |

- Mobil stream formatı AI SDK'nin web hook'una kapalı olmamalı; SSE veya açık
  NDJSON kontratı belgelenmelidir.
- Abort/cancel desteklenir.
- `UPSTREAM_ERROR`, `UPSTREAM_TIMEOUT`, `SERVICE_UNAVAILABLE` ayrı gösterilir.
- API provider key ve model secret hiçbir response'a girmez.

### 8.11. Business

| Kaynak | Endpoint kökü | İşlemler |
| --- | --- | --- |
| Proposals | `/api/v1/business/proposals` | List, create, detail, update, delete |
| Contracts | `/api/v1/business/contracts` | List, create, detail, update, delete |
| Invoices | `/api/v1/business/invoices` | List, create, detail, update, delete |
| Subscriptions | `/api/v1/business/subscriptions` | List, create, detail, update, delete |

Web'de bazı business ekranları diğer core ekranlar kadar tamamlanmış değil.
Mobil parity, backend/domain modeli olmayan görsel vaatler üretmemeli; önce web ve
API davranışının product acceptance kriteri yazılmalıdır.

### 8.12. Owner settings

| Method | Endpoint | Amaç |
| --- | --- | --- |
| GET/PATCH | `/api/v1/settings/general` | Workspace, footer ve genel ayarlar |
| GET/PATCH | `/api/v1/settings/appearance` | Renkler, radius ve default tema |
| POST | `/api/v1/settings/appearance/assets` | Light logo, dark logo ve favicon upload |
| DELETE | `/api/v1/settings/appearance/assets/:kind` | Marka asset'i kaldırma |
| GET/PATCH | `/api/v1/settings/ai` | Provider/model/key yönetimi; key response'ta maskeli |
| GET | `/api/v1/settings/locales` | Dil listesi ve kullanım durumu |
| POST | `/api/v1/settings/locales` | Draft dil ekleme |
| GET/PATCH | `/api/v1/settings/locales/:code` | Dil metadata/lifecycle |
| GET/PUT | `/api/v1/settings/locales/:code/translations` | UI çeviri editörü |
| POST | `/api/v1/settings/locales/import` | Translation import |
| GET | `/api/v1/settings/locales/export` | Translation export |

AI key mutation ayrı step-up auth veya mevcut şifre onayı gerektirebilir.
Mevcut key mobil cihaza geri döndürülmez.

### 8.13. Portal API

Portal endpoint'leri ayrı isim alanında olmalı ve `clientId` query/body'den
güven kaynağı olarak alınmamalıdır. Client scope session'dan türetilir.

| Method | Endpoint | Amaç |
| --- | --- | --- |
| GET | `/api/v1/portal/dashboard` | Müşteri stats, projeler ve ilerleme |
| GET | `/api/v1/portal/projects` | Session client'ın projeleri |
| GET | `/api/v1/portal/projects/:id` | Localized proje, plan, public tasks, allowance ve revisions |
| GET | `/api/v1/portal/tasks` | Yalnız client'a public görevler |
| GET | `/api/v1/portal/revisions` | Müşterinin revizyonları |
| POST | `/api/v1/portal/projects/:id/revisions` | Kaynak locale ile revizyon talebi |
| GET/PATCH | `/api/v1/portal/profile` | Kendi profil bilgisi |

Cross-client negatif testleri her endpoint için zorunludur. Portal client owner
endpoint'lerini capability görse bile çağıramaz.

## 9. Mobil navigasyon ve route yapısı

### 9.1. Expo Router taslağı

```text
mobile/src/app/
  _layout.tsx
  index.tsx                         # bootstrap kararı
  (connection)/
    connect.tsx
    checking.tsx
    incompatible.tsx
  (auth)/
    login.tsx
    forgot-password.tsx
  (owner)/
    _layout.tsx
    (tabs)/
      index.tsx                     # dashboard
      work.tsx                      # clients/projects/tasks hub
      calendar.tsx
      finance.tsx
      more.tsx
    analytics/index.tsx
    clients/index.tsx
    clients/[id].tsx
    projects/index.tsx
    projects/[id].tsx
    tasks/index.tsx
    journal/index.tsx
    chat/index.tsx
    chat/[id].tsx
    business/proposals/index.tsx
    business/contracts/index.tsx
    business/invoices/index.tsx
    business/subscriptions/index.tsx
    settings/_layout.tsx
    settings/general.tsx
    settings/appearance.tsx
    settings/profile.tsx
    settings/security.tsx
    settings/ai.tsx
    settings/language.tsx
    settings/languages/index.tsx
    settings/languages/[code].tsx
    settings/languages/[code]/translations.tsx
  (portal)/
    _layout.tsx
    (tabs)/
      index.tsx                     # portal dashboard
      projects.tsx
      tasks.tsx
      revisions.tsx
      settings.tsx
    projects/[id].tsx
    settings/profile.tsx
    settings/security.tsx
    settings/appearance.tsx
    settings/language.tsx
  (modals)/
    client-form.tsx
    client-activity-form.tsx
    portal-invitation.tsx
    project-form.tsx
    planning-section-form.tsx
    task-form.tsx
    calendar-event-form.tsx
    finance-transaction-form.tsx
    journal-entry-form.tsx
    revision-request.tsx
```

Route grupları security boundary değildir. Her API request server tarafında actor
ve role kontrolünden geçer.

### 9.2. Owner tab yapısı

Telefon alt navigasyonu en fazla beş ana hedef taşır:

1. Ana Sayfa
2. İşler: Müşteriler, projeler ve görevler hub'ı
3. Takvim
4. Finans
5. Daha Fazla: Analiz, günlük, AI, business ve ayarlar

Müşteriler/projeler/görevler sık kullanılıyorsa `İşler` ekranında son
kayıtlar ve büyük hızlı aksiyonlar bulunur. Tablet'te side rail kullanılabilir.

### 9.3. Portal tab yapısı

1. Ana Sayfa
2. Projeler
3. Görevler
4. Revizyonlar
5. Ayarlar

## 10. Ekran ve feature planı

### 10.1. Ortak bootstrap ekranları

#### Splash/bootstrap

- Kayıtlı instance ve session var mı kontrol eder.
- Branding cache varsa doğru light/dark logo ile açılır.
- Session kararı tamamlanmadan owner veya portal ekranı flash etmez.
- Migration/restore nedeniyle instance ID değiştiğinde connect ekranına döner.

#### Domain connect

- Domain input, son instance, hata detayı ve retry.
- DNS bulunamadı, timeout, TLS, Neta değil, eski API, bakım ve min version
  hataları ayrı kullanıcı mesajlarına sahiptir.

#### Login

- Instance logosu, workspace adı, email, şifre, şifreyi göster ve unuttum.
- Domain değiştir aksiyonu.
- Dil seçici yok; instance default catalog kullanılır.
- Rate limit ve disabled account hataları genel `hatalı istek` altında kaybolmaz.

### 10.2. Owner dashboard

- Range seçici: hafta/ay/yıl veya backend'in desteklediği mevcut range'ler.
- Net kazanç, aktif proje, tamamlanan görev ve ortalama mood stat kartları.
- Gelir/gider özeti.
- Mood ve enerji trendi.
- Son projeler ve son müşteriler.
- Pull-to-refresh ve cache timestamp.
- Boş veride ilk kayıt CTA'ları.
- Grafikler screen reader için metinsel özet de sunar.

### 10.3. Analytics

- Tarih aralığı seçimi.
- Gelir/gider/net trendi.
- Proje status dağılımı.
- Görev tamamlama ve performans.
- Proje bazlı gelir.
- Grafik tooltip'leri locale-aware para/tarih formatlar.
- Dar ekranda chart yatay taşmaz; gerekirse kart bazlı swipe kullanılır.

### 10.4. Clients

#### Liste

- Search, status ve pipeline filtresi.
- Kart ve kompakt liste seçeneği; kanban ikinci iterasyon olabilir.
- Telefon/email kısayolları izin ve platform API'siyle açılır.
- Yeni müşteri FAB/header action.

#### Oluşturma/düzenleme

- Name, company, email, phone, website, status, pipeline, follow-up ve notes.
- Çevrilebilir alanlar aktif locale tab/picker'larında.
- Default locale zorunlu; diğer locale'ler eksik kaydedilebilir.

#### Detay

- Özet, iletişim, pipeline, portal hesabı durumu.
- Projeler ve finans ilişkileri.
- Aktivite timeline ve not ekleme.
- Portal daveti oluşturma; aktif dillerden client default locale seçimi.
- Archive/destructive aksiyon confirmation.

### 10.5. Projects

#### Liste

- Search, status, type ve client filtresi.
- Progress, deadline, client ve budget özeti.
- Yeni proje formu; client project/side project ilişki kuralı.

#### Proje detayı

Native segmented tab:

- Genel: description, status, tarih, budget ve progress.
- Plan: category bazlı planning sections; create/edit/delete/reorder.
- Görevler: proje task'ları, public flag ve hızlı status.
- Revizyonlar: talepler, allowance ve owner status update.
- Dosyalar: cover ve portal-visible proje assets.
- Ayarlar: manual/auto progress, revision quota, complete ve delete.

Plan ve project edit formları aktif locale sayısı kadar dil paneli sunar.

### 10.6. Tasks

- Liste ve kanban segmented control.
- Status, priority, client, project ve tarih filtreleri.
- Task detail sheet/screen.
- Create/edit: title, description, status, priority, schedule, due time,
  estimated/actual minute, project, client, public-to-client.
- Multilingual title/description.
- Swipe action yalnız açık undo veya confirmation politikasıyla kullanılır.
- Optimistic status update; hata durumunda rollback ve toast.

### 10.7. Calendar

- Month ve agenda görünümü.
- Gün seçilince etkinlik listesi.
- Etkinlik türü, başlangıç/bitiş, project/client/task ilişkisi.
- Native date/time picker.
- Locale, timezone ve daylight-saving doğru işlenir.
- Task deadlines ve finance events server tarafından event olarak dönüyorsa
  source/read-only bilgisi açık olur; client sentetik duplicate üretmez.

### 10.8. Finance

- Ay seçici.
- Horizontal stat carousel: aylık gelir, gider, brüt, vergi/KDV, net, bekleyen.
- Scroll indicator görsel olarak gereksizse gizlenir; accessibility swipe korunur.
- Transaction search/filter, income/expense ve payment status.
- Create/edit: amount minor conversion, currency, date, category, status,
  project/client ve localized description/category alanları.
- Silme confirmation.
- AI analysis sheet; loading, timeout, provider eksik ve retry.
- Finans verisi log/analytics payload'larında varsayılan olarak redacted olur.

### 10.9. Journal

- Tarih bazlı liste/takvim.
- Mood, energy, work satisfaction score.
- Mood label ve note için localized form.
- Aynı tarih için create/update tek idempotent akış.
- Günlük içeriği hassas kabul edilir; notification preview ve crash log'a girmez.

### 10.10. AI chat

- Session listesi, yeni sohbet, silme.
- Mesaj geçmişi ve streaming cevap.
- Klavye, safe area, auto-scroll ve uzun mesaj performansı.
- Stop generation ve retry.
- AI provider ayarlanmamışsa doğrudan ilgili ayar ekranına CTA.
- User mesajı kaynak locale ile saklanır; AI output otomatik domain çevirisi sayılmaz.

### 10.11. Business

- Teklifler: liste, create/edit, client/project, amount, status, validity.
- Sözleşmeler: liste, detail, content, proposal/client, status, signed date.
- Faturalar: liste, detail, invoice number, amount, tax, dates, payment status.
- Abonelikler: liste, create/edit, billing cycle, next billing date, status.
- PDF oluşturma/paylaşma backend tarafında gerçek feature olmadan mobilde
  gösterilmez.

### 10.12. Owner settings

#### Genel

- Workspace/firma/freelance adı.
- Portal footer ve server'da var olan genel metadata alanları.
- Değişiklik sonrası discovery/meta cache invalidate edilir.

#### Görünüm

- Primary/accent renk.
- Instance default color mode ve kişisel color mode ayrı anlatılır.
- Light logo, dark logo ve favicon image picker/upload.
- Upload crop/preview, boyut ve MIME hatası.
- Mobil app aktif temaya göre doğru logoyu anında yeniler.

#### Profil

- Display name, email read/edit politikası ve avatar.

#### Güvenlik

- Şifre değiştirme.
- Auth modeli destekliyorsa cihaz/session listesi ve revoke.

#### AI

- Gemini/OpenAI/Groq/Ollama provider, model ve yeni API key.
- Mevcut secret geri okunmaz; yalnız configured/masked state.

#### Kişisel dil

- Yalnız active instance dilleri.
- Değişiklik `/me/preferences` üzerinden kaydedilir.
- Catalog/query cache locale ile birlikte atomik değişir.

#### Dil yönetimi

- Dil listesi, default, status, fallback ve tamamlanma.
- Draft dil ekleme ve metadata.
- Translation editor mobilde namespace -> filtre -> key listesi olarak parçalanır.
- Büyük import/export dosyaları native share/file picker kullanır.
- Dil lifecycle gibi riskli owner ayarları step-up confirmation gerektirir.

### 10.13. Portal dashboard

- Aktif/tamamlanan proje, tamamlanan görev ve bekleyen revizyon statları.
- Proje progress kartları.
- Freelancer tarafından tanımlanan portal footer/branding.
- Yalnız session client'a ait veriler.

### 10.14. Portal projects ve project detail

- Project list: localized name/description, status, deadline ve progress.
- Project detail: genel, plan, public tasks ve revisions.
- Revision allowance ve `Revizyon talep et` formu.
- Revizyon description kullanıcının yazdığı dilde saklanır; `sourceLocale`
  zorunlu gönderilir.
- Başka client project ID'si 404/forbidden ile korunur ve veri sızdırmaz.

### 10.15. Portal tasks ve revisions

- Yalnız `isPublicToClient=true` task'lar.
- Project adı, status, deadline ve description localized.
- Revizyon listesi, status, tarih, project bağı ve orijinal client mesajı.

### 10.16. Portal settings

- Profil.
- Şifre/güvenlik.
- Light/dark/system kişisel tercih.
- Adminin active yaptığı diller arasında dil tercihi.
- Adminin client için atadığı `clientDefaultLocale` bilgi olarak gösterilir;
  kullanıcı tercihi bunu ezebilir.
- Portal kullanıcısı instance branding, AI veya dil kataloğu yönetemez.

## 11. Localization mimarisi

### 11.1. İki ayrı dil katmanı

1. Uygulamanın domain bağlanmadan önceki metinleri: mobil binary içinde bundled
   Türkçe/İngilizce `bootstrap` kataloğu.
2. Instance'a bağlandıktan sonraki metinler: Neta catalog endpoint'inden gelen,
   admin tarafından override edilebilen katalog.

Yeni `mobile` namespace'leri server katalog registry'sine eklenmelidir:

```text
mobile-common
mobile-connection
mobile-auth
mobile-owner
mobile-portal
mobile-settings
mobile-errors
mobile-accessibility
```

Web ve mobil aynı anlamdaki status/validation key'lerini tekrar kullanabilir.
Layout'a özgü metinler mobil namespace'te kalır. Admin yeni dil eklediğinde mobil
namespace'leri de translation editor'da görür.

### 11.2. Locale çözümü

Public connect/login:

```text
instanceDefaultLocale -> bundled tr
```

Owner:

```text
userPreferenceLocale -> instanceDefaultLocale -> built-in tr
```

Portal:

```text
userPreferenceLocale -> clientDefaultLocale -> instanceDefaultLocale -> built-in tr
```

Bu karar `/api/v1/me` ile gelir; mobil client kendi alternatif öncelik sırasını
icat etmez.

### 11.3. Catalog cache

- Cache key: `instanceId + locale + namespaceSet + catalogVersion`.
- Catalog version aynıysa cached messages kullanılır.
- Version değişince yeni catalog atomik indirilir; yarım katalog UI'a uygulanmaz.
- Missing key development'ta raporlanır, production'da fallback kullanılır.
- Raw key production UI'da görünmemesi release testidir.
- RTL locale aktif edilirse `I18nManager` restart gereksinimi kontrollü UX ile
  uygulanır; sadece text-align değiştirmek yeterli kabul edilmez.

### 11.4. Çok dilli domain formları

- Active locale'ler server sırasıyla tab/segmented dropdown olur.
- Default locale ilk ve zorunludur.
- Tab badge eksik zorunlu alanı gösterir.
- Tarih, status, para, relation, checkbox ve file alanları dil tab'ları dışındadır.
- Metin alanları registry'deki entity/field tanımından gelir; ekranlar kendi
  farklı translation payload formatını oluşturmaz.
- Server `UNSUPPORTED_LOCALE` döndürürse metadata/catalog yenilenir ve formdaki
  artık aktif olmayan dil korunarak kullanıcıya gösterilir.

## 12. Branding ve tema

Mobil tema `GET /api/v1/meta` alanlarından oluşur:

- `primaryColor`
- `accentColor`
- `defaultColorMode`
- `radiusScale`
- `lightLogoUrl`
- `darkLogoUrl`
- `iconUrl/faviconUrl`

Kurallar:

- Kullanıcının `/me.preferences.colorMode` değeri instance default'u ezer.
- `system`, cihaz renk modunu takip eder.
- Light mod light logo, dark mod dark logo kullanır.
- Bir logo eksikse diğeri fallback olabilir; kontrast garantisi olmadığı için
  nötr workspace placeholder da hazır tutulur.
- Remote renklerden semantic token seti üretilirken minimum kontrast kontrolü
  yapılır; okunmaz renk için güvenli foreground otomatik seçilir.
- App icon ve native splash her instance'a göre runtime değişmez. Bunlar genel
  Neta markasıdır; instance favicon/logo uygulama içinde kullanılır.
- Remote SVG kullanılacaksa sanitizer/render desteği ayrı test edilir. MVP'de
  backend'in kabul ettiği PNG/JPEG/WebP formatları tercih edilir.

## 13. Veri cache, offline ve mutation davranışı

### 13.1. Query key standardı

```ts
[instanceId, role, locale, resource, filters]
```

Örnek:

```ts
[instanceId, "freelancer", "tr", "projects", { status: "active" }]
```

Instance, rol veya locale değişince yanlış kullanıcı verisinin görünmesi bu
ayrımla engellenir.

### 13.2. Cache politikası

- Meta/catalog: version bazlı uzun cache.
- Dashboard/finance: kısa stale time.
- Detail/list: orta stale time ve foreground refresh.
- Chat messages: aktif session'da kısa cache/stream.
- Profile/security: no sensitive persistent cache veya alan bazlı redaction.
- Logout/instance switch: ilgili instance+user query cache temizlenir.

### 13.3. Offline v1

- Son başarılı read verisi `Son güncelleme` bilgisiyle gösterilebilir.
- Mutation başlatılırken network yoksa form kaybolmaz; kullanıcıya bağlantı
  gerektiği söylenir.
- Otomatik kalıcı mutation queue v1'de yoktur; duplicate finans kaydı/revizyon
  gibi riskleri önler.
- Optimistic update yalnız task status gibi kolay rollback edilebilir işlemlerde.
- Create/delete finance, project ve revision server onayından önce kalıcı
  başarılı gösterilmez.

### 13.4. Gelecek offline queue gereksinimleri

- Idempotency key.
- Mutation dependency graph.
- Conflict/version kontrolü.
- Kullanıcıya görünür pending/failed queue.
- Logout ve instance switch'te pending data kararı.
- Hassas payload'lar için encrypted local database.

## 14. Hata yönetimi ve kullanıcı geri bildirimi

| Kod/durum | Mobil davranış |
| --- | --- |
| `VALIDATION_ERROR` | Alan hataları formda, genel hata summary'de |
| `UNAUTHENTICATED` | Session temizle, login'e git, draft formu mümkünse koru |
| `FORBIDDEN` | Yetki ekranı; route'u gizlemek tek başına yeterli değil |
| `NOT_FOUND` | Detail not-found ve listeye dön |
| `CONFLICT` | Server state refresh ve conflict UI |
| `UNSUPPORTED_LOCALE` | Locale metadata/catalog refresh |
| `UPSTREAM_TIMEOUT` | AI için tekrar dene; core data mutation tekrar edilmez |
| `SERVICE_UNAVAILABLE` | Instance bakım/readiness mesajı |
| Network timeout | Offline banner ve kontrollü retry |
| TLS error | Credential göndermeden bağlantıyı durdur |
| API major incompatible | App update veya desteklenmeyen instance ekranı |

Her error objesi internal URL, SQL, stack trace, token veya secret içermemelidir.

## 15. Dosya ve medya yönetimi

- Image picker permission yalnız aksiyon anında istenir.
- Dosya MIME, extension ve 5 MB server limiti upload öncesi gösterilir.
- Upload `multipart/form-data` olur; auth header/cookie korunur.
- Progress, cancel ve retry bulunur.
- Server response absolute veya instance-bound URL döndürmelidir; mobil client
  farklı origin varsaymaz.
- Private/portal/public branding visibility kuralları server'da uygulanır.
- Portal-visible olmayan project asset client'a URL olarak bile dönmez.
- EXIF/location metadata temizleme politikası backend veya upload öncesi için
  ayrı acceptance kriteridir.

## 16. Güvenlik modeli

### 16.1. Zorunlu kurallar

- Remote instance için HTTPS.
- Session/token yalnız SecureStore/Keychain/Keystore destekli alanda.
- Password hiçbir local storage, log, crash report veya analytics event'ine girmez.
- API key mobilde geri okunabilir biçimde tutulmaz.
- Owner/client authorization her endpoint'te server actor'dan türetilir.
- Portal query'lerinden gelen `clientId` yetki kaynağı değildir.
- Loglar request/response body'yi varsayılan olarak kaydetmez.
- Clipboard'a kopyalanan hassas bilgiler minimize edilir.
- Jailbreak/root detection tek başına auth kontrolü sayılmaz.
- Certificate pinning self-host ve değişken domain modelinde varsayılan olamaz;
  opsiyonel instance fingerprint/pin ancak ayrı tasarımla gelir.

### 16.2. Threat cases

- Kötü niyetli discovery belgesinin başka origin'e auth URL vermesi.
- DNS rebinding/redirect ile HTTPS downgrade.
- Aynı origin'in restore sonrası farklı instance ID döndürmesi.
- Shared device'da kullanıcı A cache'inin kullanıcı B'ye görünmesi.
- Client'ın başka client project/task ID'sini tahmin etmesi.
- Retry sonucu duplicate finance/revision oluşması.
- AI error/log içine provider secret sızması.
- Remote logo/file ile dev payload veya aşırı bellek kullanımı.

## 17. Performans hedefleri

- Warm start'ta cached shell/logo hemen; auth doğrulama arka planda.
- Discovery ve meta request'leri timeout/abort destekler.
- Dashboard tek aggregate endpoint kullanır.
- Listeler cursor pagination ve virtualized list kullanır.
- Chart library yalnız gerçek chart ekranlarında lazy load edilir.
- Remote image boyutları sınırlanır ve cache edilir.
- Locale catalog namespace bazlı indirilir.
- Project detail'in tüm tab verileri ilk render'da zorunlu değilse lazy query olur.
- Chat message listesi uzun session'larda virtualized olur.

Ölçülecek metrikler:

- Cold start -> connect/login shell.
- Warm start -> authenticated shell.
- Dashboard usable data time.
- P50/P95 API latency endpoint ailesi bazında.
- JS crash-free session.
- Auth/session failure oranı.
- Catalog ve branding cache hit oranı.

Telemetry self-host ilkesine uygun opt-in olmalı; merkezi Neta sunucusuna içerik
gönderilmemelidir.

## 18. Erişilebilirlik ve cihaz uyumu

- Erişilebilirlik Faz 20'ye ertelenmez; her ekran kendi fazında aşağıdaki
  baseline kapısından geçmeden tamamlanmış sayılmaz. Faz 20 tüm uygulamanın
  son regresyon ve cihaz matrisi auditidir.
- Etkileşimli kontroller minimum 48x48 dp hedef kullanır; bu değer iOS 44x44
  minimumunu da kapsar.
- Dynamic font ve text scaling.
- Sadece renkle durum anlatılmaz.
- Icon button'larda localized accessibility label.
- Form alanı görünür label ve programatik accessibility label taşır; hata
  alanla ilişkilendirilir, canlı özet okunur ve submit sonrası ilk hataya odaklanır.
- Chart'lar metinsel summary sunar.
- Dark/light kontrast semantik token testinden geçer.
- Form ekranı keyboard avoidance, scroll-to-focus, focus order, return-key ve
  keyboard dismissal davranışıyla iOS/Android'de test edilir; hiçbir aktif alan
  klavye veya safe area altında kalmaz.
- Safe area, notch ve Android navigation bar uyumu.
- RTL layout mirror testi.
- Liste araması debounce/iptal veya eşdeğer stale-response koruması kullanır;
  uzun listeler cursor pagination ve virtualization olmadan tamamlanmış sayılmaz.
- Screen reader açıkken loading, empty, error, disabled ve selected durumları
  yalnız görsel ipucuna bağlı kalmaz.
- 14 inç web davranışı mobil acceptance değildir; telefon, küçük telefon
  ve tablet ayrı screenshot testlerine girer.

## 19. Test stratejisi

### 19.1. Unit

- URL normalize ve origin validation.
- Discovery/meta schema parse.
- SemVer minimum client kontrolü.
- Error mapping.
- Money/date/locale format.
- Theme token derivation ve foreground contrast.
- Translation fallback.
- Query key isolation.

### 19.2. Contract/integration

- Her `/api/v1` endpoint için request/response schema.
- API version header ve envelope.
- Owner/client pozitif ve negatif auth.
- Cursor pagination determinism.
- Localized resource ve translation mutation.
- Idempotency ve conflict.
- File visibility.
- AI timeout/error/stream.

### 19.3. Mobil component

- Loading, empty, error, content.
- Light/dark ve custom primary.
- TR/EN, uzun custom locale ve RTL.
- Form validation ve locale tab errors.
- Offline banner ve mutation guard.

### 19.4. E2E

En az iki gerçek self-host fixture:

1. Default branding, TR default, freelancer.
2. Custom branding, EN veya custom locale, portal client.

Kritik E2E senaryoları:

- Domain -> discovery -> login -> owner dashboard.
- Domain -> login -> portal dashboard.
- Yanlış domain/TLS/API version.
- Session expiry ve logout.
- Client create -> portal invite locale.
- Project create with TR/EN -> client EN portal read.
- Task create/public -> portal task visibility.
- Revision request -> owner status update.
- Finance create/edit/delete.
- Theme/logo switch.
- Locale/catalog version switch.
- Cross-client project access negative.

### 19.5. Release gate

```text
mobile lint
mobile typecheck
mobile unit tests
API contract tests
i18n key parity + raw key scan
owner/client authorization negative tests
iOS build
Android build
smoke against packaged self-host instance
```

## 20. CI/CD ve yayın

- PR: lint, typecheck, unit, API contract ve i18n gate.
- Main/nightly: iOS simulator ve Android emulator E2E.
- Release candidate: TestFlight + Play Internal Testing.
- Production: staged rollout ve crash-free takip.
- `NETA_MINIMUM_MOBILE_VERSION` yalnız gerçekten zorunlu protokol/güvenlik
  durumunda yükseltilir.
- Mobil app version, native build number ve API contract version ayrıdır.
- OTA update kullanılırsa native runtime version ile uyumluluk korunur; native
  module gerektiren değişiklik OTA ile zorlanmaz.
- Privacy policy; girilen domain, cihazda tutulan metadata, opsiyonel telemetry ve
  crash reporting davranışını açıkça anlatır.

## 21. Faz bazlı uygulama planı

Bir faz, checklist ve acceptance kriterleri tamamlanmadan `completed` sayılmaz.
Backend endpoint'i olmayan mobil ekran mock data ile bitmiş işaretlenmez.

### Faz 0 — Baseline, kararlar ve mobil API gap analizi

- [ ] Mevcut web route, Server Action, DomainService ve schema envanteri snapshot'lanır.
- [ ] Owner ve portal ekran parity matrisi onaylanır.
- [x] Expo stabil SDK/RN/Node/pnpm sürümleri seçilir.
- [ ] Better Auth Expo multi-domain spike gerçek cihazda yapılır.
- [ ] Cookie/session izolasyonu iki farklı instance ile test edilir.
- [ ] ADR-0018 secure-cookie veya device-pairing sonucuna göre revize edilir.
- [ ] Portal client auth lifecycle kararı yazılır.
- [x] Poyraz UI web sınırı ve mobil token kontratı kaydedilir.
- [x] API endpoint backlog'u issue/fazlarla eşleştirilir.
- [ ] MVP, parity ve post-v1 kapsamı product tarafından onaylanır.

Tamamlanma kriteri: Auth ve repository mimarisi açık karar, spike kanıtı ve
güncellenmiş ADR ile sabittir.

### Faz 1 — Workspace ve Expo temel uygulama

- [x] `mobile/` Expo Router TypeScript app oluşturulur.
- [x] pnpm workspace mevcut web root'unu bozmadan kurulur.
- [x] iOS ve Android development build alınır.
- [x] Environment ve app config yapısı kurulur.
- [x] Typed routes, protected route grupları ve error boundary kurulur.
- [x] Lint, typecheck, unit test ve CI scriptleri eklenir.
- [x] SecureStore ve non-secret storage adapter'ları ayrılır.
- [x] Network state ve app lifecycle provider eklenir.

### Faz 2 — Mobil design system ve tema

- [x] Shared semantik design token paketi oluşturulur.
- [x] Light/dark/system theme provider yazılır.
- [x] Dynamic primary/accent ve kontrast çözümü uygulanır.
- [x] Temel UI primitives tamamlanır.
- [x] Loading/empty/error/skeleton/toast pattern'leri sabitlenir.
- [x] Phone/tablet safe-area ve typography kuralları yazılır.
- [x] UI katalog key'leri `mobile-*` namespace'lerine eklenir.
- [ ] Light/dark ve TR/EN component screenshot testleri eklenir.

### Faz 3 — Domain discovery ve instance bootstrap

- [x] Domain normalize/validation saf modülü yazılır.
- [x] Discovery, health ve meta client'ları yazılır.
- [x] Redirect/origin/TLS/min-version/capability kontrolleri uygulanır.
- [x] Instance registry ve instanceId değişim davranışı uygulanır.
- [x] Domain connect/checking/error/incompatible ekranları tamamlanır.
- [x] Branding ve public catalog bootstrap edilir.
- [x] Localhost/emulator development policy test edilir.

### Faz 4 — Native auth, session ve role shell

- [ ] Server Better Auth Expo plugin ve trusted origin değişiklikleri yapılır.
- [x] Instance-bound native auth client factory yazılır.
- [x] Secure storage prefix instanceId ile izole edilir.
- [x] Login, logout, expiry ve foreground session kontrolü tamamlanır.
- [x] `/api/v1/me` ile owner/client route kararı uygulanır.
- [x] Owner ve portal navigation shell'leri tamamlanır.
- [ ] Disabled user, password change ve revoke testleri geçer.
- [ ] Auth audit ve rate limit regression testleri geçer.

### Faz 5 — API contract paketi ve resource altyapısı

- [x] `packages/api-contracts` transport-safe hale getirilir.
- [x] Envelope, error, pagination ve localized response şemaları eklenir.
- [x] Instance-bound fetch client, timeout, abort ve request metadata eklenir.
- [x] Query client, query key factory ve cache persistence kurulur.
- [ ] API route helper'ları actor/role/locale/pagination için ortaklaştırılır.
- [x] Idempotency ve optimistic concurrency kararı uygulanır.
- [x] API OpenAPI veya machine-readable contract üretimi kararlaştırılır.

### Faz 6 — Owner dashboard ve analytics

- [ ] Dashboard aggregate API yazılır ve owner scope testi eklenir.
- [ ] Analytics range API yazılır.
- [x] Dashboard ekranı tüm states ile tamamlanır.
- [x] Analytics ekranı ve accessible chart summary tamamlanır.
- [x] Para/tarih/locale format testleri geçer.
- [ ] Request count ve P95 hedefi ölçülür.

### Faz 7 — Clients dikey dilimi

- [ ] Clients list/detail/create/update/archive API'leri yazılır.
- [ ] Activity ve portal invitation API'leri v1'e alınır.
- [x] Client list/filter/search ekranı tamamlanır.
- [x] Client multilingual form tamamlanır.
- [x] Form keyboard avoidance, alan hatası/odak ve liste kontrol label'ları baseline'a alınır.
- [ ] Client detail/activity/portal locale akışı tamamlanır.
- [ ] Portal invite duplicate/conflict ve owner-only testleri geçer.

### Faz 8 — Projects dikey dilimi

- [ ] Projects CRUD/list/detail API'leri yazılır.
- [ ] Planning sections ve revision owner API'leri yazılır.
- [x] Project list ve multilingual create form tamamlanır.
- [x] Form keyboard avoidance, alan hatası/odak ve liste kontrol label'ları baseline'a alınır.
- [ ] Project detail tabları tamamlanır.
- [ ] Progress/revision quota/complete/delete akışları test edilir.
- [ ] Client-project relation ve cross-owner negatifleri geçer.

### Faz 9 — Tasks dikey dilimi

- [ ] Tasks CRUD/filter API'leri yazılır.
- [x] List/kanban görünümü tamamlanır.
- [x] Multilingual task form tamamlanır.
- [x] Optimistic status/complete ve hata rollback'i tamamlanır.
- [x] Task form keyboard, ilk hata odağı, screen reader ve 48 dp baseline'ından geçer.
- [ ] Project auto-progress regression testleri geçer.
- [ ] Portal visibility server testi geçer.

### Faz 10 — Calendar dikey dilimi

- [ ] Date-range event API'leri yazılır.
- [x] Month/agenda ekranı tamamlanır.
- [x] Multilingual event form ve native date picker tamamlanır.
- [x] Takvim klavye, ilk hata odağı, screen reader ve 48 dp baseline'ından geçer.
- [ ] Timezone/DST/start-end validation testleri geçer.
- [ ] Project/client/task ownership negatifleri geçer.

### Faz 11 — Finance dikey dilimi

- [ ] Summary ve transaction CRUD API'leri yazılır.
- [x] Stat carousel ve transaction list/filter tamamlanır.
- [x] Multilingual finance form ve money conversion test edilir.
- [ ] AI finance analysis v1 endpoint/error kontratına alınır.
- [x] Mobil create ve analysis mutation'ları idempotency anahtarı taşır.
- [ ] Hassas veri log redaction testi geçer.

### Faz 12 — Journal dikey dilimi

- [ ] Range ve idempotent date upsert API'leri yazılır.
- [x] Journal list/calendar ekranı tamamlanır.
- [x] Mood/energy/satisfaction ve multilingual note formu tamamlanır.
- [x] Mobil date-upsert ve offline guard testleri geçer.
- [x] Not içeriği mobil liste, accessibility label ve loglardan ayrı tutulur.

### Faz 13 — AI chat ve project risk

- [ ] Chat session/message API'leri v1'e taşınır.
- [x] Native NDJSON streaming protokolü belgelenir ve mobil istemcide uygulanır.
- [x] Session list/chat detail/composer tamamlanır.
- [x] Cancel/retry/timeout/provider-missing mobil UX tamamlanır.
- [x] Project risk analysis mobil action'la entegre edilir.
- [x] Mobil secret/error redaction ve stream parser testleri geçer.

### Faz 14 — Business modülleri

- [ ] Proposals API ve mobil ekranları tamamlanır.
- [ ] Contracts API ve mobil ekranları tamamlanır.
- [ ] Invoices API ve mobil ekranları tamamlanır.
- [ ] Subscriptions API ve mobil ekranları tamamlanır.
- [x] Dört business kaynağının mobil CRUD/list/form yüzeyi tamamlanır.
- [x] Mobil money/status/date contract ve form testleri geçer.
- [ ] Server owner-scope negatif testleri geçer.
- [x] Web'de/backend'de eksik product davranışları capability gelene kadar planned tutulur; PDF aksiyonu gösterilmez.

### Faz 15 — Owner profil, güvenlik ve instance ayarları

- [ ] Me profile/password/session API'leri tamamlanır.
- [ ] General/appearance/AI settings API'leri tamamlanır.
- [x] Mobil profil ve güvenlik ekranları tamamlanır.
- [x] Mobil workspace ve appearance ekranları tamamlanır.
- [x] Light/dark logo ve favicon mobil upload/remove tamamlanır.
- [x] AI provider/key formu secret-safe tamamlanır.
- [ ] Meta/discovery/cache invalidation testi geçer.

### Faz 16 — Dil tercihi, dil yönetimi ve çok dilli formlar

- [x] Bundled `mobile-*` TR/EN katalog parity yüzde 100 olur.
- [x] Catalog version/cache/fallback mobil runtime tamamlanır.
- [x] Owner kişisel dil ekranı tamamlanır.
- [ ] Locale list/create/detail/lifecycle API ve ekranları tamamlanır.
- [x] Locale list/create/detail/lifecycle mobil ekranları tamamlanır.
- [x] Mobil translation editor ve native JSON import/export tamamlanır.
- [x] Tüm mevcut owner form entity'leri ortak localized payload registry'sine geçer.
- [ ] Custom locale ve RTL E2E geçer.
- [x] Production raw-key taraması sıfır sonuç verir.

### Faz 17 — Portal API ve authorization hardening

- [ ] Portal dashboard/projects/tasks/revisions server API'leri yazılır.
- [ ] Portal profile server API tamamlanır.
- [x] Strict mobil portal API adapter ve localized response/fallback kontratı uygulanır.
- [x] Mobil istemci owner/client role, path traversal ve caller-controlled `clientId` negatiflerini reddeder.
- [ ] Her server endpoint için cross-client ve owner/client role negatifleri yazılır.
- [x] Mobil kontrat public task ve portal asset visibility dışındaki yanıtları reddeder.
- [x] Mobil revision allowance ve zorunlu `sourceLocale` testleri geçer.
- [ ] Server public task/asset visibility ve revision allowance testleri geçer.

### Faz 18 — Portal mobil ekranları

- [x] Portal dashboard tamamlanır.
- [x] Project list ve project detail bölümleri tamamlanır.
- [x] Public tasks tamamlanır.
- [x] Revision list/create tamamlanır.
- [x] Profile/security/appearance/language ayarları tamamlanır.
- [ ] Admin branding ve client locale davranışı E2E geçer.
- [x] Owner route'ları portal navigasyon UI'ında görünmez.
- [ ] Owner API'leri client session ile server tarafında forbidden'dır.

### Faz 19 — Dosya, medya, invitation ve deep link

- [ ] File endpoint'leri v1 envelope ve absolute URL kontratına alınır.
- [x] Mobilde avatar, light logo, dark logo, favicon, cover ve project asset upload yüzeyleri tamamlanır.
- [x] Native multipart upload progress/cancel/retry akışı tamamlanır.
- [x] Custom app link ve güvenli invitation/password-reset yönlendirmesi tamamlanır.
- [ ] Self-host domain universal/app link association dosyaları ve signed-build entitlement doğrulanır.
- [ ] Portal invitation ve password reset web fallback ile test edilir.
- [x] Mobil File visibility/MIME/size/absolute URL/metadata kontrat testleri geçer.
- [ ] Server MIME sniffing, yeniden encode/EXIF temizleme ve authorization testleri geçer.

### Faz 20 — Offline read cache, performans ve accessibility

- [x] Query persistence hassasiyet matrisiyle etkinleştirilir.
- [x] Offline banner, stale timestamp ve global mutation guard tamamlanır.
- [x] Büyüyen portal listeleri sanallaştırılır ve public branding image cache ısıtılır.
- [x] Cold/warm start ve dashboard performans ölçümü ile budget kontratı eklenir.
- [ ] Cold/warm start ve dashboard budget'ları gerçek iOS/Android cihazda geçer.
- [x] Dynamic type, keyboard ve touch target için ortak primitive/statik release gate uygulanır.
- [ ] Dynamic type, screen reader, keyboard ve touch target audit geçer.
- [ ] Light/dark/custom color ve RTL accessibility testleri geçer.
- [ ] Küçük telefon ve tablet responsive testleri geçer.

### Faz 21 — Bildirim altyapısı ve background davranışı

- [x] Bildirimlerin self-host backend ile nasıl gönderileceği için ADR yazılır.
- [x] Expo push relay kullanımının privacy/self-host etkisi açıklanır.
- [x] Device registration/revoke endpoint'leri tasarlanır.
- [x] Görev deadline, revizyon ve proje update event kapsamı belirlenir.
- [x] Notification deep link auth, user/role ve instance kontrolünden geçer.
- [x] Hassas içerik lock-screen preview'da varsayılan olarak gösterilmez.
- [ ] `mobile.notifications.v1` capability açılır ve gerçek server/device delivery tamamlanır.

Bu faz ilk store release için zorunlu olmayabilir; capability `planned` kaldığı
sürece UI da sunulmaz.

### Faz 22 — Production hardening ve store release

- [x] Release gate ve iki platform production JS export'u CI workflow'una eklenir.
- [ ] Tüm release gate'ler remote CI'da geçer.
- [ ] Gerçek Dokploy/reverse-proxy self-host instance ile smoke geçer.
- [ ] iOS TestFlight ve Play Internal Testing kabulü tamamlanır.
- [x] Privacy policy, support ve domain troubleshooting repository taslağı hazırlanır.
- [ ] Privacy policy ve support dokümanı public URL'de yayınlanır.
- [x] App Store/Play TR/EN metadata ve screenshot storyboard hazırlanır.
- [ ] Gerçek store ölçülerinde TR/EN screenshot'lar üretilir.
- [x] Crash/log redaction, console/public-secret taraması ve opt-in telemetry sınırı doğrulanır.
- [x] Minimum mobile version ve API v1 compatibility senaryosu test edilir.
- [x] Rollback, staged rollout ve hotfix prosedürü yazılır.
- [ ] Owner ve portal E2E acceptance imzası alınır.

### Faz 23 — Device pairing ve gelişmiş oturum yönetimi

Bu fazın kapsamı Faz 0 auth kararına bağlıdır. Pairing production blocker
olarak kalırsa Faz 4'e çekilir.

- [x] Pairing code/challenge schema, hashing ve rate limit server kontratı tasarlanır.
- [ ] Pairing schema/migration ve rate limit server'da uygulanır.
- [x] Mobil exchange/access/refresh rotation ve strict response doğrulaması uygulanır.
- [ ] Transactional exchange/rotation server'da uygulanır.
- [x] Instance-scoped SecureStore token family entegrasyonu tamamlanır.
- [x] Capability-gated pairing ile device list/tek revoke/tümünü revoke UI tamamlanır.
- [x] Mobil refresh reuse/compromised family temizleme politikası test edilir.
- [ ] Server concurrent refresh reuse -> family compromised testi geçer.
- [x] Password change revoke talebi, disabled user ve tüm cihazlardan çıkış mobil lifecycle'ı tamamlanır.
- [ ] Password change/disabled user/tüm cihazlardan çıkış server revoke matrisi geçer.
- [x] Restore/reinstall installation binding uyuşmazlığı mobilde oturumu temizler.
- [ ] Backup restore token epoch server tarafında rotate edilir ve E2E geçer.
- [x] Mobil source/release gate raw token veya secret loglamayı reddeder.
- [ ] Server DB/log taramasında raw code/token bulunmaz.

## 22. Milestone ve hızlı teslim sırası

### Milestone A — Bağlanabilir uygulama

Faz 0–5:

- Domain girilir.
- Neta instance tanınır.
- Marka/dil yüklenir.
- Kullanıcı giriş yapar.
- Rolüne uygun boş shell açılır.

### Milestone B — Freelancer core MVP

Faz 6–13:

- Dashboard, analiz, müşteri, proje, görev, takvim, finans, günlük ve AI.
- Bu noktada mobil uygulama freelancer'ın günlük ana işlerini karşılar.

### Milestone C — Tam owner yönetimi

Faz 14–16:

- Business ve tüm ayarlar.
- Instance branding/dil/AI yönetimi.
- Çok dilli içerik parity.

### Milestone D — Müşteri portalı

Faz 17–19:

- Portal API hardening.
- Portal ekranları.
- Dosyalar, invitation ve deep link.

### Milestone E — Store kalitesi

Faz 20–23:

- Offline read, performans, accessibility, opsiyonel notification.
- Production hardening ve gerekiyorsa pairing.

## 23. Definition of Done

Bir feature yalnız UI göründüğünde tamamlanmış sayılmaz. Her feature için:

- [ ] API v1 contract ve stable error code var.
- [ ] Owner/client authorization server tarafında testli.
- [ ] Loading, empty, error, offline ve content state'leri var.
- [ ] Light/dark ve custom branding doğru.
- [ ] TR/EN ve custom locale fallback doğru.
- [ ] Dinamik metin alanlarında translation payload doğru.
- [ ] Accessibility label, focus ve touch target doğru.
- [ ] Query invalidation/cache isolation doğru.
- [ ] Mutation duplicate/conflict davranışı tanımlı.
- [ ] Secret/PII log redaction doğru.
- [ ] Unit + contract + en az bir E2E happy path geçiyor.
- [ ] Plan faz checklist'i ve ilgili teknik doküman güncel.

## 24. Başlamadan önce cevaplanması gereken ürün kararları

Bu sorular Faz 0'da cevaplanmalı; uygulama bootstrap'ını bloke etmek zorunda
değildir fakat ilgili feature fazını bloke eder:

1. Tek aktif instance yeterli mi, yoksa ilk sürümde hızlı instance switch olacak mı?
2. Owner mobil login email/şifre mi, pairing mi, yoksa ikisi birden mi olacak?
3. Müşteri invitation kabulü ilk sürümde native mi web fallback mi olacak?
4. Business ekranları MVP mi, parity milestone'u mu?
5. Mobilde admin dil translation editor gerçekten gerekli mi, yoksa ilk sürümde
   dil seçimi yeterli ve katalog yönetimi web-only olabilir mi?
6. Push notification ilk store release blocker mı?
7. Tablet ilk release acceptance kapsamında mı?
8. Self-host instance'lar için merkezi telemetry tamamen kapalı mı, opt-in mi?

## 25. İlk uygulanacak teknik dilim

En hızlı ve riski en erken azaltan ilk uygulama dilimi:

```text
Faz 0 auth spike
  -> mobile workspace bootstrap
  -> domain connect
  -> discovery/meta/health
  -> instance branding + catalog
  -> Better Auth native login
  -> /api/v1/me
  -> role-based owner/portal shell
```

Bu dilim tamamlandığında henüz bütün ekranlar yazılmamış olsa bile projenin
en kritik vaadi kanıtlanmış olur: tek bir React Native uygulaması, kullanıcının
girdiği herhangi bir uyumlu self-hosted Neta domain'ini güvenli biçimde tanır,
o instance'ın markasına ve diline bürünür, kullanıcıyı doğrular ve freelancer
veya müşteri deneyimine doğru yönlendirir.
