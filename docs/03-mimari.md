---
title: Mimari
description: Neta'nın teknik mimarisi, frontend/backend ayrımı ve Supabase bağlantısı.
order: 3
status: legacy-v2-archive
---

# Mimari

> Arşiv: Bu mimari Supabase tabanlı Neta v2'ye aittir. Güncel SQLite/Better Auth mimarisi repository `README.md` dosyasında ve ana dönüşüm planında tanımlıdır.

Neta'yı klasik bir frontend-backend ayrımından çok, Next.js App Router etrafında şekillenen bir uygulama olarak kurguladım. Uygulamanın backend işlerinin büyük bölümü Supabase üzerinde duruyor. Next.js tarafı ise hem arayüzü hem de server action ve API route gibi uygulama mantığını taşıyor.

## Ana Teknolojiler

Projede temel olarak şunlar kullanılır:

- Next.js App Router.
- React Server Components.
- Client Components.
- Server Actions.
- Supabase Auth.
- Supabase Postgres.
- Supabase Storage.
- Supabase RLS.
- Vercel AI SDK.
- Tailwind CSS.
- Poyraz UI.

Bu yapı sayesinde ayrı bir Express/Nest backend yazmadan, server tarafı işler Next.js içinde yönetilebilir.

## Route Yapısı

Uygulama `app/` klasörü altında organize edilir.

Ana alanlar:

- `app/(dashboard)`: Freelancer dashboard ekranları.
- `app/portal`: Müşteri portalı.
- `app/login`: Giriş ekranı.
- `app/register`: İlk admin kayıt ekranı.
- `app/api`: AI ve yardımcı API route'ları.

Dashboard route'ları freelancer kullanıcısı için tasarlanmıştır. Portal route'ları ise `client` rolündeki kullanıcıları hedefler.

## Layout ve Rol Kontrolü

Dashboard layout içinde kullanıcı profili alınır. Eğer kullanıcının rolü `client` ise dashboard yerine `/portal` tarafına yönlendirilir.

Portal layout ise bunun tersini yapar. Kullanıcının rolü `client` değilse portal'a erişmesine izin verilmez.

Bu ayrım uygulama seviyesinde yapılır, ama asıl güvenlik Supabase RLS politikalarıyla sağlanır. Yani UI yanlışlıkla veri göstermeye çalışsa bile Supabase policy'leri yetkisiz veriyi döndürmemelidir.

## Supabase Client Katmanları

Projede üç farklı Supabase bağlantısı vardır:

- Browser client: Client component içinde kullanılır.
- Server client: Server component, server action ve route handler içinde kullanılır.
- Service role client: Sadece server tarafında, özel yetki gereken işlemler için kullanılır.

Service role client özellikle şu işler için gereklidir:

- İlk admin kullanıcısını oluşturmak.
- Client portal hesabı oluşturmak.
- Storage'a server-side upload yapmak.

Bu yüzden `SUPABASE_SERVICE_ROLE_KEY` kesinlikle client tarafına çıkarılmamalıdır.

## Middleware

`proxy.ts` içinde Supabase session güncellemesi yapılır. Giriş gerektiren route'larda kullanıcı yoksa `/login` sayfasına yönlendirilir.

Public auth route'ları bu kontrolden ayrı tutulur:

- `/login`
- `/register`
- `/auth`
- `/forgot-password`

Bu ayrım özellikle önemlidir. Login ekranının açılması için Supabase session doğrulamasını beklemek gereksiz bir blok yaratabilir. Bu yüzden public route'larda middleware dış servisi beklemeden geçer.

## Server Components ve Client Components

Neta'da genel desen şudur:

- Sayfa dosyası server component olarak veri çeker.
- UI ve etkileşim yoğun kısım client component'e aktarılır.
- CRUD işlemleri `actions.ts` dosyalarında server action olarak tutulur.

Örnek:

- `app/(dashboard)/tasks/page.tsx`: Veriyi çeker.
- `app/(dashboard)/tasks/tasks-client.tsx`: Liste, filtre, dialog ve kanban UI'ını yönetir.
- `app/(dashboard)/tasks/actions.ts`: Görev oluşturma, güncelleme ve silme işlemlerini yapar.

Bu desen projeyi okunabilir tutuyor.

## Veritabanı Güvenliği

Neta'da veri izolasyonunun ana mantığı `user_id` alanıdır. Freelancer verilerinde genellikle şu policy mantığı kullanılır:

```sql
auth.uid() = user_id
```

Müşteri portalı için ayrı bir ilişki vardır:

```txt
profiles.role = client
clients.client_auth_id = auth.users.id
```

Müşteri sadece kendi client kaydına bağlı projeleri ve public işaretlenmiş görevleri görebilir.

## AI Mimarisi

AI tarafında iki ana akış var:

- Chat ekranı: `/api/chat`
- Analiz endpoint'leri: `/api/finance-analysis`, `/api/project-risk`

Chat endpoint'i kullanıcının son görev, proje, finans ve günlük kayıtlarından bir bağlam oluşturur. Bu bağlam AI modele sistem mesajı olarak verilir.

Provider ayarları `app_settings` tablosundan okunur. Böylece kullanıcı OpenAI, Gemini veya Groq arasında seçim yapabilir.

## Docker Neden Yok?

Önceki denemelerde full-stack self-host yaklaşımı vardı. Bu yaklaşım Supabase, Postgres, Auth, Storage ve uygulamayı aynı deployment içine almaya çalışıyordu. Çalışır bir fikir olsa da kurulum ve bakım maliyeti fazlaydı.

Şimdiki hedef daha sade:

- Supabase dışarıda yönetilir.
- Neta sadece Next.js uygulaması olarak deploy edilir.
- Vercel, Coolify veya Dokploy standart akışları kullanılır.

Bu sayede proje daha az özel kurulum bilgisine ihtiyaç duyar ve GitHub reposundan deploy etmek kolaylaşır.
