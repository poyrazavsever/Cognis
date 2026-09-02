---
title: Özelleştirme
description: Neta'da marka, logo, favicon, tema ve görünüm ayarlarının nasıl yönetildiğini açıklar.
order: 4
---

# Özelleştirme

Neta, self-host eden kişinin kendi markasını taşıyabilecek şekilde tasarlanmıştır. Kullanıcı yalnızca verilerini değil, uygulamanın görünümünü ve müşteri portalında görünen temel marka bilgisini de kontrol eder.

## Özelleştirilebilir Alanlar

Neta içinde şu alanlar özelleştirilebilir:

- Workspace adı
- Firma veya freelancer adı
- Meta title
- Kısa uygulama adı
- Light tema logosu
- Dark tema logosu
- Favicon
- Ana renk
- Tema modu

Bu ayarlar sistemde merkezi olarak tutulur ve arayüzün farklı bölümlerinde kullanılır.

## Workspace Adı

Workspace adı, uygulamanın kurulu olduğu iş alanını temsil eder.

Bu değer dashboard, ayarlar ve mobil meta endpointleri gibi alanlarda kullanılabilir. Freelancer kendi adıyla, şirket adıyla veya müşteri karşısına çıkmak istediği marka adıyla bu alanı doldurabilir.

Örnekler:

```text
Poyraz Studio
Neta Works
Freelance OS
Avsever Digital
```

## Meta Title

Meta title, tarayıcı sekmesinde ve arama motoru önizlemelerinde kullanılabilecek başlık bilgisidir.

Örnek:

```text
Poyraz Studio Portal
```

Bu alan özellikle müşteri portalı deneyiminde önemlidir. Müşteri linki açtığında tarayıcıda genel veya alakasız bir başlık yerine freelancerın kendi marka adı görünür.

## Kısa Uygulama Adı

Kısa uygulama adı mobil istemciler, manifest benzeri alanlar ve kompakt gösterimler için kullanılabilir.

Örnek:

```text
Poyraz
Neta
Studio
```

## Light ve Dark Logo

Neta light ve dark tema için ayrı logo destekler.

Bu önemlidir çünkü tek bir logo her iki tema üzerinde iyi görünmeyebilir. Açık zeminde kullanılan koyu logo, koyu zeminde kaybolabilir. Aynı şekilde koyu tema için hazırlanan açık logo, light modda kötü görünebilir.

Önerilen yapı:

- Light tema logosu: açık arka plan üzerinde iyi görünen logo
- Dark tema logosu: koyu arka plan üzerinde iyi görünen logo

Sidebar üzerinde yalnızca logo görseli gösterilir. Ekstra yazı veya açıklama kullanılmaz.

## Favicon

Favicon, tarayıcı sekmesinde görünen küçük ikon dosyasıdır.

Neta içinde favicon ayarı yapıldığında uygulamanın root layout'u bu bilgiyi kullanır. Böylece self-host edilen instance kendi küçük marka işaretini taşır.

Önerilen formatlar:

- `.ico`
- `.png`
- kare oranlı görsel

## Ana Renk

Ana renk, uygulamanın vurgu rengini belirler.

Bu renk butonlar, seçili durumlar, aktif menüler ve bazı arayüz vurgularında kullanılabilir. Amaç tüm uygulamayı tek bir renge boyamak değil, markaya ait tanınabilir bir vurgu oluşturmaktır.

İyi bir ana renk seçimi için öneriler:

- Çok düşük kontrastlı renklerden kaçının.
- Hem dark hem light modda okunabilirliği kontrol edin.
- Marka rengini çok parlak seçiyorsanız arayüzde göz yormadığından emin olun.
- Kırmızı gibi uyarı anlamı taşıyan renkleri ana renk yaparken dikkatli olun.

## Tema Modu

Neta üç tema tercihini destekleyebilir:

- Light
- Dark
- System

System seçeneği kullanıcının işletim sistemi veya tarayıcı tercihine göre görünümü belirler.

## Ayarların Saklanması

Branding ve görünüm ayarları SQLite içinde tutulur.

Logo ve favicon gibi dosyalar local upload alanına kaydedilir. Production ortamında bu alan `/app/data` içindeki persistent volume üzerinde bulunmalıdır.

Tipik veri yapısı:

```text
/app/data/
  uploads/
  neta.db
```

Bu sayede container yeniden oluşturulsa bile marka ayarları ve yüklenen dosyalar korunur.

## Müşteri Portalına Etkisi

Özelleştirme yalnızca owner dashboard'u için değildir. Müşteri portalı da aynı marka bilgisini kullanır.

Böylece müşteri portalına giren kişi, freelancerın kendi domain'i ve markası altında profesyonel bir deneyim görür.

Müşteri tarafında özellikle şunlar önemlidir:

- Logo
- Favicon
- Meta title
- Ana renk
- Tema uyumu

## Mobil Tarafa Etkisi

Neta'nın marka bilgileri ileride mobil istemciler tarafından da kullanılabilecek şekilde kurgulanır.

Mobil uygulama bir Neta instance'ına bağlandığında `/api/v1/meta` gibi public endpointlerden marka bilgilerini alabilir.

Bu bilgiler:

- Workspace adı
- Uygulama adı
- Logo URL'leri
- Favicon URL'i
- Ana renk
- Capability bilgileri

gibi alanları içerebilir.

## Önerilen Kurulum Sırası

Yeni bir Neta instance'ı kurulduktan sonra önerilen özelleştirme sırası:

1. Workspace adını belirleyin.
2. Meta title girin.
3. Light logo yükleyin.
4. Dark logo yükleyin.
5. Favicon yükleyin.
6. Ana rengi seçin.
7. Light ve dark modda görsel kontrol yapın.
8. Müşteri portalı görünümünü test edin.

## Özet

Neta'nın özelleştirme sistemi, self-host edilen uygulamanın freelancerın kendi ürünü gibi görünmesini sağlar. Logo, favicon, renk, tema ve workspace ayarları merkezi olarak yönetilir ve hem dashboard hem müşteri portalı hem de ileride mobil istemciler tarafından kullanılabilecek şekilde hazırlanır.
