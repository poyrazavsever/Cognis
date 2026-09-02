# Pairing ve token-family API kontratı

> Superseded tarihsel kayıt: Redesign Faz 0–1 sonrası mobil uygulama bu
> kontratı kullanmaz.

## Capability

Discovery veya meta `auth.device-pairing.v1` ilan eder. Capability yoksa bütün
endpoint'ler `404`/`MISSING_CAPABILITY` döner ve mobil UI göstermez.

## Endpoint'ler

| Method | Endpoint | Auth | Amaç |
| --- | --- | --- | --- |
| POST | `/api/v1/auth/pairing/challenges` | Owner web session + step-up | Tek kullanımlık kod üret |
| POST | `/api/v1/auth/pairing/exchange` | Pairing code | Device-bound token family oluştur |
| POST | `/api/v1/auth/token/refresh` | Refresh token body | Atomik access/refresh rotation |
| GET | `/api/v1/me/sessions` | Active session | Tokensız device list |
| DELETE | `/api/v1/me/sessions/:id` | Active session | Tek device revoke |
| DELETE | `/api/v1/me/sessions` | Active session + confirm | Tüm device family'lerini revoke |

## Pairing challenge tablosu

- `id`, `userId`, `instanceId`, `codeHash`, `createdAt`, `expiresAt`, `consumedAt`.
- Kod plaintext DB/log/response tekrarında tutulmaz; yalnız ilk web cevabında
  gösterilir. TTL en fazla 5 dakika ve tek kullanımlıdır.
- User başına en fazla 3 açık challenge; IP+user için dakikada 5 create, exchange
  için IP+code prefix bazında artan gecikme ve en fazla 8 deneme.
- Başarı/expiry/deneme limiti challenge'ı atomik kapatır; hata mesajı kodun varlığı
  veya owner email'i hakkında bilgi sızdırmaz.

## Token family tablosu

- `familyId`, `deviceId`, `installationId`, `userId`, `instanceId`, `sessionEpoch`,
  `refreshTokenHash`, `previousRefreshTokenHash`, expiries, `revokedAt`,
  `compromisedAt`, created/last-used timestamps.
- Access ve refresh token opaque, en az 192 bit entropy ile üretilir. DB ve logda
  raw token tutulmaz; pepper/key yönetimi uygulama config secret alanındadır.
- Refresh transaction mevcut hash'i doğrular, önceki hash tekrarını tespit eder,
  yeni token/hash ve epoch'u tek transaction'da yazar.
- Previous/used refresh token görülürse family compromised ve bütün access
  oturumları geçersiz olur; kararlı `TOKEN_FAMILY_COMPROMISED` döner.

## Lifecycle acceptance

- Password change `revokeOtherSessions=true`, disabled user ve logout-all bütün
  ilgili family'leri revoke eder.
- User/session epoch restore, credential rotation veya admin security action'da
  yükselir; eski epoch refresh kabul edilmez.
- Cross-user device ID `404`; client actor pairing challenge oluşturamaz.
- Concurrent refresh testinde yalnız bir request başarılı olur; reuse request'i
  family compromise eder.
- DB snapshot ve structured log taramasında raw code/access/refresh token yoktur.
