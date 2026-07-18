---
title: Faz 2 Domain Schema ve Backend Çekirdeği
description: SQLite/Drizzle domain modeli, repository-service sınırı, actor yetkilendirmesi ve test sözleşmesi.
status: complete
last_updated: 2026-07-16
---

# Faz 2 Domain Schema ve Backend Çekirdeği

Faz 2, Neta'nın iş verilerini Supabase istemcisinden ayıran çalıştırılabilir backend çekirdeğini kurar. Bu faz sayfa sorgularını henüz taşımaz; Drizzle schema, migration, repository ve service katmanları UI, cookie ve Next.js request objelerinden bağımsızdır. Route Handler veya Server Action yalnızca session'ı `DomainActor`'a çevirip service çağırmalıdır.

## Veri modeli

`0003_chief_excalibur.sql` migration'ı 15 domain tablosunu ekler:

- çekirdek: `clients`, `client_activities`, `projects`, `project_planning_sections`, `tasks`, `calendar_events`, `finance_transactions`, `journal_entries`, `project_revisions`, `chat_sessions`, `chat_messages`;
- korunacak iş verileri: `proposals`, `contracts`, `invoices`, `subscriptions`.

Dosya metadata'sı ve instance branding bilinçli olarak Faz 3'e bırakılmıştır. ID'ler mevcut UUID'leri taşıyabilmek için `text`, parasal değerler integer minor unit, iş tarihleri `YYYY-MM-DD`, sistem zamanları UTC epoch millisecond olarak saklanır. Owner'a ait tablolarda açık `owner_user_id`, client portal bağında `clients.auth_user_id` bulunur.

Schema seviyesinde status/type enumları, negatif para ve süre değerleri, progress aralığı, revizyon kotası, tarih aralığı, currency uzunluğu, journal owner+date tekilliği ve invoice owner+number tekilliği SQLite `CHECK`/unique constraint'leriyle korunur. İlişkisel owner tutarlılığı service katmanında doğrulanır; istemciden gelen owner veya client kimliği güven kaynağı değildir.

## Katman sınırları

| Katman | Sorumluluk | Bağımlı olmadığı şeyler |
| --- | --- | --- |
| Schema | tablo, foreign key, index ve DB constraint | UI, Supabase |
| Repository | scope uygulanmış Drizzle sorguları ve aggregate'ler | session/cookie, Next.js |
| Service | validation, actor yetkisi, ilişki ve iş kuralları | Route Handler, React |
| Adapter | session→actor ve HTTP response dönüşümü | domain kuralı |

Ana giriş noktaları:

- `server/domain/actor.ts`: `DomainActor`, `OwnerScope`, `ClientScope` ve role/disabled guard'ları;
- `server/domain/validation.ts`: paylaşılan Zod input sözleşmeleri;
- `server/domain/errors.ts`: stabil domain error code ve HTTP status eşlemesi;
- `server/repositories/domain.ts`: owner/client scope'u sorgu koşuluna dönüştüren repository'ler;
- `server/services/domain.ts`: CRUD, ilişki doğrulaması, portal görünürlüğü, revizyon ve aggregate kuralları;
- `server/api/responses.ts`: `{ ok, data }` ve `{ ok, error }` API envelope'u;
- `server/auth/domain-actor.ts`: web session adapter'ı.

Repository metoduna çıplak `ownerUserId` yerine tiplenmiş scope verilir. Owner kaynaklarında kimlik filtresi her sorguda uygulanır. Client proje erişimi bağlı `clientId`, görev erişimi ayrıca `is_public_to_client = true` üzerinden kısıtlanır. Calendar, finance, journal ve chat client rolüne kapalıdır.

## İş kuralları

- Side project bir client'a bağlanamaz.
- Client/project/task/journal ilişkileri aynı owner altında bulunmalı ve birbiriyle uyuşmalıdır.
- Otomatik progress kullanan projeler, iptal edilmemiş görevlerdeki `done / total` oranından create/update/delete sonrasında yeniden hesaplanır.
- Journal aynı owner ve iş tarihi için upsert edilir.
- Chat session ve journal context kayıtları aynı owner'a ait olmak zorundadır.
- Business preservation tablolarına yazılan client/project/proposal bağları owner scope'unda doğrulanır.
- Davet yalnızca owner'a ait gerçek bir `clients` kaydı için üretilebilir. Kabul işlemi auth kayıtlarıyla birlikte `clients.auth_user_id` değerini aynı transaction'da yazar; session çözümlemesi `app_profiles.client_id` ile bu bağı karşılıklı doğrular.

## Revizyon transaction'ı

Revizyon isteği client actor'dan `clientId` almaz; client kimliği actor scope'undan gelir. `BEGIN IMMEDIATE` transaction içinde proje-client eşleşmesi, projenin aktif olması ve reddedilmemiş tüketim kayıtlarından kalan kota kontrol edilir, sonra insert yapılır. Bu yaklaşım ayrı bir mutable sayaç tutmaz; başarısız transaction kota tüketmez ve eşzamanlı yazarlar kontrol ile insert arasına giremez.

## Analytics yaklaşımı

Analytics için satırların tamamını belleğe alıp JavaScript'te toplamak yerine repository seviyesinde doğrudan SQLite aggregate sorguları kullanılır:

- ödenmiş gelir, ödenmiş gider ve planlanan/pending tutarlar koşullu `SUM` ile;
- proje ve görev durum dağılımları `GROUP BY` + `COUNT` ile;
- tüm sorgular `owner_user_id` scope'u ile.

İleride dashboard zaman serileri de aynı yaklaşımda tarih aralığı ve currency filtresi eklenerek genişletilmelidir. Farklı para birimleri kur bilgisi olmadan birbirine çevrilmemelidir.

## Doğrulama

`npm run phase2:domain-smoke` her çalışmada boş bir SQLite dosyasına gerçek migration'ları uygular, saf TypeScript domain çekirdeğini derler ve aşağıdaki senaryoları doğrular:

- owner CRUD scope'u ve cross-owner kaynak reddi;
- client'ın owner-only modüllerden reddi;
- bağlı proje/planlama görünürlüğü ve private task sızıntısının engellenmesi;
- otomatik project progress;
- project-client eşleşmesi, aktif proje kuralı, atomik quota ve quota aşımı;
- journal upsert, chat ownership ve ilişkisel owner doğrulamaları;
- owner-scope finance aggregate sonuçları;
- korunacak dört business tablosuna service üzerinden yazım;
- negatif amount ve geçersiz status için SQLite CHECK constraint'leri.

Faz 1 auth smoke'u da yerel client fixture'larıyla çalışır ve davet kabulünden sonra hem profile hem `clients.auth_user_id` bağını doğrular.

| Kontrol | Sonuç |
| --- | --- |
| `npm run typecheck` | Başarılı |
| Değişen Faz 2 dosyalarında targeted ESLint | 0 error, 0 warning |
| `npm run phase2:domain-smoke` | Başarılı |
| `node scripts/phase1-auth-smoke.mjs` | Başarılı |
| `node scripts/phase1-smoke.mjs` | Başarılı; migration, backup ve restore dahil |
| `pnpm db:generate` | Schema drift yok |
| `npm run build` | Başarılı |

Repo geneli lint, Faz 0'dan kaydedilmiş ve bu fazın değiştirmediği UI/AI dosyalarındaki baseline nedeniyle 31 error ve 18 warning ile açık kalır. Faz 2 dosyaları bu bulgulara yenisini eklemez.
