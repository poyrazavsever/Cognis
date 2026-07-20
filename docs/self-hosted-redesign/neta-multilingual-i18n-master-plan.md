---
title: Neta Çok Dilli Sistem V2 Ana Planı
description: Ayarlar bilgi mimarisi, owner ve müşteri dil tercihleri, yönetilebilir arayüz çevirileri ve tüm dinamik içerik formları için sayfa bazlı uygulama planı.
status: in_progress
current_phase: "faz-21"
last_updated: 2026-07-20
supersedes: "neta-multilingual-i18n-v1-legacy-plan.md"
---

# Neta Çok Dilli Sistem V2 Ana Planı

## 1. Neden yeni bir plan gerekiyor?

İlk i18n uygulaması veri modeli ve temel runtime açısından kullanılabilir parçalar
üretmiş olsa da ürün davranışı ve uygulama kapsamı hedeflenen yapıdan sapmıştır.
Bu belge mevcut uygulamayı bitmiş kabul etmez; onu denetlenmesi ve düzeltilmesi
gereken bir altyapı olarak ele alır.

Kod incelemesinde doğrulanan temel problemler:

- Login, register ve reset-password ekranlarında dil seçici bulunuyor.
- Auth öncesi locale çözümlemesi cookie'yi dikkate aldığı için public auth
  ekranının dili kullanıcı tarafından değiştirilebiliyor.
- `/settings` yaklaşık 1.200 satırlık tek bir client component ve görünüm, marka,
  profil, güvenlik, AI, kişisel dil tercihi, dil yönetimi ve çeviri editörünü aynı
  ekranda topluyor.
- Settings menüsü component içi state ile tab değiştiriyor; her bölümün ayrı URL,
  loading/error sınırı ve server-side authorization noktası yok.
- Portal shell `/portal/settings` bağlantısı üretiyor fakat bu route mevcut değil.
- Türkçe ve İngilizce katalogların büyük kısmı yalnız sayfa başlığı ve birkaç
  aksiyondan oluşuyor; ekranların içindeki form, dialog, toast, tablo, filtre,
  boş durum ve validation metinlerinin çoğu hâlâ hard-coded.
- Türkçe karakter içeren sabit UI metinleri dashboard, analiz, takvim, müşteri,
  proje, görev, finans, günlük, sohbet, business ve ortak component dosyalarında
  hâlâ bulunuyor.
- Mevcut içerik translation registry yalnızca branding, project,
  planning_section, task, calendar_event ve client alanlarının küçük bir kısmını
  tanımlıyor.
- Finans, günlük, müşteri aktiviteleri, teklifler, sözleşmeler ve abonelikler gibi
  kullanıcı tarafından üretilen metinler kapsam dışında kalmış.
- `LocalizedFields` bileşeninin kendi label, badge ve hata metinleri Türkçe sabit.
- Dashboard layout tüm namespace'leri her sayfaya gönderiyor; sayfa bazlı katalog
  yükleme sınırı henüz uygulanmıyor.

Önceki plan ve faz belgeleri geçmiş uygulamanın kaydı olarak
[`neta-multilingual-i18n-v1-legacy-plan.md`](neta-multilingual-i18n-v1-legacy-plan.md)
dosyasına taşınmıştır. Bu dosyadaki checkbox'lar yalnız V2 çalışmasının durumunu
gösterecektir.

## 2. Ürün hedefi

Neta'yı self-host eden kişi:

- Sistemin varsayılan dilini Türkçe veya İngilizce yapabilmeli.
- Kendi hesabında aktif dillerden birini kişisel arayüz dili olarak seçebilmeli.
- Yeni bir dil ekleyebilmeli, bu dilin bütün sistem metinlerini çevirebilmeli ve
  yeterli tamamlanma seviyesine ulaştığında aktif edebilmeli.
- Arayüz çevirilerini kod değiştirmeden düzenleyebilmeli, içe/dışa
  aktarabilmeli.
- Proje, görev, finans işlemi ve diğer çevrilebilir kayıtları oluştururken aktif
  dil sayısı kadar dil tab'ı görebilmeli.
- Her dil tab'ında yalnız metinsel ve gerçekten çevrilebilir alanları
  doldurabilmeli.
- Bir müşteriye portal hesabı açarken müşterinin başlangıç dilini seçebilmeli.

Portal kullanıcısı:

- İlk kez admin tarafından atanan portal dilini görmeli.
- Hesabı açıldıktan sonra `/portal/settings/language` üzerinden yalnız admin
  tarafından aktif edilmiş diller arasında geçiş yapabilmeli.
- Kendi seçimi olmadığı sürece admin tarafından atanan portal varsayılanını
  kullanmalı.
- Proje, görev, plan ve diğer paylaşılan içerikleri kendi dilinde; çeviri yoksa
  açıkça tanımlanmış fallback zinciriyle görmeli.

## 3. Kesin ürün kararları

### 3.1. Auth ekranlarında dil davranışı

- Login ekranında dil seçici olmayacak.
- İlk admin kayıt ekranında dil seçici olmayacak.
- Şifre unuttum ve şifre sıfırla ekranlarında dil seçici olmayacak.
- Standart public auth ekranları instance varsayılan diliyle açılacak.
- Browser `Accept-Language` veya eski `neta_locale` cookie'si public login dilini
  değiştirmeyecek.
- Portal davet ekranı bir istisnadır: adminin davette belirlediği snapshot locale
  ile açılır fakat burada da dil seçici bulunmaz.
- Başarılı login sonrasında authenticated kullanıcının kendi tercihi çözülür.

### 3.2. Owner/freelancer locale önceliği

```text
user_preferences.language
  -> instance_i18n_settings.default_locale
  -> built-in tr
```

- Owner dilini `/settings/language` sayfasından değiştirir.
- Seçim yalnız `active` diller arasından yapılır.
- Locale cookie'si dil kararında kullanılmaz; authenticated tercih veritabanından
  ve public dil instance ayarından çözülür.

### 3.3. Portal locale önceliği

```text
portal kullanıcısının user_preferences.language
  -> clients.portal_locale (adminin belirlediği başlangıç dili)
  -> instance default locale
  -> built-in tr
```

- Davet oluşturulurken `clients.portal_locale` ve
  `portal_invitations.locale` aynı seçimi taşır.
- Davet locale'i davet ekranı için immutable snapshot'tır.
- Davet kabul edildiğinde müşteri preference kaydı başlangıçta bu locale ile
  oluşturulur.
- Müşteri daha sonra kendi preference değerini değiştirebilir.
- Adminin client varsayılanını daha sonra değiştirmesi, müşterinin açık kişisel
  tercihini sessizce ezmez.
- Bir dil arşivlenirse o dili kullanan tercihler kontrollü fallback'e düşer ve
  ayarlar ekranında yeniden seçim istenir.

### 3.4. Instance varsayılan dilinin rolü

Instance varsayılanı:

- Public auth ve sistem ekranlarının dilidir.
- Yeni owner/freelancer preference kaydının başlangıç değeridir.
- Yeni müşteri davetinde ön-seçili portal dilidir.
- Eksik veya geçersiz kullanıcı tercihlerinin fallback'idir.
- Çevrilebilir içerik formlarında ilk ve zorunlu tab'dır.

Instance varsayılanı, mevcut kullanıcıların açık kişisel tercihlerini topluca
değiştirmez.

### 3.5. Built-in ve custom diller

- Türkçe (`tr`) ve İngilizce (`en`) built-in gelir.
- Built-in diller silinemez.
- Self-host eden kişi built-in metinleri override edebilir.
- Yeni dil `draft` oluşturulur, fallback dili seçilir ve çevrilir.
- Yeterli katalog bütünlüğü olmadan `active` yapılamaz.
- Yalnız `active` diller kullanıcı tercihlerinde, müşteri davetinde ve içerik
  form tab'larında gösterilir.
- `draft` dil çeviri editöründe görünür fakat son kullanıcıya sunulmaz.
- Kullanımda olan veya default olan dil arşivlenmeden önce bağımlılıklar çözülür.

## 4. Ayarlar bilgi mimarisi

Tek `/settings` client component kaldırılacak. Ayarlar, dashboard ana
sidebar'ındaki tek `Ayarlar` menüsünden açılan ve kendi kalıcı iç navigasyonuna
sahip route grubu olacaktır.

```text
/settings
  /general
  /appearance
  /profile
  /security
  /ai
  /language
  /languages
  /languages/new
  /languages/[locale]
  /languages/[locale]/translations
  /languages/import-export

/portal/settings
  /language
  /appearance
  /profile
  /security
```

### 4.1. Desktop yerleşimi

```text
┌──────────────────────────────────────────────────────────────┐
│ Ayarlar                                                      │
├──────────────────┬───────────────────────────────────────────┤
│ Genel            │ Aktif alt sayfanın başlığı               │
│ Görünüm          │                                           │
│ Profil           │ Route'a özel form / liste / editor        │
│ Güvenlik         │                                           │
│ Yapay zekâ       │                                           │
│ Dil tercihi      │                                           │
│ Diller           │                                           │
└──────────────────┴───────────────────────────────────────────┘
```

- İç sidebar settings layout içinde sticky kalır.
- Aktif öğe pathname üzerinden belirlenir.
- İç sidebar tüm ayar sayfalarında aynı konumda kalır.
- Her alt sayfa kendi Server Component veri yüklemesine ve action dosyasına
  sahip olur.
- Form submit sırasında tüm ayarlar verisi tekrar yüklenmez.
- Owner-only ve user-level sayfalar navigasyonda görsel olarak ayrılır.

### 4.2. Mobil yerleşim

- İç sidebar üstte dropdown veya yatay scroll olan kompakt settings nav'a döner.
- Sayfa değişimi gerçek route navigasyonudur.
- Form aksiyonları sticky footer kullanabilir; viewport yatay scroll yapmaz.
- Translation editor küçük ekranda kaynak ve hedef alanları alt alta gösterir.

### 4.3. Settings yetki matrisi

| Sayfa | Owner/freelancer | Portal client |
| --- | --- | --- |
| Genel/branding | Yönetir | Göremez |
| Görünüm | Kişisel tema + owner marka | Kişisel tema |
| Profil | Kendi hesabı | Kendi hesabı |
| Güvenlik | Kendi hesabı | Kendi hesabı |
| AI | Yönetir | Göremez |
| Dil tercihi | Aktif dillerden seçer | Aktif dillerden seçer |
| Diller ve çeviriler | Yönetir | Göremez |

## 5. Dil yönetimi UX'i

### 5.1. `/settings/language` — kişisel dil tercihi

Bu sayfa yalnız oturumdaki owner/freelancer'ın uygulama dilini değiştirir.

- Aktif diller kart/radio listesi olarak gösterilir.
- Native name, yönetim adı ve locale kodu görünür.
- Seçim kaydedilince preference DB'ye yazılır ve layout yenilenir.
- “Instance varsayılanı” ayrı bir bilgi satırında gösterilir.
- Bu ekran custom dil oluşturmaz veya katalog düzenlemez.

### 5.2. `/settings/languages` — dil yönetimi

- Üstte instance varsayılan dil seçimi bulunur.
- Dil listesi tablo/kart halinde ayrı satırlardır.
- Her satırda native ad, kod, durum, fallback, UI tamamlanma oranı, çevrilebilir
  içerik durumu ve kullanım sayısı görünür.
- Birincil aksiyon `Dil ekle`, satır aksiyonu `Yönet` olur.
- Draft/active/archived durumları yalnız renk ile anlatılmaz.
- Built-in, default ve kullanımda rozetleri ayrı gösterilir.
- Tehlikeli lifecycle aksiyonları confirmation dialog kullanır.

### 5.3. `/settings/languages/new` — dil ekleme

- Locale kodu BCP 47 olarak doğrulanır ve canonical hale getirilir.
- Yönetim adı, native ad, yazı yönü ve fallback dili alınır.
- Dil her zaman `draft` oluşturulur.
- Başarılı işlem `[locale]` detayına yönlendirir.
- Aynı kod, self fallback, fallback loop ve geçersiz yön engellenir.

### 5.4. `/settings/languages/[locale]` — dil detayı

- Dil metadata'sı ve lifecycle burada yönetilir.
- Tamamlanma özeti namespace ve sayfa bazında gösterilir.
- Eksik kritik alanlar doğrudan ilgili translation editor filtresine bağlanır.
- Aktifleştirme öncesi readiness checklist görünür.
- Default yapma, aktif etme, arşivleme gibi aksiyonlar etkilerini açıklar.
- Kullanıcı ve client kullanım sayıları gösterilir.

### 5.5. `/settings/languages/[locale]/translations` — çeviri editörü

- Kullanıcı teknik key kalabalığına bırakılmaz; önce `Sayfa/Modül`, sonra bölüm
  seçer.
- Arama; kaynak metin, hedef metin ve teknik key üzerinde çalışır.
- Türkçe ve İngilizce referans metinleri erişilebilir şekilde gösterilir.
- Hedef dil input'u, fallback preview ve override durumu ayrıdır.
- `Tümü`, `Eksikler`, `Değiştirilenler`, `Portal için gerekli` filtreleri vardır.
- Satır bazlı otomatik kaydetme veya açık toplu kaydetme davranışından yalnız biri
  seçilip tutarlı uygulanır; önerilen model dirty-state + toplu kaydetmedir.
- Sayfadan kaydedilmemiş değişiklikle çıkış uyarısı bulunur.
- Reset, built-in/fallback metnine döner ve sonucu preview eder.
- Tamamlanma yüzdesi yalnız key varlığını değil boş değer ve interpolation
  uyumunu da denetler.
- Import/export ayrı route'a taşınır; ana editörü kalabalıklaştırmaz.

## 6. Arayüz çevirisi sözleşmesi

Her fazda bir sayfa tam olarak bitmeden sonraki sayfaya geçilmez. Bir sayfanın
“çevrildi” sayılması için yalnız başlık yeterli değildir.

Her sayfada aşağıdaki yüzeyler denetlenir:

- Page title ve metadata
- Header aksiyonları
- Stats kartları
- Tab, filtre, sort ve arama alanları
- Form label, placeholder ve helper metinleri
- Select seçenekleri ve enum label'ları
- Tablo kolonları ve pagination
- Kart/list/kanban görünümleri
- Dialog, sheet, popover ve tooltip
- Empty, loading, error ve permission state'leri
- Confirmation mesajları
- Toast mesajları
- Server action ve API'den kullanıcıya gösterilen hatalar
- `aria-label`, image alt ve screen reader metinleri
- Tarih, saat, sayı, yüzde ve para formatları

### 6.1. Namespace yapısı

Kataloglar gerçek dosyalara ayrılacaktır; yalnız `tr/index.ts` ve `en/index.ts`
içinde dev objeler tutulmayacaktır.

```text
locales/{locale}/
  common.ts
  auth.ts
  navigation.ts
  dashboard.ts
  analytics.ts
  calendar.ts
  clients.ts
  client-detail.ts
  projects.ts
  project-detail.ts
  tasks.ts
  finance.ts
  journal.ts
  chat.ts
  proposals.ts
  invoices.ts
  subscriptions.ts
  settings-general.ts
  settings-appearance.ts
  settings-profile.ts
  settings-security.ts
  settings-ai.ts
  settings-language.ts
  settings-languages.ts
  portal-common.ts
  portal-dashboard.ts
  portal-projects.ts
  portal-project-detail.ts
  portal-tasks.ts
  portal-revisions.ts
  portal-settings.ts
  validation.ts
  status.ts
```

### 6.2. Katalog kalite kapıları

- `tr` ve `en` key parity yüzde 100 olmalıdır.
- Boş string çeviri sayılmaz.
- Interpolation değişkenleri iki dilde aynı olmalıdır.
- Raw key production UI'da görünmemelidir.
- Built-in katalogda bir dilin metni diğer dile kopyalanmış olmamalıdır.
- Her sayfanın kendi missing-key smoke testi olmalıdır.
- Hard-coded kullanıcı metni taraması sayfa fazının testine eklenmelidir.
- Teknik log ve geliştirici hata detayları taramanın dışında tutulabilir.

## 7. Dinamik içerik çevirisi sözleşmesi

Arayüz metni ile kullanıcının oluşturduğu domain içeriği ayrı kalacaktır.

### 7.1. Form davranışı

- Form açıldığında tüm `active` diller, instance sırasına göre tab olur.
- Instance default dili ilk tab ve zorunlu kaynaktır.
- Tab label'ında native name, default rozeti ve eksik alan göstergesi yer alır.
- Yalnız çevrilebilir metin alanları tab paneline girer.
- Tarih, tutar, durum, ilişki, checkbox, dosya ve teknik alanlar tab'ların dışında
  tek kez gösterilir.
- Tab değiştirmek form state'ini kaybettirmez.
- Create ve edit aynı ortak `LocalizedFormSection` sözleşmesini kullanır.
- Edit formu her dilde kayıtlı değeri ayrı yükler; resolved fallback değerini
  gerçek kayıt gibi input'a yazmaz.
- Fallback ile gösterilen değer input'ta preview olabilir fakat “bu dilde kayıtlı”
  gibi işaretlenmez.
- Default dilde zorunlu alanlar kaydı engeller.
- Diğer aktif dillerde eksik alanlar tab üzerinde gösterilir; ürün kuralına göre
  warning veya portal publish blocker olur.
- Form action bütün locale payload'unu tek transaction içinde kaydeder.
- Domain kaydı silinince ilgili `content_translations` kayıtları da silinir.

### 7.2. Çevrilebilir alan matrisi

| Entity | Çevrilecek alanlar | Çevrilmeyecek alan örnekleri |
| --- | --- | --- |
| Branding | `portalWelcomeText`, `portalFooterText` | logo dosyaları, renk |
| Client | `notes` | kişi/firma adı, e-posta, telefon |
| Client activity | `title`, `content` | activity type, tarih |
| Project | `name`, `description`, `coverImageAlt` | bütçe, tarih, status |
| Planning section | `title`, `content` | category, sort order |
| Task | `title`, `description` | status, priority, süre |
| Calendar event | `title`, `description` | başlangıç/bitiş, type |
| Finance transaction | `category`, `description` | tutar, para birimi, ödeme durumu |
| Journal entry | `moodLabel`, `note` | skorlar, tarih |
| Proposal | `title`, `description` | tutar, currency, status |
| Contract | `title`, `content` | status ve ilişkiler |
| Subscription | `name`, `category` | tutar, billing cycle, tarih |

### 7.3. Kaynak dilinde saklanacak iletişim içeriği

Aşağıdaki içerikler çeviri tab'ıyla çoğaltılmaz; çünkü bir kişinin yazdığı
mesajdır:

- Chat mesajı
- Portal revizyon talebi
- Gelecekte e-posta/yorum/mesaj kayıtları

Bu kayıtlara `sourceLocale` eklenebilir. Otomatik çeviri ayrı bir özellik olur ve
orijinal metni değiştirmez. Chat session'ın kullanıcı tarafından düzenlenebilen
başlığı için ise aktif dil tab'ları kullanılabilir; salt AI tarafından üretilen
başlıkta source locale saklanır.

### 7.4. Legacy kolon ve translation tablosu

- Mevcut ana metin kolonları bu sürümde kaldırılmaz.
- Default locale değeri legacy kolona ve `content_translations` kaydına aynı
  transaction içinde yazılır.
- İlk migration eksik entity/field kayıtlarını instance default locale'e
  backfill eder.
- Backfill idempotent olur ve kullanıcı çevirisini ezmez.
- Read tarafı requested locale -> locale fallback -> instance default -> legacy
  kolon zincirini kullanır.
- Liste sorgularında N+1 yapılmaz; translation kayıtları entity ID listesiyle
  batch okunur.

## 8. Teknik mimari düzeltmeleri

### 8.1. Resolver'ları ayır

Tek `resolveRequestLocale()` fonksiyonu bütün bağlamları tahmin etmeye
çalışmayacaktır.

```text
resolvePublicLocale()
resolveInvitationLocale(token)
resolveFreelancerLocale(session)
resolvePortalLocale(session, client)
```

- Public resolver cookie ve `Accept-Language` kullanmaz.
- Freelancer resolver user preference kullanır.
- Portal resolver user preference ve client default ayrımını korur.
- Invitation resolver yalnız geçerli invitation snapshot ve instance fallback
  kullanır.
- Her resolver source bilgisini test ve gözlemlenebilirlik için döndürür.

### 8.2. Preference ve admin default ayrımı

- `saveLanguagePreference` yalnız oturum kullanıcısının preference'ını değiştirir.
- `setDefaultLocale` owner-only instance ayarıdır.
- `setClientPortalLocale` adminin client başlangıç/default dilini değiştirir.
- `setPortalUserLanguagePreference` portal kullanıcısının açık kişisel seçimini
  değiştirir.
- Bu dört işlem aynı action adı veya aynı UI kontrolü altında karıştırılmaz.

### 8.3. Sayfa bazlı katalog yükleme

- Root/dashboard layout yalnız `common`, `navigation` ve shell için gereken
  namespace'leri taşır.
- Her page kendi namespace'ini server tarafında yükler.
- Client component'e yalnız o sayfanın mesajları verilir.
- Custom translation değişiklikleri catalog version ile cache invalidate eder.

### 8.4. API ve mobil uyumu

Mobil istemci için locale yalnız web cookie'sine bağlı olmayacaktır.

- `/api/v1/meta` aktif dilleri, default dili, direction ve catalog version'ı
  döndürür.
- `/api/v1/me` kişisel tercih, client default ve resolved locale'i ayrı alanlarda
  döndürür.
- Kullanıcı preference mutation endpoint'i hem freelancer hem client rolünü
  güvenli biçimde destekler.
- Owner locale/language management endpoint'leri owner-only kalır.
- Domain mutation payload'u
  `translations: Record<locale, Record<field, string | null>>` şeklindedir.
- Domain response varsayılan olarak resolved içerik döndürür.
- Owner edit endpoint'i `translations` map'ini ayrıca döndürür.
- Portal actor yalnız resolved ve kendisine görünür içeriği alır.
- Web ile mobil aynı resolver/service katmanını kullanır.
- Locale tercihi URL/query/header ile geçici istenebilse bile authorization ve
  aktif dil kontrollerini atlayamaz.

## 9. Faz sırası ve uygulama kuralları

- Her faz tek bir sayfa veya tek bir altyapı sorumluluğudur.
- Bir sayfanın UI çevirisi, form içerik çevirisi ve o sayfaya ait server
  action/hata çevirileri aynı fazda tamamlanır.
- Bir fazın checklist'i ve kabul kriterleri tamamlanmadan sonraki sayfa fazına
  geçilmez.
- Her faz sonunda master plan checkbox'ları gerçek sonuca göre işaretlenir.
- Her sayfa Türkçe, İngilizce ve eksik custom locale fixture'ıyla test edilir.
- Her faz `typecheck`, `lint`, ilgili smoke test ve `git diff --check` kapısından
  geçer.
- Tasarım değişikliği gereken settings sayfaları Poyraz UI v3 bileşenleriyle
  yapılır; hard-coded component renkleri eklenmez.

## 10. Faz bazlı uygulama planı

### Faz 0 — V2 baseline, envanter ve regression sözleşmesi

Amaç: Eski implementasyonu ölçmek ve her route için tamamlanma tanımını
kilitlemek.

- [x] Auth ekranlarındaki locale select kullanımını test fixture'ıyla kaydet.
- [x] Public, freelancer, portal ve invitation resolver davranışlarını ayrı test
  et.
- [x] Tüm route/page/client/action/loading/error dosyalarının kullanıcı metni
  envanterini çıkar.
- [x] Her sayfa için mevcut katalog key kapsamını ve hard-coded metin sayısını
  raporla.
- [x] Tüm domain create/edit formlarını ve metinsel alanları envanterle.
- [x] Portalda görünen ve owner-only kalan alanları işaretle.
- [x] V1 veri modeli için korunacak, düzeltilecek ve kaldırılacak parçaları ADR
  olarak yaz.
- [x] TR/EN/custom locale seed ve regression fixture'larını hazırla.
- [x] Sayfa bazlı i18n smoke runner oluştur.
- [x] Baseline build, typecheck ve lint sonuçlarını kaydet.

Faz 0 çıktıları:

- [Mimari kararlar](i18n-v2-phase-0/adr.md)
- [Sayfa ve içerik envanteri](i18n-v2-phase-0/inventory.md)
- [TR/EN/custom regression fixture'ı](i18n-v2-phase-0/fixtures.json)
- [Baseline ve regression kapıları](i18n-v2-phase-0/baseline.md)

Çıkış kriteri:

- [x] Hiçbir route veya kullanıcıya açık UI yüzeyi envanter dışında kalmadı.
- [x] Her sonraki fazın ölçülebilir hard-coded-text baseline'ı var.

### Faz 1 — Locale resolver ve preference semantiğini düzelt

- [x] Public, invitation, freelancer ve portal resolver'larını ayır.
- [x] Public auth akışından cookie ve browser locale önceliğini kaldır.
- [x] Freelancer için preference -> instance default zincirini uygula.
- [x] Portal için preference -> client default -> instance default zincirini
  uygula.
- [x] Locale cookie'sini resolver ve dil değiştirme akışından kaldır.
- [x] Arşivlenmiş/eksik locale fallback davranışını tanımla.
- [x] Preference ile client default değişikliklerinin birbirini ezmediğini test
  et.
- [x] `<html lang>` ve `dir` değerinin doğru resolved locale'den geldiğini test
  et.

Çıkış kriteri:

- [x] Dört bağlamın resolver testleri bağımsız geçiyor.
- [x] Login sayfası eski locale cookie'sinden etkilenmiyor.

### Faz 2 — Settings route iskeleti ve kalıcı iç sidebar

- [x] `/settings` route'unu `/settings/general` sayfasına yönlendir.
- [x] Settings layout ve sticky iç sidebar oluştur.
- [x] Desktop ve mobil settings navigasyonunu uygula.
- [x] Aktif route, loading, not-found ve error sınırlarını ekle.
- [x] Owner-only menü öğelerini yetkiye göre sınırla.
- [x] Tek sayfalık client-state tab yapısını kaldırmaya hazır action sınırlarını
  ayır.
- [x] Settings shell'in TR/EN kataloglarını tamamla.

Çıkış kriteri:

- [x] Refresh ve deep-link her settings alt route'unda çalışıyor.
- [x] İç sidebar uzun sayfada sabit kalıyor.

### Faz 3 — Ayarlar / Genel sayfası

Route: `/settings/general`

- [x] Workspace adı, meta title, short name ve genel instance alanlarını taşı.
- [x] Portal welcome/footer için aktif dil tab'larını uygula.
- [x] Branding create/update action'ını route'a özel hale getir.
- [x] Form, validation ve toast metinlerini TR/EN tamamla.
- [x] Workspace metadata revalidation davranışını koru.
- [x] Owner authorization sınırını koru.

Çıkış kriteri:

- [x] Genel sayfasında hard-coded kullanıcı metni kalmadı.
- [x] Branding içeriklerinin tüm aktif dil değerleri kalıcı.

### Faz 4 — Ayarlar / Görünüm sayfası

Route: `/settings/appearance`

- [x] Light/dark/system kişisel tercihini taşı.
- [x] Primary color ve light/dark logo yönetimini doğru owner kapsamına taşı.
- [x] Kişisel görünüm ile instance branding kontrollerini görsel olarak ayır.
- [x] Preview, upload, reset ve validation metinlerini çevir.
- [x] Dark/light, responsive ve hydration-safe davranışı test et.

Çıkış kriteri:

- [x] Görünüm sayfası TR/EN eksiksiz ve tema geçişinde hydration hatasız.

### Faz 5 — Ayarlar / Profil sayfası

Route: `/settings/profile`

- [x] Ad, soyad ve avatar formunu taşı.
- [x] Account bilgisi, upload ve toast metinlerini çevir.
- [x] Kişisel profile action'ını owner-only instance action'lardan ayır.
- [x] Validation ve hata kodlarını locale-aware hale getir.

Çıkış kriteri:

- [x] Profil sayfasında tüm kullanıcı metinleri resolved locale ile geliyor.

### Faz 6 — Ayarlar / Güvenlik sayfası

Route: `/settings/security`

- [x] Şifre değiştirme formunu taşı.
- [x] Mevcut/yeni şifre validation ve hata mesajlarını çevir.
- [x] Session revoke davranışını açık ve erişilebilir biçimde göster.
- [x] Success/error toast'larını tek kaynak üzerinden üret.

Çıkış kriteri:

- [x] Güvenlik akışı TR/EN ve custom fallback locale ile çalışıyor.

### Faz 7 — Ayarlar / Yapay zekâ sayfası

Route: `/settings/ai`

- [x] Provider, model ve API key kontrollerini taşı.
- [x] Secret mask, mevcut key, değiştirme ve hata UX'ini düzenle.
- [x] AI provider ve bağlantı hata metinlerini çevir.
- [x] Owner-only authorization'ı doğrula.

Çıkış kriteri:

- [x] AI ayarlarında sabit Türkçe/İngilizce metin yok.

### Faz 8 — Ayarlar / Kişisel dil tercihi sayfası

Route: `/settings/language`

- [x] Yalnız aktif dilleri göster.
- [x] Kişisel tercih ile instance default bilgisini ayrı göster.
- [x] Preference mutation'ı uygula ve layout'u güvenli yenile.
- [x] Arşivlenmiş preference için fallback ve yeniden seçim uyarısı ekle.
- [x] Dil adlarını native name + locale code ile göster.

Çıkış kriteri:

- [x] Owner dili yalnız bu sayfadan değiştirilebiliyor.
- [x] Login/auth ekranlarında dil seçici bulunmuyor.

### Faz 9 — Ayarlar / Diller liste sayfası

Route: `/settings/languages`

- [x] Yeni dil yönetim listesi UX'ini uygula.
- [x] Default, status, fallback, completion ve usage sütunlarını ekle.
- [x] Instance default locale kontrolünü bu sayfaya taşı.
- [x] Draft/active/archived filtrelerini ekle.
- [x] Loading, empty, error ve permission state'lerini çevir.

Çıkış kriteri:

- [x] Dil listesi çeviri editörüyle aynı ekranda değil.
- [x] Default dil ve kişisel dil tercihi birbirine karışmıyor.

### Faz 10 — Ayarlar / Yeni dil sayfası

Route: `/settings/languages/new`

- [x] BCP 47 locale formunu uygula.
- [x] Native ad, yönetim adı, direction ve fallback alanlarını ekle.
- [x] Custom dilin daima draft oluşmasını sağla.
- [x] Duplicate, self-fallback ve fallback-loop hatalarını çevir.
- [x] Başarılı kayıtta dil detayına yönlendir.

Çıkış kriteri:

- [x] Geçersiz locale DB'ye ulaşmadan reddediliyor.

### Faz 11 — Ayarlar / Dil detay sayfası

Route: `/settings/languages/[locale]`

- [x] Metadata ve lifecycle yönetimini uygula.
- [x] Namespace/sayfa bazlı completion özetini ekle.
- [x] Kullanıcı/client kullanım etkisini göster.
- [x] Activate/default/archive readiness kontrollerini uygula.
- [x] Built-in korumalarını UI ve service katmanında test et.

Çıkış kriteri:

- [x] Eksik kritik çevirili draft dil aktif edilemiyor.

### Faz 12 — Ayarlar / Çeviri editörü

Route: `/settings/languages/[locale]/translations`

- [x] Sayfa/modül bazlı navigation ve filtreleri uygula.
- [x] TR/EN kaynak, fallback preview ve hedef input'ları ayrıştır.
- [x] Dirty state, toplu kaydetme ve çıkış uyarısı ekle.
- [x] Eksik/değişmiş/portal kritik filtrelerini uygula.
- [x] Interpolation ve maksimum uzunluk doğrulamasını göster.
- [x] Reset override aksiyonunu güvenli hale getir.
- [x] Büyük katalogda pagination/virtualization performansını ölç.

Çıkış kriteri:

- [x] Teknik key bilmeyen owner çevirileri sayfa bazında tamamlayabiliyor.

### Faz 13 — Ayarlar / Dil içe-dışa aktarma

Route: `/settings/languages/import-export`

- [x] Export kapsamı ve locale seçimini uygula.
- [x] Dosya upload, schema validation ve preview ekranı ekle.
- [x] Create/update/skip/conflict özetini göster.
- [x] Overwrite için açık confirmation iste.
- [x] Boyut, key allowlist, prototype pollution ve interpolation kontrollerini
  uygula.

Çıkış kriteri:

- [x] Import işlemi preview olmadan mutation yapmıyor.

### Faz 14 — Login sayfası

Route: `/login`

- [x] Locale select component'ini kaldır.
- [x] Sayfayı yalnız public instance locale ile render et.
- [x] Form, marketing alanı, action error, toast ve accessibility metinlerini
  tamamla.
- [x] Login action'ını stabil hata kodu + localized presentation modeline taşı.
- [x] Eski locale cookie ile regression testi ekle.

Çıkış kriteri:

- [x] Login ekranında hiçbir dil değiştirme kontrolü yok.
- [x] Login TR/EN katalog parity yüzde 100.

### Faz 15 — İlk admin kayıt sayfası

Route: `/register`

- [x] Locale select component'ini kaldır.
- [x] Sayfayı yalnız public instance locale ile render et.
- [x] İlk kurulum, kapalı kayıt, form ve action hata metinlerini tamamla.
- [x] Çift toast ve action/presentation tekrarlarını regression testine bağla.

Çıkış kriteri:

- [x] Register ekranında dil seçici ve hard-coded kullanıcı metni yok.

### Faz 16 — Şifremi unuttum sayfası

Route: `/forgot-password`

- [x] Sayfayı yalnız public instance locale ile render et.
- [x] Form, provider durumu, success/error ve geri dönüş metinlerini çevir.
- [x] Locale cookie'den etkilenmediğini test et.

Çıkış kriteri:

- [x] Forgot-password TR/EN ve instance default davranışı tamamlandı.

### Faz 17 — Şifre sıfırlama sayfası

Route: `/reset-password`

- [x] Locale select component'ini kaldır.
- [x] Sayfayı yalnız public instance locale ile render et.
- [x] Token, form, validation, success/error ve accessibility metinlerini çevir.
- [x] Geçersiz/expired token state'lerini test et.

Çıkış kriteri:

- [x] Reset-password ekranında dil seçici ve sabit dil metni yok.

### Faz 18 — Dashboard shell ve ortak navigasyon

- [x] Freelancer ve portal sidebar metinlerini tamamla.
- [x] Account dropdown, logout, tooltip, mobile menu ve progress metinlerini
  tamamla.
- [x] Default Türkçe fallback label objelerini kaldır veya yalnız güvenli
  developer fallback'e dönüştür.
- [x] Root layout'a tüm namespace'leri göndermeyi bırak.
- [x] Settings bağlantılarını yeni route'lara bağla.

Çıkış kriteri:

- [x] Shell'de hard-coded kullanıcı metni ve raw key yok.

### Faz 19 — Dashboard ana sayfası

Route: `/`

- [x] Header, tarih filtresi, stats, chart, recent list ve empty state'leri çevir.
- [x] Tarih, para, sayı, mood ve yüzde formatlarını locale-aware yap.
- [x] Loading/error bileşenlerini tamamla.
- [x] Dashboard client component hard-coded metin taramasını sıfırla.

Çıkış kriteri:

- [x] Dashboard TR ve EN'de görsel/metinsel olarak eksiksiz.

### Faz 20 — Analizler sayfası

Route: `/analytics`

- [x] Tüm kart, grafik, filtre, tooltip ve empty state metinlerini çevir.
- [x] Sayı, tarih ve para formatlarını locale-aware yap.
- [x] Loading state'i çevir.

Çıkış kriteri:

- [x] Analiz sayfasında sabit kullanıcı metni kalmadı.

### Faz 21 — Takvim sayfası ve etkinlik formu

Route: `/calendar`

- [x] Takvim header, gün/ay adları, filtreler, kartlar ve event actions'ı çevir.
- [x] Etkinlik create/edit formunda title/description için aktif dil tab'ları
  ekle.
- [x] Type label, validation, toast ve confirmation metinlerini çevir.
- [x] Calendar event translation CRUD ve backfill'i tamamla.

Çıkış kriteri:

- [x] Etkinlik metinleri tüm aktif dillerde ayrı saklanıyor.

### Faz 22 — Müşteriler liste sayfası ve müşteri formu

Route: `/clients`

- [x] Header, stats, filtre, kart/liste, empty state ve aksiyonları çevir.
- [x] Müşteri notes alanı için aktif dil tab'ları ekle.
- [x] Kimlik alanlarını tab dışında tekil bırak.
- [x] Tarih ve durum label'larını locale-aware yap.

Çıkış kriteri:

- [x] Müşteri listesi ve create/edit formu TR/EN eksiksiz.

### Faz 23 — Müşteri detay sayfası

Route: `/clients/[id]`

- [x] Detail header, stats, tabs, portal account dialog ve activity alanlarını
  çevir.
- [x] Client activity title/content alanlarına dil tab'ları ekle.
- [x] Portal başlangıç dilini yalnız aktif dillerden seçtir.
- [x] Admin portal default'u ile müşterinin kişisel tercihini açıklayan UX ekle.
- [x] Davet, resend, revoke ve locale update hata/toast'larını çevir.

Çıkış kriteri:

- [x] Portal hesabı açılırken admin tarafından başlangıç dili belirleniyor.

### Faz 24 — Projeler liste sayfası ve proje formu

Route: `/projects`

- [ ] Header, stats, filtre, grid/list, risk analizi ve empty state'leri çevir.
- [ ] Project name/description/coverImageAlt dil tab'larını eksiksiz uygula.
- [ ] Create/edit action ve validation mesajlarını çevir.
- [ ] Liste okumalarını locale-resolved ve batch hale getir.

Çıkış kriteri:

- [ ] Proje formu tüm aktif dilleri kayıpsız düzenliyor.

### Faz 25 — Proje detay sayfası

Route: `/projects/[id]`

- [ ] Header, stats, tabs, progress, revisions, files ve actions metinlerini
  çevir.
- [ ] Planning section title/content dil tab'larını tamamla.
- [ ] Detail içindeki task formunun aynı translation sözleşmesini kullandığını
  doğrula.
- [ ] Portal preview/fallback bilgisini görünür kıl.
- [ ] Loading/error state'lerini çevir.

Çıkış kriteri:

- [ ] Proje detayındaki bütün alt yüzeyler TR/EN tamamlandı.

### Faz 26 — Görevler sayfası ve görev formu

Route: `/tasks`

- [ ] Header, stats, kanban/list, filtre, priority/status ve actions'ı çevir.
- [ ] Task title/description aktif dil tab'larını tamamla.
- [ ] Create/edit/delete action error ve toast'larını çevir.
- [ ] Public-to-client görevlerde hedef locale eksikliği uyarısını ekle.

Çıkış kriteri:

- [ ] Kanban ve liste görünümlerinde sabit metin kalmadı.

### Faz 27 — Finans sayfası ve işlem formu

Route: `/finance`

- [ ] Header, stats slider, filtre, tablo/kart, AI modal ve empty state'i çevir.
- [ ] Finance category/description alanlarına aktif dil tab'ları ekle.
- [ ] Tutar, currency, vergi, ödeme durumu ve tarihleri locale-aware göster.
- [ ] Create/edit/delete ve AI action hata metinlerini çevir.
- [ ] Finance translation registry, backfill ve batch read ekle.

Çıkış kriteri:

- [ ] Finans formu eklenen tüm aktif diller için ayrı metin saklıyor.

### Faz 28 — Günlük sayfası ve günlük formu

Route: `/journal`

- [ ] Header, mood/energy alanları, list, empty state ve actions'ı çevir.
- [ ] Mood label ve note alanlarına aktif dil tab'ları ekle.
- [ ] Skorlar ve tarih alanlarını ortak tut.
- [ ] AI-derived içerikte source locale davranışını belirginleştir.

Çıkış kriteri:

- [ ] Günlük formundaki çevrilebilir alanlar locale bazlı kalıcı.

### Faz 29 — Sohbet sayfası

Route: `/chat`

- [ ] Sidebar, yeni sohbet, input, empty state, suggestions ve error metinlerini
  çevir.
- [ ] API hata kodlarını ayrıntılı ve locale-aware sunuma bağla.
- [ ] Kullanıcı/assistant mesajlarını çeviri tab'ına sokma; source locale
  metadata'sını koru.
- [ ] Session title düzenlenebiliyorsa locale modelini uygula.

Çıkış kriteri:

- [ ] Chat UI çevriliyor, mesajların orijinal dili bozulmuyor.

### Faz 30 — Teklifler sayfası ve formu

Route: `/business/proposals`

- [ ] Liste, form, status, empty state ve actions'ı çevir.
- [ ] Proposal title/description aktif dil tab'larını ekle.
- [ ] Tutar/currency/status alanlarını ortak tut.
- [ ] Translation CRUD ve backfill ekle.

Çıkış kriteri:

- [ ] Teklif içeriği tüm aktif dillerde düzenlenebiliyor.

### Faz 31 — Faturalar sayfası ve formu

Route: `/business/invoices`

- [ ] Liste, form, status, tarih, tutar ve actions'ı çevir.
- [ ] Mevcut şemada çevrilebilir serbest metin alanı olmadığını doğrula.
- [ ] İleride not/açıklama eklenirse registry sözleşmesini dokümante et.
- [ ] Tarih/para formatlarını locale-aware yap.

Çıkış kriteri:

- [ ] Fatura sayfasının bütün sistem metinleri TR/EN tamamlandı.

### Faz 32 — Abonelikler sayfası ve formu

Route: `/business/subscriptions`

- [ ] Liste, form, billing cycle, status ve actions'ı çevir.
- [ ] Subscription name/category alanlarına aktif dil tab'ları ekle.
- [ ] Tutar, currency ve tarih alanlarını ortak tut.
- [ ] Translation CRUD ve backfill ekle.

Çıkış kriteri:

- [ ] Abonelik metinleri locale bazlı saklanıyor.

### Faz 33 — Portal ayarlar layout'u

Route: `/portal/settings`

- [ ] Eksik portal settings route ve layout'unu oluştur.
- [ ] Portal için mobil/desktop settings nav ekle.
- [ ] Language, appearance, profile ve security alt route'larını tanımla.
- [ ] Client'ın owner-only ayarlara erişemediğini test et.
- [ ] Portal settings shell metinlerini tamamla.

Çıkış kriteri:

- [ ] Sidebar'daki portal settings bağlantısı geçerli bir sayfaya gidiyor.

### Faz 34 — Portal dil tercihi sayfası

Route: `/portal/settings/language`

- [ ] Admin tarafından atanmış başlangıç dilini bilgi olarak göster.
- [ ] Yalnız aktif instance dillerini seçim olarak sun.
- [ ] Client personal preference mutation'ını uygula.
- [ ] “Kişisel seçimi kaldır / admin varsayılanını kullan” davranışını tasarla.
- [ ] Arşivlenmiş dil fallback ve uyarısını uygula.

Çıkış kriteri:

- [ ] Portal kullanıcısı yalnız adminin aktif ettiği diller arasında geçiş
  yapabiliyor.

### Faz 35 — Portal görünüm sayfası

Route: `/portal/settings/appearance`

- [ ] Kişisel light/dark/system tema seçimini uygula.
- [ ] Tema preference action'ını portal actor için yetkilendir.
- [ ] Preview, seçenek, success/error ve accessibility metinlerini çevir.
- [ ] Instance branding kontrollerinin client'a açılmadığını test et.

Çıkış kriteri:

- [ ] Portal görünüm tercihi owner instance ayarlarından izole.

### Faz 36 — Portal profil sayfası

Route: `/portal/settings/profile`

- [ ] Client ad, soyad ve avatar formunu uygula.
- [ ] Profile action'ını yalnız oturumdaki portal kullanıcısına sınırla.
- [ ] Upload, validation, success/error ve accessibility metinlerini çevir.

Çıkış kriteri:

- [ ] Portal profil sayfası TR/EN ve custom fallback ile çalışıyor.

### Faz 37 — Portal güvenlik sayfası

Route: `/portal/settings/security`

- [ ] Client şifre değiştirme ve session kontrollerini uygula.
- [ ] Security action'larını portal actor için yetkilendir.
- [ ] Validation, success/error ve session revoke metinlerini çevir.

Çıkış kriteri:

- [ ] Portal güvenlik akışı owner ayarlarından izole ve locale-aware.

### Faz 38 — Portal davet sayfası

Route: `/invite/[token]`

- [ ] Dil seçici olmadan invitation snapshot locale'i kullan.
- [ ] Expired/accepted/revoked/success state'lerini eksiksiz çevir.
- [ ] Davet kabulünde client preference başlangıç değerini atomik yaz.
- [ ] Davet locale'i geçersiz/arşivlenmişse kontrollü fallback uygula.

Çıkış kriteri:

- [ ] Davet sayfası adminin belirlediği dilde açılıyor.

### Faz 39 — Portal dashboard

Route: `/portal`

- [ ] Header, stats, proje kartları ve empty state'i çevir.
- [ ] Branding welcome/footer içeriğini resolved locale ile göster.
- [ ] Tarih, sayı ve progress formatlarını locale-aware yap.
- [ ] Project translation batch read'i doğrula.

Çıkış kriteri:

- [ ] Portal dashboard client preference değişince tamamen dil değiştiriyor.

### Faz 40 — Portal projeler listesi

Route: `/portal/projects`

- [ ] Header, filtre/kart, status ve empty state metinlerini çevir.
- [ ] Project name/description/alt değerlerini resolved locale ile göster.
- [ ] Fallback zinciri ve batch query performansını test et.

Çıkış kriteri:

- [ ] Client yalnız resolved proje içeriğini alıyor.

### Faz 41 — Portal proje detay sayfası

Route: `/portal/projects/[id]`

- [ ] Overview, plan, tasks, revisions, progress ve dialog metinlerini çevir.
- [ ] Project, planning section ve public task içeriklerini resolved locale ile
  göster.
- [ ] Revision mesajını source locale ile sakla.
- [ ] Error, permission ve empty state'leri tamamla.

Çıkış kriteri:

- [ ] Proje detayının bütün alt tab'ları seçili portal dilinde.

### Faz 42 — Portal görevler sayfası

Route: `/portal/tasks`

- [ ] Header, kart/list, status, tarih ve empty state'i çevir.
- [ ] Task title/description değerlerini resolved locale ile göster.
- [ ] Client scope ve fallback davranışını test et.

Çıkış kriteri:

- [ ] Portal görevlerinde raw default-locale metni sızmıyor.

### Faz 43 — Portal revizyonlar sayfası

Route: `/portal/revisions`

- [ ] Header, status, kartlar, tarih ve empty state'i çevir.
- [ ] Kullanıcının yazdığı revision description'ı orijinal dilde göster.
- [ ] Source locale bilgisini sakla ve API contract'a ekle.

Çıkış kriteri:

- [ ] Sistem metni çevriliyor, kullanıcı mesajı değiştirilmeden kalıyor.

### Faz 44 — Ortak feedback, status ve edge sayfaları

- [ ] `not-found`, root error, route loading ve maintenance ekranlarını denetle.
- [ ] FeedbackState, StatusBadge, confirmation, toaster ve ortak form
  component'lerini çevir.
- [ ] Bütün enum label'larını merkezi status kataloglarına taşı.
- [ ] Default hard-coded Türkçe label'ları kaldır.
- [ ] Accessibility ve metadata metinlerini tamamla.

Çıkış kriteri:

- [ ] Ortak component'ten hiçbir sayfaya sabit dil metni sızmıyor.

### Faz 45 — API ve mobil localization sözleşmesi

- [ ] Meta ve me response'larında default, preference, client default ve resolved
  locale alanlarını ayrıştır.
- [ ] Freelancer/client preference mutation endpoint'lerini tamamla.
- [ ] Owner language management endpoint'lerini belge ve test et.
- [ ] Domain translations mutation/read sözleşmesini bütün entity'lere uygula.
- [ ] Custom locale katalog indirme/version endpoint'ini tamamla.
- [ ] `Accept-Language` ve açık locale isteğinin güvenli sınırlarını test et.
- [ ] OpenAPI/contract fixture'larını TR, EN ve custom locale için güncelle.

Çıkış kriteri:

- [ ] Web dışındaki bir istemci cookie kullanmadan aynı locale davranışını
  uygulayabiliyor.

### Faz 46 — Veri migrasyonu ve backfill

- [ ] Yeni entity type/field registry için Drizzle migration üret.
- [ ] Mevcut verileri instance default locale'e idempotent backfill et.
- [ ] Preference/client/invitation locale tutarsızlıklarını raporlayan script
  ekle.
- [ ] Orphan translation cleanup ve integrity kontrolü ekle.
- [ ] Backup, dry-run, rollback ve restore prosedürlerini dokümante et.
- [ ] Büyük fixture üzerinde migration süresini ölç.

Çıkış kriteri:

- [ ] Mevcut self-host verisi kayıpsız şekilde yeni modele taşınıyor.

### Faz 47 — Release hardening ve son kabul

- [ ] Her route'u TR ve EN ile browser smoke testinden geçir.
- [ ] Custom draft/active/archived locale senaryolarını test et.
- [ ] Login ekranında dil seçici olmadığını regression testine bağla.
- [ ] Owner ve portal preference ayrımını uçtan uca test et.
- [ ] Tüm create/edit formlarında aktif dil tab'larını kontrol et.
- [ ] Hard-coded user-facing text taramasını release gate yap.
- [ ] Katalog parity, boş değer ve interpolation testlerini release gate yap.
- [ ] RTL layout smoke, accessibility ve keyboard navigation testlerini çalıştır.
- [ ] Translation liste okumalarında N+1 ve payload boyutunu ölç.
- [ ] Typecheck, lint, unit, integration, browser ve production build'i çalıştır.
- [ ] Self-host upgrade ve yeni kurulum dokümantasyonunu güncelle.

Çıkış kriteri:

- [ ] Türkçe ve İngilizce bütün sayfalarda eksiksiz.
- [ ] Custom dil kod değişikliği olmadan eklenip aktif edilebiliyor.
- [ ] Owner ve portal kullanıcısı dili yalnız kendi ayar ekranından
  değiştirebiliyor.
- [ ] Her çevrilebilir domain formu aktif dil sayısı kadar tab gösteriyor.
- [ ] Portal başlangıç dili admin tarafından belirleniyor ve client tarafından
  izinli diller içinde değiştirilebiliyor.
- [ ] Release pipeline tüm i18n kalite kapılarında yeşil.

## 11. Global kabul matrisi

Her sayfa fazında aşağıdaki matris doldurulmadan checkbox'lar tamamlanmış
sayılmaz:

| Kontrol | TR | EN | Custom/fallback |
| --- | --- | --- | --- |
| Page ve metadata | Bekliyor | Bekliyor | Bekliyor |
| Form ve validation | Bekliyor | Bekliyor | Bekliyor |
| Dialog/toast/error | Bekliyor | Bekliyor | Bekliyor |
| Empty/loading state | Bekliyor | Bekliyor | Bekliyor |
| Tarih/sayı/para | Bekliyor | Bekliyor | Bekliyor |
| Keyboard/a11y | Bekliyor | Bekliyor | Bekliyor |
| Hard-coded text taraması | Bekliyor | Bekliyor | Bekliyor |

## 12. Plan dışı konular

Bu plan aşağıdakileri otomatik olarak kapsamaz:

- Makine çevirisi sağlayıcısı
- Chat/revision mesajlarını otomatik çevirme
- Locale içeren URL yapısı (`/tr/...`)
- Profesyonel çevirmen workflow'u ve review rolleri
- Kullanıcı başına timezone/currency yeniden tasarımı
- Built-in legacy metin kolonlarını tamamen kaldırma

Bunlar V2 tamamlandıktan sonra ayrı ürün kararları olarak planlanabilir.
