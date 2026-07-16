---
title: Neta Self-Hosted v3 Ana Dönüşüm Planı
description: Supabase çıkışı, SQLite tabanlı backend, Better Auth, Poyraz UI v3 ve instance özelleştirmesi için ana yol haritası.
status: active
last_updated: 2026-07-16
---

# Neta Self-Hosted v3 Ana Dönüşüm Planı

## 1. Belgenin amacı

Bu belge Neta'nın mevcut Supabase tabanlı uygulamadan tamamen self-hosted, tek instance çalışabilen ve hafif bir mimariye taşınması için ana uygulama planıdır.

Plan üç ana hedefi birlikte ele alır:

1. Supabase Auth, Postgres, Storage ve RLS bağımlılıklarını tamamen kaldırmak.
2. UI katmanını yalnızca Poyraz UI v3 tabanlı olacak şekilde sayfa sayfa yenilemek.
3. Self-host eden kişinin Neta'yı logo, renk, tema ve temel marka bilgileriyle özelleştirebilmesini sağlamak.

Bu belge yalnızca teknik görev listesi değildir. Mimari kararları, faz bağımlılıklarını, kalite kapılarını, sayfa bazlı çalışma yöntemini, production cutover sürecini ve gelecekteki mobil istemciye hazırlık sınırlarını da tanımlar.

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

- [ ] Poyraz UI semantic tokenları kullanılıyor.
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

- [ ] `poyraz-ui` v3'e yükseltildi.
- [ ] `@import "poyraz-ui/preset.css";` global CSS'e eklendi.
- [ ] Atom importları `poyraz-ui/atoms` üzerinden.
- [ ] Molecule importları `poyraz-ui/molecules` üzerinden.
- [ ] Organism importları `poyraz-ui/organisms` üzerinden.
- [ ] Tema gerekiyorsa `poyraz-ui/themes` kullanımı değerlendirildi.
- [x] Package modeli ana kullanım biçimi olarak belirlendi.
- [x] Source registry yalnızca source ownership gereken istisnalar için kullanılacak.

### 12.3. Ortak UI standartları

- [ ] Typography hiyerarşisi tanımlandı.
- [ ] Page header standardı tanımlandı.
- [ ] Primary ve secondary action standardı tanımlandı.
- [ ] Form field ve validation standardı tanımlandı.
- [ ] Status-to-Badge eşleme tablosu oluşturuldu.
- [ ] Loading state standardı oluşturuldu.
- [ ] Empty state standardı oluşturuldu.
- [ ] Error state standardı oluşturuldu.
- [ ] Permission/forbidden state standardı oluşturuldu.
- [ ] Destructive confirmation standardı oluşturuldu.
- [ ] Desktop Dialog/Sheet ve mobil Drawer kullanım kuralı belirlendi.
- [ ] Toast ve inline feedback ayrımı belirlendi.
- [ ] DataTable kullanım standardı belirlendi.
- [ ] Dashboard KPI kart standardı belirlendi.

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

## 13. Sayfa bazlı çalışma yöntemi

Her sayfa bir dikey dilim olarak tamamlanır. Yalnızca görünüm değiştirilmiş veya yalnızca backend'i taşınmış yarım sayfa tamamlanmış sayılmaz.

Her sayfa için uygulanacak süreç:

1. Kullanıcı sayfanın amacını ve istenen UX'i tarif eder.
2. Bilgi hiyerarşisi ve ana kullanıcı aksiyonları netleştirilir.
3. Sayfanın veri sözleşmesi çıkarılır.
4. Repository ve service işlemleri tamamlanır.
5. Server Component sorguları ve Server Action mutation'ları yazılır.
6. Gerekli `/api/v1` sözleşmeleri eklenir veya hazırlanır.
7. Sayfa Poyraz UI v3 ile tasarlanır.
8. Loading, empty, error ve permission state'leri eklenir.
9. Responsive ve keyboard davranışı doğrulanır.
10. Pozitif ve negatif testler çalıştırılır.
11. Kullanıcı kabulünden sonra sonraki sayfaya geçilir.

### 13.1. Sayfa kabul checklist'i

Her sayfa için bu şablon kopyalanmalıdır:

- [ ] Sayfanın amacı yazıldı.
- [ ] Birincil kullanıcı aksiyonu belirlendi.
- [ ] İkincil aksiyonlar belirlendi.
- [ ] Bilgi hiyerarşisi onaylandı.
- [ ] Veri okuma sözleşmesi oluşturuldu.
- [ ] Mutation sözleşmeleri oluşturuldu.
- [ ] Owner/role kontrolleri tamamlandı.
- [ ] Input validation tamamlandı.
- [ ] Poyraz UI v3 bileşenleri kullanıldı.
- [ ] Custom primitive eklenmedi.
- [ ] Loading state tamamlandı.
- [ ] Empty state tamamlandı.
- [ ] Error state tamamlandı.
- [ ] Permission state tamamlandı.
- [ ] Mobil görünüm doğrulandı.
- [ ] Tablet görünüm doğrulandı.
- [ ] Desktop görünüm doğrulandı.
- [ ] Keyboard kullanımı doğrulandı.
- [ ] Light mode doğrulandı.
- [ ] Dark mode doğrulandı.
- [ ] Typecheck geçti.
- [ ] İlgili testler geçti.
- [ ] Kullanıcı kabulü alındı.

## 14. Önerilen sayfa dönüşüm sırası

### 14.1. Temel deneyim

- [ ] İlk kurulum sayfası
- [ ] Login sayfası
- [ ] Şifremi unuttum akışı
- [ ] Global app shell
- [ ] Sidebar ve mobil navigation
- [ ] Hesap menüsü ve çıkış
- [ ] Ayarlar ana sayfası
- [ ] Marka ve tema özelleştirme sayfası
- [ ] Profil ve şifre ayarları

### 14.2. Müşteri yönetimi

- [ ] Müşteri listesi
- [ ] Müşteri oluşturma/düzenleme
- [ ] CRM pipeline görünümü
- [ ] Müşteri detay sayfası
- [ ] Müşteri aktivite geçmişi
- [ ] Portal davet durumu ve aksiyonları

### 14.3. Proje ve görev yönetimi

- [ ] Proje listesi
- [ ] Proje oluşturma/düzenleme
- [ ] Proje detay genel bakış
- [ ] Proje planlama bölümleri
- [ ] Proje design system bölümleri
- [ ] Proje dosyaları/kapak görseli
- [ ] Proje görevleri
- [ ] Proje finans özeti
- [ ] Proje revizyon yönetimi
- [ ] Genel görev listesi
- [ ] Kanban görünümü
- [ ] Görev filtreleri ve arama

### 14.4. Operasyon ve kişisel takip

- [ ] Takvim
- [ ] Etkinlik oluşturma/düzenleme
- [ ] Finans listesi
- [ ] Gelir/gider oluşturma/düzenleme
- [ ] Finans filtreleri ve özetleri
- [ ] Günlük listesi
- [ ] Günlük oluşturma/düzenleme

### 14.5. Özet ve analiz

- [ ] Dashboard
- [ ] Dashboard tarih aralığı
- [ ] Analytics
- [ ] Aggregate repository sorguları
- [ ] Grafikler ve erişilebilir veri özetleri

### 14.6. Müşteri portalı

- [ ] Portal davet kabul sayfası
- [ ] Portal shell
- [ ] Portal dashboard
- [ ] Portal proje listesi
- [ ] Portal proje detayı
- [ ] Public görev görünümü
- [ ] Planlama bölümleri görünümü
- [ ] Revizyon talebi oluşturma
- [ ] Revizyon geçmişi
- [ ] Portal hesap ayarları

### 14.7. AI

- [ ] AI provider ayarlarının server-only hale getirilmesi
- [ ] AI chat session listesi
- [ ] AI chat mesaj ekranı
- [ ] Kullanıcı verisi context builder
- [ ] Finans analizi
- [ ] Proje risk analizi
- [ ] Provider hata ve timeout yönetimi
- [ ] Kullanıcıya veri paylaşımı/gizlilik açıklaması

### 14.8. Opsiyonel business modülleri

- [ ] Teklifler
- [ ] Sözleşmeler
- [ ] Faturalar
- [ ] Abonelikler

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
- [ ] API sürümleme stratejisi tanımlandı.
- [ ] Instance metadata sözleşmesi tanımlandı.
- [ ] Minimum desteklenen client sürümü alanı düşünüldü.
- [ ] Capability listesi sözleşmesi düşünüldü.
- [x] Service katmanı cookie/Next.js objelerine bağımlı değil.
- [ ] Mobil pairing ilk release kapsamı dışında tutuldu.
- [ ] Gelecekte HTTPS zorunluluğu belgelendi.

## 17. Supabase veri import ve cutover planı

### 17.1. Import aracı

- [ ] Supabase tablolarının kaynak mapping'i güncellendi.
- [ ] Export formatı tanımlandı.
- [ ] Import dry-run modu var.
- [ ] Kaynak ve hedef satır sayıları raporlanıyor.
- [ ] Foreign key tutarsızlıkları raporlanıyor.
- [ ] Bilinmeyen enum/status değerlerinde import fail ediyor.
- [ ] `completed` görev status'ü `done` olarak normalize ediliyor.
- [ ] Para değerleri minor unit'e güvenli dönüştürülüyor.
- [ ] `journals` ve `daily_logs` merge kuralı uygulanıyor.
- [ ] AI API key'leri taşınmıyor.
- [ ] Auth password/session verileri taşınmıyor.
- [ ] Client kullanıcıları yeniden davet ediliyor.
- [ ] Storage dosyaları metadata ve checksum ile aktarılıyor.
- [ ] Import tekrar çalıştırıldığında davranış tanımlı.

### 17.2. Production cutover

- [ ] Production backup alındı.
- [ ] Supabase uygulaması maintenance/read-only moda alındı.
- [ ] Son export alındı.
- [ ] Import dry-run başarılı.
- [ ] Final import başarılı.
- [ ] Satır sayısı doğrulandı.
- [ ] Dosya sayısı ve checksum doğrulandı.
- [ ] İlk admin Better Auth hesabı hazırlandı.
- [ ] Client re-invite planı hazırlandı.
- [ ] Kritik kullanıcı akışları smoke test edildi.
- [ ] DNS/deploy geçişi yapıldı.
- [ ] Rollback penceresi ve yöntemi belgelendi.
- [ ] Supabase hemen silinmedi; tanımlı süre read-only backup olarak tutuldu.

## 18. Dependency azaltma planı

### 18.1. Supabase çıkışı tamamlandığında kaldırılacaklar

- [ ] `@supabase/ssr`
- [ ] `@supabase/supabase-js`
- [ ] `lib/supabase/*`
- [ ] Legacy Supabase auth helper'ları
- [ ] Supabase service-role client kullanımları
- [ ] Runtime Supabase environment değişkenleri

### 18.2. Offline/PWA temizliği

- [ ] `@ducanh2912/next-pwa`
- [ ] `dexie`
- [ ] `dexie-react-hooks`
- [ ] Legacy `lib/db.ts`
- [ ] Offline indicator, kapsam dışıysa
- [ ] Service worker çıktıları
- [ ] PWA manifest kararı güncellendi

### 18.3. Poyraz UI v3 sonrası değerlendirilecekler

- [ ] `@base-ui/react`
- [ ] Doğrudan `@radix-ui/*` bağımlılıkları
- [ ] `radix-ui`
- [ ] `shadcn`
- [ ] Kullanılmayan local UI primitive'leri
- [ ] `framer-motion`, kullanım kalmadıysa
- [ ] `next-themes`, tema başka şekilde çözüldüyse
- [ ] Kullanılmayan icon/form/theme yardımcıları

### 18.4. İşlevsel gerekçeyle korunabilecekler

- Next.js ve React
- Poyraz UI v3
- Better Auth
- `better-sqlite3`
- Drizzle ORM
- Zod
- `date-fns`
- Kanban için `dnd-kit`
- Grafikler için Recharts
- Gerçekten kullanılan AI provider paketleri

Dependency kalite kapısı:

- [ ] Her production dependency için aktif import veya açık gerekçe var.
- [ ] Aynı işi yapan iki UI primitive sistemi yok.
- [ ] Aynı işi yapan iki auth sistemi yok.
- [ ] Aynı işi yapan iki runtime database sistemi yok.
- [ ] Browser database bağımlılığı yok.
- [ ] Build çıktısında Supabase referansı yok.
- [ ] Build çıktısında Poyraz UI v2 referansı yok.

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
- [ ] Supabase import fixture testi
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
- [ ] Restore manifest checksum'larını doğruluyor.
- [x] Restore canlı DB üzerine kontrolsüz yazmıyor.
- [ ] Backup retention politikası belgelendi.
- [ ] Reverse proxy ve HTTPS kurulumu belgelendi.

## 21. Dokümantasyon planı

- [ ] README yeni SQLite/Better Auth mimarisini anlatıyor.
- [ ] Supabase'in artık runtime gereksinimi olmadığı açık.
- [ ] Docker ile kurulum belgelendi.
- [ ] Coolify/Dokploy kurulumu belgelendi.
- [x] Environment değişkenleri güncellendi.
- [x] İlk admin kurulumu belgelendi.
- [x] Client invitation akışı belgelendi.
- [ ] Branding ayarları belgelendi.
- [x] Backup/restore belgelendi.
- [ ] Upgrade/migration akışı belgelendi.
- [ ] Mobil API sınırı belgelendi.
- [ ] Eski ve çelişkili Supabase belgeleri archive veya kaldırıldı.
- [ ] ADR-0006 Poyraz UI v3 kararıyla güncellendi.
- [ ] ADR-0007 ile PWA runtime durumu uyumlu hale getirildi.

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

Amaç: Sayfa dönüşümleri başlamadan önce ortak UI sistemini kurmak.

- [ ] Poyraz UI v3 kuruldu.
- [ ] Preset CSS eklendi.
- [ ] Global shell Poyraz Sidebar organism ile kuruldu.
- [ ] Typography standardı tamamlandı.
- [ ] Form standardı tamamlandı.
- [ ] Feedback state'leri tamamlandı.
- [ ] Tema/branding token bridge tamamlandı.
- [ ] Local primitive kaldırma politikası uygulandı.

Çıkış kriteri: Yeni sayfalar ek bir primitive sistemi oluşturmadan geliştirilebiliyor.

### Faz 5 — Freelancer sayfalarının dikey dönüşümü

Amaç: Her freelancer sayfasını backend ve UI ile birlikte Supabase'ten çıkarmak.

- [ ] Temel deneyim sayfaları tamamlandı.
- [ ] Müşteri sayfaları tamamlandı.
- [ ] Proje sayfaları tamamlandı.
- [ ] Görev sayfaları tamamlandı.
- [ ] Takvim tamamlandı.
- [ ] Finans tamamlandı.
- [ ] Günlük tamamlandı.
- [ ] Dashboard tamamlandı.
- [ ] Analytics tamamlandı.

Çıkış kriteri: Freelancer dashboard'u Supabase olmadan tam çalışıyor.

### Faz 6 — Müşteri portalı

Amaç: Better Auth client hesabı ve server-side authorization ile güvenli portalı tamamlamak.

- [x] Portal davet kabulü tamamlandı.
- [ ] Portal shell tamamlandı.
- [ ] Portal proje ve görev görünümü tamamlandı.
- [ ] Planning section görünümü tamamlandı.
- [ ] Revision akışı ve quota transaction'ı tamamlandı.
- [ ] Portal authorization negatif testleri geçti.
- [ ] Portal branding tamamlandı.

Çıkış kriteri: Client yalnızca kendi verisini görüyor ve güvenli revision talebi oluşturabiliyor.

### Faz 7 — AI ve gelişmiş modüller

Amaç: AI/chat ve kapsamda kalan business modüllerini yeni backend'e taşımak.

- [ ] Chat session/message verileri SQLite'a taşındı.
- [ ] AI secrets browser'dan kaldırıldı.
- [ ] Context builder service katmanına taşındı.
- [ ] Finans analizi taşındı.
- [ ] Proje risk analizi taşındı.
- [ ] Kapsamdaki business modülleri tamamlandı.

Çıkış kriteri: Runtime AI özelliklerinde Supabase bağımlılığı yok.

### Faz 8 — Import, temizlik ve release hardening

Amaç: Production geçişini güvenli hale getirmek ve legacy bağımlılıkları kaldırmak.

- [ ] Supabase import aracı tamamlandı.
- [ ] Import rehearsal tamamlandı.
- [ ] Supabase runtime paketleri kaldırıldı.
- [ ] PWA/Dexie legacy kodu kaldırıldı.
- [ ] Kullanılmayan UI bağımlılıkları kaldırıldı.
- [ ] Backup/restore doğrulandı.
- [ ] Docker production smoke tamamlandı.
- [ ] Dokümantasyon güncellendi.
- [ ] Cutover ve rollback provası tamamlandı.

Çıkış kriteri: Uygulama Supabase environment değişkenleri olmadan build ve runtime smoke testini geçiyor.

### Faz 9 — Mobil API hazırlığı

Amaç: React Native geliştirmesine başlamadan önce instance keşif ve stabil API sınırını tamamlamak.

- [ ] `/api/v1` sözleşmesi yayınlandı.
- [ ] `/.well-known/neta` sözleşmesi yayınlandı.
- [ ] Instance metadata ve capability modeli tamamlandı.
- [ ] Pairing güvenlik tasarımı ayrı ADR olarak yazıldı.
- [ ] Device token lifecycle tasarlandı.

Çıkış kriteri: Mobil istemci backend'in iç uygulama detaylarına bağımlı olmadan entegrasyona başlayabilir.

## 23. Genel ilerleme checklist'i

### Mimari

- [x] Ürün kararları kilitlendi.
- [ ] Hedef schema tamamlandı.
- [ ] Service/repository sınırı tamamlandı.
- [ ] Server-side authorization tamamlandı.
- [ ] API v1 sınırı hazırlandı.

### Supabase çıkışı

- [ ] Auth taşındı.
- [ ] Database taşındı.
- [ ] Storage taşındı.
- [ ] RLS kuralları server-side testlere çevrildi.
- [ ] Import aracı tamamlandı.
- [ ] Supabase paketleri kaldırıldı.
- [ ] Supabase env değişkenleri kaldırıldı.

### UI

- [ ] Poyraz UI v3 kuruldu.
- [ ] Preset ve token sistemi kuruldu.
- [ ] Global shell taşındı.
- [ ] Freelancer sayfaları taşındı.
- [ ] Portal sayfaları taşındı.
- [ ] Local primitive tekrarı temizlendi.
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

- [ ] Docker kurulumu çalışıyor.
- [ ] Persistent volume doğrulandı.
- [ ] Migration güvenli.
- [x] Backup çalışıyor.
- [x] Restore ve checksum doğrulaması çalışıyor.
- [ ] Health endpoint'leri çalışıyor.
- [ ] Upgrade dokümantasyonu hazır.
- [ ] Rollback planı hazır.

### Release

- [ ] Typecheck başarılı.
- [ ] Lint başarılı.
- [ ] Build başarılı.
- [ ] Tüm smoke testler başarılı.
- [ ] Kritik authorization negatif testleri başarılı.
- [ ] Import rehearsal başarılı.
- [ ] Production Docker smoke başarılı.
- [ ] README güncel.
- [ ] Supabase runtime referansı kalmadı.
- [ ] Poyraz UI v2 referansı kalmadı.

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

## 25. İlk uygulanacak çalışma paketi

Plan onaylandıktan sonra önerilen ilk çalışma paketi:

1. Bölüm 4'teki açık ürün kararlarını cevaplamak.
2. ADR-0006'yı Poyraz UI v3 kararıyla değiştirmek.
3. Tek owner/admin varsayımını schema ve authorization sözleşmesine yazmak.
4. Hedef domain schema taslağını oluşturmak.
5. Client invitation akışını tasarlamak.
6. Poyraz UI v3 foundation için mevcut import/dependency envanterini çıkarmak.
7. İlk sayfa grubu olarak kurulum, login, app shell ve branding/settings tasarımını netleştirmek.
