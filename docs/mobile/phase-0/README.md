# Faz 0 — Baseline ve karar durumu

Son güncelleme: 2026-07-25

Faz 0 aktif durumdadır. Bu klasör, ana plandaki başlangıç kararlarının kanıtını
ve açık engellerini tutar.

## Belgeler

- [Baseline ve API gap](baseline-and-api-gap.md)
- [Ekran parity ve ürün kapsamı](parity-and-scope.md)
- [Auth spike ve session lifecycle](auth-spike-and-lifecycle.md)
- [Mobil tasarım sınırı](mobile-design-contract.md)

## Durum özeti

| İş | Durum | Kanıt/engel |
| --- | --- | --- |
| Toolchain seçimi | Tamamlandı | Expo 57, RN 0.86, React 19.2.3, Node 24, pnpm 11 |
| Mobil repository baseline | Tamamlandı | Workspace, kalite kapıları, Pod senkronu ve iOS native build doğrulaması |
| Web route/action/service/schema snapshot | Engelli | Web/backend kaynakları bu repository'de yok |
| Owner/portal parity taslağı | Hazır, ürün onayı bekliyor | `parity-and-scope.md` |
| API backlog eşlemesi | Tamamlandı | `baseline-and-api-gap.md` |
| Poyraz UI/native sınırı | Tamamlandı | `mobile-design-contract.md` |
| Better Auth multi-domain spike | Engelli | İki test instance'ı ve server Expo plugin'i gerekli |
| ADR-0018 güncellemesi | Bekliyor | Auth spike sonucu gerekli |
| Portal auth lifecycle | Öneri hazır, test bekliyor | `auth-spike-and-lifecycle.md` |
| MVP/parity/post-v1 kapsamı | Öneri hazır, ürün onayı bekliyor | `parity-and-scope.md` |

Faz 0, auth spike kanıtı ve nihai auth ADR kararı olmadan tamamlanmış sayılmaz.
