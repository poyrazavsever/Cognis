# Neta Mobile Fork'unu Özelleştirme

[English](CUSTOMIZATION.md) · **Türkçe**

Her Neta Mobile fork'u tek bir self-hosted çalışma alanını temsil eder. Fork
kimliği build-time konusudur; workspace branding ve dil metadata'sı configured
server'dan runtime'da gelebilir.

## 1. Environment dosyasını oluşturun

```sh
cp apps/neta-mobile/.env.example apps/neta-mobile/.env
```

| Değişken | Amaç | Örnek |
| --- | --- | --- |
| `EXPO_PUBLIC_APP_ENV` | `development`, `preview` veya `production` | `production` |
| `EXPO_PUBLIC_NETA_ORIGIN` | Path içermeyen HTTPS origin | `https://neta.example.com` |
| `NETA_APP_NAME` | Store ve cihazdaki uygulama adı | `Acme Neta` |
| `NETA_APP_SLUG` | Expo proje slug'ı | `acme-neta` |
| `NETA_APP_SCHEME` | Deep-link scheme | `acmeneta` |
| `NETA_IOS_BUNDLE_ID` | Benzersiz iOS kimliği | `com.acme.neta` |
| `NETA_ANDROID_PACKAGE` | Benzersiz Android package | `com.acme.neta` |
| `NETA_APP_VERSION` | Public semantic sürüm | `1.0.0` |
| `NETA_IOS_BUILD_NUMBER` | Artan iOS build numarası | `1` |
| `NETA_ANDROID_VERSION_CODE` | Artan Android version code | `1` |

`EXPO_PUBLIC_*` değişkenlerine yalnız public ve gizli olmayan config yazılır.

## 2. Görsel varlıkları değiştirin

`apps/neta-mobile/assets/logo/` altındaki dosyaları, kullanılan dosya adlarını ve
formatları koruyarak değiştirin. Ana uygulama ikonu `iconLogo.png` dosyasıdır;
`app.config.ts` bunu adaptive icon ve splash için de kullanır. Asset
değişikliğinden sonra config ve native build kontrollerini çalıştırın.

Runtime primary/accent renkleri, light/dark logolar ve varsayılan renk modu
server sunduğunda `/api/v1/meta` üzerinden gelir. Local semantic tokenlar
erişilebilir fallback'tir; ekranlarda raw renklerle değiştirilmemelidir.

## 3. Server'ı doğrulayın

Origin şunları sunmalıdır:

- `/.well-known/neta`
- `/api/v1/health`
- `/api/v1/meta`
- `/api/v1/localization/catalog`
- Better Auth native sign-in/sign-out
- `apps/neta-mobile/src/features` tarafından kullanılan authenticated owner/portal route'ları

Public bootstrap smoke testini çalıştırın:

```sh
pnpm --filter @neta/mobile instance:smoke
```

Feature acceptance gerçek owner/client test hesaplarıyla ve cross-tenant negatif
testlerle yapılmalıdır. Public smoke testinin geçmesi feature API'nin tamam
olduğu anlamına gelmez.

## 4. Native projeleri doğrulayın

```sh
pnpm --filter @neta/mobile ios:pods
pnpm --filter @neta/mobile native:verify
pnpm mobile:release:check
pnpm --filter @neta/mobile native:build:android
pnpm --filter @neta/mobile native:build:ios
```

Scheme, bundle ID, package name, icon veya config plugin değişikliği yeni native
binary gerektirir. Env veya workspace dependency değişikliğinden sonra Metro'yu
`pnpm mobile:start:clear` ile yeniden başlatın.

## 5. EAS ve store ayarları

`apps/neta-mobile/eas.json` development, preview ve production profillerini tanımlar. Yeni
fork'ta demo origin'i değiştirin veya adlandırılmış EAS environment'ını
yapılandırın. Signing credential, API key ve store credential'ları Git'e değil,
platform/EAS secret store'larına yazılır.

Release öncesinde privacy/support URL'lerini, ekran görüntülerini, açıklamaları,
app review hesabını ve native build numaralarını güncelleyin. Fiziksel cihaz
matrisini `docs/mobile/redesign-phase-12/native-a11y-matrix.md` içinde tamamlayın ve
[release runbook'u](../../docs/mobile/redesign-phase-12/fork-release-runbook.md) izleyin.
