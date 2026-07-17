---
title: Neta Self-Hosted v3 Ana Dönüşüm Planı
description: Supabase çıkışı, SQLite tabanlı backend, Better Auth, Poyraz UI v3 ve instance özelleştirmesi için ana yol haritası.
status: active
current_phase: "10 — Kullanıcı yönlendirmeli sayfa tasarımları"
last_updated: 2026-07-17
---

# Neta Self-Hosted v3 Ana Dönüşüm Planı

## 1. Belgenin amacı

Bu belge Neta'nın mevcut Supabase tabanlı uygulamadan tamamen self-hosted, tek instance çalışabilen ve hafif bir mimariye taşınması için ana uygulama planıdır.

Plan üç ana hedefi birlikte ele alır:

1. Supabase Auth, Postgres, Storage ve RLS bağımlılıklarını tamamen kaldırmak.
2. Backend geçişi tamamlandıktan sonra UI katmanını yalnızca Poyraz UI v3 tabanlı olacak şekilde sayfa sayfa yenilemek.
3. Self-host eden kişinin Neta'yı logo, renk, tema ve temel marka bilgileriyle özelleştirebilmesini sağlamak.

Bu belge yalnızca teknik görev listesi değildir. Mimari kararları, faz bağımlılıklarını, kalite kapılarını, sayfa bazlı çalışma yöntemini, production cutover sürecini ve gelecekteki mobil istemciye hazırlık sınırlarını da tanımlar.

### 1.1. Uygulama önceliği

Faz 4 sonrasında çalışma sırası kesin olarak backend-first'tür:

1. Faz 5–7'de freelancer, portal, AI ve kapsam içindeki business backend'leri SQLite/service katmanına taşınır.
2. Faz 8'de import, Supabase runtime temizliği ve production hardening tamamlanır.
3. Faz 9'da mobil istemci için stabil API sınırı hazırlanır.
4. Görsel tasarım ve sayfa UX revizyonları en son Faz 10'da yapılır.

Faz 5–9 sırasında mevcut ekranlar yalnızca yeni backend'e bağlanacak kadar değiştirilir. Bilgi mimarisi, görsel dil, layout ve kapsamlı UX değişiklikleri Faz 10'a ertelenir. Faz 10'da kullanıcı her sayfa için tasarım yönünü adım adım tarif eder ve açık kabul vermeden sonraki sayfaya geçilmez.

## 2. Ürün hedefi

Neta; freelancer'ın müşterilerini, projelerini, görevlerini, takvimini, finansını, günlük kayıtlarını ve müşteri portalını tek bir self-hosted çalışma alanında yönetmesini sağlamalıdır.

İlk self-hosted sürümün ana özellikleri:

- Tek komut veya standart Docker akışıyla kurulabilmesi.
- Harici BaaS zorunluluğu olmaması.
- Uygulama verileri ve dosyalarının tek persistent volume altında tutulabilmesi.
- İlk freelancer/admin hesabının güvenli kurulum akışıyla oluşturulması.
- Müşterilerin davet edilerek kendi portal hesaplarını oluşturabilmesi.
- Tüm UI'ın Poyraz UI v3 tasarım sistemiyle tutarlı olması.
- Uygulama adı, logo ve renklerin kod değiştirmeden özelleştirilebilmesi.
- Gelecekte React Native istemcisinin bağlanabileceği stabil bir backend sınırı bulunması.

## 3. Kapsam dışı hedefler

İlk self-hosted sürümde aşağıdaki hedefler zorunlu değildir:

- Horizontal scaling veya aynı SQLite dosyasına yazan birden fazla uygulama instance'ı.
- Offline-first senkronizasyon.
- PWA cache ve background sync.
- Supabase ile production dual-write.
- Mobil uygulamanın kendisi.
- Mobil cihaz pairing/token akışının tamamı.
- Runtime pgvector veya harici vector database.
- Takım/organization modeli, aksi ayrıca kararlaştırılmadıkça.

## 4. Kilitlenen ürün kararları

Bu maddeler Faz 0 kapsamında ADR-0013–ADR-0017 ile kilitlenmiştir.

- [x] Bir Neta instance'ının tek freelancer/admin sahibi olacağı onaylandı.
- [x] Birden fazla freelancer veya ekip desteğinin ilk sürüm kapsamı dışında olduğu onaylandı.
- [x] Mevcut Supabase production verisinin korunacağı belirlendi.
- [x] Production veri miktarından bağımsız olarak tek seferlik import aracının zorunlu kapsam olduğu onaylandı.
- [x] Teklifler modülünün kaynak verisinin korunacağı, ancak UI/CRUD tamamlamasının release-blocker olmayacağı belirlendi.
- [x] Sözleşmeler modülünün kaynak verisinin korunacağı, ancak UI/CRUD tamamlamasının release-blocker olmayacağı belirlendi.
- [x] Faturalar modülünün kaynak verisinin korunacağı, ancak UI/CRUD tamamlamasının release-blocker olmayacağı belirlendi.
- [x] Abonelikler modülünün kaynak verisinin korunacağı, ancak UI/CRUD tamamlamasının release-blocker olmayacağı belirlendi.
- [x] Müşteri iletişiminin ilk sürümde proje görünürlüğü, public görevler ve revizyon talepleriyle sınırlı kalacağı belirlendi.
- [x] Poyraz UI kullanım modeli npm package olarak onaylandı.

Kilitlenen ilk sürüm kararı:

- Tek owner/admin ve birden fazla client hesabı.
- Poyraz UI v3 merkezi npm package kullanımı.
- Çekirdek modüller tamamlanana kadar teklifler, sözleşmeler, faturalar ve aboneliklerin ikinci öncelik olması.
- Müşteri portalında ilk aşamada proje görünürlüğü, public görevler ve güvenli revizyon akışı.

## 5. Hedef sistem mimarisi

```text
Next.js Web UI                         Gelecekte React Native
      |                                         |
      | Server Component / Server Action        | HTTPS / JSON
      v                                         v
                Next.js uygulama sınırı
                         |
             +-----------+-----------+
             |                       |
       Web adapter'ları         /api/v1 Route Handlers
             |                       |
             +-----------+-----------+
                         |
                  Service katmanı
                         |
             Authorization + Validation
                         |
              +----------+----------+
              |                     |
        Repository katmanı      File service
              |                     |
              v                     v
       SQLite + Drizzle       /app/data/uploads
```

### 5.1. Temel mimari kurallar

- Server Component'ler okuma işlemlerinde service/repository katmanını doğrudan kullanabilir.
- Server Action'lar mutation için aynı service katmanını kullanır.
- Route Handler'lar mobil ve harici istemciler için aynı service katmanına adapter olur.
- Web uygulaması kendi backend'ine gereksiz internal HTTP çağrısı yapmaz.
- İş kuralları Server Action veya Route Handler içine gömülmez.
- Browser tarafı veritabanı, auth secret, filesystem veya server-only modül import etmez.
- Repository fonksiyonları kullanıcı/actor bağlamı olmadan owner'a bağlı veri döndürmez.
- SQLite üzerinde RLS olmadığı için yetkilendirme her service/repository işleminde açıkça uygulanır.
- Tüm dış girdiler Zod veya eşdeğer merkezi schema ile doğrulanır.
- Yetkisiz kaynak erişiminde mümkün olduğunda kaynağın varlığı sızdırılmaz.

### 5.2. Önerilen sunucu klasör yapısı

```text
server/
  auth/
    auth.ts
    session.ts
    authorization.ts
    invitations.ts

  db/
    client.ts
    transaction.ts
    schema/
    migrations/

  repositories/
    clients.ts
    projects.ts
    tasks.ts
    calendar.ts
    finance.ts
    journal.ts
    portal.ts
    chat.ts
    settings.ts

  services/
    clients/
    projects/
    tasks/
    finance/
    portal/
    files/
    branding/
    analytics/

  api/
    schemas/
    responses.ts
    errors.ts

  files/
    paths.ts
    validation.ts
    authorization.ts
```

## 6. Veri modeli standartları

- ID'ler mevcut Supabase UUID değerlerini koruyabilmek için text/UUID uyumlu tutulur.
- Para alanları integer minor unit olarak saklanır.
- Para birimleri satır bazında ISO benzeri kodla tutulur.
- İş tarihleri `YYYY-MM-DD` formatında tutulabilir.
- Sistem timestamp'leri UTC standardında saklanır.
- Her owner'a bağlı tabloda açık bir `owner_user_id` ilişkisi bulunur.
- Client erişimi `clients.auth_user_id` veya eşdeğer ilişki üzerinden kurulur.
- Status alanları serbest metin yerine doğrulanmış enum/union sözleşmesine sahip olur.
- Dosya içeriği DB'de tutulmaz; DB yalnızca metadata ve relative path tutar.
- AI API key'leri browser'a veya `localStorage` alanına çıkarılmaz.
- AI API key'leri düz metin migration ile taşınmaz.

## 7. Hedef domain tabloları

### 7.1. Platform ve auth

- Better Auth `user`
- Better Auth `session`
- Better Auth `account`
- Better Auth `verification`
- `app_profiles`
- `app_setup_state`
- `auth_audit_events`
- `portal_invitations`
- `device_tokens` veya pairing tabloları, yalnızca mobil fazında

### 7.2. Instance ve kullanıcı ayarları

- `instance_settings`
- `instance_branding`
- `user_preferences`
- `user_ai_settings` veya server-side secret referansları

### 7.3. Çekirdek iş verileri

- `clients`
- `client_activities`
- `projects`
- `project_planning_sections`
- `tasks`
- `calendar_events`
- `finance_transactions`
- `journal_entries`
- `project_revisions`
- `files`
- `chat_sessions`
- `chat_messages`

### 7.4. Kapsama göre taşınacak iş modülleri

- `proposals`
- `contracts`
- `invoices`
- `subscriptions`

## 8. Better Auth ve kullanıcı akışları

### 8.1. İlk freelancer/admin kurulumu

- [x] Public registration ilk admin sonrasında kapanıyor.
- [x] Kurulum kilidi eşzamanlı isteklere karşı transaction ile korunuyor.
- [x] İlk kullanıcı `freelancer` rolüyle profile bağlanıyor.
- [x] Kurulum başarısızlığında stale lock onarılabiliyor.
- [x] Başarılı ve başarısız auth olayları audit tablosuna yazılıyor.
- [x] Production'da güçlü `BETTER_AUTH_SECRET` zorunlu.
- [x] Trusted origin ve secure cookie kontrolleri doğrulandı.

### 8.2. Müşteri davet akışı

Önerilen akış:

1. Freelancer bir müşteri kaydı oluşturur.
2. Freelancer “Portala davet et” aksiyonunu kullanır.
3. Sistem süreli ve tek kullanımlık bir token üretir.
4. Veritabanında token'ın yalnızca hash'i saklanır.
5. Müşteri davet bağlantısını açar ve kendi şifresini belirler.
6. Better Auth kullanıcısı ve `client` profili oluşturulur.
7. Kullanıcı ilgili müşteri kaydına transaction içinde bağlanır.
8. Davet `accepted` durumuna alınır.

Checklist:

- [x] Davet oluşturma yetkisi yalnızca freelancer/admin rolünde.
- [x] Davet token'ı kriptografik olarak güvenli.
- [x] Token düz metin olarak DB'de saklanmıyor.
- [x] Davetin son kullanma tarihi var.
- [x] Davet iptal edilebiliyor.
- [x] Aynı müşteri için aktif davet politikası tanımlandı.
- [x] Kabul işlemi transaction içinde.
- [x] Client profile ve client kimlik bağı atomik kuruluyor (`app_profiles.client_id` + `clients.auth_user_id`).
- [x] Kullanılmış veya süresi dolmuş token tekrar kullanılamıyor.
- [x] Client hesabı disable/revoke edilebiliyor.

## 9. Server-side authorization matrisi

Her resource için pozitif ve negatif test yazılmalıdır.

| Resource | Freelancer | Client | Zorunlu negatif test |
| --- | --- | --- | --- |
| Profiles | Kendi profili | Kendi profili | Başka profil reddedilir |
| Clients | Kendi müşterileri CRUD | Bağlı müşteri kaydını read | Başka müşteri reddedilir |
| Projects | Kendi projeleri CRUD | Bağlı projeleri read | Başka proje reddedilir |
| Tasks | Kendi görevleri CRUD | Bağlı projelerde public görevler | Private görev reddedilir |
| Planning sections | Kendi bölümleri CRUD | Bağlı proje bölümleri read | Başka proje reddedilir |
| Revisions | Kendi proje revizyonlarını yönetir | Kendi projesine talep ekler/read | Project-client uyuşmazlığı reddedilir |
| Calendar | Kendi etkinlikleri CRUD | Erişim yok | Client rolü reddedilir |
| Finance | Kendi kayıtları CRUD | Erişim yok | Client rolü reddedilir |
| Journal | Kendi kayıtları CRUD | Erişim yok | Client rolü reddedilir |
| Chat | Kendi session/message kayıtları | İlk sürümde erişim yok | Başka session reddedilir |
| Settings | Kendi tercihleri | Kendi tercihleri | Secret browser'a dönmez |
| Branding | Admin düzenler | Read-only marka çıktısı | Client mutation reddedilir |
| Files | İlişkili kaynağa göre | İlişkili portal kaynağına göre | Path traversal ve başka owner reddedilir |

## 10. Yerel dosya sistemi

Hedef klasör yapısı:

```text
/app/data/
  neta.db
  uploads/
    avatars/
    branding/
    project-assets/
  backups/
  tmp/
```

Dosya checklist'i:

- [x] Dosya metadata tablosu oluşturuldu.
- [x] Relative path dışında mutlak kullanıcı girdisi kullanılmıyor.
- [x] Path traversal koruması var.
- [x] Dosya boyutu limiti var.
- [x] MIME allowlist var.
- [x] Gerekli türlerde magic-byte doğrulaması var.
- [x] SVG kabul ediliyorsa sanitizasyon kararı uygulandı (ilk sürümde SVG reddediliyor).
- [x] Yetkili upload Route Handler yazıldı.
- [x] Yetkili download Route Handler yazıldı.
- [x] Public branding asset'leri ayrı ve kontrollü sunuluyor.
- [x] Project asset erişimi owner/project/client ilişkisiyle doğrulanıyor.
- [x] Dosya silme ve DB metadata işlemi tutarlı.
- [x] Backup içine upload klasörü dahil.

## 11. Instance özelleştirme ve tema

### 11.1. Instance markası

İlk sürümde desteklenmesi önerilen ayarlar:

- Uygulama adı
- Kısa uygulama adı
- Açık tema logosu
- Koyu tema logosu
- Uygulama ikonu/favicon
- Primary renk
- Accent renk
- Varsayılan color mode
- Radius yoğunluğu
- Freelancer veya şirket adı
- Destek e-postası
- Portal karşılama metni
- Portal footer metni

### 11.2. Kullanıcı tercihleri

- Light/dark/system görünüm
- Sidebar açık/kapalı durumu
- Dil
- Saat dilimi
- Varsayılan para birimi
- Tarih formatı

### 11.3. Önerilen branding sözleşmesi

```ts
type BrandingSettings = {
  applicationName: string;
  shortName: string;
  primaryColor: string;
  accentColor: string;
  lightLogoFileId: string | null;
  darkLogoFileId: string | null;
  iconFileId: string | null;
  defaultColorMode: "light" | "dark" | "system";
  radiusScale: "compact" | "default" | "soft";
};
```

Tema checklist'i:

- [x] Poyraz UI semantic tokenları kullanılıyor.
- [x] Marka ayarları root layout'ta server-side okunuyor.
- [x] İlk render sırasında tema/renk parlaması yok.
- [x] Primary ve accent renk girdileri doğrulanıyor.
- [x] Metin/zemin kontrastı kontrol ediliyor.
- [ ] Hard-coded brand renkleri feature sayfalarına dağılmıyor.
- [x] Açık ve koyu modda logo fallback'i var.
- [x] Logo kaldırma ve varsayılana dönme desteği var.
- [x] Branding ayarlarına yalnızca freelancer/admin yazabiliyor.
- [x] Client portal aynı instance markasını güvenli biçimde kullanıyor.

## 12. Poyraz UI v3 stratejisi

Referans doküman: `docs/poyraz-ui-ai-consumer-guide.md`

Referans paket: `poyraz-ui@3.0.2`

### 12.1. Yeni UI kararı

- Genel atom, molecule ve organism bileşenleri Poyraz UI v3'ten alınır.
- Neta'ya özgü domain bileşenleri Poyraz UI bileşenlerinden compose edilir.
- Aynı amaçla hem local primitive hem Poyraz UI componenti tutulmaz.
- Poyraz UI componenti varken custom Dialog, Select, Dropdown, Tabs, Sheet veya Sidebar yazılmaz.
- Tailwind utility classları layout ve domain düzeni için kullanılabilir.
- Gereksiz custom CSS ve hard-coded renk kullanılmaz.

### 12.2. Kurulum checklist'i

- [x] `poyraz-ui` v3'e yükseltildi.
- [x] `@import "poyraz-ui/preset.css";` global CSS'e eklendi.
- [x] Atom importları `poyraz-ui/atoms` üzerinden.
- [x] Molecule importları `poyraz-ui/molecules` üzerinden.
- [x] Organism importları `poyraz-ui/organisms` üzerinden.
- [x] Tema gerekiyorsa `poyraz-ui/themes` kullanımı değerlendirildi.
- [x] Package modeli ana kullanım biçimi olarak belirlendi.
- [x] Source registry yalnızca source ownership gereken istisnalar için kullanılacak.

### 12.3. Ortak UI standartları

- [x] Typography hiyerarşisi tanımlandı.
- [x] Page header standardı tanımlandı.
- [x] Primary ve secondary action standardı tanımlandı.
- [x] Form field ve validation standardı tanımlandı.
- [x] Status-to-Badge eşleme tablosu oluşturuldu.
- [x] Loading state standardı oluşturuldu.
- [x] Empty state standardı oluşturuldu.
- [x] Error state standardı oluşturuldu.
- [x] Permission/forbidden state standardı oluşturuldu.
- [x] Destructive confirmation standardı oluşturuldu.
- [x] Desktop Dialog/Sheet ve mobil Drawer kullanım kuralı belirlendi.
- [x] Toast ve inline feedback ayrımı belirlendi.
- [x] DataTable kullanım standardı belirlendi.
- [x] Dashboard KPI kart standardı belirlendi.

### 12.4. Erişilebilirlik kalite kapısı

- [ ] Icon-only butonlarda `aria-label` var.
- [ ] Icon-only aksiyonlarda gerektiğinde Tooltip var.
- [ ] Tüm form alanlarında görünür Label var.
- [ ] Placeholder, Label yerine kullanılmıyor.
- [ ] Dialog, Modal, Sheet ve Drawer içinde Title var.
- [ ] Form hataları yalnızca toast ile gösterilmiyor.
- [ ] Focus ring custom classlarla kaldırılmıyor.
- [ ] Keyboard navigation korunuyor.
- [ ] Disabled ve loading state'leri doğru prop üzerinden veriliyor.
- [ ] Light ve dark mod kontrastları kontrol edildi.
- [ ] Reduced-motion tercihleri göz önünde tutuldu.

## 13. Backend-first çalışma yöntemi

Faz 5–9 ile Faz 10 birbirinden ayrı teslimatlar olarak yürütülür. Backend'in taşınmış sayılması için ekranın yeniden tasarlanması gerekmez; ekranın yeni service/repository sözleşmesiyle güvenli ve Supabase'siz çalışması yeterlidir. Tasarımın tamamlanmış sayılması için ise backend sözleşmesinin önceden stabil olması ve kullanıcının sayfa bazlı kabul vermesi gerekir.

### 13.1. Backend geçiş süreci — Faz 5–9

Her modül için aşağıdaki sıra uygulanır:

1. Route, Server Component, Server Action, Route Handler ve client-side veri erişimi envanteri çıkarılır.
2. Supabase tablo, RPC, auth, storage ve realtime kullanımları listelenir.
3. Okuma, mutation, aggregate ve dosya veri sözleşmeleri netleştirilir.
4. Eksik repository ve service işlemleri tamamlanır.
5. Owner/client scope, role, ilişki ve invariant kontrolleri service katmanına yerleştirilir.
6. Server Component ve Server Action'lar yeni service katmanına bağlanır.
7. Gerekli Route Handler'lar aynı service katmanını kullanır; browser'a DB veya secret çıkarılmaz.
8. Eski Supabase çağrıları ve yalnızca o çağrılara ait adapter kodu kaldırılır.
9. Pozitif, validation ve negatif authorization testleri çalıştırılır.
10. Mevcut ekran, kapsamlı görsel revizyon yapılmadan yeni backend ile smoke test edilir.

Backend kabul checklist'i:

- [ ] Modülün aktif route ve veri erişim envanteri çıkarıldı.
- [ ] Supabase bağımlılıkları listelendi.
- [ ] Okuma sözleşmeleri service/repository katmanında.
- [ ] Mutation sözleşmeleri service/repository katmanında.
- [ ] Aggregate sorgular gerekiyorsa server-side tamamlandı.
- [ ] Owner/role/client scope kontrolleri tamamlandı.
- [ ] Input validation tamamlandı.
- [ ] İlişkisel invariant'lar transaction içinde korunuyor.
- [ ] Server Component ve Server Action geçişi tamamlandı.
- [ ] İlgili Route Handler geçişi tamamlandı.
- [ ] Modülün runtime Supabase importu kalmadı.
- [ ] Cross-owner/cross-client negatif testleri geçti.
- [ ] Mevcut UI ile temel kullanıcı akışı smoke test edildi.
- [ ] Typecheck ve production build geçti.

### 13.2. Tasarım süreci — yalnızca Faz 10

Backend geçişinde tasarım kararı alınmaz. Faz 10'da her sayfa için şu süreç ayrı ayrı uygulanır:

1. Kullanıcı sayfanın amacını, görmek istediği bilgi hiyerarşisini ve UX yönünü tarif eder.
2. Birincil ve ikincil kullanıcı aksiyonları birlikte netleştirilir.
3. Gerekirse wireframe/bileşim önerisi hazırlanır ve kullanıcı onayı alınır.
4. Sayfa Poyraz UI v3 bileşenleriyle yeniden tasarlanır.
5. Loading, empty, error ve permission state'leri tasarımla birlikte tamamlanır.
6. Mobil, tablet, desktop, keyboard, light ve dark davranışları doğrulanır.
7. Kullanıcı sayfayı kabul ettikten sonra sıradaki sayfaya geçilir.

Tasarım kabul checklist'i Faz 10 altında tutulur; backend checklist'i ile birleştirilmez.

## 14. Backend taşıma sırası

Faz 5'in başlangıç noktası freelancer runtime'ındaki Supabase erişimleridir. Öncelik, bir modülün yeni SQLite/service katmanında uçtan uca çalışmasıdır.

### 14.1. Freelancer temel backend akışları

- [x] Setup/login sonrası profil ve session adapter'ları gözden geçirildi.
- [x] Hesap, profil ve şifre mutation'ları local backend'e bağlandı.
- [x] Instance ve branding ayarları local service'e bağlandı.
- [x] Freelancer layout/navigation için gereken server verisi Supabase'siz sağlanıyor.

### 14.2. Müşteri backend'i

- [x] Müşteri liste/detay sorguları taşındı.
- [x] Müşteri create/update/status mutation'ları taşındı.
- [x] CRM pipeline status işlemleri taşındı.
- [x] Müşteri aktivite ve ilişkili özet sorguları taşındı.
- [x] Portal davet yönetimi local client kayıtlarıyla bağlandı.

### 14.3. Proje ve görev backend'i

- [x] Proje liste/detay sorguları taşındı.
- [x] Proje create/update/status/progress mutation'ları taşındı.
- [x] Planning section ve design-system içerik işlemleri taşındı.
- [x] Proje dosyaları local file service'e bağlandı.
- [x] Proje ve genel görev CRUD/status/kanban işlemleri taşındı.
- [x] Kanban, filtre ve arama veri akışları taşındı.
- [x] Proje finans özeti ve revizyon yönetimi taşındı.

### 14.4. Operasyon backend'i

- [x] Takvim ve etkinlik işlemleri taşındı.
- [x] Finans liste, create/update/delete ve özet işlemleri taşındı.
- [x] Günlük liste ve mutation işlemleri taşındı.

### 14.5. Dashboard ve analytics backend'i

- [x] Dashboard aggregate sorguları repository/service katmanına taşındı.
- [x] Tarih aralığı ve filtre sözleşmeleri server-side doğrulanıyor.
- [x] Analytics sorguları SQLite üzerinde tamamlandı.
- [x] Grafik verisi browser-side Supabase sorgusu gerektirmiyor.

### 14.6. Portal, AI ve business devam sırası

- [x] Portal backend'i Faz 6 sözleşmesine göre tamamlandı.
- [x] AI/chat ve business backend'i Faz 7 sözleşmesine göre tamamlandı.
- [x] Import ve runtime Supabase temizliği Faz 8'de tamamlandı.
- [x] Mobil API sınırı Faz 9'da tamamlandı.

## 15. Revizyon güvenliği ve kota işlemi

Revizyon oluşturma yalnızca UI kontrolüne dayanamaz.

Transaction içinde doğrulanacaklar:

- Actor `client` rolünde mi?
- Actor hangi client record'a bağlı?
- Project gerçekten bu client record'a mı bağlı?
- Proje revizyon kabul ediyor mu?
- Kalan revision quota yeterli mi?
- Açık revizyon politikası sağlanıyor mu?
- Insert ile quota güncellemesi aynı transaction içinde mi?

Checklist:

- [x] `project_id` ve `client_id` eşleşmesi server-side doğrulanıyor.
- [x] İstemciden gelen `clientId` güven kaynağı olarak kullanılmıyor.
- [x] Quota server-side kontrol ediliyor.
- [x] Quota atomik azaltılıyor veya tüketim kayıtlarından hesaplanıyor.
- [x] Başarısız insert quota tüketmiyor.
- [x] Cross-project revision negatif testi var.
- [x] Başka client adına revision oluşturma negatif testi var.
- [x] Kota aşımı negatif testi var.

## 16. API v1 ve mobil hazırlığı

Mobil uygulama ilk sürüm kapsamında değildir; ancak backend web'e özel bir çıkmaza sokulmamalıdır.

Önerilen başlangıç endpoint'leri:

```text
GET  /.well-known/neta
GET  /api/v1/meta
GET  /api/v1/health
GET  /api/v1/me
```

Gelecekte:

```text
POST /api/v1/pairing-codes
POST /api/v1/device-sessions/exchange
GET  /api/v1/device-sessions
DELETE /api/v1/device-sessions/:id
```

Mobil hazırlık checklist'i:

- [x] API response envelope standardı tanımlandı.
- [x] API hata kodları tanımlandı.
- [x] API sürümleme stratejisi tanımlandı.
- [x] Instance metadata sözleşmesi tanımlandı.
- [x] Minimum desteklenen client sürümü alanı düşünüldü.
- [x] Capability listesi sözleşmesi düşünüldü.
- [x] Service katmanı cookie/Next.js objelerine bağımlı değil.
- [x] Mobil pairing ilk release kapsamı dışında tutuldu.
- [x] Gelecekte HTTPS zorunluluğu belgelendi.

## 17. Supabase veri import ve cutover planı

### 17.1. Import aracı

- [x] Supabase tablolarının kaynak mapping'i güncellendi.
- [x] Export formatı tanımlandı.
- [x] Import dry-run modu var.
- [x] Kaynak ve hedef satır sayıları raporlanıyor.
- [x] Foreign key tutarsızlıkları raporlanıyor.
- [x] Bilinmeyen enum/status değerlerinde import fail ediyor.
- [x] `completed` görev status'ü `done` olarak normalize ediliyor.
- [x] Para değerleri minor unit'e güvenli dönüştürülüyor.
- [x] `journals` ve `daily_logs` merge kuralı uygulanıyor.
- [x] AI API key'leri taşınmıyor.
- [x] Auth password/session verileri taşınmıyor.
- [x] Client kullanıcıları yeniden davet ediliyor.
- [x] Storage dosyaları metadata ve checksum ile aktarılıyor.
- [x] Import tekrar çalıştırıldığında davranış tanımlı.

### 17.2. Production cutover

- [ ] Production backup alındı.
- [ ] Supabase uygulaması maintenance/read-only moda alındı.
- [ ] Son export alındı.
- [ ] Import dry-run başarılı.
- [ ] Final import başarılı.
- [ ] Satır sayısı doğrulandı.
- [ ] Dosya sayısı ve checksum doğrulandı.
- [ ] İlk admin Better Auth hesabı hazırlandı.
- [x] Client re-invite planı hazırlandı.
- [ ] Kritik kullanıcı akışları smoke test edildi.
- [ ] DNS/deploy geçişi yapıldı.
- [x] Rollback penceresi ve yöntemi belgelendi.
- [ ] Supabase hemen silinmedi; tanımlı süre read-only backup olarak tutuldu.

## 18. Dependency azaltma planı

### 18.1. Supabase çıkışı tamamlandığında kaldırılacaklar

- [x] `@supabase/ssr`
- [x] `@supabase/supabase-js`
- [x] `lib/supabase/*`
- [x] Legacy Supabase auth helper'ları
- [x] Supabase service-role client kullanımları
- [x] Runtime Supabase environment değişkenleri

### 18.2. Offline/PWA temizliği

- [x] `@ducanh2912/next-pwa`
- [x] `dexie`
- [x] `dexie-react-hooks`
- [x] Legacy `lib/db.ts`
- [x] Offline indicator, kapsam dışıysa
- [x] Service worker çıktıları
- [x] PWA manifest kararı güncellendi

### 18.3. Poyraz UI v3 sonrası değerlendirilecekler

- [x] `@base-ui/react`
- [x] Doğrudan `@radix-ui/*` bağımlılıkları
- [x] `radix-ui`
- [x] `shadcn`
- [x] Kullanılmayan local UI primitive'leri
- [x] `framer-motion` değerlendirildi; auth shell'deki reduced-motion uyumlu aktif kullanım nedeniyle korundu.
- [x] `next-themes`, tema başka şekilde çözüldüyse
- [x] Kullanılmayan icon/form/theme yardımcıları

### 18.4. İşlevsel gerekçeyle korunabilecekler

- Next.js ve React
- Poyraz UI v3
- Better Auth
- `better-sqlite3`
- Drizzle ORM
- Zod
- `date-fns`
- Grafikler için Recharts
- Gerçekten kullanılan AI provider paketleri

Dependency kalite kapısı:

- [x] Her production dependency için aktif import veya açık gerekçe var.
- [x] Aynı işi yapan iki UI primitive sistemi yok.
- [x] Aynı işi yapan iki auth sistemi yok.
- [x] Aynı işi yapan iki runtime database sistemi yok.
- [x] Browser database bağımlılığı yok.
- [x] Build çıktısında Supabase referansı yok.
- [x] Build çıktısında Poyraz UI v2 referansı yok.

## 19. Test stratejisi

Mümkün olduğunda küçük ve doğrudan test araçları tercih edilir; test altyapısı production dependency sayısını artırmamalıdır.

### 19.1. Zorunlu test alanları

- [x] Migration smoke testi
- [x] SQLite pragma ve readiness testi
- [x] İlk admin setup testi
- [x] Concurrent setup lock testi
- [x] Login/logout testi
- [x] Client invitation testi
- [x] Expired/revoked invitation negatif testi
- [ ] Her repository için cross-owner negatif test
- [x] Client private task erişim negatif testi
- [x] Revision project-client eşleşme negatif testi
- [x] Revision quota testi
- [x] File upload MIME/size testi
- [x] Path traversal negatif testi
- [x] Backup oluşturma testi
- [x] Restore ve checksum testi
- [x] Supabase import fixture testi
- [x] API response/error contract testi
- [x] Kritik sayfalar için SSR smoke testi

### 19.2. Her faz sonunda çalıştırılacak kalite kapıları

- [x] Typecheck başarılı.
- [ ] Lint başarılı.
- [x] Production build başarılı.
- [x] İlgili smoke testler başarılı.
- [x] Database migration temiz DB üzerinde başarılı.
- [x] Mevcut DB üzerinde migration başarılı.
- [x] `git diff --check` başarılı.
- [x] Yeni secret veya kişisel veri repoya eklenmedi.

## 20. Docker, backup ve operasyon

- [x] Docker image standalone Next.js çıktısını kullanıyor.
- [x] Uygulama non-root kullanıcıyla çalışıyor.
- [x] `/app/data` persistent volume olarak bağlı.
- [x] Startup migration deterministic.
- [x] Migration hatasında uygulama başlamıyor.
- [x] `BETTER_AUTH_SECRET` production'da zorunlu.
- [x] Compose örneği gerekli tüm env alanlarını açıklıyor.
- [x] Readiness endpoint DB ve migration durumunu kontrol ediyor.
- [x] Liveness endpoint filesystem/DB bağımlılığı olmadan cevap veriyor.
- [x] Backup SQLite online backup API kullanıyor.
- [x] Backup upload klasörünü içeriyor.
- [x] Backup manifest dosya boyutu ve SHA-256 içeriyor.
- [x] Restore manifest checksum'larını doğruluyor.
- [x] Restore canlı DB üzerine kontrolsüz yazmıyor.
- [x] Backup retention politikası belgelendi.
- [x] Reverse proxy ve HTTPS kurulumu belgelendi.

## 21. Dokümantasyon planı

- [x] README yeni SQLite/Better Auth mimarisini anlatıyor.
- [x] Supabase'in artık runtime gereksinimi olmadığı açık.
- [x] Docker ile kurulum belgelendi.
- [x] Coolify/Dokploy kurulumu belgelendi.
- [x] Environment değişkenleri güncellendi.
- [x] İlk admin kurulumu belgelendi.
- [x] Client invitation akışı belgelendi.
- [x] Branding ayarları belgelendi.
- [x] Backup/restore belgelendi.
- [x] Upgrade/migration akışı belgelendi.
- [x] Mobil API sınırı belgelendi.
- [x] Eski ve çelişkili Supabase belgeleri archive veya kaldırıldı.
- [x] ADR-0006 Poyraz UI v3 kararıyla güncellendi.
- [x] ADR-0007 ile PWA runtime durumu uyumlu hale getirildi.

## 22. Uygulama fazları

### Faz 0 — Karar ve baseline

Amaç: Kapsamı kilitlemek ve dönüşüm sırasında korunacak davranışları tanımlamak.

- [x] Bölüm 4'teki ürün kararları cevaplandı.
- [x] Aktif route ve özellik envanteri güncellendi.
- [ ] Supabase tablo ve storage veri sayıları çıkarıldı.
- [x] Kritik kullanıcı akışları baseline olarak kaydedildi.
- [x] Hedef schema mapping'i onaylandı.
- [x] Yeni ADR seti güncellendi.
- [x] Bu planın status alanı `active` yapıldı.

Faz 0 ilerleme notu:

- Repo/schema/fixture envanteri tamamlandı.
- Production Supabase read-only erişimi veya export snapshot'ı workspace'te olmadığı için gerçek tablo satır sayıları, bucket dosya sayıları/boyutları ve orphan path raporu açık kaldı.
- Audit sorguları `phase-0-data-mapping.md` içinde hazırdır. Bu dış veri sağlanmadan ilgili checkbox işaretlenmeyecektir.

Çıkış kriteri: Veri kapsamı, ilk release modülleri ve tek/multi-owner kararı belirsiz değil.

### Faz 1 — Runtime ve auth temelini tamamlama

Amaç: Better Auth + SQLite çalışma zamanını production kullanıma hazır hale getirmek.

- [x] İlk admin setup akışı tamamlandı.
- [x] Session ve role guard'ları tamamlandı.
- [x] Client invitation akışı tamamlandı.
- [x] Auth audit kapsamı tamamlandı.
- [x] Docker env sözleşmesi düzeltildi.
- [x] Auth smoke ve negatif testleri geçti.

Faz 1 tamamlanma notu (2026-07-16):

- İlk owner yarışı, public registration kapanışı, doğrudan auth endpoint'i, login/logout ve stale setup onarımı doğrulandı.
- Davet üretme, önceki aktif daveti otomatik iptal etme, hash-only token saklama, kabul, tekrar kullanım, expiry, manuel revoke ve client disable/enable akışları tamamlandı.
- Davet kabulünde Better Auth `user`, credential `account`, `client` profile, `client_id` bağı ve davet durumu tek SQLite transaction'ında yazılıyor.
- Client rolünün davet üretmesi ve disabled client'ın doğrudan Better Auth endpoint'inden session oluşturması negatif testlerle reddedildi.
- `docker compose config` production secret/env sözleşmesiyle başarılıdır. Yerel Docker daemon çalışmadığı için container build/runtime smoke ayrıca doğrulanamamıştır; production Next.js standalone build başarıyla geçmiştir.
- Cookie politikası canonical URL'ye bağlıdır: HTTPS'te `Secure`, local HTTP Docker kurulumunda kontrollü istisna; localhost dışındaki production HTTP URL'leri reddedilir.

Çıkış kriteri: Freelancer ve davet edilmiş client Supabase Auth olmadan oturum açabiliyor.

### Faz 2 — Domain schema ve backend çekirdeği

Amaç: Tüm çekirdek iş verileri için Drizzle schema, migration, repository ve service katmanını kurmak.

- [x] Çekirdek tablolar oluşturuldu.
- [x] Repository katmanı oluşturuldu.
- [x] Service katmanı oluşturuldu.
- [x] Actor/authorization sözleşmesi standartlaştırıldı.
- [x] Validation ve error sözleşmesi standartlaştırıldı.
- [x] Negatif authorization testleri yazıldı.
- [x] Analytics aggregate sorgu yaklaşımı belirlendi.

Faz 2 tamamlanma notu (2026-07-16):

- 11 çekirdek domain tablosu ile kaynak verisi korunacak 4 business tablosu Drizzle schema ve migration'a eklendi; storage ve branding tabloları Faz 3 sınırında bırakıldı.
- Scope zorunlu repository katmanı ve Next.js/session bağımsız service katmanı; CRUD, ilişki tutarlılığı, otomatik proje ilerlemesi, portal görünürlüğü ve aggregate sorguları uygular.
- Davet hedefi yerel owner-scoped client kaydına bağlandı. Kabul transaction'ı `app_profiles.client_id` ve `clients.auth_user_id` kimlik bağlarını birlikte kurar; client session bu iki yönlü bağı doğrular.
- Revizyon isteği `BEGIN IMMEDIATE` transaction içinde actor-derived client, proje ilişkisi, aktif proje ve tüketim kayıtlarından kota kontrolüyle oluşturulur.
- `phase2:domain-smoke`; cross-owner, client owner-only erişimi, private task, başka client/proje, kota aşımı, ilişkisel owner ve SQLite constraint negatiflerini gerçek migration uygulanmış veritabanında doğrular.
- Tasarım ve doğrulama ayrıntıları `phase-2-domain-core.md` belgesinde kaydedildi.

Çıkış kriteri: Çekirdek domain işlemleri UI veya Supabase'e bağımlı olmadan test edilebiliyor.

### Faz 3 — Yerel storage ve branding temeli

Amaç: Supabase Storage yerine güvenli local filesystem ve instance özelleştirmesi sağlamak.

- [x] File metadata schema tamamlandı.
- [x] Upload/download servisleri tamamlandı.
- [x] Avatar desteği tamamlandı.
- [x] Branding asset desteği tamamlandı.
- [x] Project asset desteği tamamlandı.
- [x] Instance branding schema ve service tamamlandı.
- [x] Server-rendered token uygulaması tamamlandı.

Faz 3 tamamlanma notu (2026-07-16):

- `files` ve `instance_branding` tabloları; owner/resource/visibility constraint'leri ve SHA-256 metadata ile eklendi.
- Local file servisi 5 MiB limit, MIME allowlist, magic-byte kontrolü, SVG reddi, root-bound relative path, symlink koruması ve geri alınabilir upload/delete sırası uygular.
- Authenticated upload/download/delete, kontrollü public branding asset ve owner-only branding Route Handler'ları standart API envelope ile eklendi.
- Avatar subject, private/portal project asset ve referenced-only public branding authorization kuralları gerçek SQLite/filesystem ve Next.js HTTP smoke testleriyle doğrulandı.
- Instance adı, logo/icon, primary/accent, color mode ve radius; root layout metadata/CSS tokenları ile dinamik web manifest'e server-side uygulanıyor.
- Backup uploads ağacını kapsıyor; restore artık path, symlink, byte size, manifest completeness ve SHA-256 checksum doğrulaması yapıyor.
- Tasarım, güvenlik ve test ayrıntıları `phase-3-storage-branding.md` belgesinde kaydedildi.

Çıkış kriteri: Logo, avatar ve project asset için Supabase Storage gerekmiyor.

### Faz 4 — Poyraz UI v3 foundation

Amaç: Backend geçişi sırasında ikinci bir primitive sistemi oluşmasını engellemek ve en son yapılacak sayfa tasarımları için ortak UI temelini kurmak.

- [x] Poyraz UI v3 kuruldu.
- [x] Preset CSS eklendi.
- [x] Global shell Poyraz Sidebar organism ile kuruldu.
- [x] Typography standardı tamamlandı.
- [x] Form standardı tamamlandı.
- [x] Feedback state'leri tamamlandı.
- [x] Tema/branding token bridge tamamlandı.
- [x] Local primitive kaldırma politikası uygulandı.

Faz 4 tamamlanma notu (2026-07-16):

- `poyraz-ui@3.0.2`, preset CSS ve atoms/molecules/organisms subpath import sınırı pnpm/npm lockfile'larıyla birlikte kuruldu.
- Freelancer ve portal global shell'i Poyraz Sidebar organism'e; hesap menüsü DropdownMenu'ye, global toast katmanı Poyraz Toaster'a taşındı.
- Branding servisi primary, accent, focus ve radius değerlerini SSR sırasında doğrudan Poyraz semantic tokenlarına köprüler; system dark mode ilk paint öncesi uygulanır.
- Typography, page header, action, form, status badge, loading/empty/error/forbidden, destructive confirmation, overlay, DataTable ve KPI standartları kod bileşimleri ve Faz 4 belgesiyle tanımlandı.
- Duplicate local generic primitive'ler ve doğrudan UI dependency'leri kaldırıldı; yalnızca Neta'ya özgü pending/offline davranış bileşimleri Poyraz atomları üzerinde bırakıldı.
- `phase4:ui-boundary`, typecheck, hedefli ESLint, storage/branding smoke, auth/SSR branding smoke, production build ve `git diff --check` başarılıdır. Repo genel lint'i legacy Faz 5–7 borçları nedeniyle açık tutuldu.
- Uygulama ve doğrulama ayrıntıları `phase-4-poyraz-ui-foundation.md` belgesinde kaydedildi.

Çıkış kriteri: Yeni sayfalar ek bir primitive sistemi oluşturmadan geliştirilebiliyor.

### Faz 5 — Freelancer backend geçişi

Amaç: Freelancer tarafındaki tüm aktif veri okuma ve mutation akışlarını mevcut tasarımları mümkün olduğunca koruyarak Supabase'ten SQLite/repository/service katmanına taşımak.

- [x] Freelancer route ve Supabase erişim envanteri tamamlandı.
- [x] Profil, hesap ve instance ayarları backend geçişi tamamlandı.
- [x] Müşteri yönetimi backend geçişi tamamlandı.
- [x] Proje yönetimi backend geçişi tamamlandı.
- [x] Görev yönetimi backend geçişi tamamlandı.
- [x] Takvim backend geçişi tamamlandı.
- [x] Finans backend geçişi tamamlandı.
- [x] Günlük backend geçişi tamamlandı.
- [x] Dashboard aggregate sorguları taşındı.
- [x] Analytics sorguları taşındı.
- [x] İlgili Server Action ve Route Handler'lar service katmanına bağlandı.
- [x] Faz 5 kapsamındaki freelancer runtime'ında Supabase veri erişimi kalmadı.
- [x] Modül bazlı validation ve authorization testleri geçti.
- [x] Mevcut ekranlarla kritik freelancer akışları smoke test edildi.

Faz 5 kapsam notu:

- Sayfaların bilgi mimarisi, görsel dili ve kapsamlı UX'i bu fazda değiştirilmeyecek.
- Backend bağlantısı için zorunlu olmayan component/layout refactor'ları Faz 10'a bırakılacak.
- Mevcut UI yeni veri sözleşmesiyle çalışmayacak durumdaysa yalnızca minimum uyumluluk düzenlemesi yapılacak.

Faz 5 tamamlanma notu (2026-07-16):

- Profil, avatar ve şifre Better Auth/local file service'e; AI tercih kaydı encrypted SQLite ayar tablosuna taşındı. API key browser'a geri okunmuyor ve `localStorage` kullanılmıyor.
- Müşteri, CRM aktivitesi, proje, planning section, görev, takvim, finans ve günlük ekranları owner-scoped domain service adapter'larına bağlandı; mevcut görsel yapı korundu.
- Proje kapakları local file service'e, para alanları integer minor unit sözleşmesine taşındı.
- Dashboard ve analytics RPC'leri tarih aralığı doğrulanan SQLite aggregate sorgularıyla değiştirildi.
- `phase5:backend-boundary` 31 kapsam dosyasını tarar; `phase5:smoke` cross-owner/domain testleri ile 11 Better Auth korumalı SSR route'unu doğrular.
- Typecheck, hedefli ESLint, Faz 5 smoke, production build ve `git diff --check` başarılıdır. Repo genel lint'indeki legacy client-component borçları Faz 6–7/10 kapsamında açık kalır.
- Uygulama, kapsam, güvenlik ve test ayrıntıları `phase-5-freelancer-backend.md` belgesinde kaydedildi.

Çıkış kriteri: Freelancer runtime'ındaki çekirdek iş akışları Supabase sorgusu olmadan SQLite/service katmanında çalışıyor ve negatif authorization testleriyle korunuyor.

### Faz 6 — Müşteri portalı

Amaç: Mevcut portal görünümünü koruyarak Better Auth client hesabı ve server-side authorization ile portal backend'ini tamamlamak.

- [x] Portal davet kabulü tamamlandı.
- [x] Portal session/actor ve client scope entegrasyonu tamamlandı.
- [x] Portal proje ve görev sorguları local service'e taşındı.
- [x] Planning section görünürlük sorguları local service'e taşındı.
- [x] Revision akışı ve quota transaction'ı tamamlandı.
- [x] Portal authorization negatif testleri geçti.
- [x] Portal asset ve branding erişimi local backend ile doğrulandı.
- [x] Portal runtime'ında Supabase veri erişimi kalmadı.
- [x] Mevcut portal ekranlarıyla kritik akışlar smoke test edildi.

Faz 6 kapsam notu: Portal sayfalarının görsel tasarımı ve UX revizyonu Faz 10'da kullanıcı yönlendirmesiyle yapılır.

Faz 6 tamamlanma notu (2026-07-16):

- Portal layout ve beş aktif portal route'u Better Auth client session'dan actor üreten ortak adapter'a ve domain service katmanına taşındı.
- Client proje sorguları `client_id` yanında `clients.auth_user_id` bağını repository seviyesinde doğrular; spoofed actor ve foreign project erişimi engellenir.
- Portal yalnızca public görevleri, kendi planning section/revision kayıtlarını ve portal-visible dosyaları görür; private/foreign kaynaklar negatif testlerle korunur.
- Revision action'dan istemci kaynaklı `clientId` kaldırıldı. Kalan kota server-side hesaplanır; nihai aktif proje/kota kontrolü `BEGIN IMMEDIATE` transaction içinde yeniden yapılır.
- Portal branding local service'ten SSR edilir ve shell ilerlemesi client projelerinden hesaplanır.
- `phase6:portal-boundary`, domain/storage negatifleri, Better Auth client-cookie SSR smoke, typecheck, hedefli ESLint, production build ve `git diff --check` başarılıdır.
- Uygulama, authorization ve test ayrıntıları `phase-6-portal-backend.md` belgesinde kaydedildi.

Çıkış kriteri: Client yalnızca kendi verisini görüyor, güvenli revision talebi oluşturabiliyor ve portal runtime'ı Supabase sorgusu yapmıyor.

### Faz 7 — AI ve gelişmiş modüller

Amaç: AI/chat ve kapsamda kalan business modüllerini yeni backend'e taşımak.

- [x] Chat session/message verileri SQLite'a taşındı.
- [x] AI secrets browser'dan kaldırıldı.
- [x] Context builder service katmanına taşındı.
- [x] Finans analizi taşındı.
- [x] Proje risk analizi taşındı.
- [x] Kapsamdaki business modülleri tamamlandı.

Faz 7 tamamlanma notu (2026-07-17):

- Chat sayfasındaki browser Supabase auth/tablo çağrıları owner-scoped Server Action ve domain service sözleşmelerine taşındı. Chat route'u session sahipliğini doğrular, geçmişi istemciden değil SQLite'tan kurar ve başarılı user/assistant mesajlarını kalıcılaştırır.
- AI provider seçimi ve encrypted API key çözümü `server/ai/provider.ts` altında server-only merkezileştirildi. Browser request'inden key/provider override kaldırıldı; Ollama için key gerektirmeyen ve environment ile ayarlanabilen local endpoint desteği eklendi.
- Chat, finans ve proje risk context'leri owner-scoped domain service okumaları, kayıt/karakter sınırları ve currency-aware finans toplamlarıyla ortak context builder'a taşındı.
- Finans analizi ve proje risk route'ları Better Auth freelancer guard, merkezi validation, provider timeout ve secretsız `400/502/504` hata sözleşmesi kullanır.
- Teklif, sözleşme, fatura ve abonelik için owner-scoped list/get/create/update/delete servisleri tamamlandı. Aktif teklif, fatura ve abonelik sayfaları SQLite SSR okumalarına bağlandı; repo içinde aktif sözleşme sayfası bulunmadığı için yeni tasarım route'u eklenmedi.
- `phase7:backend-boundary`, temiz SQLite domain smoke ve gerçek Better Auth cookie'li SSR/API smoke başarılıdır. Ayrıntılar `phase-7-ai-business-backend.md` belgesindedir.

Çıkış kriteri: Runtime AI özelliklerinde Supabase bağımlılığı yok.

### Faz 8 — Import, temizlik ve release hardening

Amaç: Production geçişini güvenli hale getirmek ve legacy bağımlılıkları kaldırmak.

- [x] Supabase import aracı tamamlandı.
- [x] Import rehearsal tamamlandı.
- [x] Supabase runtime paketleri kaldırıldı.
- [x] PWA/Dexie legacy kodu kaldırıldı.
- [x] Kullanılmayan UI bağımlılıkları kaldırıldı.
- [x] Backup/restore doğrulandı.
- [x] Docker production smoke tamamlandı.
- [x] Dokümantasyon güncellendi.
- [x] Cutover ve rollback provası tamamlandı.

Faz 8 tamamlanma notu (2026-07-17):

- `neta-supabase-export` v1 offline bundle importer'ı; owner scope, enum, tarih, exact para/basis-point, foreign key, dosya path/magic-byte/size/SHA-256 kontrolleriyle tamamlandı. Dry-run ve `0600` rapor, boş hedef koruması, kontrollü `--allow-existing` upsert ve DB hatasında staged file rollback davranışı eklendi.
- Görev `completed -> done`, `journals + daily_logs` birleşimi, kanonik journal referansı, business kayıtları, user preference/AI provider ayarları ve storage URL yeniden yazımı fixture üzerinde doğrulandı. AI key, auth password/session, eski client auth bağı ve embeddings runtime'a taşınmıyor.
- Supabase SDK/helper/env; PWA wrapper, Dexie, offline indicator, legacy browser DB ve service-worker çıktıları kaldırıldı. Kullanılmayan DnD/resolver/UUID paketleri temizlendi; temiz Docker build'in doğruladığı `react-hook-form` ve `mermaid` Poyraz UI runtime peer'i olarak gerekçeli biçimde korundu.
- Backup'a versioned manifest, symlink reddi ve sayıya dayalı retention eklendi. Restore, manifest completeness/size/SHA-256 kontrolünden sonra DB ve upload ağacını staged atomik swap ile değiştirir ve hata halinde önceki hedefi geri alır.
- Pre-import backup, final import, idempotent tekrar ve ayrı data directory'ye rollback fixture provası geçti. Bu prova gerçek production maintenance/DNS cutover yerine geçmez; Bölüm 17.2'de dış sistem yetkisi isteyen maddeler açık bırakıldı.
- README ve Faz 8 runbook; SQLite/Better Auth mimarisi, env, ilk owner/client daveti, branding, Docker/Coolify/Dokploy, HTTPS, backup retention, import, upgrade, cutover ve rollback'i anlatır. Eski numaralı Supabase belgeleri ve PostgreSQL SQL kayıtları `legacy-v2-archive` sınırına alındı.
- Supabase env'leri unset durumda typecheck, production build, source/build artifact boundary, standalone liveness/readiness ve `/register` SSR başarılıdır. Temiz Docker `npm ci` + build, non-root user, startup migration, persistent volume readiness ve restart smoke geçti.
- Faz 2–7 boundary/smoke regresyonları ve Faz 8 hedefli ESLint başarılıdır. Repo genel ESLint'i Faz 10'da ele alınacak mevcut client-component borçlarında 14 hata/14 warning üretmeye devam ettiği için genel lint kalite kapısı işaretlenmedi.
- Production dependency audit'inde high/critical bulgu yoktur; npm altı moderate advisory raporlar. Bunlar Next'in bundled PostCSS'i ve development migration toolchain'inin eski esbuild loader'ı kaynaklıdır; npm'in önerdiği uyumsuz downgrade otomatik uygulanmadı.

Çıkış kriteri: Uygulama Supabase environment değişkenleri olmadan build ve runtime smoke testini geçiyor.

### Faz 9 — Mobil API hazırlığı

Amaç: React Native geliştirmesine başlamadan önce instance keşif ve stabil API sınırını tamamlamak.

- [x] `/api/v1` sözleşmesi yayınlandı.
- [x] `/.well-known/neta` sözleşmesi yayınlandı.
- [x] Instance metadata ve capability modeli tamamlandı.
- [x] Pairing güvenlik tasarımı ayrı ADR olarak yazıldı.
- [x] Device token lifecycle tasarlandı.

Faz 9 tamamlanma notu (2026-07-17):

- `/.well-known/neta`; protocol/discovery sürümü, kalıcı instance kimliği, application adı, mutlak API/meta/health URL'leri ve HTTPS politikasını public discovery belgesi olarak yayınlar.
- `/api/v1/meta`; server/API sürümü, instance/organization kimliği, absolute branding asset URL'leri, SemVer minimum mobil sürümü, platformlar, auth yöntemi, capability durumları ve navigasyon linklerini standart success envelope içinde döndürür.
- `/api/v1/health` SQLite/migration readiness'i v1 envelope ve `SERVICE_UNAVAILABLE` hata koduyla sunar. `/api/v1/me` yalnızca geçerli Better Auth session'ıyla güvenli user/role/client bağı ve session expiry döndürür; token/password/secret içermez.
- `instance_settings` ve migration `0007`; ilk discovery isteğinde concurrency-safe oluşturulan UUID'yi backup/restore ile korunacak kalıcı instance kimliği yapar. Domain veya marka adı kimlik olarak kullanılmaz.
- API major sürümü URL'de `/api/v1` olarak kilitlendi. Additive alan/capability değişiklikleri v1 içinde; alan silme, tip/anlam/auth kırılması yeni major içinde yapılacaktır. Tüm v1 yanıtları `X-Neta-API-Version: 1` taşır.
- `NETA_MINIMUM_MOBILE_VERSION` opsiyonel SemVer alt sınırı olarak eklendi. Bilinmeyen capability/alanları yok sayma ve `planned` capability'yi kullanmama kuralı belgelendi.
- Pairing runtime'a sahte/eksik endpoint olarak eklenmedi; `auth.device-pairing` capability'si `planned` durumundadır. Ayrı ADR-0018; tek kullanımlık challenge, rate limit, hash-only secret, opaque access/refresh token rotation, reuse detection, scope, revoke/expire/compromised lifecycle, secure storage ve restore sonrası token epoch invalidation gereksinimlerini kilitler.
- Mobil URL bağlantı algoritması; origin normalizasyonu, HTTPS, redirect/downgrade koruması, discovery/meta instance ID eşlemesi ve kimlik değişiminde credential'ı sessizce kullanmama kurallarıyla `phase-9-mobile-api.md` belgesinde yayınlandı.
- `phase9:api-boundary` pairing route'larının tasarım uygulanmadan açılmadığını ve API/service sınırını doğrular. `phase9:smoke`; eşzamanlı discovery, metadata, minimum sürüm, capabilities, health, anonymous/owner/client `/me`, disabled client reddi ve absolute branding URL akışlarını gerçek Next.js + Better Auth üzerinde doğrular.
- Typecheck, hedefli ESLint, migration drift kontrolü, production build, Faz 8 source/build artifact sınırı ve `git diff --check` başarılıdır.

Çıkış kriteri: Mobil istemci backend'in iç uygulama detaylarına bağımlı olmadan entegrasyona başlayabilir.

### Faz 10 — Kullanıcı yönlendirmeli sayfa tasarımları

Amaç: Backend, import/cleanup ve mobil API sınırı tamamlandıktan sonra bütün web arayüzünü kullanıcı yönlendirmesiyle sayfa sayfa Poyraz UI v3 üzerinde yeniden tasarlamak.

Başlangıç koşulları:

- [x] Faz 5 freelancer backend geçişi tamamlandı.
- [x] Faz 6 portal backend geçişi tamamlandı.
- [x] Faz 7 kapsamındaki runtime modülleri tamamlandı veya açıkça ertelendi.
- [x] Faz 8 Supabase runtime temizliği ve release hardening tamamlandı.
- [x] Faz 9 mobil API hazırlığı tamamlandı.
- [x] Tasarım sırasında kullanılacak backend veri sözleşmeleri stabil.

Sayfa grupları:

- [ ] Setup, login ve hesap kurtarma tasarımları tamamlandı.
- [ ] Global app shell, sidebar, mobil navigation ve hesap menüsü tasarımları tamamlandı.
- [ ] Profil, instance, branding ve ayarlar tasarımları tamamlandı.
- [ ] Müşteri listesi, pipeline, form ve detay tasarımları tamamlandı.
- [ ] Proje listesi, form, detay ve alt bölüm tasarımları tamamlandı.
- [ ] Genel görev, proje görevleri, kanban, filtre ve arama tasarımları tamamlandı.
- [ ] Takvim ve etkinlik tasarımları tamamlandı.
- [ ] Finans liste, form, filtre ve özet tasarımları tamamlandı.
- [ ] Günlük liste ve form tasarımları tamamlandı.
- [ ] Dashboard ve analytics tasarımları tamamlandı.
- [ ] Portal dashboard, proje, görev, planning ve revizyon tasarımları tamamlandı.
- [ ] AI/chat ve kapsamda kalan business sayfalarının tasarımları tamamlandı.

Her sayfa için tasarım kabul checklist'i:

- [ ] Kullanıcı sayfanın amacını ve beklediği UX'i tarif etti.
- [ ] Bilgi hiyerarşisi kullanıcıyla onaylandı.
- [ ] Birincil ve ikincil aksiyonlar kullanıcıyla onaylandı.
- [ ] Poyraz UI v3 atoms/molecules/organisms kullanıldı.
- [ ] Custom generic primitive eklenmedi.
- [ ] Loading state tamamlandı.
- [ ] Empty state tamamlandı.
- [ ] Error state tamamlandı.
- [ ] Permission state tamamlandı.
- [ ] Mobil görünüm doğrulandı.
- [ ] Tablet görünüm doğrulandı.
- [ ] Desktop görünüm doğrulandı.
- [ ] Keyboard ve screen-reader semantiği doğrulandı.
- [ ] Light ve dark mod doğrulandı.
- [ ] Typecheck, hedefli lint ve production build geçti.
- [ ] Kullanıcı sayfayı kabul etti.

Çalışma kuralı: Tasarım sırası Faz 10 başladığında kullanıcı tarafından belirlenir. Kullanıcı yönlendirmesi ve kabulü olmadan toplu sayfa redesign yapılmaz.

Çıkış kriteri: Kapsamdaki tüm sayfalar kullanıcı tarafından tek tek kabul edilmiş, Poyraz UI v3 ile tutarlı ve responsive/accessible olarak doğrulanmıştır.

## 23. Genel ilerleme checklist'i

### Mimari

- [x] Ürün kararları kilitlendi.
- [x] Hedef schema tamamlandı.
- [x] Service/repository sınırı tamamlandı.
- [x] Server-side authorization tamamlandı.
- [x] API v1 sınırı hazırlandı.

### Supabase çıkışı

- [x] Auth taşındı.
- [x] Database taşındı.
- [x] Storage taşındı.
- [x] RLS kuralları server-side testlere çevrildi.
- [x] Import aracı tamamlandı.
- [x] Supabase paketleri kaldırıldı.
- [x] Supabase env değişkenleri kaldırıldı.

### UI

- [x] Poyraz UI v3 kuruldu.
- [x] Preset ve token sistemi kuruldu.
- [x] Global shell taşındı.
- [x] Local primitive tekrarı temizlendi.
- [ ] Faz 10 kullanıcı yönlendirmeli freelancer sayfa tasarımları tamamlandı.
- [ ] Faz 10 kullanıcı yönlendirmeli portal sayfa tasarımları tamamlandı.
- [ ] Bütün kapsam sayfaları kullanıcı tarafından tek tek kabul edildi.
- [ ] Light/dark ve responsive kontroller tamamlandı.

### Özelleştirme

- [x] Instance adı değiştirilebiliyor.
- [x] Logo yüklenebiliyor.
- [x] Favicon/ikon yüklenebiliyor.
- [x] Primary renk değiştirilebiliyor.
- [x] Accent renk değiştirilebiliyor.
- [x] Varsayılan tema değiştirilebiliyor.
- [x] Radius yoğunluğu değiştirilebiliyor.
- [x] Portal markası uygulanıyor.

### Operasyon

- [x] Docker kurulumu çalışıyor.
- [x] Persistent volume doğrulandı.
- [x] Migration güvenli.
- [x] Backup çalışıyor.
- [x] Restore ve checksum doğrulaması çalışıyor.
- [x] Health endpoint'leri çalışıyor.
- [x] Upgrade dokümantasyonu hazır.
- [x] Rollback planı hazır.

### Release

- [x] Typecheck başarılı.
- [ ] Lint başarılı.
- [x] Build başarılı.
- [x] Tüm smoke testler başarılı.
- [x] Kritik authorization negatif testleri başarılı.
- [x] Import rehearsal başarılı.
- [x] Production Docker smoke başarılı.
- [x] README güncel.
- [x] Supabase runtime referansı kalmadı.
- [x] Poyraz UI v2 referansı kalmadı.

## 24. Definition of Done

Neta Self-Hosted v3 aşağıdaki koşulların tümü sağlandığında tamamlanmış kabul edilir:

- Uygulama Supabase projesi veya Supabase environment değişkeni olmadan çalışır.
- Tüm runtime iş verileri SQLite üzerinde tutulur.
- Auth tamamen Better Auth üzerinden çalışır.
- Freelancer ve client rol ayrımı server-side doğrulanır.
- Müşteri davet akışı güvenlidir.
- Portal cross-client veri erişimi negatif testlerle engellenmiştir.
- Dosyalar local persistent volume altında güvenli biçimde tutulur.
- Backup ve restore hem DB'yi hem dosyaları kapsar.
- Tüm genel UI primitive'leri Poyraz UI v3 kullanır.
- Tüm sayfalar loading, empty, error ve permission state'lerine sahiptir.
- Uygulama adı, logo ve temel renkler yönetim ekranından değiştirilebilir.
- Light/dark ve responsive davranışlar doğrulanmıştır.
- Production Docker kurulumu belgelenmiş ve smoke testten geçmiştir.
- Supabase, PWA/Dexie ve Poyraz UI v2 legacy kodu runtime'dan kaldırılmıştır.
- Gelecekteki mobil istemci için service ve API sınırları belgelenmiştir.
- Sayfa tasarımları backend ve runtime Supabase temizliği tamamlandıktan sonra yapılmış, kullanıcı tarafından tek tek kabul edilmiştir.

## 25. Sıradaki çalışma paketi — Faz 8

Faz 0–7 tamamlandı. Sıradaki çalışma paketi production import, runtime Supabase temizliği ve release hardening'dir:

1. Faz 0 schema mapping'ini temel alan tekrar çalıştırılabilir Supabase export/import aracını dry-run, satır sayısı, foreign key ve enum raporlarıyla tamamlamak.
2. Chat ve business dahil korunacak production verisini fixture ve import rehearsal ile doğrulamak; AI key, auth password/session ve raw invitation token taşımamak.
3. Kalan runtime Supabase importlarını ve kullanılmayan legacy helper'ları kaldırmak; `@supabase/ssr` ile `@supabase/supabase-js` paketlerini silmek.
4. PWA/Dexie runtime kararını uygulamak ve kapsam dışı offline kod/paketleri temizlemek.
5. Backup/restore checksum, retention, upgrade/migration ve rollback prosedürlerini production sözleşmesine bağlamak.
6. Supabase environment değişkenleri olmadan production build, standalone/Docker runtime ve kritik cutover smoke testlerini çalıştırmak.
7. README, self-host kurulum, reverse proxy/HTTPS, branding, backup/restore ve upgrade belgelerini güncellemek.

Tasarım backlog'u Faz 10'a kadar açılmaz. Faz 10 başladığında sayfa sırası ve her sayfanın görsel/UX yönü kullanıcı tarafından adım adım belirlenecektir.
