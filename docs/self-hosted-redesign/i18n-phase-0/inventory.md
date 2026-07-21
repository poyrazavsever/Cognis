---
title: Faz 0 I18n Envanteri
description: Kullaniciya gorunen metinler, locale sabitleri ve namespace migration envanteri.
phase: 0
status: completed
last_updated: 2026-07-19
---

# Faz 0 I18n Envanteri

Bu envanter Faz-1 ve Faz-2 icin kapsam sinirini belirler. Liste uygulama
kodunun mevcut durumuna gore hazirlandi; yeni sayfa eklendikce ayni namespace
modeliyle genisletilmelidir.

## Namespace standardi

Katalog anahtarlari `namespace.section.item` biciminde olacak. Turkce cumleler
anahtar olarak kullanilmayacak.

| Namespace | Sahip oldugu alan |
| --- | --- |
| `common` | Kaydet, iptal, sil, ara, filtrele, yukleniyor, bos durum, toast eylemleri |
| `auth` | Login, register, setup, davet kabul, auth hata mesajlari |
| `navigation` | Freelancer ve portal sidebar grup/link label'lari |
| `dashboard` | Freelancer ana sayfa basliklari, stats, grafik ve son kayit kartlari |
| `clients` | Musteri liste, detay, form, portal hesap islemleri |
| `projects` | Proje liste, detay, form, planlama, revizyon ve risk analizi |
| `tasks` | Gorev liste, kanban, form, durum ve oncelik UI metinleri |
| `calendar` | Takvim, etkinlik kartlari, etkinlik formu |
| `finance` | Finans stats, islem formu, kategori, AI analiz modal'i |
| `journal` | Gunluk liste, form, mood/enerji label'lari |
| `chat` | Sohbet listesi, bos durum, hata ve input metinleri |
| `settings` | Genel gorunum, marka, AI, profil, dil yonetimi |
| `portal` | Musteri portal dashboard, projeler, gorevler, revizyonlar |
| `status` | Enum label'lari: status, priority, type, pipeline, payment |
| `validation` | Form/action hata ve basari mesajlari |
| `api` | Mobil/public API hata kodlari icin insan okunur mesajlar |

## Freelancer migration listesi

Faz-4'te asagidaki sirayla UI sabitleri katalog anahtarina alinacak.

| Sira | Route veya dosya | Namespace'ler | Not |
| --- | --- | --- | --- |
| 1 | `config/sidebar.ts` | `navigation` | Sidebar link ve grup adlari merkezi baslangic noktasi. |
| 2 | `components/layout/app-shell.tsx` | `navigation`, `common`, `settings` | Account menu, tema ve layout metinleri. |
| 3 | `app/(dashboard)/page.tsx`, `dashboard-client.tsx` | `dashboard`, `common`, `status` | Ana stats, grafik bos durumlari ve tarih/para formatlari. |
| 4 | `app/(dashboard)/clients/*` | `clients`, `common`, `status`, `validation` | Liste, detay, portal hesabi, activity mesajlari. |
| 5 | `app/(dashboard)/projects/*` | `projects`, `common`, `status`, `validation` | Proje formu, planlama, revizyon ve risk analizi. |
| 6 | `app/(dashboard)/tasks/*` | `tasks`, `common`, `status`, `validation` | Liste/kanban ayrimi ve gorev action metinleri. |
| 7 | `app/(dashboard)/calendar/*` | `calendar`, `common`, `status` | Date formatting Faz-2 format yardimcilarina tasinir. |
| 8 | `app/(dashboard)/finance/*` | `finance`, `common`, `status`, `validation` | Para formatting ve AI modal metinleri. |
| 9 | `app/(dashboard)/journal/*` | `journal`, `common`, `validation` | Mood label'lari ve date formatter'lar. |
| 10 | `app/(dashboard)/chat/*`, `app/api/chat/route.ts` | `chat`, `api`, `validation` | Kullaniciya donen hata mesaji daha detayli hale getirilmisti; i18n anahtariyla baglanacak. |
| 11 | `app/(dashboard)/settings/*` | `settings`, `common`, `validation` | Dil yonetimi Faz-3'te eklenecegi icin en son genisletilir. |
| 12 | `app/(dashboard)/analytics/*`, `business/*` | `dashboard`, `finance`, `common` | Mevcut business ekranlari i18n kapsamina alinacak. |

## Portal migration listesi

Portal Faz-6'da musteri diliyle birlikte ele alinacak.

| Sira | Route veya dosya | Namespace'ler | Not |
| --- | --- | --- | --- |
| 1 | `config/portal-sidebar.ts` | `navigation`, `portal` | Portal navigasyon label'lari. |
| 2 | `components/layout/portal-shell.tsx` | `portal`, `navigation`, `common` | Kullanici menu ve kabuk metinleri. |
| 3 | `app/portal/page.tsx` | `portal`, `dashboard`, `common` | Musteri dashboard stats ve bos durumlari. |
| 4 | `app/portal/projects/page.tsx` | `portal`, `projects`, `status` | Proje liste metinleri ve tarih formatlari. |
| 5 | `app/portal/projects/[id]/*` | `portal`, `projects`, `tasks`, `status`, `validation` | Cevrilebilir project/task content resolver kullanir. |
| 6 | `app/portal/tasks/page.tsx` | `portal`, `tasks`, `status` | Public gorev metinleri. |
| 7 | `app/portal/revisions/page.tsx` | `portal`, `projects`, `validation` | Revizyon talepleri yazildigi dilde kalir. |
| 8 | `app/invite/[token]/*` | `auth`, `portal`, `validation` | Auth oncesi davet locale'iyle render edilir. |

## Auth ve API migration listesi

| Alan | Dosya | Namespace | Not |
| --- | --- | --- | --- |
| Admin setup | `app/register/page.tsx`, `app/login/*` | `auth`, `validation` | Cift toast fix'i korunarak metinler kataloglanir. |
| Better Auth route | `app/api/auth/[...all]/route.ts` | `api`, `auth` | Kullaniciya acik hata mapping'i gerekir. |
| Portal invitations API | `app/api/portal-invitations/*` | `api`, `portal` | Locale parametresi Faz-6'da kontrata eklenir. |
| Mobile API v1 | `app/api/v1/*`, `server/api/v1/*` | `api`, `common` | Meta endpoint supported/default locale bilgisini dondurur. |
| Branding API | `app/api/branding/*` | `api`, `settings` | Workspace gorunum metinleri ve mobile consumption ayni kalir. |

## Sabit locale kullanimlari

Asagidaki kullanimlar Faz-2 format yardimcilariyla degistirilecek.

| Kullanim | Dosyalar |
| --- | --- |
| `<html lang="tr">` | `app/layout.tsx` |
| `date-fns/locale/tr` | `app/portal/page.tsx`, `app/portal/projects/page.tsx`, `app/portal/tasks/page.tsx`, `app/portal/revisions/page.tsx`, `app/portal/projects/[id]/portal-project-client.tsx`, `app/(dashboard)/clients/clients-client.tsx`, `app/(dashboard)/clients/[id]/client-detail-client.tsx`, `app/(dashboard)/business/proposals/proposals-client.tsx`, `app/(dashboard)/business/invoices/invoices-client.tsx`, `app/(dashboard)/business/subscriptions/subscriptions-client.tsx` |
| `Intl.*("tr-TR")` | `dashboard-client.tsx`, `calendar-client.tsx`, `finance-client.tsx`, `journal-client.tsx`, `projects-client.tsx`, `project-detail-client.tsx`, `tasks-client.tsx`, business client'lari |
| `toLocaleDateString("tr-TR")` | `dashboard-client.tsx`, `project-detail-client.tsx` |
| `localeCompare(..., "tr")` | `app/(dashboard)/projects/page.tsx` |

## Kullaniciya gorunen sabit metin kaynaklari

Turkce karakter iceren veya dogrudan kullaniciya donen string barindirma ihtimali
en yuksek alanlar:

| Klasor | Kapsam |
| --- | --- |
| `app/(dashboard)` | Freelancer ekranlarinin buyuk bolumu. |
| `app/portal` | Musteri portali. |
| `app/invite` | Auth oncesi portal daveti. |
| `app/login`, `app/register` | Auth ekranlari. |
| `app/api` | Kullaniciya donen JSON hata/basari metinleri. |
| `components/layout` | Sidebar, account menu ve shell metinleri. |
| `components/system` | Ortak page header, stat card ve empty/error state metinleri. |
| `config/sidebar.ts` | Freelancer navigasyon metinleri. |
| `config/portal-sidebar.ts` | Portal navigasyon metinleri. |
| `server/auth`, `server/services`, `server/ai` | Server action/API hata ve toast mesajlari. |

## Cevrilebilir domain alan registry'si

Ilk surumde asagidaki alanlar `content_translations` ile locale bazli
cevrilebilir kabul edilir.

| Entity | Field | Zorunlu locale | Not |
| --- | --- | --- | --- |
| `projects` | `name` | Instance default | Mevcut kolon backfill kaynagi. |
| `projects` | `description` | Opsiyonel | Portal ve freelancer detayinda kullanilir. |
| `projects` | `coverImageAlt` | Opsiyonel | A11y icin portalda onemli. |
| `tasks` | `title` | Instance default | Public/private fark etmeksizin ayni alan modeli. |
| `tasks` | `description` | Opsiyonel | Musteriye acik gorevlerde portalda gosterilir. |
| `calendar_events` | `title` | Instance default | Etkinlik ortak alandir, ileride portal visibility eklenirse hazir. |
| `calendar_events` | `description` | Opsiyonel |  |
| `clients` | `notes` | Opsiyonel | Ilk surumde internal kalir; ceviri desteklenebilir ama portalda gosterilmez. |
| `planning_sections` | `title` | Instance default | Proje planlama bolumleri icin. |
| `planning_sections` | `content` | Opsiyonel | Rich text degilse plain text olarak saklanir. |
| `branding/settings` | `workspaceName` | Instance default | UI/portal basliklari ve mobile meta icin. |
| `branding/settings` | `metaTitle` | Instance default | Browser metadata. |
| `branding/settings` | `metaDescription` | Opsiyonel | SEO/public metadata. |

Ilk surumde cevrilmeyecek alanlar:

- Chat mesajlari.
- Revizyon talepleri.
- Gunluk notlari.
- Finans islem aciklamalari.
- Maliyet, tarih, para birimi, yuzde ve enum teknik degerleri.

## RTL test locale'i

Ilk release hedefi LTR diller olsa da layout kirilmasini erkenden gormek icin
test locale'i `ar-XB` olarak belirlendi.

Bu locale aktif urun dili olarak sunulmayacak. Faz-7'de `dir="rtl"` davranisini,
sidebar hizalamalarini, form tab'larini ve modal yerlesimlerini smoke etmek icin
fixture olarak kullanilacak.
