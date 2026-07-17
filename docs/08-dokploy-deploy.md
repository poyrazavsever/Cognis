---
title: Dokploy ile Deploy
description: Neta'yı Dokploy üzerinde Docker Compose olmadan yayınlama.
order: 8
status: legacy-v2-archive
---

# Dokploy ile Deploy

> Arşiv: Aşağıdaki harici Supabase/ephemeral akış v2'ye aittir. v3 için Dockerfile, tek replica ve `/app/data` persistent volume sözleşmesini `docs/self-hosted-redesign/phase-8-import-release.md` belgesinden uygulayın.

Dokploy üzerinde Neta'yı yayınlarken artık özel Dockerfile veya Compose dosyasına ihtiyaç yok. Bu projeyi standart bir Next.js repo deploy'u gibi ele almak yeterli.

Benim önerdiğim yapı şu: Dokploy sadece web uygulamasını çalıştırır, Supabase ise dışarıdaki hazır proje olarak kullanılır.

## Gerekli Hazırlık

Başlamadan önce şunlar hazır olmalı:

- Dokploy kurulu bir VPS.
- GitHub üzerinde Neta reposu.
- Supabase projesi.
- Supabase schema ve storage yapısı.
- Ortam değişkenleri.

Supabase tarafı hazır değilse önce `supabase/setup.sql` dosyasını çalıştırın. Terminalden tek komutla kurmak için:

```bash
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" -v ON_ERROR_STOP=1 -f supabase/setup.sql
```

SQL Editor kullanıyorsanız `supabase/setup.sql` içeriğini komple yapıştırıp çalıştırabilirsiniz.

## Dokploy'da Uygulama Oluşturma

Dokploy içinde yeni bir uygulama oluştururken GitHub reposunu seçin. Uygulamayı Node.js/Next.js app olarak yapılandırın.

Önerilen komutlar:

```bash
npm install
npm run build
npm run start
```

Docker Compose dosyası seçmeyin. Bu repo artık Supabase'i veya Postgres'i container olarak yanında getirmez.

## Environment Variables

Dokploy environment bölümüne şu değerleri girin:

```env
NEXT_PUBLIC_SITE_URL=https://neta.example.com
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Burada en dikkat edilmesi gereken değer `SUPABASE_SERVICE_ROLE_KEY`. Bu key server tarafında kalmalıdır.

## Domain ve Port

Next.js production server varsayılan olarak `3000` portunda çalışır.

Dokploy tarafında:

- Internal port: `3000`
- Domain: kendi domaininiz
- SSL: Dokploy üzerinden aktif

şeklinde ayarlanabilir.

## Supabase Ayarları

Supabase Auth tarafında domain ayarını güncelleyin:

```txt
Authentication -> URL Configuration
```

Örnek:

```txt
Site URL: https://neta.example.com
Redirect URLs:
https://neta.example.com/**
```

## İlk Çalıştırma

Deploy tamamlandıktan sonra şu sırayla ilerleyin:

1. `/api/health` endpoint'ini açın.
2. Ana sayfaya girin.
3. `/register` üzerinden ilk admin hesabını oluşturun.
4. Login olun.
5. Müşteri, proje ve görev ekleyerek Supabase bağlantısını test edin.

## Dokploy'da Nelere Dikkat Edilmeli?

### Dockerfile Aramayın

Bu repo artık Dockerfile içermez. Dokploy'un Node.js/Next.js build akışını kullanmak daha doğru.

### Supabase Container Beklemeyin

Bu deployment Supabase'i ayağa kaldırmaz. Supabase dışarıda hazır olmalıdır.

### Env Değerleri Deploy'dan Önce Girilmeli

Build bazı env değerlerini okuyabilir. Bu yüzden env değerlerini deploy'dan sonra değil, deploy öncesinde eklemek daha sağlıklı olur.

### RLS Hataları Sessiz Görünebilir

Supabase policy izin vermediğinde uygulama bazen hata göstermek yerine boş liste gösterebilir. Veri görünmüyorsa önce RLS policy'lerini kontrol edin.

## Dokploy İçin Kısa Kontrol Listesi

- GitHub repo bağlandı.
- Uygulama Node.js/Next.js olarak oluşturuldu.
- Dockerfile/Compose kullanılmadı.
- Install command `npm install`.
- Build command `npm run build`.
- Start command `npm run start`.
- Port `3000`.
- Env değerleri girildi.
- Domain ve SSL aktif.
- Supabase Auth URL ayarları yapıldı.
