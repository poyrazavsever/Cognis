---
title: Özelleştirme
description: Neta'nın marka, arayüz, modül ve iş akışı açısından nasıl özelleştirileceği.
order: 14
status: legacy-v2-archive
---

# Özelleştirme

> Arşiv: Bu kod tabanlı v2 özelleştirme rehberidir. v3 instance branding'i SQLite/local file service ve server-rendered Poyraz semantic tokenları üzerinden uygular; güncel özet repository `README.md` dosyasındadır.

Neta'yı kendi kullanım şeklime göre geliştirdiğim için özelleştirilebilir kalmasına dikkat ettim. Renkler, logo, menüler, modüller, AI prompt'ları ve portal görünümü ihtiyaçlara göre değiştirilebilir.

## Logo Değiştirme

Logo dosyaları `public/logo` altında durur.

Kullanılan dosyalar:

```txt
public/logo/lightLogoLong.png
public/logo/blackLogoLong.png
public/logo/iconLogo.png
```

Logo kullanılan ana yerler:

- Auth ekranı.
- Dashboard sidebar.
- Portal sidebar.
- Mobil header.

Logo değiştirirken aynı dosya adlarını korumak en kolay yoldur. Dosya adlarını değiştirirseniz ilgili `Image` kullanımlarını da güncellemeniz gerekir.

## Renk ve Tema

Ana renk değişkenleri `app/globals.css` içinde tanımlanır.

Özellikle şu CSS değişkenleri önemlidir:

```css
--poyraz-background
--poyraz-foreground
--poyraz-primary
--poyraz-primary-foreground
--poyraz-border
--poyraz-muted
```

Tailwind tarafındaki eşlemeler `tailwind.config.ts` içinde bulunur.

Neta şu an açık tema odaklı tasarlanmıştır. Dark mode altyapısı tamamen ürünleşmiş kabul edilmemelidir.

## Sidebar Menüleri

Dashboard menüsü:

```txt
config/sidebar.ts
```

Portal menüsü:

```txt
config/portal-sidebar.ts
```

Yeni bir ekran eklediğinizde önce route'u oluşturun, sonra ilgili sidebar config'e menü elemanı ekleyin.

Örnek dashboard menü elemanı:

```ts
{ title: "Projeler", href: "/projects", icon: FolderKanban }
```

## Dashboard Özelleştirme

Dashboard ekranı iki parçadan oluşur:

```txt
app/(dashboard)/page.tsx
app/(dashboard)/dashboard-client.tsx
```

Server component veriyi toplar. Client component KPI ve grafik görünümünü üretir.

Yeni KPI eklemek için:

1. `page.tsx` içinde gerekli veriyi çekin.
2. `dashboardData` içine ekleyin.
3. `DashboardClient` tipini güncelleyin.
4. UI içinde yeni kartı oluşturun.

## Yeni Alan Eklemek

Bir tabloya yeni field eklemek istediğinizde sadece formu güncellemek yetmez.

Genel sıra:

1. Supabase tablosuna field ekle.
2. RLS etkisini kontrol et.
3. Server query select listesine field ekle.
4. TypeScript tiplerini güncelle.
5. Form input'unu ekle.
6. `actions.ts` payload okuma fonksiyonunu güncelle.
7. Liste/detay UI'ında göster.

Bu sırayı izlemek runtime hatalarını azaltır.

## AI Prompt Özelleştirme

AI chat prompt'u şu dosyada bulunur:

```txt
app/api/chat/route.ts
```

Finans analizi:

```txt
app/api/finance-analysis/route.ts
```

Proje risk analizi:

```txt
app/api/project-risk/route.ts
```

Prompt'ları değiştirirken dikkat ettiğim noktalar:

- Cevap dili Türkçe olmalı.
- Gereksiz uzun cevap istenmemeli.
- Veri yoksa model bunu açıkça söylemeli.
- Finansal, hukuki veya klinik kesin hüküm verilmemeli.

## Client Portal Özelleştirme

Portal shell:

```txt
components/layout/portal-shell.tsx
```

Portal sayfaları:

```txt
app/portal
```

Müşteriye yeni bir veri göstermek için sadece UI eklemek yetmez. Supabase RLS policy'sinin de o veriye izin vermesi gerekir.

Önerilen sıra:

1. Müşteri gerçekten bu veriyi görmeli mi karar ver.
2. RLS policy ekle veya güncelle.
3. Portal server component içinde sorguyu yaz.
4. Client component içinde göster.

## Yeni Modül Eklemek

Yeni modül için örnek klasör yapısı:

```txt
app/(dashboard)/new-module/page.tsx
app/(dashboard)/new-module/new-module-client.tsx
app/(dashboard)/new-module/actions.ts
```

Eğer modül müşteriyle ilişkiliyse `client_id`, projeyle ilişkiliyse `project_id` alanlarını baştan düşünmek iyi olur.

## Metinleri Türkçeleştirme

Projede bazı eski dosyalarda karakter bozulmaları veya İngilizce metinler kalmış olabilir. Ürünleştirme sırasında bu metinlerin tek tek düzeltilmesi gerekir.

Öncelikli yerler:

- Sidebar başlıkları.
- Form label'ları.
- Toast mesajları.
- Empty state metinleri.
- Hata mesajları.

## Kişisel Kullanıma Göre Sadeleştirme

Neta'yı herkes aynı şekilde kullanmak zorunda değil. Eğer bazı modüller size gereksizse menüden kaldırabilir, route'ları bırakıp görünürlüğü azaltabilirsiniz.

Örneğin finans modülünü kullanmayacaksanız:

- Sidebar'dan kaldırın.
- Dashboard finans kartlarını kaldırın.
- AI context içinde finans sorgularını sadeleştirin.

Bu yaklaşım projeyi daha kişisel ve odaklı tutar.
