---
title: Yayın Kontrol Listesi
description: Neta'yı production ortamına almadan önce kontrol edilmesi gereken teknik ve ürün adımlarını listeler.
order: 8
---

# Yayın Kontrol Listesi

Bu liste, Neta'yı production ortamında yayınlamadan önce yapılması gereken temel kontrolleri içerir.

## Environment

Production environment değerleri hazır olmalıdır:

```env
NODE_ENV=production
DATA_DIR=/app/data
APP_URL=https://neta.example.com
NEXT_PUBLIC_SITE_URL=https://neta.example.com
BETTER_AUTH_URL=https://neta.example.com
BETTER_AUTH_SECRET=guclu-bir-secret
TRUSTED_ORIGINS=https://neta.example.com
```

Kontrol listesi:

- `APP_URL` gerçek domain ile aynı.
- `NEXT_PUBLIC_SITE_URL` gerçek domain ile aynı.
- `BETTER_AUTH_URL` gerçek domain ile aynı.
- `TRUSTED_ORIGINS` gerçek domain'i içeriyor.
- `BETTER_AUTH_SECRET` güçlü ve benzersiz.
- Supabase environment değişkenleri kullanılmıyor.

## Domain ve HTTPS

Domain ayarları:

- DNS kaydı sunucu IP'sine gidiyor.
- HTTPS aktif.
- Reverse proxy internal port `3000`'e yönlendiriyor.
- HTTP'den HTTPS'e yönlendirme çalışıyor.

## Docker

Docker ayarları:

- Build Type Dockerfile.
- Internal port `3000`.
- Persistent volume `/app/data`.
- Replica sayısı `1`.
- Container restart policy aktif.

## Data Volume

Kalıcı veri alanı kontrolü:

- `/app/data` persistent volume'a bağlı.
- Container restart sonrası veri korunuyor.
- Upload edilen logo ve favicon silinmiyor.
- Database dosyası volume içinde oluşuyor.

## Health

Deploy sonrası kontrol edilecek endpointler:

```text
/api/health/live
/api/health/ready
/api/health
```

Beklenen durum:

- Uygulama ayakta.
- Database erişilebilir.
- Migrationlar uygulanmış.
- Data directory yazılabilir.

## İlk Owner

İlk kurulum kontrolü:

- `/register` açılıyor.
- İlk owner hesabı oluşturulabiliyor.
- İlk owner sonrası public kayıt kapanıyor.
- Login çalışıyor.
- Logout çalışıyor.

## Marka Ayarları

Ayarlar ekranında kontrol edilecekler:

- Workspace adı girildi.
- Meta title girildi.
- Kısa uygulama adı girildi.
- Light logo yüklendi.
- Dark logo yüklendi.
- Favicon yüklendi.
- Ana renk seçildi.
- Light mod kontrol edildi.
- Dark mod kontrol edildi.

## Temel Ürün Akışları

Production smoke test:

- Müşteri oluşturma
- Müşteri detay görüntüleme
- Portal daveti oluşturma
- Proje oluşturma
- Görev oluşturma
- Takvim etkinliği oluşturma
- Finans kaydı oluşturma
- Günlük kaydı oluşturma
- AI ayarı yapılacaksa provider testi

## Müşteri Portalı

Portal kontrolü:

- Müşteri davet linki açılıyor.
- Müşteri şifre belirleyebiliyor.
- Müşteri login olabiliyor.
- Müşteri yalnızca kendi verilerini görüyor.
- Başka müşteri verisine erişim yok.

## Backup

Backup stratejisi:

- Manuel backup komutu test edildi.
- Backup dosyası oluşuyor.
- Restore prova edildi.
- Backup host dışına kopyalanıyor.
- Retention politikası belirlendi.

## Upgrade

Yeni sürüm öncesi:

- Backup alındı.
- Restore prova edildi.
- Yeni image build edildi.
- Migrationlar başarılı.
- Health endpointleri başarılı.
- Kritik akışlar test edildi.

## Supabase Kontrolü

Güncel self-hosted sürümde Supabase runtime bağımlılığı olmamalıdır.

Kontrol:

- Supabase package yok.
- Supabase env yok.
- Supabase client yok.
- Supabase runtime import yok.
- Supabase schema veya migration runtime için kullanılmıyor.

## Son Karar

Yayına hazır sayılması için:

- Health endpointleri başarılı olmalı.
- İlk owner oluşturulmalı.
- Veri volume'u kalıcı olmalı.
- Domain ve HTTPS doğru çalışmalı.
- Backup stratejisi hazır olmalı.
- Temel owner ve müşteri akışları test edilmeli.

Bu kontroller tamamlandığında Neta production ortamında kullanılmaya hazırdır.
