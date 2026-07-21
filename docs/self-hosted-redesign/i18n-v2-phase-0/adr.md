# I18n V2 Faz 0 — Mimari kararlar

Tarih: 2026-07-20

## ADR-001 — Locale bağlama göre çözülür

Tek bir genel resolver yerine dört açık bağlam kullanılır:

- Public auth: instance default
- Invitation: invitation snapshot, ardından instance default
- Freelancer: user preference, ardından instance default
- Portal: user preference, client portal default, instance default

Public auth locale çözümünde cookie ve `Accept-Language` kullanılmaz. Locale
cookie'si dil değiştirme ve resolver akışından kaldırılır; authenticated tercih
veritabanından, public dil instance ayarından çözülür.

## ADR-002 — Kişisel tercih ve yönetim ayarı ayrıdır

`user_preferences.language`, `clients.portal_locale` ve
`instance_i18n_settings.default_locale` aynı kavram değildir:

- User preference kişinin açık seçimidir.
- Client portal locale adminin müşteri için belirlediği başlangıç/default dildir.
- Instance default public yüzeylerin ve fallback zincirinin dilidir.

Bu değerler farklı action/service fonksiyonlarıyla değiştirilir.

## ADR-003 — Ayarlar gerçek alt rotalara ayrılır

Component state ile değişen tek ayarlar ekranı kullanılmaz. `/settings/*`
altındaki her bölüm gerçek bir route olur. Ortak layout başlık, kalıcı iç
navigasyon, loading ve error sınırını sağlar. Her sonraki settings fazı kendi veri
yükleme ve mutation sınırını ayırır.

## ADR-004 — Sayfa tamamlanma birimi

Bir sayfa yalnız title çevrildiğinde tamamlanmış sayılmaz. Header, form, dialog,
toast, validation, loading/error/empty state, accessibility metni ve locale
formatlama aynı sayfa fazının kapsamındadır.

## ADR-005 — Dinamik metin ve iletişim içeriği ayrıdır

Proje, görev, takvim, finans ve benzeri yönetilen kayıtların çevrilebilir metin
alanları locale tab'larıyla saklanır. Chat mesajı ve revizyon talebi gibi bir
kişinin yazdığı iletişim metni çoğaltılmaz; kaynak dili korunur.

## ADR-006 — V1'den korunan parçalar

Korunacak:

- `instance_locales`
- `instance_i18n_settings`
- `instance_ui_translations`
- `content_translations`
- Built-in TR/EN katalog ve fallback temeli
- Locale-aware `Intl` helper'ları

Düzeltilecek:

- Resolver öncelikleri
- Preference doğrulaması
- Settings bilgi mimarisi
- Katalog kapsamı
- Translation registry kapsamı
- Sayfa bazlı payload sınırı

Sonraki fazlarda kaldırılabilecek:

- Auth sayfalarına bağlı locale select yüzeyi
- Eski monolit settings composition
- Katalog içindeki tamamlanmamış genel namespace yapısı
