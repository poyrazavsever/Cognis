---
title: Uygulama Nedir?
description: Neta'nın ne olduğunu, kimler için tasarlandığını ve hangi problemi çözdüğünü anlatır.
order: 1
---

# Uygulama Nedir?

Neta, freelancerların kendi markalarıyla kullanabilecekleri self-hosted bir müşteri ve iş yönetimi portalıdır.

Freelancer; müşterilerini, projelerini, görevlerini, finans kayıtlarını, günlük notlarını, takvimini ve müşteri portalı iletişimini tek bir panelden yönetebilir. Sistem dış bir BaaS servisine bağlı değildir. Veriler SQLite üzerinde tutulur, kimlik doğrulama Better Auth ile yapılır ve dosyalar sunucudaki kalıcı veri alanında saklanır.

Neta'nın amacı freelancerın kendi küçük operasyon merkezini kurmasını sağlamaktır. Hazır bir SaaS hesabı kiralamak yerine, kişi kendi sunucusunda çalışan, kendi logosunu ve renklerini taşıyan, müşterilerine kendi domain'i üzerinden açabileceği bir portal sahibi olur.

## Kimler İçin?

Neta özellikle şu kullanıcılar için tasarlanmıştır:

- Tek başına çalışan freelancerlar
- Küçük yaratıcı ekipler
- Yazılım geliştiriciler
- Tasarımcılar
- Danışmanlar
- Ajanslaşma yolunda ilerleyen bağımsız çalışanlar
- Müşterilerine düzenli proje durumu göstermek isteyen hizmet sağlayıcıları

Neta çok kullanıcılı büyük kurumsal ERP mantığıyla tasarlanmamıştır. Temel hedef, tek owner kullanıcının kendi müşterilerini ve iş akışını yönetmesidir.

## Neta Ne Sağlar?

Neta ile freelancer şunları yapabilir:

- Müşterilerini merkezi olarak takip edebilir.
- Her müşteri için proje oluşturabilir.
- Projelere görev, finans kaydı, takvim etkinliği ve not bağlayabilir.
- Müşterilere portal hesabı açabilir.
- Müşterilerin yalnızca kendilerine ait verileri görmesini sağlayabilir.
- Gelir, gider ve bekleyen ödeme takibi yapabilir.
- Günlük çalışma notlarını ve ruh halini kayıt altına alabilir.
- AI destekli analizler alabilir.
- Sistemi kendi logosu, favicon'u ve renkleriyle özelleştirebilir.
- Kendi sunucusunda, kendi verisi üzerinde çalışabilir.

## Neden Self-Hosted?

Freelancer araçlarının çoğu dış servisler üzerinde çalışır. Bu kolaydır, fakat bazı durumlarda kontrolü azaltır:

- Verinin nerede tutulduğu net olmayabilir.
- Abonelik maliyeti artabilir.
- Marka deneyimi sınırlı kalabilir.
- Müşteri portalı başka bir ürünün domain'i altında görünebilir.
- Servis kapanırsa veya fiyat değiştirirse bağımlılık oluşur.

Neta self-hosted olduğu için veriler freelancerın kendi sunucusunda tutulur. Domain, logo, renk, favicon ve uygulama adı owner tarafından belirlenir. Bu yapı özellikle kendi markasını daha profesyonel göstermek isteyen freelancerlar için güçlüdür.

## Temel Çalışma Modeli

Bir Neta instance'ı tek bir owner hesabı etrafında çalışır. İlk kurulumda `/register` üzerinden owner hesabı oluşturulur. İlk owner oluşturulduktan sonra public kayıt kapanır.

Sonraki kullanıcılar müşteri portalı için davet edilir. Müşteri kendi hesabıyla giriş yaptığında yalnızca kendisine ait müşteri ve proje verilerini görebilir.

Bu model Neta'yı sade tutar:

- Owner sistemi yönetir.
- Müşteriler yalnızca kendilerine açılan portal alanını kullanır.
- Veriler tek bir SQLite database içinde tutulur.
- Upload edilen dosyalar aynı kalıcı data alanında saklanır.

## Neta'nın Ana Bölümleri

Neta şu ana modüllerden oluşur:

- Dashboard
- Müşteriler
- Projeler
- Görevler
- Takvim
- Finans
- Günlük
- Sohbet ve AI
- Müşteri portalı
- Ayarlar ve özelleştirme

Bu modüller birlikte çalışır. Örneğin bir müşteri oluşturulur, ona bir proje bağlanır, projeye görevler eklenir, proje için gelir kaydı girilir ve müşteri portalında ilgili durum paylaşılır.

## Tasarım Yaklaşımı

Neta, operasyonel bir iş paneli olarak tasarlanır. Bu yüzden arayüzde amaç süslemekten çok hızlı tarama, hızlı işlem ve net bilgi sunmaktır.

Ana prensipler:

- Gereksiz karmaşadan uzak durmak
- Kart, tablo ve liste akışlarını okunabilir tutmak
- Dark ve light modda tutarlı görünüm sağlamak
- Poyraz UI bileşenleriyle tek bir tasarım dili kullanmak
- Müşteri portalını sade ve güvenli tutmak

## Veri Sahipliği

Neta'da ana veri freelancerın kendi kurduğu instance içinde kalır. Runtime aşamasında Supabase, Firebase veya benzeri harici bir BaaS servisi gerekmez.

Ana veri alanı production'da genellikle şudur:

```text
/app/data/
  neta.db
  uploads/
  backups/
  tmp/
```

Bu klasör kalıcı volume olarak bağlanır. Böylece container yeniden build edilse bile database ve upload dosyaları korunur.

## Özet

Neta, freelancerların kendi domain'lerinde çalıştırabileceği, müşterilerine portal açabileceği ve günlük operasyonlarını merkezi olarak yönetebileceği hafif bir self-hosted iş yönetim sistemidir.

Temel değer önerisi şudur: kendi markan, kendi verin, kendi müşteri portalın.
