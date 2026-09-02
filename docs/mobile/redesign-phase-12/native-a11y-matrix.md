# Native, performans ve erişilebilirlik kabul matrisi

Son güncelleme: 2026-07-29

## Otomatik ve yerel kanıt

| Alan | Ortam | Sonuç | Kanıt |
| --- | --- | --- | --- |
| Android native compile | Debug, API 36 | Geçti | `./gradlew app:assembleDebug` |
| Android native compile | Release, API 36 | Geçti | `./gradlew app:assembleRelease --no-parallel` |
| iOS native compile | Debug, iOS 26.5 Simulator SDK | Geçti | `xcodebuild ... Debug ... build` |
| iOS native compile | Release, iOS 26.5 Simulator SDK | Geçti | `xcodebuild ... Release ... build` |
| iOS native launch | Release, iPhone 17 Pro Simulator | Geçti | `simctl install` + `simctl launch` |
| iOS Pods | Local locked install | Geçti | Podfile.lock = Manifest.lock |
| Document picker | Android/iOS target graph | Geçti | Expo autolinking + CocoaPods |
| Native date picker | Android/iOS target graph | Geçti | PackageList + RNDateTimePicker pod |
| JS production bundle | Android/iOS Hermes | Geçti | `expo export --platform all` |
| Static accessibility | Source gate | Geçti | `pnpm a11y:check` |
| Contrast tokens | Unit test | Geçti | light/dark semantic token tests |
| Reduce motion | Source + unit policy | Geçti | shell/modal animation guards |
| Keyboard containment | Form primitive | Geçti | KAV + auto insets + focus reveal |

## Haptic matrisi

| Ortam | Beklenti | Sınıflandırma |
| --- | --- | --- |
| Güncel iOS Simulator Debug | OS mesajı görülebilir; crash/donma olmamalı | P3 console-only simulator uyarısı |
| iOS Simulator Release | App haptic çağrısı yok; akış çalışmalı | Mesaj tek başına release blocker değil |
| Fiziksel iPhone Release | Mesaj ve input gecikmesi beklenmez | Tekrar oluşursa P1/P2 olarak yeniden aç |
| Android release | Core Haptics uygulanmaz | İlgisiz |

## Store adayı manuel matrisi

Bu tablo her signed release candidate için gerçek cihazda doldurulur. Repository
credential, e-posta, müşteri adı, instance token'ı veya cihaz identifier'ı içermez.

| Kontrol | iPhone küçük ekran | iPhone büyük ekran | Android küçük ekran | Android büyük/tablet |
| --- | --- | --- | --- | --- |
| Onboarding → login | ☐ | ☐ | ☐ | ☐ |
| Owner shell + Others sheet | ☐ | ☐ | ☐ | ☐ |
| Portal shell, owner linki yok | ☐ | ☐ | ☐ | ☐ |
| Form son alanı klavye üstünde | ☐ | ☐ | ☐ | ☐ |
| VoiceOver/TalkBack sırası | ☐ | ☐ | ☐ | ☐ |
| Maximum font, içerik kaybı yok | ☐ | ☐ | ☐ | ☐ |
| Light/dark ve kontrast | ☐ | ☐ | ☐ | ☐ |
| Reduced Motion | ☐ | ☐ | ☐ | ☐ |
| Portrait/landscape rotation | ☐ | ☐ | ☐ | ☐ |
| Document picker upload/cancel/retry | ☐ | ☐ | ☐ | ☐ |
| Native date/time picker | ☐ | ☐ | ☐ | ☐ |
| Cold/warm/tab/modal/keyboard bütçesi | ☐ | ☐ | ☐ | ☐ |
| Production console exception yok | ☐ | ☐ | ☐ | ☐ |

## Severity

- P0: veri veya yetki ihlali; release durur.
- P1: crash, login engeli, formun tamamlanamaması; release durur.
- P2: ciddi erişilebilirlik veya tekrarlanan frame/keyboard bütçe aşımı; release durur.
- P3: kullanıcı etkisi olmayan simulator/OS console uyarısı; kayda alınır, tek başına
  release durdurmaz.
