---
title: Güvenlik Notları
description: Neta'yı güvenli şekilde kullanmak için dikkat edilmesi gerekenler.
order: 16
status: legacy-v2-archive
---

# Güvenlik Notları

> Arşiv: Bu belgenin Supabase/RLS maddeleri v2'ye aittir. Güncel Better Auth, service authorization, filesystem ve secret kararları ana dönüşüm planında tanımlıdır.

Neta kişisel kullanım ve self-host mantığıyla tasarlandı, ama yine de hassas veriler tutar. Müşteri bilgileri, proje detayları, finans kayıtları, AI API key'leri ve portal erişimleri doğru korunmalıdır.

Bu sayfada projeyi kullanırken özellikle dikkat ettiğim güvenlik noktalarını topladım.

## Service Role Key

`SUPABASE_SERVICE_ROLE_KEY` en hassas ortam değişkenidir. Bu key Supabase RLS kontrollerini bypass edebilir.

Bu yüzden:

- Asla browser'a gönderilmemelidir.
- Asla `NEXT_PUBLIC_` prefix'iyle tanımlanmamalıdır.
- Public repo içine yazılmamalıdır.
- `.env.local` commit edilmemelidir.
- Sadece deploy platformunun secret/env panelinde saklanmalıdır.

Bu key Neta'da sadece server tarafında kullanılır.

## Anon Key Güvenliği

`NEXT_PUBLIC_SUPABASE_ANON_KEY` public bir key'dir. Browser tarafında görünmesi normaldir.

Anon key'in güvenliği RLS policy'lerine bağlıdır. Yani anon key sızdı diye panik yapmak yerine, asıl kontrol edilmesi gereken şey Supabase policy'leridir.

Eğer RLS kapalıysa anon key ile veri erişimi tehlikeli hâle gelir.

## RLS Her Zaman Açık Olmalı

Neta'nın güvenlik modeli Supabase RLS üzerine kurulu.

Özellikle şu tablolarda RLS açık olmalıdır:

- `profiles`
- `clients`
- `projects`
- `tasks`
- `calendar_events`
- `finance_transactions`
- `daily_logs`
- `app_settings`
- `chat_sessions`
- `chat_messages`
- `project_planning_sections`
- `project_revisions`
- `client_activities`

Freelancer verileri genelde şu mantıkla korunur:

```sql
auth.uid() = user_id
```

## Client Portal İzolasyonu

Müşteri portalı açarken en kritik konu veri izolasyonudur.

Müşteri sadece kendi `client_auth_id` bağlantısına ait verileri görmelidir. Başka müşterilerin projelerini, finans kayıtlarını veya private görevleri görmemelidir.

Özellikle kontrol edilmesi gerekenler:

- `clients.client_auth_id`
- `projects.client_id`
- `tasks.is_public_to_client`
- `project_revisions.client_id`

Portal tarafında UI kontrolü olsa bile asıl güvenlik RLS policy içinde olmalıdır.

## AI API Key'leri

AI provider API key'leri `app_settings` tablosunda tutulur.

Bu pratik kişisel kullanım için sade bir çözüm sağlar, ama production güvenliği açısından şu noktalar önemlidir:

- `app_settings` tablosunda RLS açık olmalıdır.
- Kullanıcı sadece kendi ayarını okuyup yazabilmelidir.
- Service role key dışında toplu erişim olmamalıdır.
- Gerekiyorsa ileride API key encryption eklenmelidir.

## AI'ya Gönderilen Veri

AI asistan, kullanıcının görev, proje, finans ve günlük kayıtlarından bağlam üretir. Bu veri seçilen AI provider'a gönderilebilir.

Bu yüzden provider seçimi bilinçli yapılmalıdır.

Daha hassas kullanım için:

- Sadece gerekli alanları context'e ekleyin.
- Finans ve müşteri detaylarını sınırlayın.
- Local model/Ollama seçeneklerini değerlendirin.
- Prompt içinde kesin hukuki, finansal veya klinik hüküm verilmemesini belirtin.

## Storage Güvenliği

`avatars` bucket public olabilir. Ama `project-assets` private kalmalıdır.

Proje görselleri müşteri işleriyle ilgili olabileceği için herkese açık URL ile servis edilmemelidir. Signed URL yaklaşımı daha güvenlidir.

Storage policy'lerinde:

- Kullanıcı kendi klasörüne erişebilmeli.
- Service role server-side işlemler için erişebilmeli.
- Başka kullanıcıların klasörlerine erişim engellenmeli.

## Auth Ayarları

Supabase Auth tarafında production domain doğru tanımlanmalıdır.

Kontrol edilecek yer:

```txt
Authentication -> URL Configuration
```

Özellikle:

- Site URL doğru mu?
- Redirect URL listesi production domaini içeriyor mu?
- Geliştirme ve production domainleri karışmış mı?

## İlk Admin Modeli

Neta public çok kullanıcılı kayıt modeliyle çalışmaz. İlk admin oluşturulduktan sonra kayıt kapanır.

Bu davranış korunmalıdır. Eğer public register sürekli açık kalırsa başka kullanıcılar sisteme girebilir ve beklenmeyen veri/rol problemleri oluşabilir.

## Production Checklist

Production'a çıkmadan önce şunları kontrol ederim:

- `.env.local` commit edilmedi.
- `SUPABASE_SERVICE_ROLE_KEY` sadece server env içinde.
- RLS açık.
- Client portal policy'leri test edildi.
- Storage bucket policy'leri test edildi.
- Supabase Auth URL ayarları doğru.
- İlk admin oluşturuldu.
- Public register kilitleniyor.
- Müşteri sadece kendi portal verisini görüyor.
- AI provider bilinçli seçildi.

Bu kontroller tamamlandığında Neta kişisel kullanım için daha güvenli ve öngörülebilir hâle gelir.
