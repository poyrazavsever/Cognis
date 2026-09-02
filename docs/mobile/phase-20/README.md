# Faz 20 — Offline read cache, performans ve accessibility

Son güncelleme: 2026-07-29

## Offline ve cache

- Cache anahtarı instance, user, role, locale, resource ve sıralanmış filter
  alanlarını içerir; aynı roldeki iki kullanıcı birbirinin verisini okuyamaz.
- Public localization uzun; private dashboard/list kaynakları kısa veya orta
  TTL ile sınırlandırılır. Chat, finance, journal, me, settings ve file verisi
  kalıcı cache'e hiç yazılmaz.
- Eski cache namespace'i uygulama açılışında temizlenir. Logout, disconnect,
  session expiry ve bozuk restore ilgili instance cache'ini siler.
- Ağ/TIMEOUT durumunda yalnız izin verilen GET kaynağının doğrulanmış expired
  kaydı stale olarak dönebilir. Cache içeriği de API parser'ından yeniden geçer.
- Tüm mutation'lar merkezi ağ kontrolünden geçer; offline mutation kuyruğu veya
  optimistic write yoktur.
- Ortak offline banner erişilebilir alert semantiği taşır. Dashboard cache/stale
  kaynağını ve kaydedilme zamanını görünür kılar.

## Performans ve responsive davranış

- Cold shell, warm shell ve dashboard data süreleri yalnız process belleğinde,
  en fazla 100 örnekle ölçülür; endpoint veya telemetry'ye gönderilmez.
- Kod seviyesi budget kontratı sırasıyla 3000 ms, 1200 ms ve 2000 ms'dir.
- Büyüyen portal/localization koleksiyonları `FlatList` ile sanallaştırılır;
  portal içerikleri tablette okunabilir genişlikte merkezlenir.
- Public branding görselleri native image cache'e önceden alınır. Private file
  kaynakları kalıcı query cache politikasından hariçtir.

## Accessibility release gate

- Ortak `Screen` safe area, keyboard avoidance, kaydırma ve Android `resize`
  davranışını korur.
- Statik release gate, `allowFontScaling={false}`, eski Touchable bileşenleri ve
  role'süz Pressable kullanımını reddeder.
- Label/error ilişkisi, invalid focus, alert/progress/radio semantics ve en az
  48 dp interaktif hedef ortak primitive'lerde uygulanır.
- Light/dark/custom primary foreground kontrastı ve RTL yön seçimi unit test ile
  korunur.

## Açık gerçek cihaz matrisi

Kod incelemesi aşağıdaki kabul maddelerini geçti saymaz. Release öncesi iOS ve
Android cihaz/simulator üzerinde ayrıca kaydedilmelidir:

- VoiceOver ve TalkBack ile bütün route'ların mantıksal odak sırası.
- Maksimum accessibility font, küçük telefon, tablet, portrait/landscape ve
  açık fiziksel/yazılım klavyesi.
- Light/dark/custom brand, increased contrast, reduced motion ve RTL locale.
- Cold/warm/dashboard budget'larının release build gerçek cihaz ölçümü.
- Uzun gerçek dataset ile bütün owner/portal listelerinde scroll ve memory profili.
