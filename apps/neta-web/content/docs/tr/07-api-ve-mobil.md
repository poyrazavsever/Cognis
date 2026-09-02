---
title: API ve Mobil Hazırlık
description: Neta'nın mobil istemciler ve public instance discovery için sunduğu API yaklaşımını açıklar.
order: 7
---

# API ve Mobil Hazırlık

Neta yalnızca web paneli olarak değil, ileride mobil istemcilerle de bağlanabilecek bir self-hosted instance yapısı olarak tasarlanır.

Mobil uygulama tarafındaki temel fikir şudur: kullanıcı kendi Neta instance URL'ini girer veya ileride üretilecek bir bağlantı koduyla kendi kurulumuna bağlanır.

## Instance Discovery

Bir mobil istemci veya harici client, Neta instance'ını tanımak için public endpointleri kullanabilir.

Temel endpointler:

```text
GET /.well-known/neta
GET /api/v1/meta
GET /api/v1/health
```

Bu endpointler oturum gerektirmeden instance hakkında temel bilgi verir.

## Kullanıcı Bilgisi

Oturum sahibi kullanıcıyı almak için:

```text
GET /api/v1/me
```

Bu endpoint Better Auth session gerektirir.

Session yoksa kullanıcı bilgisi dönmez. Token, secret veya hassas bilgi response içinde paylaşılmaz.

## Meta Endpoint

`/api/v1/meta`, uygulamanın public marka ve capability bilgisini döndürmek için kullanılır.

Bu endpoint ileride mobil istemcinin ilk ekranını doğru marka bilgisiyle açmasını sağlar.

Dönebilecek bilgiler:

- Workspace adı
- Uygulama adı
- Meta title
- Light logo URL'i
- Dark logo URL'i
- Favicon URL'i
- Ana renk
- Desteklenen özellikler
- Minimum mobil sürüm

## Health Endpoint

`/api/v1/health`, mobil veya harici istemcilerin instance'ın ayakta olup olmadığını anlayabilmesi için kullanılabilir.

Bu endpoint kapsamlı internal readiness yerine daha hafif bir uyumluluk kontrolü olarak düşünülebilir.

## Mobil Bağlantı Senaryosu

Planlanan mobil bağlantı deneyimi şu şekilde olabilir:

1. Kullanıcı mobil uygulamayı açar.
2. Kendi Neta site URL'ini girer.
3. Mobil uygulama `/.well-known/neta` endpointini kontrol eder.
4. Instance geçerliyse `/api/v1/meta` ile marka bilgilerini alır.
5. Kullanıcı giriş yapar.
6. `/api/v1/me` ile oturum doğrulanır.
7. Mobil uygulama kullanıcının rolüne göre ekranları açar.

## Device Pairing

Cihaz kodu veya QR ile bağlanma akışı planlanmıştır ancak runtime'da aktif olmayabilir.

Bu yaklaşımda owner web panelinden bir bağlantı kodu üretir, mobil uygulama bu kodla instance'a bağlanır ve güvenli pairing tamamlanır.

Bu özellik aktif edilene kadar site URL'i ile bağlantı daha sade bir başlangıç modeli olarak kullanılabilir.

## Güvenlik İlkeleri

Mobil ve API tarafında şu ilkeler korunmalıdır:

- Public endpointler secret döndürmemelidir.
- API key'ler browser veya mobil client'a gönderilmemelidir.
- Kullanıcı yalnızca kendi rolüne uygun veriyi görmelidir.
- Müşteri kullanıcısı başka müşterinin verisine erişememelidir.
- Owner-only ayarlar server tarafında korunmalıdır.
- Instance URL doğrulaması HTTPS üzerinden yapılmalıdır.

## Müşteri Portalı ve Mobil

Müşteri portalındaki izolasyon mantığı mobil taraf için de geçerli olmalıdır.

Müşteri kullanıcısı mobil uygulamadan bağlanırsa yalnızca kendisine ait:

- Projeleri
- Görevleri
- Paylaşılan bilgileri
- Portal iletişimini

görebilmelidir.

## Özet

Neta'nın API ve mobil hazırlığı, self-hosted instance'ların ileride web dışındaki istemcilerle de kullanılabilmesi için temel oluşturur. Public discovery endpointleri, marka bilgisi ve session tabanlı kullanıcı endpointleri bu yapının başlangıç noktasıdır.
