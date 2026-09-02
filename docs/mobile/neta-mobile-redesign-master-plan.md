---
title: Neta Mobile Product Redesign Master Plan
description: Fork başına tek Neta instance'ına bağlanan, profesyonel native mobil deneyim için ürün, UI, navigasyon, API ve kalite planı.
status: completed
current_phase: "completed"
last_updated: 2026-07-29
supersedes:
  - neta-react-native-mobile-master-plan.md
source_of_truth:
  web_repository: /Users/poyrazavsever/Yazılım/neta
  mobile_repository: /Users/poyrazavsever/Yazılım/neta-mobile
---

# Neta Mobile Product Redesign Master Plan

> Repository sınırı: `/Users/poyrazavsever/Yazılım/neta` web projesi bu plan
> için read-only product/backend source-of-truth olarak incelenir. Plan içinde
> backend işi tanımlanması, web repository'sini aynı görevde değiştirme yetkisi
> anlamına gelmez. Web uygulaması ancak ayrıca açıkça istendiğinde değiştirilir.

## 1. Ürün kararı

Neta, tek bir freelancer/owner'ın müşteri, proje, görev, takvim, finans,
günlük, analiz ve AI iş akışlarını kendi sunucusunda yönettiği; müşterilerine de
sınırlı ve güvenli bir portal sunduğu self-hosted çalışma alanıdır.

Mobil uygulama artık farklı Neta domain'lerine bağlanan genel bir istemci
olmayacaktır. Her fork/build, tek Neta instance'ına aittir. Instance origin'i
build sırasında environment dosyasından alınır. Uygulama açılışında kullanıcıya
domain sorulmaz.

Unauthenticated deneyim yalnız şunlardan oluşur:

1. İlk kurulumda kısa onboarding.
2. Login.

Onboarding tamamlandıktan sonra logout veya session expiry doğrudan login'e
döner. Kullanıcı rolü login sonrasındaki `/api/v1/me` yanıtından belirlenir ve
owner ya da client portal shell'i açılır.

## 2. İnceleme özeti ve mevcut farklar

### 2.1. Web uygulamasında doğrulanan ürün alanları

Web kaynak kodu aşağıdaki gerçek iş alanlarını içeriyor:

- Dashboard ve analytics.
- Müşteriler, müşteri detayları, aktiviteler ve portal daveti.
- Projeler, proje planı, proje görevleri, ilerleme ve revizyonlar.
- Görevler.
- Takvim etkinlikleri.
- Gelir/gider bazlı finans takibi ve AI finans analizi.
- Günlük, mood, enerji ve iş tatmini.
- AI sohbeti ve proje risk analizi.
- Owner ayarları: genel, görünüm, profil, güvenlik, AI, kişisel dil ve dil yönetimi.
- Client portalı: dashboard, projeler, public görevler, revizyonlar ve kişisel ayarlar.
- Yerel dosya alanı, branding asset'leri ve proje dosyaları.

Web uygulaması liste/detail/form ayrımını ve birçok create/edit işlemini dialog
üzerinden kuruyor. Mobil uygulama bu davranışları web component'lerini taşımadan,
native interaction kalıplarıyla yeniden üretmelidir.

### 2.2. Kesin kapsam dışı

Mobilde “ticari kayıtlar” bulunmayacaktır:

- Teklifler.
- Sözleşmeler.
- Faturalar.
- Abonelikler.

`business` route'u, feature kodu, API contract'ları, cache resource adı ve menü
girdileri mobile production bundle'ından kaldırılacaktır. Finans ekranı ticari
kayıt modülü değildir; Neta'nın gelir/gider ve nakit akışı özelliği olarak
korunacaktır.

### 2.3. Mevcut mobil uygulamadaki temel sorunlar

- Owner shell yalnız `Stack` kullanıyor; kalıcı bir ana navigasyon yok.
- Portal standart tab kullanıyor fakat profesyonel ortak shell/top bar dili yok.
- Formların çoğu liste ekranlarının altına inline yerleştirilmiş; ekran hiyerarşisi
  ve kullanım akışı bozuluyor.
- Dil yönetimi ve dosya/medya bağımsız ana ekran gibi davranıyor.
- Toast bugün yalnız inline, sol kenarlıklı bir bilgi kutusu; global queue,
  overlay, action, dismiss ve motion davranışı yok.
- Domain discovery ve pairing akışları yeni tek-instance ürün kararıyla çelişiyor.
- Mobil istemci çok sayıda `/api/v1/*` endpoint'i bekliyor; incelenen web
  repository'sinde bugün yalnız health, meta, me, preferences ve localization
  public/session route'ları mevcut. UI fazları API delivery gate'i olmadan
  tamamlanmış sayılmayacak.
- Web metadata'sı bugün `freelancer.core`, `portal.client`, `files.local` ve
  `ai.assistant` capability'lerini `available` ilan ediyor; karşılık gelen mobil
  `/api/v1` route grupları bulunmadığından mobil feature gating bu ilanlara
  güvenemez. Backend teslim fazında capability durumları gerçek route/test
  matrisiyle eşleştirilmelidir.
- Web `TRUSTED_ORIGINS` parser'ı custom mobile scheme'i `URL.origin` üzerinden
  normalize ettiğinde literal `"null"` üretebilir. Native auth fazı, web koduna
  kontrollü bir değişiklik ve regression testi gerektirir; bu plan çalışmasında
  web repository'si değiştirilmemiştir.
- Birçok relation alanı kullanıcıya ham `Project ID` veya `Client ID` girdiriyor.
  Üretim UI'ında bunlar searchable native seçim sheet'leri olmalıdır.

### 2.4. Web domain ve mobile contract drift'i

Web domain modeli ürün davranışının mevcut source-of-truth'udur. Mobile
`@neta/api-contracts` paketi bugün aşağıdaki alanlarda web ile uyuşmuyor:

| Alan | Web'deki canonical değer | Mevcut mobile contract | Redesign kararı |
| --- | --- | --- | --- |
| Dashboard range | `today`, `this_week`, `this_month`, `this_year` | `week`, `month`, `year` | Web değerleri kullanılır. |
| Client status | `active`, `paused`, `archived` | `active`, `archived`, `lead` | Status ve pipeline ayrılır. |
| Client pipeline | `lead`, `contacted`, `proposal_sent`, `won`, `lost` | Ayrı alan yok | Ayrı typed alan eklenir. |
| Project type | `client_project`, `side_project` | Ayrı alan yok | Create/edit contract'a eklenir. |
| Project status | `planning`, `active`, `paused`, `completed`, `cancelled` | `draft`, `active`, `completed`, `archived` | Web lifecycle korunur. |
| Progress type | `manual`, `auto` | Ayrı alan yok | Project detail/settings contract'a eklenir. |
| Task status | `todo`, `in_progress`, `done`, `cancelled` | `todo`, `in-progress`, `blocked`, `completed` | Web lifecycle korunur; UI label ayrı çözülür. |
| Task schedule | `scheduledDate` gün alanı | `scheduledAt` timestamp | API semantiği web alanıyla uyumlu tanımlanır. |
| Calendar type | `meeting`, `focus`, `deadline`, `personal`, `finance` | `meeting`, `work`, `reminder`, `deadline` | Web enum'u kullanılır. |
| Calendar all-day | Web domain kaydında yok | Zorunlu/opsiyonel `allDay` alanı var | Backend desteği gelmeden UI vaadi verilmez. |
| Finance payment | `planned`, `pending`, `paid`, `cancelled` | `pending`, `paid`, `overdue`, `cancelled` | Web enum'u kullanılır. |
| Journal scores | Mood/energy/satisfaction nullable | Üçü de zorunlu | Nullability web domain kuralıyla eşitlenir. |
| Revision status | `pending`, `in_progress`, `completed`, `rejected` | `requested`, `in-progress`, `completed`, `rejected` | Web enum'u kullanılır. |
| Radius scale | `compact`, `default`, `soft` | `number` | String enum ve semantic token mapping kullanılır. |
| File kind | `avatar`, `branding_logo`, `branding_icon`, `project_asset` | UI asset türlerine bölünmüş enum | Transport web kind'ını, UI binding alanını ayrı taşır. |
| File visibility | `private`, `portal`, `public_branding` | `private`, `portal`, `public` | Web authorization değeri korunur. |
| Locale direction | `ltr` / `rtl` | `isRtl: boolean` | API canonical `textDirection` taşır; UI bool türetebilir. |
| Chat role | `system`, `user`, `assistant`, `tool` | `user`, `assistant` | Public mobile response filtreleme/mapping'i açıkça tanımlanır. |
| Business records | Web modelinde mevcut | Mobile contract ve route'larda mevcut | Mobile bundle/contract'tan tamamen çıkarılır. |

Transport modeli database row'unu körlemesine dışarı açmayabilir; ancak her isim
ve enum dönüşümü server adapter'ında açık, çift yönlü ve testli olmalıdır. Mobile
UI web'de olmayan yeni lifecycle değerleri icat etmez.

## 3. Bilgi mimarisi

### 3.1. Owner bottom navigation

Telefon alt menüsü beş hedef taşır:

1. **Ana Sayfa** — dashboard ve hızlı aksiyonlar.
2. **Müşteriler** — müşteri listesi ve detay akışı.
3. **Projeler** — proje listesi ve detay akışı.
4. **Görevler** — görev listesi/board akışı.
5. **Diğer** — navigation bottom sheet'i.

`Diğer` bir sayfaya gitmez. Basıldığında native bottom sheet açılır:

- Takvim.
- Finans.
- Analizler.
- Günlük.
- AI Asistan.
- Ayarlar.

Sheet içindeki öğeler ikon, başlık ve gerekirse tek satırlık açıklama taşır.
Aktif alt route görünür biçimde işaretlenir. Sheet VoiceOver/TalkBack odağını
içine alır, kapandığında odağı `Diğer` tab'ına geri verir.

Tablet'te aynı harita compact bottom bar yerine genişliğe göre navigation rail
olarak sunulabilir; route yapısı değişmez.

### 3.2. Client portal bottom navigation

1. Ana Sayfa.
2. Projeler.
3. Görevler.
4. Revizyonlar.
5. Diğer.

Portal `Diğer` sheet'i yalnız profil, görünüm, dil, güvenlik ve çıkış gibi client
yetkili hedefleri gösterir. Owner ayarları hiçbir zaman render edilmez.

### 3.3. Top bar

Her authenticated ekran ortak `AppTopBar` kullanır:

- Root ekranlarda workspace işareti veya kısa logo, ekran başlığı ve avatar.
- Detail ekranlarda native geri aksiyonu, kısa başlık ve bağlamsal overflow.
- Liste ekranlarında opsiyonel search/filter ve `Yeni` aksiyonu.
- Scroll ile compact moda geçen, safe-area uyumlu yüzey.
- Light/dark modda semantic background, border ve foreground.
- Maksimum font boyutunda aksiyonları kaybetmeyen responsive düzen.

Bildirim altyapısı gerçek API ve ürün kararı olmadan top bar'a eklenmeyecektir.

### 3.4. Route ve geçiş modeli

```text
src/app/
  _layout.tsx                    # providers + root native stack
  (public)/
    onboarding.tsx
    login.tsx
  (owner)/
    _layout.tsx                 # owner tabs + nested stacks
    (tabs)/
      index.tsx
      clients/
      projects/
      tasks/
      others.tsx                # görünür sayfa değil, sheet trigger kontratı
    calendar/
    finance/
    analytics/
    journal/
    chat/
    settings/
      index.tsx
      account/
      workspace/
      language/
      files-media/
  (portal)/
    _layout.tsx
    (tabs)/...
  (forms)/
    client.tsx
    client-activity.tsx
    portal-invitation.tsx
    project.tsx
    planning-section.tsx
    task.tsx
    calendar-event.tsx
    finance-transaction.tsx
    journal-entry.tsx
    revision-request.tsx
  (sheets)/
    owner-others.tsx
    portal-others.tsx
    relation-picker.tsx
    filter.tsx
```

Davranış:

- Tab değişimi sakin cross-fade/standart tab geçişidir.
- Liste → detay platform-native push kullanır.
- Create/edit formları native `formSheet` veya uzun formlarda full-screen modal
  olarak açılır.
- Destructive confirmation ayrı, erişilebilir confirmation modalıdır.
- `Reduce Motion` açıksa dekoratif motion kapatılır ve geçiş süresi azaltılır.
- Alpha durumundaki `unstable-native-tabs` kullanılmaz. Kararlı Expo Router
  `Tabs`, `Stack` ve gerektiğinde headless tab UI kullanılır.

## 4. Tasarım sistemi

### 4.1. Görsel yön

Hedef; dashboard'u web sayfası gibi sıkıştırmak değil, Neta'nın kırmızı odağını
koruyan modern ve sakin bir native productivity uygulamasıdır.

- Kırmızı yalnız ana aksiyon, aktif durum ve anlamlı vurgu için kullanılır.
- Büyük yüzeyler nötr background/surface rollerini kullanır.
- Kartlar düşük kontrast border, kontrollü elevation ve tutarlı radius taşır.
- Tipografi üç ana seviyeye indirgenir: display/page, section, body/metadata.
- Liste satırları bol touch area, net primary/secondary metin ve status badge
  düzenine sahip olur.
- Grafikler görsel özetin yanında erişilebilir metinsel özet verir.
- Dark mode sonradan boyanmış light theme değildir; ayrı surface/border/shadow
  değerleriyle tasarlanır.

### 4.2. Ortak primitive'ler

Minimum bağımlılıkla aşağıdaki internal component seti kurulacaktır:

- `AppTopBar`, `BottomNavigation`, `NavigationSheet`.
- `Screen`, `ScrollableScreen`, `VirtualizedScreen`.
- `Button`, `IconButton`, `FAB`, `ListRow`, `Card`, `StatCard`, `Badge`.
- `TextField`, `TextArea`, `SelectField`, `DateField`, `SwitchField`,
  `RelationPickerField`, `LocalizedFieldTabs`.
- `FormSheet`, `ModalHeader`, `StickyFormFooter`, `ConfirmDialog`.
- `ToastViewport`, `Toast`, `InfoBox`.
- `Skeleton`, `EmptyState`, `ErrorState`, `OfflineBanner`, `FreshnessNotice`.

Yeni UI kit veya üçüncü parti bottom-sheet paketi eklenmez. Önce React Native,
Expo Router ve mevcut native screen/gesture altyapısı kullanılır. Yeni ikon veya
grafik bağımlılığı ancak bundle maliyeti ve erişilebilir fallback'i belgelenerek
eklenebilir.

### 4.3. Toast sistemi

Global provider aşağıdaki kontratı taşır:

- `success`, `error`, `warning`, `info` tonları.
- Safe area altında overlay; içerik layout'unu aşağı itmez.
- Queue, duplicate birleştirme, swipe/tap dismiss ve süre politikası.
- Opsiyonel tek action: `Geri al`, `Tekrar dene`, `Görüntüle`.
- Error ve önemli state'lerde screen reader announcement.
- İkon + başlık + açıklama; anlam yalnız renge bırakılmaz.
- Submit success sonrası modal kapanır, ilgili liste invalidate edilir ve toast
  hedef ekranda görünür.

### 4.4. InfoBox sistemi

`InfoBox` sayfa içi kalıcı bağlam içindir; toast yerine kullanılmaz:

- Bilgi, başarı, uyarı ve kritik ton.
- İkon, kısa başlık, açıklama ve opsiyonel action.
- Offline, AI provider eksik, stale data, revizyon kotası ve güvenlik uyarıları
  için kullanılır.
- Light/dark ve increased-contrast testleri zorunludur.

## 5. Form ve klavye kontratı

### 5.1. Modal-first kuralı

- Liste sayfasında create/edit alanları inline render edilmez.
- Her create/edit akışı route tabanlı modal açar; deep link ve back davranışı
  korunur.
- Kısa seçimler bottom sheet, uzun veri girişleri full-height form sheet olur.
- Form başlığı ve `İptal/Kaydet` aksiyonları sheet içeriğinde render edilir;
  Android formSheet header sınırlamalarına güvenilmez.
- Kaydedilmemiş değişiklik varken dismiss/back confirmation gösterir.
- Mutation sırasında alanlar kaybolmaz; duplicate submit engellenir.

### 5.2. Klavye güvenliği

Ortak `FormSheet` aşağıdaki davranışları merkezi uygular:

- Safe area + `KeyboardAvoidingView`.
- iOS `automaticallyAdjustKeyboardInsets` ve interactive dismissal.
- Android `softwareKeyboardLayoutMode=resize` ve açık keyboard behavior testi.
- Scrollable form content ve klavyenin üstünde erişilebilir sticky submit alanı.
- Focus edilen input görünür alana otomatik scroll edilir.
- Validation sonrası ilk hatalı alan focus edilir; label ve hata birlikte görünür.
- `next/done` sırası, password manager ve uygun keyboard type tanımlanır.
- Multiline alanlar büyürken footer ve aktif alan kapanmaz.
- Modal dismiss klavyeyi kontrollü kapatır, form draft'ını yanlışlıkla silmez.

Kabul matrisi en az küçük iPhone, büyük iPhone, küçük Android, landscape,
maximum Dynamic Type/font scale, VoiceOver ve TalkBack içerir. Kod incelemesi bu
matrisi geçmiş sayılmaz.

## 6. Tek-instance environment ve auth

### 6.1. Environment sözleşmesi

Canonical public değişken:

```env
EXPO_PUBLIC_NETA_ORIGIN=https://neta.example.com
```

Değer yalnız origin kabul eder; path/query/fragment/credential reddedilir. API,
auth ve asset URL'leri bu origin'den türetilir:

```text
API       = ${EXPO_PUBLIC_NETA_ORIGIN}/api/v1
Auth      = ${EXPO_PUBLIC_NETA_ORIGIN}/api/auth
Discovery = ${EXPO_PUBLIC_NETA_ORIGIN}/.well-known/neta
```

Bu değer secret değildir ve app bundle'ında görülebilir. Token, password veya
server secret hiçbir `EXPO_PUBLIC_*` değişkenine konmaz.

Fork sahibinin kendi mağaza paketini yayınlayabilmesi için build-time config de
belgelenir:

```env
NETA_APP_NAME=Neta
NETA_APP_SLUG=neta
NETA_APP_SCHEME=neta
NETA_IOS_BUNDLE_ID=com.example.neta
NETA_ANDROID_PACKAGE=com.example.neta
```

`.env.example` güvenli örnekler taşır. Development env verilmediğinde yalnız
simulator kolaylığı için `http://localhost:3000` fallback'i kullanılır. Preview
ve production origin eksik/geçersizse build/config check başarısız olur;
production app domain input ekranına düşmez.

### 6.2. Bootstrap state machine

```text
boot
  -> validate-build-config
  -> load-onboarding-version
  -> load-cached-branding
  -> validate-session
  -> onboarding | login | owner-shell | portal-shell
```

Discovery kullanıcı akışı olmaktan çıkar; arka planda configured origin'in Neta
instance'ı, health, version ve branding bilgilerini doğrulayan bootstrap kontrolü
olarak kalır. Hata ekranı domain değiştirtmez; instance erişilemiyor, bakımda veya
uyumsuz açıklaması ve retry gösterir.

### 6.3. Onboarding ve login

Onboarding en fazla üç kısa adımdır:

1. Workspace/Neta karşılama ve ürün değeri.
2. Müşteri, proje ve görev akışlarının özeti.
3. Self-hosted veri sahipliği ve güvenli giriş açıklaması.

Son adım login'e geçer. Onboarding completion version'lı public storage'da
tutulur. Login ekranı workspace branding, email, password, password visibility,
forgot-password web fallback, loading ve alan hatalarını içerir. Domain,
pairing ve instance değiştirme alanları bulunmaz.

## 7. Ayarlar bilgi mimarisi

`Ayarlar` tek uzun form değildir; kategori hub'ıdır:

### Hesap

- Profil ve avatar.
- Güvenlik, şifre ve session'lar.
- Kişisel tema ve dil tercihi.

### Workspace

- Genel: application name, short name, organization name, support email, portal
  welcome ve portal footer.
- Görünüm: primary/accent, `compact/default/soft` radius scale, varsayılan tema,
  light/dark logo ve icon.
- AI provider/model/key ayarları.

### İçerik ve medya

- Dil yönetimi.
- Translation catalog/import/export.
- Dosya ve medya.
- Logo, avatar ve proje asset yönetimi bağlamsal alt ekranlarda.

Dil yönetimi ve dosya/medya bottom navigation veya `Diğer` sheet'inde bağımsız
ana link olarak yer almaz; yalnız `Ayarlar` altında bulunur.

## 8. iOS haptic uyarısı ve native stabilite

Mevcut kodda `expo-haptics`, `Vibration` veya doğrudan Core Haptics çağrısı yok.
`hapticpatternlibrary.plist` mesajı Apple Simulator'da text input/haptic pattern
yüklenirken raporlanan bir simulator/runtime uyarısı olabilir; uygulama kaynaklı
bir crash gibi ele alınmamalıdır.

Stabilite fazında:

1. Uyarının release build, güncel simulator runtime ve fiziksel cihazdaki
   davranışı ayrı kaydedilir.
2. App kaynaklı bir tetikleyici bulunursa kaldırılır veya capability/reduced-motion
   guard arkasına alınır.
3. Simulator runtime/Xcode uyumu ve temiz simulator testi belgelenir.
4. Uygulama bundle'ına sahte `hapticpatternlibrary.plist` eklenmez ve Apple özel
   framework davranışı patch'lenmez.
5. Gerçek crash, donma, input gecikmesi ve console-only OS uyarısı ayrı severity
   sınıflarına ayrılır.

## 9. Web API teslim sınırı

Mobil feature, karşılık gelen web API route'u ve authorization testi olmadan
tamamlanmış sayılmaz. Backend route'ları web repository'sinde mevcut
`DomainService` ve actor scope'larını kullanır; mobil repository server modelini
kopyalamaz.

Öncelikli teslim grupları:

- Bootstrap/auth: meta, health, me, preferences ve native auth lifecycle.
- Dashboard/analytics.
- Clients + activities + portal invitations.
- Projects + planning + revisions + assets.
- Tasks.
- Calendar range API.
- Finance summary/transactions/analysis.
- Journal.
- Chat sessions/messages/risk analysis.
- Settings, locale management ve file/media.
- Portal dashboard/projects/tasks/revisions/profile.

Her grup başarı envelope, typed validation, cursor/range sınırı, owner/client
authorization, cross-client negative test, idempotency ve redacted error
kontratlarını karşılar.

## 10. Faz planı

Tamamlanma durumu: Redesign Faz 0–12, 2026-07-29 tarihinde mobil repository'de
tamamlandı. Web auth/CORS ile feature `/api/v1` route teslimleri repository sınırı
gereği ayrı backend işleri olarak açık kalır; mobil uygulama bu eksikleri sahte
başarılı veriyle gizlemez.

### Redesign Faz 0 — Scope, baseline ve silinecek yüzey

- Bu dokümanı canonical plan yap.
- Mobile/web route ve API gap envanterini snapshot olarak kaydet.
- Yukarıdaki contract drift tablosunu executable fixture/contract testine dönüştür.
- Business/ticari kayıt kapsamını contract, route, feature ve dokümanlardan çıkar.
- Domain-connect, multi-instance ve pairing UI'sını deprecated ilan et.
- Mevcut ekranların accessibility, performance ve visual baseline görüntülerini al.
- Navigation map ve her ekranın create/edit/detail akışını onayla.

**Çıkış kapısı:** Kapsam listesi, route map, API gap ve silme listesi test edilebilir
dosyalarda nettir; yeni UI kodu başlamazdan önce belirsiz ana link kalmaz.

### Redesign Faz 1 — Environment, bootstrap, onboarding ve login

- `EXPO_PUBLIC_NETA_ORIGIN` validation ve URL türetme katmanını kur.
- Fork/build kimlik değişkenlerini `app.config.ts` ve `.env.example` ile bağla.
- Kullanıcı domain girişi, instance switch ve pairing UI'sını kaldır.
- Version'lı onboarding ve branded login route'larını kur.
- Session restore/logout/expiry yönlendirmelerini sadeleştir.
- Web native auth lifecycle ve CORS/trusted-origin testlerini tamamla.
- Web custom-scheme trusted-origin normalizasyonunu backend repository'sinde ayrı,
  onaylı değişiklik olarak düzelt; mobile plan çalışması içinde web'i sessizce
  değiştirme.

**Çıkış kapısı:** Temiz kurulum onboarding→login; sonraki açılış login; geçerli
session doğrudan doğru role gider. Production build eksik origin ile oluşmaz.

### Redesign Faz 2 — Görsel sistem ve feedback primitive'leri

- Semantic light/dark tokenları, typography, spacing, radius ve elevation'ı yenile.
- Button, icon button, card, list row, badge, input ve state component'lerini kur.
- Global toast viewport/queue ve `InfoBox` ailesini kur.
- Skeleton, empty/error/offline/freshness durumlarını ortaklaştır.
- Dynamic Type, contrast, 48dp target ve reduced-motion testlerini ekle.

**Çıkış kapısı:** Component gallery/test ekranı tüm state'leri iki tema ve büyük
font ile gösterir; raw hex ve keyfi spacing feature ekranlarına sızmaz.

### Redesign Faz 3 — Profesyonel app shell ve navigation

- Owner/portal nested tabs + stacks mimarisini kur.
- `AppTopBar`, custom bottom navigation ve active state'leri tamamla.
- Owner/portal `Diğer` native sheet'lerini kur.
- Liste→detay push, modal ve sheet transition standardını uygula.
- Deep link, Android back, tab history ve focus restoration testlerini ekle.

**Çıkış kapısı:** Tüm placeholder route'lar profesyonel ortak shell içinde
erişilir; görünmeyen route tab bar'a sızmaz; screen reader tab sırası doğrudur.

### Redesign Faz 4 — Modal form ve keyboard foundation

- Route tabanlı `FormSheet`, header/footer ve unsaved-draft guard kur.
- Keyboard-aware scroll/focus registry ve ilk hata focus davranışını merkezileştir.
- Native date/time, relation picker, select/filter ve localized field sheet'lerini kur.
- Inline create/edit formlarını ekranlardan çıkarmaya başla.
- Küçük cihaz + landscape + maximum font + VoiceOver/TalkBack matrisi uygula.

**Çıkış kapısı:** Referans uzun formda hiçbir alan veya submit aksiyonu klavye
altında kalmaz; dismiss/back draft kaybına neden olmaz.

### Redesign Faz 5 — Dashboard, analytics API ve ana sayfa

- Web'de dashboard/analytics `/api/v1` route'larını actor scope ile tamamla.
- Owner ana sayfasını summary, son işler ve hızlı aksiyonlarla yeniden tasarla.
- Grafiklere text summary, range picker ve loading/empty/error states ekle.
- Pull-to-refresh, cache freshness ve request sayısı budget'ını uygula.

**Çıkış kapısı:** Ana sayfa tek aggregate request ile anlamlı ilk içerik verir;
API yokken sahte başarılı UI göstermez.

### Redesign Faz 6 — Müşteriler

- Client list/detail/activity/invitation API grubunu tamamla.
- Search/filter listesi, profesyonel müşteri kartı ve detail stack'i kur.
- Create/edit, aktivite ve portal daveti formlarını modal route'lara taşı.
- Ham ID alanlarını relation seçimleriyle değiştir.

**Çıkış kapısı:** Liste→detay→modal mutation→toast→güncel liste akışı; owner ve
cross-client authorization testleriyle geçer.

### Redesign Faz 7 — Projeler ve görevler

- Project/planning/revision/assets ve task API gruplarını tamamla.
- Project list/detail segmented akışını kur: genel, plan, görev, revizyon, dosya.
- Task liste/filtre/detail ve status update akışını kur.
- Tüm create/edit formlarını modal yap; optimistic update yalnız rollback ile kullan.

**Çıkış kapısı:** Project ve task lifecycle web iş kurallarıyla parity gösterir;
public-to-client ve localized alanlar negatif testlerden geçer.

### Redesign Faz 8 — Takvim ve finans

- Calendar range ve finance API gruplarını tamamla.
- Month/agenda takvim, gün detail'i ve native event formunu kur.
- Finance summary, transaction list/detail ve modal create/edit akışını kur.
- AI finance analysis'i ayrı sheet + retry/error state olarak ekle.

**Çıkış kapısı:** Timezone/DST, minor money unit, duplicate mutation ve sensitive
log testleri geçer; hiçbir ham project/client ID input'u kalmaz.

### Redesign Faz 9 — Günlük ve AI

- Journal ve chat/risk API gruplarını tamamla.
- Günlük trend/list/detail ve modal kayıt akışını kur.
- AI session navigation, streaming message list, composer keyboard ve cancel/retry
  davranışlarını profesyonel shell'e taşı.
- Journal/chat sensitive content logging ve snapshot politikasını doğrula.

**Çıkış kapısı:** Uzun chat performansı, auto-scroll, keyboard ve stream abort
testleri; journal privacy kontrolleriyle geçer.

### Redesign Faz 10 — Ayarlar, dil ve dosya/medya

- Settings hub ve Account/Workspace/Content & Media gruplarını kur.
- Profile/security/preferences/general/appearance/AI API'lerini tamamla.
- Dil yönetimi ve translation editor'ı `Ayarlar` altına taşı.
- Dosya/medya ve branding/project asset yönetimini `Ayarlar` ve bağlamsal proje
  detail altına taşı.
- Document picker, upload progress/cancel/retry ve asset authorization testlerini yap.

**Çıkış kapısı:** Ana navigation'da language/files route'u yoktur; ayarlar altından
erişilir, büyük translation listesi virtualized çalışır ve upload native build'de geçer.

### Redesign Faz 11 — Client portal

- Portal API grubunu session-derived client scope ile tamamla.
- Portal bottom navigation/top bar/others sheet'i owner ile aynı kalite dilinde kur.
- Dashboard, project detail, public task, revision ve kişisel ayar akışlarını yenile.
- Revision request ve profil/güvenlik formlarını modal yap.

**Çıkış kapısı:** Başka client ID'si ile veri erişimi her endpoint'te negatif test
edilir; portal owner menü ve mutation'larını bundle/UI içinde açığa çıkarmaz.

### Redesign Faz 12 — Native stabilite, performans ve release

- iOS haptic console uyarısını simulator/release/fiziksel cihaz matrisiyle sınıflandır.
- Cold/warm start, tab switch, list scroll, modal open ve keyboard latency ölç.
- Gereksiz render, unbounded list/image ve JS-thread bloklarını temizle.
- iOS pods ve Android autolinking native dependency release gate'ini çalıştır.
- VoiceOver, TalkBack, maximum font, contrast, reduced motion, rotation ve küçük
  cihaz manuel matrisi tamamla.
- Fork deployment, env, bundle ID, signing, EAS/local build ve upgrade runbook'u yaz.

**Çıkış kapısı:** Release build iki platformda crash/native-module error olmadan
açılır; zorunlu kullanıcı akışları gerçek API ile geçer; kritik a11y/performance
kusuru ve production console exception kalmaz.

## 11. Her faz için değişmez kalite kapıları

- Web API + mobile contract aynı payload üzerinde test edilir.
- Typecheck, lint, unit/integration ve production bundle geçer.
- Loading, empty, error, offline, stale ve success state'i görülür.
- Light/dark, maximum font ve 48dp target kontrol edilir.
- Form varsa küçük cihaz keyboard testi yapılır.
- Route varsa back/deep-link/focus restoration testi yapılır.
- Liste büyüyebiliyorsa cursor/range + virtualization uygulanır.
- Secret, password, finance, journal ve chat payload'ı loglanmaz.
- Yeni dependency için native rebuild, bundle maliyeti ve kaldırma alternatifi yazılır.
- Faz ancak gerçek simulator/cihaz kanıtı varsa tamamlanır; placeholder ve mock
  production acceptance sayılmaz.

## 12. Başarı tanımı

Redesign tamamlandığında kullanıcı:

- Domain girmeden kendi fork'una ait branded onboarding/login'i görür.
- Owner veya portal rolüne göre doğru profesyonel shell'e girer.
- Ana iş alanlarına alt menüden, ikincil alanlara `Diğer` sheet'inden ulaşır.
- Liste ve detail ekranları arasında doğal native geçişler yaşar.
- Her create/edit formunu erişilebilir modal içinde, klavyeye hiçbir alan
  kaybetmeden tamamlar.
- Tutarlı toast ve info box geri bildirimi alır.
- Dil ve dosya/medya yönetimini yalnız Ayarlar altında bulur.
- Ticari kayıtlarla karşılaşmaz.
- Light/dark, büyük font ve assistive technology ile aynı işi tamamlayabilir.

## 13. Teknik referanslar

- [Expo SDK 57 Router API](https://docs.expo.dev/versions/v57.0.0/sdk/router/)
- [Expo Router modal ve native formSheet](https://docs.expo.dev/router/advanced/modals/)
- [Expo Router custom tabs](https://docs.expo.dev/router/advanced/custom-tabs/)
- [Expo Native Tabs alpha durumu](https://docs.expo.dev/router/advanced/native-tabs/)
- [Expo environment variables](https://docs.expo.dev/eas/environment-variables/manage/)
- [React Native KeyboardAvoidingView](https://reactnative.dev/docs/keyboardavoidingview)
- [Apple Developer Forums: simulator haptic pattern uyarısı](https://developer.apple.com/forums/thread/812392)
