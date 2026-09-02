# Güvenlik Politikası

[English](SECURITY.md) · **Türkçe**

Şüpheli bir güvenlik açığını public issue olarak yayınlamayın. Repository
sahibinin özel güvenlik bildirim kanalını kullanın; etkilenen sürümü, platformu,
tekrar üretme adımlarını, etkiyi ve minimum proof-of-concept'i ekleyin. Gerçek
müşteri verisi, credential, token veya özel içerik paylaşmayın.

Desteklenen düzeltmeler güncel `main` branch'ini ve son store adayını hedefler.
Authentication bypass, cross-tenant erişim, secret sızıntısı, güvensiz deep link
ve redacted olmayan özel içerik release-blocking problem kabul edilir.

Bildirimden önce problemi son dependency lock ile tekrar üretin ve çalıştırın:

```sh
pnpm mobile:release:check
pnpm audit --prod
```

Environment dosyaları, signing materyali, EAS/store credential'ları ve production
test hesapları commit edilmemelidir. Yanlışlıkla ifşa şüphesi varsa ilgili secret'ı
hemen rotate edin.
