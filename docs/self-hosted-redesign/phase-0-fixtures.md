---
title: Phase 0 Fixture Strategy
description: Self-hosted redesign boyunca kullanılacak küçük ve stres veri setlerinin kapsamı.
status: active
last_updated: 2026-07-10
---

# Phase 0 Fixture Strategy

Faz 0'da hedef DB schema henüz oluşmadığı için kesin SQLite seed dosyası üretilmez. Bu dosya, import rehearsal ve Faz 1-5 testlerinde kullanılacak küçük/stres veri setlerinin kapsamını sabitler. İlk gerçek seed, Drizzle schema oluştuktan sonra `scripts/seed.mjs` veya TypeScript seed runner ile üretilecek.

## Mevcut seed referansı

Kaynak:

- `supabase/seeds/0001_demo_freelancer_os_data.sql`
- `supabase/seed.sql`

Bu seed'ler Supabase schema için referanstır; hedef SQLite seed'i doğrudan bu dosyaları çalıştırmayacak.

## Küçük fixture kapsamı

Amaç: Core smoke ve regression testleri hızlı çalışsın.

Önerilen içerik:

- 1 freelancer user
- 2 clients
- 1 portal client user
- 3 projects: `planning`, `active`, `completed`
- 1 project `progress_type=auto`
- 8 tasks: `todo`, `in_progress`, `done`, private/public portal task karışık
- 4 calendar events: meeting/focus/deadline/finance
- 6 finance transactions: income/expense ve payment status çeşitleri
- 2 daily journal entries
- 2 planning sections: `overview`, `scope`, sıralı `sort_order`
- 2 revision requests: `pending`, `completed`
- 1 avatar metadata kaydı
- 1 project cover file metadata kaydı
- 1 chat session ve 2 message

Bu fixture REG-001, REG-002, REG-003, REG-004, REG-005 ve cross-owner negatif testleri desteklemeli.

## Stres fixture kapsamı

Amaç: Dashboard/list query performansını ve pagination zorunluluğunu test etmek.

Önerilen içerik:

- 1 freelancer user
- 100 clients
- 250 projects
- 2,500 tasks
- 1,000 calendar events
- 2,000 finance transactions
- 365 journal entries
- 1,000 chat messages
- 500 planning sections
- 250 revisions
- 500 file metadata row

Performans hedefleri:

- Dashboard DB aggregate hedefi: 50 ms altı, referans makine ve fixture ile.
- Core mutation DB bölümü: 100 ms altı.
- Liste endpoint/page payload'ı pagination veya visible range ile bounded kalmalı.

## Production import fixture

Cutover öncesi en az iki import rehearsal yapılacak:

- Rehearsal 1: Supabase export snapshot'ından local SQLite import.
- Rehearsal 2: Fresh export snapshot'ından temiz volume import + smoke.

Her rehearsal çıktısı:

- Export timestamp.
- Source row counts.
- Target row counts.
- Skipped/archived rows.
- Normalization warnings.
- File checksum manifest.
- Restore command.
- Smoke test sonucu.

