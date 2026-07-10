# Phase 3 UI Implementation Notes

## Kapsam

Bu fazda Poyraz UI tamamen package seviyesinde kaldırılmadı. Mevcut feature sayfaları hâlâ Poyraz component import ediyor ve Faz 4-6 sırasında veri/UI birlikte taşınacak. Faz 3 uygulaması yeni internal primitive setini, auth shell'i ve dashboard/portal shell'i Poyraz import sınırından ayırır.

## Eklenen primitive seti

- `components/ui/button.tsx`: `Button` ve accessible `IconButton`.
- `components/ui/input.tsx`: `Input` ve `Textarea`.
- `components/ui/field.tsx`: `Label` ve `Field` description/error yapısı.
- `components/ui/card.tsx`: temel card yüzeyleri.
- `components/ui/skeleton.tsx`: layout ölçüsünü koruyan skeleton.
- `components/ui/toast.tsx`: live-region tabanlı basit toaster.

## Shell değişiklikleri

- `components/layout/app-shell.tsx` dashboard ve portal için ortak responsive shell oldu.
- Dashboard shell ve portal shell doğrudan Poyraz import etmiyor.
- Account menüsü Escape, dışarı tıklama ve focus return davranışına sahip.
- Mobile sidebar route değişiminde kapanıyor.
- Skip link ana içeriğe keyboard erişimi sağlıyor.

## Token kararı

- `app/globals.css` artık `--poyraz-*` token tanımlamıyor.
- Tailwind v4 theme mapping semantik tokenlardan geliyor.
- Eski feature sayfaları için `background`, `primary`, `muted`, `border` gibi legacy class adları semantik tokenlara bağlı tutuldu.
- Dark mode bu fazda desteklenmiyor; light-only karar korunuyor.

## Boundary kontrolü

`npm run phase3:ui-boundary` aşağıdaki alanlarda `poyraz-ui` importu ve `--poyraz` token kullanımını engeller:

- root layout/global CSS
- auth ekranları
- dashboard/portal shell
- internal UI primitive'leri
- sidebar config dosyaları

## Poyraz component mapping

| Eski kullanım | Yeni hedef |
| --- | --- |
| `poyraz-ui/atoms` `Button` | `components/ui/button` `Button` |
| `poyraz-ui/atoms` `Input` | `components/ui/input` `Input` |
| `poyraz-ui/atoms` `Textarea` | `components/ui/input` `Textarea` |
| `poyraz-ui/atoms` `Label` | `components/ui/field` `Label` veya `Field` |
| `poyraz-ui/atoms` `Card`, `CardContent` | `components/ui/card` |
| `poyraz-ui/atoms` `Badge` | Faz 4 core UI icinde `components/ui/badge` |
| `poyraz-ui/molecules` `DropdownMenu` | Shell icin internal `AccountMenu`; feature'lar icin `components/ui/dropdown-menu` |
| `poyraz-ui/molecules` `Dialog` | `components/ui/dialog` |
| `poyraz-ui/molecules` `Select` | `components/ui/select` |
| `poyraz-ui/molecules` `Tabs` | Faz 4 ihtiyacinda `components/ui/tabs` |
| `poyraz-ui/molecules` `toast` | `components/ui/toast` `showToast` veya `hooks/use-toast` |
| `poyraz-ui/organisms` `Sidebar*` | `components/layout/app-shell` |
| `poyraz-ui/atoms` `Typography` | Semantik HTML ve token tabanli typography class'lari |

## Kalan işler

- Feature sayfalarındaki Poyraz importları Faz 4-6 feature rewrite sırasında kaldırılacak.
- Tam viewport screenshot ve keyboard/contrast matrisi Playwright kurulumu ile ayrıca kapatılmalı.
- Dialog/select/tabs gibi daha karmaşık primitive'ler feature ihtiyaçları netleşince internal API ile eklenecek.
