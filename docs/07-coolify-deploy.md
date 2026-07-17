---
title: Coolify ile Deploy
description: Neta'yı bir VPS üzerinde Coolify kullanarak yayınlama.
order: 7
status: legacy-v2-archive
---

# Coolify ile Deploy

> Arşiv: Aşağıdaki harici Supabase/Nixpacks akışı v2'ye aittir. v3 için Dockerfile, tek replica ve `/app/data` persistent volume sözleşmesini `docs/self-hosted-redesign/phase-8-import-release.md` belgesinden uygulayın.

Coolify, kendi VPS'im üzerinde uygulama yayınlamak istediğimde pratik bir seçenek. Neta artık Docker Compose ile gelen full-stack bir paket olmadığı için Coolify üzerinde standart bir Next.js uygulaması olarak deploy edilebilir.

Buradaki temel fikir şu: Coolify sadece Neta web uygulamasını çalıştırır. Supabase ayrı bir servis olarak dışarıdadır.

## Ön Hazırlık

Coolify deploy için hazır olması gerekenler:

- Bir VPS.
- Kurulu ve çalışan Coolify.
- GitHub üzerinde Neta reposu.
- Harici Supabase projesi.
- Supabase env değerleri.

Supabase tarafında tablo, policy, function ve storage bucket'ları hazır olmalıdır.

Yeni bir Supabase projesi hazırlıyorsanız `supabase/setup.sql` dosyasını tek seferde çalıştırabilirsiniz:

```bash
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" -v ON_ERROR_STOP=1 -f supabase/setup.sql
```

Supabase panelinden ilerlemek isterseniz aynı dosyanın tamamını SQL Editor'a yapıştırıp çalıştırmanız yeterli.

## Uygulama Oluşturma

Coolify içinde yeni bir application oluştururken:

1. Kaynak olarak GitHub reposunu seçin.
2. Uygulama tipi olarak Node.js veya Next.js seçin.
3. Docker Compose seçmeyin.
4. Dockerfile'a ihtiyaç yoktur.

Kullanılacak komutlar:

```bash
npm install
npm run build
npm run start
```

Eğer Coolify framework'ü otomatik algılıyorsa bu komutları kendisi de önerebilir.

## Port Ayarı

Next.js production server varsayılan olarak `3000` portunda çalışır.

Coolify içinde internal port olarak şunu kullanabilirsiniz:

```txt
3000
```

Domain ve SSL yönlendirmesini Coolify üzerinden yapabilirsiniz.

## Environment Variables

Coolify application ayarlarında şu değerleri ekleyin:

```env
NEXT_PUBLIC_SITE_URL=https://neta.example.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

`SUPABASE_SERVICE_ROLE_KEY` değeri gizli tutulmalıdır. Coolify secret/environment değişkeni olarak tanımlamak yeterlidir.

## Supabase Auth Ayarları

Supabase panelinde production domain'i tanımlayın:

```txt
Authentication -> URL Configuration
```

Örnek:

```txt
Site URL: https://neta.example.com
Redirect URLs:
https://neta.example.com/**
```

## Health Check

Neta'da basit bir health endpoint vardır:

```txt
/api/health
```

Coolify health check ayarında bu endpoint'i kullanabilirsiniz. Beklenen yanıt JSON olarak `status: ok` bilgisidir.

## İlk Admin Kurulumu

Deploy tamamlandıktan sonra:

1. Domain üzerinden uygulamayı açın.
2. `/register` sayfasına gidin.
3. İlk admin hesabını oluşturun.
4. Login olun.

İlk admin oluştuğunda kayıt akışı kapanır. Sonraki kullanıcılar ancak uygulama içinden müşteri portal hesabı olarak oluşturulabilir.

## Coolify'da Sık Karşılaşılan Durumlar

### Build Takılıyor

Önce Node.js versiyonunu kontrol edin. Node.js 20 veya üzeri kullanmak daha sağlıklı olur.

### Uygulama Açılıyor Ama Login Sonrası Veri Yok

Genellikle Supabase env değerleri yanlış projeyi gösteriyordur ya da RLS policy'leri doğru değildir.

### Register Hata Veriyor

Service role key eksik olabilir. Ayrıca Supabase tarafında `request_internal_auth_creation` function'ı bulunmalıdır.

### Görsel Upload Hata Veriyor

Storage bucket'ları ve policy'leri kontrol edin. `project-assets` private olmalı, `avatars` public olabilir.

## Coolify İçin Kısa Kontrol Listesi

- GitHub repo bağlandı.
- Docker Compose kullanılmadı.
- Install command `npm install`.
- Build command `npm run build`.
- Start command `npm run start`.
- Port `3000`.
- Env değerleri girildi.
- Domain ve SSL ayarlandı.
- Supabase Auth URL ayarları yapıldı.
- `/api/health` endpoint'i çalışıyor.
