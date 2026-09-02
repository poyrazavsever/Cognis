# Faz 23 — Device pairing ve gelişmiş oturum yönetimi

> Superseded: `neta-mobile-redesign-master-plan.md` Faz 0–1 sonrası pairing ve
> token-family mobil kapsamdan kaldırılmıştır. Aşağıdaki metin tarihsel kayıttır.

Son güncelleme: 2026-07-29

## Tamamlanan mobil kapsam

- Pairing exchange, token bundle, rotation payload ve device session için strict
  transport kontratları.
- `auth.device-pairing.v1` capability yoksa görünmeyen owner pairing formu.
- Pairing code normalizasyonu, cihaz adı doğrulaması ve portal actor reddi.
- Instance-scoped SecureStore token family; bearer header, pre-expiry refresh,
  concurrent refresh single-flight ve forward-rotation doğrulaması.
- Family/device/installation değişimi, reused refresh token veya gerileyen epoch
  sonucunda local token zincirinin reddedilmesi.
- SecureStore ile non-secret installation marker eşleşmezse restore/reinstall
  oturumunun temizlenmesi.
- Owner ve portal device list/tek revoke yüzeyi ile açık onaylı “tüm cihazlardan
  çıkış” aksiyonu.
- Password change payload'ı diğer session'ları revoke etmeyi açıkça ister.
- Disabled user, auth expiry, disconnect ve compromised family local token/cache
  temizleme lifecycle'ına bağlıdır.

## Backend'de açık kalanlar

- Challenge ve token-family schema/migration, hash/pepper ve rate limit.
- Transactional refresh rotation ve gerçek reuse-compromise testi.
- Password/disabled/logout-all ve backup epoch server revoke matrisi.
- DB/log raw secret taraması.
- İki gerçek instance ile iOS/Android pairing, restart, revoke ve restore E2E.

Mobil kod ve tasarım tamamlanmış olsa da bu server acceptance maddeleri geçmeden
device pairing production-ready veya secure-cookie yerine zorunlu kabul edilmez.
