---
title: Environment Ayarları
description: Neta'yı çalıştırmak için gereken ortam değişkenleri.
order: 5
status: legacy-v2-archive
---

# Environment Ayarları

> Arşiv: Aşağıdaki Supabase env sözleşmesi v2'ye aittir. Güncel environment sözleşmesi `.env.example`, repository `README.md` ve Faz 8 runbook'unda tanımlıdır.

Neta'nın çalışması için az sayıda ama kritik ortam değişkeni gerekiyor. Uygulama artık Supabase'i kendi içinde ayağa kaldırmadığı için bütün Supabase bağlantı bilgileri dışarıdan verilir.

Local geliştirme için `.env.example` dosyasını `.env.local` olarak kopyalayabilirsiniz. Production tarafında ise aynı değerleri Vercel, Coolify veya Dokploy panelinden environment variable olarak eklemek gerekir.

## Gerekli Değişkenler

```env
NEXT_PUBLIC_SITE_URL=https://your-domain.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## `NEXT_PUBLIC_SITE_URL`

Uygulamanın dışarıdan açıldığı URL'dir.

Local geliştirmede:

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Production'da:

```env
NEXT_PUBLIC_SITE_URL=https://neta.example.com
```

Bu değer özellikle link üretme, callback ve ileride e-posta akışları gibi noktalarda işe yarar.

## `NEXT_PUBLIC_SUPABASE_URL`

Supabase project API URL değeridir.

Supabase panelinde şu bölümden alınır:

```txt
Project Settings -> API -> Project URL
```

Format genellikle şöyledir:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
```

Bu değer public olabilir. Browser tarafındaki Supabase client da bu URL'yi kullanır.

## `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Supabase anon/public key değeridir.

Supabase panelinde şu bölümden alınır:

```txt
Project Settings -> API -> Project API keys -> anon public
```

Bu değer browser tarafında kullanılabilir. Zaten `NEXT_PUBLIC_` prefix'i bu yüzden vardır. Güvenlik bu key'in gizli olmasından değil, Supabase RLS policy'lerinin doğru yazılmış olmasından gelir.

## `SUPABASE_SERVICE_ROLE_KEY`

Bu en hassas değişkendir. Supabase service role key, RLS'i bypass edebilir. Bu yüzden asla `NEXT_PUBLIC_` prefix'iyle tanımlanmamalıdır.

Supabase panelinde şu bölümden alınır:

```txt
Project Settings -> API -> Project API keys -> service_role
```

Neta bu key'i sadece server tarafında kullanır.

Kullanıldığı yerler:

- İlk admin kullanıcısı oluşturma.
- Müşteri portal kullanıcısı oluşturma.
- Storage upload işlemleri.
- Bazı setup fallback kontrolleri.

## Local `.env.local` Örneği

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ey...
SUPABASE_SERVICE_ROLE_KEY=ey...
```

`.env.local` dosyası repoya commit edilmemelidir.

## Production Env Kontrol Listesi

Deploy etmeden önce şunları kontrol ederim:

- `NEXT_PUBLIC_SUPABASE_URL` boş değil.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` doğru projeye ait.
- `SUPABASE_SERVICE_ROLE_KEY` doğru projeye ait.
- Production domain `NEXT_PUBLIC_SITE_URL` içine yazılmış.
- Supabase Auth tarafında site URL ve redirect URL ayarları production domain ile uyumlu.

## Yaygın Hatalar

### Login Açılıyor Ama Kayıt Oluşturulamıyor

Genellikle `SUPABASE_SERVICE_ROLE_KEY` eksiktir veya yanlış projeye aittir.

### Veriler Görünmüyor

Bu çoğu zaman env hatası değil, RLS policy hatasıdır. Kullanıcı session'ı doğru olsa bile policy izin vermiyorsa Supabase boş sonuç döndürür.

### Storage Upload Çalışmıyor

Bucket adı, bucket policy veya service role key kontrol edilmelidir.

### AI Asistan Çalışmıyor

AI provider ve API key ayarları uygulama içindeki Ayarlar ekranından kaydedilir. Ortam değişkeni olarak değil, `app_settings` tablosu üzerinden yönetilir.
