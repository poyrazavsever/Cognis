# ADR-0021 — Self-hosted notification delivery

Durum: accepted-design, implementation capability-gated

Tarih: 2026-07-29

## Karar

Neta bildirimleri için otorite her zaman kullanıcının bağlandığı self-hosted
instance'tır. Mobil uygulama bir instance'ın event verisini başka instance'a
veya merkezi Neta servisine göndermez.

İlk store release'te `mobile.notifications.v1` capability bulunmadıkça izin
istenmez, cihaz token'ı üretilmez, registration endpoint'i çağrılmaz ve bildirim
ayar UI'ı gösterilmez. Paket bu nedenle şimdilik `expo-notifications` veya
background task bağımlılığı eklemez.

Capability açıldığında iki açık deployment seçeneği vardır:

1. Doğrudan APNs/FCM: instance veya yöneticinin seçtiği worker native device
   token'ını kullanır. Expo relay'e event/token gönderilmez. Self-host ilkesine
   en yakın varsayılan production hedefi budur.
2. Expo Push Service: yalnız instance yöneticisinin açıkça etkinleştirdiği
   deployment seçeneğidir. Expo push token üretimi Expo sunucusuna ağ isteği
   yapar; token, device metadata ve teslimat payload'ı Expo relay üzerinden
   geçer. Bu seçim privacy policy ve yönetici ekranında açıkça belirtilmelidir.

Tek bir binary iki modu otomatik tahmin etmez. Discovery/meta şu bilgileri ilan
etmelidir: capability, provider (`direct` veya `expo`), privacy policy URL ve
preview policy. Provider değişiminde eski registration revoke edilir.

## Background davranışı

- V1 bildirimleri yalnız kullanıcı etkileşimiyle uygulamayı açar. Sessiz data
  push ile arka planda veri çekme veya mutation yapılmaz.
- iOS `remote-notification` background mode ve `expo-task-manager` eklenmez.
- Android exact alarm, boot scheduling ve background location izni istenmez.
- OS teslimatı garanti etmediği için bildirim hiçbir business workflow'un tek
  doğruluk kaynağı değildir; uygulama açıldığında API yeniden okunur.

## Payload ve preview

Data payload yalnız `schemaVersion`, opaque event/resource ID, event type,
instance ID ve hedef user/role taşır. Caller route, URL, title, body, müşteri adı,
proje adı, görev metni, günlük notu, finans tutarı veya token taşıyamaz.

Lock-screen varsayılanı yalnız “Neta — Yeni bir güncellemeniz var” biçimindeki
generic preview'dur. Hassas preview gelecekte ancak kullanıcı ve instance
yöneticisinin ayrı opt-in kararıyla tasarlanabilir.

## Güvenlik sonucu

Notification tap, payload'ın verdiği route'u açmaz. Mobil istemci payload'ı
strict parse eder; aktif session user, role ve instance ID ile eşleştirir ve
event type'tan yerel allowlist route üretir. Eşleşme yoksa güvenli ana/connection
ekranında kalır. Hedef API yine server authorization kontrolünden geçer.
