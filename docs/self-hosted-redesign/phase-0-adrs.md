---
title: Phase 0 ADR Set
description: Self-hosted redesign için Faz 0'da kilitlenen mimari kararlar.
status: active
last_updated: 2026-07-10
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

## ADR-0006: Internal Neta UI

Status: Accepted for redesign baseline.

Karar:

- `poyraz-ui` runtime bağımlılığı kaldırılacak.
- Neta'nın kendi `components/ui` primitive'leri ve semantic CSS token'ları kullanılacak.
- Dialog, select, menu, tabs gibi davranışlı bileşenlerde tek bir headless primitive katmanı izole edilebilir.

Gerekçe:

- UI bağımlılığı self-host dağıtım ve uzun vadeli bakım riskini artırıyor.
- Ürün UX'i freelancer workflow'una göre yeniden tasarlanacak.

## ADR-0007: PWA/offline sync ilk release kapsam dışı

Status: Accepted for redesign baseline.

Karar:

- İlk self-hosted release'te PWA/offline sync hedeflenmez.
- `next-pwa` kaldırılacak veya devre dışı bırakılacak.

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

