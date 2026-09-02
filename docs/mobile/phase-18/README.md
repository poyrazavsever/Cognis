# Faz 18 — Portal mobil ekranları

Son güncelleme: 2026-07-27

## Tamamlanan mobil kapsam

- Beş hedefli native portal tab navigasyonu: ana sayfa, projeler, görevler,
  revizyonlar ve ayarlar.
- Dashboard stats, proje ilerleme kartları ve owner tarafından tanımlanan portal
  footer alanı.
- Sanallaştırılmış project/task/revision listeleri; loading, empty, error,
  refresh ve cached read durumları.
- Project detail içinde localized genel bilgi, plan, yalnız public task'lar,
  portal-visible asset'ler ve revizyon geçmişi.
- Revision allowance görünümü ve ilk hatalı alana odaklanan, idempotent,
  `sourceLocale` zorunlu revizyon talebi.
- Profil, parola, cihaz session revoke, light/dark/system ve aktif instance
  dilleri arasında kişisel tercih.
- Admin tarafından atanan `clientDefaultLocale` bilgi olarak gösterilir; kişisel
  tercih `/me/preferences` ile override edilir.
- Portal ayarlarında branding, AI ve locale katalog yönetimi yoktur.
- Portal layout client rolü doğrulanmadan ekran üretmez; owner route'ları portal
  tab ağacına eklenmez.

## Accessibility ve performans

- Form ekranı keyboard-safe `Screen` kullanır ve doğrulamada ilk hatalı input'a
  odaklanır.
- Tüm seçim kontrolleri radio semantics ve en az 48dp hedef kullanır.
- Büyük listeler `FlatList` ile sanallaştırılır ve pull-to-refresh sunar.
- Project/revision kartları ekran okuyucu label/state bilgisi taşır.
- Offline durumda mutation kontrolleri kapatılır; sessiz mutation kuyruğu yoktur.

## Kalan acceptance

- Gerçek custom branding + client locale fixture ile iOS/Android E2E.
- Cross-client project deep link negatifi.
- Server owner endpoint forbidden testleri.
- Portal invitation/deep link Faz 19 kapsamındadır.
