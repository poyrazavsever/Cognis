# Neta Mobile privacy, support ve domain troubleshooting taslağı

Son güncelleme: 2026-07-29

Yayın durumu: repository taslağı; public URL henüz atanmadı

## Privacy özeti

Neta Mobile, kullanıcının seçtiği self-hosted Neta instance'ına bağlanan bir
istemcidir. Girilen domain ve doğrulanan public workspace metadata'sı cihazda
tutulur. Session credential'ları platformun SecureStore/Keychain/Keystore
alanında; hassas olmayan tercih ve hassasiyet politikasının izin verdiği kısa
süreli read cache'i uygulama storage'ında tutulur.

Chat, finans, günlük, profil/security/settings ve file response'ları kalıcı query
cache'e yazılmaz. Logout, instance disconnect ve geçersiz session ilgili cache'i
temizler. Şifre, API key, auth token, request/response body ve private journal
içeriği analytics veya uygulama loguna gönderilmez.

Merkezi telemetry ve crash reporting varsayılan olarak kapalıdır; mevcut mobil
binary bunlar için SDK içermez. Gelecekte eklenmesi ayrı açık kullanıcı opt-in'i,
veri minimizasyonu, retention ve processor açıklaması gerektirir.

Push notification capability kapalıdır. Etkinleştirildiğinde seçilen provider,
token işleme ve Expo relay etkisi ADR-0021'e uygun biçimde yayınlanmadan izin
istenmez. Lock-screen preview varsayılan olarak içeriksizdir.

Kullanıcı verisinin asıl controller/operator'ı bağlanılan self-hosted instance
yöneticisidir. Silme, export, retention ve hukuki talepler için o instance'ın
yayınladığı iletişim kanalı kullanılır.

## Support runbook

Public support URL/e-posta release owner tarafından store submission öncesi bu
belgeye ve store listing'e eklenmelidir. Destek talebinde şunlar yeterlidir:

- Mobil app version ve iOS/Android sürümü.
- Instance hostname; query, token veya tam invitation/reset URL olmadan.
- Görünen güvenli hata kodu ve yaklaşık zaman.
- Sorunun Wi-Fi ve mobil ağda tekrarlanıp tekrarlanmadığı.

Şifre, API key, cookie, bearer token, invitation/reset linki, ekran görüntüsünde
müşteri/finans/günlük içeriği veya server log dump'ı istenmez.

## Domain troubleshooting

1. Domain'i yalnız hostname veya HTTPS origin olarak girin; path/query/fragment
   eklemeyin.
2. Production instance geçerli public TLS sertifikası kullanmalıdır. HTTP yalnız
   development local host senaryosunda kabul edilir.
3. `/.well-known/neta`, health, meta ve localization endpoint'lerinin reverse
   proxy arkasından aynı origin'de, redirect/downgrade olmadan erişildiğini kontrol
   edin.
4. Discovery `protocol=neta`, desteklenen discovery version, kararlı instance ID,
   API v1 ve mobile capability döndürmelidir.
5. Proxy cookie header'larını değiştirmemeli; auth endpoint'leri ve API base URL
   farklı origin'e yönlenmemelidir.
6. `minimumSupportedVersion` mevcut app version'dan yüksekse kullanıcı update
   ekranına yönlenir; bu alan yalnız zorunlu protokol/güvenlik değişiminde artar.
7. Instance restore/migration sonrasında aynı origin farklı instance ID döndürürse
   eski session güvenli biçimde temizlenir ve yeniden giriş gerekir.

## Yayın öncesi hukuk/operasyon kontrolü

- Public privacy ve support URL'leri atanmalı.
- Veri controller/processor, ülke, retention ve yasal dayanak deployment sahibi
  tarafından gözden geçirilmeli.
- Store privacy form yanıtları binary'deki gerçek SDK ve capability'lerle
  eşleştirilmeli; bu taslak hukuki danışmanlık değildir.
