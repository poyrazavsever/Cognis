# Redesign Faz 6–7 — Müşteriler, projeler ve görevler

Durum: Mobil dikey dilimler tamamlandı; backend `/api/v1` teslim kapısı açık.

## Teslim edilen mobil akışlar

- Müşteri arama/durum filtresi, profesyonel kartlar ve pull-to-refresh.
- Müşteri detay stack'i; iletişim, proje/portal özeti ve aktivite zaman çizgisi.
- Müşteri create/edit, aktivite ve portal daveti için keyboard-safe modal route'lar.
- Proje arama/durum filtresi, ilerleme özeti ve detay stack'i.
- Proje detayında `Genel`, `Plan`, `Görevler`, `Revizyonlar`, `Dosyalar` segmentleri.
- Proje create/edit formunda ham müşteri ID'si yerine aranabilir relation picker.
- Görev liste/filtre, detay, create/edit ve status mutation akışları.
- Görev formunda aranabilir müşteri/proje seçimleri ve `isPublicToClient` kontrolü.
- Optimistic görev status değişikliklerinde hata halinde state rollback ve global toast.
- Modal relation picker'da focus taşıma/geri verme, Reduce Motion ve 48dp hedefler.

## Backend release kapısı

Web repository'si salt okunur incelendi. Web UI server action'ları mevcut olsa da
`app/api/v1` altında aşağıdaki mobil route grupları henüz bulunmuyor:

- `clients`, `clients/:id`, `clients/:id/activities`, `clients/:id/portal-invitations`
- `projects`, `projects/:id`, `projects/:id/planning-sections`
- `projects/:id/revisions`, `projects/:id/assets`
- `tasks`, `tasks/:id`, `tasks/:id/complete`

Bu nedenle mobil ekranlar beklenen typed contract'lara gerçek request gönderir;
404/uyumsuz kontrat durumunu error veya bölüm bazlı warning olarak gösterir. Boş
başarı cevabı, demo kayıt veya sahte revizyon/dosya üretilmez. Fazın production
çıkışı için route'ların web repository'sinde actor scope, cross-client negatif
test, cursor sınırı, idempotency ve redacted error kontrolleriyle ayrıca teslim
edilmesi zorunludur.

## Web parity kararları

- Client pipeline: `lead`, `contacted`, `proposal_sent`, `won`, `lost`.
- Client lifecycle: `active`, `paused`, `archived`.
- Project lifecycle: `planning`, `active`, `paused`, `completed`, `cancelled`.
- Task mutation UI: `todo`, `in_progress`, `done`; legacy `cancelled` kayıtları
  okunabilir fakat web action parity sağlanana kadar formdan üretilmez.
- Proje seçilen görevde müşteri ilişkisi projeden tamamlanır.
- Portal görünürlüğü yalnız açıkça `isPublicToClient=true` olan görevlere verilir.

## Doğrulama

`pnpm check` Faz 6–7 route/form gate'ini, TypeScript'i, kontrat testlerini,
erişilebilirlik taramasını ve Expo public config kontrolünü birlikte çalıştırır.
