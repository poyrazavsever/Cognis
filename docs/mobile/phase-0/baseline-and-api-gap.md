# Faz 0 baseline ve mobil API gap

## Repository snapshot

Bu repository'nin mevcut kapsamı yalnız mobil istemci ve mobil planlardır.
Next.js web uygulaması, Better Auth server config'i, `DomainService`, Drizzle
schema ve `/api/v1` route implementasyonları burada bulunmamaktadır.

Mobil baseline:

- Expo SDK 57 / React Native 0.86 / React 19.2.3.
- Expo Router typed route grupları.
- iOS ve Android production JS bundle doğrulaması.
- Instance-scoped secure/public storage ayrımı.
- Network ve app lifecycle provider sınırı.
- Kırmızı odaklı semantic light/dark tema ve Neta bootstrap logoları.
- ESLint, strict TypeScript, unit test ve Expo config kalite kapısı.

Web repository eklendiğinde aşağıdaki snapshot komutu/çıktısı bu belgeye
eklenmelidir:

1. `app/**/route.ts` ve `/api/v1` endpoint envanteri.
2. Server Action dosyaları ve kullandıkları `DomainService` metotları.
3. Owner/client actor-scope guard'ları.
4. Drizzle entity/translation/relation şemaları.
5. Better Auth plugin, trusted origin ve session config'i.

## API gap backlog

Durumlar ana planın mevcut sözleşmesinden alınmıştır; bu repository'de kaynak
kod doğrulaması yapılmış anlamına gelmez.

| Yüzey | Plan durumu | Mobil faz | Gerekli çıktı |
| --- | --- | --- | --- |
| Discovery/meta/health/catalog | Hazır kabul ediliyor | Faz 3 | Runtime schema, redirect/origin/TLS testleri |
| Better Auth native session | Web hazır, native belirsiz | Faz 0/4 | Server plugin, iki-domain cookie spike, revoke testleri |
| `/api/v1/me` ve preferences | Hazır kabul ediliyor | Faz 4 | Role/locale/session contract testi |
| Profile/password/sessions | Eksik/kısmi | Faz 15 | Stable v1 envelope ve revoke davranışı |
| Dashboard/analytics | Eksik | Faz 6 | Aggregate owner endpoint'leri |
| Clients/activities/invitations | Eksik | Faz 7 | CRUD, cursor, owner scope, localized payload |
| Projects/plan/revisions/assets | Eksik | Faz 8/19 | CRUD, conflict, upload ve visibility |
| Tasks | Eksik | Faz 9 | CRUD, filters, idempotent complete, portal visibility |
| Calendar | Eksik | Faz 10 | Date-range API ve timezone contract |
| Finance | Eksik | Faz 11 | Summary, CRUD, minor units, idempotency/redaction |
| Journal | Eksik | Faz 12 | Range ve idempotent date upsert |
| Chat/risk/finance AI | Eksik | Faz 11/13 | SSE/NDJSON, abort ve stable error contract |
| Business | Eksik/product parity belirsiz | Faz 14 | Önce web acceptance, sonra CRUD |
| Owner settings/locales | Eksik/kısmi | Faz 15/16 | Secret-safe settings ve catalog lifecycle |
| Portal API | Eksik | Faz 17 | Session-derived client scope ve cross-client negatif testler |
| File API v1 | Web API hazır/kısmi | Faz 19 | Envelope, absolute URL, auth ve visibility |

## Backlog kabul kuralı

Bir mobil ekran ancak ilgili endpoint için aşağıdakiler mevcutsa geliştirmeye
alınır:

- JSON-safe request/response şeması.
- Stable error code ve localization key'i.
- Owner/client pozitif ve negatif authorization testi.
- Pagination/conflict/idempotency kararı.
- Hassas alanlar için log redaction kuralı.
