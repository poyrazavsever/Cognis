---
title: Faz 0 I18n Fixture Plani
description: Cok dillilik migration, katalog ve portal testleri icin seed senaryolari.
phase: 0
status: completed
last_updated: 2026-07-19
---

# Faz 0 I18n Fixture Plani

Bu plan Faz-1 sonrasinda script veya test fixture'ina donusturulecek veri setini
tanımlar. Hedef, locale resolver, fallback, domain icerik cevirileri ve portal
dili davranisini ayni senaryoda dogrulamaktir.

## Locale fixture'lari

| Locale | Durum | Built-in | Fallback | Amac |
| --- | --- | --- | --- | --- |
| `tr` | `active` | Evet | Yok | Instance default ve mevcut verinin ana dili. |
| `en` | `active` | Evet | `tr` | Built-in ikinci dil ve portal client testi. |
| `fr` | `draft` | Hayir | `en` | Eksik katalog/fallback testi. |
| `ar-XB` | `test` | Hayir | `en` | RTL smoke ve layout kontrolu. |

`tr` ve `en` silinemez. `fr` portal dili olarak ancak kritik portal namespace'leri
tamamlaninca secilebilir. `ar-XB` urun ayarlarinda normal kullaniciya
gosterilmez.

## Katalog fixture'lari

### Turkce built-in katalog

Tum namespace'lerde eksiksiz olmalidir:

- `common`
- `auth`
- `navigation`
- `dashboard`
- `clients`
- `projects`
- `tasks`
- `calendar`
- `finance`
- `journal`
- `chat`
- `settings`
- `portal`
- `status`
- `validation`
- `api`

### Ingilizce built-in katalog

Turkce ile ayni anahtar setine sahip olmalidir. Faz-2 testinde anahtar farki
release engeli kabul edilir.

### Eksik Fransizca katalog

Fallback test etmek icin bilincli olarak kismi tutulur.

Ornek:

```json
{
  "navigation.dashboard": "Tableau de bord",
  "navigation.projects": "Projets",
  "portal.dashboard.title": "Apercu",
  "common.save": "Enregistrer"
}
```

Beklenen davranis: Eksik `portal.tasks.title` gibi anahtarlarda once `en`, sonra
`tr` fallback metni gosterilir; kullaniciya ham anahtar basılmaz.

## Auth fixture'lari

| Kullanici | Rol | Email | Dil | Baglam |
| --- | --- | --- | --- | --- |
| Freelancer | `admin` | `owner@neta.local` | `tr` | Dashboard, ayarlar ve ceviri yonetimi. |
| Turkce musteri | `client` | `client-tr@neta.local` | `tr` | Portal default dil testi. |
| Ingilizce musteri | `client` | `client-en@neta.local` | `en` | Portal client locale testi. |

Freelancer hesabi instance default dilini `tr` olarak korur. Ingilizce musteri
icin davet kaydinda ve `clients.portal_locale` alaninda `en` beklenir.

## Domain veri fixture'i

### Musteriler

| ID | Ad | Portal dili | Not |
| --- | --- | --- | --- |
| `client-tr` | Ada Yilmaz | `tr` | Turkce portal goruntusu. |
| `client-en` | Nova Studio | `en` | Ingilizce portal goruntusu. |

### Projeler

| ID | Musteri | Default baslik | EN baslik | FR baslik | Not |
| --- | --- | --- | --- | --- |
| `project-website` | `client-tr` | Web sitesi yenileme | Website refresh | Bos | Fallback testi. |
| `project-brand` | `client-en` | Marka kiti | Brand kit | Kit de marque | Portal EN ve FR content testi. |

Beklenen davranis:

- `tr` isteyen kullanici default kolon veya `content_translations(tr)` degerini
  gorur.
- `en` isteyen kullanici EN content translation'i gorur.
- `fr` isteyen kullanici FR alan bos ise fallback zinciriyle EN veya TR gorur.

### Gorevler

| ID | Proje | Public | TR baslik | EN baslik |
| --- | --- | --- | --- | --- |
| `task-wireframe` | `project-website` | Evet | Ana sayfa wireframe | Homepage wireframe |
| `task-internal` | `project-website` | Hayir | Ic notlari toparla | Gather internal notes |

Portal yalnizca `is_public_to_client = true` gorevleri gosterir.

### Planlama bolumleri

| ID | Proje | Kategori | TR baslik | EN baslik |
| --- | --- | --- | --- | --- |
| `plan-scope` | `project-website` | `scope` | Kapsam | Scope |
| `plan-delivery` | `project-website` | `delivery` | Teslimat | Delivery |

Kategori teknik degeri cevrilmez; label `status` veya `projects` namespace'inden
gelir.

## Portal davet fixture'lari

| Davet | Email | Locale | Beklenen ekran dili |
| --- | --- | --- | --- |
| `invite-tr` | `client-tr@neta.local` | `tr` | Turkce |
| `invite-en` | `client-en@neta.local` | `en` | Ingilizce |
| `invite-fr-draft` | `client-en@neta.local` | `fr` | Portal publish kurali nedeniyle reddedilir veya fallback EN kullanir. |

Davet ekranlari auth oncesi oldugu icin locale'i session'dan degil davet
kaydindan alir.

## API contract fixture'lari

`/api/v1/meta` Faz-8 sonunda en az su localization bilgisini dondurmelidir:

```json
{
  "localization": {
    "defaultLocale": "tr",
    "supportedLocales": [
      { "code": "tr", "name": "Turkce", "status": "active", "builtIn": true },
      { "code": "en", "name": "English", "status": "active", "builtIn": true },
      { "code": "fr", "name": "Francais", "status": "draft", "builtIn": false }
    ],
    "fallbacks": {
      "en": "tr",
      "fr": "en"
    }
  }
}
```

Mobil istemci aktif olmayan dilleri kullanici seciminde gostermemeli, ancak
ceviri yonetimi ekranlari icin admin API'de draft dilleri gorebilmelidir.

## Smoke beklentileri

Faz-2 sonrasinda:

- `t("common.save")` `tr` icin `Kaydet`, `en` icin `Save` dondurur.
- `fr` locale'inde eksik anahtar ham key olarak gosterilmez.
- `formatMoney(10000, "TRY", "tr")` Turkce bicim verir.
- `formatDate(..., "en")` Ingilizce ay adi verir.

Faz-6 sonrasinda:

- `client-en` portali EN navigasyon ve EN proje basliklariyla acilir.
- `client-tr` portali TR kalir.
- Davet kabul edildikten sonra secilen locale client kaydina yansir.

Faz-8 sonrasinda:

- `/api/v1/meta` supported locale listesini dondurur.
- `/api/v1/me` kullanicinin etkin locale'ini ve fallback chain'ini dondurur.
- API hata response'lari stabil kod + locale'e uygun insan okunur mesaj tasir.
