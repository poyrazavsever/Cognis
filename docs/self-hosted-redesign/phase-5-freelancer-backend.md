# Faz 5 — Freelancer backend geçişi

Tarih: 2026-07-16

## Kapsam

Bu faz mevcut freelancer ekranlarını yeniden tasarlamadan, çekirdek veri okuma ve mutation akışlarını Supabase'ten Better Auth + SQLite + Drizzle domain katmanına taşır.

Faz 5 kapsamı:

- profil, avatar, şifre ve AI tercih kaydı;
- müşteri listesi, CRM pipeline, detay ve aktiviteler;
- proje, planning section, yerel kapak dosyası, revizyon durumu ve proje ayarları;
- görev, takvim, finans ve günlük CRUD akışları;
- dashboard ve analytics tarih aralıklı aggregate'leri.

Portal sayfaları Faz 6'ya; chat, AI analiz route'ları ve business sayfaları Faz 7'ye aittir. Supabase import/cutover ve paketlerin fiziksel olarak kaldırılması Faz 8 kapsamındadır.

## Runtime envanteri ve yeni karşılıklar

| Modül | Eski runtime kaynağı | Yeni backend sınırı |
| --- | --- | --- |
| Ayarlar | Supabase Auth, `profiles`, `app_settings`, Storage | Better Auth API, `app_profiles`, local file service, encrypted `user_ai_settings` |
| Müşteriler | `clients`, `client_activities`, ilişkili tablo sorguları | `DomainService` + owner-scoped repository + server-side özetler |
| Projeler | `projects`, `project_planning_sections`, Supabase Storage | Domain service + local project asset + `/api/files/:id` |
| Görevler | `tasks` ve browser tarafı filtre/kanban | Domain service mutation'ları; mevcut filtre/kanban UI korunur |
| Takvim | `calendar_events` ve Supabase join'leri | Domain service + server-side relation map |
| Finans | decimal `finance_transactions` | integer minor unit + adapter'da kontrollü decimal dönüşüm |
| Günlük | `daily_logs` upsert/update | `journal_entries`, owner+tarih tekilliği |
| Dashboard | `get_dashboard_metrics` RPC | tarih aralıklı repository sorguları + domain aggregate |
| Analytics | `get_analytics_metrics` RPC | SQLite task status ve proje geliri aggregate'leri |

## Uygulanan kurallar

- Server Component ve Server Action'lar `requireFreelancerBackend()` ile Better Auth session'ından actor üretir.
- Owner kimliği formdan veya query'den alınmaz.
- Form verileri merkezi adapter yardımcılarıyla temizlenir; son domain validation Zod schema'larında yapılır.
- Update schema'ları create default'larından ayrı patch sözleşmeleridir; kısmi güncelleme status, pipeline, visibility, currency veya progress mode alanlarını sessizce varsayılana döndüremez.
- Müşteri/proje/görev ilişkileri service katmanında doğrulanır. UI yalnızca proje seçtiğinde adapter eksik client bağını owned project'ten türetir.
- Para verileri SQLite'ta minor unit olarak kalır; mevcut UI sözleşmesine girerken ve formdan çıkarken 100 tabanlı dönüşüm yapılır.
- Avatar ve proje kapağı yerel file service'in MIME, boyut, magic-byte, scope ve path politikalarından geçer.
- AI API key ayar ekranına geri okunmaz ve `localStorage`'a yazılmaz. Key AES-256-GCM ile server-side şifrelenir; runtime AI entegrasyonu Faz 7'de bu service'e bağlanacaktır.
- Dashboard tarih aralığı allowlist ile doğrulanır; RPC yerine owner-scoped SQLite sorguları kullanılır.

## Migration

`0005_brief_black_bolt.sql`, owner'a bire bir bağlı `user_ai_settings` tablosunu ekler. Provider allowlist'i database CHECK constraint'iyle de korunur. API key alanında yalnızca şifreli payload saklanır.

## Doğrulama

- `pnpm phase5:backend-boundary`: 31 Faz 5 runtime dosyasında Supabase import/env/veri erişimi olmadığını doğrular.
- `pnpm phase2:domain-smoke`: gerçek migration uygulanmış SQLite'ta CRUD, aggregate, relation invariant ve cross-owner negatiflerini doğrular.
- `pnpm phase5:smoke`: yukarıdaki kontrollerin yanında Better Auth owner cookie ile 11 kritik freelancer route'unu SSR eder.
- `pnpm typecheck`: başarılı.
- Faz 5 adapter ve backend dosyalarında hedefli ESLint: başarılı.
- `pnpm build`: başarılı.
- `git diff --check`: başarılı.

Repo genel lint'i, Faz 5'in değiştirmediği legacy client component ve Faz 6–7 dosyalarındaki mevcut borçlar nedeniyle release genelinde açık kalır.
