---
title: Özellikler
description: Neta'nın freelancerlar için sunduğu temel özellikler.
order: 2
status: legacy-v2-archive
---

# Özellikler

> Arşiv: Bu belge Supabase tabanlı Neta v2'yi anlatır. Güncel self-hosted v3 kaynağı repository `README.md` dosyası ve `docs/self-hosted-redesign/phase-8-import-release.md` belgesidir.

Neta'yı parça parça özellik eklenmiş bir panel gibi değil, günlük iş akışımı toparlayan bir işletim alanı gibi düşünerek geliştirdim. Her modül tek başına işe yarıyor, ama asıl değer bu modüllerin birbirine bağlanmasında ortaya çıkıyor.

## Dashboard

Dashboard, Neta'yı açtığımda genel durumu hızlıca görebilmem için var. Burada gelir-gider özeti, aktif projeler, tamamlanan görevler, mood ve enerji trendleri gibi bilgiler yer alır.

Dashboard'un amacı detaylı işlem yapmak değil, bana şu soruların cevabını hızlıca vermek:

- Bu ay işlerin durumu nasıl?
- Aktif proje sayım ne?
- Son dönemde ne kadar gelir veya gider oluştu?
- Görev tamamlama ritmim nasıl?
- Kişisel performansım düşüyor mu, yükseliyor mu?

## Müşteri Yönetimi

Müşteri modülü, CRM'in sade bir versiyonu gibi çalışır. Burada müşteri adı, firma bilgisi, iletişim bilgileri, web sitesi, notlar ve pipeline aşaması tutulur.

Müşteriler şu aşamalarda takip edilebilir:

- Lead
- Contacted
- Proposal sent
- Won
- Lost

Böylece sadece aktif müşterileri değil, görüşme hâlindeki potansiyel işleri de takip etmek mümkün olur.

## Proje Yönetimi

Projeler Neta'nın ana omurgalarından biri. Her proje bir müşteriye bağlı olabilir ya da side project olarak bağımsız tutulabilir.

Bir projede şu bilgiler izlenir:

- Proje adı.
- Açıklama.
- Müşteri bağlantısı.
- Durum.
- Başlangıç ve teslim tarihi.
- Bütçe.
- Para birimi.
- İlerleme yüzdesi.
- Kapak görseli.
- Planlama bölümleri.
- Revizyon kotası.

Proje ilerlemesi manuel tutulabilir ya da görev durumlarına göre otomatik hesaplanabilir.

## Görev Yönetimi

Görevler proje ve müşteriyle ilişkilendirilebilir. Liste ve kanban görünümü vardır. Her görev için öncelik, durum, son tarih, tahmini süre ve gerçekleşen süre kaydedilebilir.

Görev durumları:

- `todo`
- `in_progress`
- `done`

Öncelikler:

- `low`
- `medium`
- `high`
- `urgent`

Müşteriye görünmesi istenen görevler ayrıca işaretlenebilir. Bu sayede client portal içinde sadece seçtiğim görevler gösterilir.

## Finans Takibi

Finans modülü gelir ve gider kayıtlarını tutar. Her işlem müşteri veya projeyle ilişkilendirilebilir.

Kaydedilebilen bilgiler:

- Gelir veya gider tipi.
- Tutar.
- Para birimi.
- İşlem tarihi.
- Kategori.
- Ödeme durumu.
- Açıklama.

Bu modül muhasebe programı yerine geçmek için değil, freelancer olarak işin finansal nabzını günlük seviyede görmek için tasarlandı.

## Günlük ve Kişisel Performans

Neta'da sadece operasyonel işler yok. Günlük modülüyle mood, enerji ve iş memnuniyeti skorları da tutulur.

Bu bölümü eklememin sebebi şu: Freelancer çalışırken iş yükü, motivasyon ve enerji birbirinden bağımsız değil. Proje yoğunluğu artarken enerji düşüyorsa bunu görmek değerli.

Günlük kaydı şunları içerir:

- Tarih.
- Mood skoru.
- Enerji skoru.
- İş memnuniyeti skoru.
- Not.

## Analizler

Analizler ekranı, finans ve görev verilerini görselleştirir. Burada proje bazlı gelir dağılımı ve görev durumları gibi özetler görülebilir.

Bu ekranı, detaylı BI aracı gibi değil, günlük kararları kolaylaştıran sade bir performans ekranı olarak düşündüm.

## AI Asistan

AI asistan, Neta içindeki veriler hakkında soru sormak için kullanılır. Örneğin:

- Bu ay finansal durumum nasıl?
- Hangi projeler riskli görünüyor?
- Yaklaşan görevlerim neler?
- Son günlük kayıtlarıma göre enerjim nasıl gidiyor?

AI asistan `app_settings` içindeki provider ve API key ayarlarını kullanır. OpenAI, Gemini ve Groq desteği vardır. Ayrıca projede yerel Ollama tabanlı Python yardımcı dosyası da ayrı bir kullanım senaryosu için korunur.

## Client Portal

Client portal, müşterilere sınırlı erişim vermek için var. Müşteri kendi hesabıyla giriş yapar ve sadece kendisine bağlı projeleri, public görevleri ve revizyon taleplerini görür.

Bu portalın amacı müşteriye tam dashboard açmak değil. Sadece şeffaflık sağlamak:

- Proje ilerlemesi.
- Teslim tarihi.
- Müşteriye açık görevler.
- Revizyon talepleri.

## Storage ve Dosya Kullanımı

Neta Supabase Storage kullanır.

Gerekli bucket'lar:

- `avatars`: Profil fotoğrafları için.
- `project-assets`: Proje kapak görselleri için.

Avatar bucket'ı public olabilir. Proje görselleri ise private tutulur ve uygulama gerektiğinde signed URL üretir.
