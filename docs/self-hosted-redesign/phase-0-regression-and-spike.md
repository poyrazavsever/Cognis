---
title: Phase 0 Regression and Phase 1 Spike Criteria
description: Mevcut hatalardan türetilen regression testleri ve Faz 1 runtime spike kabul kriterleri.
status: active
last_updated: 2026-07-16
---

# Phase 0 Regression and Phase 1 Spike Criteria

## Regression test backlog

Bu maddeler davranış paritesi değildir; redesign içinde düzeltilmesi zorunlu eski problem testleridir.

| ID | Problem | Test tanımı | Beklenen sonuç |
| --- | --- | --- | --- |
| REG-001 | Portal planning query `order_index` kullanıyor | Portal project detail planning sections ordered query çalıştırılır | Query `sort_order` kullanır; missing column hatası yok |
| REG-002 | Project risk route `completed` sayıyor | `done` task içeren project için risk analysis çalıştırılır | Completed count `done` taskları sayar |
| REG-003 | Portal UI `section.type` okuyor | `category: scope` olan section portalda render edilir | Label/category doğru görünür, undefined fallback yok |
| REG-004 | Revision quota server'da uygulanmıyor | Quota dolu project için portal revision request gönderilir | Server action reject eder; DB insert olmaz |
| REG-005 | Revision insert project/client ilişkisini tam doğrulamıyor | Client A kendi `client_id` ile Client B project id'sine request dener | Authorization error; DB insert olmaz |
| REG-006 | Browser Supabase client DB erişimi | Chat/settings ekranında client bundle import analizi yapılır | Browser DB/auth SDK import yok |
| REG-007 | Settings API key client'a dönüyor | Settings page data contract incelenir | Secret value response payload'da yok, sadece masked/existence flag var |
| REG-008 | Limitsiz listeler payload büyütüyor | Projects/tasks/clients/calendar list query contract incelenir | Pagination veya visible date range zorunlu |
| REG-009 | Auto progress transaction dışı kalabilir | Task status değişimi auto progress project'te yapılır | Task update ve project progress aynı transaction sonucu |
| REG-010 | Cross-owner UUID erişimi | Başka owner'a ait project/task/client UUID ile query/mutation yapılır | 404 veya authorization error; veri dönmez |
| REG-011 | Production build `/app/data` oluşturmaya çalışıyor | Env verilmeden ve kontrollü build env ile standalone build alınır | Build host root'una yazmaz; runtime data dir yalnızca runtime'da hazırlanır |
| REG-012 | Pnpm native build scriptleri ignore ediliyor | Fresh `pnpm install` sonrası SQLite smoke çalıştırılır | `better-sqlite3` native binding mevcut; smoke yükleme hatası vermez |
| REG-013 | Better Auth layout + Supabase feature session ayrışması | Better Auth ile login sonrası core feature read/mutation çalıştırılır | Tek session principal kullanılır; Supabase session gerekmiyor |
| REG-014 | Eksik link hedefleri | Login forgot-password ve portal settings linkleri izlenir | Her görünür link gerçek route veya bilinçli disabled state'e gider |

## Kritik davranış baseline matrisi

Faz 0'da mevcut kod davranışı `phase-0-baseline.md` içinde kaydedilmiştir. Hibrit auth nedeniyle eski ekranın canlı çalışması yeni sistem için güvenilir parity kanıtı değildir. Aşağıdaki akışların yeni vertical slice kabulünde ekran kaydı veya tekrarlanabilir browser smoke çıktısı alınacaktır:

| Akış | Kayıt adı önerisi | Kapsam |
| --- | --- | --- |
| İlk admin setup | `setup-first-admin` | `/register`, signup, dashboard redirect |
| Login/logout | `auth-login-logout` | Login, protected route, sign out |
| Client portal hesabı | `client-user-create` | Freelancer client user creation route |
| Client CRUD | `clients-crud` | Create, edit, archive, pipeline stage |
| Project CRUD/planning | `projects-crud-planning` | Create, cover image, planning section, progress settings |
| Task kanban | `tasks-kanban` | Create, drag/status update, complete, delete |
| Calendar | `calendar-crud` | Create/edit/delete, date range |
| Finance | `finance-crud-filter` | Create income/expense, update payment status |
| Business docs | `business-docs` | Proposal/invoice/contract/subscription current behavior |
| Journal | `journal-crud` | Create/edit/delete daily log |
| Analytics | `analytics-range` | Date filter and chart result |
| AI chat | `chat-session-message` | Session create/delete, message send |
| AI analysis | `ai-analysis` | Finance analysis and project risk |
| Settings | `settings-profile-secret` | Avatar, profile, password, API key |
| Portal | `portal-project-revision` | Project, public tasks, revision request |

## Faz 1 spike kabul kriterleri

Faz 1'e başlandığında ilk teknik spike feature taşımaz. Sadece runtime kararlarını kanıtlar.

Başarı kriterleri:

- Next.js standalone production build alınır.
- Tek container boot eder.
- `DATA_DIR` altında SQLite DB ve uploads dizini oluşur.
- Drizzle migration sıfır DB'ye uygulanır.
- Migration ikinci kez çalıştırıldığında schema bozulmaz.
- `better-sqlite3` native module production image içinde çalışır.
- `/api/health/live` process ayakta olduğu sürece 200 döner.
- `/api/health/ready` DB yazılabilir değilse unhealthy döner.
- Container restart sonrası sample row korunur.
- Non-root runtime ile `/app/data` yazılabilir.
- Backup proof-of-concept sample DB ve uploads manifest'i üretir.
- `lint`, typecheck ve production build geçer.

Başarısızlık kriterleri:

- Native SQLite module image içinde yüklenemiyor.
- Restart veri kaybettiriyor.
- Migration request sırasında çalışıyor veya idempotent değil.
- Readiness DB bozuk/yazılamaz durumda healthy dönüyor.
- Tek persistent volume dışında zorunlu servis ihtiyacı çıkıyor.

Rollback:

- Faz 1 spike production'a deploy edilmez.
- Eski Supabase app untouched kalır.
- Spike branch silinebilir veya ADR yeniden açılır.
