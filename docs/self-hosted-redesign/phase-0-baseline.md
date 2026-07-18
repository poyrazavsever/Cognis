---
title: Phase 0 v3 Baseline
description: Supabase çıkışı ve Poyraz UI v3 dönüşümü başlamadan önce güncel repo, route, davranış, dependency ve doğrulama baseline'ı.
status: active
last_updated: 2026-07-16
---

# Phase 0 v3 Baseline

Bu belge `neta-self-hosted-v3-master-plan.md` için Faz 0 kanıtıdır. Önceki 2026-07-10 baseline'ı; Better Auth, SQLite runtime, Docker ve yeni shell eklenmeden önceki durumu anlattığı için bu içerikle güncellenmiştir.

## 1. İnceleme kapsamı

İncelenen alanlar:

- Next.js route, layout, loading ve action yüzeyi
- Better Auth ve SQLite runtime
- Supabase browser/server/service-role kullanımları
- Supabase kaynak schema, RLS, RPC ve storage kapsamı
- Poyraz UI ve local UI component sınırı
- Dependency kullanımı
- Kritik freelancer ve client portal akışları
- Typecheck, lint, build ve smoke script sonuçları

İnceleme dalı ve commit:

```text
branch: codex-self-hosted-redesign-faz2
HEAD: f5d89e8
```

## 2. Sayısal repo baseline'ı

| Ölçüm | Güncel değer |
| --- | ---: |
| Uygulama sayfası (`page.tsx`) | 22 |
| Layout | 3 |
| Route Handler | 8 |
| Server Action dosyası | 10 |
| Export edilen async Server Action | 33 |
| Loading boundary | 6 |
| Client Component | 40 |
| Uygulama/server/script TS/TSX/MJS satırı | yaklaşık 16.014 |
| Poyraz UI import eden app/component dosyası | 26 |
| Supabase entegrasyonu içeren app/lib/server dosyası | 40 |
| Browser Supabase client kullanan ekran | 2 |
| Production dependency | 47 |
| Dev dependency | 12 |
| Supabase kaynak tablo | 20; 19 ürün/public + 1 internal |
| Supabase storage bucket | 2 |
| Mevcut SQLite tablo | 10; auth/setup/audit/runtime |

## 3. Güncel çalışma zamanı

Repo artık iki mimariyi aynı anda içeriyor.

### Yeni self-hosted temel

- Better Auth email/password ve DB session
- `better-sqlite3`
- Drizzle schema ve migration
- İlk freelancer setup lock'u
- `app_profiles`
- Portal invitation tablo iskeleti
- Auth audit events
- SQLite WAL/foreign key/busy timeout ayarları
- Health live/ready endpoint'leri
- Migration, backup ve restore script'leri
- Next.js standalone Dockerfile
- Tek persistent volume kullanan Compose tanımı

### Henüz taşınmamış feature runtime

- Müşteriler
- Client activities
- Projeler ve planning sections
- Görevler
- Takvim
- Finans
- Günlük
- Analytics/dashboard RPC
- Chat session/message
- AI settings/context
- Client portal verileri ve revision mutation
- Avatar ve project asset storage

Bu feature'lar hâlâ Supabase Auth principal'ı, Postgres, RLS ve Storage bekliyor.

## 4. Kritik hibrit-auth baseline'ı

Dashboard ve portal layout'ları Better Auth session kullanıyor:

- `app/(dashboard)/layout.tsx` → `requireFreelancer()`
- `app/portal/layout.tsx` → `requireClientUser()`

Alt feature sayfaları ve action'lar ise Supabase `auth.getUser()` kullanıyor. Better Auth cookie'si Supabase session üretmediği için güncel dal uçtan uca çalışan tek auth sistemi sunmuyor.

Beklenen mevcut sonuç:

- Better Auth ile giriş yapan freelancer layout guard'ını geçebilir.
- Aynı kullanıcı Supabase tabanlı page/action içinde oturumsuz görünür.
- Feature reads/mutations boş sonuç, redirect, `null` veya auth hatası verebilir.
- Better Auth client profile oluşturacak invitation consume akışı henüz yoktur.
- Eski `/api/create-client-user` route'u Supabase Auth user üretir ve yeni portal layout'ının beklediği SQLite profile'ı üretmez.

Bu durum redesign sırasında korunacak davranış değil, ortadan kaldırılması gereken geçiş kırığıdır.

## 5. Route ve özellik envanteri

### 5.1. Auth ve platform

| Route | Durum | Not |
| --- | --- | --- |
| `/login` | Var | Better Auth Server Action kullanıyor |
| `/register` | Var | İlk freelancer setup akışı |
| `/forgot-password` | Yok | Login ekranında link var; gerçek route/akış yok |
| `/api/auth/[...all]` | Var | Better Auth handler |
| `/api/health` | Var | Edge basic health |
| `/api/health/live` | Var | Process liveness |
| `/api/health/ready` | Var | SQLite/data dir/migration readiness |

### 5.2. Freelancer ekranları

| Route | Mevcut yetenek | Veri kaynağı | v3 kararı |
| --- | --- | --- | --- |
| `/` | KPI, trend, recent project/client | Supabase RPC + tables | Aggregate repository |
| `/analytics` | Dönemsel finans/görev analizi | Supabase RPC | SQLite aggregate repository |
| `/clients` | Liste, filtre, pipeline, CRUD | Supabase | İlk core vertical slice |
| `/clients/[id]` | Detay ve activity timeline | Supabase | Owner-filtered service |
| `/projects` | Liste, filtre, CRUD, cover | Supabase + Storage | Local file metadata |
| `/projects/[id]` | Planning, tasks, finance, revisions | Supabase + Storage | Transaction/service sınırı |
| `/tasks` | Liste/kanban, CRUD, status | Supabase | Task/project transaction |
| `/calendar` | Event CRUD | Supabase | Visible-range query |
| `/finance` | Income/expense CRUD | Supabase | Integer minor unit |
| `/journal` | Daily log CRUD | Supabase `daily_logs` | `journal_entries` |
| `/chat` | AI session/message UI | Browser Supabase + API | Server-only chat service |
| `/settings` | Profil, avatar, AI key, password | Browser/server Supabase | Better Auth + settings service |

### 5.3. Business ekranları

| Route | Güncel durum | İlk release kararı |
| --- | --- | --- |
| `/business/proposals` | Read + ekleme dialog taslağı; gerçek mutation yok | Release-blocker değil |
| `/business/invoices` | Read + ekleme dialog taslağı; gerçek mutation yok | Release-blocker değil |
| `/business/subscriptions` | Read + ekleme dialog taslağı; gerçek mutation yok | Release-blocker değil |
| Contracts | Kaynak tablo var; sayfa yok | Release-blocker değil |

Kaynak veriler import sırasında korunacak; eksik UI/CRUD Faz 7'ye bırakılacak veya navigation dışı tutulacak.

### 5.4. Client portal

| Route | Güncel yetenek | Bilinen sınır |
| --- | --- | --- |
| `/portal` | Proje KPI ve proje kartları | Hybrid auth nedeniyle veri session'ı kırık |
| `/portal/projects` | Client'a bağlı projeler | Supabase RLS'e bağlı |
| `/portal/projects/[id]` | Progress, public tasks, planning, revisions | `order_index`/`sort_order` uyumsuzluğu |
| `/portal/tasks` | Public görevler | Eski `completed` toleransı var |
| `/portal/revisions` | Revision geçmişi | Genel mesajlaşma yok |
| `/portal/settings` | Yok | Shell hesap menüsü bu route'a link üretiyor |

### 5.5. AI ve internal API

| Route | Sorumluluk | v3 riski/kararı |
| --- | --- | --- |
| `POST /api/chat` | Context oluşturma ve streaming chat | Supabase session/data ve client-supplied key |
| `POST /api/finance-analysis` | Son 30 gün finance analizi | Supabase ve düz metin API key |
| `POST /api/project-risk` | Project/task risk analizi | Owner filter RLS'e bırakılmış; `completed` uyumsuzluğu |
| `POST /api/create-client-user` | Supabase client auth user üretme | Better Auth invitation ile kaldırılacak |

## 6. Kritik kullanıcı akışı baseline'ı

| Akış | Kodda mevcut davranış | v3'te korunacak/iyileştirilecek sözleşme |
| --- | --- | --- |
| İlk admin setup | Atomic Better Auth setup lock ve freelancer profile | Korunacak; smoke/negative test eklenecek |
| Login/logout | Better Auth Server Actions | Korunacak; forgot-password eklenecek |
| Client hesabı | Eski Supabase admin route'u + yeni invitation tablo iskeleti | Süreli hash token ile self-activation |
| Client CRUD | Supabase Server Actions ve RLS | Repository owner filter |
| Project CRUD | Supabase actions, planning ve storage | Service + local file transaction sınırı |
| Task kanban | Client state + Supabase action; `done` kanoniği | Task update ve auto progress aynı transaction |
| Calendar | Tüm/ geniş event datası | Visible date range zorunlu |
| Finance | Decimal amount | Integer minor unit |
| Journal | `daily_logs` aktif, `journals` legacy | Tek `journal_entries` modeli |
| Dashboard/analytics | Supabase RPC | SQLite aggregate repository |
| Settings | Browser Supabase + localStorage API key | Server-only settings; secret browser'a dönmez |
| Portal project | RLS ile client project read | Actor/client/project explicit ilişki kontrolü |
| Portal revision | UI quota uyarısı, zayıf insert policy | Kota ve ilişki aynı transaction içinde |
| AI chat | Kullanıcı verisi cloud provider'a gönderiliyor | Açık gizlilik bildirimi ve server-only secret |

Bu tablo Faz 0 kritik davranış kaydıdır. Canlı ekran kaydı mevcut hibrit auth nedeniyle güvenilir parity kanıtı sayılmayacaktır; vertical slice kabulünde yeni ekran kayıtları alınacaktır.

## 7. Supabase kaynak envanteri

Geçiş başlangıcında bulunan ve daha sonra release ağacından kaldırılan legacy PostgreSQL setup kaydı üzerinden doğrulanan kaynak tablolar:

```text
profiles
clients
client_activities
projects
project_planning_sections
project_revisions
tasks
calendar_events
finance_transactions
daily_logs
journals
app_settings
proposals
contracts
invoices
subscriptions
chat_sessions
chat_messages
document_embeddings
neta_internal.internal_auth_creations
```

Storage bucket'ları:

- `avatars`
- `project-assets`

Kaynak RPC/trigger function yüzeyi:

- `handle_new_user`
- `set_updated_at`
- `is_first_admin_setup_available`
- `request_internal_auth_creation`
- `neta_current_jwt_role`
- `update_project_progress_on_task_change`
- `update_project_progress_on_type_change`
- `get_dashboard_metrics`
- `get_analytics_metrics`
- `match_documents`

### 7.1. Fixture satır baseline'ı

Geçiş başlangıcındaki legacy demo seed'in deterministik içeriği:

| Tablo | Satır |
| --- | ---: |
| clients | 2 |
| projects | 3 |
| tasks | 3 |
| calendar_events | 2 |
| finance_transactions | 3 |
| daily_logs | 3 |
| app_settings | 1 |

İlk legacy fixture; 1 profile, 1 settings, 2 project, 3 task, 3 finance ve 3 daily log içeriyordu. Bu seed'de `completed` task status'ü ve `daily_logs.notes` alanı gibi güncel schema ile uyumsuz legacy değerler vardı; hedef seed olarak kullanılmadı ve release ağacından kaldırıldı.

### 7.2. Production veri sayımı durumu

Workspace'te yalnızca `.env.example` vardır; read-only production Supabase bağlantısı veya export snapshot'ı bulunmamaktadır. Bu nedenle gerçek production satır sayıları, status dağılımları, bucket dosya sayıları/boyutları ve orphan path raporu ölçülmemiştir.

Çalıştırılacak sorgular `phase-0-data-mapping.md` içinde hazırdır. Bu veri gelmeden ana plandaki “Supabase tablo ve storage veri sayıları çıkarıldı” maddesi işaretlenmez.

## 8. Mevcut SQLite envanteri

Mevcut tablolar:

```text
user
session
account
verification
app_profiles
app_setup_state
portal_invitations
auth_audit_events
runtime_checks
runtime_events
```

Henüz domain tablosu yoktur. `portal_invitations` yalnızca schema düzeyindedir; davet oluşturma/kabul/revoke service ve route akışı uygulanmamıştır.

## 9. Supabase kod bağımlılığı baseline'ı

- 40 app/lib/server dosyası Supabase entegrasyonu veya helper'ı içeriyor.
- 2 client ekran browser Supabase client kullanıyor: chat ve settings.
- 33 feature page/action/route Supabase feature verisine doğrudan bağlı.
- Service-role client avatar, project asset ve client auth user oluşturmak için kullanılıyor.
- Dashboard/analytics iki RPC'ye bağlı.
- Embedding helper `match_documents` pgvector RPC'sine bağlı.

Supabase kaldırma ancak bu kullanımların tamamı service/repository/file katmanına taşındıktan sonra yapılacaktır.

## 10. Poyraz UI v3 baseline'ı

- Package manifest: `poyraz-ui@^2.1.0`
- Hedef referans: `poyraz-ui@3.0.2`
- Poyraz UI import eden dosya: 26
- Import yüzeyi: atoms ve molecules; güncel custom shell Poyraz organism kullanmıyor.
- `components/ui` altında 19 local primitive/helper dosyası var.
- Faz 3 local shell/primitive yönü ADR-0006 tarafından supersede edilmiştir.
- Hedef: generic UI için Poyraz UI v3; Neta domain componentleri Poyraz kompozisyonu.

Poyraz v3 migration sırasında local primitive dosyaları hemen topluca silinmeyecek. Her kullanım taşındıktan ve import boundary doğrulandıktan sonra duplicate dosya/dependency kaldırılacak.

## 11. Dependency baseline'ı

Doğrudan production dependency sayısı 47'dir.

Statik import taramasında aktif kullanımı bulunmayan adaylar:

- `@base-ui/react`
- `dexie-react-hooks`
- `shadcn`
- `uuid`

Çok sınırlı kullanım:

- `@iconify/react`: 1 dosya
- `framer-motion`: 1 dosya
- `next-themes`: 1 dosya

Geçiş sonrasında kaldırılacak ana gruplar:

- Supabase SDK'ları
- PWA ve Dexie
- Poyraz v3'ün gereksiz kıldığı direct Radix/Base UI/shadcn bağımlılıkları
- Aktif importu olmayan yardımcı paketler

Kanban için DnD Kit, grafikler için Recharts ve kullanılan AI provider paketleri işlevsel gerekçeyle korunabilir.

## 12. Bilinen regression ve güvenlik baseline'ı

- Portal planning query `order_index` kullanıyor; schema alanı `sort_order`.
- Portal planning UI `section.type` okuyor; schema alanı `category`.
- Project risk route `completed` sayıyor; kanonik task status `done`.
- Revision quota yalnızca UI'da kontrol ediliyor.
- Revision insert policy project-client eşleşmesini tam doğrulamıyor.
- Settings AI API key'i DB'de düz metin, browser state ve `localStorage` içinde tutuyor.
- Chat/settings browser Supabase SDK ile DB/auth erişimi yapıyor.
- Project risk tek proje sorgusu açık owner predicate taşımıyor; güvenliği RLS'e bırakıyor.
- Clients/projects/tasks/calendar/finance listelerinde genel pagination yok.
- `/forgot-password` ve `/portal/settings` link hedefleri mevcut değil.
- Business create dialog'ları gerçek mutation yapmıyor.
- Veri sorgularının bir kısmı hatayı boş liste gibi gösteriyor.

Bu maddeler `phase-0-regression-and-spike.md` içindeki regression backlog ile takip edilir.

## 13. Performans baseline'ı

- Dashboard recent project/client sorguları 5 kayıtla sınırlı.
- Journal sorgusu 180 kayıtla sınırlı.
- Chat context sorguları 12–20 kayıt arasında limit kullanıyor.
- Diğer ana liste ekranlarında `.range()` pagination görülmüyor.
- Dashboard ve analytics aggregate işlemleri Supabase RPC ile server-side yapılmış.
- En büyük client dosyaları yaklaşık 500–1.260 satır aralığında; feature UI parçalama ihtiyacı var.
- 40 Client Component ve duplicate UI runtime'ı client bundle riskini artırıyor.

Gerçek TTFB, route payload ve client JS ölçümü mevcut hibrit auth ve eksik local feature schema nedeniyle güvenilir değildir; ilgili vertical slice tamamlandığında yeniden ölçülecektir.

## 14. 2026-07-16 local doğrulama sonuçları

Ortam:

```text
Node: v24.16.0
pnpm: 11.5.1
Platform: macOS arm64
```

| Komut | Sonuç | Kanıt/not |
| --- | --- | --- |
| `npm run typecheck` | Başarılı | TypeScript hata vermedi |
| `npm run phase3:ui-boundary` | Başarılı | Tarihsel internal UI boundary script'i geçti |
| `npm run lint` | Başarısız | 32 error, 22 warning; `any`, `set-state-in-effect`, unused import, unescaped entity ve image uyarıları |
| `npm run phase1:smoke` | Başarısız | `better-sqlite3` native binding yok |
| `npm run phase2:smoke` | Çalışmadı | Faz 1 zinciri başarısız olduğu için başlanmadı; aynı native runtime'a bağlı |
| `npm run build` | Başarısız | Compile ve TypeScript geçti; page data aşamasında default `/app/data` oluşturulamadı |
| Temp `DATA_DIR` ile build | Başarısız | `/app/data` sorunu izole edildi; sonra eksik `better-sqlite3` binding'inde durdu |

Pnpm durumu:

- `pnpm ignored-builds`, `better-sqlite3`, `esbuild`, `sharp` ve `unrs-resolver` build scriptlerinin ignore edildiğini raporluyor.
- `pnpm-workspace.yaml` içindeki `allowBuilds` değerleri henüz boolean olarak kilitlenmemiş.
- Native binding düzeltilmeden SQLite smoke ve production build yeşil kabul edilemez.
- Build sırasında production varsayılanının `/app/data` olması builder aşamasında güvenli build-time path gereksinimi doğuruyor; Faz 1 hardening maddesidir.

## 15. Faz 0 tamamlanma durumu

Tamamlanan:

- Ürün kapsam kararları ADR ile kilitlendi.
- Güncel route ve özellik envanteri çıkarıldı.
- Kritik kullanıcı akışları kod davranışı ve hedef sözleşmeyle kaydedildi.
- Supabase kaynak schema, bucket, RPC ve fixture envanteri çıkarıldı.
- Source-to-target data mapping onaylandı.
- Poyraz UI v3 kararı ADR-0006 olarak güncellendi.
- Local typecheck/lint/build/smoke baseline'ı kaydedildi.

Açık dış veri:

- Production Supabase gerçek satır sayıları
- Production status dağılımları
- Storage bucket dosya sayısı ve toplam boyut
- Storage orphan path raporu

Bu dış veri kalemleri için hazır audit sorguları vardır; read-only export veya erişim sağlandığında Faz 0'ın son açık checklist maddesi kapatılacaktır.
