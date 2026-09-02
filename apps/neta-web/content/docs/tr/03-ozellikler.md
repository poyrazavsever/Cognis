---
title: Özellikler
description: Neta'nın freelancerlar için sunduğu temel özellikler.
order: 3
---

# Özellikler

Neta, freelancerların işlerini tek bir self-hosted portal üzerinden yönetebilmesi için müşteri, proje, görev, finans, günlük, AI ve müşteri portalı modüllerini bir araya getirir.

## Dashboard

Dashboard, sistemin ana kontrol ekranıdır.

Burada freelancer genel iş durumunu hızlıca görür:

- Net kazanç
- Aktif projeler
- Tamamlanan görevler
- Ortalama mood veya enerji göstergeleri
- Son eklenen projeler
- Son eklenen müşteriler
- Gelir/gider özeti
- Günlük trendler

Dashboard ekranı günlük kontrol için tasarlanmıştır. Kullanıcı sisteme girdiğinde hangi işlerin öne çıktığını, finans durumunu ve genel performansını hızlıca okuyabilir.

## Müşteri Yönetimi

Müşteri yönetimi, Neta'nın temel modüllerinden biridir.

Freelancer her müşteri için merkezi bir kayıt tutar. Bu kayıt üzerinden projeler, portal erişimi, finans kayıtları ve müşteriyle ilgili notlar takip edilebilir.

Müşteri modülü şunları sağlar:

- Müşteri oluşturma
- Müşteri listeleme
- Müşteri detay görüntüleme
- Müşteriye proje bağlama
- Müşteri portal hesabı oluşturma
- Müşteri durumunu takip etme

## Müşteri Portalı

Müşteri portalı, freelancerın müşterilerine sınırlı erişim verebildiği ayrı bir alandır.

Müşteri portalında kullanıcı yalnızca kendi hesabına bağlı verileri görür. Başka müşterilerin bilgilerine erişemez.

Portalın amacı müşteriye düzenli ve kontrollü bilgi sunmaktır.

Müşteri portalı ile:

- Proje durumu paylaşılabilir.
- Müşteri kendi projelerini görebilir.
- İş ilerleme bilgisi merkezi bir yerde tutulabilir.
- Gereksiz e-posta ve mesaj trafiği azaltılabilir.

## Proje Yönetimi

Projeler, freelancerın müşteri işleri için ana takip alanıdır.

Her proje bir müşteriye bağlanabilir. Projeler üzerinden görevler, finans kayıtları, takvim etkinlikleri ve detaylı notlar izlenebilir.

Proje yönetimi şunları kolaylaştırır:

- Devam eden işleri takip etmek
- Proje durumlarını görmek
- Teslim tarihlerini izlemek
- Müşteri bazlı iş yükünü anlamak
- Proje finansını değerlendirmek

## Görev Yönetimi

Görevler, yapılacak işleri parçalara ayırmak için kullanılır.

Neta'da görevler liste veya kanban mantığıyla yönetilebilir. Bu sayede hem detaylı görev listesi hem de görsel iş akışı kullanılabilir.

Görevlerde şu bilgiler takip edilebilir:

- Başlık
- Açıklama
- Durum
- Öncelik
- Teslim tarihi
- Bağlı proje

## Takvim

Takvim modülü zamana bağlı işlerin yönetilmesini sağlar.

Freelancer takvim üzerinden toplantıları, teslim tarihlerini, müşteri görüşmelerini ve önemli etkinlikleri takip edebilir.

Takvim özellikle yoğun dönemlerde işlerin çakışmasını engellemek ve haftalık planı net görmek için kullanışlıdır.

## Finans

Finans modülü gelir ve giderleri takip etmek için kullanılır.

Freelancer buradan aylık finans durumunu, bekleyen ödemeleri, müşteri veya proje bazlı gelirleri ve gider dağılımını görebilir.

Finans modülü şunları destekler:

- Gelir kaydı
- Gider kaydı
- Bekleyen ödeme takibi
- Müşteri bağlantısı
- Proje bağlantısı
- Aylık özetler
- Kategori bazlı gider takibi

Bu ekran freelancerın nakit akışını daha kontrollü yönetmesine yardımcı olur.

## Günlük

Günlük modülü, iş notları ve kişisel çalışma takibi için kullanılır.

Günlük yalnızca klasik not alanı değildir. Freelancer burada günün özetini, enerji seviyesini, mood bilgisini ve yaptığı işleri kayıt altına alabilir.

Zaman içinde bu kayıtlar kişinin çalışma düzenini daha iyi anlamasına yardımcı olur.

## AI Asistan

Neta'da AI destekli analiz ve sohbet akışları bulunur.

AI özellikleri opsiyoneldir. Kullanıcı bir AI sağlayıcısı yapılandırmadıkça sistem temel işlevleriyle çalışmaya devam eder.

AI tarafında hedeflenen kullanım alanları:

- Proje risk analizi
- Finans değerlendirmesi
- İş yükü yorumu
- Sohbet
- İçgörü üretimi

API key'ler environment içinde tutulmaz. Owner ayarlar üzerinden girer ve server-side güvenli şekilde saklanır.

## Marka ve Görünüm

Neta self-hosted olduğu için kuran kişi uygulamayı kendi markasına göre düzenleyebilir.

Özelleştirilebilir alanlar:

- Workspace adı
- Meta title
- Kısa uygulama adı
- Favicon
- Light logo
- Dark logo
- Ana renk
- Tema tercihi

Bu ayarlar dashboard, müşteri portalı ve mobil discovery endpointleriyle uyumlu olacak şekilde merkezi olarak saklanır.

## Mobil Hazırlık

Neta ileride mobil uygulamalarla bağlanabilecek şekilde hazırlanmıştır.

Public meta ve health endpointleri sayesinde mobil istemci bir Neta instance'ını tanıyabilir. Marka bilgisi, uygulama adı, logo URL'leri ve temel capability bilgileri bu endpointler üzerinden alınabilir.

## Backup ve Restore

Neta kendi backup ve restore araçlarına sahiptir.

Backup ile database ve upload ağacı güvenli şekilde dışa alınabilir. Restore işlemiyle daha önce alınmış bir backup tekrar kullanılabilir.

Bu yapı özellikle self-hosted sistemlerde önemlidir. Çünkü veri sorumluluğu uygulamayı kuran kişidedir.

## Supabase'siz Mimari

Neta'nın güncel self-hosted sürümü Supabase runtime bağımlılığı taşımaz.

Artık uygulama çalışmak için şunlara ihtiyaç duymaz:

- Supabase URL
- Supabase anon key
- Supabase service role key
- Supabase Auth
- Supabase Storage
- Supabase PostgreSQL

Uygulama kendi backend mantığını Next.js server tarafında çalıştırır.

## Özet

Neta'nın temel özellikleri freelancerın günlük iş yönetimini sadeleştirmek üzerine kuruludur. Müşteri, proje, görev, finans, takvim, günlük, AI ve portal akışları birlikte çalışarak kişisel ama profesyonel bir operasyon paneli oluşturur.
