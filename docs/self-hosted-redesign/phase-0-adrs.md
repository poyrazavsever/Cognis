---
title: Phase 0 ADR Set
description: Self-hosted redesign için Faz 0'da kilitlenen mimari kararlar.
status: active
last_updated: 2026-07-16
---

# Phase 0 ADR Set

Bu dosya Faz 0 mimari karar kayıtlarını tutar. Kararlar, implementation fazlarında tersine kanıt çıkmadığı sürece geçerlidir. Faz 1 spike'ı bu kararların teknik olarak çalıştığını kanıtlayacak ilk uygulama işidir.

## ADR-0001: SQLite + better-sqlite3

Status: Accepted for redesign baseline.

Karar:

- Hedef self-hosted runtime tek instance olacak.
- Veritabanı SQLite olacak.
- Node tarafında synchronous native driver olarak `better-sqlite3` kullanılacak.

Gerekçe:

- Freelancer ölçeğinde ayrı Postgres servisi, connection pool ve network latency self-host maliyetini artırıyor.
- Tek persistent volume ile backup/restore daha anlaşılır.
- SQLite WAL ve kısa transaction disiplini bu ürünün beklenen write concurrency ihtiyacına yeterli.

Sınır:

- Horizontal replica yok.
- NFS/shared volume üzerinde aynı DB dosyasını birden fazla app instance yazmayacak.
- Bu sınır aşılırsa PostgreSQL migration ayrı ADR ve faz gerektirir.

## ADR-0002: Drizzle ORM ve kaynak kontrollü migration

Status: Accepted for redesign baseline.

Karar:

- Schema ve query katmanı Drizzle ORM ile yazılacak.
- Production'da `drizzle-kit push` kullanılmayacak.
- Migration dosyaları kaynak kontrolünde, image içinde ve startup migration runner üzerinden uygulanacak.

Gerekçe:

- Type-safe query ihtiyacı var.
- Runtime overhead düşük kalmalı.
- SQLite schema değişimleri deterministic ve review edilebilir olmalı.

## ADR-0003: Better Auth

Status: Accepted for redesign baseline.

Karar:

- Supabase Auth yerine Better Auth kullanılacak.
- Email/password ve DB session ilk release için yeterli kapsam.
- İlk freelancer setup akışı public registration yerine kurulum kilidiyle yönetilecek.

Gerekçe:

- Auth protokolünü sıfırdan yazmak gereksiz risk.
- External auth service self-host hedefiyle çelişir.
- Portal client invitation flow Better Auth user/session modeliyle kurulabilir.

## ADR-0004: Server-side authorization

Status: Accepted for redesign baseline.

Karar:

- Browser hiçbir zaman DB/auth secret/filesystem import etmeyecek.
- RLS yerine `requireSession`, role checks ve owner-filtered repository/service functions kullanılacak.
- Authorization testleri her resource için negatif test içerecek.

Gerekçe:

- SQLite RLS sağlamaz.
- Güvenlik sınırı her query/mutation'da server service katmanında kurulmalı.

## ADR-0005: Yerel filesystem storage

Status: Accepted for redesign baseline.

Karar:

- Avatar ve project asset dosyaları `/app/data/uploads` altında saklanacak.
- DB içinde dosya metadata tablosu olacak.
- Upload/download Route Handler'ları auth, owner, size, MIME ve path traversal kontrolü yapacak.

Gerekçe:

- S3 veya Supabase Storage self-host kurulumunu ağırlaştırır.
- Tek volume backup modeli basit kalır.

## ADR-0006: Poyraz UI v3 tek UI sistemi

Status: Accepted for redesign baseline.

Karar:

- Neta'nın genel UI atom, molecule ve organism katmanı `poyraz-ui@3` üzerinden kurulacak.
- Paket kullanımı ana dağıtım modeli olacak; source registry yalnızca component source ownership gerektiren istisnalarda kullanılacak.
- Button, form field, dialog, select, dropdown, tabs, sheet, sidebar, data table ve toast gibi genel primitive/davranışlar ikinci kez yazılmayacak.
- `ProjectCard`, `ClientPipeline` ve `FinanceSummary` gibi Neta'ya özgü domain bileşenleri Poyraz UI componentlerinin kompozisyonu olarak yazılabilir.
- Global CSS `poyraz-ui/preset.css` ve semantic token sistemini kullanacak.
- Faz 3'te eklenmiş internal primitive ve shell'ler geçiş yüzeyidir; Poyraz UI v3 karşılığına taşındıktan sonra duplicate olanlar kaldırılacak.

Gerekçe:

- Poyraz UI proje sahibinin kontrolündedir ve v3; Tailwind CSS v4, semantic theme tokenları, erişilebilir Radix davranışları ve app-level organisms sunar.
- Tek paket altında primitive tekrarını azaltmak dependency sadeleştirme hedefiyle uyumludur.
- Merkezi paket versiyonu Neta ile Poyraz UI arasındaki tasarım sözleşmesini görünür ve güncellenebilir tutar.

Supersedes:

- 2026-07-10 tarihli “Internal Neta UI” yönü geçersizdir.
- `docs/self-hosted-redesign/phase-3-ui.md` tarihsel uygulama notu olarak korunur; ileriye dönük UI kararı değildir.

## ADR-0007: PWA/offline sync ilk release kapsam dışı

Status: Accepted for redesign baseline.

Karar:

- İlk self-hosted release'te PWA/offline sync hedeflenmez.
- `next-pwa`, Dexie, offline indicator ve üretilmiş service worker runtime'dan kaldırıldı.
- Web manifest yalnızca install metadata/branding çıktısı olarak server-side dinamik üretilir; offline çalışma vaadi değildir.

Gerekçe:

- Offline cache, auth/session ve local DB geçişinde ek tutarlılık riski getiriyor.
- Öncelik deploy basitliği ve server-side veri doğruluğu.

## ADR-0008: Embeddings operasyonel hedefe taşınmayacak

Status: Accepted for redesign baseline.

Karar:

- `document_embeddings` pgvector runtime kabiliyeti ilk release'e taşınmayacak.
- Mevcut embeddings archive/import source olarak değerlendirilecek.
- Gerekirse sonraki fazda SQLite FTS5 veya harici vector store için ayrı karar alınacak.

Gerekçe:

- pgvector self-host hedefinde Postgres bağımlılığını geri getirir.
- Mevcut RAG yüzeyi core freelancer workflow'u için kritik değil.

## ADR-0009: Para integer minor unit

Status: Accepted for redesign baseline.

Karar:

- Para alanları hedef DB'de integer minor unit olarak saklanacak.
- Formatlama UI/shared formatting katmanında yapılacak.

Gerekçe:

- Decimal farkları, locale parse hataları ve floating point riski azaltılır.
- Aggregate SQL daha net olur.

## ADR-0010: journals + daily_logs birleşimi

Status: Accepted for redesign baseline.

Karar:

- Aktif ürün davranışı `daily_logs` üzerinden devam eder.
- Legacy `journals` kaynak verisi `journal_entries` içine merge veya archive edilir.

Gerekçe:

- İki ayrı günlük modeli aynı üründe gereksiz karmaşa yaratıyor.
- Faz 5 journal redesign tek kanonik modeli hedefler.

## ADR-0011: Production dual-write yok

Status: Accepted for redesign baseline.

Karar:

- Eski Supabase sürümü redesign tamamlanana kadar production olarak kalacak.
- Yeni sistem ayrı import rehearsal ve maintenance cutover ile devreye alınacak.
- Supabase ve SQLite'a aynı anda production dual-write yapılmayacak.

Gerekçe:

- Dual-write tutarlılık ve rollback riskini artırır.
- Küçük ürün ölçeğinde kontrollü cutover daha güvenli.

## ADR-0012: Vercel hedef deploy değil

Status: Accepted for redesign baseline.

Karar:

- Yerel SQLite dosya sistemi gerektiren hedef runtime Vercel serverless/deploy modeline göre tasarlanmaz.
- Hedef Coolify, Dokploy veya standart Docker host'tur.

Gerekçe:

- Persistent local volume ve single long-running Node process gereksinimi var.

## ADR-0013: Tek owner/admin, birden fazla client

Status: Accepted for self-hosted v3 first release.

Karar:

- Bir Neta instance'ı ilk sürümde tek aktif freelancer/owner hesabına sahip olacak.
- Owner birden fazla client portal hesabı oluşturabilecek veya davet edebilecek.
- İkinci freelancer, takım, organization ve workspace membership modeli ilk sürüm kapsamında olmayacak.
- Domain tabloları yine de açık `owner_user_id` alanı taşıyacak; sabit bir global owner varsayımı repository filtrelerinin yerine geçmeyecek.

Gerekçe:

- İlk admin setup kilidi ve tek-instance SQLite hedefi mevcut ürün davranışıyla uyumludur.
- Açık owner alanı import, authorization testi ve ileride kontrollü model genişletmesi için gereklidir.

## ADR-0014: Supabase verisi için import uyumluluğu zorunlu

Status: Accepted for self-hosted v3 first release.

Karar:

- Production veri miktarından bağımsız olarak mevcut Supabase modelinden SQLite'a tek seferlik import desteklenecek.
- Auth password ve session verisi taşınmayacak; owner hesabı yeniden kurulacak, client kullanıcıları yeniden davet edilecek.
- Import dry-run, satır sayımı, normalization raporu ve file checksum manifest'i üretecek.
- Production dual-write yapılmayacak; cutover maintenance penceresinde gerçekleşecek.

Gerekçe:

- Uygulamanın halihazırdaki verisini kaybetmeden Supabase'ten çıkabilmesi ürün güvenilirliğinin parçasıdır.
- Veri yoksa aynı araç fixture/import smoke amacıyla kullanılabilir.

## ADR-0015: Business modülleri release-blocker değil

Status: Accepted for self-hosted v3 first release.

Karar:

- Teklif, sözleşme, fatura ve abonelik kaynak verileri import kapsamında korunacak.
- Bu modüllerin tam CRUD ve redesign işleri çekirdek müşteri/proje/görev/finans/portal akışlarını bloke etmeyecek.
- Eksik business ekranları Faz 7'de tamamlanacak veya feature flag/navigation dışı bırakılacak.
- Kaynak veri sessizce silinmeyecek; aktif hedef tabloya veya açıkça belgelenmiş archive modeline alınacak.

Gerekçe:

- Mevcut business ekranları kısmen read-only veya UI taslağı durumundadır.
- Self-hosted çekirdeğin gecikmeden güvenli biçimde tamamlanması daha yüksek önceliktedir.

## ADR-0016: İlk portal iletişimi proje görünürlüğü ve revizyonlarla sınırlı

Status: Accepted for self-hosted v3 first release.

Karar:

- İlk release'te client iletişim yüzeyi proje durumu, public görevler, planlama bölümleri ve revizyon taleplerini kapsayacak.
- Genel mesajlaşma, task comment thread'leri, notification merkezi ve e-posta entegrasyonu ilk release kapsamı dışında olacak.
- Revizyon oluşturma project-client ilişkisini ve kotayı aynı server-side transaction içinde doğrulayacak.

Gerekçe:

- Mevcut portalın doğrulanabilir ürün davranışı bu kapsamdır.
- Genel mesajlaşma ayrı notification, unread state, retention ve abuse kararları gerektirir.

## ADR-0017: Web ve gelecek mobil istemci ortak service katmanını kullanır

Status: Accepted for self-hosted v3 baseline.

Karar:

- Server Components ve Server Actions iş mantığını ortak service/repository katmanından çağıracak.
- Gelecekteki `/api/v1` Route Handler'ları aynı service katmanına adapter olacak.
- Web uygulaması kendi Route Handler'larına internal HTTP çağrısı yapmayacak.
- Service katmanı `Request`, cookie veya Next.js navigation objelerine doğrudan bağımlı olmayacak.

Gerekçe:

- Web SSR performansını korurken React Native için tekrar kullanılabilir backend sınırı sağlar.
