---
title: Supabase Kurulumu
description: Neta için gerekli Supabase tablo, policy, function ve storage gereksinimleri.
order: 4
status: legacy-v2-archive
---

# Supabase Kurulumu

> Arşiv: Self-hosted v3 çalışmak için Supabase kurulumu istemez. Bu içerik yalnızca eski bir v2 instance'ını anlamak içindir; güncel aktarım rehberi `docs/self-hosted-redesign/phase-8-import-release.md` dosyasındadır.

Neta'nın çalışması için hazır bir Supabase projesine ihtiyaç var. Bu repo artık Supabase'i beraberinde getirmiyor. Yani uygulama deploy edilirken veritabanı, auth veya storage otomatik kurulmaz. Ben burada web uygulamasını sade tutmayı tercih ettim. Supabase tarafı ayrı bir altyapı olarak yönetilir. 

> Şuan nestjs ile backend geliştiriyorum, çok yakında tam self host olacak :)

## Beklenen Kurulum

Kurulumda genel yaklaşım şu:

1. Supabase üzerinde bir proje oluşturulur.
2. Neta'nın ihtiyaç duyduğu SQL schema, policy, trigger ve function'lar Supabase tarafına uygulanır.
3. Gerekli storage bucket'ları oluşturulur.
4. Supabase URL ve key değerleri uygulama ortam değişkenlerine eklenir.
5. Uygulama deploy edilir.

Repo içinde `supabase/` ve `docs/database/` klasörleri tutulmaya devam eder. Bunları deployment sırasında otomatik çalıştıran bir script yoktur. Bu dosyalar benim SQL kayıtlarım, migration notlarım ve schema geçmişim olarak durur.

## Tek Seferlik Kurulum SQL'i

Yeni bir Supabase projesini Neta için hazırlamanın en kolay yolu `supabase/setup.sql` dosyasını çalıştırmak. Bu dosya `supabase/schema.sql` ve `supabase/migrations/0002..0012` arasındaki migration dosyalarının tek dosyada birleştirilmiş hâlidir.

Demo seed verisi bu dosyaya dahil değildir. Production kurulumda örnek veri istemediğim için seed ayrı tutulur.

### Supabase SQL Editor ile

Supabase panelinde şu bölümü açın:

```txt
SQL Editor -> New query
```

Sonra `supabase/setup.sql` dosyasının tamamını kopyalayıp tek seferde çalıştırın.

Bu işlem şunları kurar:

- Tablolar.
- Foreign key ve check constraint'leri.
- Index'ler.
- Trigger ve function'lar.
- RLS policy'leri.
- Storage bucket kayıtları ve storage policy'leri.

### Terminalden Tek Komut ile

Supabase connection string'iniz varsa aynı kurulumu tek `psql` komutuyla da çalıştırabilirsiniz:

```bash
psql "postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres" -v ON_ERROR_STOP=1 -f supabase/setup.sql
```

Supabase hosted projelerde connection string'i şuradan alabilirsiniz:

```txt
Project Settings -> Database -> Connection string
```

Şifre, host ve port bilgilerini kendi projenize göre değiştirmelisiniz.

Bu komut başarılı bittikten sonra Supabase tarafı Neta uygulamasına hazır hâle gelir.

## Gerekli Tablolar

Neta şu public tabloları bekler:

- `profiles`
- `clients`
- `projects`
- `tasks`
- `calendar_events`
- `finance_transactions`
- `daily_logs`
- `app_settings`
- `chat_sessions`
- `chat_messages`
- `project_planning_sections`
- `project_revisions`
- `client_activities`
- `proposals`
- `contracts`
- `invoices`
- `subscriptions`
- `document_embeddings`
- `journals`

`journals` tablosu eski yapıdan gelen legacy bir tablodur. Güncel günlük ekranı ağırlıklı olarak `daily_logs` kullanır, ama schema geçmişinde `journals` hâlâ durur.

## Gerekli Function ve RPC'ler

Uygulama şu function/RPC yapılarına ihtiyaç duyar:

- `is_first_admin_setup_available`
- `request_internal_auth_creation`
- `match_documents`
- `get_dashboard_metrics` — Dashboard KPI ve grafik verilerini sunucu tarafında hesaplar
- `get_analytics_metrics` — Analiz sayfası proje gelir dağılımı ve görev istatistiklerini hesaplar
- Yeni auth user için profile oluşturan trigger/function
- Proje ilerlemesini görev durumuna göre güncelleyen trigger/function

Özellikle `request_internal_auth_creation`, service role ile güvenli kullanıcı oluşturma akışında kullanılır. İlk admin ve müşteri portal kullanıcıları oluşturulurken bu yapı önemlidir.

## Row Level Security

Neta'da RLS açık olmalıdır. Freelancer verilerinin çoğu şu mantıkla ayrılır:

```sql
auth.uid() = user_id
```

Bu sayede her kullanıcı sadece kendi verisini görür.

Müşteri portalı ise farklı çalışır. Müşterinin auth kullanıcısı `clients.client_auth_id` alanına bağlanır. Portal erişimi bu ilişki üzerinden verilir.

Örnek mantık:

```txt
client auth user -> clients.client_auth_id -> projects.client_id
```

Müşteri sadece kendisine bağlı projeleri, public işaretli görevleri ve kendi revizyon taleplerini görmelidir.

## Storage Bucket'ları

Supabase Storage tarafında iki bucket beklenir.

| Bucket | Public | Dosya boyutu | MIME türleri |
| --- | --- | --- | --- |
| `avatars` | Evet | Supabase varsayılanı | Herhangi |
| `project-assets` | Hayır | 5 MB | `image/jpeg`, `image/png`, `image/webp`, `image/gif` |

`avatars` public olabilir çünkü profil fotoğrafları direkt gösterilir. `project-assets` private kalmalıdır. Proje görselleri için uygulama signed URL üretir.

## Service Role Key Neden Gerekli?

Uygulama normal kullanıcı işlemlerinde anon key ve session kullanır. Ama bazı işler server tarafında daha yüksek yetki gerektirir:

- İlk admin auth kullanıcısını oluşturmak.
- Müşteri portal kullanıcısı oluşturmak.
- Avatar veya proje görseli upload etmek.
- Bazı fallback setup kontrollerini yapmak.

Bu yüzden `SUPABASE_SERVICE_ROLE_KEY` zorunludur. Bu key asla browser'a gönderilmemelidir.

## SQL Dosyaları Nasıl Kullanılmalı?

Yeni kurulum için en pratik dosya:

```txt
supabase/setup.sql
```

Bu dosya tek seferde çalıştırılacak kurulum dosyasıdır.

Parçalı dosyalar ise migration geçmişini ve geliştirme sürecini belgelemek için korunur:

```txt
supabase/schema.sql
supabase/migrations/
docs/database/
```

Yeni bir kurulum yaparken en güvenilir kaynak, çalışan Supabase projesinden aldığınız güncel SQL çıktısıdır. Supabase panelindeki "copy as SQL" çıktısı bu yüzden önemlidir.

Eğer schema'yı elle hazırlıyorsanız:

1. Önce extension'ları açın.
2. Tabloları oluşturun.
3. Foreign key ve check constraint'leri ekleyin.
4. Function ve trigger'ları ekleyin.
5. RLS'i aktif edin.
6. Policy'leri ekleyin.
7. Storage bucket ve policy'leri ayarlayın.

Bu sıra bozulursa Supabase SQL editor bazı foreign key veya policy adımlarında hata verebilir.
