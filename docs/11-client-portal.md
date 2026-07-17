---
title: Client Portal
description: Müşteri portalının amacı, erişim modeli ve kullanım akışı.
order: 11
status: legacy-v2-archive
---

# Client Portal

> Arşiv: Bu belge v2 portalını anlatır. Güncel Better Auth/SQLite portal sözleşmesi `docs/self-hosted-redesign/phase-6-portal-backend.md` dosyasındadır.

Client portal, müşteriye sınırlı ve güvenli bir görünüm sunmak için var. Neta'nın ana dashboard'u freelancer içindir. Müşteriye bu dashboard'u açmak doğru olmaz. Bunun yerine müşteri sadece kendisini ilgilendiren proje, görev ve revizyon bilgilerini görür.

## Portalın Amacı

Müşteri portalı şu sorulara cevap verir:

- Projem hangi aşamada?
- Genel ilerleme ne durumda?
- Hangi görevler tamamlandı veya devam ediyor?
- Revizyon talebi gönderebilir miyim?
- Proje teslim tarihi ne?

Bu sayede müşteriyle sürekli manuel durum güncellemesi paylaşmak yerine, kontrollü bir şeffaflık sağlanır.

## Roller

Neta'da iki temel rol vardır:

- `freelancer`
- `client`

Freelancer ana paneli kullanır. Client ise portal alanını kullanır.

Rol bilgisi `profiles.role` alanında tutulur.

## Client Auth Bağlantısı

Müşteri portal erişimi için `clients` tablosunda şu alan kullanılır:

```txt
client_auth_id
```

Bu alan Supabase Auth içindeki müşteri kullanıcısının id değerini tutar.

İlişki şu şekildedir:

```txt
auth.users.id -> clients.client_auth_id -> projects.client_id
```

Bu bağlantı sayesinde müşteri sadece kendi client kaydına bağlı projeleri görebilir.

## Müşteri Hesabı Oluşturma

Müşteri public register ekranından kayıt olmaz. Freelancer paneli içinden bir müşteri kaydına portal hesabı oluşturulur.

Bu işlem sırasında:

1. Service role ile Supabase Auth user oluşturulur.
2. Kullanıcının profile rolü `client` yapılır.
3. `clients.client_auth_id` alanı yeni kullanıcıya bağlanır.

Bu akış için `SUPABASE_SERVICE_ROLE_KEY` gereklidir.

## Portal Route'ları

Portal route'ları `app/portal` altında durur.

Ana ekranlar:

- `/portal`
- `/portal/projects`
- `/portal/projects/[id]`
- `/portal/tasks`
- `/portal/revisions`

Portal layout, kullanıcının rolünü kontrol eder. Rol `client` değilse kullanıcı dashboard tarafına yönlendirilir.

## Müşteri Neleri Görebilir?

Müşteri şunları görebilir:

- Kendisine bağlı projeler.
- Proje adı, açıklama, durum, ilerleme ve teslim tarihi.
- Public olarak işaretlenmiş görevler.
- Proje planlama bölümleri.
- Kendi revizyon talepleri.

Müşteri şunları görmemelidir:

- Freelancer dashboard'u.
- Finans kayıtları.
- Diğer müşteriler.
- Diğer projeler.
- Private görevler.
- App settings.
- AI chat geçmişi.

## Public Task Mantığı

Görevlerde şu alan bulunur:

```txt
is_public_to_client
```

Bu alan `true` ise müşteri portalında gösterilebilir. Böylece iç operasyon görevleri müşteriyle paylaşılmadan tutulabilir.

## Revizyon Talepleri

Müşteri proje detay ekranından revizyon talebi oluşturabilir.

Revizyon durumları:

- `pending`
- `in_progress`
- `completed`
- `rejected`

Freelancer dashboard tarafında bu talepler görülebilir ve durumları güncellenebilir.

## Güvenlik Modeli

Portal güvenliği iki katmanda sağlanır:

1. Next.js layout seviyesinde rol kontrolü.
2. Supabase RLS policy seviyesinde veri erişim kontrolü.

Sadece layout kontrolüne güvenmek doğru değildir. Asıl kritik nokta Supabase policy'lerinin doğru olmasıdır.

## Portalı Özelleştirme

Portal menüsü şu dosyadan yönetilir:

```txt
config/portal-sidebar.ts
```

Portal shell bileşeni:

```txt
components/layout/portal-shell.tsx
```

Müşteriye daha fazla bilgi göstermek isterseniz önce RLS politikasını, sonra server component veri sorgusunu, en son UI bileşenini güncellemek gerekir.
