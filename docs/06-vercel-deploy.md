---
title: Vercel ile Deploy
description: Neta'yı Vercel üzerinde yayınlama adımları.
order: 6
status: legacy-v2-archive
---

# Vercel ile Deploy

> Arşiv: SQLite ve persistent local volume kullanan self-hosted v3 için Vercel hedef runtime değildir. Docker tabanlı güncel kurulum repository `README.md` dosyasındadır.

Neta'yı Vercel üzerinde yayınlamak en sade yollardan biri. Çünkü proje standart bir Next.js uygulaması olarak çalışır. Dockerfile, Compose veya özel installer gerekmez.

Benim önerdiğim akış şu: Supabase projesini önce hazırlayın, sonra GitHub reposunu Vercel'e bağlayın.

## Ön Hazırlık

Deploy'dan önce hazır olması gerekenler:

- GitHub üzerinde Neta reposu.
- Supabase projesi.
- Supabase tabloları, policy'leri, function'ları ve storage bucket'ları.
- Environment variable değerleri.

Supabase tarafını yeni kuruyorsanız önce `supabase/setup.sql` dosyasını Supabase SQL Editor'da tek seferde çalıştırın. Terminal kullanıyorsanız aynı işlem şu komutla yapılabilir:

```bash
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" -v ON_ERROR_STOP=1 -f supabase/setup.sql
```

Gerekli env değerleri:

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Vercel'e Repo Bağlama

1. Vercel dashboard'a girin.
2. `Add New Project` seçin.
3. GitHub üzerinden Neta reposunu seçin.
4. Framework olarak Next.js otomatik algılanır.
5. Build ayarlarını varsayılan bırakabilirsiniz.

Vercel genelde şu komutları kendisi ayarlar:

```bash
npm install
npm run build
```

Start command girmeniz gerekmez. Vercel Next.js runtime'ını kendi yönetir.

## Environment Variable Ekleme

Vercel proje ayarlarında şu bölüme girin:

```txt
Project Settings -> Environment Variables
```

Değerleri production, preview ve development ortamlarına ihtiyaca göre ekleyin.

Önemli not:

`SUPABASE_SERVICE_ROLE_KEY` server-only kalmalıdır. Vercel'de normal environment variable olarak eklemek yeterlidir. `NEXT_PUBLIC_` prefix'i vermeyin.

## Supabase Auth Ayarları

Supabase tarafında şu ayarlar production domain ile uyumlu olmalıdır:

```txt
Authentication -> URL Configuration
```

Önerilen değerler:

```txt
Site URL: https://your-domain.com
Redirect URLs:
https://your-domain.com/**
```

Eğer preview deployment kullanıyorsanız Vercel preview domainlerini de eklemek isteyebilirsiniz.

## İlk Deploy Sonrası

Deploy tamamlandıktan sonra şu adımları izlerim:

1. Uygulamayı production domain üzerinden açarım.
2. `/api/health` endpoint'ini kontrol ederim.
3. `/register` sayfasından ilk admin hesabını oluştururum.
4. Login olurum.
5. Dashboard açılıyor mu bakarım.
6. Bir müşteri, proje ve görev ekleyerek Supabase bağlantısını test ederim.
7. Profil fotoğrafı veya proje görseli upload ederek storage policy'lerini kontrol ederim.

## İlk Admin

İlk admin hesabı `/register` üzerinden oluşturulur. İlk profil oluştuğu anda public kayıt akışı kapanır.

Bu davranış güvenlik için önemli. Neta kişisel self-host bir çalışma alanı olarak tasarlandığı için herkesin kayıt olup sisteme girmesini istemem.

## Vercel'de Dikkat Edilecekler

### Build Başarılı Ama Sayfa Veri Göstermiyor

Supabase env değerlerini kontrol edin. Yanlış Supabase projesine bağlanıyor olabilirsiniz.

### Register Çalışmıyor

`SUPABASE_SERVICE_ROLE_KEY` eksik veya yanlış olabilir. Ayrıca `request_internal_auth_creation` RPC'si Supabase tarafında bulunmalıdır.

### Storage Upload Hata Veriyor

Bucket adlarını ve storage policy'lerini kontrol edin:

- `avatars`
- `project-assets`

### AI Asistan Cevap Vermiyor

Uygulama içindeki Ayarlar ekranından AI provider ve API key kaydedilmelidir.

## Vercel İçin Kısa Kontrol Listesi

- GitHub repo bağlandı.
- Next.js framework algılandı.
- Env variable'lar girildi.
- Supabase Auth URL ayarları yapıldı.
- Supabase schema ve RLS hazır.
- Storage bucket'ları oluşturuldu.
- İlk admin oluşturuldu.
- Dashboard veri yazıp okuyabiliyor.
