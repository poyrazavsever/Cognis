# I18n V2 Faz 0 — Baseline ve regression kapıları

Tarih: 2026-07-20

## Çalıştırılan kontroller

| Kontrol | Sonuç |
| --- | --- |
| `pnpm i18n:v2-page-audit` | Başarılı |
| `pnpm i18n:v2-phase1-smoke` | Başarılı |
| `pnpm typecheck` | Başarılı |
| `pnpm lint` | Başarılı, uyarı yok |
| `pnpm build` | Başarılı, 37 static/dynamic sayfa üretildi |

Sayfa audit'i mevcut ve Faz 2 ile eklenen toplam 31 route girişini doğruladı.
Türkçe karakter içeren 46 hard-coded aday dosya baseline olarak kaydedildi.

## Otomatik regression sözleşmesi

`i18n:v2-page-audit` şu kuralları korur:

- Plan kapsamındaki route dosyaları bulunmalıdır.
- Login, register, forgot-password ve reset-password public resolver kullanmalıdır.
- Auth sayfaları `LocaleSelectForm` kullanmamalıdır.
- Public locale otoritesi `LOCALE_COOKIE` bağımlılığı taşımamalıdır.
- Dört bağlama özel resolver export edilmelidir.
- Settings route navigasyonu pathname-aware ve desktop'ta sticky olmalıdır.
- Hard-coded Türkçe karakter adaylarının en yüksek kaynakları raporlanmalıdır.

`i18n:v2-phase1-smoke` şu öncelikleri doğrular:

- Public -> instance default
- Freelancer -> personal preference -> instance default
- Portal -> personal preference -> client default -> instance default
- Invitation -> invitation snapshot -> instance default
- Archived locale seçilemez.
- Geçersiz default güvenli fallback'e düşer.
- RTL direction locale kaydından korunur.

## Faz 0 çıkış notu

Bu baseline hard-coded metinleri çözmez. Her sayfa kendi fazında audit listesinden
çıkarılacak ve release aşamasında sıfır kullanıcı metni hedefi uygulanacaktır.
