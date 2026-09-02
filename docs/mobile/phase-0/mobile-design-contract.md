# Poyraz UI / native mobil tasarım kontratı

## Sınır

Web'deki React DOM, Tailwind ve Radix component implementasyonları mobile import
edilmez. Yalnız semantik tasarım değerleri ve davranış kontratları paylaşılır.
Mobil primitive'ler React Native `StyleSheet` ve platform-native interaction
state'leriyle yazılır. Styling/UI kit bağımlılığı eklenmez.

## Neta bootstrap markası

| Kullanım | Asset |
| --- | --- |
| Açık mod wordmark | `apps/neta-mobile/assets/logo/blackLogoLong.png` |
| Koyu mod wordmark | `apps/neta-mobile/assets/logo/lightLogoLong.png` |
| App icon, splash ve nötr placeholder | `apps/neta-mobile/assets/logo/iconLogo.png` |

Bu asset'ler yalnız domain bağlantısından önceki genel Neta markasıdır. Discovery
sonrası instance'ın light/dark logoları ve renkleri geçerli tema rollerini ezer.

## Kırmızı renk ailesi

- Logo kırmızısı: `#EC2027`.
- Erişilebilir ana aksiyon kırmızısı: `#D51D24`.
- Pressed/deep kırmızı: `#B7131A`.
- Dark mode vurgu kırmızısı: `#FF525A`.

Light ve dark paletleri doğrudan component içine yazılmaz; `ThemeProvider`
üzerinden semantic `background`, `surface`, `text`, `textMuted`, `primary`,
`primaryForeground`, `border` ve `danger` rolleri kullanılır.

## Mod davranışı

- Kullanıcı `system`, `light` veya `dark` seçebilir.
- Seçim secret olmayan local preference olarak saklanır.
- Status bar ve Neta wordmark resolved moda göre değişir.
- Instance bağlandıktan sonra `/me.preferences.colorMode`, instance default'unu ezer.
- Remote primary/accent renkleri Faz 2'de kontrast doğrulamasından sonra semantic
  rollere dönüştürülür.
