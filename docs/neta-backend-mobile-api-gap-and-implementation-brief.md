# Neta backend → mobile API gap ve uygulama görevi

> Tarih: 31 Temmuz 2026  
> Hedef repository: `neta` (web/backend)  
> Referans istemci repository: `neta-mobile`  
> Durum: Backend agent'ına doğrudan atanabilir uygulama brifi

## 1. Kısa teşhis

Neta'nın veritabanı, domain servisleri ve web arayüzündeki Server Action'ları mobil uygulamanın ihtiyaç duyduğu işlevlerin büyük bölümünü zaten içeriyor. Eksik olan ana parça, bu işlevleri `/api/v1` altında güvenli, sürümlü ve mobil istemcinin beklediği JSON sözleşmesiyle sunan backend API katmanıdır.

Şu an backend yalnızca aşağıdaki v1 yüzeylerini gerçekten sunuyor:

- `GET /.well-known/neta`
- Better Auth altındaki `/api/auth/*`
- `GET /api/v1/health`
- `GET /api/v1/meta`
- `GET /api/v1/me`
- `PATCH /api/v1/me/preferences`
- `GET /api/v1/localization/catalog`

Dashboard, müşteriler, projeler, görevler, takvim, finans, günlük, sohbet, ayarlar, dosyalar ve müşteri portalı için mobilin çağırdığı `/api/v1` route'ları yoktur. Next.js bu isteklerde JSON API hatası yerine HTML `404` sayfası döndürmektedir.

Canlı `https://demo.takeneta.com` üzerinde 31 Temmuz 2026 tarihinde yapılan salt-okunur kontrolde:

| İstek | Durum | Content-Type |
| --- | ---: | --- |
| `GET /.well-known/neta` | `200` | `application/json` |
| `GET /api/v1/meta` | `200` | `application/json` |
| `GET /api/v1/health` | `200` | `application/json` |
| `GET /api/v1/me` (oturumsuz) | `401` | `application/json` |
| `GET /api/v1/dashboard/overview?range=this_month` | `404` | `text/html` |
| `GET /api/v1/clients` | `404` | `text/html` |
| `GET /api/v1/portal/dashboard` | `404` | `text/html` |

Bu yüzden mobilde görülen “dashboard alınamadı”, “sunucu JSON olmayan yanıt döndürdü” veya son düzenlemeden sonra “bu sunucu gereken mobil API endpoint'ini henüz sunmuyor” mesajları istemci bağlantı hatası değildir. Sunucu gerçekten ilgili route'u sunmamaktadır.

## 2. P0 tutarsızlık: capability ilanı gerçeği yansıtmıyor

Backend'deki `server/api/v1/contracts.ts` ve canlı discovery/meta yanıtları şu capability'leri `available` ilan ediyor:

- `mobile-v1`
- `files.local`
- `freelancer.core`
- `portal.client`
- `ai.assistant`

Ancak bu capability'lerin temsil ettiği mobil route'lar henüz yoktur. Bu bir protokol ihlalidir: istemci discovery sonucuna göre sunucunun mobil uyumlu olduğunu kabul ediyor, giriş yapıyor ve ilk kaynak isteğinde HTML `404` alıyor.

Backend agent'ı ilk olarak şu iki seçenekten birini uygulamalıdır:

1. Tercih edilen çözüm: Aşağıdaki API yüzeylerini tamamla, contract testleri geçtikten sonra capability'leri `available` yap.
2. Geçiş çözümü: Tamamlanmamış capability'leri `planned` yap ve `capabilities` dizisinden çıkar. `mobile-v1` yalnız minimum production mobil yüzeyi gerçekten hazırsa `available` olmalıdır.

Capability yayınlama build-time sabiti olmamalı veya sabit kalacaksa bütün bağlı endpoint'ler aynı release içinde atomik olarak teslim edilmelidir. Bir capability'nin contract testi başarısızsa deployment kalite kapısı capability'nin `available` ilan edilmesini engellemelidir.

Önerilen ayrıntılı capability ayrımı:

| Capability | Kapsam |
| --- | --- |
| `freelancer.dashboard.v1` | Dashboard + analytics overview |
| `freelancer.clients.v1` | Client CRUD, activity ve portal invitation |
| `freelancer.projects.v1` | Project CRUD, planning, revisions ve assets |
| `freelancer.tasks.v1` | Task CRUD ve complete |
| `freelancer.calendar.v1` | Calendar range + event CRUD |
| `freelancer.finance.v1` | Finance summary/transactions |
| `freelancer.journal.v1` | Journal range + upsert/CRUD |
| `freelancer.settings.v1` | Profile, preferences, general, appearance, AI |
| `instance.locales.admin.v1` | Locale ve translation yönetimi |
| `files.v1` | Güvenli multipart upload/list/delete/read |
| `portal.client.v1` | Client-scoped dashboard/projects/tasks/revisions/profile |
| `ai.assistant.v1` | Chat NDJSON + risk/finance analysis |

Mobil bugün toplu capability adlarını saklıyor; ayrıntılı adlar ileriye dönük eklenebilir. Fakat mevcut toplu adların yanlış `available` ilan edilmesi hemen düzeltilmelidir.

## 3. Sözleşmenin tek doğruluk kaynağı

Mobilin wire contract tanımları ve runtime type guard'ları şurada bulunuyor:

- `packages/api-contracts/src/index.ts`

Mobilin çağrı noktaları şuralarda:

- `apps/neta-mobile/src/features/*/api.ts`
- `apps/neta-mobile/src/lib/auth/native-auth-client.ts`
- `apps/neta-mobile/src/lib/instance/discovery.ts`
- `apps/neta-mobile/src/lib/resource/api-client.ts`

Backend route'ları bu tip isimleri ve alan şekillerini birebir karşılamalıdır. Backend runtime'ında sibling repository import'una güvenilmemelidir. Uygun çözüm seçenekleri:

- `@neta/api-contracts` paketini sürümlü, ortak bir workspace/npm paketi yapmak; veya
- Backend içinde eşdeğer Zod DTO'ları oluşturmak ve mobil contract fixture'larıyla consumer-driven contract testleri çalıştırmak.

Route'lar ham Drizzle satırı döndürmemelidir. `server/api/v1/presenters` veya benzer bir katmanda domain satırlarını mobil DTO'larına dönüştüren açık presenter fonksiyonları olmalıdır.

### 3.1 Backend'in tek başına çözemeyeceği bir mobil contract çakışması

İncelemede mobil repository içinde aynı endpoint için iki farklı response beklentisi bulundu:

- `features/projects/api.ts` → `GET /projects/:id/assets` için `PaginatedResponse<ProjectAsset>` bekliyor.
- `features/files/api.ts` → aynı endpoint için doğrudan `FileAsset[]` bekliyor.

Bir JSON response aynı anda hem object pagination zarfı hem çıplak array olamayacağı için backend iki istemciyi birlikte tatmin edemez. Canonical backend kararı şu olmalıdır:

```ts
PaginatedResponse<FileAsset>
```

`FileAsset`, project asset endpoint'inde `kind='project_asset'` ve `visibility='private'|'portal'` koşullarıyla `ProjectAsset`ın üst kümesidir. Bu nedenle project detail ekranı aynı item'ları kabul eder. Mobilde `features/files/api.ts` parser'ı çıplak array yerine pagination zarfındaki `items` alanını okuyacak şekilde ayrıca düzeltilmelidir.

Backend agent'ı bu çakışmayı özel content negotiation veya endpoint'e göre değişen response ile gizlememelidir. Kararlı v1 wire shape pagination zarfı olmalıdır. Bu dokümandaki tek bilinen istemci-side takip işidir; diğer DTO'lar backend tarafından doğrudan karşılanabilir.

## 4. Bütün v1 endpoint'leri için ortak kurallar

### 4.1 Başarı ve hata zarfı

Normal JSON başarısı:

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
    "message": "İstek doğrulanamadı.",
    "details": {
      "messageKey": "api.errors.validation",
      "fieldErrors": {
        "translations.tr.name": ["Bu alan zorunludur."]
      }
    }
  }
}
```

Mevcut `apiV1Success` ve `apiV1Error` kullanılmalıdır. Bütün `/api/v1/**` yanıtları, route bulunamadığında dahi, JSON olmalıdır. API ağacında HTML 404 sızıntısı olmaması için gerekirse `/api/v1/[...path]` JSON fallback route'u eklenmelidir.

HTTP eşlemesi:

| Kod | HTTP |
| --- | ---: |
| `UNAUTHENTICATED` | 401 |
| `FORBIDDEN` | 403 |
| `NOT_FOUND` | 404 |
| `CONFLICT` | 409 |
| `VALIDATION_ERROR`, `UNSUPPORTED_LOCALE` | 400 veya 422; tek politika seçilmeli |
| `UPSTREAM_ERROR` | 502 |
| `SERVICE_UNAVAILABLE` | 503 |
| `UPSTREAM_TIMEOUT` | 504 |
| beklenmeyen hata | 500 / `INTERNAL_ERROR` |

Her hata `application/json` ve `X-Neta-API-Version: 1` ile dönmelidir. Stack trace, SQL, dosya yolu, API key, cookie, authorization header ve token response'a/loga yazılmamalıdır.

### 4.2 Authentication ve authorization

Her korumalı route şu sırayı izlemelidir:

1. `getSessionContextFromHeaders(new Headers(request.headers))`
2. Oturum yoksa `UNAUTHENTICATED`
3. `domainActorFromSession(context)`
4. Owner endpoint'inde `requireOwnerScope(actor)`
5. Portal endpoint'inde `requireClientScope(actor)`
6. Kaynak sorgusunda actor'dan türetilen owner/client scope'u zorunlu filtre olarak kullan

İstemciden gönderilen `role`, `ownerUserId` veya portal tarafında `clientId` hiçbir zaman yetki kaynağı değildir. `X-Neta-*` header'ları yalnız telemetri/uyumluluk bilgisidir, authorization girdisi değildir.

Portal kaynağı başka müşteriye aitse `403` yerine tercihen `404` dönülerek kaynak varlığı gizlenmelidir. Aşağıdaki negatif testler her portal route'u için zorunludur:

- Client A, Client B projesini ID ile okuyamaz.
- Client A query'ye `clientId=B` enjekte ederek scope değiştiremez.
- Client yalnız `isPublicToClient=true` görevleri görür.
- Client yalnız `visibility=portal` proje dosyalarını görür.
- Freelancer portal-only endpoint'ine, client owner endpoint'ine erişemez.
- Disabled profil aktif Better Auth cookie taşısa bile erişemez.

### 4.3 Pagination

Liste yanıtlarının ortak şekli:

```json
{
  "items": [],
  "pageInfo": {
    "hasNextPage": false,
    "nextCursor": null
  }
}
```

Cursor opaque olmalıdır; istemci cursor içeriğine güvenmez. Sıralama kararlı olmalı, tercihen `(updatedAt DESC, id DESC)` veya kaynağa uygun `(createdAt DESC, id DESC)` kullanılmalıdır. Varsayılan limit 20, maksimum limit 100 önerilir. Filtre değişince eski cursor kabul edilmemeli veya filtre hash'i cursora dahil edilmelidir.

### 4.4 Idempotency

Mobil create/complete/AI mutation isteklerinde `Idempotency-Key` gönderiyor. Backend'de şu an bunun kalıcı bir karşılığı görünmüyor.

En az şu endpoint'lerde idempotency zorunludur:

- client/project/task/calendar/finance/chat session oluşturma
- client activity ve portal invitation oluşturma
- task complete
- locale import
- file upload
- portal revision oluşturma
- finance analysis ve project risk gibi maliyetli AI istekleri

Önerilen tablo: `api_idempotency_keys(id, actorUserId, method, routeKey, keyHash, requestHash, status, responseStatus, responseBody, createdAt, expiresAt)`.

Kurallar:

- Ham key loglanmaz; hash saklanır.
- Aynı actor + route + key + aynı request hash önceki cevabı döndürür.
- Aynı key farklı payload ile gelirse `409 CONFLICT`.
- İşlem ve idempotency kaydı mümkün olduğunca aynı transaction'da tamamlanır.
- TTL en az 24 saat önerilir.

### 4.5 Optimistic concurrency

Mobil detail/mutation tiplerinde `version: string | null` bulunuyor. Backend tablolarında ayrı version alanı yok; `updatedAt` kullanılabilir veya monoton integer version migration'ı eklenebilir.

Geçici uyumlu politika:

- Presenter `version = updatedAt.toISOString()` döndürür.
- PATCH/PUT payload'ındaki version mevcut değerden farklıysa `409 CONFLICT`.
- Başarılı mutation yeni version döndürür.
- Version gönderilmemişse ilk release'te mutation kabul edilebilir; daha sonra zorunlu hale getirilecekse API minor capability ile ilan edilmelidir.

### 4.6 Tarih, saat, para ve locale

- Timestamp'ler ISO-8601 UTC string (`2026-07-31T12:34:56.000Z`) olarak dönmeli.
- Business date alanları `YYYY-MM-DD` olmalı.
- Calendar range `from`, `to` ve geçerli IANA `timezone` almalı; sınırlar belirtilen timezone'da hesaplanmalı.
- Para floating-point major unit olarak değil integer `amountMinor` ve uppercase ISO-4217 `currency` ile taşınmalı.
- Finance summary tek currency taşıyor. User preference `defaultCurrency` esas alınmalı; başka currency'ler sessizce toplanmamalı. Ya filtrelenmeli/dönüştürülmeli ya da v1 sözleşmesi genişletilmeden önce `CONFLICT`/ayrı gruplama kararı verilmelidir.
- `Accept-Language` yalnız aktif instance locale'lerinden biri olarak resolve edilmeli; fallback chain response'a eklenmeli.
- Owner mutation'larında `translations: Record<locale, ...>` desteklenmeli ve default locale'in zorunlu alanları doğrulanmalı.

## 5. Mevcut fakat mobil sözleşmeyle uyumsuz endpoint'ler

### 5.1 `GET /api/v1/me`

Mevcut response genel olarak doğru ancak preferences alanı backend'de `{ language, colorMode }`, mobilde `{ locale, colorMode, timezone }` bekleniyor.

Gerekli çıktı:

```json
{
  "ok": true,
  "data": {
    "user": {
      "id": "...",
      "email": "...",
      "displayName": "...",
      "role": "freelancer",
      "clientId": null,
      "disabled": false,
      "preferences": {
        "locale": "tr",
        "colorMode": "system",
        "timezone": "Europe/Istanbul"
      }
    }
  }
}
```

Mobil normalizer top-level `preferences` alanını da kabul ediyor; ancak tek ve kararlı şekil seçilmelidir. Öneri `data.user.preferences`. `getUserPreferences` şu an DB'deki timezone'u seçmiyor; `timezone` ve gerekirse `defaultCurrency` public DTO'ya eklenmelidir.

### 5.2 `PATCH /api/v1/me/preferences`

Mevcut backend body'de `language`, mobil ise `locale` gönderiyor. Mevcut endpoint ayrıca yalnız `{ preferences }` döndürüyor; mobil mutation sonrası tam `MeProfile` bekliyor ve rolü okuyamadığı için cevabı geçersiz sayıyor.

Gerekli değişiklik:

- Body: `{ locale?, colorMode?, timezone? }`
- Geçiş uyumluluğu için `language` alias'ı kabul edilebilir ama response daima `locale` kullanmalı.
- Aktif locale ve IANA timezone doğrulaması yapılmalı.
- Response, `GET /me` ile aynı normalize edilmiş profil DTO'su olmalı.

### 5.3 `GET /api/v1/localization/catalog`

Backend `catalogVersion`, mobil `TranslationCatalog.version` bekliyor. İlk discovery kodu eksik `version` alanında sessizce `0` kullanıyor; uygulama içindeki runtime catalog parser'ı ise endpoint'i reddediyor.

Response en az şu alanları içermeli:

```json
{
  "ok": true,
  "data": {
    "locale": "tr",
    "messages": {},
    "version": 1
  }
}
```

Backward compatibility gerekiyorsa aynı sayı hem `version` hem `catalogVersion` olarak bir geçiş dönemi taşınabilir.

### 5.4 Legacy file ve AI route'ları

Backend'de `/api/files`, `/api/chat`, `/api/project-risk`, `/api/finance-analysis` var; fakat bunlar mobil v1 path/body/response sözleşmelerini karşılamıyor.

- File response `originalName`/`byteSize` ve relative URL döndürüyor; mobil `name`/`sizeBytes`, aynı origin'e ait absolute URL ve `metadataSanitized` bekliyor.
- Mobile multipart alanı `visibility`; legacy route `portalVisible` okuyor.
- Legacy chat AI SDK UI stream döndürüyor; mobil `application/x-ndjson` ve `message.delta` / `message.completed` event'leri bekliyor.
- Legacy risk ve finance analysis yalnız `{ text }` döndürüyor; mobil structured DTO bekliyor.

Legacy web route'ları bozulmadan bırakılabilir. `/api/v1` altında adapter route'ları eklenmelidir.

## 6. Eksik owner API yüzeyi

Bütün path'ler discovery'deki `api.baseUrl = /api/v1` tabanına göredir.

### 6.1 Dashboard

| Method | Path | Query/body | Response data |
| --- | --- | --- | --- |
| GET | `/dashboard/overview` | `range=today|this_week|this_month|this_year` | `OwnerDashboardOverview` |

`OwnerDashboardOverview` iki alan taşır:

- `dashboard`: `generatedAt`, `range`, `stats`, `recentClients`, `recentProjects`
- `analytics`: `generatedAt`, `range`, `chartSummary`, `revenue`, `tasks`, `projects`

Mevcut `DomainService.getFreelancerDashboard`, `getFreelancerAnalytics` ve `resolveDashboardRange` yeniden kullanılmalıdır. Mevcut servis major-unit sayılar ve web'e özel şekiller döndürüyor; presenter bunları `MoneyAmount { amountMinor, currency }` ve mobil stat/chart DTO'larına çevirmelidir.

### 6.2 Clients

| Method | Path | Query/body | Response data |
| --- | --- | --- | --- |
| GET | `/clients` | `search?`, `status?`, `cursor?` | `PaginatedResponse<ClientListItem>` |
| POST | `/clients` | `ClientMutationPayload` | `ClientDetail` |
| GET | `/clients/:id` | — | `ClientDetail` |
| PATCH | `/clients/:id` | `ClientMutationPayload` | `ClientDetail` |
| GET | `/clients/:id/activities` | `cursor?` | `PaginatedResponse<ClientActivity>` |
| POST | `/clients/:id/activities` | `ClientActivityMutationPayload` | `ClientActivity` |
| POST | `/clients/:id/portal-invitations` | `{ email, defaultLocale }` | Güncel `ClientDetail` |

Alan dönüşümleri:

- DB `name` → API `displayName`
- DB `companyName` → API `company`
- DB `pipelineStage` → API `pipelineStatus`
- `projectCount` owner scope içindeki projelerden hesaplanır
- `portalStatus`: `disabled | invited | active | null`; aktif linked auth user ve açık invitation durumundan türetilir
- `translations` `ContentTranslationService` üzerinden taşınır
- Activity'de `activityDate`/`createdAt` politikası netleştirilerek API `createdAt`; `content`/`title` API `note` alanına kayıpsız eşlenir

Mevcut `DomainService` client CRUD ve activity metotları ile `server/auth/invitations.ts` kullanılmalıdır. Legacy `/api/portal-invitations` endpoint'i mobil sözleşme için doğrudan yeterli değildir.

### 6.3 Projects

| Method | Path | Query/body | Response data |
| --- | --- | --- | --- |
| GET | `/projects` | `search?`, `status?`, `clientId?`, `cursor?` | `PaginatedResponse<ProjectListItem>` |
| POST | `/projects` | `ProjectMutationPayload` | `ProjectDetail` |
| GET | `/projects/:id` | — | `ProjectDetail` |
| PATCH | `/projects/:id` | `ProjectMutationPayload` | `ProjectDetail` |
| GET | `/projects/:id/planning-sections` | `cursor?` | `PaginatedResponse<PlanningSection>` |
| GET | `/projects/:id/revisions` | `cursor?` | `PaginatedResponse<ProjectRevision>` |
| GET | `/projects/:id/assets` | `cursor?` | `PaginatedResponse<FileAsset>`; yalnız project asset item'ları |
| DELETE | `/projects/:id/assets/:assetId` | — | `DeleteResult` |

Alan dönüşümleri:

- DB `name` → API `title`
- Client join → `clientName`
- DB `revisionQuota` → `revisionAllowance`
- `revisionsUsed` ilgili project revision count'tan
- Planning `sortOrder` → `order`
- Detail ve mutation translation'ları content translation servisi üzerinden
- Project asset URL'leri absolute ve aynı instance origin'inde

Mobil proje tamamlama için ayrı route çağırmıyor; `PATCH` ile `status=completed` gönderiyor.

### 6.4 Tasks

| Method | Path | Query/body | Response data |
| --- | --- | --- | --- |
| GET | `/tasks` | `cursor?`, `search?`, `status?`, `priority?`, `projectId?`, `clientId?`, `from?`, `to?` | `PaginatedResponse<TaskListItem>` |
| POST | `/tasks` | `TaskMutationPayload` | `TaskDetail` |
| GET | `/tasks/:id` | — | `TaskDetail` |
| PATCH | `/tasks/:id` | tam payload veya `{ status, position?, version? }` | `TaskDetail` |
| POST | `/tasks/:id/complete` | `{ version? }` | `TaskDetail` |
| DELETE | `/tasks/:id` | — | `DeleteResult` |

Presenter `clientName`, `projectName`, localized `title`, timestamps ve `version` eklemelidir. `/complete` idempotent olmalı; zaten `done` olan task aynı güncel DTO ile başarılı dönebilir.

### 6.5 Calendar

| Method | Path | Query/body | Response data |
| --- | --- | --- | --- |
| GET | `/calendar/events` | zorunlu `from`, `to`, `timezone` | `CalendarRangeResponse` |
| POST | `/calendar/events` | `CalendarEventMutationPayload` | `CalendarEventDetail` |
| GET | `/calendar/events/:id` | — | `CalendarEventDetail` |
| PATCH | `/calendar/events/:id` | `CalendarEventMutationPayload` | `CalendarEventDetail` |
| DELETE | `/calendar/events/:id` | — | `DeleteResult` |

Range yanıtı gerçek event'lere ek olarak task/finance kaynaklı read-only öğeler sunacaksa:

- gerçek event: `source=calendar`, `readOnly=false`
- task projection: `source=task`, `readOnly=true`, `taskId` dolu
- finance projection: `source=finance`, `readOnly=true`

Synthetic öğelerin ID'leri kaynak tipiyle namespace edilmelidir (`task:<id>` gibi). Detail/mutation route'ları read-only synthetic kaynağı değiştirmemelidir.

### 6.6 Finance

| Method | Path | Query/body | Response data |
| --- | --- | --- | --- |
| GET | `/finance/summary` | `month=YYYY-MM` | `FinanceSummary` |
| GET | `/finance/transactions` | `cursor?`, `search?`, `month?`, `kind?`, `paymentStatus?`, `projectId?`, `clientId?` | `PaginatedResponse<FinanceTransactionListItem>` |
| POST | `/finance/transactions` | `FinanceTransactionMutationPayload` | `FinanceTransactionDetail` |
| GET | `/finance/transactions/:id` | — | `FinanceTransactionDetail` |
| PATCH | `/finance/transactions/:id` | `FinanceTransactionMutationPayload` | `FinanceTransactionDetail` |
| DELETE | `/finance/transactions/:id` | — | `DeleteResult` |
| POST | `/finance/analysis` | `{ month }` | `FinanceAnalysis` |

Alan dönüşümleri: DB `type` → API `kind`, `transactionDate` → `date`, `amountMinor+currency` → `amount`, relation join'leri → client/project name. Summary cancelled kayıtları hariç tutmalı; income/expense/net/pending tanımları test fixture'larıyla sabitlenmelidir.

AI analysis response:

```ts
{
  disclaimer: string | null;
  generatedAt: string;
  recommendations: string[];
  summary: string;
}
```

Modelden serbest metin alıp sahte structured veri üretmek yerine structured output doğrulaması kullanılmalıdır. Provider secret veya prompt response'a eklenmemelidir.

### 6.7 Journal

| Method | Path | Query/body | Response data |
| --- | --- | --- | --- |
| GET | `/journal/entries` | `from=YYYY-MM-DD&to=YYYY-MM-DD` | `JournalRangeResponse` |
| PUT | `/journal/entries/:date` | `JournalEntryMutationPayload` | `JournalEntryDetail` |
| GET | `/journal/entries/:id` | — | `JournalEntryDetail` |
| PATCH | `/journal/entries/:id` | `JournalEntryMutationPayload` | `JournalEntryDetail` |
| DELETE | `/journal/entries/:id` | — | `DeleteResult` |

`PUT /:date` owner+date unique constraint'i üzerinde atomik upsert olmalıdır. DB `moodScore`, `energyScore`, `workSatisfactionScore` alanları API `mood`, `energy`, `satisfaction` alanlarına çevrilir. Translation payload `moodLabel` ve `note` alanlarını içerir.

### 6.8 Chat ve project risk

| Method | Path | Query/body | Response data |
| --- | --- | --- | --- |
| GET | `/chat/sessions` | `cursor?` | `PaginatedResponse<ChatSession>` |
| POST | `/chat/sessions` | `{ title?: string|null }` | `ChatSession` |
| DELETE | `/chat/sessions/:id` | — | `DeleteResult` |
| GET | `/chat/sessions/:id/messages` | `cursor?` | `PaginatedResponse<ChatMessage>` |
| POST | `/chat/sessions/:id/messages` | `{ content, sourceLocale }` | NDJSON stream |
| POST | `/projects/:id/risk-analysis` | `{}` | `ProjectRiskAnalysis` |

Chat stream header'ı `Content-Type: application/x-ndjson` olmalı ve her satır tam bir JSON event olmalıdır:

```json
{"type":"message.delta","delta":"Merhaba"}
{"type":"message.completed","message":{"id":"...","role":"assistant","content":"Merhaba","sourceLocale":"tr","createdAt":"..."}}
```

Hata event'i yalnız şu kararlı kodları taşımalı: `UPSTREAM_ERROR`, `UPSTREAM_TIMEOUT`, `SERVICE_UNAVAILABLE`. HTTP response stream başlamadan hata oluştuysa uygun 4xx/5xx JSON zarfı; stream başladıktan sonra hata oluştuysa NDJSON error event'i kullanılmalıdır. Client disconnect `AbortSignal` provider çağrısını iptal etmelidir.

`ChatSession.lastMessagePreview` son user/assistant mesajından, `updatedAt` session satırından türetilir. System/tool mesajları depolanabilir ancak mobil liste parser'ı yalnız user/assistant konuşmasını gösterir.

## 7. Eksik settings ve locale API yüzeyi

### 7.1 Kullanıcı ve session ayarları

| Method | Path | Body | Response data |
| --- | --- | --- | --- |
| PATCH | `/me/profile` | `{ name }` | normalize `MeProfile` |
| PATCH | `/me/preferences` | `{ locale?, colorMode?, timezone? }` | normalize `MeProfile` |
| POST | `/me/password` | `{ currentPassword, newPassword, revokeOtherSessions? }` | `DeleteResult` |
| GET | `/me/sessions` | — | `AuthSessionInfo[]` |
| DELETE | `/me/sessions/:id` | — | `DeleteResult` |
| DELETE | `/me/sessions` | — | `DeleteResult` |

Better Auth servis API'ları mevcut web action'larındaki gibi yeniden kullanılmalıdır. Session DTO hiçbir token/cookie değeri içermez. `deviceLabel`, `createdAt`, `lastActiveAt`, `current` döner. Kullanıcı kendi mevcut session'ını revoke ederse response tamamlandıktan sonra cookie invalid olmalıdır.

`DeleteResult` her yerde `{ deleted: boolean, id: string }` biçimindedir; 204 empty body mobil parser'ıyla uyumlu değildir.

### 7.2 General, appearance ve AI settings

| Method | Path | Body | Response data |
| --- | --- | --- | --- |
| GET | `/settings/general` | — | `GeneralSettings` |
| PATCH | `/settings/general` | `GeneralSettings` | `GeneralSettings` |
| GET | `/settings/appearance` | — | `AppearanceSettings` |
| PATCH | `/settings/appearance` | `AppearanceMutationPayload` | `AppearanceSettings` |
| POST | `/settings/appearance/assets` | multipart `kind`, `file` | `AppearanceAsset` |
| DELETE | `/settings/appearance/assets/:kind` | — | `DeleteResult` |
| GET | `/settings/ai` | — | `AiSettings` |
| PATCH | `/settings/ai` | `AiSettingsMutationPayload` | `AiSettings` |

General mapping:

- `workspaceName`: branding organization/application name
- `companyName`: organization name veya ayrı kabul edilmiş semantik; tek karar verilerek web ile uyumlu tutulmalı
- `portalFooter`: default locale `branding.portalFooter` translation'ı

Appearance URL'leri absolute olmalıdır. `accentColor`, `primaryColor`, `defaultColorMode`, `radiusScale` eksiksiz dönmelidir.

AI response secret-safe olmalıdır:

```ts
{
  configured: boolean;
  maskedKey: string | null;
  model: string | null;
  provider: 'gemini' | 'openai' | 'groq' | 'ollama' | null;
}
```

Mevcut `PublicAiSettings.hasApiKey`, API `configured` alanına eşlenebilir. Gerçek key hiçbir GET response'unda dönmez. `maskedKey` gerçek secret'ın parçalarını açığa çıkarmak zorunda değildir; `••••••••` gibi sabit değer yeterlidir. Provider değişiminde yeni key gereksinimi mevcut servis politikasıyla korunmalıdır. `currentPassword` ile step-up doğrulaması uygulanacaksa Better Auth password verification kullanılmalı ve key loglanmamalıdır.

### 7.3 Locale yönetimi

| Method | Path | Body/query | Response data |
| --- | --- | --- | --- |
| GET | `/settings/locales` | — | `LocaleDefinition[]` |
| POST | `/settings/locales` | `{ code, name, fallbackLocale?, textDirection, status }` | `LocaleDefinition` |
| PATCH | `/settings/locales/:code` | `LocaleMutationPayload` | `LocaleDefinition` |
| GET | `/settings/locales/:code/translations` | — | `TranslationCatalog` |
| PUT | `/settings/locales/:code/translations` | `{ messages, version }` | `TranslationCatalog` |
| POST | `/settings/locales/import` | `TranslationCatalog` | `TranslationCatalog` |
| GET | `/settings/locales/export?locale=:code` | — | `TranslationCatalog` |

`LocaleDefinition` alanları: `code`, `completion`, `fallbackLocale`, `isDefault`, `textDirection`, `name`, `status`, `updatedAt`. Backend ayrıca `nativeName` tutuyor; v1 DTO'ya ek alan olarak verilebilir ama zorunlu mobil alanların hiçbiri eksik olamaz.

Translation version optimistic concurrency için kullanılmalı. Stale `version` ile PUT `409 CONFLICT` döndürmelidir. Import mevcut `I18nService.importPackage` formatı ile mobil `TranslationCatalog` arasına açık adapter koymalıdır; formatlar aynı varsayılmamalıdır.

## 8. Eksik file API yüzeyi ve güvenlik gereksinimi

| Method | Path | Body | Response data |
| --- | --- | --- | --- |
| POST | `/files` | multipart `file`, `kind`, `visibility`, `projectId?`, `originalName?` | `FileAsset` |
| GET | `/projects/:projectId/assets` | `cursor?` | `PaginatedResponse<FileAsset>` |
| DELETE | `/projects/:projectId/assets/:assetId` | — | `DeleteResult` |
| GET | asset URL | — | binary, yetki kontrollü |

`FileAsset`:

```ts
{
  id: string;
  kind: 'avatar' | 'branding_logo' | 'branding_icon' | 'project_asset';
  visibility: 'private' | 'portal' | 'public_branding';
  metadataSanitized: boolean;
  mimeType: string;
  name: string;
  projectId: string | null;
  sizeBytes: number;
  url: string;
  createdAt: string;
}
```

Mevcut file policy magic-byte ve MIME doğruluyor ama görsel metadata'sını gerçekten temizlemiyor. Mobil güvenlik guard'ı görsellerde `metadataSanitized=true` bekliyor. Bu alan yalnız gerçekten EXIF/XMP/IPTC/yorum metadata'sı silinmiş ve yeniden encode edilmiş dosyada `true` olmalıdır. Sadece boolean ekleyerek güvenlik iddiasında bulunulmamalıdır.

Ek kurallar:

- Avatar/branding logo en fazla 5 MB, branding icon en fazla 1 MB, project asset en fazla 10 MB; boş dosya yasak.
- Avatar/branding için PNG, JPEG ve WebP; project asset için bunlara ek olarak PDF desteklenir. Backend'in mevcut yalnız-görsel/5 MB politikası mobil sözleşme için yetersizdir.
- PDF magic-byte ve yapısal parse ile doğrulanmalı; inline gösterimde güvenli `Content-Disposition` ve `X-Content-Type-Options: nosniff` kullanılmalıdır.
- Dönen `name` boş olamaz ve en fazla 160 karakter olmalıdır.
- Filename normalize edilir; path traversal engellenir.
- MIME yalnız header'a göre değil magic-byte/decode ile doğrulanır.
- URL absolute ve instance origin'ine bağlıdır.
- Private dosya URL'si oturumsuz okunamaz.
- Portal dosyası yalnız projeye bağlı client tarafından okunabilir.
- Branding public olabilir fakat upload/delete yalnız owner.
- Project asset upload'da `kind`, `projectId` ve `visibility` kombinasyonu server tarafından doğrulanır; client isteği authority değildir.
- DB kaydı ile fiziksel dosya oluşturma/silme rollback davranışı mevcut `FileService` güvenlik modelini korumalıdır.

## 9. Eksik client portal API yüzeyi

Portal route'ları `clientId` parametresi kabul etmez; scope yalnız session profilinden türetilir.

| Method | Path | Query/body | Response data |
| --- | --- | --- | --- |
| GET | `/portal/dashboard` | — | `PortalDashboard` |
| GET | `/portal/projects` | `cursor?` | `PortalLocalizedPage<PortalProjectSummary>` |
| GET | `/portal/projects/:id` | — | `PortalProjectDetail` |
| GET | `/portal/tasks` | `cursor?`, `projectId?`, `status?` | `PortalLocalizedPage<PortalTask>` |
| GET | `/portal/revisions` | `cursor?`, `projectId?`, `status?` | `PortalLocalizedPage<PortalRevision>` |
| POST | `/portal/projects/:id/revisions` | `{ description, sourceLocale }` | `PortalRevision` |
| GET | `/portal/profile` | — | `PortalProfile` |
| PATCH | `/portal/profile` | `{ name }` | `PortalProfile` |

Portal list response'larında `locale` ve `fallbackChain` zorunludur. Project detail şu bileşimi tek response'ta döndürür:

- localized project resource
- planning sections
- yalnız public tasks
- yalnız portal-visible assets
- revisions
- revision allowance (`allowed`, `used`, `remaining`, `canRequest`)

Mevcut `DomainService.listProjects/getProject/listTasks/listPlanningSections/listPortalRevisions/getRevisionAllowance/requestRevision`, `ContentTranslationService` ve `FileService` kullanılabilir. Ancak her alt listenin aynı client-owned project scope'unda olduğu presenter öncesi doğrulanmalıdır.

Revision oluşturma:

- Project session client'ına ait değilse `404`.
- Allowance dolmuşsa `409 CONFLICT`.
- `sourceLocale` aktif/destekli locale olmalı.
- Kullanıcı metni makine çevirisiyle değiştirilmeden saklanmalı.
- `Idempotency-Key` uygulanmalı.

## 10. Domain katmanında gerçekten eksik altyapı

Route eklemek tek başına yeterli değildir. İncelemede şu backend altyapı boşlukları görüldü:

1. **API presenter/DTO katmanı yok.** Domain/DB alanları mobil alan adlarıyla aynı değil.
2. **Genel cursor pagination yok.** Domain list metotları çoğunlukla bütün satırları döndürüyor.
3. **Idempotency deposu yok.** Mobil key gönderiyor fakat server dedup etmiyor.
4. **Optimistic concurrency yok.** Mobil version taşıyor; DB yalnız `updatedAt` tutuyor.
5. **v1 input schema seti yok.** Web FormData validation'ı JSON API payload'ı için tekrar kullanılamaz; shared domain schema'larının üzerine API-specific strict Zod şemaları gerekir.
6. **Contract testleri yok.** Discovery capability ile route gerçekliği arasında drift oluşmuş.
7. **File metadata sanitization yok.** Magic-byte kontrolü sanitization değildir.
8. **Mobil NDJSON chat adapter'ı yok.** Mevcut web AI SDK stream formatı farklı.
9. **Finance multi-currency summary politikası kararsız.** Tek MoneyAmount contract'ı ile çoklu currency DB modeli arasında açık karar gerekir.
10. **Preference DTO'su eksik.** DB timezone/defaultCurrency tutuyor fakat service public DTO yalnız language/colorMode döndürüyor.

İyi haber: CRUD iş kurallarının çoğu `DomainService`, repository'ler ve web actions içinde mevcut. Backend agent'ı aynı iş kuralını route içinde kopyalamamalı; JSON input doğrulayıp mevcut servisi çağırmalı, ardından presenter ile wire DTO üretmelidir. Gerekli filtre/pagination/concurrency davranışı domain/repository katmanına eklenmelidir.

## 11. Önerilen backend klasör yapısı

```text
app/api/v1/
  dashboard/overview/route.ts
  clients/route.ts
  clients/[id]/route.ts
  clients/[id]/activities/route.ts
  clients/[id]/portal-invitations/route.ts
  projects/route.ts
  projects/[id]/route.ts
  projects/[id]/planning-sections/route.ts
  projects/[id]/revisions/route.ts
  projects/[id]/assets/route.ts
  projects/[id]/assets/[assetId]/route.ts
  projects/[id]/risk-analysis/route.ts
  tasks/route.ts
  tasks/[id]/route.ts
  tasks/[id]/complete/route.ts
  calendar/events/route.ts
  calendar/events/[id]/route.ts
  finance/summary/route.ts
  finance/transactions/route.ts
  finance/transactions/[id]/route.ts
  finance/analysis/route.ts
  journal/entries/route.ts
  journal/entries/[id]/route.ts
  chat/sessions/route.ts
  chat/sessions/[id]/route.ts
  chat/sessions/[id]/messages/route.ts
  me/profile/route.ts
  me/password/route.ts
  me/sessions/route.ts
  me/sessions/[id]/route.ts
  settings/general/route.ts
  settings/appearance/route.ts
  settings/appearance/assets/route.ts
  settings/appearance/assets/[kind]/route.ts
  settings/ai/route.ts
  settings/locales/route.ts
  settings/locales/[code]/route.ts
  settings/locales/[code]/translations/route.ts
  settings/locales/import/route.ts
  settings/locales/export/route.ts
  files/route.ts
  portal/dashboard/route.ts
  portal/projects/route.ts
  portal/projects/[id]/route.ts
  portal/projects/[id]/revisions/route.ts
  portal/tasks/route.ts
  portal/revisions/route.ts
  portal/profile/route.ts

server/api/v1/
  auth.ts
  body.ts
  pagination.ts
  idempotency.ts
  schemas/
  presenters/
  responses.ts
```

Route handler'ları ince kalmalıdır: auth → parse → service → presenter → v1 response.

## 12. Uygulama sırası

### P0 — Protokol doğruluğu ve login sonrası ilk ekran

1. Yanlış capability ilanlarını düzelt.
2. `/me`, `/me/preferences`, catalog `version` uyumsuzluklarını düzelt.
3. Ortak auth helper, JSON body parser, response/error ve JSON 404 fallback ekle.
4. `GET /dashboard/overview` ekle.
5. Canlı demo smoke testinde login → me → dashboard akışını geçir.

Bu aşama tamamlandığında owner kullanıcı girişten sonra boş/404 dashboard görmemelidir.

### P1 — Ana bottom navigation kaynakları

1. Clients API
2. Projects API
3. Tasks API
4. Ortak presenter, cursor pagination, version ve idempotency altyapısı

Bu aşama mobilin ana linklerini kullanılabilir yapar.

### P2 — Diğer owner modülleri

1. Calendar
2. Finance
3. Journal
4. Settings/profile/security/sessions
5. Locale yönetimi
6. Files ve appearance assets

### P3 — Portal ve AI

1. Portal dashboard/projects/tasks/revisions/profile
2. Chat sessions/messages NDJSON
3. Project risk ve finance analysis structured output
4. Portal cross-client güvenlik matrisi ve AI failure/abort testleri

Capability'ler her aşamada yalnız o aşamanın acceptance testleri production build'de geçtikten sonra `available` yapılmalıdır.

## 13. Test ve kalite kapıları

### 13.1 Contract testleri

Her endpoint için:

- Success response mobildeki ilgili `is*` guard'ını geçer.
- Error response `ApiFailure` şeklindedir.
- Timestamp/nullable/enum alanları fixture ile doğrulanır.
- Empty list, tek sayfa ve çok sayfalı cursor senaryoları bulunur.
- Mutation response tekrar GET edildiğinde aynı wire shape korunur.

Özellikle şu mevcut uyumsuzluklar için regression testi yazılmalıdır:

- `/me/preferences` response'unda role/profile kaybolmuyor.
- `locale` body alanı backend `language` storage alanına doğru eşleniyor.
- Catalog response `version` taşıyor.
- Missing v1 route HTML değil JSON 404 döndürüyor.
- File URL absolute; field'lar `name` ve `sizeBytes`.
- Delete response empty 204 değil `DeleteResult`.

### 13.2 Authorization matrisi

Her resource için en az:

- oturumsuz → 401
- yanlış role → 403
- doğru role + başka owner/client ID → 404
- disabled actor → 403
- doğru actor → 2xx

### 13.3 Mutation güvenilirliği

- Aynı idempotency key + aynı payload → tek DB kaydı, aynı response.
- Aynı key + farklı payload → 409.
- Stale version → 409 ve kayıt değişmez.
- Validation error → side effect yok.
- Concurrent task complete/journal upsert → duplicate yok.

### 13.4 File güvenliği

- MIME spoof, polyglot/truncated image, path traversal filename reddedilir.
- EXIF GPS içeren fixture upload sonrası metadata taşımıyor.
- Cross-client portal file GET reddedilir.
- DB veya disk failure'da orphan dosya oluşmaz.
- Deleted file okunamaz ve response secret/path sızdırmaz.

### 13.5 Canlı smoke senaryoları

Owner:

1. Discovery → health → meta
2. Better Auth email login
3. `/me`
4. dashboard
5. client oluştur/güncelle/activity/invite
6. project oluştur
7. task oluştur/tamamla
8. calendar ve journal mutation
9. finance transaction + summary
10. settings/preferences update
11. file upload/list/delete
12. logout ve eski cookie ile 401

Client:

1. invitation kabulü sonrası login
2. portal dashboard
3. yalnız kendi project/task/assets
4. revision create
5. profile/preferences update
6. başka client ID'leriyle bütün negatif denemeler

## 14. Definition of Done

Backend işi ancak aşağıdakilerin tamamı sağlanırsa bitmiş kabul edilir:

- [ ] Discovery/meta gerçekte bulunmayan hiçbir capability'yi `available` ilan etmiyor.
- [ ] Bu dokümandaki production kapsamlı endpoint'ler `/api/v1` altında mevcut.
- [ ] Bütün JSON endpoint'leri `{ ok, data|error }` zarfını ve `X-Neta-API-Version: 1` header'ını kullanıyor.
- [ ] `/api/v1/**` altında HTML 404/500 response yok.
- [ ] Mobile `@neta/api-contracts` runtime guard'ları bütün success fixture'larını kabul ediyor.
- [ ] Owner ve client scope testleri, cross-tenant negatif testler dahil, geçiyor.
- [ ] Cursor pagination, idempotency ve optimistic concurrency testleri geçiyor.
- [ ] Cookie/token/AI key/raw idempotency key loglarda ve response'larda yok.
- [ ] File metadata gerçekten sanitize ediliyor ve güvenlik testleri geçiyor.
- [ ] Chat endpoint'i mobilin beklediği NDJSON protokolünü ve abort davranışını sağlıyor.
- [ ] Demo deployment üzerinde owner ve portal smoke testleri geçiyor.
- [ ] Capability'ler ancak ilgili smoke/contract testleri geçtikten sonra `available`.
- [ ] `neta-mobile` tarafında endpoint veya DTO workaround'u gerekmiyor.

## 15. Backend agent'ına verilecek kısa görev metni

Aşağıdaki metin, bu dosyayla birlikte backend agent'ına atanabilir:

> `apps/neta-app` backend'ini `apps/neta-mobile` ile production uyumlu hale getir. Ayrıntılı gereksinim ve endpoint matrisi için `docs/neta-backend-mobile-api-gap-and-implementation-brief.md` dosyasını tek doğruluk kaynağı olarak kullan; wire DTO'ları için `packages/api-contracts/src/index.ts` guard'larını birebir karşıla. Mevcut web Server Action iş kurallarını route içinde kopyalama: `DomainService`, repository'ler, `I18nService`, `FileService`, Better Auth ve actor-scope guard'larını kullan; ince `/api/v1` route + Zod schema + presenter katmanı oluştur. Önce yanlış capability ilanını ve `/me`/preferences/catalog uyumsuzluklarını düzelt, sonra P0→P3 sırasını uygula. Bütün v1 yanıtları JSON envelope olmalı; owner/client isolation, pagination, idempotency, optimistic concurrency, secret redaction, gerçek image metadata sanitization ve NDJSON chat testlerini ekle. Capability'leri yalnız ilgili contract ve canlı smoke testleri geçince `available` yap. Legacy web route'larını ve mevcut web davranışını bozma.

## 16. İncelemede kullanılan backend kaynakları

Bu teşhis aşağıdaki mevcut Neta kaynaklarının salt-okunur incelenmesine dayanır:

- `server/api/v1/contracts.ts`, `runtime.ts`, `responses.ts`
- `app/api/v1/**/route.ts`
- `app/api/auth/[...all]/route.ts`
- `server/auth/auth.ts`, `session.ts`, `domain-actor.ts`
- `server/services/domain.ts`, `analytics-range.ts`
- `server/repositories/*`
- `server/db/schema/domain.ts`, `storage.ts`, `settings.ts`, `i18n.ts`, `auth.ts`
- `server/files/service.ts`, `policy.ts`
- `server/i18n/service.ts`, `content.ts`, `catalog.ts`
- `server/settings/preferences.ts`, `ai.ts`
- `app/(dashboard)/**/actions.ts`
- `app/portal/**/actions.ts`
- legacy `app/api/files`, `app/api/chat`, `app/api/project-risk`, `app/api/finance-analysis`

Kardeş `neta` repository'sinde bu inceleme sırasında değişiklik yapılmamıştır.
