# Redesign Faz 12 — Native stabilite, performans ve release

Son güncelleme: 2026-07-29

Durum: Kod, otomatik kalite kapıları, iki platform native derlemesi ve fork
operasyon dokümanı tamamlandı. Store yayını için fiziksel cihaz ve gerçek backend
acceptance adımları release owner tarafından imzalanmalıdır.

## Tamamlanan işler

- Cold/warm shell ve dashboard ölçümlerine tab switch, modal first-paint, keyboard
  açılışı ve aktif liste frame örnekleri eklendi.
- Ölçümler yalnız 100 kayıtlık process-memory ring buffer'da tutulur; console,
  analytics, disk veya ağa yazılmaz.
- Chat stream güncellemeleri 50 ms toplu uygulanır, uzun mesaj listesi windowed
  render kullanır ve kullanıcı geçmişi okurken otomatik aşağı çekilmez.
- Calendar ve journal altı haftalık range ile; finance ay filtresiyle; API listeleri
  cursor/page kontratıyla sınırlandırılmıştır. Translation ve portal listeleri
  `FlatList` kullanır.
- `native:verify` Pod/autolinking, lock senkronu, iOS config-plugin düzeltmesi ve
  onaysız haptic kullanımını tek komutta kontrol eder. Android gate yalnız Gradle
  ayarını değil, Expo ve React Native autolinking çözümlemesindeki gerçek native
  modül kayıtlarını da doğrular.
- Fork kimliği, origin, semver, iOS build number ve Android version code env ile
  doğrulanır. Production HTTPS zorunluluğu ve örnek fork kimlikleri otomatik config
  smoke testinden geçer. EAS profilleri açık environment adlarına bağlandı.
- Production release gate Faz 12 dokümanlarını ve secretsız kaynak politikasını
  zorunlu tutar.

## Performans bütçeleri

| Ölçüm | Bütçe |
| --- | ---: |
| Cold shell | 3000 ms |
| Warm shell | 1200 ms |
| Dashboard data | 2000 ms |
| Tab switch | 350 ms |
| Modal first paint | 500 ms |
| Keyboard open | 400 ms |
| Aktif liste frame aralığı | 34 ms |

Bu değerler dev-client değil release candidate üzerinde değerlendirilir. API
ölçümü gerçek self-host instance gerektirir; mock yanıt kabul edilmez.

## Native kanıt

- Android `app:assembleDebug`: başarılı.
- Android `app:assembleRelease`: başarılı.
- iOS Simulator `Neta` Debug build, signing kapalı: başarılı.
- iOS Simulator `Neta` Release build, signing kapalı: başarılı.
- iOS Simulator Release install ve process launch: başarılı.
- iOS target graph: `ExpoDocumentPicker` ve `RNDateTimePicker` linkli.
- Android autolinking: `expo-document-picker` ve `RNDateTimePickerPackage` kayıtlı.
- `ios/Podfile.lock` ile `ios/Pods/Manifest.lock`: senkron.
- Android APK ve iOS Simulator `.app` artefact'ları üretildi.

Release-konfigürasyon build kapısı `native:build:*` komutlarıyla
tekrarlanabilir. Store-signed fiziksel cihaz sonucu repository'ye
credential veya device identifier yazılmadan release kaydına eklenir.

## Haptic uyarısı sınıflandırması

Uygulamada `expo-haptics`, React Native `Vibration` veya Core Haptics çağrısı
yoktur. `CHHapticPattern ... hapticpatternlibrary.plist` mesajı simulator/runtime
tarafından üretildiğinde console-only OS uyarısıdır; uygulama bundle'ına sahte plist
eklenmez ve private framework patch'lenmez. Crash, input donması veya fiziksel
cihaz tekrar üretimi görülürse bu sınıflandırma yeniden açılır.

## Teslimler

- [Native ve erişilebilirlik matrisi](native-a11y-matrix.md)
- [Fork ve release runbook](fork-release-runbook.md)
- `mobile/scripts/native-release-gate.mjs`
- `mobile/scripts/fork-config-smoke.mjs`
- `mobile/scripts/redesign-phase12-gate.mjs`

Backend `/api/v1` feature route'ları hazır olmadan gerçek API acceptance ve store
production yayını bloklanır; mobil istemci demo veri veya sahte başarı üretmez.
