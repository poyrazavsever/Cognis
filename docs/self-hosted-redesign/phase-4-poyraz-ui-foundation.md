# Faz 4 — Poyraz UI v3 foundation

Tarih: 2026-07-16

Bu faz, freelancer ve portal sayfalarının dikey dönüşümünden önce ortak UI sözleşmesini kurar. Sayfa bazlı bilgi mimarisi ve görsel revizyonlar Faz 5–6'da kullanıcı yönlendirmesiyle yapılacaktır.

## Uygulanan temel

- `poyraz-ui` `3.0.2` sürümüne yükseltildi; hem pnpm hem npm lockfile'ları eşitlendi.
- Tailwind v4 girişine `poyraz-ui/preset.css` eklendi.
- Atom, molecule ve organism importları yalnızca ilgili package subpath'inden yapılıyor.
- Freelancer ve portal shell'i aynı Poyraz Sidebar organism bileşimini kullanıyor.
- Masaüstü daraltma, mobil overlay ve mobil aç/kapat state'i `SidebarProvider` tarafından yönetiliyor.
- Hesap menüsü custom event yönetimi yerine Poyraz `DropdownMenu`; icon-only shell aksiyonları Poyraz `Tooltip` kullanıyor.
- Root feedback katmanı Poyraz `Toaster`; auth bildirimleri Poyraz `Alert` ve `toast` kullanıyor.
- Auth alanları ve loading ekranları local kopyalar yerine Poyraz atomlarını kullanıyor.
- Instance adı ve açık/koyu logo shell ile auth yüzeylerine taşındı.

## Import ve ownership kuralı

```ts
import { Button, Input, Typography } from "poyraz-ui/atoms";
import { Alert, Dialog, Form, Select, toast } from "poyraz-ui/molecules";
import { DataTable, Sidebar } from "poyraz-ui/organisms";
```

`poyraz-ui` package root importu kullanılmaz. Genel amaçlı UI primitive'i `components/ui` altında yeniden yazılmaz. Neta'ya özgü durum veya davranış, Poyraz bileşenlerinden `components/system` altında compose edilir.

İzin verilen local davranış yardımcıları:

- `OfflineIndicator`: browser bağlantı durumu davranışı.
- `PendingLink`: Next.js navigasyon pending davranışı.
- `PendingSubmitButton`: server action pending davranışı; görsel primitive olarak Poyraz `Button` kullanır.

Bu sınır `pnpm phase4:ui-boundary` ile otomatik doğrulanır.

## Typography ve page header

Poyraz `Typography` bütün yeni sayfalarda metin semantiğinin kaynağıdır:

| Rol | Poyraz variant | HTML semantiği |
| --- | --- | --- |
| Sayfa başlığı | `h1` | `h1` |
| Bölüm başlığı | `h2` / `h3` | sıradaki doğru heading seviyesi |
| Kart başlığı | `h4` / `large` | bağlama göre `h2`–`h3` |
| Gövde | `body` / `p` | `p` |
| Yardımcı açıklama | `muted` | `p` |
| Metadata | `caption` / `small` | `span` veya `p` |

Yeni liste ve detay sayfaları `components/system/page-header.tsx` bileşimini kullanır. Header sırası: isteğe bağlı eyebrow, tek `h1`, kısa açıklama, secondary aksiyonlar ve en sağda bir primary aksiyon. Bir görünümde birincil aksiyon sayısı bir olmalıdır. Secondary aksiyonlar `secondary`, `outline` veya `ghost`; riskli aksiyonlar yalnızca `destructive` variant kullanır.

## Form standardı

İki form yolu vardır:

1. Basit Server Action formları native `<form>` ile; görünür Poyraz `Label`, Poyraz `Input`/`Textarea`/`Select`, alan yanında açıklama ve inline hata kullanır.
2. Client-side etkileşimli veya çok alanlı formlar `react-hook-form` ile Poyraz `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription` ve `FormMessage` bileşimini kullanır. Zod doğrulaması gerektiğinde mevcut resolver katmanı kullanılır.

Kurallar:

- Placeholder label yerine geçmez.
- Server ve client aynı Zod/domain sözleşmesine göre doğrular; client doğrulaması güvenlik sınırı değildir.
- Alan hatası `FormMessage` veya alanın hemen altındaki inline metinle gösterilir. Toast tek başına form hatası değildir.
- Submit durumu Poyraz `Button` üzerindeki `loading`, `disabled` ve `aria-busy` proplarıyla gösterilir.
- Başarılı, formun dışında etkisi olan işlem toast ile; kullanıcının karar vermesi gereken veya kalıcı bilgi inline `Alert` ile gösterilir.

## Status-to-Badge standardı

Merkezi eşleme `components/system/status-badge.tsx` içindedir.

| Anlam | Örnek status'ler | Badge variant |
| --- | --- | --- |
| Başarılı/çalışır | `active`, `accepted`, `completed`, `done`, `paid` | `success` |
| Süreçte/bilgi | `in_progress`, `sent` | `info` |
| Bekliyor/dikkat | `pending`, `paused` | `warning` |
| Plan/taslak | `planning`, `planned`, `todo`, `draft` | `secondary` |
| Hata/risk | `overdue`, `rejected`, `revoked`, `expired` | `destructive` |
| Pasif terminal | `cancelled`, `archived` | `outline` |

Renk tek başına anlam taşımaz; badge her zaman Türkçe durum metni içerir.

## Feedback state standardı

`components/system/feedback-state.tsx` yeni sayfaların ortak state bileşimidir.

- Loading: layout'a yakın Poyraz `Skeleton`; kapsayıcıda `aria-busy` ve screen-reader label.
- Empty: nötr Poyraz `Card`, kısa neden ve mümkünse bir sonraki primary aksiyon.
- Error: Poyraz destructive `Alert`, kullanıcıya uygun açıklama ve retry aksiyonu.
- Forbidden: Poyraz warning `Alert`; var olmayan kaynağı açığa çıkarmayacak metin ve güvenli geri dönüş.
- Toast: kısa ömürlü, sayfalar arası kalıcı olmayan işlem sonucu.
- Inline Alert: kullanıcının okumadan devam etmemesi gereken, forma veya sayfaya bağlı durum.

## Overlay, confirmation, table ve KPI

- Geri döndürülemez işlem `components/system/destructive-confirmation.tsx` üzerinden açık `DialogTitle`, `DialogDescription`, vazgeç ve destructive onay aksiyonu ile kurulur.
- Kısa desktop formu `Dialog`, bağlamsal yan panel `Sheet`; küçük ekranda uzun/çok adımlı akış `Drawer` olur. Ekranı kaplayan özel div overlay yazılmaz.
- Veri listeleri seçim, arama, pagination, loading veya error gerektiriyorsa Poyraz organism `DataTable` kullanır. Basit iki sütunlu statik bilgiler native semantic table kalabilir.
- Dashboard metrikleri Poyraz `StatsCard` ile kurulur: kısa label, formatlanmış value, isteğe bağlı trend ve tek anlamlı icon. Renk yalnızca trend/durum bilgisini destekler.

## Branding token bridge

Branding servisi eski `--primary` benzeri uygulama tokenları yerine Poyraz v3 sözleşmesini server-side üretir:

- `--poyraz-primary` ve foreground/hover/active/scale rolleri
- `--poyraz-accent` ve foreground/hover rolleri
- `--poyraz-ring` ve `--poyraz-focus-ring`
- `--poyraz-radius-xs` … `--poyraz-radius-xl`

Değerler root `<html style>` içine SSR edilir; bu nedenle ilk render'da varsayılan renkten instance rengine geçiş parlaması oluşmaz. `system` renk modu ilk paint öncesi media query ile `.dark` sınıfına çevrilir ve işletim sistemi değişikliği dinlenir. Poyraz preset kalan surface, status, elevation, density ve motion rollerinin tek kaynağıdır.

Recharts içindeki eski `hsl(var(--...))` ifadeleri geçerli Poyraz CSS renk tokenlarına taşındı.

## Local primitive ve dependency sonucu

Kaldırılan local generic primitive'ler: Button, Card, Checkbox, Dialog, DropdownMenu, Field/Form, Input/Label, Select, Separator, Skeleton, Textarea ve Toast/Toaster. Kullanılmayan eski toast hook'u ve `next-themes` provider'ı da kaldırıldı.

Poyraz'ın kendi dependency ağacında yönettiği `@base-ui/react`, doğrudan Radix paketleri, `radix-ui`, `class-variance-authority`, `shadcn`, ayrıca kullanılmayan `@iconify/react` ve `next-themes` doğrudan Neta dependency listesinden çıkarıldı. Poyraz molecule entrypoint'i dinamik Mermaid importunu build sırasında çözdüğü için package'ın optional peer'i `mermaid` açık dependency olarak eklendi. Sonuçta doğrudan dependency sayısı net 14, pnpm kurulum ağacı yaklaşık 112 paket azaldı.

## Erişilebilirlik foundation kuralları

- Heading hiyerarşisi semantik component proplarıyla korunur.
- Icon-only aksiyonlar görünür label yoksa `aria-label`; bağlam açıklaması gerekiyorsa Tooltip kullanır.
- Dialog/Sheet/Drawer title ve description olmadan yayınlanmaz.
- Focus ring utility ile kapatılmaz; Poyraz focus tokenı branding primary rengine bağlıdır.
- Loading ve disabled görsel class taklidiyle değil component proplarıyla kurulur.
- Global reduced-motion kuralı ve component seviyesinde `motion-reduce` korunur.
- Durumlar renk yanında metin ve gerektiğinde icon ile anlatılır.

Bu faz foundation sözleşmesini doğrular. Legacy feature sayfalarının tamamına uygulanması ilgili Faz 5–6 dikey dilimlerinin kalite kapısıdır.

## Doğrulama

```bash
pnpm phase4:ui-boundary
pnpm typecheck
./node_modules/.bin/eslint app/layout.tsx components/layout components/system components/auth components/error-toaster.tsx components/ui/offline-indicator.tsx components/ui/pending-link.tsx components/ui/pending-submit-button.tsx app/login/page.tsx app/register/page.tsx 'app/invite/[token]/page.tsx' server/branding/service.ts scripts/phase4-ui-boundary.mjs
pnpm phase3:storage-smoke
pnpm phase1:auth-smoke
pnpm build
git diff --check
```

Boundary testi v3 major sürümünü, preset importunu, Sidebar bileşimini, package subpath importlarını, izin verilen local UI dosyalarını ve kaldırılan duplicate UI bağımlılıklarını doğrular.

Foundation hedefli ESLint kontrolü temizdir. Repo genelindeki `pnpm lint`, henüz Faz 5–7'de taşınacak legacy feature/API dosyalarındaki mevcut `no-explicit-any`, `set-state-in-effect` ve benzeri borçlar nedeniyle bu fazda global kalite kapısı olarak kapatılmadı; master plandaki genel lint maddesi bu nedenle işaretlenmedi.
