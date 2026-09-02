# Redesign Faz 8–11 — Owner araçları, ayarlar ve portal

Durum: Mobil deneyimler tamamlandı; ilgili web `/api/v1` route grupları production
release için açık backend kapısıdır.

## Faz 8 — Takvim ve finans

- Takvim ay/agenda görünümü pull-to-refresh ve native tarih-saat modal formuyla
  ayrıştırıldı.
- Calendar formundaki müşteri, proje ve görev ham ID alanları relation picker oldu.
- Finans ay özeti, tür filtresi, detay/edit yönlendirmesi ve minor-unit formu kuruldu.
- Finans create/edit/delete ayrı keyboard-safe modal route'a taşındı.
- AI finans analizi loading/error/retry durumlu erişilebilir sheet olarak sunuldu.

## Faz 9 — Günlük ve AI

- Günlük takvim/list görünümü ile create/edit/delete modal route'a ayrıldı.
- Aylık ruh hali, enerji ve memnuniyet eğilimleri özel not içeriğini işlemeden özetlenir.
- Günlük notu notification preview, telemetry ve liste metadata'sından ayrı tutuldu.
- Chat uzun mesaj listesi virtualized kaldı; stream cancel/retry ve keyboard-aware
  composer korundu; kullanıcı geçmişi okurken stream zorla en alta kaydırmaz.
- Proje riskinde ham ID girişi kaldırılıp proje relation picker kullanıldı.

## Faz 10 — Ayarlar, dil ve dosya

- Ayarlar altında `İçerik ve medya` hub'ı; Dil Yönetimi ile Dosya ve Medya
  bağlantılarını tek yerde topladı.
- Profil, güvenlik/oturumlar, tercihler, workspace, görünüm/marka ve AI ayarları
  owner-only, keyboard-safe modal route'lara bağlandı.
- Translation editor `FlatList` virtualization, keyboard inset ve import/export
  davranışlarını korur.
- Dosya ekranındaki ham Project ID kaldırıldı; proje relation picker kullanılır.
- Document picker yalnız kullanıcı aksiyonuyla lazy açılır; MIME/boyut validation,
  upload progress/cancel/retry mevcut upload panelinde korunur.
- Marka görselleri de native picker ve istemci tarafı MIME/boyut doğrulamasıyla
  yüklenir, değiştirilebilir veya kaldırılabilir; dönen asset URL'si instance
  origin'i ve istenen asset türüyle eşleşmeden kabul edilmez.

## Faz 11 — Client portal

- Portal proje detayı yalnız session-derived client scope API'lerini çağırır.
- Proje detail yanıtındaki resource, public task ve revision proje kimlikleri
  istenen proje scope'u ile eşleşmeden UI'a alınmaz; asset URL'leri yalnız aynı
  instance origin'inden kabul edilir.
- Revizyon talebi client-only modal route'a taşındı.
- Profil ve şifre değişikliği client-only modal route'lara taşındı.
- Portal ayarları profil, güvenlik, görünüm ve dil hub'ına dönüştürüldü.
- Owner route ve mutation'ları portal navigation/UI içinde sunulmaz.

## Backend release kapısı

Salt okunur incelenen web repository'sinde bu fazların `/api/v1/calendar`,
`finance`, `journal`, `chat`, `settings`, `files` ve `portal` route grupları henüz
bulunmuyor. Mobil uygulama beklenen typed contract'lara request gönderir; 404 veya
uyumsuz contract halinde açık error state gösterir. Demo veri veya sahte başarı
üretmez.

Production kabulü için web route'larının actor scope, cross-client negatif test,
range/cursor sınırı, idempotency, upload authorization ve redacted error testleriyle
ayrı backend tesliminde tamamlanması zorunludur.

## Native doğrulama

- Android `app:assembleDebug` başarıyla tamamlandı; Expo Document Picker ve RN Date
  Time Picker autolinking çıktısında ve üretilen APK hedefinde yer aldı.
- iOS `Neta` simulator Debug build code signing kapalı olarak başarıyla tamamlandı;
  `ExpoDocumentPicker` ve `RNDateTimePicker` pod hedefleri uygulamaya linklendi.
- `Podfile.lock` ile `Pods/Manifest.lock` senkron doğrulandı.
