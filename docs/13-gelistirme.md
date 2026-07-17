---
title: Geliştirme
description: Neta üzerinde lokal geliştirme yapma ve kod yapısını anlama.
order: 13
status: legacy-v2-archive
---

# Geliştirme

> Arşiv: Aşağıdaki Supabase geliştirme akışı v2'ye aittir. Güncel lokal kurulum ve kalite komutları repository `README.md` dosyasındadır.

Neta'yı geliştirmek için önce standart bir Next.js uygulaması gibi düşünmek yeterli. Uygulama Supabase'e dışarıdan bağlanır; local geliştirme sırasında da aynı şekilde bir Supabase projesine ihtiyaç vardır.

## Kurulum

Önce bağımlılıkları kurun:

```bash
npm install
```

Sonra `.env.example` dosyasını `.env.local` olarak kopyalayıp değerleri doldurun:

```bash
cp .env.example .env.local
```

Windows PowerShell için:

```powershell
Copy-Item .env.example .env.local
```

Dev server:

```bash
npm run dev
```

Uygulama varsayılan olarak şurada açılır:

```txt
http://localhost:3000
```

## Klasör Yapısı

Ana klasörler:

```txt
app/
components/
config/
hooks/
lib/
public/
docs/
supabase/
```

## `app/`

Next.js App Router route'ları burada durur.

Önemli alanlar:

- `app/(dashboard)`: Freelancer dashboard ekranları.
- `app/portal`: Müşteri portalı.
- `app/api`: API route'ları.
- `app/login`: Login ekranı.
- `app/register`: İlk admin kayıt ekranı.

## `components/`

Paylaşılan UI bileşenleri burada durur.

Örnekler:

- Layout shell bileşenleri.
- Auth bileşenleri.
- UI yardımcıları.
- Dashboard hızlı aksiyon bileşenleri.

## `config/`

Menü ve navigation gibi sabit konfigürasyonlar burada durur.

Önemli dosyalar:

```txt
config/sidebar.ts
config/portal-sidebar.ts
```

Yeni bir dashboard sayfası eklerken genelde `sidebar.ts` dosyasını da güncellemek gerekir.

## `lib/`

Uygulama yardımcıları ve servis bağlantıları burada durur.

Önemli dosyalar:

- `lib/supabase/client.ts`
- `lib/supabase/server.ts`
- `lib/supabase/admin.ts`
- `lib/auth/first-admin-setup.ts`
- `lib/auth/internal-users.ts`
- `lib/ai.ts`
- `lib/ai/embeddings.ts`

## Veri Çekme Deseni

Projede sık kullandığım desen şu:

1. `page.tsx` server component olarak Supabase'ten veriyi çeker.
2. Client tarafında etkileşim gerekiyorsa veri bir `*-client.tsx` bileşenine aktarılır.
3. Form işlemleri `actions.ts` içinde server action olarak yapılır.

Örnek:

```txt
app/(dashboard)/tasks/page.tsx
app/(dashboard)/tasks/tasks-client.tsx
app/(dashboard)/tasks/actions.ts
```

Bu desen hem okunabilirliği artırır hem de Supabase sorgularının nerede çalıştığını netleştirir.

## Yeni Modül Eklemek

Yeni bir modül eklerken şu sırayı izlemek mantıklı:

1. Supabase tablosunu ve RLS policy'lerini planla.
2. Server page dosyasını oluştur.
3. Gerekirse client component oluştur.
4. CRUD işlemleri için `actions.ts` ekle.
5. Sidebar config'e menü ekle.
6. Gerekirse dashboard/analiz ekranına özet veri ekle.

## Build

Production build kontrolü:

```bash
npm run build
```

Build başarılıysa TypeScript ve Next.js route üretimi de temel seviyede doğrulanmış olur.

## Lint

Lint komutu:

```bash
npm run lint
```

Eğer lint yavaş çalışıyorsa `.next` klasörünün temiz olduğundan emin olun. Generated dosyaların gereksiz taranması geliştirme deneyimini bozabilir.

## `.next` Cache Temizleme

Dev server bazen eski route type veya cache nedeniyle garip davranabilir. Bu durumda:

```powershell
Remove-Item .next -Recurse -Force
```

Sonra tekrar:

```bash
npm run dev
```

## Python Yardımcı Dosyası

Repo içinde `main.pyw` ve `requirements.txt` bulunur. Bunlar web uygulamasının deploy akışına dahil değildir. Lokal Ollama tabanlı masaüstü metin işleme yardımcısı olarak korunur.

Python bağımlılıkları web build'i için gerekli değildir.
