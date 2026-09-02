# Faz 22 — Production hardening ve store release

Son güncelleme: 2026-07-29

## Mobil repository'de tamamlananlar

- `release:check`; lint, strict typecheck, unit/contract, i18n, accessibility,
  public config ve production guard kapılarını birleştirir.
- CI production environment ile release gate ve iOS/Android Metro export çalıştırır.
- Production guard console logging, public secret environment adı, izinsiz
  telemetry/crash SDK'sı, eksik build number ve zorunlu release dokümanını reddeder.
- API major v1 ve `minimumSupportedVersion` uyumluluk sınırları testlidir.
- Credential/JWT/reset/invitation token içerebilen hata mesajları güvenli genel
  mesaja redakte edilir.
- iOS build number ve Android versionCode başlangıç değerleri app config'e eklendi.
- Privacy/support/domain troubleshooting, TR/EN store copy/screenshot storyboard ve
  rollout/rollback/hotfix prosedürü repository taslağı olarak hazırlandı.

## Dış acceptance ve yayın durumu

Repository kontrolleri store release anlamına gelmez. Şunlar açık kalır:

- GitHub CI run sonucu ve signed production archive.
- Gerçek Dokploy/reverse-proxy instance smoke.
- TestFlight ve Play Internal Testing kabulü.
- Public privacy/support URL ve deployment sahibinin hukuk incelemesi.
- Gerçek, store ölçülerinde TR/EN screenshot üretimi.
- Gerçek cihaz accessibility/performance matrisi.
- Owner ve portal E2E acceptance imzası.

Credential gerektiren signing, upload veya dış sisteme yayın bu fazda yapılmadı.
