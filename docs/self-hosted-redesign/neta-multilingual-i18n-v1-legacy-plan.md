---
title: Neta Çok Dilli Sistem ve Yerelleştirme Ana Planı
description: Self-host edilen Neta instance'larında yönetilebilir arayüz dilleri, çok dilli içerik formları, müşteri portalı dili ve mobil API uyumu için faz bazlı uygulama planı.
status: completed
current_phase: "completed"
last_updated: 2026-07-19
---

# Neta Çok Dilli Sistem ve Yerelleştirme Ana Planı

## 1. Belgenin amacı

Bu plan, Neta'yı yalnızca Türkçe metinler gösteren bir uygulamadan, self-host eden
kişinin yönetebildiği çok dilli bir platforma dönüştürür.

Hedef sistemde:

- Türkçe (`tr`) ve İngilizce (`en`) ilk kurulumda hazır ve aktif gelir.
- Instance sahibi Ayarlar sayfasından yeni bir dil ekleyebilir.
- Eklenen dil için sidebar, sayfa başlıkları, butonlar, durumlar, formlar,
  doğrulama mesajları, auth ekranları ve müşteri portalı metinleri çevrilebilir.
- Çevrilebilir iş içerikleri, aynı form içinde dil sekmeleriyle girilebilir.
- Müşteri portal daveti oluşturulurken müşterinin dili seçilir.
- Davet ekranı dahil olmak üzere müşteri portalı seçilen dilde açılır.
- Tarih, saat, sayı ve para gösterimleri seçili locale'e göre biçimlendirilir.
- Web ile aynı dil ve içerik modeli gelecekteki React Native istemcisi tarafından
  API üzerinden kullanılabilir.
- Yeni bir dil eklemek yeni bir deployment veya kod değişikliği gerektirmez.

Bu belge implementasyon sırasını, veri modelini, fallback davranışını, UI
sözleşmelerini, migrasyon stratejisini, güvenlik sınırlarını ve test kapılarını
tanımlar.

## 2. Mevcut sistem inceleme özeti

Codebase incelemesinde çok dillilik açısından aşağıdaki mevcut durum tespit edildi:

- `user_preferences.language` alanı bulunuyor ve varsayılanı `tr`.
- Aynı alanda SQLite check constraint yalnızca `tr` ve `en` değerlerine izin
  veriyor.
- Preference service şu anda yalnızca `colorMode` döndürüyor; dil tercihini
  runtime'a taşımıyor.
- Root layout içindeki `<html lang="tr">` sabit.
- Sidebar konfigürasyonları Türkçe başlıkları doğrudan taşıyor.
- Dashboard, ayarlar, auth ve portal ekranlarında kullanıcıya gösterilen metinler
  bileşenlerin içine gömülü.
- Tarih ve para gösterimlerinde `tr-TR` ve `date-fns/locale/tr` doğrudan
  kullanılıyor.
- Müşteri daveti oluşturulurken locale seçilmiyor veya davete kaydedilmiyor.
- `clients`, `app_profiles` ve `portal_invitations` üzerinde portal dili alanı yok.
- Proje, görev ve planlama alanlarının başlık/açıklamaları tek sütunda tutuluyor.
- Mobil discovery ve `/api/v1/meta` sözleşmesinde desteklenen diller ilan
  edilmiyor.
- Arayüz metni içerme ihtimali bulunan yaklaşık 141 TypeScript/TSX dosyası var.

Bu nedenle yalnızca bir çeviri kütüphanesi eklemek yeterli değildir. Arayüz
yerelleştirmesi, kullanıcı içeriği çevirileri, portal locale çözümleme ve API
sözleşmesi birlikte ele alınmalıdır.

## 3. Temel kavramlar

Bu projede iki farklı veri türü birbirinden kesin olarak ayrılacaktır.

### 3.1. Arayüz çevirisi

Uygulamanın kendisine ait metinlerdir:

- Sidebar grup ve menü adları
- Sayfa başlıkları
- Buton, tab ve dialog metinleri
- Form label ve placeholder'ları
- Boş durum ve onay mesajları
- Toast ve kullanıcıya gösterilen hata metinleri
- Durum, öncelik ve kategori label'ları
- Login, kayıt ve davet ekranları
- Müşteri portalındaki sistem metinleri

Bu metinler stabil anahtarlarla çağrılır:

```ts
t("navigation.projects")
t("projects.form.name.label")
t("status.project.completed")
```

Türkçe ve İngilizce kaynak katalogları kod içinde sürümlenir. Instance sahibinin
yaptığı değişiklikler ve sonradan eklenen diller SQLite içinde saklanır.

### 3.2. İçerik çevirisi

Freelancer'ın oluşturduğu ve müşteriye gösterilebilecek iş verileridir:

- Proje adı ve açıklaması
- Proje kapak görseli alt metni
- Proje planlama bölümü başlığı ve içeriği
- Müşteriye açık görev başlığı ve açıklaması
- Portal karşılama ve footer metinleri
- İleride teklif, sözleşme ve benzeri portal içerikleri

Bu içerikler formdaki locale tab'larıyla girilir ve `content_translations`
tablosunda saklanır.

### 3.3. Çevrilmeyecek alanlar

Her form alanını dil başına çoğaltmak doğru değildir. Aşağıdaki alanlar ortak
kalır:

- Tarih ve saat
- Tutar, para birimi ve vergi
- Durum, öncelik ve kategori enum değerleri
- Müşteri/proje ilişkileri
- İlerleme yüzdesi
- E-posta, telefon ve URL
- Dosya ve görselin kendisi
- Teknik ID'ler

Bu alanların değerleri ortak tutulur; kullanıcıya gösterilen label'ları arayüz
sözlüğünden çevrilir.

### 3.4. Yazıldığı dilde kalacak içerikler

İletişim niteliğindeki kayıtlar otomatik olarak çoğaltılmayacaktır:

- Müşterinin yazdığı revizyon talebi
- Chat mesajları
- Freelancer'ın özel günlüğü
- Müşteri aktivite notları

Bu içeriklerde gerekirse `sourceLocale` metadata'sı saklanabilir; metnin kendisi
yazıldığı dilde gösterilir. Otomatik çeviri ayrı ve opsiyonel bir ürün özelliğidir.

## 4. Kilitlenecek ürün kararları

Faz 0 tamamlanırken aşağıdaki kararlar ADR ile kesinleştirilecektir. Bu planın
önerilen varsayımları şöyledir:

- [x] Türkçe ve İngilizce silinemez built-in diller olacak.
- [x] İlk migration sonrasında instance varsayılan dili Türkçe olacak.
- [x] Yeni eklenen dil önce `draft`, ardından `active` durumuna alınacak.
- [x] Eksik çeviri halinde sayfada çeviri anahtarı değil fallback metni gösterilecek.
- [x] Yeni locale için instance sahibi `tr` veya `en` fallback dili seçecek.
- [x] Portal için kritik çevirileri tamamlanmayan dil müşteri dili olarak
  yayınlanamayacak.
- [x] Dashboard ve portal route'larına `/tr`, `/en` gibi URL prefix'i eklenmeyecek.
- [x] Locale; kullanıcı tercihi, davet kaydı ve güvenli cookie üzerinden
  çözümlenecek.
- [x] Arayüz çeviri sistemi için ağır bir runtime bağımlılığı eklenmeyecek; mevcut
  `Intl`, React ve SQLite temelli küçük bir Neta i18n katmanı yazılacak.
- [x] İlk sürümde makine çevirisi zorunlu olmayacak.
- [x] Çeviri paketi JSON olarak içe ve dışa aktarılabilecek.
- [x] İçerik formlarında yalnızca çevrilebilir metin alanları locale tab'ları
  içinde olacak.
- [x] Instance varsayılan dilindeki zorunlu alanlar boş bırakılamayacak.
- [x] Built-in Türkçe ve İngilizce katalogları release sırasında yüzde 100
  tamamlanmış olmak zorunda olacak.

## 5. Hedef mimari

```text
Kod ile gelen anahtar kataloğu
  ├── tr katalog
  └── en katalog
            |
            v
SQLite locale kayıtları + instance çeviri override'ları
            |
            v
Locale resolver
  ├── Auth öncesi: davet / cookie / instance default
  ├── Freelancer: user preference / instance default
  └── Client: user preference / client portal locale / instance default
            |
            v
Translator
  ├── Server Components
  ├── Server Actions / hata kodları
  ├── Client Components provider
  └── API locale context
            |
            +--------------------------+
            |                          |
            v                          v
Arayüz sözlüğü                 İçerik translation resolver
sidebar, label, hata           project/task/planning/branding
```

### 5.1. Önerilen klasör yapısı

```text
lib/i18n/
  types.ts
  keys.ts
  catalog.ts
  format.ts

locales/
  tr/
    common.ts
    auth.ts
    navigation.ts
    dashboard.ts
    clients.ts
    projects.ts
    tasks.ts
    calendar.ts
    finance.ts
    journal.ts
    chat.ts
    settings.ts
    portal.ts
    validation.ts
  en/
    ...

server/i18n/
  locale.ts
  resolver.ts
  translator.ts
  catalog.ts
  service.ts
  content.ts
  validation.ts

server/repositories/
  i18n.ts
  content-translations.ts

components/i18n/
  i18n-provider.tsx
  locale-tabs.tsx
  localized-fields.tsx
  translation-status.tsx
```

### 5.2. Namespace standardı

Katalog tek ve devasa bir JSON dosyası olmayacaktır. Anahtarlar modül bazında
namespace'lere ayrılır:

| Namespace | Kapsam |
| --- | --- |
| `common` | Kaydet, sil, düzenle, iptal, loading, boş durumlar |
| `auth` | Login, register, davet, şifre ve auth hataları |
| `navigation` | Freelancer ve portal sidebar |
| `dashboard` | Freelancer dashboard |
| `clients` | Müşteri liste/detay/form |
| `projects` | Proje liste/detay/form/planlama |
| `tasks` | Görev liste/kanban/form |
| `calendar` | Takvim ve etkinlik |
| `finance` | Finans, analiz ve işlem formu |
| `journal` | Günlük ekranı |
| `chat` | AI sohbet ekranı |
| `settings` | Ayarlar ve dil yönetimi |
| `portal` | Müşteri portalı |
| `status` | Domain status/priority/type label'ları |
| `validation` | Form, action ve kullanıcıya açık hata metinleri |

Her anahtar anlamlı ve stabil olmalıdır. Türkçe cümle anahtar olarak
kullanılmamalıdır.

## 6. Locale çözümleme sözleşmesi

### 6.1. Locale formatı

- Locale kodları BCP 47 formatında kabul edilir: `tr`, `en`, `fr`, `de`,
  `pt-BR`, `zh-CN`.
- Girdi `Intl.getCanonicalLocales()` ile normalize edilir.
- Aynı locale farklı harf biçimleriyle ikinci kez eklenemez.
- Locale kaydında gösterim adı, native ad ve yön (`ltr`/`rtl`) tutulur.
- Maksimum locale kodu ve metin uzunlukları merkezi Zod schema ile doğrulanır.

### 6.2. Freelancer locale önceliği

1. Giriş yapan kullanıcının `user_preferences.language` değeri
2. Güvenli ve aktif bir `neta_locale` cookie değeri
3. Instance varsayılan locale'i
4. Son güvenlik fallback'i olarak `tr`

### 6.3. Müşteri portalı locale önceliği

1. Müşteri hesabının `user_preferences.language` değeri
2. İlgili `clients.portal_locale` değeri
3. Instance varsayılan locale'i
4. Son güvenlik fallback'i olarak `tr`

### 6.4. Davet ve auth öncesi locale önceliği

1. Portal davetinin `locale` snapshot'ı
2. Aktif `neta_locale` cookie değeri
3. Instance varsayılan locale'i
4. Son güvenlik fallback'i olarak `tr`

`Accept-Language` yalnızca public login ekranında, header'daki locale instance
üzerinde aktifse düşük öncelikli ilk ziyaret ipucu olarak kullanılabilir. Müşteri
davetinin seçilmiş dilini değiştiremez.

### 6.5. Çeviri fallback zinciri

Örnek seçili locale `fr-CA` ise:

```text
fr-CA override
  -> fr override
  -> locale kaydında seçilen fallback (en veya tr)
  -> built-in en
  -> kontrollü missing-translation metni
```

Production ekranında `projects.form.name.label` gibi ham anahtarlar
gösterilmeyecektir. Development ve test ortamında missing key loglanacaktır.

### 6.6. HTML ve formatlama

- Root layout içindeki `lang` aktif locale'e göre üretilecek.
- Root layout içindeki `dir`, locale kaydındaki `ltr` veya `rtl` değerinden
  üretilecek.
- Tarih/saat `Intl.DateTimeFormat(locale, options)` ile biçimlendirilecek.
- Para ve sayı `Intl.NumberFormat(locale, options)` ile biçimlendirilecek.
- `date-fns` gereken yerlerde locale mapping merkezi helper üzerinden seçilecek.
- Timezone tercihi locale'den bağımsız kalacak.
- Para birimi tercihi locale'den bağımsız kalacak.

## 7. Hedef veri modeli

Tablo ve kolon adları implementasyon sırasında Drizzle naming standardına göre
kesinleştirilir.

### 7.1. `instance_locales`

Instance üzerinde yönetilebilen dil listesidir.

| Alan | Amaç |
| --- | --- |
| `code` | Canonical BCP 47 locale, primary key |
| `display_name` | Ayarlar ekranındaki yönetim adı |
| `native_name` | Dilin kendi dilindeki adı |
| `direction` | `ltr` veya `rtl` |
| `fallback_locale` | Eksik anahtarların düşeceği aktif locale |
| `status` | `draft`, `active`, `archived` |
| `is_builtin` | Türkçe ve İngilizce koruması |
| `sort_order` | Form tab sırası |
| `created_at` | Oluşturulma zamanı |
| `updated_at` | Güncellenme zamanı |

Kurallar:

- `tr` ve `en` migration ile eklenir.
- Built-in locale silinemez veya arşivlenemez.
- Varsayılan veya müşteri tarafından kullanılan locale doğrudan silinemez.
- Locale silmek yerine arşivleme tercih edilir.
- `fallback_locale`, kaydın kendisi olamaz ve döngü oluşturamaz.

### 7.2. `instance_i18n_settings`

Tek instance'a ait global dil ayarlarıdır.

| Alan | Amaç |
| --- | --- |
| `id` | Sabit `default` kaydı |
| `owner_user_id` | Instance sahibi |
| `default_locale` | Yeni kullanıcılar ve genel fallback |
| `catalog_version` | Cache invalidation için artan sürüm |
| `updated_by_user_id` | Son değiştiren owner |
| `updated_at` | Son değişiklik |

İlk migration `default_locale=tr` olarak seed eder.

### 7.3. `instance_ui_translations`

Built-in katalog override'larını ve sonradan eklenen locale metinlerini saklar.

| Alan | Amaç |
| --- | --- |
| `id` | Teknik kimlik |
| `locale` | `instance_locales.code` ilişkisi |
| `namespace` | Katalog namespace'i |
| `translation_key` | Stabil anahtar |
| `value` | Çevrilmiş düz metin |
| `updated_by_user_id` | Değişikliği yapan owner |
| `created_at` | Oluşturulma zamanı |
| `updated_at` | Güncellenme zamanı |

Unique constraint:

```text
(locale, namespace, translation_key)
```

Built-in Türkçe ve İngilizce metinler kodda kalır. Bu tablo yalnızca değiştirilen
değerleri ve custom locale değerlerini taşır; böylece her katalog sürümünde
binlerce seed satırı oluşturulmaz.

### 7.4. `content_translations`

Portalda gösterilebilen domain içeriklerini normalize biçimde saklar.

| Alan | Amaç |
| --- | --- |
| `id` | Teknik kimlik |
| `owner_user_id` | Authorization scope |
| `entity_type` | `project`, `task`, `planning_section`, `branding` vb. |
| `entity_id` | İlgili domain kaydı |
| `field` | `name`, `title`, `description`, `content`, `cover_image_alt` vb. |
| `locale` | İçeriğin locale'i |
| `value` | Çevrilmiş metin |
| `created_at` | Oluşturulma zamanı |
| `updated_at` | Güncellenme zamanı |

Unique constraint:

```text
(owner_user_id, entity_type, entity_id, field, locale)
```

Polymorphic `entity_id` nedeniyle DB seviyesinde her domain tablosuna foreign key
kurulamaz. Bütün erişim merkezi `ContentTranslationService` üzerinden yapılır:

- Geçerli entity ve çevrilebilir alan registry üzerinden doğrulanır.
- Owner scope zorunludur.
- Domain kaydı silinirken çeviri kayıtları aynı transaction içinde silinir.
- Portal actor yalnızca kendisine açık kaynakların resolved metnini okuyabilir.
- Portal actor ham çeviri setini veya başka locale içeriklerini değiştiremez.

### 7.5. Mevcut tablo değişiklikleri

- `user_preferences.language` üzerindeki sabit `in ('tr', 'en')` constraint'i
  kaldırılır.
- Bu alan yalnızca instance üzerinde aktif locale değerlerini service katmanında
  kabul eder.
- `clients.portal_locale` alanı eklenir.
- `portal_invitations.locale` alanı eklenir.
- Davet kabul transaction'ında client locale ve yeni kullanıcının preference
  locale'i birlikte yazılır.
- Gerekirse mevcut `owner_user_id` adlı preference kolonu şema kırmadan korunur;
  kod tarafında bunun tüm auth kullanıcıları için preference sahibi anlamına
  geldiği belgelenir.

### 7.6. Eski içerik kolonları

`projects.name`, `projects.description`, `tasks.title` gibi mevcut kolonlar ilk
sürümde kaldırılmayacaktır.

- Migration mevcut değerleri Türkçe translation kayıtlarına backfill eder.
- Yeni create/update akışı varsayılan locale değerini hem eski kolona hem
  `content_translations` tablosuna transaction içinde yazar.
- Eski kolonlar geriye uyumluluk ve güvenli rollback projection'ı olur.
- Portal ve yeni API okuma akışları locale-aware resolver kullanır.
- Bu kolonların tamamen kaldırılması ayrı bir major veri modeli kararıdır.

## 8. Çevrilebilir domain alanları

### 8.1. İlk zorunlu kapsam

| Entity | Çevrilebilir alanlar | Portal etkisi |
| --- | --- | --- |
| `project` | `name`, `description`, `coverImageAlt` | Proje liste ve detay |
| `projectPlanningSection` | `title`, `content` | Proje planlama içeriği |
| `task` | `title`, `description` | Yalnız müşteriye açık görevler |
| `branding` | `portalWelcomeText`, `portalFooterText` | Portal shell/dashboard |

### 8.2. İkinci kapsam

| Entity | Çevrilebilir alanlar | Not |
| --- | --- | --- |
| `proposal` | `title`, `description` | Portalda yayınlandığında zorunlu |
| `contract` | `title`, `content` | Portalda yayınlandığında zorunlu |
| `invoice` | Açıklama/not alanı eklenirse | Mevcut şemada metin alanı yok |
| `calendarEvent` | `title`, `description` | Portal görünürlüğü eklenirse |

### 8.3. Çevrilmeyecek domain alanları

- Client adı ve firma adı kimlik verisidir; locale tab'ına girmez.
- Finans açıklaması owner-only olduğu sürece tek dilde kalır.
- Günlük notları ve AI chat içerikleri tek dilde kalır.
- Müşteri aktivite başlığı/içeriği owner-only olduğu sürece tek dilde kalır.
- Revizyon talebi müşterinin yazdığı dilde saklanır.

Bu kapsam ileride portal görünürlüğü değiştiğinde registry üzerinden
genişletilebilir.

## 9. Çok dilli form UX sözleşmesi

Formlar Poyraz UI `Tabs` bileşeniyle ortak bir `LocalizedFields` bileşimi
kullanacaktır.

Örnek proje formu:

```text
[ Türkçe ✓ ] [ English ! ] [ Français ✓ ]

Proje adı
[ Marka web sitesi                         ]

Açıklama
[ ...                                     ]

------------------------------------------------
Tür, müşteri, durum, tarih, bütçe, para birimi
```

Kurallar:

- Aktif diller instance `sort_order` değerine göre tab olarak gösterilir.
- Varsayılan dil ilk tab olur ve “Varsayılan” işareti taşır.
- Eksik zorunlu alan bulunan tab uyarı noktası taşır.
- Dolu tab görsel tamamlanma işareti taşır.
- Tab değiştirmek form state'ini kaybettirmez.
- Input ID'leri locale ile ayrıştırılır.
- Form field adları merkezi parser'ın okuyacağı stabil yapıda olur:
  `translations.tr.name`, `translations.en.name` gibi.
- Zorunlu alan doğrulaması varsayılan locale için yapılır.
- Müşteriye açık içerik kaydedilirken hedef portal locale'de eksik alan varsa
  kullanıcıya fallback uygulanacağı açıkça gösterilir.
- Dil ekleme veya arşivleme açık bir formu bozmaz; form açılırken locale snapshot'ı
  alınır.
- Mobil ve dar ekranlarda tab listesi yatay kayabilir; formun tamamı yatay scroll
  oluşturmaz.
- Screen reader için tab, panel, label ve validation ilişkileri korunur.

## 10. Dil yönetimi UX sözleşmesi

Ayarlar sayfasına `Diller ve çeviriler` bölümü eklenir.

### 10.1. Dil listesi

Her dil satırında:

- Native ad ve locale kodu
- Built-in/custom bilgisi
- Draft/active/archived durumu
- Genel çeviri tamamlanma yüzdesi
- Portal kritik çeviri tamamlanma yüzdesi
- Varsayılan dil işareti
- Düzenle, dışa aktar, aktif et/arşivle aksiyonları

### 10.2. Dil ekleme

Dil ekleme dialog'unda:

- Locale kodu
- Görünen ad
- Native ad
- Yazı yönü
- Fallback dili

yer alır. Yeni dil `draft` oluşturulur ve henüz müşterilere atanamaz.

### 10.3. Çeviri editörü

- Namespace filtresi
- Anahtar veya kaynak metin arama
- Yalnız eksik çevirileri gösterme
- Türkçe ve İngilizce referans metinlerini yan yana görme
- Hedef locale input'u
- Tek alan kaydetme ve toplu kaydetme
- Fallback'ten gelen değer ile gerçek override ayrımını görme
- Değeri sıfırlayarak built-in/fallback metnine dönme
- Portal için kritik anahtar filtresi

### 10.4. JSON içe/dışa aktarma

Önerilen format:

```json
{
  "schemaVersion": 1,
  "locale": "fr",
  "fallbackLocale": "en",
  "catalogVersion": 1,
  "translations": {
    "common.save": "Enregistrer",
    "navigation.projects": "Projets"
  }
}
```

İçe aktarma:

- Owner yetkisi gerektirir.
- Dosya boyutu ve entry sayısı sınırlandırılır.
- Bilinmeyen key'ler raporlanır ve varsayılan olarak yazılmaz.
- Geçersiz veya tehlikeli anahtarlar reddedilir.
- Mevcut değerlerin üzerine yazma için açık onay gerekir.
- Import özeti ekleme/değiştirme/atlama sayılarıyla gösterilir.

## 11. Portal dili ve davet akışı

Yeni davet akışı:

1. Freelancer müşteri detayında “Portal hesabı aç” dialog'unu açar.
2. E-posta ile birlikte `Portal dili` seçer.
3. Dropdown yalnızca aktif ve portal kritik çevirileri hazır dilleri gösterir.
4. Seçim `portal_invitations.locale` alanına snapshot olarak yazılır.
5. Aynı seçim `clients.portal_locale` alanına kaydedilir.
6. Müşteri davet linkini açtığında hesap oluşturma ekranı bu dilde görünür.
7. Davet kabul transaction'ı Better Auth user, profile, client bağlantısı ve
   `user_preferences.language` kaydını atomik oluşturur.
8. Müşteri login olduğunda portal aynı locale ile açılır.
9. Freelancer daha sonra müşteri detayından portal dilini değiştirebilir.
10. Dil arşivlenecekse bu dili kullanan müşteriler için yeni locale seçilmeden
    işlem tamamlanmaz.

Davet yenilendiğinde yeni davet seçilen son locale'i taşır. Eski davet revoke
edilirken locale audit metadata'sına eklenir.

## 12. API ve mobil istemci sözleşmesi

Çok dillilik yalnızca web UI davranışı olmayacaktır.

### 12.1. Discovery ve metadata

`/api/v1/meta` additive olarak aşağıdaki bilgileri döndürür:

```json
{
  "localization": {
    "defaultLocale": "tr",
    "supportedLocales": [
      {
        "code": "tr",
        "nativeName": "Türkçe",
        "direction": "ltr"
      },
      {
        "code": "en",
        "nativeName": "English",
        "direction": "ltr"
      }
    ]
  }
}
```

Capability listesine aşağıdaki kayıt eklenir:

```json
{
  "id": "instance.localization",
  "version": 1,
  "status": "available",
  "access": "public"
}
```

### 12.2. Kullanıcı bilgisi

`GET /api/v1/me`:

- Çözülmüş `preferences.language` değerini döndürür.
- Client rolünde `portalLocale` bilgisini döndürür.
- Locale'in arşivlenmesi gibi edge case'lerde çözülmüş fallback locale'i döndürür.

### 12.3. Gelecek resource endpoint'leri

- `Accept-Language` destekler.
- Gerekirse açık `?locale=fr` parametresi destekler.
- Client actor yalnızca kendi atanmış/izin verilen locale görünümünü alır.
- Freelancer actor isterse `includeTranslations=true` ile bütün edit setini alır.
- Varsayılan resource response resolved metni döndürür.
- Mutation sözleşmesi `translations: { locale: { field: value } }` yapısını
  kullanır.
- Bilinmeyen locale için stabil `UNSUPPORTED_LOCALE` hata kodu döner.
- API'nin `error.code` alanı stabil kalır; `error.message` seçili locale'de
  üretilebilir.

### 12.4. Cache sözleşmesi

- Public meta cache'i dil listesi değişince revalidate edilir.
- Locale bağımlı public yanıtlar `Vary: Accept-Language` taşır.
- Authenticated resource yanıtları `private, no-store` kalır.
- Mobil istemci katalog sürümünü saklayabilir; değiştiğinde ilgili locale
  sözlüğünü yeniler.

## 13. Güvenlik ve veri bütünlüğü

- Locale ve çeviri yönetimi yalnızca freelancer/owner rolüne açıktır.
- UI translation değerleri varsayılan olarak düz metin render edilir.
- Çeviri editörü key üzerinden key dışı kod veya HTML çalıştırmaz.
- Rich text gerekirse ayrı sanitize edilmiş alan tipi olarak tasarlanır.
- Interpolation yalnızca tanımlı değişkenlere izin verir.
- Kullanıcı tarafından girilen `{{...}}` token'ları katalog şemasına göre
  doğrulanır.
- Her çeviri değeri için maksimum uzunluk tanımlanır.
- JSON import için byte ve entry limiti uygulanır.
- `__proto__`, `constructor`, path traversal benzeri key'ler reddedilir.
- Fallback döngüleri service katmanında engellenir.
- Aktif kullanımda olan locale hard delete edilemez.
- İçerik çevirileri her read/write işleminde owner ve actor scope'u ile
  sınırlandırılır.
- Client başka müşteriye ait translation kayıtlarını enumerate edemez.
- Davet locale'i sadece aynı owner'ın aktif locale listesinden seçilebilir.
- Locale değişiklikleri auth audit veya ayrı settings audit kaydına yazılır.

## 14. Performans ve cache yaklaşımı

- Built-in `tr/en` katalogları statik import ile gelir.
- DB yalnızca override ve custom locale değerlerini taşır.
- Server translator, request başına resolved dictionary oluşturur.
- Client layout'a yalnız ihtiyaç duyduğu namespace'leri alır.
- Tüm katalog her sayfada browser'a gönderilmez.
- `catalog_version` her locale/translation mutation'ında transaction içinde
  artırılır.
- Cache anahtarı `locale + namespace set + catalogVersion` olur.
- Dil değişikliğinde ilgili layout ve metadata revalidate edilir.
- İçerik resolver liste sorgularında N+1 oluşturmaz; entity ID listesi ve locale
  zinciri için tek toplu sorgu kullanır.
- Portal proje/görev listelerinde translation join/batch ölçümü yapılır.
- SQLite index'leri locale ve entity lookup'larına göre eklenir.

## 15. Faz bazlı uygulama planı

### Faz 0 — Envanter, ADR ve test fixture'ları

Amaç: Kod yazmadan önce kapsamı ve davranış sözleşmelerini kilitlemek.

#### Görevler

- [x] Kullanıcıya görünen sabit metinlerin dosya ve namespace envanterini çıkar.
- [x] Freelancer ve portal sayfalarını ayrı migration listelerine ayır.
- [x] Tüm sabit `tr-TR`, `<html lang="tr">` ve `date-fns/locale/tr`
  kullanımlarını kaydet.
- [x] Çevrilebilir domain alan registry'sini kesinleştir.
- [x] UI çevirisi ile domain içerik çevirisi ayrımını ADR olarak yaz.
- [x] Locale çözümleme önceliğini ADR olarak yaz.
- [x] Route prefix kullanılmaması kararını kaydet.
- [x] Custom runtime i18n katmanı kararını ve bağımlılık etkisini kaydet.
- [x] Türkçe mevcut veri fixture'ı hazırla.
- [x] İngilizce ve eksik Fransızca katalog fixture'ı hazırla.
- [x] Freelancer, Türkçe client ve İngilizce client auth fixture'ları hazırla.
- [x] RTL davranışı için test locale'i belirle.
- [x] Baseline build, typecheck ve ilgili smoke sonuçlarını kaydet.

#### Faz 0 çıktıları

- [Faz 0 ADR seti](i18n-phase-0/adr.md)
- [Faz 0 i18n envanteri](i18n-phase-0/inventory.md)
- [Faz 0 fixture planı](i18n-phase-0/fixtures.md)
- [Faz 0 migration ve geri dönüş sözleşmesi](i18n-phase-0/migration-contract.md)
- [Faz 0 baseline sonuçları](i18n-phase-0/baseline.md)

#### Çıkış kriteri

- [x] Katalog anahtar standardı onaylandı.
- [x] İlk çevrilebilir entity/field listesi onaylandı.
- [x] Fallback ve portal yayın kuralları tartışmasız hale geldi.
- [x] Migrasyon öncesi geri dönüş ve backup adımları yazıldı.

### Faz 1 — Locale veri modeli ve service katmanı

Amaç: Dil yönetiminin güvenli SQLite temelini oluşturmak.

#### Görevler

- [x] `instance_locales` Drizzle şemasını ekle.
- [x] `instance_i18n_settings` Drizzle şemasını ekle.
- [x] `instance_ui_translations` Drizzle şemasını ekle.
- [x] `content_translations` Drizzle şemasını ekle.
- [x] `clients.portal_locale` alanını ekle.
- [x] `portal_invitations.locale` alanını ekle.
- [x] `user_preferences.language` sabit check constraint'ini kaldır.
- [x] Gerekli unique constraint ve index'leri ekle.
- [x] Türkçe ve İngilizce locale seed'lerini migration içine ekle.
- [x] Instance varsayılan dilini `tr` olarak seed et.
- [x] Mevcut preference kayıtlarını doğrula ve normalize et.
- [x] Locale CRUD repository ve service katmanını yaz.
- [x] Locale ekleme, aktif etme, arşivleme ve default değiştirme validasyonlarını
  yaz.
- [x] Fallback döngüsü ve referanslı locale korumasını uygula.
- [x] Owner/client negatif authorization testlerini yaz.
- [x] Backup/restore smoke testine yeni tabloları dahil et.

#### Faz 1 çıktıları

- [Faz 1 locale veri modeli ve service raporu](i18n-phase-1.md)
- `server/db/schema/i18n.ts`
- `server/repositories/i18n.ts`
- `server/i18n/service.ts`
- `server/db/migrations/0008_wild_mercury.sql`
- `scripts/i18n-phase1-smoke.mjs`
- `scripts/i18n-phase1-smoke.ts`

#### Çıkış kriteri

- [x] Mevcut veritabanı kayıpsız migrate oluyor.
- [x] Yeni instance `tr` ve `en` ile açılıyor.
- [x] Geçersiz locale ve fallback döngüsü DB'ye yazılamıyor.
- [x] Aktif kullanılan locale yanlışlıkla silinemiyor.
- [x] Mevcut login, dashboard ve portal akışları değişmeden çalışıyor.

### Faz 2 — Çeviri runtime'ı ve built-in kataloglar

Amaç: Server ve client component'lerde ortak, typed ve fallback destekli çeviri
altyapısını kurmak.

#### Görevler

- [x] Katalog key/namespace tiplerini tanımla.
- [x] Built-in Türkçe katalogları mevcut metinlerden çıkar.
- [x] İngilizce katalogları eksiksiz hazırla.
- [x] Server-side `createTranslator(locale, namespaces)` helper'ını yaz.
- [x] Client `I18nProvider` ve `useTranslations` hook'unu yaz.
- [x] Interpolation formatını ve doğrulamasını uygula.
- [x] Basit çoğul kurallarını `Intl.PluralRules` ile uygula.
- [x] DB override + built-in + fallback merge sırasını uygula.
- [x] Locale resolver'ı cookie/session/instance kaynaklarına bağla.
- [x] `neta_locale` cookie lifecycle'ını ekle.
- [x] Root layout `lang` ve `dir` değerlerini dinamik yap.
- [x] Ortak tarih, saat, para ve sayı formatter'larını yaz.
- [x] Missing key development log'u ve production fallback davranışını uygula.
- [x] Namespace bazlı cache ve `catalog_version` invalidation'ını uygula.
- [x] Türkçe/İngilizce katalog parity testini yaz.

#### Faz 2 çıktıları

- [Faz 2 çeviri runtime raporu](i18n-phase-2.md)
- `lib/i18n/*`
- `locales/tr/*`
- `locales/en/*`
- `components/i18n/i18n-provider.tsx`
- `server/i18n/catalog.ts`
- `server/i18n/locale.ts`
- `server/i18n/resolver.ts`
- `server/i18n/translator.ts`
- `server/i18n/runtime.ts`
- `app/api/i18n/locale/route.ts`
- `scripts/i18n-phase2-smoke.mjs`
- `scripts/i18n-phase2-smoke.ts`

#### Çıkış kriteri

- [x] Aynı component Türkçe ve İngilizce render edilebiliyor.
- [x] Custom locale override deployment olmadan okunabiliyor.
- [x] Eksik Fransızca anahtar belirlenen fallback ile gösteriliyor.
- [x] `<html lang>` ve `<html dir>` locale'e göre doğru.
- [x] Client hydration mismatch oluşmuyor.
- [x] Built-in katalog key setleri yüzde 100 eşleşiyor.

### Faz 3 — Ayarlar: dil ve çeviri yönetimi

Amaç: Instance sahibinin kod değiştirmeden dil ekleyip yönetebilmesini sağlamak.

#### Görevler

- [x] Ayarlar sidebar'ına `Diller ve çeviriler` bölümü ekle.
- [x] Dil listesi ve tamamlanma kartlarını Poyraz UI ile oluştur.
- [x] Yeni dil ekleme dialog'unu ekle.
- [x] Default locale değiştirme akışını ekle.
- [x] Giriş yapan freelancer için kişisel arayüz dili seçicisini ekle ve
  `user_preferences.language` alanına bağla.
- [x] Draft/active/archive lifecycle'ını ekle.
- [x] Namespace ve eksik anahtar filtreli çeviri editörünü ekle.
- [x] Türkçe/İngilizce referans metinlerini editörde göster.
- [x] Tekil ve toplu çeviri kaydetme action'larını yaz.
- [x] Built-in override'ı sıfırlama aksiyonunu ekle.
- [x] Genel ve portal kritik tamamlanma yüzdesini hesapla.
- [x] JSON export endpoint/action'ını yaz.
- [x] Güvenli JSON import preview ve commit akışını yaz.
- [x] Çeviri değişikliklerinde layout/meta/cache revalidation uygula.
- [x] Ayarlar mutation'larını audit et.
- [x] Yetkisiz client erişimi için negatif test ekle.

#### Faz 3 çıktıları

- [Faz 3 ayarlar dil ve çeviri yönetimi raporu](i18n-phase-3.md)
- `app/(dashboard)/settings/page.tsx`
- `app/(dashboard)/settings/actions.ts`
- `server/i18n/service.ts`
- `server/repositories/i18n.ts`
- `server/settings/preferences.ts`
- `scripts/i18n-phase3-smoke.mjs`
- `scripts/i18n-phase3-smoke.ts`

#### Çıkış kriteri

- [x] Owner Ayarlar'dan `fr` ekleyebiliyor.
- [x] Fransızca bir sidebar metni girilip sayfa yenilemeden sonra kullanılabiliyor.
- [x] Eksik metinler editörde bulunabiliyor.
- [x] JSON export/import round-trip veri kaybetmiyor.
- [x] Client dil yönetimi endpoint/action'larına erişemiyor.

### Faz 4 — Freelancer arayüzünün sayfa sayfa taşınması

Amaç: Owner uygulamasındaki bütün sistem metinlerini katalog üzerinden göstermek.

#### Ortak bileşenler

- [x] App shell, skip link ve mobil menü
- [x] Sidebar grup ve menüleri
- [x] Hesap dropdown'ı ve çıkış
- [x] Page header, stat card ve empty/error state
- [x] Status badge ve confirmation dialog
- [x] Toast, pending button ve genel validation mesajları
- [x] Metadata description ve erişilebilirlik label'ları

#### Sayfalar

- [x] Login
- [x] İlk admin kaydı
- [x] Dashboard
- [x] Takvim
- [x] Analizler
- [x] Müşteriler listesi
- [x] Müşteri detayı ve portal daveti
- [x] Projeler listesi
- [x] Proje detayı
- [x] Görevler
- [x] Finans
- [x] Günlük
- [x] AI sohbet
- [x] Teklifler
- [x] Faturalar
- [x] Abonelikler
- [x] Ayarlar

#### Formatlama ve hata sözleşmesi

- [x] Tüm sabit `tr-TR` kullanımını locale-aware formatter'a taşı.
- [x] Tüm sabit `date-fns` Türkçe locale importlarını merkezi mapping'e taşı.
- [x] Enum değerlerini çevirmeden, yalnız gösterim label'larını çevir.
- [x] Server action'larda kullanıcıya gösterilen string yerine stabil hata kodu
  döndürmeye başla.
- [x] Hata kodlarını `validation` namespace'i üzerinden kullanıcı locale'inde
  göster.
- [x] AI endpoint teknik hata detaylarını korurken UI mesajlarını locale-aware yap.

#### Faz 4 çıktıları

- [Faz 4 freelancer UI migration raporu](i18n-phase-4.md)
- [Faz 4 kalan hardcoded metin raporu](i18n-phase-4-hardcoded-text-report.md)
- `components/layout/app-shell.tsx`
- `components/layout/dashboard-shell.tsx`
- `config/sidebar.ts`
- `app/(dashboard)/layout.tsx`
- `app/(dashboard)/dashboard-client.tsx`
- `lib/i18n/browser.ts`
- `lib/i18n/date-fns.ts`
- `scripts/i18n-phase4-boundary.mjs`

#### Çıkış kriteri

- [x] Freelancer UI Türkçe ve İngilizce eksiksiz kullanılabiliyor.
- [x] Sidebar ve tüm header'lar seçili dilde.
- [x] Dialog, toast, empty state ve form doğrulamaları seçili dilde.
- [x] Tarih, sayı ve para formatları seçili locale'e uyuyor.
- [x] Hardcoded kullanıcı metni boundary kontrolü kalan istisnaları raporluyor.

### Faz 5 — Çok dilli domain içerikleri ve form tab'ları

Amaç: Freelancer'ın müşteriye gösterilecek içeriği aktif dillerde girebilmesini
sağlamak.

#### Altyapı

- [x] Çevrilebilir entity/field registry'sini kodla.
- [x] `ContentTranslationService` ve repository batch sorgularını yaz.
- [x] Locale fallback'li content resolver'ı yaz.
- [x] Create/update/delete transaction entegrasyonunu yaz.
- [x] `LocalizedFields` ve `LocaleTabs` ortak bileşenlerini yaz.
- [x] FormData translation parser ve Zod doğrulamasını yaz.
- [x] Eksik tab göstergesi ve default locale zorunluluğunu ekle.
- [x] Mevcut Türkçe içeriği `tr` kayıtlarına idempotent backfill et.
- [x] Eski temel kolon ile varsayılan locale projection'ını transaction içinde
  senkron tut.

#### Formlar

- [x] Proje oluşturma formu: ad, açıklama, görsel alt metni
- [x] Proje düzenleme formu: ad, açıklama, görsel alt metni
- [x] Planlama alanı oluşturma/düzenleme: başlık ve içerik
- [x] Görev oluşturma/düzenleme: başlık ve açıklama
- [x] Proje detayından görev ekleme: başlık ve açıklama
- [x] Genel ayarlar: portal karşılama ve footer metni
- [x] İkinci kapsam aktifse teklif ve sözleşme formları — bu fazda aktif
  kapsam dışı bırakıldı.

#### Okuma akışları

- [x] Freelancer liste/detayında kendi locale'ine resolved metin göster.
- [x] Edit formlarında tüm locale değerlerini batch yükle.
- [x] Arama davranışını tanımla: ilk sürümde aktif owner locale + temel kolon.
- [x] AI context üretirken source/default locale davranışını belirle.
- [x] İçerik silinince translation kayıtlarını aynı transaction'da sil.

#### Çıkış kriteri

- [x] Proje adı Türkçe, İngilizce ve Fransızca ayrı kaydedilebiliyor.
- [x] Tab değişimi girilmiş değeri kaybettirmiyor.
- [x] Varsayılan dil başlığı boş proje oluşturulamıyor.
- [x] Aynı proje seçili locale'e göre farklı resolved başlık döndürüyor.
- [x] Locale translation query'leri liste ekranında N+1 oluşturmuyor.
- [x] Eski veriler migration sonrasında Türkçe olarak görünmeye devam ediyor.

#### Faz 5 çıktıları

- [Faz 5 çok dilli domain içerikleri raporu](i18n-phase-5.md)
- `lib/i18n/content.ts`
- `server/i18n/content.ts`
- `components/i18n/localized-fields.tsx`
- `app/(dashboard)/projects/actions.ts`
- `app/(dashboard)/tasks/actions.ts`
- `app/(dashboard)/projects/page.tsx`
- `app/(dashboard)/projects/[id]/page.tsx`
- `app/(dashboard)/tasks/page.tsx`
- `scripts/i18n-phase5-smoke.mjs`
- `scripts/i18n-phase5-smoke.ts`

### Faz 6 — Müşteri portal dili ve davet akışı

Amaç: Müşterinin ilk davet ekranından itibaren kendisine atanmış dili görmesini
sağlamak.

#### Davet

- [x] Portal hesabı açma dialog'una dil dropdown'u ekle.
- [x] Yalnız portal-ready aktif dilleri seçilebilir yap.
- [x] Compatibility `/api/create-client-user` adapter'ına locale ekle.
- [x] `/api/portal-invitations` sözleşmesine locale ekle.
- [x] Invitation schema ve service validasyonuna locale ekle.
- [x] Locale'i invitation ve client kaydına transaction içinde yaz.
- [x] Davet preview response'una güvenli locale bilgisini ekle.
- [x] Davet sayfasını invitation locale'i ile render et.
- [x] Davet kabulünde `user_preferences.language` kaydını oluştur.
- [x] Invitation audit metadata'sına locale ekle.

#### Portal shell ve sayfalar

- [x] Portal sidebar
- [x] Portal hesap dropdown'ı ve çıkış
- [x] Portal dashboard
- [x] Portal projeler listesi
- [x] Portal proje detayı
- [x] Portal public görev listesi
- [x] Portal revizyon listesi
- [x] Revizyon oluşturma formu
- [x] Portal progress ve empty state'ler
- [x] Portal tarih, sayı ve durum label'ları

#### İçerik çözümleme

- [x] Proje ve planlama içeriklerini client locale'inde resolve et.
- [x] Public görevleri client locale'inde resolve et.
- [x] Eksik içerikte belirlenen fallback zincirini uygula.
- [x] Revizyon talebini yazıldığı dilde sakla.
- [x] Client başka locale'lerin edit setine erişemediğini test et.

#### Yönetim

- [x] Müşteri detayında mevcut portal dilini göster.
- [x] Portal dili değiştirme aksiyonu ekle.
- [x] Locale arşivleme öncesi etkilenen müşteri sayısını göster.
- [x] Client locale değişikliğinde aktif session'ın sonraki request'te yeni dili
  kullanmasını sağla.

#### Çıkış kriteri

- [x] İngilizce seçilen davet linki İngilizce açılıyor.
- [x] Hesap kabulü sonrasında portal İngilizce kalıyor.
- [x] Fransızca client, Fransızca proje içeriğini görüyor.
- [x] Eksik Fransızca içerik güvenli fallback ile gösteriliyor.
- [x] Türkçe client davranışında regression yok.
- [x] Başka müşterinin locale veya çeviri verisi sızmıyor.

#### Faz 6 çıktıları

- [Faz 6 müşteri portal dili ve davet akışı raporu](i18n-phase-6.md)
- `server/auth/invitations.ts`
- `app/api/create-client-user/route.ts`
- `app/api/portal-invitations/route.ts`
- `app/api/portal-clients/[clientId]/locale/route.ts`
- `app/invite/[token]/page.tsx`
- `app/portal/layout.tsx`
- `components/layout/portal-shell.tsx`
- `config/portal-sidebar.ts`
- `app/portal/page.tsx`
- `app/portal/projects/page.tsx`
- `app/portal/projects/[id]/page.tsx`
- `app/portal/tasks/page.tsx`
- `app/portal/revisions/page.tsx`

### Faz 7 — Auth, hata, bildirim ve erişilebilirlik bütünlüğü

Amaç: Ana sayfalar dışında kalan uç metinleri ve locale edge case'lerini
tamamlamak.

#### Görevler

- [x] Login ekranında aktif diller arasında seçim sun.
- [x] İlk admin kurulumunda instance default locale davranışını tamamla.
- [x] Forgot/reset password ekranlarını kataloglaştır.
- [x] 404, error boundary ve maintenance metinlerini kataloglaştır.
- [x] Server action redirect query mesajlarını stabil hata kodlarına taşı.
- [x] Toast tekrarlarını engelleyen mevcut akışları locale değişiminde doğrula.
- [x] Erişilebilirlik label, `aria-label`, tooltip ve screen-reader metinlerini
  kataloglaştır.
- [x] Interpolation ve plural örneklerini tüm built-in locale'lerde test et.
- [x] RTL smoke testi yap; desteklenmeyen layout noktalarını raporla ve düzelt.
- [x] Locale değiştirme kontrolünün focus ve klavye davranışını test et.
- [x] Bildirim/e-posta sistemi eklendiğinde kullanacağı locale sözleşmesini
  belgeye bağla.

#### Çıkış kriteri

- [x] Auth öncesi ve sonrası locale geçişi tutarlı.
- [x] Kullanıcıya görünen server hata mesajları Türkçe'ye gömülü değil.
- [x] Erişilebilirlik metinleri de seçili locale'de.
- [x] RTL locale temel shell ve formları kullanılamaz hale getirmiyor.

### Faz 8 — API v1 ve mobil hazırlık

Amaç: Aynı dil modelini gelecekteki React Native istemcisi için stabil bir
sözleşmeye dönüştürmek.

#### Görevler

- [x] `instance.localization` capability kaydını ekle.
- [x] `/api/v1/meta` localization alanlarını ekle.
- [x] `/.well-known/neta` için gerekli additive locale bilgisini değerlendir.
- [x] `/api/v1/me` preference language ve portal locale alanlarını ekle.
- [x] `Accept-Language` parser ve locale negotiation helper'ını yaz.
- [x] Gelecek resource endpoint'leri için localized response contract'ı ekle.
- [x] Owner mutation contract'ında `translations` shape'ini standartlaştır.
- [x] `UNSUPPORTED_LOCALE` hata kodunu API response mapping'e ekle.
- [x] Client'ın unknown locale/capability değerlerini güvenli ele almasını
  belgeye ekle.
- [x] Meta cache revalidation ve absolute URL davranışını test et.
- [x] API contract fixture'larını `tr`, `en`, `fr` için ekle.
- [x] Phase 9 mobile smoke testlerini localization alanlarıyla genişlet.

#### Faz 8 çıktıları

- [Faz 8 API v1 ve mobil hazırlık raporu](i18n-phase-8.md)
- `server/api/v1/localization.ts`
- `server/api/v1/contracts.ts`
- `scripts/i18n-phase8-smoke.mjs`
- `scripts/i18n-phase8-smoke.ts`
- `app/api/v1/me/route.ts`
- `scripts/phase9-api-boundary.mjs`
- `docs/self-hosted-redesign/i18n-phase-8-fixtures/`

#### Çıkış kriteri

- [x] Mobil istemci instance'ın desteklediği dilleri keşfedebiliyor.
- [x] `/me` kullanıcının çözülmüş dilini döndürüyor.
- [x] Eski v1 client'lar additive alanlar nedeniyle kırılmıyor.
- [x] Locale seçimi server authorization sınırını aşmıyor.

### Faz 9 — Hardening, migrasyon ve release

Amaç: Çok dilli özelliği self-host production kurulumu için güvenli şekilde
yayınlamak.

#### Migrasyon

- [x] Release öncesi otomatik backup zorunluluğunu belgeye ekle.
- [x] Boş DB migration testi yap.
- [x] Mevcut production benzeri Türkçe DB migration testi yap.
- [x] Tekrar çalışan idempotent backfill testi yap.
- [x] Migration failure sonrası eski sürüme dönüş prosedürünü test et.
- [x] Backup/restore sonrasında locale ve çeviri bütünlüğünü doğrula.
- [x] Supabase import aracının yeni locale default'larını doğru oluşturduğunu test
  et.

#### Otomasyon

- [x] `phase-i18n:boundary` script'i ekle.
- [x] Hardcoded kullanıcı metni istisna listesini minimumda tut.
- [x] Built-in katalog parity ve interpolation değişken testlerini CI'a ekle.
- [x] Locale service authorization testlerini CI'a ekle.
- [x] Content translation transaction testlerini CI'a ekle.
- [x] Portal davet locale E2E testini CI'a ekle.
- [x] Build, typecheck, lint ve mevcut phase smoke testlerini çalıştır.
- [x] Docker standalone image içinde built-in katalogların bulunduğunu doğrula.

#### Performans ve gözlem

- [x] Freelancer dashboard render süresini önce/sonra ölç.
- [x] Portal proje listesi query sayısını önce/sonra ölç.
- [x] Custom katalog yükleme boyutunu ölç.
- [x] Missing translation sayacını logla; hassas içerik loglama.
- [x] Catalog version/cache invalidation yarış koşullarını test et.

#### Dokümantasyon

- [x] Self-host kurulum dokümanına default locale ayarını ekle.
- [x] Dil ekleme ve çeviri import/export rehberi yaz.
- [x] Portal müşterisine dil atama rehberi yaz.
- [x] Mobil API localization sözleşmesini güncelle.
- [x] Backup/restore dokümanına translation tablolarını ekle.
- [x] Release note ve upgrade uyarısını yaz.

#### Çıkış kriteri

- [x] Türkçe ve İngilizce kataloglar yüzde 100 tamamlandı.
- [x] Fransızca custom locale uçtan uca smoke testi geçti.
- [x] Davet öncesi, davet, login ve portal locale zinciri doğrulandı.
- [x] Mevcut Türkçe veri kaybı veya görünüm regression'ı yok.
- [x] Docker/Dokploy persistent volume backup-restore testi geçti.
- [x] Mobil v1 sözleşmesi geriye uyumlu.
- [x] Release readiness raporu yazıldı.

## 16. Test matrisi

| Senaryo | Beklenen sonuç |
| --- | --- |
| Yeni kurulum | `tr` ve `en` aktif, default `tr` |
| Mevcut DB upgrade | Eski içerik Türkçe translation olarak backfill |
| Owner dili İngilizce | Freelancer UI ve formatlar İngilizce |
| Eksik Fransızca UI key | Tanımlı fallback metni, ham key değil |
| Fransızca proje içeriği | Fransızca client Fransızca metni görür |
| Eksik Fransızca proje alanı | Default içerik fallback'i gösterilir |
| İngilizce portal daveti | Davet kabul sayfası İngilizce |
| Davet kabulü | Client preference dili invitation locale olur |
| Client tekrar login | Portal dili korunur |
| Locale arşivleme | Referanslı client varsa yönlendirme istenir |
| Translation import | Preview sonrası geçerli key'ler yazılır |
| Zararlı import key'i | Validation ile reddedilir |
| Client translation endpoint'i | 403/404 ile reddedilir |
| Başka client projesi | Locale değişse de erişilemez |
| RTL test locale'i | `dir=rtl`, shell ve form kullanılabilir |
| Backup/restore | Locale, overrides ve içerik çevirileri korunur |
| Eski mobil client | Yeni additive meta alanlarını yok sayarak çalışır |

## 17. Riskler ve azaltma yaklaşımı

### 17.1. Hardcoded metin kaçakları

Risk: Bazı toast, tooltip veya empty state metinleri Türkçe kalabilir.

Azaltma:

- Namespace bazlı sayfa checklist'i
- Boundary script
- Türkçe karakter/string taraması
- İngilizce E2E ekran gezintisi

### 17.2. Client/server locale uyuşmazlığı

Risk: Server Türkçe, client İngilizce render ederek hydration hatası oluşturabilir.

Azaltma:

- Locale'i layout server tarafında bir kez çözmek
- Client provider'a resolved locale ve namespace snapshot vermek
- İlk render öncesi browser dilini bağımsız yeniden seçmemek

### 17.3. Translation sorgularında N+1

Risk: Liste ekranlarında her proje için ayrı query çalışabilir.

Azaltma:

- Batch resolver
- Composite index
- Query-count smoke testi

### 17.4. Eksik müşteri çevirisi

Risk: Müşteri portalı kısmen farklı dillerde görünebilir.

Azaltma:

- Portal kritik namespace kapsamı
- Publish readiness yüzdesi
- Davet dropdown'unda yalnız portal-ready locale
- İçerik alanlarında eksik tab uyarısı
- Belirgin ve deterministik fallback

### 17.5. Eski kolon ve translation tablosu ayrışması

Risk: Bir write yalnız tablolardan birini günceller.

Azaltma:

- Tek service mutation noktası
- Transaction
- Repository'ye doğrudan UI erişimini boundary testiyle engelleme
- Tutarlılık kontrol script'i

### 17.6. Custom çeviride XSS veya bozuk interpolation

Risk: Owner'ın girdiği metin HTML veya sahte placeholder ile render'ı bozabilir.

Azaltma:

- Düz metin varsayımı
- Placeholder schema doğrulaması
- HTML render etmeme
- Import limitleri ve güvenli key parser

## 18. Önerilen commit parçalama stratejisi

Her faz kendi içinde rollback edilebilir küçük commit'lere ayrılmalıdır:

1. Şema, migration ve repository
2. Service, validation ve test
3. Ortak UI/runtime altyapısı
4. Sayfa/form entegrasyonları
5. Dokümantasyon ve phase checklist güncellemesi

Şema migration'ı ile onu kullanan runtime kodu ayrı deploy'larda uyumsuz hale
gelmemelidir. Gerekirse expand/migrate/contract sırası izlenir.

## 19. Genel tamamlanma checklist'i

- [x] Faz 0 — Envanter, ADR ve fixture
- [x] Faz 1 — Locale veri modeli ve service
- [x] Faz 2 — Runtime ve built-in kataloglar
- [x] Faz 3 — Dil/çeviri yönetimi
- [x] Faz 4 — Freelancer UI migration
- [x] Faz 5 — Çok dilli içerik ve form tab'ları
- [x] Faz 6 — Portal dili ve davet
- [x] Faz 7 — Auth/hata/a11y bütünlüğü
- [x] Faz 8 — API ve mobil hazırlık
- [x] Faz 9 — Hardening ve release

## 20. Nihai definition of done

Bu özellik aşağıdaki maddelerin tamamı sağlanmadan bitmiş sayılmaz:

- [ ] Türkçe ve İngilizce yeni kurulumda hazır gelir.
- [ ] Owner Ayarlar'dan üçüncü bir dil ekleyebilir.
- [ ] Owner custom dilde bütün sistem metinlerini düzenleyebilir.
- [ ] Sidebar, başlıklar, butonlar, formlar, durumlar ve hatalar seçili dilde
  gösterilir.
- [ ] Tarih, saat, sayı ve para locale'e göre biçimlenir.
- [ ] Çevrilebilir formlarda aktif diller tab olarak görünür.
- [ ] Proje ve müşteriye açık görev içerikleri dil başına saklanır.
- [ ] Portal davetinde müşteri dili seçilir.
- [ ] Davet kabul ekranı seçilen dilde açılır.
- [ ] Müşteri her login sonrasında portalı atanmış dilde görür.
- [ ] Portal içerikleri müşteri locale'ine göre çözülür.
- [ ] Eksik çeviri davranışı deterministik ve güvenlidir.
- [ ] Client authorization locale parametresiyle aşılamaz.
- [ ] Mobil metadata desteklenen dilleri ilan eder.
- [ ] Backup/restore bütün custom dilleri ve çevirileri korur.
- [ ] Mevcut Türkçe veriler migration sırasında kaybolmaz.
- [ ] Build, typecheck, lint, i18n boundary ve E2E smoke testleri geçer.
