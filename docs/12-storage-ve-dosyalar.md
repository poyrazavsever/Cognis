---
title: Storage ve Dosyalar
description: Avatar ve proje görselleri için Supabase Storage kullanımı.
order: 12
status: legacy-v2-archive
---

# Storage ve Dosyalar

> Arşiv: Aşağıdaki Supabase Storage akışı v2'ye aittir. v3 dosyaları `DATA_DIR/uploads` altında ve checksum'lı metadata ile tutar; güncel kayıt `docs/self-hosted-redesign/phase-3-storage-branding.md` dosyasındadır.

Neta'da dosya saklama için Supabase Storage kullanılır. Şu an iki temel dosya ihtiyacı var: profil fotoğrafları ve proje kapak görselleri.

Bu dosyaları uygulama reposu içinde tutmuyorum. Çünkü production ortamında dosya upload'larının kalıcı ve güvenli bir storage alanında durması gerekir. Supabase Storage bu iş için yeterli ve pratik bir çözüm sağlıyor.

## Gerekli Bucket'lar

Neta iki bucket bekler:

| Bucket | Public | Kullanım |
| --- | --- | --- |
| `avatars` | Evet | Profil fotoğrafları |
| `project-assets` | Hayır | Proje kapak görselleri |

## `avatars` Bucket

Profil fotoğrafları için kullanılır.

Önerilen ayar:

- Bucket adı: `avatars`
- Public: Evet
- MIME kısıtı: Gerekirse image türleriyle sınırlandırılabilir

Avatar görselleri public URL ile gösterilir. Bu yüzden bucket public olabilir.

Profil fotoğrafı upload işlemi Ayarlar ekranından yapılır:

```txt
/settings
```

Server action tarafında service role client kullanılır ve upload sonrası public URL profile kaydına yazılır.

## `project-assets` Bucket

Proje kapak görselleri için kullanılır.

Önerilen ayar:

- Bucket adı: `project-assets`
- Public: Hayır
- File size limit: 5 MB
- Allowed MIME types:
  - `image/jpeg`
  - `image/png`
  - `image/webp`
  - `image/gif`

Bu bucket private kalmalıdır. Proje detay sayfasında görsel gerektiğinde server tarafında signed URL üretilir.

## Dosya Yolları

Proje görselleri şu mantıkla saklanır:

```txt
{user_id}/projects/{project_id}/{file_name}
```

Bu yapı storage policy yazmayı kolaylaştırır. Çünkü dosya yolunun ilk segmenti kullanıcının id değeridir.

## Signed URL Kullanımı

Private bucket içindeki proje görselleri doğrudan public URL ile gösterilmez. Bunun yerine server tarafında kısa süreli signed URL üretilir.

Bu yaklaşım şu avantajları sağlar:

- Proje dosyaları herkese açık olmaz.
- URL süresi sınırlıdır.
- Yetkisiz kullanıcılar dosya yolunu bilse bile doğrudan erişemez.

## Service Role Neden Kullanılıyor?

Upload işlemlerinde service role client kullanılır. Bunun sebebi storage policy karmaşıklığını azaltmak ve server-side işlemleri güvenli tutmaktır.

Yine de service role key sadece server tarafında kalmalıdır.

## Storage Policy Mantığı

Policy'ler şu iki durumu desteklemelidir:

- Kullanıcı kendi klasöründeki dosyaları yönetebilmeli.
- Service role server-side işlemler için erişebilmeli.

`project-assets` için tipik yol kontrolü:

```txt
auth.uid()::text = storage.foldername(name)[1]
```

Service role için ayrıca bypass izni verilmelidir.

## Sık Karşılaşılan Hatalar

### Upload Başarısız

Kontrol edilecekler:

- Bucket adı doğru mu?
- Bucket var mı?
- MIME type izinli mi?
- Dosya boyutu limiti aşılıyor mu?
- Service role key doğru mu?

### Görsel Yükleniyor Ama Görünmüyor

`project-assets` private olduğu için public URL beklemeyin. Signed URL üretimi çalışıyor mu kontrol edin.

### Avatar Görünmüyor

`avatars` bucket public değilse public URL görüntülenmeyebilir. Ya bucket public yapılmalı ya da avatar için de signed URL yaklaşımı kullanılmalıdır.

## Production Notu

Storage ayarları deploy platformundan bağımsızdır. Vercel, Coolify veya Dokploy fark etmez; dosya tarafındaki davranışı Supabase bucket ve policy ayarları belirler.
