---
title: Faz 0 ADR Seti
description: Neta cok dilli sisteminin baslangic karar kayitlari.
phase: 0
status: accepted
last_updated: 2026-07-19
---

# Faz 0 ADR Seti

Bu dosya cok dillilik calismasinin ilk uygulama kararlarini kilitler. Amac,
sonraki fazlarda ayni problemi tekrar tekrar tartismadan ilerleyebilmek ve
SQLite tabanli self-host hedefini korumaktir.

## ADR-I18N-0001 — UI cevirisi ve domain icerik cevirisi ayrilacak

### Durum

Kabul edildi.

### Baglam

Neta'da iki farkli metin tipi var:

- Uygulamanin kendisine ait sabit arayuz metinleri.
- Freelancer veya musteri tarafindan uretilen is icerikleri.

Bu iki veri tipini ayni tabloda veya ayni anahtar modeliyle tutmak, hem fallback
hem de izin modeli tarafinda karmasa yaratir.

### Karar

Arayuz cevirileri stabil katalog anahtarlariyla yonetilecek. Built-in `tr` ve
`en` kataloglari kod icinde surumlenecek; instance sahibi tarafindan eklenen
override'lar SQLite icindeki `instance_ui_translations` modelinde tutulacak.

Domain icerik cevirileri entity ve field bazli tutulacak. Bunun icin Faz-1'de
`content_translations` modeli eklenecek.

### Sonuc

- Arayuz metinleri release sureciyle denetlenebilir kalir.
- Sonradan eklenen diller deployment gerektirmeden doldurulabilir.
- Is icerikleri icin form tab'lari net bicimde modellenir.
- Chat, gunluk notu ve musteri mesajlari gibi iletisim icerikleri otomatik
  cevrilmez; yazildigi dilde kalir.

## ADR-I18N-0002 — Locale cozumleme onceligi

### Durum

Kabul edildi.

### Baglam

Ayni instance icinde freelancer, musteri portali, davet ekranlari ve public API
farkli baglamlarda calisir. Locale cozumleme her yerde ayni kaynaga bakarsa
portal daveti gibi auth oncesi akislarda yanlis dil gorunebilir.

### Karar

Locale asagidaki sirayla cozumlenecek.

Auth oncesi davet ekranlari:

1. Davet kaydindaki locale.
2. Guvenli locale cookie'si.
3. Instance varsayilan dili.
4. Built-in fallback `tr`.

Freelancer uygulamasi:

1. Oturum acmis kullanicinin `user_preferences.language` degeri.
2. Guvenli locale cookie'si.
3. Instance varsayilan dili.
4. Built-in fallback `tr`.

Musteri portali:

1. Musteri profilinin veya `clients.portal_locale` alaninin locale degeri.
2. Portal davetinden gelen locale.
3. Guvenli locale cookie'si.
4. Instance varsayilan dili.
5. Built-in fallback `tr`.

Mobil ve API istekleri:

1. Auth kullanicisinin kayitli tercihi.
2. Guvenilir endpoint parametresi veya `Accept-Language` sinyali.
3. Instance varsayilan dili.
4. Built-in fallback `tr`.

### Sonuc

- Musteri davet ekrani login olmadan dogru dilde acilir.
- Freelancer tercihi musteri portalini yanlislikla etkilemez.
- Mobil istemci ayni kurallari API kontratindan okuyabilir.

## ADR-I18N-0003 — Dashboard ve portal route'larina locale prefix eklenmeyecek

### Durum

Kabul edildi.

### Baglam

`/tr/dashboard`, `/en/dashboard` gibi route prefix'leri public marketing
sitelerinde gucludur, ancak Neta'nin dashboard ve portal yapisi oturum, davet,
yetki ve self-host basitligi uzerine kurulu. Prefix eklemek route sayisini,
redirect davranislarini ve mobil endpoint eslemesini gereksiz buyutur.

### Karar

Dashboard, portal ve davet route'lari mevcut URL yapisini koruyacak. Dil, locale
resolver ve cookie/user/client kayitlariyla belirlenecek.

### Sonuc

- Var olan internal linkler ve mobil baglanti modeli korunur.
- Self-host deploy ve reverse proxy ayarlari sade kalir.
- Public landing/docs tarafi isterse ileride ayri route prefix stratejisi
  kullanabilir; bu karar sadece uygulama kabugu icindir.

## ADR-I18N-0004 — Hafif custom runtime i18n katmani yazilacak

### Durum

Kabul edildi.

### Baglam

Projenin ana hedeflerinden biri dependency sayisini azaltmak ve self-host'u
kolaylastirmak. Mevcut ihtiyaclar temel katalog cozumleme, fallback, namespace
yukleme, `Intl` bicimlendirme ve SQLite override okuma uzerinden karsilanabilir.

### Karar

Ilk cok dillilik surumunde agir bir i18n runtime dependency'si eklenmeyecek.
Neta icinde kucuk bir i18n katmani yazilacak:

- `lib/i18n/*` ortak tip ve format yardimcilari.
- `server/i18n/*` locale resolver, katalog merge ve translator servisleri.
- Client component'ler icin sinirli scope'ta provider.
- Tarih, sayi ve para bicimlendirme icin native `Intl`.

### Sonuc

- Yeni dependency eklenmeden Faz-2 runtime kurulabilir.
- Katalog sozlesmesi Neta'nin domain ihtiyaclarina gore sekillenir.
- Ileride ihtiyac buyurse baska kutuphaneye gecis icin katalog anahtarlari
  korunabilir.

## ADR-I18N-0005 — Built-in diller ve yayin kurali

### Durum

Kabul edildi.

### Karar

Turkce (`tr`) ve Ingilizce (`en`) built-in, aktif ve silinemez diller olacak.
Instance varsayilan dili ilk migration sonrasinda `tr` olacak.

Yeni eklenen diller once `draft` durumunda olusturulacak. Portal icin kritik
namespace'leri tamamlanmayan bir dil musteri dili olarak secilemeyecek.

### Sonuc

- Eksik ceviri musteriye yarim bir portal deneyimi olarak yansimaz.
- Instance sahibi yeni dili hazirlayip test ettikten sonra aktif edebilir.
- Fallback davranisi her zaman tahmin edilebilir kalir.
