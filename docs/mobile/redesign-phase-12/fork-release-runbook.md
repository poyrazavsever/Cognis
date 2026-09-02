# Fork deployment ve release runbook

Son güncelleme: 2026-07-29

## 1. Gereksinimler

- Node.js 24 (`.nvmrc`)
- pnpm 11.x
- Android SDK 36 ve JDK 17
- iOS için Xcode 26.4+ ve repository'de sabitlenen Ruby/CocoaPods kurulumu
- HTTPS üzerinden çalışan, mobil API v1 route'larını sunan Neta instance

## 2. Fork kimliği ve environment

```sh
cp apps/neta-mobile/.env.example apps/neta-mobile/.env.local
```

En az şu değerleri fork'a göre değiştirin:

```dotenv
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_NETA_ORIGIN=https://neta.example.com
NETA_APP_NAME=Example Neta
NETA_APP_SLUG=example-neta
NETA_APP_SCHEME=exampleneta
NETA_IOS_BUNDLE_ID=com.example.neta
NETA_ANDROID_PACKAGE=com.example.neta
NETA_APP_VERSION=1.0.0
NETA_IOS_BUILD_NUMBER=1
NETA_ANDROID_VERSION_CODE=1
```

`EXPO_PUBLIC_*` değerleri bundle içinden okunabilir; API key, parola, token veya
başka secret bu prefix ile tanımlanmaz. Origin yalnız HTTPS origin olmalı; path,
query, fragment ve credential kabul edilmez.

## 3. Kurulum ve doğrulama

```sh
pnpm install --frozen-lockfile
pnpm --filter @neta/mobile ios:pods
pnpm --filter @neta/mobile release:check
pnpm --filter @neta/mobile native:verify
pnpm --filter @neta/mobile fork:config-smoke
```

Native dependency değişikliğinde dev client yeniden derlenir. Eski binary ile
yalnız Metro restart yapmak `ExpoDocumentPicker` veya `RNDateTimePicker` gibi
modülleri eklemez.

## 4. Local native build

```sh
pnpm --filter @neta/mobile native:build:android
pnpm --filter @neta/mobile native:build:ios
```

Store build için Android signing config ve Apple Team/provisioning fork sahibine
ait olmalıdır. Keystore, `.p8`, certificate, provisioning profile ve EAS token
repository'ye commit edilmez.

## 5. EAS kurulumu

1. Fork sahibinin Expo hesabıyla `eas login` çalıştırın.
2. `apps/neta-mobile` klasöründe `eas init` ile fork'a ait project ID oluşturun.
3. EAS environment'larında `development`, `preview`, `production` değerlerini
   tanımlayın. Public olmayan secret'ları sensitive/secret visibility ile saklayın.
4. `eas.json` profilleri aynı adlı environment'a bağlıdır.
5. Internal build alın:

```sh
cd apps/neta-mobile
eas build --profile preview --platform all
```

6. Signed production build yalnız manuel matrisi geçen commit'ten alınır:

```sh
eas build --profile production --platform all
```

## 6. Zorunlu gerçek API smoke

- İlk açılışta domain alanı olmadan branded onboarding ve login görünür.
- Doğru owner hesabı owner shell'e; client hesabı portal shell'e gider.
- Client, başka client verisini ve owner route/mutation'larını göremez.
- Client/project/task create-edit-delete, takvim, finans, günlük ve ayarlar gerçek
  API yanıtıyla çalışır.
- Document upload/cancel/retry ve native date picker signed binary'de denenir.
- Offline/error/retry durumları sahte başarı üretmez.

## 7. Sürümleme ve gönderim

- Kullanıcıya görünen sürüm için `NETA_APP_VERSION` semver artırılır.
- Her yeni iOS binary için `NETA_IOS_BUILD_NUMBER`, Android binary için
  `NETA_ANDROID_VERSION_CODE` artırılır.
- TestFlight ve Play Internal Testing sonucu tamamlanmadan staged rollout açılmaz.
- Privacy/support metadata ve ekran görüntüleri fork markasına göre güncellenir.

## 8. Upgrade

1. Upstream değişikliklerini ayrı branch'e alın.
2. Lockfile ve Expo SDK sürümünü değiştirmeden önce versioned Expo docs/changelog'u
   okuyun.
3. `npx expo install --check`, `pnpm mobile:release:check`, pod install ve iki native build
   çalıştırın.
4. Native module/config değişmişse yeni binary yayınlayın; yalnız JS değişikliği
   olduğu varsayımıyla eski dev client kullanmayın.
5. API minimum mobile version değerini yeni binary mağazada erişilebilir olmadan
   yükseltmeyin.

## 9. Rollback

- Store rollout'u duraklatın; son onaylı binary dağıtımını koruyun.
- Backend API v1 alanlarını geriye uyumlu tutun ve problemli backend rollout'u geri
  alın.
- `minimumSupportedVersion` değerini rollback aracı olarak kullanmayın.
- Hotfix'te de `release:check`, native build ve zorunlu smoke adımları atlanmaz.
