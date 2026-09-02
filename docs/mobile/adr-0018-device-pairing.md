---
title: ADR-0018 Device pairing ve native session taşıma (superseded)
status: superseded-by-single-instance-email-auth
last_updated: 2026-07-29
---

# ADR-0018 — Device pairing ve native session taşıma

> Tarihsel kayıt: Redesign Faz 0–1 bu kararı geçersiz kıldı. Mobil
> production bundle artık pairing veya token-family kullanmaz.

## Karar

Neta Mobile iki auth taşıma modunu destekler:

1. Varsayılan `secure-cookie`: Better Auth tabanlı hızlı MVP ve client portal
   oturumları için mevcut yöntemdir.
2. Capability-gated `device-pairing`: Instance discovery/meta
   `auth.device-pairing.v1` ilan ettiğinde yalnız owner hesabı için görünür.

Pairing cookie akışını sessizce değiştirmez. Server capability ilan etmezse UI,
exchange veya token refresh çalışmaz. Backend gerçek cihaz secure-cookie spike'ı
tamamlanana kadar hangi modun production zorunluluğu olduğu deployment kararıdır.

## Token modeli

- Web'deki authenticated owner kısa ömürlü, tek kullanımlık pairing challenge
  üretir.
- Mobil challenge'ı exchange ederek opaque access/refresh token, family/device/
  installation ID, expiry ve session epoch alır.
- Access token kısa ömürlüdür. Her refresh kullanımında access ve refresh token
  birlikte rotate edilir; önceki refresh token'ın tekrar görülmesi tüm family'yi
  compromised yapar.
- Mobil aynı instance için refresh'i single-flight çalıştırır. Replacement aynı
  family/device/installation binding'ini, yeni refresh token'ı ve geriye gitmeyen
  epoch'u taşımıyorsa local zinciri reddeder.
- Raw token yalnız SecureStore'da, instance namespace'inde ve
  `WHEN_UNLOCKED_THIS_DEVICE_ONLY` erişiminde tutulur. AsyncStorage yalnız opaque,
  non-secret installation marker taşır.

## Restore ve reinstall

Android SecureStore backup dışlama config'i açıkça etkinleştirilir. iOS materyali
bu cihaza bağlı keychain accessibility kullanır. SecureStore kaydı ile uygulama
storage'ındaki installation marker eşleşmezse token family silinir; restore veya
reinstall sessiz login üretmez.

Server ayrıca user/session epoch'u doğrular. Backup/restore veya güvenlik olayı
sonrası epoch rotate etme server sorumluluğudur; mobil eski epoch ile refresh
başaramaz ve local materyali temizler.

## Revoke kuralları

- Device list response token veya hash içermez.
- Tek cihaz revoke family/device kaydını kapatır.
- “Tüm cihazlardan çıkış”, password change (`revokeOtherSessions=true`), disabled
  user ve refresh reuse server tarafında ilgili family/session'ları revoke eder.
- Mobil disabled `/me`, auth-required veya `TOKEN_FAMILY_COMPROMISED` sonucunda
  SecureStore materyalini ve private cache'i temizler.

## Açık server kanıtı

Bu repository backend schema ve worker içermiyor. Challenge hashing/rate limit,
transactional rotation/reuse detection, DB'de token hash kontrolü ve gerçek cihaz
revoke matrisi server repository'sinde geçmeden pairing production-ready değildir.
