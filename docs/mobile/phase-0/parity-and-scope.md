# Owner/portal parity ve ürün kapsamı

> Superseded: Canonical kapsam ve route haritası
> `docs/mobile/neta-mobile-redesign-master-plan.md` ve `docs/mobile/redesign-phase-0/`
> altındadır. Domain discovery artık kullanıcı ekranı değildir.

Bu belge ürün onayına sunulan öneridir; onay verilene kadar Faz 0 checklist'i
tamamlanmış sayılmaz.

## Parity matrisi

| Alan | Owner mobile | Portal mobile | Hedef milestone |
| --- | --- | --- | --- |
| Domain discovery ve auth | Ortak | Ortak | A |
| Dashboard | Yönetim özeti | Client-scope özet | B / D |
| Müşteriler | Tam CRUD + activity/invite | Yok | B |
| Projeler | CRUD, plan, görev, revizyon, dosya | Localized read + revision | B / D |
| Görevler | CRUD, filtre, status | Yalnız public task | B / D |
| Takvim | Range, month/agenda, CRUD | Yok | B |
| Finans | Summary, transaction CRUD, AI analiz | Yok | B |
| Günlük | Liste/upsert/CRUD | Yok | B |
| AI chat/risk | Tam | Yok | B |
| Business | Teklif/sözleşme/fatura/abonelik | Yok | C |
| Profil/güvenlik | Kişisel | Kişisel | C / D |
| Branding/AI/locale yönetimi | Admin | Yetkisiz | C |
| Tema/dil tercihi | Kişisel | Kişisel | C / D |
| Dosya/deep link/invitation | Yönetim | Görüntüleme/kabul fallback | D |

## Önerilen kapsam kararları

1. İlk store sürümünde tek aktif instance UI'ı; registry modeli çoklu instance'a hazır.
2. Owner ve portal login email/şifre + native secure-cookie; Faz 0 spike geçmezse pairing blocker olur.
3. Invitation kabulü v1'de güvenli web fallback; native deep link dönüşü korunur.
4. Business ekranları core MVP değil, Milestone C parity kapsamıdır.
5. Admin translation editor Milestone C'dir; ilk core MVP'de dil seçimi yeterlidir.
6. Push notification ilk store release blocker değildir ve capability kapalı kalır.
7. Tablet ayrı bilgi mimarisi değil, responsive acceptance kapsamıdır.
8. Merkezi telemetry varsayılan kapalıdır; yalnız açık opt-in ile teknik metrik gönderilir.

Bu kararların ürün sahibi tarafından onaylanması veya değiştirilmesi gerekir.
