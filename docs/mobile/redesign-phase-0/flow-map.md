# Redesign Faz 0 — Onaylı akış haritası

## Public

Temiz kurulum `Onboarding → Login` izler. Onboarding versiyonu cihazda
saklandıktan sonra unauthenticated açılış ve logout doğrudan Login'e gider.
Domain, instance seçimi ve pairing public bilgi mimarisinde yoktur.

## Owner

| Alan | Liste/root | Detay | Create/edit hedefi |
| --- | --- | --- | --- |
| Ana sayfa | Dashboard | Analytics | Hızlı aksiyon → ilgili form modalı |
| Müşteriler | Arama/filtre | Müşteri + aktiviteler | Client/activity/invitation modalı |
| Projeler | Arama/filtre | Genel/plan/görev/revizyon/dosya | Project/planning modalı |
| Görevler | Liste/board | Görev | Task modalı |
| Diğer | Bottom sheet | Takvim, finans, analiz, günlük, AI, ayarlar | Alanın modalı |
| Ayarlar | Hub | Account/workspace/language/files-media | Section form modalı |

## Portal

Portal yalnız session-derived client scope kullanır. Ana sayfa, projeler,
public görevler ve revizyonlar ana hedeflerdir. Proje detayı native push;
revizyon talebi ve kişisel ayarlar modal formdur. Owner route ve mutation'ları
portal navigasyonunda render edilmez.

Bu harita Faz 3–4'te uygulanacak shell/modal mimarisinin kabul edilen kontratıdır.
