---
title: Phase 0 Data Mapping
description: Supabase kaynak modelinden SQLite/Next.js hedef modeline onaylı mapping ve production audit sorguları.
status: active
last_updated: 2026-07-16
---

# Phase 0 Data Mapping

Bu dosya Faz 0 için onaylı source-to-target veri mapping'idir. Production verisine bağlanmadan status dağılımı ve gerçek satır sayısı tamamlanamaz; bu nedenle her production-only madde audit sorgularıyla birlikte bırakılmıştır. Alan düzeyi nihai Drizzle schema Faz 2'de üretilecek, ancak tablo kaderi ve normalization kuralları bu belgeyle kilitlenmiştir.

## Kanonik veri standartları

- ID: Mevcut UUID değerleri korunacak.
- Para: `numeric(12,2)` kaynak değerleri hedefte integer minor unit olarak saklanacak.
- Tarih: Kullanıcı iş tarihi `YYYY-MM-DD`, timestamp alanları UTC epoch veya ISO storage standardı ile tekleştirilecek.
- Sahiplik: Supabase RLS yerine `owner_user_id`/session role filtreli repository sorguları kullanılacak.
- Client portal: client auth user ile `clients.client_auth_id` ilişkisi hedefte invitation/account relation olarak modellenir.
- File path: Supabase bucket path değerleri hedefte `files` metadata tablosu ve `/app/data/uploads` altındaki relative path ile tutulur.
- AI secrets: `app_settings.api_key` düz metin olarak taşınmaz; yeni sistemde env veya encrypted-at-rest secret store kararı uygulanır.

## Source-to-target mapping

| Supabase kaynak | Mevcut amaç | Hedef model | Karar |
| --- | --- | --- | --- |
| `auth.users` | Supabase auth principal, freelancer/client user | Better Auth user/session/account tabloları | Password/session taşınmayacak; reset veya yeniden davet |
| `profiles` | Ad, avatar, role | `app_profiles` | `role: freelancer|client` korunur; tek owner setup guard ile sağlanır |
| `clients` | CRM client ve portal auth link | `clients` | `auth_user_id` nullable; invitation kabulünde transaction ile kurulur |
| `client_activities` | Client timeline | `client_activities` | Sahiplik `owner_user_id` ile |
| `projects` | Proje kayıtları, progress, quota, cover image | `projects` | `budget_amount` minor unit; cover image file metadata |
| `project_planning_sections` | Project planning content | `project_planning_sections` | `category` ve `sort_order` kanonik |
| `project_revisions` | Portal revision requests | `project_revisions` | Quota ve project/client eşleşmesi service transaction içinde |
| `tasks` | Task/kanban | `tasks` | Status kanoniği `todo|in_progress|done|cancelled`; legacy `completed` normalize edilir |
| `calendar_events` | Takvim | `calendar_events` | Visible range indexleri |
| `finance_transactions` | Gelir/gider | `finance_transactions` | Amount integer minor unit |
| `proposals` | Teklifler | `proposals` veya açık archive eşleniği | Veri korunur; UI/CRUD release-blocker değildir |
| `contracts` | Sözleşmeler | `contracts` veya açık archive eşleniği | Veri korunur; UI/CRUD release-blocker değildir |
| `invoices` | Faturalar | `invoices` veya açık archive eşleniği | Amount/tax minor unit; UI/CRUD release-blocker değildir |
| `subscriptions` | Recurring expenses | `subscriptions` veya açık archive eşleniği | Billing cycle enum korunur; UI/CRUD release-blocker değildir |
| `daily_logs` | Aktif journal ekranı | `journal_entries` | `journals` ile birleştirilecek |
| `journals` | Legacy AI journal | `journal_entries` archive/import source | Aynı güne denk gelen kayıtlar merge rule ile |
| `chat_sessions` | AI chat session | `chat_sessions` | Browser DB erişimi kaldırılır |
| `chat_messages` | AI chat messages | `chat_messages` | Message role enum validate edilir |
| `document_embeddings` | pgvector RAG | Archive table veya import dışı | İlk release'te operational vector search yok |
| `app_settings` | Timezone/currency/AI settings | `user_preferences` + server-side AI secret config | `api_key` taşınmaz; yalnızca migration warning/count |
| `storage.objects` bucket `avatars` | Avatar dosyaları | `files` + `/uploads/avatars` | Public read yerine authorized handler veya static controlled path |
| `storage.objects` bucket `project-assets` | Project cover/assets | `files` + `/uploads/project-assets` | MIME/magic byte/size checks |
| `neta_internal.internal_auth_creations` | Service-role guarded auth creation handshake | Kaldırılır | Better Auth invite/setup flow ile gerek kalmaz |

Hedefte kaynaktan türemeyen yeni tablolar:

| Hedef model | Amaç | Faz 0 kararı |
| --- | --- | --- |
| `instance_settings` | Instance adı, support ve genel davranış | Singleton instance config |
| `instance_branding` | Logo, renk, mode ve radius ayarları | Poyraz UI semantic token girdisi |
| `user_preferences` | Tema tercihi, timezone, currency ve UI tercihleri | Kullanıcı bazlı; secret içermez |
| `files` | Yerel dosya metadata ve güvenli relative path | İçerik `/app/data/uploads` altında |
| `portal_invitations` | Süreli ve hash'lenmiş client invite token | Better Auth client self-activation |
| `auth_audit_events` | Setup/login/logout güvenlik olayları | Mevcut SQLite model korunur |

## Enum/status baseline

Kaynak schema ve koddan görülen status/type değerleri:

- `profiles.role`: `freelancer`, `client`
- `clients.status`: `active`, `paused`, `archived`
- `clients.pipeline_stage`: `lead`, `contacted`, `proposal_sent`, `won`, `lost`
- `projects.type`: `client_project`, `side_project`
- `projects.status`: `planning`, `active`, `paused`, `completed`, `cancelled`
- `projects.progress_type`: `manual`, `auto`
- `tasks.status`: aktif kod `todo`, `in_progress`, `done`; legacy `lib/db.ts` ve portal UI'da `completed` toleransı var
- `tasks.priority`: `low`, `medium`, `high`, `urgent`
- `calendar_events.type`: `meeting`, `focus`, `deadline`, `personal`, `finance`
- `finance_transactions.type`: `income`, `expense`
- `finance_transactions.payment_status`: `planned`, `pending`, `paid`, `cancelled`
- `proposals.status`: `draft`, `sent`, `accepted`, `rejected`
- `contracts.status`: `draft`, `active`, `completed`, `cancelled`
- `invoices.status`: `draft`, `sent`, `paid`, `overdue`, `cancelled`
- `subscriptions.billing_cycle`: `monthly`, `yearly`, `weekly`
- `subscriptions.status`: `active`, `cancelled`
- `client_activities.type`: `note`, `call`, `meeting`, `email`
- `project_planning_sections.category`: `overview`, `problem`, `goal`, `audience`, `scope`, `design_system`, `color_palette`, `typography`, `assets`, `notes`
- `project_revisions.status`: `pending`, `in_progress`, `completed`, `rejected`

## RLS policy matrix

Hedefte RLS yok; bu policy'ler service/repository authorization testlerine çevrilecek:

| Resource | Freelancer policy | Client policy | Hedef test |
| --- | --- | --- | --- |
| `profiles` | Own profile CRUD | Own profile read | Role-based route access and profile owner filter |
| `clients` | Own client CRUD | Own linked client read | Cross-owner UUID reject |
| `projects` | Own project CRUD | Linked client projects read | Client cannot read unrelated project |
| `tasks` | Own task CRUD | Public tasks of linked projects read | Client cannot see private task |
| `project_planning_sections` | Own section CRUD | Sections of linked projects read | Category/sort order query |
| `project_revisions` | Manage project revisions | Insert/view own revisions | Quota and project/client relation |
| `calendar_events` | Own event CRUD | None | Client role reject |
| `finance_transactions` | Own transaction CRUD | None | Client role reject |
| `daily_logs`/`journals` | Own journal CRUD | None | Client role reject |
| `chat_sessions/messages` | Own chat CRUD | None | Session owner filter |
| `document_embeddings` | Own embedding CRUD | None | First release archive/no runtime search |
| `app_settings` | Own settings CRUD | None | Secret never returned to client |
| `storage.objects/avatars` | Public select, owner write | None | Authorized upload and safe public avatar URL |
| `storage.objects/project-assets` | Owner/service-role path access | Portal read via project relation | File route validates owner/project relation |

## Production audit sorguları

Bu sorgular Supabase SQL Editor veya read-only connection ile çalıştırılmalı. Secret değerleri loglanmamalı.

2026-07-16 durumu: workspace'te yalnızca `.env.example` bulunduğu için bu sorgular production üzerinde çalıştırılmamıştır. Kaynak schema envanteri 19 ürün/public tablo, 1 internal tablo ve 2 storage bucket olarak doğrulanmıştır; gerçek satır/dosya sayıları açık kalmıştır.

```sql
select 'profiles' as table_name, count(*) from public.profiles
union all select 'clients', count(*) from public.clients
union all select 'projects', count(*) from public.projects
union all select 'tasks', count(*) from public.tasks
union all select 'calendar_events', count(*) from public.calendar_events
union all select 'finance_transactions', count(*) from public.finance_transactions
union all select 'daily_logs', count(*) from public.daily_logs
union all select 'journals', count(*) from public.journals
union all select 'project_planning_sections', count(*) from public.project_planning_sections
union all select 'project_revisions', count(*) from public.project_revisions
union all select 'chat_sessions', count(*) from public.chat_sessions
union all select 'chat_messages', count(*) from public.chat_messages
union all select 'document_embeddings', count(*) from public.document_embeddings
union all select 'app_settings', count(*) from public.app_settings;

select role, count(*) from public.profiles group by role order by role;
select status, count(*) from public.clients group by status order by status;
select pipeline_stage, count(*) from public.clients group by pipeline_stage order by pipeline_stage;
select status, type, progress_type, count(*) from public.projects group by status, type, progress_type order by status, type, progress_type;
select status, priority, count(*) from public.tasks group by status, priority order by status, priority;
select type, count(*) from public.calendar_events group by type order by type;
select type, currency, payment_status, count(*) from public.finance_transactions group by type, currency, payment_status order by type, currency, payment_status;
select status, count(*) from public.proposals group by status order by status;
select status, count(*) from public.contracts group by status order by status;
select status, count(*) from public.invoices group by status order by status;
select billing_cycle, status, count(*) from public.subscriptions group by billing_cycle, status order by billing_cycle, status;
select category, count(*) from public.project_planning_sections group by category order by category;
select status, count(*) from public.project_revisions group by status order by status;
select count(*) filter (where api_key is not null and btrim(api_key) <> '') as settings_with_api_key from public.app_settings;
```

Storage audit:

```sql
select bucket_id, count(*) as file_count, coalesce(sum(metadata->>'size')::bigint, 0) as total_size
from storage.objects
where bucket_id in ('avatars', 'project-assets')
group by bucket_id
order by bucket_id;

select p.id, p.avatar_url
from public.profiles p
where p.avatar_url is not null and p.avatar_url <> '';

select p.id, p.cover_image_path
from public.projects p
where p.cover_image_path is not null and p.cover_image_path <> '';
```

Constraint/index/policy audit:

```sql
select conrelid::regclass as table_name, conname, contype, pg_get_constraintdef(oid) as definition
from pg_constraint
where connamespace in ('public'::regnamespace)
order by table_name::text, conname;

select schemaname, tablename, indexname, indexdef
from pg_indexes
where schemaname in ('public', 'neta_internal')
order by schemaname, tablename, indexname;

select schemaname, tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname in ('public', 'storage')
order by schemaname, tablename, policyname;
```

## Merge kuralları

`journals` + `daily_logs`:

- Hedef tablo adı: `journal_entries`.
- Aynı user + aynı date/log_date günü için önce `daily_logs` kanonik kabul edilir.
- `journals.content` doluysa `journal_entries.note` içine conflict suffix veya related legacy note olarak eklenir.
- `journals.ai_*` alanları ilk release'te ayrı `journal_ai_metadata` JSON alanına veya archive tablosuna taşınır; runtime AI analiz için şart değildir.

Task status:

- `completed` değerleri import sırasında `done` olarak normalize edilir.
- Tanınmayan status varsa import fail eder; silent fallback yok.

Planning section:

- Kaynak `category` korunur.
- UI'da görülen `type` referansı import alanı değildir.
- Kaynak `sort_order` korunur.
- `order_index` hiçbir hedef query'de kullanılmaz.

Money:

- `amount numeric(12,2)` ve `budget_amount numeric(12,2)` hedefte `amount_minor integer` veya `budget_amount_minor integer`.
- Currency her row'da ISO-like text olarak korunur; kullanıcı default currency migration sırasında sadece fallback.
