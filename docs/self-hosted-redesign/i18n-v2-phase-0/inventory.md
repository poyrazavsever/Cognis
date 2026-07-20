# I18n V2 Faz 0 — Sayfa ve içerik envanteri

## Sayfa envanteri

| Yüzey | Route | Ana dosya | Plan fazı |
| --- | --- | --- | --- |
| Dashboard | `/` | `app/(dashboard)/dashboard-client.tsx` | 19 |
| Analizler | `/analytics` | `analytics-client.tsx` | 20 |
| Takvim | `/calendar` | `calendar-client.tsx` | 21 |
| Müşteriler | `/clients` | `clients-client.tsx` | 22 |
| Müşteri detay | `/clients/[id]` | `client-detail-client.tsx` | 23 |
| Projeler | `/projects` | `projects-client.tsx` | 24 |
| Proje detay | `/projects/[id]` | `project-detail-client.tsx` | 25 |
| Görevler | `/tasks` | `tasks-client.tsx` | 26 |
| Finans | `/finance` | `finance-client.tsx` | 27 |
| Günlük | `/journal` | `journal-client.tsx` | 28 |
| Sohbet | `/chat` | `app/(dashboard)/chat/page.tsx` | 29 |
| Teklifler | `/business/proposals` | `proposals-client.tsx` | 30 |
| Faturalar | `/business/invoices` | `invoices-client.tsx` | 31 |
| Abonelikler | `/business/subscriptions` | `subscriptions-client.tsx` | 32 |
| Login | `/login` | `app/login/page.tsx` | 14 |
| İlk kayıt | `/register` | `app/register/page.tsx` | 15 |
| Şifremi unuttum | `/forgot-password` | ilgili `page.tsx` | 16 |
| Şifre sıfırlama | `/reset-password` | ilgili `page.tsx` | 17 |
| Portal daveti | `/invite/[token]` | ilgili `page.tsx` | 38 |
| Portal dashboard | `/portal` | ilgili `page.tsx` | 39 |
| Portal projeler | `/portal/projects` | ilgili `page.tsx` | 40 |
| Portal proje detay | `/portal/projects/[id]` | ilgili client/page | 41 |
| Portal görevler | `/portal/tasks` | ilgili `page.tsx` | 42 |
| Portal revizyonlar | `/portal/revisions` | ilgili `page.tsx` | 43 |

Settings route'ları Faz 2 ile oluşturulmuştur:

- `/settings/general`
- `/settings/appearance`
- `/settings/profile`
- `/settings/security`
- `/settings/ai`
- `/settings/language`
- `/settings/languages`

Dil ekleme, dil detayı, çeviri editörü ve import/export alt rotaları kendi sayfa
fazlarında oluşturulacaktır.

## UI metni yüzeyleri

Her route için aşağıdaki dosya türleri tarama kapsamındadır:

- `page.tsx`, client composition ve local component'ler
- `actions.ts` ve kullanıcıya dönen domain/API hataları
- `loading.tsx`, `error.tsx`, `not-found.tsx`
- Ortak shell, navigation, feedback, status ve confirmation component'leri
- Form label/placeholder/helper, dialog, toast, tooltip ve aria metinleri

İlk statik tarama Türkçe karakter içeren 46 aday dosya bulmuştur. En yüksek
adaylar:

| Dosya | Karakter eşleşmesi |
| --- | ---: |
| Settings geçiş içeriği | 184 |
| Proje detay client | 175 |
| Finans client | 128 |
| Günlük client | 106 |
| Müşteriler client | 95 |
| Projeler client | 94 |
| Chat API route | 82 |
| Görevler client | 77 |
| Müşteri detay client | 68 |
| Settings actions | 55 |
| Takvim client | 44 |

Bu sayı kesin kullanıcı metni sayısı değildir; yorum, hata ve teknik string'leri
de içeren bir regression baseline'dır. Her sayfa fazında adaylar sınıflandırılıp
kullanıcıya açık hard-coded metin sayısı sıfıra indirilir.

## Dinamik form/entity envanteri

| Entity | Çevrilebilir | Ortak kalacak |
| --- | --- | --- |
| Branding | welcome, footer | logo, favicon, renk |
| Client | notes | ad, firma, e-posta, telefon, URL |
| Client activity | title, content | type, tarih |
| Project | name, description, cover alt | status, tarih, bütçe |
| Planning section | title, content | category, sıra |
| Task | title, description | status, priority, süre |
| Calendar event | title, description | type, başlangıç/bitiş |
| Finance transaction | category, description | tutar, currency, status, tarih |
| Journal entry | mood label, note | skorlar, tarih |
| Proposal | title, description | tutar, currency, status |
| Contract | title, content | ilişkiler, status |
| Invoice | mevcut serbest metin yok | numara, tutar, currency, tarih |
| Subscription | name, category | tutar, cycle, status, tarih |

Kaynak dilinde tutulacak iletişim içeriği:

- Chat message
- Project revision request

## Sabit locale/format envanteri

Merkezi olmayan `tr-TR`, `date-fns/locale/tr`, sabit durum label'ları ve sabit
para/tarih formatları sayfa fazında ele alınır. Yeni kullanım yalnız
`lib/i18n/format.ts` ve merkezi date-fns locale mapping üzerinden yapılabilir.
