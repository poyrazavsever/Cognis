# Legacy PostgreSQL database documentation

Bu klasördeki `0001`–`0011`, query log/order ve seed belgeleri Neta v2 Supabase/PostgreSQL geçmişinin arşividir. Güncel runtime veya migration talimatı değildir.

Self-hosted v3'te:

- schema kaynağı `server/db/schema`,
- migration kaynağı `server/db/migrations`,
- migration runner `pnpm db:migrate`,
- veri aktarım runbook'u `docs/self-hosted-redesign/phase-8-import-release.md`

olarak kullanılır.

Arşiv dosyaları yalnızca eski kolon/policy davranışlarını import sırasında karşılaştırmak için korunur. Yeni migration veya seed bu klasöre eklenmemelidir.
