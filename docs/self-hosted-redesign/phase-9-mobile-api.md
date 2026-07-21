---
title: Faz 9 — Mobil API, Instance Discovery ve Localization Sözleşmesi
description: React Native istemcileri için discovery, API v1, metadata, localization, capability, sürümleme ve güvenlik sınırı.
status: completed
last_updated: 2026-07-21
---

# Faz 9 — Mobil API ve instance discovery

Bu faz mobil uygulamanın Neta backend iç yapısını bilmeden bir self-hosted instance'ı tanımasını sağlar. Mobil uygulamanın kendisi ve device pairing implementasyonu kapsam dışıdır.

## 1. Bağlantı akışı

Kullanıcı mobil uygulamaya instance URL'sini girer:

```text
https://neta.example.com
```

İstemci:

1. URL'yi yalnızca origin olacak şekilde normalize eder; credential, query ve fragment kabul etmez.
2. Production'da HTTPS olmayan remote origin'i reddeder. HTTP yalnızca `localhost`, `127.0.0.1` ve emulator geliştirme adresleri için açık kullanıcı onayıyla kullanılabilir.
3. `GET /.well-known/neta` çağrısını yapar.
4. `protocol=neta` ve desteklenen `discoveryVersion` değerini doğrular.
5. Discovery belgesindeki API URL'lerinin beklenen origin'den çıkmadığını doğrular.
6. `GET /api/v1/meta` çağrısını yapar ve `instance.id` değerini discovery `instanceId` değeriyle karşılaştırır.
7. Daha önce kaydedilmiş aynı origin farklı bir `instanceId` döndürürse bunu yeni/restore edilmiş instance olarak kullanıcıya açıkça gösterir; mevcut credential'ı sessizce yeniden kullanmaz.
8. Minimum client sürümünü ve capability listesini değerlendirir.
9. Instance kaydını `origin + instanceId + applicationName + iconUrl` ile yerel güvenli metadata alanına kaydeder.

Redirect takibi en fazla üç hop olmalı ve HTTPS'ten HTTP'ye downgrade edilmemelidir. Discovery veya meta içindeki URL kullanıcı girdisinden bağımsız güven kaynağı sayılmaz.

## 2. Endpoint özeti

| Endpoint | Auth | Cache | Amaç |
| --- | --- | --- | --- |
| `GET /.well-known/neta` | Public | 60 saniye public | Instance ve API keşfi |
| `GET /api/v1/meta` | Public | 60 saniye public | Marka, sürüm ve capability bilgisi |
| `GET /api/v1/health` | Public | No-store | DB/migration readiness |
| `GET /api/v1/me` | Better Auth session | Private/no-store | Güvenli kullanıcı/session özeti |
| `PATCH /api/v1/me/preferences` | Better Auth session | No-store | Kullanıcının dil/tema tercihini güncelleme |
| `GET /api/v1/localization/catalog` | Public | 60 saniye public | Locale katalog mesajları ve versiyon bilgisi |

Public endpoint'ler session oluşturmaz ve secret dönmez. `/me` geçersiz, süresi dolmuş veya disabled hesaba ait session için `401 UNAUTHENTICATED` döndürür.

## 3. Discovery v1

Örnek:

```json
{
  "protocol": "neta",
  "discoveryVersion": 1,
  "instanceId": "6d26e558-9c93-4cd8-93a1-5c8d5166045a",
  "applicationName": "Poyraz Studio",
  "api": {
    "version": "1",
    "baseUrl": "https://neta.example.com/api/v1",
    "metaUrl": "https://neta.example.com/api/v1/meta",
    "healthUrl": "https://neta.example.com/api/v1/health",
    "catalogUrl": "https://neta.example.com/api/v1/localization/catalog"
  },
  "security": {
    "httpsRequired": true,
    "insecureLoopbackAllowed": true
  }
}
```

`instanceId` ilk discovery isteğinde kriptografik UUID olarak oluşturulur, `instance_settings` tablosunda saklanır ve backup/restore ile korunur. Domain veya marka adı instance kimliği değildir.

## 4. API v1 envelope

Başarılı yanıt:

```json
{
  "ok": true,
  "data": {}
}
```

Hata:

```json
{
  "ok": false,
  "error": {
    "code": "UNAUTHENTICATED",
    "message": "Authentication required.",
    "details": {
      "messageKey": "api.errors.unauthenticated"
    }
  }
}
```

`details` opsiyoneldir. `/api/v1` yanıtları `X-Neta-API-Version: 1` header'ı taşır.
Mobil istemci program akışını yalnızca stabil `code` üzerinden kurmalı, kullanıcıya
göstereceği metni mümkünse `details.messageKey` ile kendi catalog'undan çözmelidir.
`message` alanı debug/fallback içindir ve lokalizasyon kaynağı kabul edilmemelidir.

Mevcut hata kodları:

- `VALIDATION_ERROR`
- `UNSUPPORTED_LOCALE`
- `UNAUTHENTICATED`
- `FORBIDDEN`
- `NOT_FOUND`
- `CONFLICT`
- `INVARIANT_VIOLATION`
- `UPSTREAM_ERROR`
- `UPSTREAM_TIMEOUT`
- `SERVICE_UNAVAILABLE`
- `INTERNAL_ERROR`

## 5. Metadata ve capability

`/api/v1/meta` şu grupları döndürür:

- Protokol/discovery/API major sürümü
- Neta server package sürümü
- Kalıcı instance kimliği ve oluşturulma zamanı
- Workspace adı, meta title ve kısa uygulama adı
- Mobil için ayrı light/dark logo, favicon absolute URL'leri ve semantic marka bilgisi
- Minimum desteklenen mobil client sürümü
- `ios` ve `android` platform listesi
- Authentication durumu
- Capability listesi
- Discovery, API, health ve me linkleri

Capability kaydı:

```json
{
  "id": "portal.client",
  "version": 1,
  "status": "available",
  "access": "client"
}
```

İstemci bilinmeyen capability ID ve alanlarını yok saymalıdır. `status=planned`, endpoint'in kullanılabilir olduğu anlamına gelmez.

`instance.workspaceName` kullanıcıya gösterilecek firma/freelance çalışma alanı adıdır.
`instance.metaTitle` web metadata başlığıdır. `branding.lightLogoUrl`,
`branding.darkLogoUrl` ve `branding.faviconUrl` absolute URL döner; mobil istemci
aktif renk moduna göre doğru logoyu seçmeli ve eksik yeni alanlarda eski
`applicationName` / `iconUrl` alanlarına geriye uyumlu fallback uygulamalıdır.
Authenticated `/api/v1/me` yanıtındaki `preferences.colorMode`, kullanıcının
`light`, `dark` veya `system` tercihini taşır.

Localization kontratı şu ayrımı korur:

- `instanceDefaultLocale`: self-host adminin instance varsayılan dili.
- `userPreferenceLocale`: giriş yapan kullanıcının kişisel arayüz tercihi.
- `clientDefaultLocale`: portal kullanıcısı için admin tarafından atanan müşteri
  başlangıç dili; freelancer hesabında `null` döner.
- `resolvedLocale`: bu istekte kullanılacak nihai locale.
- `source`: nihai locale'in `query`, `preference`, `client-default`,
  `accept-language` veya `instance-default` kaynaklarından hangisiyle çözüldüğü.
- `fallbackChain`: katalog ve domain içerik çözümlerinde izlenecek locale zinciri.

`GET /api/v1/localization/catalog?locale=en&namespaces=common,portal` public
katalog endpoint'idir. Yanıt `catalogVersion`, `namespaces`, `messages` ve
`fallbackChain` alanlarını taşır. İstemci `catalogVersion` değişmediği sürece
lokal cache kullanabilir.

Kullanıcı tercihi güncelleme:

```http
PATCH /api/v1/me/preferences
Content-Type: application/json

{
  "language": "en",
  "colorMode": "system"
}
```

Bu endpoint yalnız aktif locale kabul eder. Freelancer ve client kullanıcılar
yalnız kendi preference satırlarını değiştirir; instance default veya müşteri
portal varsayılanı bu endpoint ile değişmez.

İlk capability seti:

- `instance.discovery`
- `instance.branding`
- `instance.localization`
- `auth.better-auth-cookie`
- `files.local`
- `freelancer.core`
- `portal.client`
- `ai.assistant`
- `auth.device-pairing` — `planned`

## 6. Minimum mobil sürüm

Instance sahibi opsiyonel SemVer tabanını environment ile ilan edebilir:

```env
NETA_MINIMUM_MOBILE_VERSION=1.2.0
```

Boşsa metadata `minimumSupportedVersion: null` döndürür ve server sürüm zorlaması yapmaz. İlk mobil release yayınlandığında istemci kendi sürümünü SemVer olarak karşılaştırır:

- Client sürümü minimumdan düşükse authenticated mutation başlatmaz.
- Discovery/meta/health erişimini korur.
- Kullanıcıya upgrade gereksinimini gösterir.
- Pre-release SemVer yalnızca test kanallarında kullanılmalıdır.

## 7. API sürümleme politikası

- Major sürüm URL'dedir: `/api/v1`.
- Yeni opsiyonel alan, yeni endpoint ve yeni capability additive değişikliktir; v1 içinde yapılabilir.
- Alan silme, alan tipini değiştirme, mevcut enum anlamını değiştirme veya auth modelini kırma yeni major `/api/v2` gerektirir.
- ID'ler opaque string kabul edilir; UUID formatına client iş mantığı bağlanmaz.
- Timestamp'ler UTC ISO-8601 string'dir.
- Para değerleri ilgili resource API'leri yayınlandığında integer minor unit olacaktır.
- Liste endpoint'leri yayınlandığında cursor pagination kullanacaktır; offset sözleşmesi varsayılmaz.
- İstemci bilinmeyen JSON alanlarını ve enum/capability değerlerini forward-compatible biçimde yok sayar.
- Eski major kaldırılmadan önce metadata capability ve release notlarıyla deprecation duyurulur.

## 8. Authentication sınırı

Bugünkü `/me`, Better Auth cookie session'ını doğrular; web ve entegrasyon smoke testleri aynı güvenli session adapter'ını kullanır. Session token, password hash veya AI secret yanıt içine girmez.

React Native için kalıcı bearer/device session üretimi bu fazda uygulanmadı. Mobil istemci `auth.device-pairing.status=planned` gördüğünde pairing UI'ını etkinleştirmemelidir. Gelecek güvenlik ve lifecycle kararı [ADR-0018](adr-0018-device-pairing.md) belgesindedir.

## 9. Test ve kalite kapısı

`pnpm phase9:smoke` şunları gerçek Next.js ve Better Auth akışında doğrular:

- Eşzamanlı discovery isteklerinde tek ve kalıcı instance ID
- Discovery/meta ID ve absolute URL tutarlılığı
- Public cache ve session oluşturmama davranışı
- API version header ve envelope
- Readiness health
- Minimum client sürümü ve capability modeli
- Anonymous `/me` negatif testi
- Freelancer `/me`
- Client `/me` ve client kimlik bağı
- Disabled client session reddi
- Branding değişikliğinin absolute mobile metadata'ya yansıması
- Pairing route'larının implementasyon tamamlanmadan yayınlanmaması
