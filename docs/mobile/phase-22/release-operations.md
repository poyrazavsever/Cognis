# Release, staged rollout, rollback ve hotfix prosedürü

Son güncelleme: 2026-07-29

## Sürüm modeli

- App semver, iOS build number, Android versionCode ve API version ayrı artırılır.
- Aynı store version için her yeni binary build number/versionCode artırır.
- Mobil bu sürümde yalnız API major v1 kabul eder. Instance
  `minimumSupportedVersion` değeri mevcut app'ten yüksekse bağlantı durdurulur.
- Native module/config değişikliği yeni binary gerektirir. OTA altyapısı ayrıca
  kurulup runtime version sabitlenmeden OTA release yapılmaz.

## Release candidate kapısı

1. Temiz checkout ve frozen lockfile install.
2. `pnpm mobile:release:check`.
3. Production environment ile iOS ve Android Metro export.
4. Signed iOS/Android build; dependency, permission ve privacy manifest incelemesi.
5. Gerçek reverse-proxy self-host smoke; owner ve portal E2E matrisi.
6. VoiceOver/TalkBack, font, keyboard, rotation, tablet ve performance matrisi.
7. TestFlight ve Play Internal Testing acceptance.
8. Privacy/support URL, store formları, metadata ve screenshot onayı.

CI kod seviyesi kapıları ve iki platform JS export'unu uygular. Signing, credential,
store upload ve gerçek cihaz kabulü yetkili release owner tarafından yürütülür.

## Staged rollout

- Önce internal tester, sonra küçük production cohort, ardından hata oranı ve
  support sinyali stabilse kademeli artış.
- Her aşamada login/connect başarı oranı, crash-free sessions ve server API hata
  dağılımı yalnız yayınlanmış privacy/opt-in sınırında değerlendirilir.
- Self-host outage veya tek instance sorunu global app rollout'unu otomatik
  durdurmaz; API v1 veya auth regression birincil stop koşuludur.

## Rollback

- Store binary geri çekilemiyorsa rollout duraklatılır ve önceki onaylı sürümün
  dağıtımı korunur.
- Server yeni API alanlarını geriye uyumlu tutar; mobil v1 müşterileri çalışırken
  response alanları veya endpoint'ler ani kaldırılmaz.
- `minimumSupportedVersion` rollback aracı değildir. Yalnız kritik güvenlik veya
  protokol zorunluluğunda, önce yeni binary mağazada erişilebilirken yükseltilir.
- Hatalı server rollout geri alınırken instance ID, cookie/session key ve token
  epoch istemeden değiştirilmez.

## Hotfix

1. Etki ve veri güvenliği sınıflandırılır; capability kapatma mümkünse önce o
   uygulanır.
2. En küçük patch hazırlanır; normal release gate atlanmaz.
3. Build number/versionCode artırılır ve internal smoke tekrarlanır.
4. Expedited store review gerekiyorsa kullanıcı etkisi ve workaround açık yazılır.
5. Release sonrası neden, etki, detection gap ve kalıcı test blameless postmortem'e
   kaydedilir; secret veya kişisel veri eklenmez.
