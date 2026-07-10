---
title: Self-Hosted Redesign Faz Checklist'i
description: Supabase ve Poyraz UI'dan ayrılma çalışmasında her fazın sonunda tamamlanması, kanıtlanması ve onaylanması gereken ayrıntılı kontrol listesi.
order: 19
status: active-template
last_updated: 2026-07-10
---

# Neta Self-Hosted Redesign Faz Checklist'i

## 1. Kullanım kuralları

Bu checklist, [18-self-hosted-redesign-plani.md](./18-self-hosted-redesign-plani.md) içindeki Faz 0-10 ile bire bir eşleşir. Bir fazın kodu yazılmış olsa bile ilgili çıkış kapısının tüm bloklayıcı maddeleri tamamlanmadan faz kapatılmaz.

İşaretleme standardı:

- `[ ]`: Henüz doğrulanmadı.
- `[x]`: Doğrulandı ve kanıt bağlantısı/notu eklendi.
- `N/A - gerekçe`: Bu kurulum veya faz için uygulanamaz; gerekçe zorunludur.

Her faz tamamlandığında aşağıdaki kayıt başlığı doldurulur:

```text
Faz:
Tamamlanma tarihi:
Sorumlu:
İncelenen commit/tag:
Test ortamı:
Test veri seti:
Kanıt klasörü/PR bağlantısı:
Açık istisnalar:
Rollback referansı:
Onaylayan:
```

Kanıt olarak yalnızca “çalışıyor” notu yeterli değildir. İlgili maddeye göre komut çıktısı, test adı, ekran görüntüsü, ölçüm tablosu, migration raporu, checksum veya restore kaydı eklenmelidir. Secret, cookie, parola, davet token'ı ve AI API key kanıta dahil edilmez.

## 2. Her faz için ortak kalite kapısı

Bu bölüm her faz sonunda yeniden uygulanır.

### 2.1 Kapsam ve kod bütünlüğü

- [ ] Fazın plan dokümanındaki amacı ve kapsamı PR/release notunda yazıyor.
- [ ] Faz dışı davranış değişiklikleri ayrı kayda alınmış veya kapsamdan çıkarılmış.
- [ ] Yeni kod mevcut feature sınırlarına uygun; geçici kod için açık takip kaydı var.
- [ ] Aynı feature içinde iki farklı veri yolu veya auth yolu bırakılmamış.
- [ ] Client Component içine server-only modül, DB client, filesystem veya secret import edilmemiş.
- [ ] Yeni environment değişkenleri `.env.example` ve config validation şemasına eklenmiş.
- [ ] Secret değişkenlere `NEXT_PUBLIC_` prefix'i verilmemiş.
- [ ] Yeni dependency'nin amacı, lisansı ve runtime etkisi incelenmiş.
- [ ] Kullanılmayan import, dosya, flag ve geçici debug log bırakılmamış.
- [ ] Kullanıcı verisi veya secret loglayan kod bulunmadığı doğrulanmış.

### 2.2 Statik kalite

- [ ] `npm run lint` sıfır hata ile tamamlandı.
- [ ] `npm run typecheck` sıfır hata ile tamamlandı.
- [ ] `any`, non-null assertion ve type cast kullanımları gerekçeli veya kaldırılmış.
- [ ] Status/role/category değerleri kanonik type'tan geliyor; serbest string tekrarı yok.
- [ ] Validation schema ile TypeScript contract birbirinden kopuk değil.
- [ ] Production build warning'leri incelenmiş ve yeni kritik warning yok.

### 2.3 Test ve build

- [ ] Fazın unit testleri geçti.
- [ ] Fazın integration testleri geçti.
- [ ] Değişen kritik akışların negatif testleri geçti.
- [ ] `npm run build` geçti.
- [ ] Temiz veritabanında migration + seed + test geçti.
- [ ] Bir önceki fazın veritabanından upgrade migration testi geçti.
- [ ] İlgili E2E smoke akışları geçti.
- [ ] Testler local timezone veya çalışma sırasına bağımlı değil.

### 2.4 Güvenlik

- [ ] Auth olmayan kullanıcı için yeni query/mutation reddediliyor.
- [ ] Yanlış role sahip kullanıcı için yeni query/mutation reddediliyor.
- [ ] Başka owner'a ait bilinen UUID ile erişim testi reddediliyor.
- [ ] Input boyutu ve biçimi server sınırında doğrulanıyor.
- [ ] Ham DB hatası veya stack trace kullanıcıya dönmüyor.
- [ ] Log redaction kontrolü yapıldı.
- [ ] Yeni endpoint'in rate limit ihtiyacı değerlendirildi.
- [ ] CSRF/origin/cookie etkisi değerlendirildi.

### 2.5 UX ve erişilebilirlik

- [ ] Primary action tıklamasından sonra 100 ms içinde feedback var.
- [ ] Pending sırasında çift submit engelleniyor.
- [ ] Hata sonrası kullanıcı verisi gereksiz yere kaybolmuyor.
- [ ] Empty, loading, success ve error durumları mevcut.
- [ ] Klavye ile temel akış tamamlanabiliyor.
- [ ] Focus görünür ve overlay kapanınca mantıklı yere dönüyor.
- [ ] Form alanlarının label ve hata bağlantıları doğru.
- [ ] 320 px mobil, tablet ve desktop görünümü kontrol edildi.
- [ ] Metin, buton, badge ve tablo içeriklerinde taşma/çakışma yok.
- [ ] Reduced-motion davranışı kontrol edildi.

### 2.6 Operasyon ve dokümantasyon

- [ ] Yeni migration commit edilmiş ve sırası doğru.
- [ ] Backup/restore etkisi değerlendirildi.
- [ ] Health/readiness davranışı bozulmadı.
- [ ] Docker image build ve restart smoke geçti.
- [ ] İlgili kullanıcı ve operasyon dokümanı güncellendi.
- [ ] Bilinen risk veya ertelenen iş issue/backlog kaydında.
- [ ] Rollback yöntemi yazılı ve uygulanabilir.

## 3. Faz 0 - Baseline, kararlar ve çalışma güvenliği

Faz:
Faz 0 - Baseline, kararlar ve çalışma güvenliği
Tamamlanma tarihi:
Kısmi local baseline: 2026-07-10
Sorumlu:
Codex
İncelenen commit/tag:
Çalışma ağacı; Faz 0 dokümanları henüz commit edilmedi
Test ortamı:
Local Windows/PowerShell workspace
Test veri seti:
Production Supabase export yok; seed stratejisi [phase-0-fixtures.md](./self-hosted-redesign/phase-0-fixtures.md)
Kanıt klasörü/PR bağlantısı:
[phase-0-baseline.md](./self-hosted-redesign/phase-0-baseline.md), [phase-0-data-mapping.md](./self-hosted-redesign/phase-0-data-mapping.md), [phase-0-adrs.md](./self-hosted-redesign/phase-0-adrs.md), [phase-0-regression-and-spike.md](./self-hosted-redesign/phase-0-regression-and-spike.md)
Açık istisnalar:
Production backup/export, storage ölçümü, gerçek ekran kayıtları ve production performans ölçümü bekliyor
Rollback referansı:
Dokümantasyon değişikliği; app runtime değişmedi
Onaylayan:
Ürün sahibi onayı bekliyor

### 3.1 Repo ve bağımlılık envanteri

- [x] Tüm route'lar ve route group'lar listelendi. Kanıt: [phase-0-baseline.md](./self-hosted-redesign/phase-0-baseline.md#route-envanteri)
- [x] Tüm Server Action dosyaları listelendi. Kanıt: [phase-0-baseline.md](./self-hosted-redesign/phase-0-baseline.md#route-envanteri)
- [x] Tüm Route Handler'lar listelendi. Kanıt: [phase-0-baseline.md](./self-hosted-redesign/phase-0-baseline.md#route-envanteri)
- [x] Browser Supabase client kullanan dosyalar listelendi. Kanıt: [phase-0-baseline.md](./self-hosted-redesign/phase-0-baseline.md#supabase-kullanım-envanteri)
- [x] Server Supabase client kullanan dosyalar listelendi. Kanıt: [phase-0-baseline.md](./self-hosted-redesign/phase-0-baseline.md#supabase-kullanım-envanteri)
- [x] Service-role client kullanan dosyalar listelendi. Kanıt: [phase-0-baseline.md](./self-hosted-redesign/phase-0-baseline.md#supabase-kullanım-envanteri)
- [x] Tüm `poyraz-ui` import'ları dosya ve import edilen component bazında listelendi. Kanıt: [phase-0-baseline.md](./self-hosted-redesign/phase-0-baseline.md#poyraz-ui-import-envanteri)
- [x] Internal `components/ui` bileşenlerinin aktif/kullanılmayan durumu belirlendi. Kanıt: [phase-0-baseline.md](./self-hosted-redesign/phase-0-baseline.md#internal-ui-durumu)
- [x] Kullanılmayan Dexie/IndexedDB kodu doğrulandı. Kanıt: [phase-0-baseline.md](./self-hosted-redesign/phase-0-baseline.md#dexieindexeddb-ve-pwa-baseline)
- [x] PWA service worker'ın cache kapsamı kaydedildi. Kanıt: [phase-0-baseline.md](./self-hosted-redesign/phase-0-baseline.md#dexieindexeddb-ve-pwa-baseline)
- [x] Package dependency'leri “kalacak/kaldırılacak/değerlendirilecek” olarak sınıflandırıldı. Kanıt: [phase-0-baseline.md](./self-hosted-redesign/phase-0-baseline.md#dependency-sınıflandırması)
- [x] Her kaldırılacak paketin replacement veya kaldırma gerekçesi yazıldı. Kanıt: [phase-0-baseline.md](./self-hosted-redesign/phase-0-baseline.md#dependency-sınıflandırması)

### 3.2 Veri envanteri

- [x] Supabase `auth.users` kullanım amacı belgelendi. Kanıt: [phase-0-data-mapping.md](./self-hosted-redesign/phase-0-data-mapping.md#source-to-target-mapping)
- [x] `profiles` kolonları ve role değerleri belgelendi. Kanıt: [phase-0-data-mapping.md](./self-hosted-redesign/phase-0-data-mapping.md#enumstatus-baseline)
- [x] `clients` ve portal user ilişkisi belgelendi. Kanıt: [phase-0-data-mapping.md](./self-hosted-redesign/phase-0-data-mapping.md#source-to-target-mapping)
- [x] `projects` kolonları, status/type/progress kuralları belgelendi. Kanıt: [phase-0-data-mapping.md](./self-hosted-redesign/phase-0-data-mapping.md#enumstatus-baseline)
- [ ] `tasks` kolonları ve bütün status değerleri production verisinden sayıldı. Bekliyor: production audit sorgusu [phase-0-data-mapping.md](./self-hosted-redesign/phase-0-data-mapping.md#production-audit-sorguları)
- [x] `calendar_events` type değerleri sayıldı. Kanıt: [phase-0-data-mapping.md](./self-hosted-redesign/phase-0-data-mapping.md#enumstatus-baseline)
- [ ] `finance_transactions` currency/type/payment status dağılımı sayıldı. Bekliyor: production audit sorgusu [phase-0-data-mapping.md](./self-hosted-redesign/phase-0-data-mapping.md#production-audit-sorguları)
- [ ] Proposal/contract/invoice/subscription status dağılımları sayıldı. Bekliyor: production audit sorgusu [phase-0-data-mapping.md](./self-hosted-redesign/phase-0-data-mapping.md#production-audit-sorguları)
- [ ] `journals` ve `daily_logs` satırları, tarih çakışmaları ve boş alanları raporlandı. Bekliyor: production export
- [ ] `project_planning_sections` category değerleri ve yanlış/legacy değerler raporlandı. Bekliyor: production audit; schema enum belgelendi
- [ ] `project_revisions` kota ve status verisi raporlandı. Bekliyor: production audit
- [ ] `chat_sessions`/`chat_messages` büyüklüğü raporlandı. Bekliyor: production audit
- [ ] `document_embeddings` aktif kullanım ve satır sayısı doğrulandı. Bekliyor: production audit
- [ ] `app_settings.api_key` dolu kayıtları sayıldı; değerler loglanmadı. Bekliyor: production audit; sorgu secret değer döndürmüyor
- [ ] Avatar bucket dosya sayısı ve toplam boyut ölçüldü. Bekliyor: Supabase storage audit
- [ ] Project-assets bucket dosya sayısı ve toplam boyut ölçüldü. Bekliyor: Supabase storage audit
- [ ] Storage metadata ile DB path referansları arasındaki orphan kayıtlar raporlandı. Bekliyor: Supabase storage audit
- [x] Her tablonun PK, FK, unique, check, trigger ve index listesi çıkarıldı. Kanıt: [phase-0-data-mapping.md](./self-hosted-redesign/phase-0-data-mapping.md#production-audit-sorguları)
- [x] Tüm RLS policy'leri resource ve operation bazında matrise işlendi. Kanıt: [phase-0-data-mapping.md](./self-hosted-redesign/phase-0-data-mapping.md#rls-policy-matrix)
- [x] Dashboard ve analytics RPC input/output sözleşmesi kaydedildi. Kanıt: [phase-0-baseline.md](./self-hosted-redesign/phase-0-baseline.md#supabase-kullanım-envanteri), `supabase/migrations/0012_add_analytics_rpcs.sql`

### 3.3 Davranış baseline'ı

- [ ] İlk admin setup akışı ekran ve adımlarıyla kaydedildi. Bekliyor: ekran kaydı; akış matrisi hazır [phase-0-regression-and-spike.md](./self-hosted-redesign/phase-0-regression-and-spike.md#behavior-smoke-matrix)
- [ ] Login/logout/parola değiştirme akışı kaydedildi. Bekliyor: ekran kaydı
- [ ] Client portal hesabı oluşturma akışı kaydedildi. Bekliyor: ekran kaydı
- [ ] Client create/edit/archive/delete akışları kaydedildi. Bekliyor: ekran kaydı
- [ ] Project create/edit/status/progress/plan akışları kaydedildi. Bekliyor: ekran kaydı
- [ ] Task create/edit/status/drag/drop/delete akışları kaydedildi. Bekliyor: ekran kaydı
- [ ] Calendar create/edit/delete ve tarih görünümü kaydedildi. Bekliyor: ekran kaydı
- [ ] Finance create/edit/delete/filter akışları kaydedildi. Bekliyor: ekran kaydı
- [ ] Proposal, contract, invoice ve subscription mevcut davranışı kaydedildi. Bekliyor: ekran kaydı
- [ ] Journal create/edit/delete akışı kaydedildi. Bekliyor: ekran kaydı
- [ ] Analytics tarih filtresi ve hesap sonuçları kaydedildi. Bekliyor: ekran kaydı
- [ ] AI chat session/message akışı kaydedildi. Bekliyor: ekran kaydı
- [ ] Finance analysis ve project risk davranışı kaydedildi. Bekliyor: ekran kaydı
- [ ] Profile/avatar/API key ayar akışları kaydedildi. Bekliyor: ekran kaydı
- [ ] Portal project/task/revision akışları kaydedildi. Bekliyor: ekran kaydı

### 3.4 Bilinen problem baseline'ı

- [x] Portal planlama `order_index`/`sort_order` problemi regression test maddesine çevrildi. Kanıt: REG-001 [phase-0-regression-and-spike.md](./self-hosted-redesign/phase-0-regression-and-spike.md#regression-test-backlog)
- [x] Project risk `completed`/`done` problemi regression test maddesine çevrildi. Kanıt: REG-002 [phase-0-regression-and-spike.md](./self-hosted-redesign/phase-0-regression-and-spike.md#regression-test-backlog)
- [x] Portal plan `type`/`category` problemi regression test maddesine çevrildi. Kanıt: REG-003 [phase-0-regression-and-spike.md](./self-hosted-redesign/phase-0-regression-and-spike.md#regression-test-backlog)
- [x] Revision quota server enforcement eksikliği regression test maddesine çevrildi. Kanıt: REG-004 [phase-0-regression-and-spike.md](./self-hosted-redesign/phase-0-regression-and-spike.md#regression-test-backlog)
- [x] Portal revision project/client ilişki açığı negatif test maddesine çevrildi. Kanıt: REG-005 [phase-0-regression-and-spike.md](./self-hosted-redesign/phase-0-regression-and-spike.md#regression-test-backlog)
- [x] Mevcut lint hata/uyarı listesi arşivlendi. Kanıt: `npm.cmd run lint` sonucu 34 error, 25 warning; özet [phase-0-baseline.md](./self-hosted-redesign/phase-0-baseline.md#local-doğrulama-sonuçları)
- [x] `select("*")`, limitsiz liste ve N+1 adayları kaydedildi. Kanıt: [phase-0-baseline.md](./self-hosted-redesign/phase-0-baseline.md#performans-baseline)
- [x] Pending/optimistic/rollback eksiği olan mutation'lar listelendi. Kanıt: [phase-0-baseline.md](./self-hosted-redesign/phase-0-baseline.md#davranış-baseline-matrisi)

### 3.5 Performans baseline'ı

- [ ] Referans test donanımı CPU/RAM/disk/Node sürümüyle kaydedildi. Kısmi: Node/npm/CPU identifier/logical processor/disk root kaydedildi; RAM bilgisi sandbox WMI/CIM erişimi nedeniyle alınamadı. Kanıt: [phase-0-baseline.md](./self-hosted-redesign/phase-0-baseline.md#local-doğrulama-sonuçları)
- [ ] Küçük fixture veri seti üretildi. Bekliyor: Drizzle schema sonrası gerçek seed; kapsam [phase-0-fixtures.md](./self-hosted-redesign/phase-0-fixtures.md#küçük-fixture-kapsamı)
- [ ] Stres fixture veri seti üretildi. Bekliyor: Drizzle schema sonrası gerçek seed; kapsam [phase-0-fixtures.md](./self-hosted-redesign/phase-0-fixtures.md#stres-fixture-kapsamı)
- [ ] Dashboard server süresi ve payload ölçüldü. Bekliyor: local/prod running environment
- [ ] Projects list/detail süreleri ölçüldü. Bekliyor: local/prod running environment
- [ ] Tasks list/kanban süreleri ölçüldü. Bekliyor: local/prod running environment
- [ ] Clients list/detail süreleri ölçüldü. Bekliyor: local/prod running environment
- [ ] Finance ve analytics süreleri ölçüldü. Bekliyor: local/prod running environment
- [ ] Portal list/detail süreleri ölçüldü. Bekliyor: local/prod running environment
- [ ] Ana route client JS boyutları kaydedildi. Bekliyor: production build analyze çıktısı
- [ ] En yavaş on DB/network işlemi kaydedildi. Bekliyor: running environment instrumentation
- [ ] Kullanıcı tıklaması ile ilk feedback arasındaki süre örnek akışlarda ölçüldü. Bekliyor: ekran kaydı veya Playwright ölçümü

### 3.6 ADR ve kapsam onayı

- [x] SQLite + `better-sqlite3` kararı onaylandı. Kanıt: ADR-0001 [phase-0-adrs.md](./self-hosted-redesign/phase-0-adrs.md#adr-0001-sqlite--better-sqlite3)
- [x] Drizzle schema/migration kararı onaylandı. Kanıt: ADR-0002 [phase-0-adrs.md](./self-hosted-redesign/phase-0-adrs.md#adr-0002-drizzle-orm-ve-kaynak-kontrollü-migration)
- [x] Better Auth kararı onaylandı. Kanıt: ADR-0003 [phase-0-adrs.md](./self-hosted-redesign/phase-0-adrs.md#adr-0003-better-auth)
- [x] Tek instance kısıtı onaylandı. Kanıt: ADR-0001 [phase-0-adrs.md](./self-hosted-redesign/phase-0-adrs.md#adr-0001-sqlite--better-sqlite3)
- [x] Yerel filesystem storage kararı onaylandı. Kanıt: ADR-0005 [phase-0-adrs.md](./self-hosted-redesign/phase-0-adrs.md#adr-0005-yerel-filesystem-storage)
- [x] Internal UI + tek headless primitive kararı onaylandı. Kanıt: ADR-0006 [phase-0-adrs.md](./self-hosted-redesign/phase-0-adrs.md#adr-0006-internal-neta-ui)
- [x] İlk release'te PWA/offline sync kaldırma kararı onaylandı. Kanıt: ADR-0007 [phase-0-adrs.md](./self-hosted-redesign/phase-0-adrs.md#adr-0007-pwaoffline-sync-ilk-release-kapsam-dışı)
- [x] Embedding'leri operasyonel hedefe taşımama kararı onaylandı. Kanıt: ADR-0008 [phase-0-adrs.md](./self-hosted-redesign/phase-0-adrs.md#adr-0008-embeddings-operasyonel-hedefe-taşınmayacak)
- [x] Para için minor unit standardı onaylandı. Kanıt: ADR-0009 [phase-0-adrs.md](./self-hosted-redesign/phase-0-adrs.md#adr-0009-para-integer-minor-unit)
- [x] `journals`/`daily_logs` birleşim kuralı onaylandı. Kanıt: ADR-0010 [phase-0-adrs.md](./self-hosted-redesign/phase-0-adrs.md#adr-0010-journals--daily_logs-birleşimi)
- [x] Production dual-write yapmama kararı onaylandı. Kanıt: ADR-0011 [phase-0-adrs.md](./self-hosted-redesign/phase-0-adrs.md#adr-0011-production-dual-write-yok)
- [x] Vercel'in yerel SQLite hedef deploy'u olmadığı açıkça kabul edildi. Kanıt: ADR-0012 [phase-0-adrs.md](./self-hosted-redesign/phase-0-adrs.md#adr-0012-vercel-hedef-deploy-değil)

### 3.7 Faz 0 çıkış kapısı

- [ ] Production Supabase backup'ı alındı. Bekliyor: production Supabase erişimi
- [ ] Backup'ın erişilebilirliği ve restore prosedürü doğrulandı. Bekliyor: production backup
- [ ] Source-to-target veri mapping taslağında sahipsiz alan yok. Bekliyor: production audit sonrası son kontrol; taslak [phase-0-data-mapping.md](./self-hosted-redesign/phase-0-data-mapping.md)
- [ ] Kritik akış matrisi ürün sahibi tarafından onaylandı. Bekliyor: ürün sahibi onayı; matris [phase-0-regression-and-spike.md](./self-hosted-redesign/phase-0-regression-and-spike.md#behavior-smoke-matrix)
- [x] ADR'ler onaylandı. Kanıt: [phase-0-adrs.md](./self-hosted-redesign/phase-0-adrs.md)
- [ ] Baseline raporu commit edildi. Bekliyor: kullanıcı commit talimatı veya ayrı commit
- [x] Faz 1 spike'ının başarı/başarısızlık ölçütleri yazıldı. Kanıt: [phase-0-regression-and-spike.md](./self-hosted-redesign/phase-0-regression-and-spike.md#faz-1-spike-kabul-kriterleri)
- [x] Faz 0 istisna listesi boş veya açıkça onaylı. Kanıt: [phase-0-baseline.md](./self-hosted-redesign/phase-0-baseline.md#faz-0-istisnaları)

## 4. Faz 1 - Runtime, SQLite ve deploy iskeleti

Faz:
Faz 1 - Runtime, SQLite ve deploy iskeleti
Tamamlanma tarihi:
Kısmi local runtime: 2026-07-10
Sorumlu:
Codex
İncelenen commit/tag:
Çalışma ağacı; Faz 1 dosyaları henüz commit edilmedi
Test ortamı:
Local Windows/PowerShell workspace, Next dev server `127.0.0.1:3010`
Test veri seti:
Temp SQLite smoke data dir; production data kullanılmadı
Kanıt klasörü/PR bağlantısı:
[phase-1-runtime.md](./self-hosted-redesign/phase-1-runtime.md)
Açık istisnalar:
Docker daemon kapalı olduğu için Docker build/up/native SQLite container smoke ve container restart persistence testleri çalıştırılamadı
Rollback referansı:
Faz 1 henüz production'a alınmadı; yeni runtime dosyaları ve dependency ekleri geri alınabilir
Onaylayan:
Ürün sahibi onayı bekliyor

### 4.1 Environment ve config

- [x] Server config tek modülde Zod ile parse ediliyor. Kanıt: `server/config.ts`, [phase-1-runtime.md](./self-hosted-redesign/phase-1-runtime.md#config-davranışı)
- N/A - Eksik `DATA_DIR` boot hatası üretmiyor; Faz 1 kararı olarak development/test için `.data`, production için `/app/data` fallback kullanılıyor. Kanıt: [phase-1-runtime.md](./self-hosted-redesign/phase-1-runtime.md#config-davranışı)
- [x] Relative/absolute data path davranışı belgelendi. Kanıt: [phase-1-runtime.md](./self-hosted-redesign/phase-1-runtime.md#config-davranışı)
- [x] Production `DATA_DIR=/app/data` varsayımı doğrulandı. Kanıt: `Dockerfile`, `docker-compose.yml`, [phase-1-runtime.md](./self-hosted-redesign/phase-1-runtime.md#docker-durumu)
- [x] Uygulama data dizinini kontrollü oluşturuyor. Kanıt: `ensureDataDirectories`, `ensureDataLayout`, `npm.cmd run phase1:smoke`
- [ ] Data dizini yazılamazsa readiness fail ve server boot davranışı tanımlı. Kısmi: readiness kodu yazılabilirlik probe'u içeriyor; negatif permission testi Docker/OS seviyesinde henüz çalıştırılmadı.
- [x] Env doğrulama çıktısı secret değer göstermiyor. Kanıt: config modülü env dump/log üretmiyor.
- [x] Test environment kendi geçici data dizinini kullanıyor. Kanıt: `npm.cmd run phase1:smoke`

### 4.2 SQLite client

- [x] Tek process için singleton connection uygulanmış. Kanıt: `server/db/client.ts`
- [x] Development hot reload duplicate connection oluşturmuyor. Kanıt: `globalThis.__netaSqliteConnection` kullanımı
- [x] `foreign_keys=ON` doğrulanmış. Kanıt: `applyPragmas`, smoke migration
- [x] `journal_mode=WAL` doğrulanmış. Kanıt: `applyPragmas`, smoke migration
- [x] `synchronous=NORMAL` doğrulanmış. Kanıt: `applyPragmas`
- [x] `busy_timeout=5000` veya onaylı değer uygulanmış. Kanıt: `applyPragmas`
- [ ] DB açılış hatası güvenli şekilde loglanıyor. Bekliyor: structured logger/redaction katmanı Faz 8'e yakın netleştirilecek.
- [ ] Graceful process kapanış davranışı test edilmiş. Kısmi: `beforeExit` close handler var; process signal/container stop testi Docker daemon kapalı olduğu için çalıştırılamadı.
- [x] Transaction helper nested transaction kullanımını açıkça ele alıyor. Kanıt: `server/db/transaction.ts`
- N/A - Uzun network/filesystem operasyonunun transaction içine alınmadığı code review ile doğrulanmış. Faz 1'de domain transaction kullanan network/filesystem operasyonu yok.

### 4.3 Drizzle migration

- [x] Drizzle config yalnızca server dosyalarını işaret ediyor. Kanıt: `drizzle.config.ts`
- [ ] İlk migration commit edildi. Bekliyor: kullanıcı commit talimatı; migration dosyası üretildi.
- [x] Migration journal/schema version takip ediliyor. Kanıt: `server/db/migrations/meta/_journal.json`
- [x] Sıfır byte yeni DB'ye migration uygulanabiliyor. Kanıt: `npm.cmd run phase1:smoke`
- [x] Migration ikinci kez çalıştırıldığında veri veya şema bozulmuyor. Kanıt: `npm.cmd run db:migrate` ikinci çalışma başarılı
- [ ] Yarım/başarısız migration senaryosu kontrollü fail ediyor. Bekliyor: negatif migration fixture/test
- [x] Production'da `drizzle-kit push` kullanılmıyor. Kanıt: package scripts ve Docker startup yalnızca `scripts/migrate.mjs`
- [x] Migration SQL'i code review'da constraint/index açısından incelendi. Kanıt: `server/db/migrations/0000_wise_reaper.sql`
- [x] Migration dosyaları Docker runtime image içinde bulunuyor. Kanıt: `Dockerfile` copy step
- [x] Uygulama request alırken migration çalıştırmıyor. Kanıt: migration yalnızca script/Docker CMD içinde

### 4.4 Health endpoint'leri

- [x] `/api/health/live` DB kapalı olsa da process durumunu doğru veriyor. Kanıt: endpoint DB import etmiyor; local HTTP 200 [phase-1-runtime.md](./self-hosted-redesign/phase-1-runtime.md#health-endpoint-sonuçları)
- [x] `/api/health/ready` `SELECT 1` çalıştırıyor. Kanıt: `server/db/health.ts`, local HTTP 200
- [ ] Readiness bekleyen migration varsa healthy dönmüyor. Kısmi: `runtime_checks` table check var; negatif HTTP testi henüz çalıştırılmadı.
- [ ] Readiness data dizini yazılamazsa healthy dönmüyor. Kısmi: write probe var; permission negatif testi çalıştırılmadı.
- [x] Health response secret/path/schema detayı sızdırmıyor. Kanıt: local response body [phase-1-runtime.md](./self-hosted-redesign/phase-1-runtime.md#health-endpoint-sonuçları)
- [x] Health endpoint auth gerektirmiyor fakat pahalı işlem yapmıyor. Kanıt: unauthenticated local HTTP 200; readiness sadece write probe + `SELECT 1` + table check
- [x] Platform health interval/timeout/retry değerleri belgelendi. Kanıt: `docker-compose.yml` healthcheck

### 4.5 Dockerfile ve Compose

- [x] Multi-stage Dockerfile kullanılıyor. Kanıt: `Dockerfile`
- [x] Install lockfile'a bağlı ve deterministik. Kanıt: `npm ci` Docker deps stage
- [x] Host `node_modules` image'a kopyalanmıyor. Kanıt: `.dockerignore`
- [x] `next.config` standalone output üretiyor. Kanıt: `next.config.ts`, `npm.cmd run build`
- [x] Standalone server, `public` ve `.next/static` doğru kopyalanıyor. Kanıt: `Dockerfile`
- [ ] `better-sqlite3` Linux runtime'da yükleniyor. Bekliyor: Docker daemon kapalı olduğu için container smoke çalıştırılamadı.
- [x] Runtime image gereksiz build tool taşımıyor. Kanıt: runtime stage `node:22-bookworm-slim`, build deps ayrı stage'de.
- [x] Container non-root user ile çalışıyor. Kanıt: `USER nextjs`
- [ ] Yalnızca `/app/data` yazılabilir olacak şekilde izinler test edildi. Kısmi: Dockerfile yalnızca `/app/data` ownership veriyor; container test çalışmadı.
- [x] Port ve hostname platformla uyumlu. Kanıt: `PORT=3000`, `HOSTNAME=0.0.0.0`
- [x] Compose tek application service içeriyor. Kanıt: `docker-compose.yml`
- [x] Compose named/bind volume açıkça tanımlı. Kanıt: `neta-data:/app/data`
- [x] Compose healthcheck readiness endpoint'ini kullanıyor. Kanıt: `docker-compose.yml`
- [x] Restart policy belgelendi. Kanıt: `restart: unless-stopped`
- [x] Replica sayısının 1 olması compose/deploy dokümanına yazıldı. Kanıt: [phase-1-runtime.md](./self-hosted-redesign/phase-1-runtime.md#docker-durumu)

### 4.6 Persistence ve restart testleri

- [ ] Boş volume ile container ilk boot tamamlandı. Bekliyor: Docker daemon kapalı.
- [x] Test kaydı yazıldı. Kanıt: `npm.cmd run phase1:smoke`
- [ ] Container normal restart edildi ve kayıt korundu. Kısmi local equivalent: DB reopen persistence smoke geçti; container restart bekliyor.
- [ ] Image yeniden build edilip aynı volume ile başlatıldı ve kayıt korundu. Bekliyor: Docker daemon kapalı.
- [ ] Container silinip volume korunarak yeniden oluşturuldu ve kayıt korundu. Bekliyor: Docker daemon kapalı.
- [x] Volume olmadan yapılan yanlış deploy'un veri kaybı riski dokümante edildi. Kanıt: [phase-1-runtime.md](./self-hosted-redesign/phase-1-runtime.md#docker-durumu)
- [x] İki instance aynı volume'a bağlandığında desteklenmediği açıkça test/dokümante edildi. Kanıt: [phase-1-runtime.md](./self-hosted-redesign/phase-1-runtime.md#docker-durumu); runtime multi-instance testi yapılmadı.

### 4.7 Backup/restore proof-of-concept

- [x] SQLite online backup yöntemi kullanılıyor; açık DB dosyası kör kopyalanmıyor. Kanıt: `scripts/backup.mjs`
- [ ] Backup manifest app/schema sürümünü içeriyor. Kısmi: manifest dosya listesi/checksum içeriyor; app/schema sürümü henüz eklenmedi.
- [x] Backup checksum üretiyor. Kanıt: `manifest.json` SHA-256 üretimi, `npm.cmd run phase1:smoke`
- [x] Boş target dizine restore edilebiliyor. Kanıt: `npm.cmd run phase1:smoke`
- [ ] Restore checksum hatasında duruyor. Bekliyor: manifest checksum validation implementasyonu
- [x] Restore üzerine yazmadan önce mevcut data için koruma/onay mekanizması var. Kanıt: `scripts/restore.mjs` `--force` guard
- [x] Restore sonrası migration version okunabiliyor. Kanıt: restore smoke `runtime_checks` row okuyor

### 4.8 Faz 1 çıkış kapısı

- [ ] `docker compose up` ile temiz kurulum healthy oldu. Bekliyor: Docker daemon kapalı.
- [x] Sıfır DB ve upgrade DB migration testleri geçti. Kanıt: `npm.cmd run phase1:smoke`, `npm.cmd run db:migrate` ikinci çalışma
- [ ] Restart persistence testi geçti. Kısmi local equivalent: DB reopen smoke geçti; container restart bekliyor.
- [ ] Native SQLite Docker smoke geçti. Bekliyor: Docker daemon kapalı.
- [ ] Readiness negatif senaryoları geçti. Bekliyor: permission/missing migration negatif HTTP testleri
- [x] Backup/restore POC geçti. Kanıt: `npm.cmd run phase1:smoke`
- [ ] Faz 1 performans ve image boyutu kaydedildi. Bekliyor: Docker image build
- [ ] Faz 2 auth için DB adapter hazır. Kısmi: Drizzle SQLite runtime ve migration zemini hazır; Better Auth adapter/schema Faz 2'de eklenecek.

## 5. Faz 2 - Auth, setup ve yetkilendirme

### 5.1 Better Auth kurulumu

- [x] Better Auth config server-only modülde. Kanıt: `server/auth/auth.ts`, `npm run typecheck`, `npm run build`
- [x] Drizzle SQLite adapter doğru provider ile yapılandırılmış. Kanıt: `provider: "sqlite"` ve `npm run build`
- [x] Better Auth schema çıktısı migration'a dahil edilmiş. Kanıt: `server/db/migrations/0001_silky_jetstream.sql`, `npm run db:migrate`, `npm run phase2:smoke`
- [x] Auth GET/POST Route Handler çalışıyor. Kanıt: `app/api/auth/[...all]/route.ts`, `GET /api/auth/get-session -> 200 null`
- [x] `APP_URL`/base URL canonical origin ile eşleşiyor. Kanıt: `server/config.ts`
- [x] Trusted origin listesi wildcard içermiyor. Kanıt: `server/config.ts`
- [x] `BETTER_AUTH_SECRET` production'da zorunlu ve yüksek entropili. Kanıt: `server/config.ts`, `.env.example`
- [x] Auth secret log veya client bundle'a girmiyor. Kanıt: secret yalnız server-only auth/config modüllerinde kullanılıyor.
- [x] Cookie adı, path, `HttpOnly`, `SameSite` ve `Secure` ayarları doğrulandı. Kanıt: `server/auth/auth.ts`
- [ ] Reverse proxy arkasında HTTPS/cookie davranışı test edildi.

### 5.2 İlk kurulum

- [ ] Boş DB'de `/setup` erişilebilir.
- [ ] Dolu DB'de `/setup` hassas bilgi vermeden kapalı.
- [x] İlk freelancer oluşturma tek transaction/atomic guard ile korunuyor. Kanıt: `server/auth/setup.ts`
- [ ] Eşzamanlı iki setup isteğinden yalnızca biri başarılı oluyor.
- [x] İlk user profile rolü `freelancer`. Kanıt: `completeFirstFreelancerSetup`
- [x] Public genel register route'u yok veya kalıcı kapalı. Kanıt: Better Auth user create hook'u ilk freelancer guard'ına bağlı.
- [x] Setup input'u email normalize ve password policy uyguluyor. Kanıt: `server/auth/validation.ts`
- [ ] Setup başarı sonrası session/redirect doğru.
- [x] Setup olayı audit log'a secret olmadan yazılıyor. Kanıt: `auth_audit_events`, `server/auth/setup.ts`

### 5.3 Session helper'ları

- [x] `getSession` request içinde gereksiz tekrar DB sorgusu yapmıyor. Kanıt: React `cache()` ile `getSessionContext`
- [x] `requireSession` session yoksa standart davranış üretiyor. Kanıt: `/` ve `/portal` unauthenticated -> `307 /login`
- [x] `requireFreelancer` client rolünü reddediyor. Kanıt: `server/auth/session.ts`
- [x] `requireClientUser` freelancer rolünü reddediyor. Kanıt: `server/auth/session.ts`
- [x] Session user ve profile role uyumsuzluğu güvenli fail ediyor. Kanıt: profil yok/disabled ise session context `null`
- [x] Disabled user session'ı reddediliyor. Kanıt: `server/auth/session.ts`
- [x] Logout session'ı server tarafında iptal ediyor. Kanıt: `auth.api.signOut`
- [ ] Parola değişimi sonrası session revoke politikası test edildi.
- [ ] Expired session otomatik kabul edilmiyor.

### 5.4 Ownership/policy helper'ları

- [ ] `requireOwnedClient` owner predicate kullanıyor.
- [ ] `requireOwnedProject` owner predicate kullanıyor.
- [ ] Task erişimi project üzerinden dolaylıysa her iki bağ doğrulanıyor.
- [ ] Finance erişimi owner predicate kullanıyor.
- [ ] File erişimi owner/resource ilişkisini doğruluyor.
- [ ] Portal project erişimi portal user -> client -> project zincirini tek server akışında doğruluyor.
- [ ] Helper'lar resource bulunamadı ile yetkisiz ayrımında bilgi sızdırmıyor.
- [ ] Helper dışında doğrudan ID ile mutation yapılmasını engelleyen code review kuralı yazıldı.

### 5.5 Login/logout/parola UX

- [x] Yanlış email/parola genel hata veriyor; hesap varlığını açığa çıkarmıyor. Kanıt: `app/login/actions.ts`
- [x] Login pending ve double-submit koruması var. Kanıt: mevcut `SubmitButton` server action pending state'i kullanıyor.
- [x] Başarılı login role göre doğru alana yönlendiriyor. Kanıt: `app/login/actions.ts`
- [x] Logout tüm shell'lerden erişilebilir. Kanıt: dashboard shell mevcut logout action'ını kullanıyor.
- [ ] Parola formu mevcut parola/yenisi/onay validation'ına sahip.
- [ ] Parola policy metni ve server kuralı uyumlu.
- [ ] Login formu keyboard ve password manager ile çalışıyor.
- [x] Auth ekranlarında açık redirect parametresi saldırısı yok. Kanıt: login/signup action'ları redirect parametresi kabul etmiyor.

### 5.6 Rate limit ve audit

- [x] Login başarısız denemeleri IP+identifier bazında kontrollü sınırlanıyor. Kanıt: Better Auth `/sign-in/email` custom rate limit.
- [x] Setup endpoint'i rate limit altında. Kanıt: Better Auth `/sign-up/email` custom rate limit.
- [ ] Davet tüketim endpoint'i rate limit altında.
- [ ] Reverse proxy rate limit önerisi deploy dokümanında.
- [x] Audit log login başarısı/başarısızlığı için hassas veri taşımıyor. Kanıt: `recordAuthAuditEvent` password/session token yazmıyor.
- [ ] Log retention ve temizleme yaklaşımı belgelendi.

### 5.7 Auth negatif test matrisi

- [x] Session yokken dashboard redirect/401. Kanıt: `GET / -> 307 /login`
- [ ] Session yokken Server Action mutation reddi.
- [ ] Session yokken korumalı Route Handler reddi.
- [ ] Client rolü dashboard query reddi.
- [ ] Client rolü freelancer mutation reddi.
- [ ] Freelancer rolü portal-only mutation reddi.
- [ ] Başka freelancer owner ID'siyle client/project/task erişimi reddi.
- [ ] Expired/revoked session reddi.
- [ ] Sahte cookie veya değiştirilmiş session token reddi.
- [ ] Yanlış Origin ile auth mutation reddi.

### 5.8 Faz 2 çıkış kapısı

- [ ] Supabase olmadan setup-login-protected page-logout akışı geçti.
- [ ] İkinci public freelancer oluşturulamadı.
- [ ] Tüm negatif auth testleri geçti.
- [ ] Production proxy/TLS arkasında cookie testi geçti.
- [x] Auth migration boş ve upgrade DB'de geçti. Kanıt: `npm run db:migrate`, `npm run phase2:smoke`
- [ ] Security review bloklayıcı bulgu bırakmadı.
- [x] Faz 3 shell'in kullanacağı session/profile contract kilitlendi. Kanıt: `SessionContext` ve layout user contract'ı Better Auth profile'dan besleniyor.

## 6. Faz 3 - Neta UI sistemi ve app shell

### 6.1 Tasarım token'ları

- [ ] Renk token'ları semantik adlarla tanımlı.
- [ ] `--poyraz-*` token'ları yeni shell kapsamında kullanılmıyor.
- [ ] Background/surface/border/text/interactive renkleri tek kaynaktan geliyor.
- [ ] Default, hover, active, focus, disabled ve danger halleri tanımlı.
- [ ] Typography ölçeği compact operasyonel UI'a uygun.
- [ ] Font size viewport genişliğiyle ölçeklenmiyor.
- [ ] Letter spacing negatif değil.
- [ ] Spacing ve control height ölçekleri tanımlı.
- [ ] Radius varsayılanı 8 px veya altında.
- [ ] Reduced motion token/kuralı var.
- [ ] Renk contrast ölçümleri kaydedildi.

### 6.2 Primitive bileşenler

- [ ] `Button` tüm varyant ve boyutlarıyla hazır.
- [ ] `IconButton` accessible name/tooltip kuralına sahip.
- [ ] `Input` ve `Textarea` error/disabled/read-only halleri hazır.
- [ ] `Label`/`Field` description/error ID bağlantılarını kuruyor.
- [ ] `Checkbox` ve `Switch` keyboard ile çalışıyor.
- [ ] `Select` keyboard/typeahead/focus ile çalışıyor.
- [ ] `Dialog` focus trap, Escape ve focus return davranışına sahip.
- [ ] `AlertDialog` destructive aksiyonu açıkça ayırıyor.
- [ ] `Drawer` mobil viewport ve scroll ile çalışıyor.
- [ ] `DropdownMenu` keyboard ve dışarı tıklama davranışına sahip.
- [ ] `Tabs` ARIA ve arrow-key davranışına sahip.
- [ ] `Tooltip` yalnız hover'a bağımlı değil.
- [ ] `Toast` screen reader live region kullanıyor.
- [ ] `Skeleton` gerçek layout ölçülerini gereksiz kaydırmıyor.
- [ ] `EmptyState` tek anlamlı primary action taşıyor.
- [ ] `Pagination` current/disabled durumlarını açıklıyor.
- [ ] `DataTable` mobil fallback stratejisine sahip.

### 6.3 Dependency sınırı

- [ ] Headless UI paketi yalnız `components/ui` içinden import ediliyor.
- [ ] Feature dosyaları doğrudan Poyraz/Radix/Base UI import etmiyor.
- [ ] İkonlar yalnız Lucide üzerinden geliyor veya istisna belgeli.
- [ ] CVA/clsx/tailwind-merge kullanımı tek helper standardına indirildi.
- [ ] Aynı işlevi gören iki toast/dialog/select implementation'ı yok.
- [ ] Internal primitive public prop API'si yazılı ve tipli.

### 6.4 Shell ve navigasyon

- [ ] Dashboard shell role/session contract'ını server'dan alıyor.
- [ ] Portal shell bağımsız ama aynı primitive'leri kullanıyor.
- [ ] Auth shell responsive ve form odaklı.
- [ ] Sidebar aktif route'u doğru gösteriyor.
- [ ] Link tıklamasında pending state var.
- [ ] Mobil menü route değişince kapanıyor.
- [ ] Mobil navigasyon içerikle çakışmıyor.
- [ ] Header sabit ölçüde ve dinamik metinle layout kaydırmıyor.
- [ ] Uzun kullanıcı/proje adları truncate/wrap kuralına sahip.
- [ ] Skip link veya eşdeğer keyboard ana içerik erişimi var.
- [ ] Logout ve account menüsü keyboard ile kullanılabiliyor.

### 6.5 Form ve feedback standardı

- [ ] Ortak ActionResult UI adapter'ı var.
- [ ] Pending button double-submit'i engelliyor.
- [ ] Field error server validation ile eşleşiyor.
- [ ] Form-level error görünür ve screen reader tarafından okunuyor.
- [ ] Success toast yalnız commit sonrası gösteriliyor.
- [ ] Error toast teknik detay göstermiyor.
- [ ] Optimistic rollback pattern'i örnek feature ile test edildi.
- [ ] Route skeleton ve link pending aynı anda çelişkili sinyal üretmiyor.

### 6.6 Responsive ve görsel doğrulama

- [ ] 320x568 auth/shell ekran görüntüsü kontrol edildi.
- [ ] 390x844 mobil ekran kontrol edildi.
- [ ] 768x1024 tablet kontrol edildi.
- [ ] 1440x900 desktop kontrol edildi.
- [ ] 1920x1080 geniş desktop kontrol edildi.
- [ ] Browser zoom %200 ile kritik shell kullanılabilir.
- [ ] Uzun Türkçe/İngilizce metinler buton ve navigation içinde test edildi.
- [ ] UI elementleri birbiriyle overlap etmiyor.
- [ ] Fixed/sticky alanlar içerik veya submit butonunu kapatmıyor.

### 6.7 Faz 3 çıkış kapısı

- [ ] Yeni auth/dashboard/portal shell doğrudan Poyraz import etmiyor.
- [ ] Internal primitive test sayfası veya component testleri geçti.
- [ ] Keyboard/focus/contrast bloklayıcısı yok.
- [ ] Tüm hedef viewport screenshot'ları incelendi.
- [ ] UI dependency sınırını denetleyen lint/import kuralı mevcut.
- [ ] Feature mapping tablosunda her Poyraz component'in hedefi belli.
- [ ] Faz 4 core feature'ları için UI API'si yeterli.

## 7. Faz 4 - Core: clients, projects, tasks, calendar ve dashboard

### 7.1 Ortak veri modeli

- [ ] UUID text standardı uygulanmış.
- [ ] Timestamp/date standardı uygulanmış.
- [ ] `owner_id` tüm core tablolarda not null ve FK.
- [ ] FK on-delete davranışları ürün davranışıyla uyumlu.
- [ ] Status/type alanlarında DB check constraint var.
- [ ] Mutable tablolarda created/updated timestamp var.
- [ ] Kritik listeler için composite index migration'a ekli.
- [ ] Seed hem tipik hem stres verisi üretiyor.

### 7.2 Clients

- [ ] Client schema tüm aktif alanları kapsıyor.
- [ ] Pipeline stage kanonik enum/check kullanıyor.
- [ ] List query seçili kolon ve pagination kullanıyor.
- [ ] Search normalize edilmiş name/company/email alanlarında çalışıyor.
- [ ] Detail query activity'leri limit/cursor ile alıyor.
- [ ] Create ownership'i session'dan alıyor; input owner kabul etmiyor.
- [ ] Update `id + owner_id` predicate kullanıyor.
- [ ] Delete/archive ürün kararı uygulanmış.
- [ ] Client silmede bağlı project/finance davranışı test edilmiş.
- [ ] Pipeline drag/drop optimistic ve rollback'li.
- [ ] Başka owner client ID'si negatif testi geçiyor.
- [ ] Client CRUD E2E geçiyor.

### 7.3 Client activities

- [ ] Activity type constraint doğru.
- [ ] Activity client ve owner ilişkisi create sırasında doğrulanıyor.
- [ ] Activity başka owner client'ına eklenemiyor.
- [ ] Activity date timezone dönüşümü test edilmiş.
- [ ] Activity list deterministic order kullanıyor.
- [ ] Empty/loading/error state mevcut.

### 7.4 Projects

- [ ] Project schema type/status/progress constraints içeriyor.
- [ ] Progress 0-100 DB ve validation sınırında.
- [ ] Project-client ilişkisinde aynı owner doğrulanıyor.
- [ ] Side project client olmadan oluşturulabiliyor.
- [ ] Client project geçerli owned client gerektiriyor.
- [ ] Project list pagination ve filtre kullanıyor.
- [ ] Task stats aggregate sorguyla geliyor.
- [ ] Project detail query bağımsız blokları paralel/etkin alıyor.
- [ ] `select *` eşdeğeri sorgu yok.
- [ ] Cover image alanı Phase 6 gelene kadar güvenli nullable/fallback.
- [ ] Complete/cancel status geçiş kuralları test edildi.
- [ ] Başka owner project ID'si negatif testi geçiyor.
- [ ] Project CRUD E2E geçiyor.

### 7.5 Project planning sections

- [ ] Kanonik alan adı `category`.
- [ ] Kanonik sıra alanı `sort_order`.
- [ ] Legacy `type` veya `order_index` kodda kullanılmıyor.
- [ ] Category check constraint ürün listesiyle uyumlu.
- [ ] Create/update/delete project owner'ını doğruluyor.
- [ ] Reorder transaction veya idempotent batch update kullanıyor.
- [ ] Duplicate/collision sort order davranışı deterministic.
- [ ] Portalda gösterilebilir alan contract'ı ayrı test edilmiş.

### 7.6 Tasks

- [ ] Kanonik status `todo|in_progress|done|cancelled`.
- [ ] `completed` runtime kodda status olarak kullanılmıyor.
- [ ] Priority constraint doğru.
- [ ] Task-project-client ilişkileri aynı owner'a ait.
- [ ] Task list default limit ve cursor kullanıyor.
- [ ] Kanban yalnız ihtiyaç duyulan kolonları alıyor.
- [ ] Status drag/drop optimistic ve rollback'li.
- [ ] Liste “tamamla” aynı service/action yolunu kullanıyor.
- [ ] Double mutation ve stale optimistic state test edilmiş.
- [ ] Public-to-client flag yalnız owned project task'ında değiştirilebiliyor.
- [ ] Task delete sonrası auto project progress hesaplanıyor.
- [ ] Task project değişince eski ve yeni project progress hesaplanıyor.
- [ ] Auto progress update aynı transaction'da.
- [ ] Manual progress project task değişiminden etkilenmiyor.
- [ ] Zero-task auto progress sonucu tanımlı ve testli.
- [ ] 10.000 task query planı index kullanıyor.
- [ ] Task CRUD/status E2E geçiyor.

### 7.7 Calendar

- [ ] Event type constraint doğru.
- [ ] `ends_at >= starts_at` doğrulanıyor.
- [ ] Event ilişkili client/project/task ownership doğrulanıyor.
- [ ] Görünür tarih aralığı dışında kayıt çekilmiyor.
- [ ] Timezone dönüşümü create/edit/display için test edildi.
- [ ] DST geçiş günü testi var.
- [ ] Month/week navigation stale veri göstermiyor.
- [ ] Mobile event create/edit formu erişilebilir.
- [ ] Calendar CRUD E2E geçiyor.

### 7.8 Dashboard

- [ ] Dashboard tek tek tüm satırları istemciye taşımıyor.
- [ ] Active project count SQL aggregate.
- [ ] Completed task count `done` kullanıyor.
- [ ] Income/expense/net minor unit ile hesaplanıyor.
- [ ] Mood/daily trend hedef date range ile sınırlı.
- [ ] Recent projects/clients limitli ve deterministic order.
- [ ] Empty yeni kurulum dashboard'u anlamlı.
- [ ] Date filter URL/state contract'ı testli.
- [ ] Dashboard stres fixture DB süresi hedefte.
- [ ] Dashboard payload baseline ile karşılaştırıldı.

### 7.9 Supabase/Poyraz feature temizliği

- [ ] Clients feature içinde Supabase import kalmadı.
- [ ] Projects feature içinde Supabase import kalmadı.
- [ ] Tasks feature içinde Supabase import kalmadı.
- [ ] Calendar feature içinde Supabase import kalmadı.
- [ ] Dashboard içinde Supabase import kalmadı.
- [ ] Bu feature'larda Poyraz import kalmadı.
- [ ] Eski action/query dosyaları silindi veya yeni implementation'a dönüştü.
- [ ] Kullanılmayan RPC çağrıları kaldırıldı.

### 7.10 Faz 4 çıkış kapısı

- [ ] Core smoke matrisi desktop'ta geçti.
- [ ] Core smoke matrisi mobilde geçti.
- [ ] Cross-owner negatif matrisi geçti.
- [ ] Auto progress invariants testleri geçti.
- [ ] Stress fixture query plan ve süre raporu onaylandı.
- [ ] Core feature route'larında Supabase/Poyraz referansı sıfır.
- [ ] Faz 4 veritabanı upgrade/rollback backup testi geçti.

## 8. Faz 5 - Finans, iş belgeleri, günlük ve analytics

### 8.1 Para standardı

- [ ] Tüm monetary alanlar minor unit integer.
- [ ] Currency ISO kodu normalize ediliyor.
- [ ] String decimal parser locale ayracını kontrollü ele alıyor.
- [ ] Floating point ile toplam yapılmıyor.
- [ ] Negative amount izinleri type/business rule ile açık.
- [ ] Büyük değer overflow sınırı test edilmiş.
- [ ] Formatlama locale ve currency ile doğru.
- [ ] Legacy `numeric(12,2)` conversion unit testleri var.

### 8.2 Finance transactions

- [ ] Type ve payment status constraints doğru.
- [ ] Client/project aynı owner'a ait.
- [ ] Date range zorunlu/default limitli.
- [ ] Pagination deterministic.
- [ ] Create/update/delete owner predicate kullanıyor.
- [ ] Gelir/gider/net aggregate DB'de hesaplanıyor.
- [ ] Project finance summary tüm satırı client'a taşımıyor.
- [ ] CSV/export varsa stream ve auth kontrolü kullanıyor.
- [ ] 20.000 finance fixture query planı index kullanıyor.
- [ ] Finance CRUD/filter E2E geçiyor.

### 8.3 Proposals

- [ ] Status transition matrisi yazılı ve enforce ediliyor.
- [ ] Client/project ownership doğrulanıyor.
- [ ] Valid-until date timezone kuralı belirli.
- [ ] Amount minor unit kullanıyor.
- [ ] CRUD validation ve cross-owner testleri geçiyor.
- [ ] Empty/loading/error/pending halleri var.

### 8.4 Contracts

- [ ] Proposal/client ilişkisi aynı owner'a ait.
- [ ] Contract status transition matrisi enforce ediliyor.
- [ ] Signed-at yalnız uygun transition'da set ediliyor.
- [ ] Content boyut limiti belirli.
- [ ] CRUD ve cross-owner testleri geçiyor.

### 8.5 Invoices

- [ ] Invoice number owner bazında unique.
- [ ] Tax rate temsil ve yuvarlama kuralı belirli.
- [ ] Issue/due/paid tarih invariant'ları var.
- [ ] Paid transition idempotent.
- [ ] Otomatik finance transaction oluşturuluyorsa tek transaction ve duplicate koruması var.
- [ ] Overdue hesaplama timezone/date standardıyla uyumlu.
- [ ] Invoice toplamları fixture ile kuruş seviyesinde doğrulandı.
- [ ] CRUD/status E2E geçiyor.

### 8.6 Subscriptions

- [ ] Billing cycle constraint doğru.
- [ ] Next billing date hesap kuralı ay sonlarını ele alıyor.
- [ ] Cancelled subscription tekrar charge/forecast'a girmiyor.
- [ ] Currency/amount standardı doğru.
- [ ] CRUD/filter E2E geçiyor.

### 8.7 Journal birleşimi

- [ ] `journal_entries` schema `daily_checkin` ve `journal` tiplerini kapsıyor.
- [ ] Daily checkin için owner+date unique kuralı var.
- [ ] Serbest journal aynı gün birden fazla kaydı destekliyor.
- [ ] Mood label ve score dönüşüm kuralı yazılı.
- [ ] Energy/satisfaction score sınırları enforce ediliyor.
- [ ] Legacy AI alanlarının korunma/drop kararı kaydedildi.
- [ ] Çakışan `journals`/`daily_logs` fixture'ı kayıpsız import ediliyor.
- [ ] Journal CRUD/filter E2E geçiyor.

### 8.8 Analytics

- [ ] Dashboard RPC çıktısının her alanı yeni query ile eşleşiyor veya değişiklik belgeli.
- [ ] Analytics RPC çıktısının her alanı yeni query ile eşleşiyor veya değişiklik belgeli.
- [ ] Task completion yalnız `done` kullanıyor.
- [ ] Date range dahil/haric sınırları testli.
- [ ] Project income grouping null project'i kontrollü adlandırıyor.
- [ ] Chart payload limitli ve sıralı.
- [ ] Raw finance/task/project satırları analytics client'a gitmiyor.
- [ ] Empty date range sonucu hata değil, boş/zero state.
- [ ] Stres fixture analytics süresi hedefte.

### 8.9 Feature temizliği

- [ ] Finance feature Supabase/Poyraz import'u içermiyor.
- [ ] Business feature'lar Supabase/Poyraz import'u içermiyor.
- [ ] Journal feature Supabase/Poyraz import'u içermiyor.
- [ ] Analytics feature Supabase/Poyraz import'u içermiyor.
- [ ] Eski aggregate RPC runtime çağrıları kaldırıldı.

### 8.10 Faz 5 çıkış kapısı

- [ ] Finans source/target fixture toplamları tam eşleşiyor.
- [ ] Para rounding testleri geçti.
- [ ] Tüm business status transition testleri geçti.
- [ ] Journal conflict fixture kayıpsız.
- [ ] Analytics payload ve performans hedefi geçti.
- [ ] Faz 5 route'larında Supabase/Poyraz referansı sıfır.

## 9. Faz 6 - Storage, profil ve proje görselleri

### 9.1 Files schema ve storage key

- [ ] `files` tablosu owner, kind, key, MIME, size ve checksum içeriyor.
- [ ] `storage_key` unique.
- [ ] Absolute disk path DB'ye yazılmıyor.
- [ ] Original filename yalnız metadata/display için kullanılıyor.
- [ ] Storage key server tarafından üretiliyor.
- [ ] Resource ilişki modeli avatar/project asset için açık.
- [ ] Delete davranışı FK ve service düzeyinde belirli.

### 9.2 Upload doğrulama

- [ ] Maksimum byte limiti request okunurken uygulanıyor.
- [ ] Content-Type allowlist var.
- [ ] Magic-byte/file signature doğrulaması var.
- [ ] Double extension ve sahte MIME testleri var.
- [ ] Path traversal karakterleri storage key'e girmiyor.
- [ ] Boş/bozuk dosya reddediliyor.
- [ ] Upload temp dizine yazılıyor.
- [ ] Başarılı doğrulama sonrası atomik rename kullanılıyor.
- [ ] DB failure sonrası temp/final dosya temizleniyor.
- [ ] Disk full/permission error güvenli hata üretiyor.
- [ ] Upload log'u dosya içeriği veya hassas path göstermiyor.

### 9.3 Dosya sunumu ve auth

- [ ] File Route Handler session doğruluyor.
- [ ] Owner dosyası `id + owner_id` ilişkisiyle kontrol ediliyor.
- [ ] Portal file erişimi client->project zinciriyle kontrol ediliyor.
- [ ] Başka owner file UUID'si 404/uygun güvenli cevap veriyor.
- [ ] Response MIME ve `X-Content-Type-Options: nosniff` doğru.
- [ ] Private cache header'ı uygun.
- [ ] Range request gereksinimi değerlendirildi.
- [ ] Filename header injection testi var.
- [ ] Silinmiş metadata veya eksik disk dosyası kontrollü hata veriyor.

### 9.4 Avatar akışı

- [ ] Avatar upload/replace/delete çalışıyor.
- [ ] Eski avatar replace sonrası orphan kalmıyor.
- [ ] Avatar fallback initials doğru.
- [ ] Avatar UI büyük original dosyayı kontrolsüz indirmiyor.
- [ ] Profile update ile avatar update transaction/cleanup sınırı testli.
- [ ] Client portal avatar görünürlüğü ürün kararına uygun.

### 9.5 Proje görseli akışı

- [ ] Cover upload/replace/delete çalışıyor.
- [ ] Project ownership upload öncesi doğrulanıyor.
- [ ] Alt text input ve fallback kuralı var.
- [ ] Listede görünür olmayan tüm görseller için URL/metadata üretilmiyor.
- [ ] Broken image fallback var.
- [ ] Project silme sonrası asset cleanup politikası uygulanıyor.

### 9.6 Orphan ve bakım araçları

- [ ] DB'de olup diskte olmayan dosya raporu var.
- [ ] Diskte olup DB'de olmayan dosya raporu var.
- [ ] Cleanup varsayılan olarak dry-run.
- [ ] Gerçek delete açık onay/flag gerektiriyor.
- [ ] Cleanup uploads kökü dışına çıkamıyor.
- [ ] Cleanup sonucu audit/log kaydı oluşturuyor.

### 9.7 Backup/restore

- [ ] Backup DB ve uploads'u aynı manifestte kapsıyor.
- [ ] Her dosya checksum manifestte veya checksum dosyasında.
- [ ] Backup sırasında yeni upload davranışı tanımlı/testli.
- [ ] Restore sonrası metadata-file count eşleşiyor.
- [ ] Restore sonrası rastgele dosyalar checksum eşleşiyor.
- [ ] Backup arşivi secret kabul edilip izinleri sınırlandırılmış.

### 9.8 Faz 6 çıkış kapısı

- [ ] Avatar ve cover E2E akışları geçti.
- [ ] MIME/path/size saldırı testleri geçti.
- [ ] Cross-owner ve cross-client file testleri geçti.
- [ ] Orphan dry-run temiz sonuç veriyor.
- [ ] DB+uploads backup/restore tatbikatı geçti.
- [ ] Supabase Storage runtime çağrısı kalmadı.

## 10. Faz 7 - Portal, davetler ve revizyonlar

### 10.1 Davet modeli

- [ ] Davet token'ı CSPRNG ile yeterli entropide üretiliyor.
- [ ] DB'de yalnız token hash saklanıyor.
- [ ] Davet client ve inviter owner ilişkisini doğruluyor.
- [ ] Davet expiry zorunlu.
- [ ] Davet tek kullanımlık.
- [ ] Revoke ve regenerate davranışı var.
- [ ] Aynı client için aktif davet sayısı kuralı belirli.
- [ ] Ham token log/audit/analytics'e girmiyor.
- [ ] Davet linki yalnız creation anında bir kez gösteriliyor.
- [ ] Open redirect veya host header ile yanlış origin linki üretilemiyor.

### 10.2 Portal hesabı kurulumu

- [ ] Valid token client adını minimum veriyle gösteriyor.
- [ ] Expired token genel güvenli hata gösteriyor.
- [ ] Revoked token reddediliyor.
- [ ] Used token tekrar reddediliyor.
- [ ] Parola policy uygulanıyor.
- [ ] Davet tüketimi + user oluşturma + client link atomic.
- [ ] Aynı token için eşzamanlı iki request'ten yalnız biri başarılı.
- [ ] Portal user role `client`.
- [ ] Portal user başka client kaydına bağlanamıyor.
- [ ] Setup sonrası session/redirect doğru.

### 10.3 Portal veri erişimi

- [ ] Project list yalnız bağlı client'ın projelerini gösteriyor.
- [ ] Project detail client-project ilişkisini sorguda doğruluyor.
- [ ] Planning section yalnız bağlı project için geliyor.
- [ ] Task list yalnız `is_public_to_client=true` kayıtları gösteriyor.
- [ ] Finance/internal notes portal payload'ına yanlışlıkla girmiyor.
- [ ] Owner/user ID gibi gereksiz internal alanlar portal response'ta yok.
- [ ] Başka client project ID'siyle list/detail erişimi reddediliyor.
- [ ] URL enumeration güvenli sonuç veriyor.

### 10.4 Revizyon kuralları

- [ ] Revision create server session'dan `requested_by` alıyor.
- [ ] Client ID input'a güvenmiyor; session ilişkisinden çözüyor.
- [ ] Project-client ilişkisi aynı sorgu/transaction içinde doğrulanıyor.
- [ ] Quota değeri negative olamıyor.
- [ ] Kullanılmış kota hesabının hangi status'ları saydığı belgeli.
- [ ] Quota check ve insert aynı transaction'da.
- [ ] Eşzamanlı iki son kota isteğinden yalnız biri başarılı.
- [ ] Action/Route doğrudan çağrılsa da quota aşılamıyor.
- [ ] Freelancer revision status transition'larını yönetebiliyor.
- [ ] Client izin verilmeyen status değişimini yapamıyor.
- [ ] Revision description boyut ve içerik validation'ına sahip.

### 10.5 Hesap kapatma ve session

- [ ] Freelancer portal erişimini devre dışı bırakabiliyor.
- [ ] Disable işlemi aktif session'ları revoke ediyor.
- [ ] Client record silme/archive ile portal account davranışı belirli.
- [ ] Re-enable/re-invite akışı belirli.
- [ ] Freelancer portal kullanıcısının parolasını göremiyor.
- [ ] Audit log invite/create/disable olaylarını secret olmadan kaydediyor.

### 10.6 Portal UX

- [ ] Portal shell freelancer navigation göstermiyor.
- [ ] Mobil project/task/revision akışları kullanılabilir.
- [ ] Empty project/task/revision durumları anlamlı.
- [ ] Revision submit pending/double-submit korumalı.
- [ ] Quota kalan bilgisi server gerçeğiyle uyumlu.
- [ ] Project status/progress erişilebilir biçimde gösteriliyor.
- [ ] Client logout/account alanı açık.

### 10.7 Portal negatif test matrisi

- [ ] Client A, Client B project list/detail erişimi reddi.
- [ ] Client A, Client B public task erişimi reddi.
- [ ] Client A, Client B planning section erişimi reddi.
- [ ] Client A, Client B revision okuma erişimi reddi.
- [ ] Client A'nın Client B project ID'sine kendi client ID'siyle revision eklemesi reddi.
- [ ] Freelancer'ın client-only revision create akışı reddi veya ürün kuralına uygun.
- [ ] Disabled client session reddi.
- [ ] Expired/revoked/reused invite reddi.

### 10.8 Faz 7 çıkış kapısı

- [ ] Invite -> set password -> portal -> revision E2E geçti.
- [ ] Tüm cross-client negatif testleri geçti.
- [ ] Quota concurrency testi geçti.
- [ ] Account disable session revoke testi geçti.
- [ ] Portal route'larında Supabase/Poyraz referansı sıfır.
- [ ] Portal güvenlik review bloklayıcı bulgu bırakmadı.

## 11. Faz 8 - AI/chat, performans ve UX sertleştirme

### 11.1 AI ayarları ve secret yönetimi

- [ ] AI tamamen opsiyonel config.
- [ ] Key yokken core app build/boot/run ediyor.
- [ ] Env key ve user-saved key öncelik sırası belgeli.
- [ ] DB key authenticated encryption ile saklanıyor.
- [ ] Encryption nonce/tag doğru ve her kayıt için yeni.
- [ ] `APP_ENCRYPTION_KEY` eksikse şifreli key özelliği güvenli fail ediyor.
- [ ] Ayarlar ekranı kaydedilmiş key'i geri göstermiyor.
- [ ] Key update/delete akışı çalışıyor.
- [ ] Key hiçbir API response, RSC prop, log veya error'da görünmüyor.
- [ ] Encryption key rotation prosedürü yazıldı.

### 11.2 Chat persistence

- [ ] Chat session owner predicate kullanıyor.
- [ ] Chat message session ownership üzerinden doğrulanıyor.
- [ ] Browser Supabase client kaldırıldı.
- [ ] Session list limit/cursor kullanıyor.
- [ ] Message history limit/cursor kullanıyor.
- [ ] Session delete cascade davranışı testli.
- [ ] Empty/new session akışı doğru.
- [ ] Stream tamamlanmadan assistant message persistence davranışı belirli.
- [ ] Abort durumunda partial message politikası belirli.
- [ ] Retry duplicate message üretmiyor veya açıkça işaretli.

### 11.3 AI endpoint güvenliği

- [ ] Chat Route Handler session doğruluyor.
- [ ] Finance analysis session ve owner date range doğruluyor.
- [ ] Project risk project owner'ını doğruluyor.
- [ ] Project risk task complete statüsü `done`.
- [ ] Prompt input boyut limiti var.
- [ ] Context satır/karakter/token limiti var.
- [ ] Provider timeout ve abort var.
- [ ] Provider hata mesajı kullanıcıya güvenli çevriliyor.
- [ ] Endpoint rate limit uygulanmış.
- [ ] Prompt/response logging varsayılan olarak kapalı veya redacted.
- [ ] AI output güvenilir veri olarak DB mutation tetiklemiyor.

### 11.4 Embedding/RAG temizliği

- [ ] `document_embeddings` runtime kod referansı kaldırıldı veya açık feature flag altında.
- [ ] `match_documents` RPC çağrısı kaldırıldı.
- [ ] Legacy embedding export mapping'i Faz 9 için hazır.
- [ ] FTS/vector geleceği ayrı backlog/ADR'ye taşındı.

### 11.5 Query performansı

- [ ] Slow query threshold ve log formatı tanımlı.
- [ ] Dashboard query planı incelendi.
- [ ] Project list/detail query planı incelendi.
- [ ] Task list/kanban query planı incelendi.
- [ ] Client list/detail query planı incelendi.
- [ ] Finance/analytics query planı incelendi.
- [ ] Portal list/detail query planı incelendi.
- [ ] Chat history query planı incelendi.
- [ ] Tüm kritik query'ler stres fixture'ında index kullanıyor.
- [ ] Gereksiz index'ler write maliyeti açısından gözden geçirildi.
- [ ] 100 ms üstü query varsa gerekçe ve takip kaydı var.

### 11.6 RSC ve client bundle

- [ ] Büyük Client Component dosyaları sorumluluklara bölündü.
- [ ] Server render edilebilecek statik alanlar Client Component değil.
- [ ] Recharts yalnız analytics route'unda yükleniyor.
- [ ] DnD yalnız gerekli route'larda yükleniyor.
- [ ] Dialog/form chunk'ları gerektiğinde lazy.
- [ ] Client'a gönderilen props minimum ve serializable.
- [ ] Duplicate date/format/helper kütüphanesi yok.
- [ ] Ana route bundle ölçümleri Faz 0 ile karşılaştırıldı.
- [ ] Beklenmeyen bundle artışı gerekçeli.

### 11.7 UX tutarlılık turu

- [ ] Tüm create formlarında pending/double-submit standardı.
- [ ] Tüm update formlarında pending ve field error standardı.
- [ ] Tüm delete aksiyonlarında nesne adı ve onay standardı.
- [ ] Task/project/pipeline optimistic rollback çalışıyor.
- [ ] Sidebar ve kart navigasyonunda pending feedback var.
- [ ] Kritik route'larda layout'a benzeyen skeleton var.
- [ ] Hata state'i retry veya geri dönüş aksiyonu sunuyor.
- [ ] Empty state'ler yanlış dekoratif metin yerine aksiyon sunuyor.
- [ ] Mobile uzun form submit butonu erişilebilir.
- [ ] Drag/drop olmayan alternatif status kontrolü var.
- [ ] Toast sayısı ve süresi kullanıcıyı boğmıyor.

### 11.8 Erişilebilirlik turu

- [ ] Auth akışı yalnız klavye ile tamamlandı.
- [ ] Client/project/task CRUD yalnız klavye ile tamamlandı.
- [ ] Portal invite/revision yalnız klavye ile tamamlandı.
- [ ] Dialog focus trap/return tüm feature'larda doğru.
- [ ] Tab sırası mantıklı.
- [ ] Icon-only button accessible name taşıyor.
- [ ] Grafiklerin metinsel özeti var.
- [ ] Status yalnız renkle anlatılmıyor.
- [ ] Kontrast bloklayıcısı yok.
- [ ] %200 zoom'da core akışlar tamamlanabiliyor.

### 11.9 Performans bütçesi

- [ ] Referans donanım bilgisi raporda.
- [ ] Dashboard DB süresi hedefte veya istisna onaylı.
- [ ] Liste mutation DB süresi hedefte veya istisna onaylı.
- [ ] Tıklama-feedback süresi 100 ms altında.
- [ ] Liste payload'ı kayıt sayısıyla limitsiz büyümüyor.
- [ ] Stress fixture'da memory kullanımı stabil.
- [ ] 20 dakikalık temel kullanımda connection/file descriptor leak yok.
- [ ] AI stream core request thread'lerini kilitlemiyor.

### 11.10 Faz 8 çıkış kapısı

- [ ] Browser Supabase client referansı sıfır.
- [ ] AI key sızıntı testleri geçti.
- [ ] AI disabled E2E geçti.
- [ ] Performance raporu hedefleri karşıladı veya onaylı istisnalar var.
- [ ] Core ve portal accessibility smoke geçti.
- [ ] UX mutation matrisi tutarlı.
- [ ] Faz 9 için target schema ve dönüşüm kuralları donduruldu.

## 12. Faz 9 - Supabase export/import ve cutover provası

### 12.1 Export aracı güvenliği

- [ ] Export aracı production runtime dependency'si değil.
- [ ] Supabase service-role key yalnız migration ortamında okunuyor.
- [ ] Key command argument veya process listesinde görünmüyor.
- [ ] Export log'u hassas kolon değerlerini göstermiyor.
- [ ] Çıktı dizini restrictive izinlerle oluşturuluyor.
- [ ] Export yarıda kalırsa incomplete manifest ile açıkça işaretleniyor.
- [ ] Export tekrar çalıştırıldığında önceki çıktıyı sessizce ezmiyor.
- [ ] Source schema/app version manifestte.

### 12.2 Tablo export'u

- [ ] Auth user ID/email/role mapping export edildi; password/session export edilmiyor.
- [ ] Profiles export edildi.
- [ ] Clients export edildi.
- [ ] Client activities export edildi.
- [ ] Projects export edildi.
- [ ] Planning sections export edildi.
- [ ] Tasks export edildi.
- [ ] Calendar events export edildi.
- [ ] Finance transactions export edildi.
- [ ] Proposals export edildi.
- [ ] Contracts export edildi.
- [ ] Invoices export edildi.
- [ ] Subscriptions export edildi.
- [ ] Journals export edildi.
- [ ] Daily logs export edildi.
- [ ] Project revisions export edildi.
- [ ] Chat sessions/messages export edildi.
- [ ] App settings export edildi ve API key loglanmadı.
- [ ] Document embeddings ayrı arşiv olarak export edildi.
- [ ] Her tablo satır sayısı manifestte.
- [ ] Pagination export sırasında kayıt atlamıyor/çoğaltmıyor.

### 12.3 Storage export'u

- [ ] Avatar object listesi export edildi.
- [ ] Project asset object listesi export edildi.
- [ ] Her object size ve checksum kaydedildi.
- [ ] Eksik/erişilemeyen object warning olarak manifestte.
- [ ] Aynı storage key collision raporlandı.
- [ ] DB'de referanslı ama storage'da olmayan path raporlandı.
- [ ] Storage'da olup DB'de referanssız object raporlandı.

### 12.4 Import dönüşümleri

- [ ] UUID'ler korunuyor.
- [ ] `user_id -> owner_id` mapping deterministic.
- [ ] Freelancer auth hesabı bootstrap/reset planına göre oluşturuluyor.
- [ ] Client auth bağlantıları davet bekleyen durumda işaretleniyor.
- [ ] PostgreSQL timestamp'leri UTC epoch'a doğru dönüşüyor.
- [ ] Date alanları gün kayması olmadan dönüşüyor.
- [ ] Numeric para değerleri decimal string üzerinden minor unit'e dönüşüyor.
- [ ] Array ve JSON alanları schema doğrulamasından geçiyor.
- [ ] `completed -> done` legacy status dönüşümü raporlu.
- [ ] Unknown status/category değerleri sessizce default olmuyor.
- [ ] Planning `category/sort_order` mapping doğru.
- [ ] Journal ve daily log birleşimi kayıpsız.
- [ ] App settings API key yeni key ile şifreleniyor.
- [ ] Embeddings operasyonel DB'ye yazılmıyor.
- [ ] Storage dosyaları yeni key yapısına taşınıyor.
- [ ] File metadata checksum/size ile oluşturuluyor.

### 12.5 Import idempotency ve failure

- [ ] Import batch ID/manifest hash ile takip ediliyor.
- [ ] Aynı export ikinci kez çalıştırılırsa duplicate üretmiyor veya açıkça reddediyor.
- [ ] Tablo import transaction sınırları belgeli.
- [ ] Yarım import sonrası temiz retry prosedürü var.
- [ ] Fatal dönüşüm hatası sessizce skip edilmiyor.
- [ ] Warning ve error ayrımı manifest/report içinde.
- [ ] Disk kapasitesi import öncesi kontrol ediliyor.
- [ ] Import target'ta mevcut production veri varsa koruma/onay var.

### 12.6 Otomatik doğrulama

- [ ] Her tablo source/export/import row count eşleşiyor.
- [ ] FK integrity check temiz.
- [ ] Orphan client/project/task/finance sayısı sıfır.
- [ ] User bazında gelir toplamı eşleşiyor.
- [ ] User bazında gider toplamı eşleşiyor.
- [ ] Currency bazında toplamlar eşleşiyor.
- [ ] Project status dağılımı eşleşiyor.
- [ ] Task status dağılımı dönüşüm raporuyla eşleşiyor.
- [ ] Revision status/kota verisi eşleşiyor.
- [ ] Journal source kayıtlarının her biri target ID/mapping'e sahip.
- [ ] File count/size/checksum eşleşiyor.
- [ ] Duplicate email/invoice/daily checkin raporu temiz veya çözümü onaylı.
- [ ] `PRAGMA foreign_key_check` temiz.
- [ ] `PRAGMA integrity_check` sonucu `ok`.

### 12.7 Manuel örnekleme

- [ ] En az 5 client alan bazında source-target karşılaştırıldı.
- [ ] En az 5 project ve plan section karşılaştırıldı.
- [ ] En az 10 task ve status/due date karşılaştırıldı.
- [ ] En az 10 finance kaydı ve formatlanmış tutar karşılaştırıldı.
- [ ] En az 5 invoice/proposal/contract/subscription karşılaştırıldı.
- [ ] En az 5 journal/daily log karşılaştırıldı.
- [ ] En az 5 chat session/message geçmişi karşılaştırıldı.
- [ ] En az 5 avatar/project image görüntülenip checksum doğrulandı.
- [ ] Bir client portal ilişkisi davet sonrası manuel test edildi.

### 12.8 Prova

- [ ] Prova 1 anonimleştirilmiş production snapshot ile tamamlandı.
- [ ] Prova 1 toplam süre kaydedildi.
- [ ] Prova 1 disk kullanım tepe değeri kaydedildi.
- [ ] Prova 1 tüm warning/error çözüldü veya onaylandı.
- [ ] Prova 2 temiz volume üzerinde aynı snapshot ile tamamlandı.
- [ ] Prova 2 row count/checksum sonucu Prova 1 ile aynı.
- [ ] Prova 2 sonrası full E2E smoke geçti.
- [ ] Prova 2 sonrası backup/restore geçti.
- [ ] Tahmini final downtime kabul edilen pencereye sığıyor.

### 12.9 Parola/davet iletişimi

- [ ] Freelancer yeni parola/bootstrap yöntemi hazır.
- [ ] Bootstrap token tek kullanımlık ve süreli.
- [ ] Client portal kullanıcı listesi çıkarıldı.
- [ ] Re-invite link üretim akışı hazır.
- [ ] Kullanıcıya iletilecek metin hazır.
- [ ] Ham token toplu log/export dosyasına yazılmıyor.
- [ ] SMTP yok senaryosunda güvenli manuel paylaşım yöntemi yazılı.

### 12.10 Cutover ve rollback runbook'u

- [ ] Maintenance başlangıç/bitiş iletişimi hazır.
- [ ] Eski app read-only/maintenance yöntemi testli.
- [ ] Final export komutu ve sorumlusu belirli.
- [ ] Import komutu ve sorumlusu belirli.
- [ ] Otomatik doğrulama komutu belirli.
- [ ] Freelancer smoke test listesi hazır.
- [ ] DNS/reverse proxy değişim adımı yazılı.
- [ ] Health/log gözlem adımı yazılı.
- [ ] Rollback karar eşiği ve karar sahibi belirli.
- [ ] Eski sistemi tekrar açma adımı testli.
- [ ] Yeni sistemde oluşan yazıları uzlaştırma yöntemi yazılı.
- [ ] Eski Supabase'i silmeme süresi belirli.

### 12.11 Faz 9 çıkış kapısı

- [ ] İki deterministik prova tamamlandı.
- [ ] Row count, finance ve checksum kontrolleri temiz.
- [ ] Password/session/re-invite planı onaylandı.
- [ ] Cutover süresi ve disk ihtiyacı onaylandı.
- [ ] Rollback runbook'u tabletop tatbikatından geçti.
- [ ] Unresolved migration error yok.
- [ ] Final export/import araç sürümleri tag'lendi.

## 13. Faz 10 - One-click deploy, operasyon, temizlik ve release

### 13.1 Final dependency temizliği

- [ ] `@supabase/ssr` package.json/lockfile'dan kaldırıldı.
- [ ] `@supabase/supabase-js` runtime package.json/lockfile'dan kaldırıldı.
- [ ] `poyraz-ui` kaldırıldı.
- [ ] Dexie paketleri kaldırıldı.
- [ ] PWA paketi ilk release kararına göre kaldırıldı.
- [ ] `shadcn` gereksiz runtime dependency kaldırıldı.
- [ ] Duplicate Radix/Base UI paketleri tek yaklaşıma indirildi.
- [ ] `@iconify/react` kullanımı yoksa kaldırıldı.
- [ ] `uuid` kullanımı yoksa kaldırıldı.
- [ ] `framer-motion` ölçülmüş kullanım yoksa kaldırıldı.
- [ ] `npm ls` invalid/extraneous dependency göstermiyor.
- [ ] Lockfile temiz install ile yeniden doğrulandı.

### 13.2 Kod referansı temizliği

- [ ] `rg '@supabase|lib/supabase'` runtime kodda sonuç vermiyor.
- [ ] `rg 'poyraz-ui|--poyraz-'` runtime kod/CSS'te sonuç vermiyor.
- [ ] `rg 'NEXT_PUBLIC_SUPABASE|SUPABASE_SERVICE_ROLE'` aktif config/dokümanda sonuç vermiyor.
- [ ] Browser DB client bulunmuyor.
- [ ] Service-role kavramı runtime'da bulunmuyor.
- [ ] Eski RPC isimleri runtime'da bulunmuyor.
- [ ] Eski Storage bucket çağrıları runtime'da bulunmuyor.
- [ ] `lib/db.ts` Dexie prototipi kaldırıldı.
- [ ] Kullanılmayan Supabase auth helper/middleware/proxy kodu kaldırıldı.
- [ ] Legacy status/type/order field kullanımları tarandı.

### 13.3 Supabase tarihsel dosyaları

- [ ] `supabase/` klasörünün arşivleme veya silme kararı kaydedildi.
- [ ] Tarihsel SQL runtime build context dışında.
- [ ] Migration export aracı production image dışında.
- [ ] Eski docs/database içeriği “legacy Supabase” olarak açık etiketli veya arşivli.
- [ ] Kullanıcı yanlışlıkla eski Supabase setup'ını çalıştırmaya yönlendirilmiyor.

### 13.4 Final Docker/Compose

- [ ] Image version/commit OCI label içeriyor.
- [ ] Multi-arch gereksinimi belirlendi; desteklenen mimariler yazılı.
- [ ] AMD64 image smoke geçti.
- [ ] ARM64 destekleniyorsa native SQLite smoke geçti.
- [ ] Container non-root.
- [ ] Read-only root filesystem uygulanabiliyorsa testli; write yalnız data/tmp.
- [ ] Persistent volume `/app/data` açık.
- [ ] Healthcheck readiness endpoint'i kullanıyor.
- [ ] Stop grace period yeterli.
- [ ] Replica=1 uyarısı belirgin.
- [ ] Rolling update yerine uygun recreate stratejisi belgeli.
- [ ] Image clean install/build ile üretiliyor.
- [ ] Final image içinde source secret veya `.env` yok.
- [ ] Image vulnerability scan bloklayıcı kritik bulgu göstermiyor.

### 13.5 Coolify doğrulaması

- [ ] Git/Docker image kaynağıyla yeni app oluşturuldu.
- [ ] Persistent volume doğru path'e bağlandı.
- [ ] Required env secret'lar eklendi.
- [ ] Domain ve TLS çalışıyor.
- [ ] Health check healthy.
- [ ] İlk setup tamamlandı.
- [ ] Restart sonrası veri korundu.
- [ ] Upgrade sonrası migration ve veri koruma geçti.
- [ ] Backup schedule çalıştı.
- [ ] Restore tatbikatı ayrı test app'inde geçti.
- [ ] Replica ayarının 1 olduğu doğrulandı.

### 13.6 Dokploy doğrulaması

- [ ] Git/Docker image kaynağıyla yeni app oluşturuldu.
- [ ] Persistent volume doğru path'e bağlandı.
- [ ] Required env secret'lar eklendi.
- [ ] Domain ve TLS çalışıyor.
- [ ] Health check healthy.
- [ ] İlk setup tamamlandı.
- [ ] Restart sonrası veri korundu.
- [ ] Upgrade sonrası migration ve veri koruma geçti.
- [ ] Backup schedule çalıştı.
- [ ] Restore tatbikatı ayrı test app'inde geçti.
- [ ] Replica ayarının 1 olduğu doğrulandı.

### 13.7 Operasyon dokümanları

- [ ] README yeni mimariyi doğru anlatıyor.
- [ ] `.env.example` yalnız yeni değişkenleri içeriyor.
- [ ] Local development adımları temiz makinede test edildi.
- [ ] Docker quick start adımları temiz makinede test edildi.
- [ ] Coolify dokümanı ekran/alan adlarıyla güncel.
- [ ] Dokploy dokümanı ekran/alan adlarıyla güncel.
- [ ] Upgrade dokümanı migration ve pre-backup adımlarını içeriyor.
- [ ] Backup dokümanı schedule/retention/dış kopyayı içeriyor.
- [ ] Restore dokümanı offline/maintenance ve doğrulamayı içeriyor.
- [ ] Troubleshooting `SQLITE_BUSY`, permission, disk full ve migration hatalarını içeriyor.
- [ ] Security dokümanı secret, reverse proxy, rate limit ve volume iznini içeriyor.
- [ ] Single-instance ve NFS kullanmama uyarıları belirgin.

### 13.8 Full regression matrisi

- [ ] Fresh setup.
- [ ] Login/logout.
- [ ] Password change/session revoke.
- [ ] Client CRUD/pipeline/activity.
- [ ] Project CRUD/status/progress/planning.
- [ ] Task CRUD/list/kanban/auto progress.
- [ ] Calendar CRUD/date navigation.
- [ ] Finance CRUD/filter/aggregate.
- [ ] Proposal/contract/invoice/subscription CRUD/status.
- [ ] Journal CRUD/daily checkin.
- [ ] Dashboard/analytics date ranges.
- [ ] Avatar/project file upload/replace/delete.
- [ ] Portal invite/setup/login.
- [ ] Portal project/public task/planning.
- [ ] Portal revision/quota.
- [ ] Portal disable/session revoke.
- [ ] Chat session/message streaming.
- [ ] AI disabled mode.
- [ ] AI provider failure/timeout.
- [ ] Mobile core flows.
- [ ] Keyboard-only core flows.

### 13.9 Final teknik kapı

- [ ] `npm ci` temiz ortamda geçti.
- [ ] `npm run lint` geçti.
- [ ] `npm run typecheck` geçti.
- [ ] `npm run test` geçti.
- [ ] `npm run test:integration` geçti.
- [ ] `npm run test:e2e` geçti.
- [ ] `npm run db:check` geçti.
- [ ] `npm run build` geçti.
- [ ] `npm run smoke:docker` geçti.
- [ ] Fresh DB migration geçti.
- [ ] Previous release DB upgrade geçti.
- [ ] Backup/restore geçti.
- [ ] Dependency audit incelendi.
- [ ] Container/image scan incelendi.
- [ ] Performance budget raporu onaylandı.
- [ ] Accessibility bloklayıcı bulgu yok.

### 13.10 Cutover günü

- [ ] Cutover başlamadan sorumlular ve iletişim kanalı hazır.
- [ ] Eski production sağlıklı ve son backup mevcut.
- [ ] Bakım modu açıldı.
- [ ] Eski sistemde yeni yazma olmadığı doğrulandı.
- [ ] Final Supabase export tamamlandı.
- [ ] Export manifest/checksum doğrulandı.
- [ ] Yeni target volume boş/uygun olduğu doğrulandı.
- [ ] Final import tamamlandı.
- [ ] Import doğrulama raporu temiz.
- [ ] Freelancer hesabı bootstrap/reset tamamlandı.
- [ ] İç smoke: dashboard, client, project, task, finance geçti.
- [ ] İç smoke: storage geçti.
- [ ] İç smoke: portal invite/login/revision geçti.
- [ ] Readiness healthy.
- [ ] Error loglarında kritik hata yok.
- [ ] DNS/reverse proxy yeni app'e geçirildi.
- [ ] Dış domain/TLS/login testi geçti.
- [ ] Kullanıcı bakım modu kaldırıldı.
- [ ] Cutover bitiş zamanı kaydedildi.
- [ ] Eski Supabase read-only ve erişilebilir bırakıldı.

### 13.11 İlk 24 saat gözlem

- [ ] İlk 15 dakika health ve error log izlendi.
- [ ] İlk 1 saat login/session hataları incelendi.
- [ ] İlk 1 saat SQLite busy/lock hataları incelendi.
- [ ] Disk kullanım artışı incelendi.
- [ ] Upload/download hataları incelendi.
- [ ] AI provider hataları core app'ten ayrışıyor.
- [ ] Backup schedule ilk çalışmasını tamamladı.
- [ ] Kullanıcı bildirimi/geri bildirim kanalı izlendi.
- [ ] Rollback eşiği aşılmadı veya karar kaydedildi.
- [ ] 24 saat sonunda durum raporu yazıldı.

### 13.12 İlk 7 gün ve kapanış

- [ ] Günlük backup'lar başarıyla çalıştı.
- [ ] En az bir backup ayrı test ortamına restore edildi.
- [ ] Disk kapasite trendi incelendi.
- [ ] Slow query raporu incelendi.
- [ ] Error rate ve auth failure trendi incelendi.
- [ ] Portal davet/reset problemleri çözüldü.
- [ ] Kritik kullanıcı UX geri bildirimleri triage edildi.
- [ ] Eski sistem saklama süresinin bitiş tarihi tekrar doğrulandı.
- [ ] Release retrospective ve kalan backlog yazıldı.

### 13.13 Faz 10 ve proje kapanış kapısı

- [ ] Coolify temiz kurulum doğrulandı.
- [ ] Dokploy temiz kurulum doğrulandı.
- [ ] Runtime Supabase/Poyraz referansı sıfır.
- [ ] Full regression ve final teknik kapı temiz.
- [ ] Gerçek cutover tamamlandı.
- [ ] İlk 24 saat ve 7 gün gözlem kriterleri karşılandı.
- [ ] Backup/restore operasyonu gerçek release verisiyle doğrulandı.
- [ ] Dokümanlar release tag'iyle uyumlu.
- [ ] Açık bloklayıcı güvenlik/veri kaybı problemi yok.
- [ ] Proje Definition of Done ürün sahibi ve teknik sorumlu tarafından onaylandı.

## 14. Release sonrası periyodik operasyon checklist'i

Bu bölüm faz çalışması tamamlandıktan sonra aylık veya her release için kullanılmalıdır.

### Her release

- [ ] Release öncesi backup başarılı.
- [ ] Migration diff incelendi.
- [ ] Upgrade test fixture üzerinde geçti.
- [ ] Docker smoke geçti.
- [ ] Dependency ve image scan incelendi.
- [ ] Release sonrası readiness/log kontrol edildi.
- [ ] Rollback image/tag erişilebilir.

### Aylık

- [ ] Son backup'ların checksum'ları doğrulandı.
- [ ] Rastgele bir backup restore edildi.
- [ ] Disk kullanımı ve kalan kapasite incelendi.
- [ ] SQLite integrity check çalıştı.
- [ ] Orphan file dry-run çalıştı.
- [ ] Slow query ve `SQLITE_BUSY` kayıtları incelendi.
- [ ] Disabled/expired session ve invitation temizliği çalıştı.
- [ ] Audit log retention çalıştı.
- [ ] Reverse proxy TLS ve security header'ları kontrol edildi.

### Altı aylık veya büyük sürüm öncesi

- [ ] Tam felaket kurtarma tatbikatı yapıldı.
- [ ] Yeni temiz sunucuda kurulum dokümanı test edildi.
- [ ] Secret rotation prosedürü test edildi.
- [ ] AI encryption key rotation prosedürü test edildi.
- [ ] Veri büyümesi SQLite sınırları açısından değerlendirildi.
- [ ] Tek instance modelinin hâlâ yeterli olduğu doğrulandı.
- [ ] PostgreSQL'e geçiş eşiği gerekip gerekmediği değerlendirildi.
