---
title: Nasıl Kullanılır?
description: Neta'nın ilk kurulumdan günlük kullanıma kadar temel kullanım akışını açıklar.
order: 2
---

# Nasıl Kullanılır?

Neta'nın kullanım akışı ilk owner hesabının oluşturulmasıyla başlar. Ardından workspace ayarları yapılır, müşteriler eklenir, projeler oluşturulur ve müşteri portalı aktif olarak kullanılmaya başlanır.

## İlk Giriş

Yeni kurulumdan sonra ilk yapılması gereken işlem owner hesabını oluşturmaktır.

Tarayıcıdan şu adrese gidilir:

```text
https://neta.example.com/register
```

İlk kayıt başarılı olduğunda sistem bu hesabı owner olarak kabul eder. Public kayıt bundan sonra kapanır. Böylece başka bir kişi aynı ekrandan yeni owner hesabı oluşturamaz.

## Owner Hesabı

Owner hesabı sistemin ana yöneticisidir.

Owner şunları yapabilir:

- Workspace ayarlarını yönetebilir.
- Logo, favicon, renk ve tema seçebilir.
- Müşteri oluşturabilir.
- Müşteri portal hesabı açabilir.
- Proje, görev, finans ve günlük kayıtlarını yönetebilir.
- AI sağlayıcılarını ayarlayabilir.
- Backup ve restore süreçlerini yürütebilir.

## İlk Ayarlar

Owner hesabı oluşturulduktan sonra önerilen ilk adım ayarlar ekranına gitmektir.

Burada şu bilgiler girilir:

- Workspace adı
- Meta title
- Kısa uygulama adı
- Light logo
- Dark logo
- Favicon
- Ana renk
- Tema tercihi

Bu bilgiler hem dashboard hem müşteri portalı hem de mobil discovery endpointleri için temel marka verisini oluşturur.

## Müşteri Oluşturma

Müşteriler, Neta'da iş akışının merkezindedir.

Yeni müşteri oluştururken genellikle şu bilgiler girilir:

- Müşteri adı
- Firma adı
- E-posta
- Telefon
- Notlar
- Durum bilgisi

Müşteri oluşturulduktan sonra bu müşteriye proje, finans kaydı ve portal erişimi bağlanabilir.

## Portal Hesabı Açma

Bir müşteriye portal erişimi vermek için müşteri detay ekranından davet veya portal hesabı akışı başlatılır.

Genel akış şöyledir:

1. Owner müşteri detayına girer.
2. Portal hesabı oluşturma veya davet üretme işlemini başlatır.
3. Sistem tek kullanımlık veya süreli bir davet bağlantısı üretir.
4. Müşteri bağlantıyı açar.
5. Müşteri kendi şifresini belirler.
6. Müşteri hesabı ilgili müşteri kaydına bağlanır.

Müşteri giriş yaptıktan sonra yalnızca kendisine ait verileri görebilir.

## Proje Oluşturma

Projeler müşterilere bağlı ya da bağımsız şekilde takip edilebilir.

Bir proje genellikle şu bilgileri içerir:

- Proje adı
- Bağlı müşteri
- Durum
- Öncelik
- Başlangıç ve teslim tarihi
- Açıklama
- Görevler
- Finans kayıtları

Proje detay ekranı, ilgili işin operasyon merkezi gibi düşünülebilir.

## Görev Takibi

Görevler proje içindeki yapılacak işleri takip etmek için kullanılır.

Görevlerde şu alanlar bulunabilir:

- Başlık
- Açıklama
- Durum
- Öncelik
- Teslim tarihi
- Bağlı proje

Görevler liste veya kanban düzeninde incelenebilir. Kanban görünümü, işin hangi aşamada olduğunu hızlıca anlamak için kullanışlıdır.

## Takvim Kullanımı

Takvim, işin zamansal tarafını yönetir.

Buraya şunlar eklenebilir:

- Toplantılar
- Teslim tarihleri
- Müşteri görüşmeleri
- Proje kilometre taşları
- Hatırlatmalar

Takvim sayesinde freelancer yalnızca yapılacak işleri değil, bu işlerin zaman içindeki dağılımını da görebilir.

## Finans Kaydı Oluşturma

Finans modülü gelir ve gider takibi için kullanılır.

Kayıt türleri:

- Gelir
- Gider
- Bekleyen ödeme

Finans kayıtları müşteri veya proje ile ilişkilendirilebilir. Bu sayede hangi müşteriden ne kadar gelir geldiği veya hangi proje için ne kadar gider oluştuğu daha net takip edilir.

## Günlük Kullanımı

Günlük alanı freelancerın çalışma geçmişini tutmak için kullanılır.

Günlük kayıtlarında iş notları, ruh hali, enerji seviyesi ve kısa değerlendirmeler tutulabilir. Bu alan zaman içinde kişinin kendi çalışma ritmini anlamasına yardımcı olur.

## AI Kullanımı

AI özellikleri opsiyoneldir.

Owner ayarlardan desteklenen sağlayıcılardan birini yapılandırabilir. API key'ler browser'a gönderilmez, server-side güvenli şekilde saklanır.

AI şu alanlarda kullanılabilir:

- Proje risk analizi
- Finans yorumu
- Genel iş analizi
- Sohbet
- Özetleme ve içgörü üretimi

## Günlük İş Akışı Örneği

Tipik bir Neta kullanım günü şöyle ilerleyebilir:

1. Dashboard açılır.
2. Aktif projeler ve bekleyen görevler kontrol edilir.
3. Takvimde günün toplantıları incelenir.
4. Yeni müşteri veya proje varsa sisteme eklenir.
5. Yapılan işler görevlerde güncellenir.
6. Gelir veya gider kaydı varsa finans ekranına girilir.
7. Gün sonunda günlük notu oluşturulur.

## Müşteriyle Çalışma Akışı

Müşteri tarafında önerilen akış şöyledir:

1. Owner müşteri kaydı oluşturur.
2. Proje oluşturulur ve müşteriye bağlanır.
3. Gerekli görevler eklenir.
4. Müşteriye portal daveti gönderilir.
5. Müşteri portal üzerinden proje durumunu takip eder.
6. Owner gerektiğinde portalda görünen bilgileri günceller.

Bu yapı, müşteriyle yapılan manuel durum yazışmalarını azaltır.

## Özet

Neta'nın kullanım mantığı; önce sistemi kendi markana göre hazırlamak, ardından müşterileri ve projeleri sisteme almak, sonrasında günlük operasyonu dashboard, görevler, takvim, finans ve portal üzerinden yürütmektir.
