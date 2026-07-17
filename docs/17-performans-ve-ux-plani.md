---
title: Performans ve UX Planı
description: Neta içindeki yavaş navigasyon, aksiyon geri bildirimi ve sayfa bazlı performans iyileştirmeleri için faz bazlı çalışma planı.
order: 17
status: legacy-v2-archive
---

# Performans ve UX Planı

> Arşiv: Bu v2 UX planı aktif çalışma planı değildir. Backend-first sıra ve kullanıcı yönlendirmeli Faz 10 tasarım süreci ana dönüşüm planında tanımlıdır.

Bu planı, uygulamada hissedilen iki ana problemi çözmek için hazırladım:

1. Butona ya da linke tıklayınca kullanıcıya hemen geri bildirim gelmemesi.
2. Sayfa geçişlerinde ve bazı veri işlemlerinde uygulamanın tıklamayı almamış gibi hissettirmesi.

Mevcut kodda problem tek bir noktadan çıkmıyor. Next.js App Router, server component veri çekme sürecini tamamlamadan yeni sayfayı göstermiyor. Bu normal, fakat kullanıcıya loading state verilmediğinde bekleme süresi bozukluk gibi algılanıyor. Aynı şekilde bazı server action formları veritabanını güncelliyor ama UI tarafında optimistic state olmadığı için değişiklik geç görünüyor.

## Sayfa Bazlı İnceleme

### Dashboard

Dosyalar:

- `app/(dashboard)/page.tsx`
- `app/(dashboard)/dashboard-client.tsx`

Bulgular:

- Dashboard sayfasında sorgular sıralı çalışıyor. Görevler, projeler, finans, günlük kayıtları ve müşteriler peş peşe çekiliyor.
- Bazı sorgularda `select("*")` kullanılıyor. Dashboard için gereken kolonlar az olduğu halde tüm satır alanları taşınıyor.
- Hızlı ekle butonu ve sheet kaldırıldı. Bu alan artık sadece tarih filtresi taşıyor.
- Tamamlanan görev hesabında bazı yerlerde `completed`, bazı yerlerde `done` kullanımı var. Görev modülünün asıl statüsü `done`; bu tutarsızlık metrikleri yanlış gösterebilir.

İyileştirme yönü:

- Dashboard veri çekimi `Promise.all` ile paralel hale getirilmeli.
- `select("*")` yerine sadece gerekli kolonlar seçilmeli.
- Görev statüsü hesabı `done` standardına çekilmeli.
- Dashboard için lightweight loading skeleton eklenmeli.

### Görevler

Dosyalar:

- `app/(dashboard)/tasks/page.tsx`
- `app/(dashboard)/tasks/tasks-client.tsx`
- `app/(dashboard)/tasks/actions.ts`

Bulgular:

- Görev ekleme dialog’u mobilde scroll problemi yaşıyordu. Dialog içeriği viewport yüksekliğine göre sınırlandı, gövde scroll edilebilir hale getirildi ve submit butonu footer içinde erişilebilir tutuldu.
- Kanban sürükle-bırak akışında optimistic update var.
- Liste görünümünde `Tamamla` ve `Sil` butonları doğrudan server action form’u kullanıyor. Bu yüzden veritabanı güncellense bile UI, route refresh/revalidation tamamlanana kadar değişmiyor.
- `TaskList` şu anda `handleTaskStatusChange` fonksiyonunu almıyor. Bu yüzden liste görünümü ile kanban görünümü aynı davranışı paylaşmıyor.
- Form submitlerinde pending state her yerde aynı değil. Bazı dialoglarda `isSubmitting` var, satır aksiyonlarında yok.

İyileştirme yönü:

- `TaskList` ve `TaskRow` içine optimistic status handler geçirilmeli.
- `Tamamla` aksiyonu liste ve kanban görünümünde aynı client-side optimistic akışı kullanmalı.
- Satır bazlı butonlarda pending spinner/disabled state olmalı.
- Hata durumunda task eski haline dönmeli ve kullanıcıya toast gösterilmeli.
- Silme aksiyonunda da optimistic remove + rollback uygulanmalı.

### Projeler

Dosyalar:

- `app/(dashboard)/projects/page.tsx`
- `app/(dashboard)/projects/projects-client.tsx`
- `app/(dashboard)/projects/actions.ts`

Bulgular:

- Proje kartları `router.push` ile detay sayfasına gidiyor. Tıklama anında pending state olmadığı için 2-3 saniyelik veri çekme süresi kullanıcıya bozuk hissettiriyor.
- Liste görünümündeki detay butonu `Link` kullanıyor, fakat loading feedback yine yok.
- Proje kapak görselleri için her sayfa açılışında storage üzerinden signed URL üretiliyor. Proje sayısı arttıkça bu işlem liste açılışını yavaşlatabilir.
- Task istatistiği için tüm görevlerin `project_id, status` kolonları çekiliyor. Veri büyüdükçe bu iş RPC ya da aggregate sorguya alınmalı.
- Proje tamamlama aksiyonu server action form’u olarak çalışıyor, fakat satır/kart üzerinde pending veya optimistic durum yok.

İyileştirme yönü:

- Proje kartı `router.push` yerine erişilebilir bir `Link` yapısına dönüştürülmeli veya `PendingLink` wrapper ile route pending feedback almalı.
- Kart tıklanınca kart üzerinde kısa süreli loading/disabled state gösterilmeli.
- `router.prefetch` veya `Link` prefetch davranışı kritik detay sayfaları için kullanılmalı.
- Signed URL üretimi limitlenmeli, cache süresi netleştirilmeli veya sadece görünür kartlar için yapılmalı.
- Proje tamamlama aksiyonu için optimistic status/progress güncellemesi eklenmeli.

### Proje Detayı

Dosyalar:

- `app/(dashboard)/projects/[id]/page.tsx`
- `app/(dashboard)/projects/[id]/project-detail-client.tsx`

Bulgular:

- Detay sayfası aynı anda proje, planlama alanları, görevler, finans kayıtları ve revizyonları çekiyor. Bu doğru şekilde `Promise.all` ile yapılmış, fakat sayfa yine ağır olabilir.
- Kapak görseli için signed URL ayrıca üretiliyor.
- Görevler sekmesinde kanban sürükle-bırak optimistic çalışıyor.
- Aynı sekmedeki `Tamamla` butonu ise doğrudan server action form’u. Bu yüzden butona basınca local task state güncellenmiyor.
- Planlama alanı silme, proje tamamlama ve proje ayarları işlemlerinde standart pending/toast yok.
- Sekmeler client-side olduğu için hızlı, fakat ilk sayfa yükü bütün sekme verilerini baştan taşıyor.

İyileştirme yönü:

- Proje görevlerindeki `Tamamla` butonu `handleTaskStatusChange` akışını kullanmalı.
- Proje detayında task list ve task kanban aynı optimistic action modelini paylaşmalı.
- Ağır sekmeler için ileride route segment veya lazy data yaklaşımı değerlendirilmeli.
- Planlama alanı silme ve proje tamamlama için ortak pending button kullanılmalı.

### Müşteriler

Dosyalar:

- `app/(dashboard)/clients/page.tsx`
- `app/(dashboard)/clients/clients-client.tsx`
- `app/(dashboard)/clients/[id]/page.tsx`

Bulgular:

- Pipeline sürükle-bırak optimistic update yapıyor. Bu iyi bir örnek.
- Müşteri kart ve satır linklerinde pending feedback yok.
- Müşteri detay sayfasında müşteri ve activity verisi sıralı çekiliyor. Activity sorgusu client id’ye bağlı olduğu için pratikte sorun küçük, fakat sayfa açılışında loading skeleton yok.
- Müşteri dialoglarında submit pending var, fakat hata toast’u standart değil.

İyileştirme yönü:

- Müşteri linkleri `PendingLink` ile tıklama feedback’i almalı.
- Detail sayfasına skeleton eklenmeli.
- Dialog submit hata/success davranışı proje dialog’larıyla aynı standarda çekilmeli.

### Finans

Dosyalar:

- `app/(dashboard)/finance/page.tsx`
- `app/(dashboard)/finance/finance-client.tsx`
- `app/(dashboard)/finance/actions.ts`

Bulgular:

- Sayfa veri çekimi paralel yapılıyor.
- Transaction silme server action form’u ile çalışıyor, fakat satır bazlı pending feedback yok.
- Dialog scroll/pending deseni görev sayfasındaki yeni mobil pattern ile aynı standarda çekilmeli.
- Veri büyüdüğünde tüm finans kayıtlarını çekmek yerine dönem filtresi veya pagination gerekebilir.

İyileştirme yönü:

- Silme ve form submitlerinde ortak pending button kullanılmalı.
- Listeye dönem filtresi veya pagination eklenmeli.
- Mobil dialog düzeni standart hale getirilmeli.

### Takvim

Dosyalar:

- `app/(dashboard)/calendar/page.tsx`
- `app/(dashboard)/calendar/calendar-client.tsx`
- `app/(dashboard)/calendar/actions.ts`

Bulgular:

- Sayfa veri çekimi paralel yapılıyor.
- Etkinlik silme server action form’u ile çalışıyor, pending feedback yok.
- Tüm etkinlikler çekiliyor. Veri büyüdüğünde ay bazlı sorgu daha doğru olur.

İyileştirme yönü:

- Ay görünümüne göre tarih aralıklı sorgu planlanmalı.
- Silme ve kayıt işlemleri ortak pending/toast modeline alınmalı.
- Takvim sayfası için skeleton eklenmeli.

### Analizler

Dosyalar:

- `app/(dashboard)/analytics/page.tsx`
- `app/(dashboard)/analytics/analytics-client.tsx`

Bulgular:

- Görev, proje ve finans sorguları sıralı çalışıyor.
- Üç tabloda da `select("*")` kullanılıyor.
- Analiz ekranı genellikle aggregate veri ister; tüm satırları taşımak gereksiz büyüyebilir.

İyileştirme yönü:

- Sorgular `Promise.all` ile paralelleştirilmeli.
- Gerekli kolonlara düşürülmeli.
- Orta vadede Supabase RPC veya view ile aggregate veri dönülmeli.
- Sayfa için skeleton eklenmeli.

### Layout ve Navigasyon

Dosyalar:

- `app/(dashboard)/layout.tsx`
- `components/layout/dashboard-shell.tsx`
- `config/sidebar.ts`

Bulgular:

- Dashboard layout her route geçişinde auth user ve profil bilgisini kontrol ediyor.
- Sidebar linklerinde route geçiş pending feedback’i yok.
- Mobil sidebar linke tıklayınca kapanıyor ama route yüklenene kadar ana içerik eski kalıyor.
- App Router yeni route’un server component payload’unu beklerken kullanıcıya global bir progress göstergesi verilmediği için tıklama çalışmamış gibi hissediliyor.

İyileştirme yönü:

- Global route pending feedback eklenmeli.
- Sidebar linkleri aktif/pending durumunu gösterecek wrapper ile değiştirilmeli.
- `app/(dashboard)/loading.tsx` ve kritik route loading dosyaları eklenmeli.
- Layout profil sorgusu mümkünse cache/helper seviyesinde sadeleştirilmeli.

## Faz Bazlı Plan

### Faz 1: Acil UX Düzeltmeleri

Amaç: Butona basınca anında tepki almak.

Yapılacaklar:

- `PendingSubmitButton` bileşeni oluşturulacak.
- Server action form’larında `useFormStatus` ile buton loading/disabled hale getirilecek.
- Görev listesi `Tamamla` butonu optimistic update kullanacak.
- Proje detayındaki görev `Tamamla` butonları aynı optimistic update modeline alınacak.
- Silme işlemlerinde satır bazlı loading ve mümkün olan yerlerde optimistic remove eklenecek.
- Hata durumunda rollback + toast standardı uygulanacak.

Öncelikli dosyalar:

- `app/(dashboard)/tasks/tasks-client.tsx`
- `app/(dashboard)/projects/[id]/project-detail-client.tsx`
- `app/(dashboard)/tasks/actions.ts`

Kabul kriteri:

- Görev listesinde `Tamamla` tıklandığında satır hemen tamamlanmış görünmeli.
- Buton işlem süresince disabled/loading olmalı.
- Hata olursa görev eski statüsüne dönmeli.

### Faz 2: Navigasyon Feedback’i

Amaç: Linke tıklandığında kullanıcı anında geçişin başladığını görmeli.

Yapılacaklar:

- `PendingLink` veya `NavigationProgressProvider` oluşturulacak.
- Pathname değişene kadar linkte pending state tutulacak.
- Sidebar linkleri, dashboard recent item linkleri, müşteri/proje liste linkleri bu wrapper ile güncellenecek.
- Proje kartlarındaki `router.push` kullanımı ya `Link` tabanlı karta çevrilecek ya da explicit pending state ile desteklenecek.
- Kritik kart/detail linklerinde hover/focus sırasında prefetch yapılacak.

Öncelikli dosyalar:

- `components/layout/dashboard-shell.tsx`
- `app/(dashboard)/projects/projects-client.tsx`
- `app/(dashboard)/clients/clients-client.tsx`
- `app/(dashboard)/dashboard-client.tsx`

Kabul kriteri:

- Sidebar veya proje kartına tıklandığında anında visual feedback görünmeli.
- Kullanıcı eski sayfada beklerken tıklama boşa gitmiş gibi hissetmemeli.

### Faz 3: Route Loading Skeletonları

Amaç: Server component verisi beklenirken boş veya donmuş ekran hissini kaldırmak.

Yapılacaklar:

- `app/(dashboard)/loading.tsx` eklenecek.
- Kritik sayfalar için özel loading skeletonları hazırlanacak:
  - `app/(dashboard)/projects/loading.tsx`
  - `app/(dashboard)/projects/[id]/loading.tsx`
  - `app/(dashboard)/tasks/loading.tsx`
  - `app/(dashboard)/clients/loading.tsx`
  - `app/(dashboard)/analytics/loading.tsx`
- Skeletonlar gerçek sayfa layout’una benzeyecek, sadece placeholder gösterecek.

Kabul kriteri:

- Sayfa geçişinde eski sayfada donuk bekleme yerine kontrollü loading görünmeli.
- Mobilde skeleton içerik taşmamalı.

### Faz 4: Veri Çekme Optimizasyonu

Amaç: Sayfa açılışlarını gerçekten hızlandırmak.

Yapılacaklar:

- Dashboard sorguları paralel hale getirilecek.
- Analytics sorguları paralel hale getirilecek.
- Dashboard ve analytics tarafındaki `select("*")` kullanımları kaldırılacak.
- Projeler sayfasında task istatistiği aggregate sorgu/RPC ile alınacak.
- Finans, takvim ve analytics için pagination veya tarih aralığı filtresi planlanacak.
- Proje kapak görsellerinde signed URL üretimi gözden geçirilecek; gerekirse sadece ihtiyaç duyulan görseller için URL üretilecek.

Öncelikli dosyalar:

- `app/(dashboard)/page.tsx`
- `app/(dashboard)/analytics/page.tsx`
- `app/(dashboard)/projects/page.tsx`
- `supabase/setup.sql`

Kabul kriteri:

- Dashboard ve analytics route response süreleri ölçülebilir şekilde düşmeli.
- Gereksiz kolon taşınmamalı.
- Proje listesi fazla görselli projelerde daha stabil açılmalı.

### Faz 5: Mutation Standardı

Amaç: Tüm ekleme, güncelleme, silme ve tamamlama işlemleri aynı hissi vermeli.

Yapılacaklar:

- Ortak action button kalıbı oluşturulacak.
- Dialog submitlerinde success/error toast standardı uygulanacak.
- Server action dönüşleri mümkünse `{ ok, message }` yapısına yaklaştırılacak.
- `revalidatePath` kapsamı her action için tekrar kontrol edilecek.
- `done` ve `completed` statü kullanımı standardize edilecek.

Kabul kriteri:

- Görev, proje, müşteri, finans, takvim ve günlük formları aynı pending/hata/success davranışını göstermeli.
- Statü değişimleri UI’da tutarlı görünmeli.

### Faz 6: Mobil ve Touch Deneyimi

Amaç: Mobilde form, dialog ve kanban akışlarını güvenli hale getirmek.

Yapılacaklar:

- Görev dialog’unda uygulanan scroll pattern diğer uzun dialoglara taşınacak.
- Proje ekleme, finans ekleme, takvim etkinliği ve günlük dialogları mobilde test edilecek.
- Drag/drop kullanılan alanlarda mobil için butonlu alternatif durum değişimi eklenecek.
- Buton hit area ve sticky footer davranışları kontrol edilecek.

Kabul kriteri:

- Mobilde hiçbir uzun form submit butonunu viewport dışında bırakmamalı.
- Drag/drop olmadan da statü değiştirilebilmeli.

### Faz 7: Test ve Ölçüm

Amaç: İyileştirmelerin gerçekten çalıştığını doğrulamak.

Yapılacaklar:

- `npm run build` çalıştırılacak.
- Dashboard, görevler, projeler, proje detayı, müşteriler, finans ve takvim için manuel smoke test yapılacak.
- Mobil viewport’ta görev/proje/finans dialogları test edilecek.
- Route geçişleri için basit ölçüm notu tutulacak.
- Kritik aksiyonlarda hata senaryosu test edilecek.

Kabul kriteri:

- Build başarılı olmalı.
- Görev tamamla, proje detayına gitme ve sidebar navigasyonu görsel feedback vermeli.
- Mobilde görev formu scroll ve submit açısından çalışmalı.

## Uygulama Sırası

Önce Faz 1 uygulanmalı. Çünkü kullanıcının “Göreve tamamla dediğimde aksiyon almıyor gibi” hissi doğrudan buradan geliyor.

Ardından Faz 2 ve Faz 3 beraber ilerlemeli. Navigasyon pending state’i ve route skeletonları aynı problemi iki farklı anda çözüyor: tıklama anı ve route veri bekleme anı.

Faz 4 daha teknik performans tarafı. İlk üç faz UX hissini hızlıca düzeltir, Faz 4 gerçek veri süresini azaltır.

Faz 5 ve Faz 6 uygulamanın tamamına kalite standardı yayar. Faz 7 her fazdan sonra küçük parçalar halinde de çalıştırılabilir, fakat büyük UX değişimlerinden sonra mutlaka yapılmalı.
