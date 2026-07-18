---
title: ADR-0018 — Mobil Device Pairing ve Token Lifecycle
status: accepted-design-not-implemented
date: 2026-07-17
---

# ADR-0018 — Mobil device pairing ve token lifecycle

## Bağlam

React Native istemcisi kullanıcı tarafından girilen self-hosted Neta URL'sine bağlanacak. Web session cookie'sini kopyalamak, uzun ömürlü API key vermek veya owner şifresini cihazda sürekli saklamak güvenli bir pairing modeli değildir.

Faz 9 yalnızca discovery ve API v1 temelini yayınlar. Pairing/token endpoint'leri bu ADR uygulanmadan açılmaz.

## Karar

İlk device pairing sürümü owner cihazları için tek kullanımlık, kısa ömürlü bir pairing challenge ve DB-backed opaque token modeli kullanacaktır.

Planlanan endpoint'ler:

```text
POST   /api/v1/pairing-codes
POST   /api/v1/device-sessions/exchange
POST   /api/v1/device-sessions/refresh
GET    /api/v1/device-sessions
DELETE /api/v1/device-sessions/:id
```

### Pairing oluşturma

- Yalnızca aktif freelancer session'ı pairing oluşturabilir.
- Browser owner'dan güncel şifre veya eşdeğer step-up doğrulaması istenir.
- QR modu 256-bit rastgele secret taşır.
- Manuel giriş modu 10 karakter Crockford Base32 kod kullanır; benzer karakterler kullanılmaz.
- DB'de yalnızca HMAC/SHA-256 digest saklanır; raw secret yalnızca bir kez gösterilir.
- Challenge en fazla 5 dakika geçerlidir ve tek kullanımlıdır.
- Challenge; creator, expiry, attempt count, requested scopes ve durum içerir.
- Aynı owner için en fazla üç aktif challenge bulunabilir.
- Beş başarısız deneme challenge'ı kilitler.
- Oluşturma ve exchange IP/instance seviyesinde rate limit ve auth audit event üretir.

### Exchange

Mobil istemci şu bilgileri gönderir:

- Pairing secret/code
- Cihazda üretilmiş opaque install ID
- Kullanıcının verdiği device name
- Platform (`ios`/`android`)
- App version
- OS version'ın hassas olmayan major bilgisi

Server challenge'ı `BEGIN IMMEDIATE` transaction içinde doğrular ve tüketir. Aynı transaction device session/token family kaydını oluşturur. Başarısız exchange challenge'ı tüketmez; attempt sayısını artırır.

Owner role/scopeları server tarafından atanır. İstemci owner/user ID veya scope seçemez.

### Token modeli

- Tokenlar JWT değil, 256-bit opaque random bearer değerleridir.
- DB'de yalnızca keyed digest saklanır.
- Access token varsayılan 15 dakika geçerlidir.
- Refresh token varsayılan 30 gün geçerlidir.
- Her refresh işleminde access ve refresh token birlikte rotate edilir.
- Eski refresh token yeniden kullanılırsa token family `compromised` olur ve family içindeki tüm tokenlar atomik revoke edilir.
- Aynı cihaz için eşzamanlı refresh yarışı kısa grace/replay kaydıyla açıkça yönetilir; iki aktif refresh token bırakılmaz.
- Bearer token yalnızca `Authorization: Bearer` header'ında kabul edilir; query, URL veya log'a yazılmaz.
- Raw tokenlar API response dışında hiçbir log/audit kaydına girmez.
- React Native tokenları iOS Keychain/Android Keystore destekli secure storage'da tutar.
- İlk sürüm bearer modelidir. Device-bound public key/DPoP ayrı ADR olmadan eklenmez.

### Scope

İlk pairing yalnızca freelancer cihazı içindir. Token scope'ları explicit allowlist'tir:

```text
profile:read
clients:read
projects:read
tasks:read
calendar:read
finance:read
journal:read
```

Mutation scope'ları ilgili `/api/v1` resource endpoint'leri ve authorization testleri yayınlandıkça ayrı ayrı eklenir. `*` veya implicit admin scope kullanılmaz.

Client portal pairing'i owner pairing'inden ayrı ürün/güvenlik kararıdır; ilk implementasyona dahil değildir.

## Device token lifecycle

Durumlar:

```text
pending_pairing -> active -> expired
                         -> revoked
                         -> compromised
```

- `pending_pairing`: Challenge üretildi, token yok.
- `active`: Exchange tamamlandı ve token family kullanılabilir.
- `expired`: Refresh lifetime sona erdi.
- `revoked`: Owner, kullanıcı disable, şifre güvenlik olayı veya “tüm cihazlardan çıkış” nedeniyle kapatıldı.
- `compromised`: Refresh reuse veya güvenlik sinyali tespit edildi.

Kurallar:

- Owner dashboard'u cihaz adı, platform, oluşturulma, son kullanım ve yaklaşık IP bilgisini görür.
- Owner tek cihazı veya tüm cihazları revoke edebilir.
- Client/freelancer hesabı disable edildiğinde tüm device session'lar transaction içinde revoke edilir.
- Owner şifresi değiştiğinde varsayılan politika tüm device session'ları revoke etmektir.
- 30 gün kullanılmayan device session expire edilir.
- Son kullanım zamanı en fazla beş dakikada bir coalesce edilerek yazılır.
- Token cleanup job'u uygulama başlangıcında ve kontrollü periyotta expired kayıtları temizler; aktif request path'i toplu cleanup yapmaz.

## Backup ve restore güvenliği

Eski DB backup'ı revoke edilmiş token kayıtlarını yeniden aktif hale getirebilir. Pairing implementasyonunun release blocker'ı:

1. `instance_settings` içinde bir device token epoch tutulur.
2. Bütün token digest doğrulamaları bu epoch'a bağlanır.
3. `db:restore` başarılı atomik swap sonrasında epoch'u yeni random değerle rotate eder.
4. Böylece restore tüm eski device tokenları otomatik geçersiz kılar.
5. Owner restore sonrasında cihazları yeniden pair eder.

Bu mekanizma uygulanmadan device token endpoint'leri yayınlanamaz.

## HTTPS ve transport

- Remote pairing, exchange, refresh ve authenticated API için HTTPS zorunludur.
- Reverse proxy `X-Forwarded-Proto`/canonical origin'i doğru iletmelidir.
- HTTP yalnızca loopback/emulator geliştirme ortamında kabul edilir ve production token üretmez.
- TLS sertifika hatası kullanıcı tarafından sessizce bypass edilemez.
- Discovery API origin değiştirirse mobil istemci kullanıcı onayı olmadan credential göndermez.

## Audit ve privacy

Audit event'leri:

- `pairing_created`
- `pairing_failed`
- `pairing_consumed`
- `device_session_refreshed`
- `device_session_revoked`
- `device_token_reuse_detected`

Audit metadata raw token, pairing secret, tam IP geçmişi veya gereksiz device fingerprint içermez. Device name kullanıcı tarafından değiştirilebilir ve output-encode edilir.

## Uygulama öncesi zorunlu testler

- Pairing raw secret'ın DB/log'da bulunmaması
- Expired, consumed, locked ve brute-force challenge negatifleri
- Concurrent double exchange'de yalnızca bir başarı
- Owner/client role ve cross-owner negatifleri
- Access expiry ve refresh rotation
- Refresh reuse ile family revoke
- Disabled user ve password change revoke
- Restore sonrası token epoch invalidation
- HTTPS/loopback policy
- Tokenların URL, error ve audit output'una sızmaması

## Sonuç

Faz 9'da capability `auth.device-pairing` değeri `planned` kalır. Bu ADR'ın schema, service, rate-limit, restore epoch ve negatif test maddeleri tamamlanmadan `pairing-codes` veya `device-sessions` route'u oluşturulmaz.
