---
title: Native auth spike ve session lifecycle önerisi
status: superseded
decision_blocker: false
---

# Native auth spike ve session lifecycle

> Superseded: Redesign Faz 1 tek-instance email/password akışını kabul etti;
> pairing mobil kapsamdan kaldırıldı.

## Varsayılan hipotez

İlk sürümde Better Auth Expo secure-cookie modeli owner ve portal için ortak
auth taşıma mekanizması olur. Secret materyal `instanceId` namespace'i ile
SecureStore'da tutulur. Bu hipotez spike geçmeden kabul edilmiş ADR değildir.

## Gerekli fixture

- Birbirinden farklı origin ve `instanceId` taşıyan iki Neta test instance'ı.
- Her instance'ta bir freelancer hesabı.
- En az bir instance'ta iki farklı client hesabı.
- Server'da `@better-auth/expo` plugin ve yalnız gerekli trusted origin'ler.
- Development için `neta://` ve kontrollü `exp://`; production'da yalnız `neta://`.

## Spike matrisi

| Senaryo | Beklenti |
| --- | --- |
| Instance A login + restart | Session güvenli biçimde restore edilir |
| Instance B login | A ve B cookie/session materyali karışmaz |
| A'ya geri dönüş | Yalnız A session'ı kullanılır |
| Logout | Server logout denenir, local secret her koşulda silinir |
| Expired session | Tek doğrulama denemesi, sonra cache temizliği ve login |
| Disabled user | Foreground kontrolünde 401 ve local revoke |
| Password change | Server politikasına göre current/all session revoke |
| Backup/restore | Eski instance/session sessizce kabul edilmez |
| Aynı origin, farklı instanceId | Restore uyarısı ve eski credential temizliği |
| Client A ile Client B kaynağı | 404/forbidden; hiçbir veri sızıntısı yok |

## Geçiş kriteri

Secure-cookie modeli ancak aşağıdakilerin tamamı gerçek cihazda kanıtlanırsa
Faz 4 tabanı olur:

- iOS Keychain ve Android Keystore restore davranışı belgelenir.
- İki instance arasında izolasyon testi geçer.
- Reverse proxy arkasında cookie/header propagation geçer.
- Logout, revoke, password change ve disabled user geçer.
- Crash/log çıktılarında cookie, password veya token bulunmaz.

Herhangi bir kritik kriter geçmezse ADR-0018 device pairing modeli owner için
production blocker olarak Faz 4'e çekilir.

## Önerilen portal lifecycle

Portal session'ı da aynı secure-cookie transport'unu kullanır fakat role ve
`clientId` yalnız `/api/v1/me` server actor sonucundan alınır. Client ID local
query/body değeri yetki kaynağı değildir. Logout ve 401 temizliği owner ile
aynıdır; owner cache'i ile portal cache'i role ve user identity üzerinden
ayrılır.

## Açık engel

Bu repository'de server config ve test domain'leri bulunmadığı için spike henüz
çalıştırılamaz. Sonuç alındığında bu belge `accepted` veya `rejected` yapılıp
web repository'deki ADR-0018 güncellenmelidir.
