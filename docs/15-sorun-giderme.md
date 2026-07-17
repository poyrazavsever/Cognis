---
title: Sorun Giderme
description: Kurulum, deploy, Supabase ve giriş problemlerinde kontrol edilmesi gerekenler.
order: 15
status: legacy-v2-archive
---

# Sorun Giderme

> Arşiv: Aşağıdaki Supabase/RLS sorun giderme akışı v2'ye aittir. v3 operasyon kontrolleri ve health endpoint'leri Faz 8 runbook'unda tanımlıdır.

Neta bir Next.js uygulaması gibi deploy edilse de Supabase, RLS, Auth ve Storage bağlantıları olduğu için sorunları doğru katmanda aramak önemli. Bu sayfada en sık karşılaşılabilecek durumları topladım.

## Login Sayfası Açılmıyor

Önce `.next` cache'ini temizleyin:

```powershell
Remove-Item .next -Recurse -Force
```

Sonra dev server'ı tekrar başlatın:

```bash
npm run dev
```

Eğer sayfa hâlâ açılmıyorsa şunları kontrol edin:

- `NEXT_PUBLIC_SUPABASE_URL` dolu mu?
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` doğru mu?
- Supabase projesi erişilebilir mi?
- Dev server loglarında route compile hatası var mı?

Login sayfası public route olduğu için session kontrolünün sayfayı bloklamaması gerekir.

## Giriş Yapıyorum Ama Dashboard Açılmıyor

Kontrol edilecekler:

- Kullanıcının `profiles` tablosunda kaydı var mı?
- `profiles.role` değeri `freelancer` mı?
- Kullanıcı yanlışlıkla `client` rolünde mi?
- Middleware kullanıcıyı `/portal` tarafına mı yönlendiriyor?

Client rolündeki kullanıcı dashboard'a değil, portal'a yönlendirilir.

## İlk Admin Oluşturulamıyor

Bu genellikle service role veya Supabase function problemidir.

Kontrol edin:

- `SUPABASE_SERVICE_ROLE_KEY` var mı?
- Service role key doğru Supabase projesine mi ait?
- `request_internal_auth_creation` function'ı var mı?
- `is_first_admin_setup_available` function'ı var mı?
- `profiles` tablosu var mı?
- Auth trigger yeni kullanıcı için profile oluşturuyor mu?

## Register Kapalı Görünüyor

`profiles` tablosunda herhangi bir kayıt varsa sistem ilk admin kurulmuş kabul eder.

Supabase SQL editor'da kontrol edebilirsiniz:

```sql
select id, role from public.profiles;
```

Geliştirme ortamında yanlış kayıt oluştuysa auth user ve profile kayıtlarını temizleyip tekrar deneyebilirsiniz.

## Veri Ekleniyor Ama Listede Görünmüyor

Bu çoğu zaman RLS kaynaklıdır.

Kontrol edin:

- Kayıtta `user_id` doğru mu?
- Policy `auth.uid() = user_id` mantığıyla uyumlu mu?
- Sorguda `.eq("user_id", user.id)` filtresi var mı?
- Kullanıcı session'ı gerçekten var mı?

Supabase bazen yetkisiz veriyi hata yerine boş sonuç olarak döndürür. Bu yüzden boş listeyi her zaman "veri yok" diye yorumlamamak gerekir.

## Storage Upload Hata Veriyor

Kontrol listesi:

- `avatars` bucket var mı?
- `project-assets` bucket var mı?
- `project-assets` private mı?
- Dosya boyutu 5 MB sınırını aşıyor mu?
- MIME type izinli mi?
- Storage policy service role erişimine izin veriyor mu?
- `SUPABASE_SERVICE_ROLE_KEY` doğru mu?

## Proje Görseli Yükleniyor Ama Görünmüyor

`project-assets` private bucket olduğu için public URL beklemeyin. Uygulama signed URL üretir.

Kontrol edin:

- `cover_image_path` tabloya yazılmış mı?
- Signed URL üretimi hata veriyor mu?
- Bucket adı doğru mu?

## AI Asistan Cevap Vermiyor

Kontrol edin:

- Ayarlar ekranında provider seçilmiş mi?
- API key kaydedilmiş mi?
- `app_settings` tablosunda kullanıcı için kayıt var mı?
- Provider ile model adı uyumlu mu?
- API key geçerli mi?

Chat endpoint'i için route:

```txt
/api/chat
```

## Finans veya Proje Analizi Hata Veriyor

Bu endpoint'ler de AI provider ayarlarını kullanır:

```txt
/api/finance-analysis
/api/project-risk
```

Eğer API key yoksa analiz endpoint'i hata döndürür.

## Build Hatası

Önce bağımlılıkları temiz kurmayı deneyin:

```bash
npm install
npm run build
```

Projede npm lockfile kullanılmalıdır. `pnpm-lock.yaml` veya başka lockfile'lar deployment platformunu karıştırabilir.

## Slow Filesystem Uyarısı

Next.js dev server bazen Windows veya yavaş disk üzerinde şu tarz uyarı verebilir:

```txt
Slow filesystem detected
```

Bu uyarı tek başına hata değildir. Ama dev server çok yavaşsa:

- Projeyi daha hızlı lokal diske taşıyın.
- `.next` klasörünü temizleyin.
- Antivirüs taramasının proje klasörünü yavaşlatmadığından emin olun.

## Health Check

Uygulamanın temel olarak ayağa kalktığını test etmek için:

```txt
/api/health
```

Beklenen cevap:

```json
{
  "status": "ok"
}
```

Bu endpoint Supabase bağlantısını test etmez; sadece Next.js uygulamasının çalıştığını gösterir.
