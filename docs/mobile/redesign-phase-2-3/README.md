# Redesign Faz 2–3 teslimi

Tamamlanma tarihi: 2026-07-29.

## Faz 2 — Görsel sistem ve feedback

- Light/dark semantic background, elevated/muted/pressed surface, strong border,
  focus, overlay ve info/success/warning/danger surface tokenları eklendi.
- Display/overline typography, genişletilmiş radius ve navigation/floating
  elevation tokenları tanımlandı.
- Button, card ve input semantic pressed/elevated durumlarına taşındı.
- `AppIcon`, `IconButton`, `ListRow` ve `InfoBox` primitive'leri eklendi.
- Global, iki öğeyle sınırlı toast queue; action, dismiss, timeout ve accessible
  live-region davranışı kuruldu. Eski inline `Toast`, yeni `InfoBox` görsel diline
  compatibility facade olarak bağlandı.
- Render edilebilir fakat production route olmayan
  `src/dev/component-gallery.tsx` fixture'ı eklendi.
- Dynamic Type kapatılmadı; ortak interaktif hedefler en az 48dp kaldı.
  Semantic contrast ve iki tema testleri release gate'e bağlandı.

## Faz 3 — App shell ve navigation

- Owner ve portal ortak `AppShell`/`AppTopBar` kullanıyor.
- Owner bottom bar: Ana Sayfa, Müşteriler, Projeler, Görevler, Diğer.
- Portal bottom bar: Ana Sayfa, Projeler, Görevler, Revizyonlar, Diğer.
- Diğer bir route değil; erişilebilir native modal sheet. Aktif alt route'u
  işaretler, screen-reader odağını ilk öğeye taşır ve kapanınca tetikleyiciye
  döndürür.
- Nested detail route top bar'da geri aksiyonu gösterir. Root route logo,
  workspace, başlık ve hesap avatarı gösterir.
- Tab geçişi fade; Reduce Motion açıkken `none`. Sheet animation'ı da aynı
  tercihe uyar.
- Owner dashboard eski route-card menüsünden arındırıldı; greeting, range,
  hızlı aksiyon, stats, analiz özeti ve son kayıtlara odaklandı.
- Ayrı analytics backend'i yokken sahte grafik göstermeyen, açık dependency
  state'i taşıyan Analytics route'u eklendi.

## Otomatik kapılar

- Shell route/active/back policy unit testleri.
- Semantic theme contrast testleri.
- Static a11y gate: tab semantiği, modal focus boundary, focus restoration ve
  reduced-motion zorunluluğu.
- Lint, TypeScript, unit test, i18n, accessibility, release guard ve iOS/Android
  Metro bundle kontrolleri.
