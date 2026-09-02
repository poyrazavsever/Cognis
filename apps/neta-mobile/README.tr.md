<p align="center">
  <img src="assets/logo/iconLogo.png" width="128" height="128" alt="Neta logosu" />
</p>

<h1 align="center">Neta Mobile</h1>

<p align="center">
  Self-hosted Neta çalışma alanları için hızlı ve erişilebilir iOS/Android istemcisi.
</p>

<p align="center">
  <a href="README.md">English</a> · <strong>Türkçe</strong>
</p>

## Nedir?

Neta Mobile, owner çalışma alanını ve yetkileri sınırlı müşteri portalını
React Native'e taşır. Her fork build sırasında tek bir Neta instance'ına
bağlanır; kullanıcıdan domain girmesi veya instance değiştirmesi istenmez.
Uygulama native navigasyon, modal formlar, sistem tarih/dosya seçicileri,
güvenli oturum saklama, light/dark tema, reduced motion ve klavye güvenli form
yerleşimleri kullanır.

Mobil ürün; dashboard, müşteriler, projeler, görevler, takvim, gelir/gider,
günlük, AI sohbeti, ayarlar, dil, medya ve müşteri portalını kapsar. Teklif,
sözleşme, fatura ve abonelikler bilinçli olarak kapsam dışıdır.

## Production durumu

Mobil istemci; statik analiz, test, erişilebilirlik, native linking,
konfigürasyon, güvenlik ve production bundle kapılarından geçmektedir.
`https://demo.takeneta.com` public bootstrap akışı sağlıklıdır.

Demo backend, mobil ekranların gerektirdiği authenticated feature API yüzeyini
henüz sunmuyor. Temsili `/api/v1/dashboard`, `clients`, `projects`, `tasks`,
`calendar`, `finance`, `journal`, `chat`, `settings` ve `portal` route'ları şu
anda `404` dönüyor. Bu route'lar ve authorization testleri deploy edilmeden
store yayını blokludur. Mobil istemci eksik sunucu verisini mock ile gizlemez.

## Gereksinimler

- Node.js 24 (`.nvmrc`)
- pnpm 11
- iOS için Xcode 26.4+ ve Homebrew Ruby 3.4
- Android için JDK 17 ve Android SDK 36
- Discovery ve mobil `/api/v1` kontratlarını sunan uyumlu Neta server

## Hızlı başlangıç

Komutları monorepo kökünden çalıştırın:

```sh
pnpm install
cp apps/neta-mobile/.env.example apps/neta-mobile/.env
pnpm mobile:release:check
pnpm mobile:start:clear
```

Başka bir terminalde native development build'i çalıştırın:

```sh
pnpm mobile:ios
# veya
pnpm mobile:android
```

Repository'deki örnek public demo instance'ı hedefler. Fork build'i almadan
önce `apps/neta-mobile/.env` dosyasını düzenleyin. Environment dosyaları Git
tarafından yok sayılır.

## Yapılandırma

Production için gerekli iki public değer:

```dotenv
EXPO_PUBLIC_APP_ENV=production
EXPO_PUBLIC_NETA_ORIGIN=https://demo.takeneta.com
```

Uygulama adı, scheme, bundle/package kimlikleri, sürüm ve native build
numaraları [Özelleştirme rehberindeki](CUSTOMIZATION.tr.md) `NETA_*`
değerleriyle yönetilir. API key, parola, cookie veya token gibi gizli verileri
asla `EXPO_PUBLIC_*` değişkenlerine yazmayın.

## Kalite komutları

```sh
pnpm mobile:release:check
pnpm --filter @neta/mobile doctor
pnpm --filter @neta/mobile instance:smoke
pnpm --filter @neta/mobile native:verify
pnpm audit --prod
```

`mobile:release:check`; lint, strict TypeScript, unit testleri, i18n, erişilebilirlik,
redesign faz kapıları, native autolinking, fork config ve production release
kontrollerini kapsar.

## Proje yapısı

```text
apps/neta-mobile/        Expo Router uygulaması ve native projeler
  src/app/               Public, owner, portal ve modal form route'ları
  src/components/        Erişilebilir UI, form, navigasyon ve feedback
  src/features/          Domain istemcileri, validasyon ve feature UI
packages/api-contracts/  Ortak runtime API kontratları
packages/design-tokens/  Platformdan bağımsız tasarım tokenları
docs/mobile/             Mimari kararlar, faz kanıtları ve runbook'lar
```

## Dokümantasyon

- [Özelleştirme ve fork rehberi](CUSTOMIZATION.tr.md)
- [Katkı rehberi](CONTRIBUTING.tr.md)
- [Güvenlik politikası](SECURITY.tr.md)
- [Release runbook](../../docs/mobile/redesign-phase-12/fork-release-runbook.md)
- [Native ve erişilebilirlik matrisi](../../docs/mobile/redesign-phase-12/native-a11y-matrix.md)
- [Canonical redesign planı](../../docs/mobile/neta-mobile-redesign-master-plan.md)

## Katkı

Katkılarınızı bekliyoruz. Pull request açmadan önce
[CONTRIBUTING.tr.md](CONTRIBUTING.tr.md) dosyasını okuyun. Erişilebilirlik
gerilemeleri, kaynak kodda gizli bilgi, production'da mock veri ve doğrulanmamış
cross-tenant API yanıtları release blocker'dır.

## Lisans

Neta Mobile [MIT Lisansı](LICENSE) ile sunulur.
