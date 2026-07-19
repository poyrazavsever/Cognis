---
title: Faz 7 Auth, Hata ve Erişilebilirlik Bütünlüğü
description: Auth öncesi locale seçimi, stabil hata kodları, edge ekranlar ve a11y metinleri çıktıları.
phase: 7
status: completed
last_updated: 2026-07-19
---

# Faz 7 Auth, Hata ve Erişilebilirlik Bütünlüğü

Faz-7, kullanıcı oturumu oluşmadan önce ve sistem edge ekranlarında görünen
metinlerin locale modeliyle tutarlı çalışmasını tamamlar.

## Tamamlananlar

- Login ekranı aktif instance dillerini listeleyen locale seçici ile açılır.
- Register ekranı aynı locale seçiciyi kullanır ve ilk admin kurulumu instance
  default locale/cookie davranışına bağlanır.
- Auth shell sol pazarlama alanı, feature etiketleri ve footer kopyası `auth`
  namespace'inden beslenir.
- Forgot/reset password ekranları eklendi ve katalog metinleriyle render edilir.
- 404 ekranı server catalog üzerinden `common.notFound.*` anahtarlarını kullanır.
- Error boundary için built-in TR/EN fallback eklendi.
- Maintenance copy sözleşmesi `common.maintenance.*` anahtarlarıyla kataloglandı.
- Login/signup server action redirect'leri raw mesaj yerine stabil `code`
  parametresine taşındı.
- Portal invite error/success redirect'leri stabil auth code kullanır.
- Invite kabulünden sonra invitation locale'i cookie'ye yazılır; login ekranı aynı
  dilde açılır.
- `/api/i18n/locale` response'u kullanıcı metni yerine `messageKey` döndürür.
- Locale select kontrolünde label + `aria-label` korunur.
- Auth formlarındaki label, link ve pending metinleri katalogdan gelir.
- Interpolation ve plural davranışı built-in TR/EN katalogları için smoke test ile
  doğrulandı.
- RTL temel direction helper smoke testi eklendi.

## Hata kodu sözleşmesi

Auth sayfaları query üzerinden aşağıdaki modeli kabul eder:

```text
/login?error=true&code=auth.messages.invalidCredentials
/register?error=true&code=auth.messages.signupFailed
/login?code=auth.invite.success
```

Geriye dönük uyumluluk için eski `message` parametresi okunur; yeni server
action'lar raw mesaj üretmez.

## Bildirim/e-posta locale sözleşmesi

İleride e-posta veya notification sistemi eklendiğinde locale önceliği şu
sırayı izlemelidir:

1. Client portal hesabı için `clients.portal_locale`
2. Auth user preference için `user_preferences.language`
3. Invite veya event üzerinde snapshot locale
4. Instance default locale
5. Built-in fallback `tr`

Template key'leri UI kataloglarıyla aynı namespace mantığını kullanmalı, fakat
uzun mail içerikleri ayrı `notification` veya `email` namespace'ine taşınmalıdır.

## RTL notu

`directionForLocale("ar" | "fa" | "he" | "ur")` temel RTL direction üretir.
Faz-7 smoke testi auth shell ve form katmanının direction bilgisini bozmadığını
doğrular. Tam görsel RTL polish için sonraki hardening fazında sayfa bazlı görsel
kontrol önerilir.

## Verification

Çalıştırılan komutlar:

```bash
pnpm i18n:phase7-smoke
pnpm typecheck
pnpm build
git diff --check
```

Sonuçlar başarılı olduğunda Faz-7 tamamlanmış kabul edilir.
