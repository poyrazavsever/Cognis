# Legacy Supabase archive

Bu klasör Neta v2'nin eski PostgreSQL şeması, migration'ları ve seed kayıtları için salt tarihsel/import kaynağıdır.

Self-hosted v3 runtime'ı bu SQL dosyalarını çalıştırmaz; Supabase Auth, Database, Storage veya environment değişkeni kullanmaz. Yeni değişiklikler `server/db/schema` ve `server/db/migrations` altında Drizzle/SQLite migration'ı olarak yapılmalıdır.

Bu arşivi yalnızca eski bir Supabase instance'ının kolonlarını anlamak ve `neta-supabase-export` bundle'ı hazırlamak için kullanın. Güncel aktarım sözleşmesi ve cutover runbook'u:

```text
docs/self-hosted-redesign/phase-8-import-release.md
```

Arşivdeki SQL'i yeni Neta kurulumu için çalıştırmayın.
