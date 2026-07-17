---
title: Giriş
description: Neta'nın ne olduğunu, kimler için tasarlandığını ve hangi problemi çözdüğünü anlatır.
order: 1
status: legacy-v2-archive
---

# Giriş

> Arşiv: Bu belge Supabase tabanlı Neta v2'yi anlatır. Güncel self-hosted v3 kaynağı repository `README.md` dosyası ve `docs/self-hosted-redesign/phase-8-import-release.md` belgesidir.

Neta'yı freelancer olarak çalışan birinin işlerini tek yerden yönetebilmesi için tasarladım. Gün içinde müşteri takibi, proje ilerlemesi, görevler, finansal durum, kişisel performans ve bazen de hızlıca soru sorabileceğim bir AI asistan ihtiyacı birbirinden kopuk araçlara dağılıyordu. Neta'nın çıkış noktası bu dağınıklığı azaltmak.

Bu proje bir ajans yönetim paneli olmaktan çok, bireysel çalışan bir freelancerın kendi operasyonunu düzenli tutması için hazırlanmış bir çalışma alanı. Temel fikir şu: müşterilerimi, projelerimi, görevlerimi, gelir-giderimi, günlük notlarımı ve müşteri portalını aynı sistem içinde görebileyim.

## Neta Ne İşe Yarar?

Neta ile şu işleri takip edebilirim:

- Müşterilerimi ve müşteri pipeline'ımı düzenli tutmak.
- Projelerimi durum, bütçe, ilerleme ve teslim tarihiyle yönetmek.
- Görevleri proje ve müşteriyle ilişkilendirmek.
- Gelir ve giderleri kaydetmek.
- Günlük ruh hâli, enerji ve iş memnuniyeti notları tutmak.
- Dashboard ve analiz ekranlarıyla genel gidişatı görmek.
- AI asistana mevcut verilerim hakkında soru sormak.
- Müşterilere sınırlı bir portal açıp proje ilerlemesini göstermek.

## Bu Repo Ne İçerir?

Bu repo artık sadece Neta web uygulamasını içerir. Uygulama Next.js ile geliştirilmiştir ve dışarıdan bağlanan bir Supabase projesiyle çalışır.

Repo içinde şunlar vardır:

- Next.js uygulama kodu.
- Dashboard, portal ve API route'ları.
- UI bileşenleri.
- Supabase bağlantı katmanı.
- Database migration notları ve SQL kayıtları.
- Deploy ve geliştirme dokümantasyonu.

Repo içinde artık şunlar yoktur:

- Supabase container'ları.
- PostgreSQL container'ı.
- Docker Compose deployment yapısı.
- Otomatik installer scriptleri.
- Backup/restore scriptleri.

Bu kararın sebebi basit: Neta'yı Vercel, Coolify veya Dokploy üzerinde standart bir Next.js uygulaması gibi yayınlamak istiyorum. Veritabanı ve auth tarafını ise Supabase üzerinde ayrıca yönetmek daha temiz ve daha anlaşılır bir kurulum sağlıyor.

## Kimler İçin Uygun?

Neta özellikle şu kişiler için uygun:

- Tek başına çalışan freelancerlar.
- Küçük ölçekli müşteri projeleri yöneten geliştiriciler veya tasarımcılar.
- Projelerini ve finansal durumunu aynı panelde görmek isteyen bağımsız çalışanlar.
- Müşterilerine basit bir proje takip portalı sunmak isteyenler.
- Kendi Supabase projesini yönetmekten çekinmeyen kullanıcılar.

Eğer çok kullanıcılı, ekip rolleri gelişmiş, kurumsal seviyede izin sistemi olan bir SaaS arıyorsanız Neta'nın mevcut hâli bunun için tasarlanmadı. Buradaki odak, tek ana kullanıcı ve onun müşterileri.

## Genel Akış

Kurulumdan sonra akış şu şekilde ilerler:

1. Supabase tarafında gerekli tablo, policy, function ve storage bucket'ları hazırlanır.
2. Uygulama repo olarak Vercel, Coolify veya Dokploy'a bağlanır.
3. Ortam değişkenleri girilir.
4. İlk admin hesabı `/register` üzerinden oluşturulur.
5. Dashboard üzerinden müşteri, proje, görev ve finans kayıtları eklenmeye başlanır.
6. İstenirse müşterilere portal hesabı oluşturulur.

Bu dokümantasyonun amacı sadece nasıl kurulur demek değil. Aynı zamanda projeyi neden böyle kurguladığımı, hangi parçanın ne işe yaradığını ve özelleştirmek isteyen birinin nereden başlaması gerektiğini netleştirmek.

## Canlı Demo

Neta'yı kurmadan önce incelemek isterseniz demo ortamını açabilirsiniz:

```txt
https://demo.takeneta.com
```

Demo hesabı:

```txt
E-posta: test@takeneta.com
Şifre: 123456
```

Bu demo ortamı projeyi hızlıca tanımak için var. Dashboard'u, müşteri ve proje ekranlarını, görevleri, finans alanını, AI asistan ekranını ve client portal akışını kurulum yapmadan gezebilirsiniz.
