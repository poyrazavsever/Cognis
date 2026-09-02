# Faz 21 — Bildirim altyapısı ve background davranışı

Son güncelleme: 2026-07-29

## Tamamlanan tasarım ve mobil güvenlik sınırı

- Self-hosted direct APNs/FCM ile opsiyonel Expo relay arasındaki privacy kararı
  ADR-0021'de kayıt altına alındı.
- Device register/update/revoke ve dört event ailesinin v1 endpoint/payload
  tasarımı yazıldı.
- Notification data parser ekstra alan, caller route, preview metni, traversal ve
  hatalı identifier kabul etmez.
- Tap navigasyonu aktif instance, session user ve role eşleşmesinden sonra event
  allowlist'inden üretilir.
- Lock-screen preview yalnız generic, içeriksiz metin üretir.
- Sessiz background fetch/mutation, exact alarm ve gereksiz background permission
  kapsam dışı bırakıldı.

## Capability durumu

`mobile.notifications.v1` halen `planned` durumundadır. Bu yüzden uygulama izin
istemez, token üretmez, registration çağırmaz ve bildirim UI'ı göstermez. Native
paket, credential, gerçek endpoint ve server event producer olmadan çalışan push
akışı eklemek güvenli değildir.

## Kalan acceptance

- Server endpoint'leri, event outbox/dedup ve authorization negatifleri.
- APNs/FCM credential ve token rotation/revoke entegrasyonu.
- Gerçek device delivery, foreground/background/terminated tap matrisi.
- Provider opt-in ve privacy metninin yönetici tarafından kabulü.
