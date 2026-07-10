# Phase 2 Auth Implementation Notes

## Kapsam

Faz 2'de Supabase Auth yerine Better Auth + Drizzle SQLite temelli ilk auth katmanı eklendi. Bu faz, veri ekranlarının tamamını Supabase'ten taşımıyor; koruma noktalarını ve yeni session contract'ını hazır hale getiriyor.

## Eklenen runtime parçaları

- `server/auth/auth.ts`: Better Auth server-only config.
- `app/api/auth/[...all]/route.ts`: Better Auth GET/POST Route Handler.
- `server/db/schema/auth.ts`: Better Auth auth tabloları, Neta profile tablosu, setup lock, portal invitation ve audit log tabloları.
- `server/auth/session.ts`: request içi memoize edilen `getSessionContext`, `requireSession`, `requireFreelancer`, `requireClientUser`.
- `server/auth/setup.ts`: ilk freelancer setup durumu, atomic setup guard ve audit yazımı.
- `server/auth/authorization.ts`: role ve owner assertion helper'ları.

## Güvenlik kararları

- `BETTER_AUTH_SECRET` production runtime'da zorunludur. Build sırasında placeholder kullanılır; runtime'da env yoksa uygulama hata verir.
- `TRUSTED_ORIGINS` wildcard kabul etmez.
- Auth cookie'leri production'da `Secure`, tüm ortamlarda `HttpOnly`, `SameSite=Lax`, `Path=/` ayarlarıyla üretilir.
- Public sign-up endpoint'i `databaseHooks.user.create.before` ile ilk freelancer setup guard'ına bağlıdır. İlk freelancer oluştuktan sonra doğrudan `/api/auth/sign-up/email` çağrısı da kullanıcı oluşturamaz.
- Login hatası genel mesaj döndürür; email varlığı sızdırılmaz.

## Bilinen sınırlar

- Portal client kullanıcı üretimi bu fazda sadece token modeli seviyesindedir; gerçek client invitation tüketimi sonraki veri/API fazında tamamlanacak.
- Eski dashboard ve portal feature sayfalarının veri sorguları hâlâ Supabase kullanıyor. Layout koruması Better Auth'a taşındı, veri okuma/yazma Faz 4-6 kapsamındadır.
- Reverse proxy/TLS altında cookie testi Docker daemon çalışmadığı için bu turda kapatılmadı.

## Doğrulama

- `npm run db:generate`
- `npm run db:migrate`
- `npm run phase2:smoke`
- `npm run typecheck`
- `npm run build`
- `npm run lint`

`npm run lint` mevcut proje baseline'ındaki eski hatalar nedeniyle başarısız kalabilir; Faz 2 dosyalarında yeni lint bulgusu bırakılmamalıdır.
