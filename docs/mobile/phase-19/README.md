# Faz 19 — Dosya, medya, invitation ve deep link

Son güncelleme: 2026-07-29

## Tamamlanan mobil kapsam

- Paylaşılan `FileAsset` kontratı; kind, visibility, proje kapsamı, absolute URL
  ve metadata temizleme işaretini runtime sınırında doğrular.
- Avatar, project cover ve project asset için sistem document picker kullanan
  native multipart yükleme yüzeyi eklendi. Önceki light/dark logo ve favicon
  yüzeyleri aynı güvenli kind ve visibility politikasına bağlandı.
- Dosya seçilir seçilmez MIME, uzantı, boyut ve dosya adı doğrulanır. Visibility
  kullanıcı girdisinden alınmaz; asset kind tarafından belirlenir.
- Foreground upload ilerleme semantiği, iptal ve aynı dosyayla kontrollü tekrar
  deneme sunar. Başarılı cevap same-origin absolute URL ve beklenen proje/kind
  kapsamını sağlamadan UI'a girmez.
- `neta://` custom scheme invitation ve password-reset bağlantılarını güvenli
  handoff ekranına taşır. Parser yalnız HTTPS web fallback, izinli path, beklenen
  kind ve aynı instance origin'ini kabul eder; credentials ve fragment reddedilir.
- Bağlantı ekranındaki parola sıfırlama aksiyonu, secret saklamadan ilgili
  instance'ın HTTPS web akışını açar.

## Server kontratı ve güvenlik şartları

Bu repository Neta server uygulamasını içermediği için aşağıdaki maddeler server
release gate'i olarak açık kalır:

- `POST /api/v1/files` ve project asset list/delete endpoint'leri v1 envelope
  içinde absolute URL döndürmelidir.
- Authorization, görünürlük ve project ownership server session'dan türemelidir;
  istemcinin gönderdiği visibility güven kaynağı olamaz.
- Server gerçek içerik MIME'ını sniff etmeli, image dosyalarını güvenli biçimde
  yeniden encode etmeli ve EXIF/GPS bilgisini temizlemelidir.
- Silme ve listeleme endpoint'lerinde cross-owner/cross-client negatif testleri
  bulunmalıdır.

## Universal link dağıtım notu

Self-host domain'ler build anında bilinmediği için iOS associated domains veya
Android intent-filter listesine sınırsız müşteri domain'i güvenli biçimde
gömülemez. Custom `neta://` link hazırdır. HTTPS universal/app link isteyen her
dağıtımda domain şu sözleşmeyi ayrıca tamamlamalıdır:

- iOS'ta `apple-app-site-association` doğru App ID/path kapsamıyla sunulur ve
  signed build ilgili `applinks:` entitlement'ını taşır.
- Android'de `assetlinks.json` doğru package ve signing certificate fingerprint
  ile sunulur; intent filter aynı host/path kapsamını doğrular.
- Invitation ve reset token'ı log, AsyncStorage veya SecureStore'a yazılmaz.

## Kalan acceptance

- Gerçek v1 file server ile upload/list/delete ve cross-scope negatif E2E.
- Server MIME sniffing, boyut limiti, kötü image ve EXIF/GPS temizleme testleri.
- En az bir gerçek self-host domain ile signed iOS/Android universal link testi.
- Invitation ve password-reset akışının süresi dolmuş/kullanılmış/geçerli token
  matrisiyle web fallback E2E testi.
