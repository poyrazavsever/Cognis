# Neta Mobile'a Katkı

[English](CONTRIBUTING.md) · **Türkçe**

Neta Mobile'ı geliştirdiğiniz için teşekkürler. Değişiklikleri odaklı,
erişilebilir, güvenli ve repository'deki tam Expo SDK sürümüyle uyumlu tutun.

## Geliştirme akışı

1. `main` üzerinden tek amaca odaklanan bir branch açın.
2. `pnpm install --frozen-lockfile` ile kurulum yapın.
3. `apps/neta-mobile/.env.example` dosyasını `apps/neta-mobile/.env` olarak
   kopyalayın; mutation değişikliklerinde production olmayan bir test instance'ı kullanın.
4. En küçük tutarlı değişikliği yapın. React Native veya Expo primitive'i
   yeterliyse yeni bağımlılık eklemeyin.
5. Contract ve davranış testlerini ekleyin veya güncelleyin.
6. Pull request'ten önce `pnpm mobile:release:check` çalıştırın.

Commit başlıklarında `feat(owner): ...`, `fix(auth): ...`, `docs: ...` veya
`test(portal): ...` gibi Conventional Commit biçimini kullanın.

## Zorunlu kontroller

```sh
pnpm mobile:release:check
pnpm --filter @neta/mobile doctor
pnpm audit --prod
```

Native bağımlılık veya config plugin değişikliklerinde ayrıca:

```sh
pnpm --filter @neta/mobile ios:pods
pnpm --filter @neta/mobile native:verify
pnpm --filter @neta/mobile native:build:android
pnpm --filter @neta/mobile native:build:ios
```

## Erişilebilirlik tamamlanma tanımı

- Her kontrol doğru role, label, state ve en az 44×44 pt dokunma alanına sahiptir.
- Modal kapandığında screen-reader odağı tetikleyiciye geri döner.
- Dynamic type içeriği veya aksiyonları gizlemez.
- Formun son alanı klavyenin üstünde kalır.
- Light/dark kontrast, reduced motion, hata duyurusu ve focus sırası doğrulanır.
- Uzun listeler sınırlı veya virtualized render kullanır.

## API ve güvenlik kuralları

- `packages/api-contracts` paketini runtime güven sınırı olarak kabul edin.
- Owner/client scope'unu kullanıcıdan gelen ID'lerden türetmeyin.
- Portal ve cross-tenant değişikliklerine negatif authorization testi ekleyin.
- Credential, `.env`, cookie, token, müşteri verisi veya özel journal/chat
  içeriğini commit etmeyin.
- Sunucu route'u eksikken production yoluna mock başarı yanıtı eklemeyin.
- API hatalarını redacted ve kullanıcı için güvenli tutun.

## Pull request

Sonucu, etkilenen route'ları, yapılan doğrulamayı, görsel değişikliklerde
ekran görüntülerini, erişilebilirlik etkisini ve kalan backend/store blocker'ını
açıklayın. Generated native değişiklikleri bilinçli ve incelenebilir tutun.

Güvenlik problemleri için public issue yerine [SECURITY.tr.md](SECURITY.tr.md)
rehberini izleyin.
