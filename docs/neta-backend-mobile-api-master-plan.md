---
title: Neta Backend Mobil API Ana Uygulama Planı
description: Neta web/backend ile React Native mobil istemci arasındaki API boşluklarını kapatmak için doğrulanmış, fazlı ve test kapılı uygulama planı.
status: planned
current_phase: phase-0
last_updated: 2026-08-02
owners:
  - backend-api
  - mobile
  - security
related_documents:
  - neta-backend-mobile-api-gap-and-implementation-brief.md
  - self-hosted-redesign/neta-react-native-mobile-master-plan.md
  - self-hosted-redesign/phase-9-mobile-api.md
  - self-hosted-redesign/adr-0018-device-pairing.md
---

# Neta Backend Mobil API Ana Uygulama Planı

## 1. Amaç

Neta; freelancer ve küçük stüdyoların müşteri, proje, görev, takvim, finans,
günlük, dosya, ayar ve AI süreçlerini kendi self-hosted instance'larında
yönetebildiği; müşterilerine de izole bir portal hesabı açabildiği bir sistemdir.

React Native mobil uygulama ayrı bir merkezi backend kullanmaz. Kullanıcı bir
domain girer, mobil uygulama o Neta instance'ını keşfeder, aynı Better Auth
hesabıyla oturum açar ve rolüne göre freelancer veya müşteri portalı API'lerini
kullanır. Bu nedenle bu planın amacı mevcut web Server Action'larını mobilde
taklit etmek değil, aynı domain servislerini kullanan güvenli ve sürümlü bir
`/api/v1` taşıma katmanı oluşturmaktır.

Bu doküman aşağıdaki iki codebase'in 2 Ağustos 2026 tarihli hali karşılaştırılarak
hazırlanmıştır:

- Backend/web: `neta`
- Mobil istemci ve wire guard'ları: `neta-mobile`

Mobil wire contract için kanonik kaynak:

```text
packages/api-contracts/src/index.ts
```

Mobil çağrı noktaları için kanonik kaynak:

```text
apps/neta-mobile/src/features/*/api.ts
```

## 2. Karar: neden tek seferde uygulanmayacak?

Brif tek bir bug değil; yaklaşık elli route, yeni DB altyapısı, bütün domainler
için presenter ve input şemaları, cursor pagination, idempotency, optimistic
concurrency, dosya metadata temizliği, NDJSON streaming ve portal tenant
izolasyonunu birlikte kapsıyor.

Hepsini tek değişiklikte uygulamak şu riskleri oluşturur:

- Mevcut çalışan web Server Action'larında regresyonu izole etmek zorlaşır.
- Capability ilanı ile gerçek route kapsamı tekrar ayrışabilir.
- Migration, idempotency ve dosya rollback davranışı yeterince sınanmadan canlıya
  çıkabilir.
- Portal cross-client veri sızıntısı gibi güvenlik hataları büyük bir diff içinde
  gözden kaçabilir.
- Mobil runtime guard'larının hangi presenter değişikliğinde kırıldığı tespit
  edilemez.

Bu nedenle teslimat aşağıdaki fazlara ayrılmıştır. Her faz kendi contract,
authorization ve smoke testleri geçmeden tamamlanmış sayılmaz.

## 3. Doğrulanmış mevcut durum

### 3.1 Gerçekte bulunan `/api/v1` yüzeyi

Backend'de yalnız şu route dosyaları vardır:

- `GET /api/v1/health`
- `GET /api/v1/meta`
- `GET /api/v1/me`
- `PATCH /api/v1/me/preferences`
- `GET /api/v1/localization/catalog`

Discovery ayrıca `GET /.well-known/neta` üzerinden sunulur. Dashboard, client,
project, task, calendar, finance, journal, chat, settings, files ve portal mobil
route'ları yoktur. Next.js eksik route'larda mobilin beklediği v1 hata zarfı
yerine HTML 404 döndürür.

### 3.2 Kesin sözleşme uyumsuzlukları

#### `/api/v1/me`

Backend şu anda tercihleri `data.preferences.language` şeklinde döndürüyor.
Mobil normalizer `data.user.preferences.locale` veya en azından
`data.preferences.locale` bekliyor. DB'de mevcut olmasına rağmen timezone service
DTO'suna seçilmiyor. `disabled` da public profil DTO'sunda açıkça dönmüyor.

#### `/api/v1/me/preferences`

Backend body'de `language` kabul ediyor; mobil `locale` gönderiyor. Backend yalnız
`{ preferences }` döndürüyor; mobil mutation parser'ı tam bir `MeProfile` bekliyor
ve response içinde rol bulamayınca yanıtı geçersiz kabul ediyor.

#### `/api/v1/localization/catalog`

Backend yalnız `catalogVersion` döndürüyor. Mobil `TranslationCatalog` runtime
guard'ı `version` bekliyor. Discovery bootstrap kodu eksik version için `0`
fallback kullansa da uygulama içi localization API parser'ı aynı yanıtı reddeder.

#### Project asset listesi

Mobilde aynı endpoint için iki uyumsuz parser vardır:

- `features/projects/api.ts`: `PaginatedResponse<ProjectAsset>`
- `features/files/api.ts`: `FileAsset[]`

Backend tek response ile ikisini aynı anda karşılayamaz. Kanonik v1 şekli
`PaginatedResponse<FileAsset>` olacaktır. Mobilde `features/files/api.ts`
pagination zarfını okuyacak şekilde ayrı bir takip değişikliği gerektirir.

### 3.3 Capability konusunda güncel gerçek

Backend şu broad capability'leri `available` ilan ediyor:

- `mobile-v1`
- `files.local`
- `freelancer.core`
- `portal.client`
- `ai.assistant`

Fakat karşılık gelen v1 resource API'leri mevcut değildir. Bu ilanlar route
hazırlığını yansıtmıyor.

Önemli güncel ayrıntı: mobilin mevcut `discovery.ts` dosyası capability varlığını
artık bağlantı önkoşulu olarak doğrulamıyor. Listeyi saklıyor fakat ekran/resource
gating için kullanmıyor. Dolayısıyla bugünkü HTML 404'lerin doğrudan sebebi
capability kontrolü değil, route'ların gerçekten eksik olmasıdır.

Mevcut `phase-9-mobile-api.md`, `mobile-v1` değerini yalnız discovery, metadata,
health, localization ve session bootstrap sözleşmesi olarak tanımlıyor. Gap brifi
ise bunu bütün production mobil yüzeyi olarak yorumluyor. Faz 0'da bu semantik
tek anlamda dondurulmadan capability yayınlanmayacaktır.

### 3.4 Backend'de yeniden kullanılabilecek altyapı

Şunlar yeniden yazılmayacak, API katmanından çağrılacaktır:

- `DomainService`: ana CRUD ve scope iş kuralları
- Domain repository'leri: SQLite/Drizzle erişimi
- `ContentTranslationService`: dinamik içerik çevirileri
- `I18nService`: locale ve katalog yönetimi
- `FileService`: sahiplik, fiziksel dosya ve DB koordinasyonu
- Better Auth ve session yardımcıları
- `domainActorFromSession`, `requireOwnerScope`, `requireClientScope`
- Branding, preferences ve AI settings servisleri
- Dashboard/analytics range çözümleyicileri

### 3.5 Gerçek altyapı boşlukları

- Mobil DTO/presenter katmanı yok.
- API'ye özel strict Zod input şemaları yok.
- Genel opaque cursor pagination yok.
- Kalıcı idempotency tablosu ve yürütücüsü yok.
- Mobilin taşıdığı `version` için concurrency kontrolü yok.
- V1 route/capability consumer contract testleri yok.
- Görsel metadata gerçekten temizlenmiyor.
- Mobil NDJSON chat adapter'ı yok.
- Tek para birimli summary ile çok para birimli kayıtların politikası sabit değil.
- Eksik v1 route'lar için JSON fallback yok.

### 3.6 Brifte düzeltilmesi gereken iki teknik çelişki

1. Brif bütün korumalı route'larda mevcut
   `getSessionContextFromHeaders` helper'ını zorunlu tutarken disabled actor için
   `403` ister. Mevcut helper disabled profili `null` yapar; bu nedenle doğal sonuç
   `401` olur. Faz 0'da ya güvenli politika olarak `401` kabul edilecek ya da API'ye
   özel session loader ile geçerli session + disabled profile ayrıştırılacaktır.
2. Broad capability'ler mobilde bugün feature gate edilmez. Yalnız backend'e
   granular capability eklemek yeterli değildir; mobil shell de bu capability'lere
   göre ekranları açıp kapatmalıdır. Backend rollout'u sırasında eksik endpoint
   hatası yine kullanıcıya kontrollü gösterilecektir.

## 4. Değişmez mimari kurallar

- Route akışı: `auth -> parse -> service -> presenter -> response`.
- Route içinde Drizzle sorgusu yalnız API'ye özgü projection zorunluysa yapılır;
  domain kuralı kopyalanmaz.
- Ham DB satırı response'a verilmez.
- Bütün JSON başarıları `{ ok: true, data }` zarfındadır.
- Bütün JSON hataları `{ ok: false, error }` zarfındadır.
- Bütün v1 yanıtları `X-Neta-API-Version: 1` taşır.
- Owner/client scope request body veya query'den değil session actor'dan türetilir.
- Başka tenant'a ait kaynak tercihen `404` ile gizlenir.
- Liste sıralaması deterministik, cursor opaque ve limit üst sınırı 100'dür.
- Timestamp UTC ISO-8601, business date `YYYY-MM-DD`, para integer minor unit'tir.
- `Idempotency-Key`, authorization kaynağı değildir ve ham hali loglanmaz.
- Secret, cookie, token, SQL, filesystem path veya provider key response'a girmez.
- Legacy web route'ları ve Server Action davranışı korunur.
- Capability ancak ilgili route grubunun contract ve authorization testleri
  geçince `available` olur.

## 5. Hedef klasör yapısı

```text
app/api/v1/
  [...path]/route.ts
  dashboard/overview/route.ts
  clients/**/route.ts
  projects/**/route.ts
  tasks/**/route.ts
  calendar/**/route.ts
  finance/**/route.ts
  journal/**/route.ts
  chat/**/route.ts
  me/**/route.ts
  settings/**/route.ts
  files/route.ts
  portal/**/route.ts

server/api/v1/
  auth.ts
  body.ts
  capabilities.ts
  concurrency.ts
  idempotency.ts
  pagination.ts
  responses.ts
  schemas/
  presenters/
  services/
```

`server/api/v1/services` yalnız birden fazla domain servisini bir response için
orkestre eden application service'leri içerir. Domain kuralları burada yeniden
yazılmaz.

## 6. Faz planı

### Faz 0 — Contract freeze ve karar kaydı

Amaç: Backend ve mobilin aynı endpoint, alan ve capability anlamına baktığını
kanıtlamak.

- [ ] Mobil `api-contracts` tipleri backend planına sabit fixture olarak aktarılacak.
- [ ] Her mobil API çağrısı method/path/parser tablosuna dönüştürülecek.
- [ ] Project asset kanonik şekli `PaginatedResponse<FileAsset>` olarak kaydedilecek.
- [ ] `mobile-v1` semantiği yazılı olarak dondurulacak.
- [ ] Granular capability isimleri ve her birinin zorunlu endpoint listesi
  belirlenecek.
- [ ] Disabled session politikası `401` veya `403` olarak tekleştirilecek.
- [ ] Finance summary multi-currency politikası seçilecek.
- [ ] Version politikası `updatedAt ISO string` olarak onaylanacak.
- [ ] Validation için HTTP `400` politikası korunacak veya tüm API için `422`
  kararı alınacak; route bazında karıştırılmayacak.
- [ ] Mobil `features/files/api.ts` takip işi mobil repository planına eklenecek.

Çıkış kriteri:

- [ ] Endpoint matrisi ile mobil çağrı dosyaları arasında açıklanamayan fark yok.
- [ ] Açık kararların tümü ADR veya bu plan içinde sonuçlandırılmış.

### Faz 1 — Protokol doğruluğu ve v1 çekirdeği

Amaç: Yalan capability ilanını kaldırmak ve tüm v1 hatalarını JSON yapmak.

- [ ] Hazır olmayan `files.local`, `freelancer.core`, `portal.client` ve
  `ai.assistant` capability'leri `planned` yapılacak.
- [ ] `mobile-v1` Faz 0 kararına göre ya bootstrap capability olarak açıkça
  tutulacak ya da minimum yüzey tamamlanana kadar `planned` yapılacak.
- [ ] `capabilities` yalnız `available` ID'lerini taşımaya devam edecek.
- [ ] `capabilityDetails` planned kayıtları taşıyabilecek.
- [ ] `app/api/v1/[...path]/route.ts` JSON `NOT_FOUND` fallback eklenecek.
- [ ] Unsupported method yanıtlarının JSON `405` politikası test edilecek.
- [ ] Ortak auth/role helper'ları eklenecek.
- [ ] JSON body parse hatası `VALIDATION_ERROR` olarak normalize edilecek.
- [ ] Error response'larda v1 header ve no-store garantilenecek.
- [ ] Capabilities için route manifest tabanlı release testi eklenecek.

Çıkış kriteri:

- [ ] `/api/v1/does-not-exist` HTML değil JSON 404 döndürüyor.
- [ ] Discovery/meta bulunmayan hiçbir resource grubunu available ilan etmiyor.
- [ ] Public endpoint'ler session/cookie üretmiyor.

### Faz 2 — Me, preferences ve runtime catalog uyumu

Amaç: Login sonrası kullanıcı, tema ve dil state'ini mobil contract'a uydurmak.

- [ ] Tek bir `presentMeProfile` presenter'ı yazılacak.
- [ ] Profil `id`, `email`, `name`, `role`, `clientId`, `disabled` ve
  `preferences` alanlarını taşıyacak.
- [ ] Preferences public DTO'su `locale`, `colorMode`, `timezone` taşıyacak.
- [ ] Storage'daki `language` alanı yalnız service içinde API `locale` alanına
  çevrilecek.
- [ ] `PATCH /me/preferences` `locale` kabul edecek; geçiş için `language` alias'ı
  opsiyonel tutulabilecek.
- [ ] Aktif locale ve geçerli IANA timezone doğrulanacak.
- [ ] Preferences mutation response'u `GET /me` ile aynı tam profil olacak.
- [ ] Catalog response'u `version` taşıyacak; geçiş boyunca `catalogVersion` da
  korunabilecek.
- [ ] `/me` ve preferences için owner/client fixture'ları eklenecek.

Çıkış kriteri:

- [ ] Mobil `normalizeMeProfile` hem GET hem PATCH yanıtını kabul ediyor.
- [ ] Runtime catalog `isTranslationCatalog` guard'ını geçiyor.
- [ ] Locale değişikliği tekrar GET edildiğinde kalıcı ve doğru görünüyor.

### Faz 3 — Ortak pagination, concurrency ve idempotency altyapısı

Amaç: Sonraki mutation route'larının güvenilir temelini tek kez kurmak.

- [ ] Opaque cursor codec yazılacak; cursor version ve filtre hash'i taşıyacak.
- [ ] Default limit 20, maksimum limit 100 olacak.
- [ ] `(updatedAt DESC, id DESC)` ve gerekli domainlerde alternatif kararlı
  sıralama yardımcıları eklenecek.
- [ ] Stale/malformed/başka filtreye ait cursor validation hatası verecek.
- [ ] `version = updatedAt.toISOString()` presenter helper'ı eklenecek.
- [ ] Mutation öncesi optional version karşılaştırması ve `409 CONFLICT` eklenecek.
- [ ] `api_idempotency_keys` migration ve Drizzle şeması eklenecek.
- [ ] Key hash, request hash, actor, method, route key, status, response ve TTL
  alanları tanımlanacak.
- [ ] Aynı key + aynı payload önceki response'u döndürecek.
- [ ] Aynı key + farklı payload `409` döndürecek.
- [ ] Yarım kalan/in-progress kayıtlar için timeout/recovery politikası eklenecek.
- [ ] Expired kayıt temizliği başlangıçta veya kontrollü bakım adımında yapılacak.

Çıkış kriteri:

- [ ] Pagination çok sayfalı fixture'da tekrar/atlama yapmıyor.
- [ ] Stale version kayıt değiştirmiyor.
- [ ] Eşzamanlı aynı idempotent mutation tek domain kaydı oluşturuyor.

### Faz 4 — Owner dashboard ve analytics

Endpoint:

- [ ] `GET /dashboard/overview?range=...`

İşler:

- [ ] `resolveDashboardRange`, `getFreelancerDashboard` ve
  `getFreelancerAnalytics` orkestre edilecek.
- [ ] Web major-unit değerleri mobil `MoneyAmount` minor-unit DTO'suna
  çevrilecek; double conversion yapılmayacak.
- [ ] Stats, recent clients/projects ve analytics points presenter'ları yazılacak.
- [ ] Currency user `defaultCurrency` tercihinden alınacak.
- [ ] Unsupported range validation hatası döndürecek.
- [ ] `freelancer.dashboard.v1` capability testi eklenecek.

Çıkış kriteri:

- [ ] Login -> `/me` -> dashboard mobil guard zinciri geçiyor.
- [ ] Boş ve dolu dashboard fixture'ları doğrulanıyor.

### Faz 5 — Clients API

Endpoint'ler:

- [ ] `GET|POST /clients`
- [ ] `GET|PATCH /clients/:id`
- [ ] `GET|POST /clients/:id/activities`
- [ ] `POST /clients/:id/portal-invitations`

İşler:

- [ ] Client list/detail/activity presenter'ları yazılacak.
- [ ] `name -> displayName`, `companyName -> company`,
  `pipelineStage -> pipelineStatus` eşlemeleri yapılacak.
- [ ] Project count owner scope içinde hesaplanacak.
- [ ] Portal status invitation ve bağlı auth profile üzerinden türetilecek.
- [ ] Translation payload default locale zorunluluğuyla işlenecek.
- [ ] Search/status cursor filtreleri repository katmanına eklenecek.
- [ ] Create, activity ve invitation idempotent olacak.
- [ ] Portal invitation email/defaultLocale validation'ı uygulanacak.

Çıkış kriteri:

- [ ] CRUD sonrası GET aynı DTO shape'i döndürüyor.
- [ ] Başka owner'ın client ID'si 404.
- [ ] `freelancer.clients.v1` yalnız testlerden sonra available.

### Faz 6 — Projects API

Endpoint'ler:

- [ ] `GET|POST /projects`
- [ ] `GET|PATCH /projects/:id`
- [ ] `GET /projects/:id/planning-sections`
- [ ] `GET /projects/:id/revisions`

İşler:

- [ ] Project list/detail presenter'ları yazılacak.
- [ ] `name -> title`, `revisionQuota -> revisionAllowance` eşlenecek.
- [ ] Client name join ve revisionsUsed hesaplanacak.
- [ ] Planning `sortOrder -> order` eşlenecek.
- [ ] Search/status/clientId cursor filtreleri eklenecek.
- [ ] Create idempotent, PATCH version-aware olacak.
- [ ] Translation payload bütün aktif locale tab'larıyla uyumlu olacak.
- [ ] Asset endpoint bu fazda yalnız contract placeholder değil, Faz 13 ile birlikte
  available sayılacak.

Çıkış kriteri:

- [ ] Project CRUD ve detail alt listeleri mobil guard'ları geçiyor.
- [ ] Cross-owner project/client relation enjeksiyonu reddediliyor.

### Faz 7 — Tasks API

Endpoint'ler:

- [ ] `GET|POST /tasks`
- [ ] `GET|PATCH|DELETE /tasks/:id`
- [ ] `POST /tasks/:id/complete`

İşler:

- [ ] Client/project adları ve localized title presenter'a eklenecek.
- [ ] Search/status/priority/project/client/date cursor filtreleri eklenecek.
- [ ] İlişkili client-project tutarlılığı domain service ile korunacak.
- [ ] Status-only PATCH ile tam payload PATCH ayrıştırılacak.
- [ ] Complete idempotent olacak; zaten done task güncel DTO ile 200 dönebilecek.
- [ ] Delete 204 değil `{ deleted, id }` döndürecek.

Çıkış kriteri:

- [ ] Kanban status mutation ve complete yarış testi geçiyor.
- [ ] `freelancer.tasks.v1` testlerden sonra available.

### Faz 8 — Calendar API

Endpoint'ler:

- [ ] `GET|POST /calendar/events`
- [ ] `GET|PATCH|DELETE /calendar/events/:id`

İşler:

- [ ] `from`, `to`, `timezone` zorunlu ve sınırlı range olarak doğrulanacak.
- [ ] IANA timezone doğrulaması yapılacak.
- [ ] Gerçek event'ler `source=calendar`, `readOnly=false` olarak sunulacak.
- [ ] Task/finance projection eklenecekse namespace ID ve read-only politikası
  fixture ile sabitlenecek.
- [ ] Read-only synthetic ID detail/mutation route'unda değiştirilemeyecek.
- [ ] Create idempotent, update version-aware, delete zarf uyumlu olacak.

Çıkış kriteri:

- [ ] DST sınırı, farklı timezone ve ters range testleri geçiyor.
- [ ] `freelancer.calendar.v1` testlerden sonra available.

### Faz 9 — Finance API

Endpoint'ler:

- [ ] `GET /finance/summary`
- [ ] `GET|POST /finance/transactions`
- [ ] `GET|PATCH|DELETE /finance/transactions/:id`

İşler:

- [ ] `type -> kind`, `transactionDate -> date` eşlenecek.
- [ ] Amount daima `{ amountMinor, currency }` olacak.
- [ ] Search/month/kind/payment/project/client cursor filtreleri eklenecek.
- [ ] Cancelled kayıtların summary etkisi fixture ile sabitlenecek.
- [ ] Income, expense, gross, net, pending ve taxEstimate formülleri testlenecek.
- [ ] Faz 0'da seçilen multi-currency politikası uygulanacak; farklı para birimleri
  sessizce toplanmayacak.
- [ ] Create idempotent, PATCH version-aware olacak.

Çıkış kriteri:

- [ ] Minor-unit doğruluğu ve çoklu currency negatif testi geçiyor.
- [ ] `freelancer.finance.v1` CRUD/summary için available olabiliyor.

### Faz 10 — Journal API

Endpoint'ler:

- [ ] `GET /journal/entries?from&to`
- [ ] `PUT /journal/entries/:date`
- [ ] `GET|PATCH|DELETE /journal/entries/:id`

İşler:

- [ ] Score alanları `mood`, `energy`, `satisfaction` olarak sunulacak.
- [ ] Owner+date unique index doğrulanacak; yoksa migration eklenecek.
- [ ] PUT atomik upsert olacak.
- [ ] Translation payload `moodLabel` ve `note` alanlarını koruyacak.
- [ ] Range üst sınırı ve tarih validation'ı eklenecek.
- [ ] Update version-aware ve delete zarf uyumlu olacak.

Çıkış kriteri:

- [ ] Eşzamanlı aynı gün upsert duplicate üretmiyor.
- [ ] `freelancer.journal.v1` testlerden sonra available.

### Faz 11 — Profil, şifre ve session yönetimi

Endpoint'ler:

- [ ] `PATCH /me/profile`
- [ ] `POST /me/password`
- [ ] `GET|DELETE /me/sessions`
- [ ] `DELETE /me/sessions/:id`

İşler:

- [ ] Profil mutation tam `MeProfile` döndürecek.
- [ ] Better Auth password doğrulama/değiştirme API'leri yeniden kullanılacak.
- [ ] Revoke-other-sessions davranışı açık testle sabitlenecek.
- [ ] Session DTO token/cookie içermeyecek.
- [ ] Device label user-agent'tan güvenli ve sınırlı metin olarak üretilecek.
- [ ] Current session revoke sonrası cookie lifecycle test edilecek.
- [ ] Delete response her durumda `{ deleted, id }` olacak.

Çıkış kriteri:

- [ ] Eski şifre ve revoke edilmiş session ile tekrar erişim başarısız.
- [ ] Owner ve client aynı self-service endpoint'leri yalnız kendileri için kullanıyor.

### Faz 12 — General, appearance ve AI settings

Endpoint'ler:

- [ ] `GET|PATCH /settings/general`
- [ ] `GET|PATCH /settings/appearance`
- [ ] `POST /settings/appearance/assets`
- [ ] `DELETE /settings/appearance/assets/:kind`
- [ ] `GET|PATCH /settings/ai`

İşler:

- [ ] General settings workspace/company/footer semantiği web ile eşlenecek.
- [ ] Appearance bütün URL'leri absolute ve same-origin döndürecek.
- [ ] `primaryColor`, `accentColor`, `defaultColorMode`, `radiusScale` tam dönecek.
- [ ] Asset kind `lightLogo|darkLogo|favicon` FileService kind'larına adapter ile
  çevrilecek.
- [ ] AI GET yalnız configured/maskedKey/model/provider döndürecek.
- [ ] Gerçek API key hiçbir read response'unda görünmeyecek.
- [ ] Provider değişiminde key gereksinimi mevcut service politikasıyla korunacak.
- [ ] Settings endpoint'leri yalnız owner scope kabul edecek.

Çıkış kriteri:

- [ ] Secret redaction ve cross-role testleri geçiyor.
- [ ] Branding değişikliği discovery/meta ve mobil settings'te tutarlı.

### Faz 13 — Locale yönetim API'si

Endpoint'ler:

- [ ] `GET|POST /settings/locales`
- [ ] `PATCH /settings/locales/:code`
- [ ] `GET|PUT /settings/locales/:code/translations`
- [ ] `POST /settings/locales/import`
- [ ] `GET /settings/locales/export?locale=...`

İşler:

- [ ] Locale definition presenter completion/fallback/default/status/direction
  alanlarını eksiksiz döndürecek.
- [ ] Mobil catalog ile mevcut import package formatı arasında adapter yazılacak.
- [ ] Translation `version` optimistic concurrency için kullanılacak.
- [ ] Stale version `409` döndürecek.
- [ ] Default locale archive edilemeyecek.
- [ ] Fallback cycle ve inactive fallback validation'ı uygulanacak.
- [ ] Import idempotent ve transaction-safe olacak.
- [ ] Export secret veya dahili metadata taşımayacak.

Çıkış kriteri:

- [ ] TR/EN ve yeni üçüncü dil create-edit-activate-export-import akışı geçiyor.
- [ ] `instance.locales.admin.v1` testlerden sonra available.

### Faz 14 — File API ve gerçek metadata sanitization

Endpoint'ler:

- [ ] `POST /files`
- [ ] `GET /projects/:projectId/assets`
- [ ] `DELETE /projects/:projectId/assets/:assetId`
- [ ] Yetki kontrollü binary asset GET

İşler:

- [ ] Multipart alanları `file`, `kind`, `visibility`, `projectId`, `originalName`
  olarak normalize edilecek.
- [ ] File DTO `name`, `sizeBytes`, `metadataSanitized`, absolute URL taşıyacak.
- [ ] Boyut limitleri kind bazında uygulanacak.
- [ ] MIME magic-byte/decode ile doğrulanacak.
- [ ] Project asset için PDF politikası ve güvenli response header'ları eklenecek.
- [ ] Filename normalize/path traversal kontrolleri korunacak.
- [ ] Görseller güvenilir decoder/encoder ile yeniden encode edilecek.
- [ ] EXIF/XMP/IPTC/comment gerçekten kaldırılmadan `metadataSanitized=true`
  dönülmeyecek.
- [ ] Image re-encode için eklenecek dependency self-host image/build etkisiyle
  ayrı karar kaydında gerekçelendirilecek.
- [ ] DB ve fiziksel dosya rollback/orphan davranışı test edilecek.
- [ ] Private, portal ve public branding read authorization ayrı testlenecek.
- [ ] Project asset response kanonik pagination zarfını kullanacak.

Çıkış kriteri:

- [ ] EXIF GPS fixture upload sonrası metadata taşımıyor.
- [ ] MIME spoof/polyglot/truncated/path traversal testleri geçiyor.
- [ ] Cross-client portal dosya okuması 404.
- [ ] `files.v1` ve project assets capability'si ancak bundan sonra available.

### Faz 15 — Client portal read API

Endpoint'ler:

- [ ] `GET /portal/dashboard`
- [ ] `GET /portal/projects`
- [ ] `GET /portal/projects/:id`
- [ ] `GET /portal/tasks`
- [ ] `GET /portal/revisions`
- [ ] `GET /portal/profile`

İşler:

- [ ] Scope yalnız session `clientId` değerinden türetilecek.
- [ ] Query/body `clientId` alanı yetki kaynağı olarak yok sayılmayacak; doğrudan
  reddedilecek.
- [ ] Listeler `locale` ve `fallbackChain` taşıyacak.
- [ ] Project detail yalnız client'a ait proje, public task ve portal asset içerecek.
- [ ] Revision allowance tek domain hesabından üretilecek.
- [ ] Portal footer ve localized içerik fallback zinciriyle çözülecek.
- [ ] Freelancer portal route'larına erişemeyecek.
- [ ] Client A / Client B negatif matrisi bütün alt kaynaklarda uygulanacak.

Çıkış kriteri:

- [ ] Portal dashboard ve tüm read ekranları mobil guard'larını geçiyor.
- [ ] ID tahmini veya filtre enjeksiyonu tenant sınırını aşamıyor.

### Faz 16 — Client portal mutation ve kişisel ayarlar

Endpoint'ler:

- [ ] `POST /portal/projects/:id/revisions`
- [ ] `PATCH /portal/profile`
- [ ] Ortak `/me/preferences`, password ve session endpoint'lerinin client matrisi

İşler:

- [ ] Revision create idempotent olacak.
- [ ] Quota dolduğunda `409 CONFLICT` dönecek.
- [ ] `sourceLocale` aktif locale olmalı.
- [ ] Kullanıcının açıklaması makine çevirisiyle değiştirilmeden saklanmalı.
- [ ] Profil güncellemesi yalnız bağlı auth profile/client üzerinde çalışmalı.
- [ ] Portal dil tercihi adminin aktif ettiği locale'lerle sınırlı olmalı.
- [ ] Client default locale ile kişisel locale ayrımı korunmalı.

Çıkış kriteri:

- [ ] Client revision/profile/preferences akışı uçtan uca geçiyor.
- [ ] `portal.client.v1` yalnız Faz 15 ve 16 birlikte geçince available.

### Faz 17 — Chat, proje riski ve finans analizi

Endpoint'ler:

- [ ] `GET|POST /chat/sessions`
- [ ] `DELETE /chat/sessions/:id`
- [ ] `GET /chat/sessions/:id/messages`
- [ ] `POST /chat/sessions/:id/messages` NDJSON
- [ ] `POST /projects/:id/risk-analysis`
- [ ] `POST /finance/analysis`

İşler:

- [ ] Session/message pagination presenter'ları yazılacak.
- [ ] Chat stream `application/x-ndjson` ve satır bazlı tam JSON event döndürecek.
- [ ] `message.delta`, `message.completed` ve kararlı error event'leri uygulanacak.
- [ ] Stream başlamadan hata JSON envelope; başladıktan sonra NDJSON error olacak.
- [ ] Request AbortSignal provider çağrısına aktarılacak.
- [ ] User mesajı ve assistant tamamlanması idempotency ile korunacak.
- [ ] Risk ve finance analysis structured output schema ile doğrulanacak.
- [ ] AI response uydurma alanlarla doldurulmayacak; validation başarısızsa kararlı
  upstream error dönecek.
- [ ] Prompt, provider key ve gizli context response/loglara girmeyecek.

Çıkış kriteri:

- [ ] Stream chunk sınırları değişse de mobil NDJSON parser'ı çalışıyor.
- [ ] Abort, timeout, provider failure ve duplicate mutation testleri geçiyor.
- [ ] `ai.assistant.v1` yalnız bütün AI endpoint'leri geçince available.

### Faz 18 — Consumer contract, release gate ve canlı smoke

Amaç: Capability ve route drift'ini tekrar oluşamayacak hale getirmek.

- [ ] Mobil guard'lar backend fixture'larına karşı CI'da çalıştırılacak.
- [ ] Route manifest ile capability gereksinimleri otomatik eşlenecek.
- [ ] Her route için success, validation, unauthenticated, wrong-role ve
  cross-tenant fixture'ları olacak.
- [ ] Bütün v1 tree HTML response taraması yapılacak.
- [ ] Log/response secret taraması eklenecek.
- [ ] Migration boş DB, mevcut DB ve backup restore üzerinde test edilecek.
- [ ] Owner canlı smoke: discovery -> login -> me -> bütün owner modülleri -> logout.
- [ ] Client canlı smoke: invitation -> login -> portal read/mutation -> logout.
- [ ] Dokploy persistent SQLite ve upload volume rehberi güncellenecek.
- [ ] Capability'ler test sonucuna göre final available durumuna alınacak.
- [ ] Eski broad capability'ler için deprecation/alias politikası yayınlanacak.

Çıkış kriteri:

- [ ] Production build ve tüm kalite kapıları geçiyor.
- [ ] Demo instance'ta owner ve client smoke başarılı.
- [ ] Mobilde endpoint/DTO workaround'u kalmamış.

## 7. Capability yayınlama matrisi

| Capability | Açılacağı faz | Zorunlu koşul |
| --- | ---: | --- |
| `instance.discovery` | mevcut | discovery/meta/health testleri |
| `instance.localization` | Faz 2 | runtime catalog guard testi |
| `freelancer.dashboard.v1` | Faz 4 | dashboard contract + owner auth |
| `freelancer.clients.v1` | Faz 5 | client CRUD/activity/invite |
| `freelancer.projects.v1` | Faz 6 + 14 | project CRUD ve assets |
| `freelancer.tasks.v1` | Faz 7 | task CRUD/complete |
| `freelancer.calendar.v1` | Faz 8 | range ve event CRUD |
| `freelancer.finance.v1` | Faz 9 | summary ve transaction CRUD |
| `freelancer.journal.v1` | Faz 10 | range/upsert/CRUD |
| `freelancer.settings.v1` | Faz 11 + 12 | profil, security ve settings |
| `instance.locales.admin.v1` | Faz 13 | locale ve translation yönetimi |
| `files.v1` | Faz 14 | upload/read/delete ve sanitization |
| `portal.client.v1` | Faz 15 + 16 | portal read/mutation ve izolasyon |
| `ai.assistant.v1` | Faz 17 | chat/risk/finance AI |
| `mobile-v1` | Faz 0 kararı | tanımlanan minimum yüzey eksiksiz |
| `auth.device-pairing.v1` | bu plan dışında | ADR-0018 tamamlanmadan planned |

## 8. Her faz için zorunlu test şablonu

Her resource fazında aşağıdakiler uygulanacaktır:

- [ ] Oturumsuz istek -> 401 JSON.
- [ ] Yanlış rol -> 403 JSON.
- [ ] Başka owner/client kaynağı -> 404 JSON.
- [ ] Geçerli actor -> beklenen 2xx envelope.
- [ ] Bozuk JSON ve bilinmeyen alan -> validation error, side effect yok.
- [ ] Mobil success guard'ı response'u kabul ediyor.
- [ ] Boş liste, tek sayfa ve sonraki cursor fixture'ları var.
- [ ] Mutation sonrası GET aynı wire shape ve güncel version döndürüyor.
- [ ] Stale version -> 409, kayıt değişmiyor.
- [ ] İlgili create/complete/AI mutation için duplicate idempotency testi var.
- [ ] Response ve log secret/path/token içermiyor.
- [ ] `git diff --check`, typecheck ve ilgili smoke scriptleri geçiyor.

## 9. Commit stratejisi

Her faz 5–15 dosyalık anlamlı commitlere ayrılmalıdır. Önerilen sıra:

1. Migration/schema/repository altyapısı
2. API schema/presenter/application service
3. Route handler'ları
4. Contract/authorization/smoke testleri ve dokümantasyon

Bir capability durum değişikliği, ilgili route ve testlerle aynı release içinde
olmalı; endpoint'ten önce ayrı bir commit ile `available` yapılmamalıdır.

## 10. Global Definition of Done

- [ ] Bu plandaki production mobil endpoint'lerin tamamı `/api/v1` altında var.
- [ ] Bütün v1 success/error yanıtları envelope ve version header taşıyor.
- [ ] `/api/v1/**` altında HTML 404/500 sızıntısı yok.
- [ ] Mobil runtime guard'ları bütün backend success fixture'larını kabul ediyor.
- [ ] Owner ve client tenant izolasyonu negatif testlerle kanıtlı.
- [ ] Pagination, idempotency ve concurrency testleri geçiyor.
- [ ] Dosya metadata'sı gerçekten sanitize ediliyor.
- [ ] Chat NDJSON ve abort davranışı mobil ile uyumlu.
- [ ] Secret/cookie/token/key/path response veya loglarda yok.
- [ ] Discovery/meta gerçekte bulunmayan capability ilan etmiyor.
- [ ] Dokploy production deployment'ta SQLite ve upload persistence doğrulanmış.
- [ ] Owner ve portal canlı smoke senaryoları başarılı.
- [ ] `neta-mobile` tarafındaki project asset parser çakışması giderilmiş.

## 11. Başlangıç önerisi

Uygulamaya Faz 0, Faz 1 ve Faz 2 birlikte ele alınarak başlanmalıdır. Bu paket:

- capability gerçeğini düzeltir,
- HTML 404 sızıntısını kapatır,
- login sonrası profil/dil/tema contract'ını düzeltir,
- sonraki endpoint'ler için kararlı sözleşmeyi dondurur.

Ardından Faz 3 altyapısı kurulmalı ve her domain fazı bağımsız tamamlanmalıdır.
Dashboard Faz 4 tamamlanmadan `mobile-v1` değerinin production-ready anlamında
kullanılmasına izin verilmemelidir.
