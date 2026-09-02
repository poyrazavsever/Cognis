# Notification device ve event API tasarımı

Bu kontratlar `mobile.notifications.v1` capability yayınlanmadan aktif değildir.

## Device lifecycle

| Method | Endpoint | Davranış |
| --- | --- | --- |
| POST | `/api/v1/me/notification-devices` | Session user'a idempotent device registration |
| PATCH | `/api/v1/me/notification-devices/:id` | Locale, timezone ve preview tercihini güncelle |
| DELETE | `/api/v1/me/notification-devices/:id` | Yalnız session user'ın cihazını revoke et |
| DELETE | `/api/v1/me/notification-devices` | Logout-all/password-change için tüm cihazları revoke et |

Registration body:

```json
{
  "installationId": "opaque-installation-id",
  "platform": "ios",
  "provider": "direct",
  "pushToken": "write-only-token",
  "appVersion": "0.1.0",
  "locale": "tr",
  "timezone": "Europe/Istanbul",
  "previewPolicy": "generic"
}
```

`userId`, role ve instance ID body'den alınmaz. Token response veya listelerde
geri dönmez; server loglarında hash dahil gereksiz identifier tutulmaz. Token
rotation yeni registration ile aynı installation kaydını atomik değiştirir.

## Event kapsamı

| Event | Hedef | Duplicate anahtarı | Varsayılan route ailesi |
| --- | --- | --- | --- |
| `task.deadline` | Owner | task + deadline instant | Owner tasks |
| `revision.requested` | Owner | revision ID | Owner projects |
| `revision.updated` | İlgili client | revision ID + status | Portal revisions |
| `project.updated` | Owner ve yetkili client | project ID + revision/version | Role'a göre projects |

Görev atanmamışsa, client project visibility kaybolmuşsa, user disabled ise veya
device revoked ise delivery oluşturulmaz. Delivery retry aynı event/device için
idempotenttir; provider permanent-token hatası registration'ı disable eder.

## Zorunlu server testleri

- Cross-user registration/list/delete `403` veya veri sızdırmayan `404`.
- Client başka client'ın project/revision event'ini alamaz.
- Disabled user, password-change logout-all ve explicit revoke delivery'yi keser.
- Payload allowlist dışı alan ve hassas preview içermez.
- Expo provider yalnız instance admin opt-in'i ve yayınlanmış privacy açıklaması
  varken etkinleşir.
