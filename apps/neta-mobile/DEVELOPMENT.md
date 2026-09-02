# Neta Mobile uygulaması

Bu klasör Expo SDK 57 tabanlı iOS/Android uygulamasını içerir. Genel proje
tanıtımı, production durumu ve dil seçimi için [ana README'ye](README.md),
fork ayarları için [özelleştirme rehberine](CUSTOMIZATION.tr.md) bakın.

Komutları mümkün olduğunca repository kökünden çalıştırın:

```sh
pnpm mobile:start
pnpm mobile:start:clear
pnpm mobile:ios
pnpm mobile:android
pnpm check
```

iOS için bir kez Homebrew Ruby 3.4 kurulmalıdır:

```sh
brew install ruby@3.4
```

`pnpm mobile:ios` önce `ios:pods` scriptini çalıştırır; Bundler ve CocoaPods
sürümleri `Gemfile.lock` ile sabittir. Yalnız Pod kurulumunu yenilemek için
`pnpm --filter @neta/mobile ios:pods` kullanılabilir. Expo prebuild sırasında
yerel config plugin'i Unicode repository yollarını (`Yazılım` gibi) ve Expo Dev
Launcher build phase ayarını otomatik uygular.

`pnpm mobile:start:clear`, Metro cache'i temizleyerek başlatır. Workspace
paketi eklendikten veya token bridge'i değiştikten sonra görülen eski HMR
hatalarında bunu bir kez çalıştırın.

`metro.config.cjs`, workspace paketleri için `@neta/api-contracts` ve
`@neta/design-tokens` alias'larını açıkça çözer. Yeni workspace paketi
ekledikten sonra çalışan Metro server'ı yine de yeniden başlatılmalıdır.

Kurulumda örnek environment dosyasını kopyalayıp fork'un Neta origin'ini yazın:

```sh
cp apps/neta-mobile/.env.example apps/neta-mobile/.env
```

`EXPO_PUBLIC_NETA_ORIGIN` yalnız origin kabul eder. Uygulama domain'i
kullanıcıdan istemez; discovery, health, meta, API ve auth URL'leri bu tek
build değerinden türetilir. Development'ta env verilmezse simulator kolaylığı
için `http://localhost:3000` kullanılır. Preview/production config origin
eksikken veya HTTP iken bilinçli olarak başarısız olur.

Fork kimliği `NETA_APP_NAME`, `NETA_APP_SLUG`, `NETA_APP_SCHEME`,
`NETA_IOS_BUNDLE_ID` ve `NETA_ANDROID_PACKAGE` ile değiştirilir. Bunlar secret
değildir; API key, password ve token hiçbir `EXPO_PUBLIC_*` değerine yazılmaz.

Phase 2 tasarım sistemi `packages/design-tokens` paketinden beslenir.
Native primitive'ler `src/components/ui` altındadır ve React Native
`StyleSheet` ile yazılır; ek UI/styling framework kullanılmaz.

Release öncesi native dependency ve iki platform derlemesi:

```sh
pnpm --filter @neta/mobile native:verify
pnpm --filter @neta/mobile fork:config-smoke
pnpm --filter @neta/mobile native:build:android
pnpm --filter @neta/mobile native:build:ios
```

Fork, signing, EAS ve store adımları için
[`docs/mobile/redesign-phase-12/fork-release-runbook.md`](../../docs/mobile/redesign-phase-12/fork-release-runbook.md)
belgesini izleyin.
