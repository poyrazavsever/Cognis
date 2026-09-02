# Faz 17 — Portal API ve authorization hardening

Son güncelleme: 2026-07-27

Bu repository mobil istemci ve paylaşılan transport kontratlarını içeriyor; Neta
server uygulaması burada bulunmuyor. Bu nedenle server endpoint'leri tamamlanmış
sayılmadı. Mobil taraf, endpoint'ler devreye girdiğinde güvenli olmayan veya
scope dışına taşan yanıtları kabul etmeyecek şekilde hazırlandı.

## Mobilde tamamlananlar

- `portal/*` dışındaki path'ler portal adapter'ından çağrılamaz.
- Freelancer actor portal adapter'ını kullanamaz.
- `clientId` query parametresi ve path traversal istemcide reddedilir.
- Dashboard, project list/detail, task, revision ve profile response'ları runtime
  guard'lardan geçmeden UI'a ulaşmaz.
- Portal project/read response'u `locale` ve `fallbackChain` taşır.
- Task'ın `isPublicToClient` alanı literal `true` değilse kontrat reddedilir.
- Asset URL'si absolute HTTP(S) değilse veya visibility `portal` değilse kontrat
  reddedilir.
- Revision create idempotency key ve zorunlu `sourceLocale` taşır.
- 401/403/404/409/422 durumları mobilde ayrı güvenli hata kodlarına çevrilir.

## Hedef server endpoint'leri

| Method | Endpoint | Scope kaynağı |
| --- | --- | --- |
| GET | `/api/v1/portal/dashboard` | Session actor'ın client kaydı |
| GET | `/api/v1/portal/projects` | Session client |
| GET | `/api/v1/portal/projects/:id` | Project-client üyeliği |
| GET | `/api/v1/portal/tasks` | Session client + `isPublicToClient=true` |
| GET | `/api/v1/portal/revisions` | Session client'ın project'leri |
| POST | `/api/v1/portal/projects/:id/revisions` | Session client + allowance |
| GET/PATCH | `/api/v1/portal/profile` | Session user |

`clientId`, role veya visibility header/query/body'den güven kaynağı olarak
alınamaz. `Accept-Language` yalnız lokalizasyon seçer; authorization kapsamını
değiştirmez.

## Zorunlu server negatif matrisi

Her endpoint için aşağıdaki testler server repository'sinde geçmeden Faz 17
tamamlanmış sayılmaz:

- Oturumsuz istek `401`.
- Freelancer session portal endpoint'inde `403`.
- Client session owner endpoint'inde `403`.
- Client A, Client B project/task/revision ID'sinde veri sızdırmayan `404` veya
  tutarlı `403`.
- Query/body içindeki sahte `clientId` kapsamı değiştirmez.
- Private task ve private asset URL dahil response'a girmez.
- Revision allowance doluysa stable conflict/validation code döner.
- Revision kaydı istemci metnini ve doğrulanmış `sourceLocale` değerini korur.

## İlgili kod

- `packages/api-contracts/src/index.ts`
- `mobile/src/features/portal/api.ts`
- `mobile/src/features/portal/authorization.ts`
- `mobile/src/features/portal/form.ts`
