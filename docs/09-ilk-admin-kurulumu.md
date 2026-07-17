---
title: İlk Admin Kurulumu
description: Neta'da ilk yönetici hesabının nasıl oluşturulduğu.
order: 9
status: legacy-v2-archive
---

# İlk Admin Kurulumu

> Arşiv: Aşağıdaki Supabase Auth kurulumu v2'ye aittir. v3 ilk owner hesabını `/register` üzerinden Better Auth + SQLite transaction'ıyla oluşturur; güncel akış repository `README.md` dosyasındadır.

Neta'yı kişisel bir freelancer çalışma alanı olarak düşündüğüm için sistemde herkesin serbestçe kayıt olmasını istemedim. Bu yüzden ilk admin oluşturulduktan sonra public kayıt akışı kapanır.

İlk kurulumun temel akışı şudur:

1. Uygulama Supabase'e bağlanır.
2. `/register` sayfası açılır.
3. İlk freelancer/admin hesabı oluşturulur.
4. `profiles` tablosunda ilk profil oluşur.
5. Sonraki public kayıt girişimleri engellenir.

## İlk Admin Nasıl Oluşturulur?

Deploy tamamlandıktan sonra şu adrese gidin:

```txt
/register
```

E-posta ve şifre girerek ilk hesabı oluşturun. Bu hesap freelancer/admin olarak kabul edilir.

Kayıt sırasında server tarafında service role kullanılır. Bu yüzden `SUPABASE_SERVICE_ROLE_KEY` ortam değişkeni doğru olmalıdır.

## Kayıt Neden Kapanıyor?

Neta'nın mevcut rol modeli şu şekilde:

- `freelancer`: Ana kullanıcı.
- `client`: Müşteri portal kullanıcısı.

Ana freelancer hesabı public kayıtla yalnızca ilk kez oluşturulur. Bundan sonra sistem herkesin kayıt olmasına izin vermez. Çünkü bu proje çok kullanıcılı açık bir SaaS olarak değil, kişisel self-host çalışma alanı olarak tasarlandı.

## Setup Kontrolü Nasıl Yapılır?

Uygulama ilk admin var mı diye Supabase tarafında şu function'ı kullanır:

```txt
is_first_admin_setup_available
```

Bu function genellikle `profiles` tablosunda kayıt var mı diye bakar.

Eğer function Supabase tarafında eksikse veya PostgREST schema cache henüz güncel değilse fallback kontrol devreye girebilir. Bunun için service role key gerekir.

## İlk Admin Oluşturulamıyorsa

Şunları kontrol edin:

- `SUPABASE_SERVICE_ROLE_KEY` doğru mu?
- Supabase URL doğru projeyi mi gösteriyor?
- `profiles` tablosu var mı?
- `request_internal_auth_creation` function'ı var mı?
- Auth trigger yeni kullanıcı için profile oluşturuyor mu?
- Supabase SQL schema güncel mi?

## Yanlış Kullanıcı İlk Admin Olduysa

Bu durumda dikkatli ilerlemek gerekir. Çünkü Supabase Auth ve public tablolar birlikte çalışır.

Kontrol edilecek yerler:

- Supabase Auth users.
- `profiles` tablosu.
- Kullanıcının `role` alanı.

Geliştirme ortamında yanlış ilk admin oluştuysa ilgili auth user ve profile kaydı silinip tekrar denenebilir. Production ortamında bunu yapmadan önce database backup almak daha güvenlidir.

## Müşteri Kullanıcıları Nasıl Oluşturulur?

Müşteri kullanıcıları public `/register` üzerinden oluşturulmaz. Freelancer paneli içinden bir müşteri kaydına portal hesabı açılır.

Bu işlem sonucunda:

- Supabase Auth içinde yeni client user oluşur.
- `profiles.role` değeri `client` olur.
- `clients.client_auth_id` bu auth user id'sine bağlanır.

Müşteri login olduğunda dashboard'a değil, `/portal` alanına yönlendirilir.

## Güvenlik Notu

İlk admin kurulumu tamamlandıktan sonra `/register` linki görünse bile kayıt denemesi server tarafında tekrar kontrol edilir. Yani sadece linki saklamak güvenlik önlemi değildir; asıl kontrol server action ve Supabase tarafındadır.
