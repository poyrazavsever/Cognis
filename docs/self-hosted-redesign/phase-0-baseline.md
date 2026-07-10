---
title: Phase 0 Baseline
description: Supabase ve Poyraz UI ayrımı başlamadan önce mevcut Neta uygulamasının repo, davranış, bağımlılık ve risk baseline'ı.
status: active
last_updated: 2026-07-10
---

# Phase 0 Baseline

Bu dosya, self-hosted redesign başlamadan önce repo üzerinden doğrulanabilen mevcut durumu sabitler. Production Supabase verisine erişim gerektiren satır sayıları, storage boyutları, gerçek kullanıcı akışı ekran kayıtları ve backup doğrulaması bu dokümanda tamamlanmış sayılmaz; bunlar `phase-0-data-mapping.md` içindeki production audit sorguları ve checklist istisnalarıyla takip edilir.

## Kanıt komutları

Bu baseline aşağıdaki local komutlarla oluşturuldu:

```powershell
git status --short
rg --files
rg --files .\app
rg -n 'supabase|poyraz-ui|createClient|service_role|serviceRole|NEXT_PUBLIC_SUPABASE|from\(' app components lib config hooks --glob '*.ts' --glob '*.tsx'
rg -n 'poyraz-ui' app components --glob '*.ts' --glob '*.tsx'
rg -n 'create table if not exists public\.|create table if not exists neta_internal\.|alter table public\..*enable row level security|create policy|create or replace function|create index if not exists|create trigger|insert into storage\.buckets' supabase\migrations supabase\schema.sql
rg -n 'select\("\*"\)|select\(''\*''\)|order_index|sort_order|completed|done|\.limit\(|\.range\(|useTransition|useOptimistic|startTransition|isPending|pending' app lib components --glob '*.ts' --glob '*.tsx'
```

## Repo durumu

- Next.js App Router kullanılıyor.
- Ayrı backend uygulaması yok; server davranışı `app` altındaki Server Components, Server Actions ve Route Handlers içinde.
- Supabase şu anda auth, session refresh, RLS ile authorization, Postgres schema, RPC aggregate, storage ve service-role tabanlı kullanıcı/dosya işlemlerini taşıyor.
- Poyraz UI uygulama shell, auth, dashboard, portal ve loading ekranlarına yayılmış durumda.
- Dockerfile, Compose, migration runner, backup/restore script'i ve test harness yok.
- `package.json` içinde `typecheck` veya test script'i yok; typecheck local TypeScript binary ile çalıştırılmalı.
- Doküman olarak Faz 0 başlangıcında eklenmiş dosyalar: `docs/18-self-hosted-redesign-plani.md`, `docs/19-self-hosted-redesign-checklist.md`.

## Route envanteri

Route group'lar:

- `(dashboard)`: freelancer dashboard, core OS ekranları ve business ekranları.
- `portal`: client portal.
- `api`: AI, health ve internal route handler'ları.
- Top-level auth: `login`, `register`.

Sayfa/layout/loading/action dosyaları:

| Dosya | Rol |
| --- | --- |
| `app/layout.tsx` | Root layout, manifest, global toaster |
| `app/login/page.tsx` | Login ekranı |
| `app/login/actions.ts` | Login, signup, sign out Server Actions |
| `app/register/page.tsx` | İlk admin/freelancer setup ekranı |
| `app/(dashboard)/layout.tsx` | Dashboard auth guard ve shell |
| `app/(dashboard)/page.tsx` | Dashboard Server Component |
| `app/(dashboard)/dashboard-client.tsx` | Dashboard client UI |
| `app/(dashboard)/loading.tsx` | Dashboard loading skeleton |
| `app/(dashboard)/analytics/page.tsx` | Analytics Server Component |
| `app/(dashboard)/analytics/analytics-client.tsx` | Analytics client UI |
| `app/(dashboard)/analytics/loading.tsx` | Analytics loading skeleton |
| `app/(dashboard)/business/invoices/page.tsx` | Invoices Server Component |
| `app/(dashboard)/business/invoices/invoices-client.tsx` | Invoices client UI |
| `app/(dashboard)/business/proposals/page.tsx` | Proposals Server Component |
| `app/(dashboard)/business/proposals/proposals-client.tsx` | Proposals client UI |
| `app/(dashboard)/business/subscriptions/page.tsx` | Subscriptions Server Component |
| `app/(dashboard)/business/subscriptions/subscriptions-client.tsx` | Subscriptions client UI |
| `app/(dashboard)/calendar/page.tsx` | Calendar Server Component |
| `app/(dashboard)/calendar/calendar-client.tsx` | Calendar client UI |
| `app/(dashboard)/calendar/actions.ts` | Calendar mutation Server Actions |
| `app/(dashboard)/chat/page.tsx` | AI chat client-heavy screen |
| `app/(dashboard)/clients/page.tsx` | Clients Server Component |
| `app/(dashboard)/clients/clients-client.tsx` | Clients client UI |
| `app/(dashboard)/clients/actions.ts` | Client mutation Server Actions |
| `app/(dashboard)/clients/loading.tsx` | Clients loading skeleton |
| `app/(dashboard)/clients/[id]/page.tsx` | Client detail Server Component |
| `app/(dashboard)/clients/[id]/client-detail-client.tsx` | Client detail client UI |
| `app/(dashboard)/clients/[id]/actions.ts` | Client activity mutation Server Actions |
| `app/(dashboard)/finance/page.tsx` | Finance Server Component |
| `app/(dashboard)/finance/finance-client.tsx` | Finance client UI |
| `app/(dashboard)/finance/actions.ts` | Finance mutation Server Actions |
| `app/(dashboard)/journal/page.tsx` | Daily log Server Component |
| `app/(dashboard)/journal/journal-client.tsx` | Daily log client UI |
| `app/(dashboard)/journal/actions.ts` | Daily log mutation Server Actions |
| `app/(dashboard)/projects/page.tsx` | Projects Server Component |
| `app/(dashboard)/projects/projects-client.tsx` | Projects client UI |
| `app/(dashboard)/projects/actions.ts` | Project/planning/revision mutation Server Actions |
| `app/(dashboard)/projects/loading.tsx` | Projects loading skeleton |
| `app/(dashboard)/projects/[id]/page.tsx` | Project detail Server Component |
| `app/(dashboard)/projects/[id]/project-detail-client.tsx` | Project detail client UI |
| `app/(dashboard)/projects/[id]/loading.tsx` | Project detail loading skeleton |
| `app/(dashboard)/settings/page.tsx` | Settings client screen |
| `app/(dashboard)/settings/actions.ts` | Profile/password mutation Server Actions |
| `app/(dashboard)/tasks/page.tsx` | Tasks Server Component |
| `app/(dashboard)/tasks/tasks-client.tsx` | Tasks kanban/client UI |
| `app/(dashboard)/tasks/actions.ts` | Task mutation Server Actions |
| `app/(dashboard)/tasks/loading.tsx` | Tasks loading skeleton |
| `app/portal/layout.tsx` | Client portal auth guard and shell |
| `app/portal/page.tsx` | Portal home |
| `app/portal/projects/page.tsx` | Portal projects list |
| `app/portal/projects/[id]/page.tsx` | Portal project detail Server Component |
| `app/portal/projects/[id]/portal-project-client.tsx` | Portal project detail client UI |
| `app/portal/projects/[id]/actions.ts` | Portal revision Server Action |
| `app/portal/revisions/page.tsx` | Portal revisions list |
| `app/portal/tasks/page.tsx` | Portal tasks list |

Route Handlers:

| Route | Dosya | Mevcut sorumluluk |
| --- | --- | --- |
| `POST /api/chat` | `app/api/chat/route.ts` | Chat message persistence, settings read, AI response |
| `POST /api/create-client-user` | `app/api/create-client-user/route.ts` | Freelancer'ın client auth user oluşturması |
| `POST /api/finance-analysis` | `app/api/finance-analysis/route.ts` | Finance transactions üzerinden AI analiz |
| `GET /api/health` | `app/api/health/route.ts` | Basic liveness JSON |
| `POST /api/project-risk` | `app/api/project-risk/route.ts` | Project/tasks üzerinden AI risk analizi |

## Supabase kullanım envanteri

Browser Supabase client kullanan dosyalar:

- `app/(dashboard)/chat/page.tsx`: session/message CRUD ve `auth.getUser`.
- `app/(dashboard)/settings/page.tsx`: profile/settings read ve `app_settings` upsert.
- `lib/supabase/client.ts`: `createBrowserClient` factory.

Server Supabase client kullanan başlıca dosyalar:

- Auth/setup: `app/login/actions.ts`, `app/register/page.tsx`, `lib/auth/first-admin-setup.ts`, `lib/supabase/server.ts`, `lib/supabase/middleware.ts`.
- Dashboard reads: `app/(dashboard)/page.tsx`, `analytics/page.tsx`, `clients/page.tsx`, `clients/[id]/page.tsx`, `projects/page.tsx`, `projects/[id]/page.tsx`, `tasks/page.tsx`, `calendar/page.tsx`, `finance/page.tsx`, `journal/page.tsx`, business pages.
- Dashboard mutations: `clients/actions.ts`, `clients/[id]/actions.ts`, `projects/actions.ts`, `tasks/actions.ts`, `calendar/actions.ts`, `finance/actions.ts`, `journal/actions.ts`, `settings/actions.ts`.
- Portal reads/mutations: `app/portal/**/*.tsx`, `app/portal/projects/[id]/actions.ts`.
- AI/routes: `app/api/chat/route.ts`, `app/api/finance-analysis/route.ts`, `app/api/project-risk/route.ts`, `lib/ai/embeddings.ts`.

Service-role kullanımı:

- `lib/supabase/admin.ts`: `SUPABASE_SERVICE_ROLE_KEY` ile admin client.
- `lib/auth/internal-users.ts`: `request_internal_auth_creation` RPC ve Supabase Admin `auth.admin.createUser`.
- `app/api/create-client-user/route.ts`: internal user creation flow.
- `app/(dashboard)/projects/actions.ts`: `project-assets` upload için service-role client.
- `app/(dashboard)/projects/page.tsx` ve `app/(dashboard)/projects/[id]/page.tsx`: project-assets public URL/asset erişim path'i.
- `app/(dashboard)/settings/actions.ts`: avatars upload ve public URL üretimi.

RPC kullanımı:

- `is_first_admin_setup_available`: first admin setup guard.
- `request_internal_auth_creation`: service-role guard ile internal user creation.
- `match_documents`: pgvector similarity search.
- `get_dashboard_metrics`: dashboard aggregate.
- `get_analytics_metrics`: analytics aggregate.

Storage kullanımı:

- `avatars`: public avatar URL'leri; settings flow.
- `project-assets`: private project cover/assets; path convention user id folder'ı üzerinden.

## Poyraz UI import envanteri

Poyraz UI kullanılan dosya sayısı: 36 uygulama/component dosyası.

Kullanılan namespace'ler:

- `poyraz-ui/atoms`: `Badge`, `Button`, `Card`, `CardContent`, `Input`, `Label`, `Textarea`, `Typography`.
- `poyraz-ui/molecules`: `Dialog*`, `DropdownMenu*`, `Select*`, `Tabs*`, `toast`, `Toaster`.
- `poyraz-ui/organisms`: dashboard ve portal shell navigation bileşenleri.

Yoğun kullanım alanları:

- Layout shell: `components/layout/dashboard-shell.tsx`, `components/layout/portal-shell.tsx`.
- Auth: `components/auth/*`, `app/login/page.tsx`, `app/register/page.tsx`.
- Dashboard features: clients, projects, tasks, calendar, finance, journal, analytics, business.
- Portal: portal home, projects, tasks, revisions.
- Loading states: birden fazla loading skeleton dosyası Poyraz `Card`/`CardContent` kullanıyor.

Replacement yönü:

- Atoms doğrudan `components/ui` primitive'lerine taşınacak.
- Molecules içindeki dialog/select/dropdown/tabs gibi davranışlı bileşenler tek internal UI katmanında izole edilecek.
- Organisms shell'leri Faz 3'te Neta shell olarak yeniden yazılacak.
- `toast`/`Toaster` tek internal feedback API'sine taşınacak.

## Internal UI durumu

Mevcut `components/ui` dizininde şu bileşenler var:

- Aktif internal primitive adayları: `button.tsx`, `card.tsx`, `checkbox.tsx`, `dialog.tsx`, `dropdown-menu.tsx`, `form.tsx`, `icon.tsx`, `input.tsx`, `label.tsx`, `select.tsx`, `separator.tsx`, `skeleton.tsx`, `textarea.tsx`, `toast.tsx`, `toaster.tsx`.
- Geçiş yardımcıları: `pending-link.tsx`, `pending-submit-button.tsx`, `offline-indicator.tsx`.
- Not: `components/ui/pending-submit-button.tsx` hâlâ `poyraz-ui/atoms` `Button` import ediyor; UI katmanı tamamen bağımsız değil.

## Dexie/IndexedDB ve PWA baseline

Dexie:

- `lib/db.ts` içinde IndexedDB prototipi var.
- `rg` sonucunda aktif app import'u görünmüyor.
- Tip düzeyi eski task status değeri `completed` içeriyor; yeni task kanoniğiyle uyumsuz.
- Hedef redesign'da kaldırılacak veya Faz 0 sonrası ayrı bir cleanup commit'inde silinecek.

PWA:

- `next.config.ts` içinde `@ducanh2912/next-pwa` aktif.
- Production build'de `public` altına service worker asset'leri üretmesi beklenir.
- `app/layout.tsx` manifest olarak `/manifest.json` tanımlıyor.
- Offline-first veri sync hedef dışı olduğu için ilk self-hosted release'te PWA kaldırma kararı ADR'de sabitlenmiştir.

## Dependency sınıflandırması

Kalacak:

- `next`, `react`, `react-dom`, `typescript`, `eslint`, `eslint-config-next`
- `zod`, `react-hook-form`, `@hookform/resolvers`
- `date-fns`, `clsx`, `tailwind-merge`
- `lucide-react`
- AI provider paketleri, yalnızca server tarafına izole edilmek şartıyla

Kaldırılacak:

- `@supabase/ssr`, `@supabase/supabase-js`: runtime Supabase bağımlılığı kaldırılacak.
- `poyraz-ui`: internal UI ile değiştirilecek.
- `dexie`, `dexie-react-hooks`: aktif akışta kullanılmıyor.
- `@ducanh2912/next-pwa`: ilk self-hosted release'te offline/PWA kapsam dışı.
- `shadcn`: runtime ihtiyacı yoksa kaldırılacak.
- Duplicate/unused Radix veya umbrella `radix-ui` paketleri, internal UI kararından sonra temizlenecek.

Değerlendirilecek:

- `@base-ui/react`: tek headless primitive katmanı olarak kalabilir veya Radix ile karşılaştırılıp kaldırılabilir.
- `@radix-ui/*`: internal UI behavior için seçilecek tek headless katmana göre azaltılacak.
- `framer-motion`: kritik UX değeri yoksa kaldırılacak; varsa reduced-motion standardıyla izole edilecek.
- `recharts`: analytics UI redesign kapsamına göre kalabilir.
- `@iconify/react`: lucide-react yeterliyse kaldırılacak.
- `tailwindcss-animate`: animasyon stratejisine göre değerlendirilecek.
- `uuid` ve `@types/uuid`: Web Crypto UUID yeterliyse kaldırılacak.

## Davranış baseline matrisi

Bu davranışlar yeni sistemde korunacak veya bilinçli olarak iyileştirilecek:

| Akış | Mevcut davranış | Redesign notu |
| --- | --- | --- |
| İlk admin setup | `/register`, `is_first_admin_setup_available`, signup sonrası profile role `freelancer` | Better Auth setup route'u public registration'ı ilk kullanıcıdan sonra kapatacak |
| Login/logout | Supabase `signInWithPassword`, `signOut`, middleware session refresh | Better Auth DB session ve server-side session helper |
| Client portal hesabı | Freelancer route handler üzerinden client auth user yaratıyor | Invite token ve client self-activation tercih edilecek |
| Client CRUD | Server Actions + Supabase RLS | Service/repository owner filter |
| Project CRUD | Server Actions, cover image storage, planning sections | Local storage metadata + transaction boundary |
| Task kanban | Client optimistic-ish state, Server Actions, `done` kanoniği | Transaction içinde auto progress ve rollback testleri |
| Calendar | Server read + Server Actions | Visible range/pagination zorunlu |
| Finance | Server read + Server Actions, decimal amount | Minor unit integer standardı |
| Business docs | Page-level read-only/dummy-ish client UIs | Faz 5'te gerçek mutation ve constraints gözden geçirilecek |
| Journal | `daily_logs` aktif; `journals` legacy | `journal_entries` kanonik hedef |
| Analytics/dashboard | Supabase RPC aggregate | Drizzle/SQL aggregate repository |
| AI chat | Browser Supabase client + `/api/chat` route | Browser DB erişimi kaldırılacak |
| Settings/profile | Browser Supabase client + Server Action mix | Server-only settings service |
| Portal revisions | UI warning var, server quota enforcement eksik | Server action quota ve ownership negatif test |

## Bilinen problem baseline

Regression maddesine çevrilecek mevcut problemler:

- Portal project detail `project_planning_sections` için `order_index` ile order ediyor; schema alanı `sort_order`.
- Project risk route `completed` task status sayıyor; aktif kanonik status `done`.
- Portal project client UI section tipi olarak `type` okuyor; schema alanı `category`.
- Revision quota sadece UI tarafında uyarı olarak var; server action `createRevisionRequest` quota uygulamıyor.
- Portal revision insert policy project/client eşleşmesini tam doğrulamıyor; client kendi `client_id` değeriyle başka projeye request deneyebilir.
- `app/(dashboard)/chat/page.tsx` ve `app/(dashboard)/settings/page.tsx` browser Supabase client ile auth/veri erişimi yapıyor.
- Bazı listeler pagination yerine tüm kullanıcı datasını veya geniş tarih aralığını çekiyor.
- AI API key `app_settings.api_key` içinde düz metin tutuluyor ve settings client'ına geri okunuyor.

## Performans baseline

Local static baseline:

- Dashboard ve analytics aggregate RPC ile payload azaltılmış; ancak bazı detail/list sayfalarında birden fazla Supabase query paralel çalışıyor.
- Client JS yüzeyi ağır: Poyraz UI, motion, charts, AI chat, kanban ve portal client bileşenleri geniş kullanımda.
- `app/api/chat/route.ts` kullanıcı context'i için `tasks`, `projects`, `finance_transactions`, `daily_logs` sorgularında explicit `.limit()` kullanıyor.
- `app/(dashboard)/journal/page.tsx` 180 kayıt limiti kullanıyor.
- `app/(dashboard)/page.tsx` recent projects/clients için 5 kayıt limiti kullanıyor.
- Calendar visible range filtresi yerine current implementation daha geniş veri çekme riski taşıyor; Faz 4'te görünür aralık zorunlu olacak.

Ölçülmemiş production baseline:

- Gerçek TTFB, payload boyutu, route client JS boyutu ve click-to-feedback metrikleri production veya seeded local environment ayağa kaldırılmadan tamamlanmış sayılmaz.
- Bu metrikler Faz 1 spike container'ı ve import rehearsal sonrası tekrar ölçülecek.

## Local doğrulama sonuçları

2026-07-10 local workspace sonuçları:

| Komut | Sonuç | Not |
| --- | --- | --- |
| `npm.cmd run lint` | Başarısız | 34 error, 25 warning. Mevcut baseline: `any`, React `setState-in-effect`, unused import, unescaped entities, `<img>` warnings. Faz 0 doküman değişiklikleri app code değiştirmedi. |
| `.\node_modules\.bin\tsc.cmd --noEmit` | Başarılı | TypeScript typecheck temiz. |
| `npm.cmd run build` | Başarılı | Next.js 16.2.7 Turbopack production build geçti. Edge runtime static generation warning'i mevcut build uyarısı olarak görüldü. |

Local environment:

- Node: `v24.11.1`
- npm: `11.6.2`
- CPU identifier: `Intel64 Family 6 Model 167 Stepping 1, GenuineIntel`
- Logical processor count: `16`
- Disk root: `D:\`
- RAM: WMI/CIM erişimi sandbox içinde reddedildiği için ölçülemedi.

## Faz 0 istisnaları

Production erişimi gerektiren ve bu local çalışmada tamamlanmayan kalemler:

- Production Supabase backup alma ve restore doğrulama.
- Production tablo/status dağılımlarını sayma.
- Storage bucket dosya sayısı, toplam boyut ve orphan path raporu.
- Gerçek kullanıcı akışı ekran kayıtları.
- Gerçek route timing, payload ve bundle ölçümleri.
- Ürün sahibi onayı gereken ADR ve kritik akış matrisi.
