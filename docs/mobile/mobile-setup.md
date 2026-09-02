# Neta Mobile kurulum kararları

Son güncelleme: 2026-07-29

## Sabitlenen taban

| Bileşen | Sürüm/karar |
| --- | --- |
| Expo | SDK 57 (stable) |
| React Native | 0.86.0 |
| React | 19.2.3 |
| TypeScript | 6.0 strict |
| Node.js | 24 LTS; destek aralığı `>=24 <25` |
| pnpm | 11.5.1 |
| Ruby/CocoaPods | Ruby 3.4.10 + CocoaPods 1.16.2; `Gemfile.lock` ile sabit |
| Routing | Expo Router typed routes |
| Native mimari | Expo development build + New Architecture |
| UI | `packages/design-tokens` + React Native `StyleSheet`; ek styling framework yok |
| Native date/time | Expo SDK 57 uyumlu `@react-native-community/datetimepicker` 9.1.0 |
| Test | Node 24 type-stripping + yerleşik test runner; ek test runner yok; 88 unit/contract test |

Sürümler Expo'nun SDK 57 uyumluluk matrisi ve resmi `default@sdk-57`
şablonu temel alınarak lockfile'a sabitlenir. Canary/beta paket kullanılmaz.

## Bağımlılık politikası

Bir paket yalnız aşağıdaki koşullardan biri sağlanıyorsa eklenir:

1. Expo Router veya React Native runtime için zorunludur.
2. Ana plandaki güvenlik/veri sınırını uygular (`SecureStore`, `AsyncStorage`).
3. Platform API'sinin güvenilir ortak yüzeyini sağlar (`NetInfo`, safe area).
4. Native development build için gereklidir (`expo-dev-client`).

State, form, query, chart, UI kit ve animation bağımlılıkları ihtiyaç duyulan
fazdan önce eklenmez.

## Klavye ve erişilebilirlik baseline'ı

Ortak `Screen` primitive'i form ekranlarında safe area içinde native
`KeyboardAvoidingView` ve kaydırılabilir içerik kullanır. iOS interaktif,
Android drag ile keyboard dismissal uygular; Android native config
`softwareKeyboardLayoutMode: resize` kullanır. `TextField` label, hata ilişkisi,
invalid state ve live-region davranışını merkezileştirir. Yeni ekranlar bu
primitive'leri atlayamaz. Manuel cihaz matrisi ve acceptance adımları
`docs/mobile-accessibility-baseline.md` içindedir.

## Tasarım sistemi

Semantik renk, spacing, radius, typography ve shadow değerleri
`packages/design-tokens` paketindedir. Mobil taraf bu değerleri
`mobile/src/theme/tokens.ts` üzerinden yeniden export eder. Böylece web DOM
component'leri mobile taşınmadan ortak tasarım dili korunur.

Phase 2'de eklenen `createThemeTokens(mode, brandColors)` fonksiyonu instance
metadata'sından gelecek `primary` ve `accent` renklerini normalize eder ve
foreground rengini kontrast hesabıyla seçer. Neta'nın varsayılan ana rengi
kırmızıdır; discovery sonrası instance branding bu semantik rolleri ezebilir.

## API kontratları

Transport-safe API tipleri ve type guard'lar `packages/api-contracts` paketinde
tutulur. Mobil resource client bu kontratları parser olarak kullanır; ekranlar
ham `fetch` çağırmaz.

İlk cache/query standardı bağımlılık eklemeden kuruldu:

```ts
[instanceId, userId, role, locale, resource, filters]
```

TanStack Query, gerçek feature sayısı ve invalidation ihtiyacı arttığında tekrar
değerlendirilecek. Şimdilik küçük AsyncStorage TTL cache yeterli.

## iOS Pod ve Xcode kurulumu

Apple Silicon ortamında Ruby 3.4 bir kez kurulur:

```sh
brew install ruby@3.4
pnpm --filter @neta/mobile ios:pods
```

`pnpm mobile:ios` bu Pod adımını otomatik çalıştırır. Proje Ruby/CocoaPods
sürümlerini `mobile/Gemfile.lock` ile sabitler ve gem'leri repository içindeki
ignore edilen `mobile/vendor/bundle` klasörüne kurar.

Repository yolundaki Türkçe/Unicode karakterler bazı CocoaPods podspec
işlemlerinde `ASCII-8BIT`/`UTF-8` uyuşmazlığına neden olabildiği için
`with-neta-ios-fixes.cjs` Podfile'a yalnız üretim sırasında bir encoding
normalizasyonu ekler. Aynı plugin Expo Dev Launcher'ın release key temizleme
build phase'ini açıkça her build'de çalışacak şekilde işaretler. Böylece
`expo prebuild` sonrasında elle Xcode veya Podfile düzenlemesi gerekmez.

## Environment

Public build-time değerleri `EXPO_PUBLIC_*` adıyla verilir. Secret değerler
mobil bundle'a konmaz. Self-host instance origin'i build-time environment
değildir; kullanıcı bağlantı ekranında girer ve discovery ile doğrulanır.

## Henüz tamamlanmayan Faz 0 işleri

Bu repository'de web/backend kaynakları bulunmadığından aşağıdakiler henüz
kanıtlanamaz:

- Route, Server Action, DomainService ve schema envanteri.
- Better Auth Expo multi-domain gerçek cihaz spike'ı.
- İki instance arasında cookie/session izolasyonu.
- ADR-0018 ve portal auth lifecycle güncellemesi.
- Mevcut Poyraz UI tokenlarının kaynak web uygulamasından çıkarılması.

Bu işler için web/backend repository'si veya erişilebilir bir test Neta
instance'ı gereklidir. Mobil bootstrap bunları tamamlanmış saymaz.

## Doğrulama durumu

2026-07-29 tarihinde:

- `pnpm --filter @neta/mobile release:check` geçti (lint, strict typecheck, 88
  unit/contract test, i18n, accessibility, public config ve production guard).
- Expo Doctor 20/20 kontrolü geçti.
- iOS production JS bundle'ı Metro ile üretildi.
- Android production JS bundle'ı Metro ile üretildi.
- CocoaPods `Podfile.lock` ve `Pods/Manifest.lock` birebir eşleşti.
- Debug iOS simulator native build'i `xcodebuild` ile başarıyla tamamlandı.
- `git diff --check` geçti.

İmzalı dağıtım build'i bu aşamanın kapsamında değildir; simulator development
build'i imzasız doğrulanmıştır.
