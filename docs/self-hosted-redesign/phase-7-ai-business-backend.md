# Faz 7 — AI, chat ve business backend geçişi

Tamamlanma tarihi: 2026-07-17

## Kapsam ve envanter

Faz 7 mevcut sayfa tasarımlarını değiştirmeden aşağıdaki aktif runtime yüzeylerini SQLite, Better Auth ve ortak service katmanına taşır:

- `/chat` client sayfası ve `/api/chat`
- `/api/finance-analysis`
- `/api/project-risk`
- `/business/proposals`
- `/business/invoices`
- `/business/subscriptions`
- `proposals`, `contracts`, `invoices` ve `subscriptions` için domain backend sözleşmeleri

Geçiş öncesinde chat sayfası browser-side Supabase auth ve tablo çağrıları yapıyordu. Üç AI route'u Supabase Auth, `app_settings` ve domain tablolarına doğrudan erişiyor; provider oluşturma mantığını tekrarlıyordu. Aktif business sayfaları da Supabase Server Client ile doğrudan tablo okuyordu.

Repo içinde aktif bir sözleşme sayfası bulunmadığından bu faz yeni bir route veya tasarım üretmedi. Sözleşme backend'i diğer business kaynaklarıyla aynı owner-scoped CRUD seviyesinde tamamlandı. Yeni business form/CRUD UX'i, kilitlenen ürün kararına uygun biçimde Faz 10'a bırakıldı.

## Chat veri sınırı

Chat session ve message işlemleri `DomainService` üzerinden yürür:

- session listeleme, oluşturma, sahiplik doğrulama ve silme
- message listeleme ve ekleme
- session silindiğinde SQLite foreign key ile message cascade
- foreign owner ve client rolü için kaynak varlığını sızdırmayan hata

Chat sayfası artık Supabase client oluşturmaz. Server Action'lar Better Auth freelancer session'ından actor üretir ve domain service'i çağırır.

`/api/chat` istemciden gelen geçmişi güvenilir bağlam olarak kullanmaz. İstek yalnızca sahipliği doğrulanmış `sessionId` ve son kullanıcı mesajı için kabul edilir; model geçmişi SQLite'taki son 40 owner-scoped mesajdan yeniden kurulur. Böylece başka session geçmişi, sahte system message veya browser kaynaklı provider ayarı modele taşınamaz.

Geçerli AI runtime ayarı ve session sahipliği doğrulanmadan mesaj yazılmaz. Başarılı stream başlangıcında kullanıcı mesajı; başarılı model tamamlanmasında assistant mesajı kalıcılaştırılır.

## Server-only AI katmanı

Ortak AI sınırı üç parçaya ayrıldı:

- `server/ai/provider.ts`: encrypted owner ayarını açar, provider/model üretir ve timeout sözleşmesini uygular.
- `server/ai/context.ts`: yalnızca domain service'in owner-scoped okumalarıyla sınırlı AI bağlamları üretir.
- `server/ai/responses.ts`: provider/configuration hatalarını kontrollü HTTP hata sözleşmesine çevirir.

Cloud provider API key'i yalnızca `getAiRuntimeSettings` içinden server-side çözülür. Chat request body, client component ve public settings çıktısı key veya provider override taşımaz.

Desteklenen provider yolları:

| Provider | Key | Runtime |
| --- | --- | --- |
| Gemini | zorunlu | `@ai-sdk/google` |
| OpenAI | zorunlu | `@ai-sdk/openai` |
| Groq | zorunlu | `@ai-sdk/groq` |
| Ollama | gereksiz | OpenAI-compatible local endpoint |

Ollama endpoint'i `OLLAMA_BASE_URL`, provider timeout'u `AI_REQUEST_TIMEOUT_MS` ile server environment'tan ayarlanabilir. Timeout sınırı 1–120 saniye, varsayılan 30 saniyedir.

Provider kaynaklı ham hata veya secret istemciye dönmez. Configuration hataları `400`, provider bağlantı hataları `502`, timeout `504` olarak normalize edilir. Chat stream başladıktan sonraki provider hatası kullanıcıya sabit ve secretsız bir mesaj verir.

## Context builder

Context builder route içine gömülü sorgu çalıştırmaz. Aşağıdaki domain service okumalarını kullanır:

- son görevler
- son projeler ve owner'a ait müşteri adları
- son 30 gün finans kayıtları
- son 30 gün günlük kayıtları
- seçili proje için owner-scoped proje ve görevler

Bağlam kayıt adetleri ve toplam karakter sayısıyla sınırlandırılır. Finans toplamları farklı para birimlerini birbirine eklemez; currency bazında hesaplanır. Project risk isteğindeki `projectId` owner kapsamı dışında ise `404` döner. Kayıt içeriği model system prompt'unda veri olarak işaretlenir ve talimat olarak uygulanmaması istenir.

## Finans ve proje risk route'ları

İki route da:

1. Better Auth session'ını request header'ından doğrular.
2. Freelancer rolü dışındaki actor'ları reddeder.
3. Domain verisini owner-scoped context builder'dan alır.
4. Provider ve API key'i encrypted server ayarından çözer.
5. Ortak timeout ve hata sözleşmesiyle AI SDK çağrısı yapar.

Finans ekranının mevcut `{ text }` başarı sözleşmesi ve proje ekranının `{ projectId }` request sözleşmesi korunmuştur. Finans kaydı yoksa provider çağrısı yapılmadan açıklayıcı sonuç döner.

## Business backend

Teklif, sözleşme, fatura ve abonelik repository/service'leri şu işlemleri owner scope zorunlu olacak şekilde destekler:

- list/get
- create
- partial update
- delete

Teklif ve fatura client/project ilişkileri mevcut domain invariant kontrollerinden geçer. Sözleşme tarafında client ve teklif aynı owner'a ait olmalı; müşterili tekliften üretilen sözleşmenin client bağı teklif ile uyuşmalıdır. Business update işlemleri `updated_at` değerini yeniler.

Aktif teklif, fatura ve abonelik sayfaları Better Auth freelancer adapter'ından domain service'e bağlanır. Para alanları SQLite integer minor unit'ten mevcut UI'ın major unit sözleşmesine çevrilir; tarih değerleri client component'e serializable biçimde aktarılır.

## Güvenlik ve test kapsamı

`phase7:backend-boundary` aşağıdakileri denetler:

- Faz 7 runtime dosyalarında Supabase import/reference bulunmaması
- runtime Supabase environment bağı bulunmaması
- browser `localStorage` kullanımı bulunmaması
- AI route'larının request body'den key/provider seçmemesi
- chat client bundle'ında key/provider bulunmaması
- legacy Supabase embeddings helper'ının aktif runtime tarafından import edilmemesi

`phase7:domain-smoke` temiz migration uygulanmış SQLite üzerinde şunları doğrular:

- chat session/message sahipliği ve cascade delete
- AI context'lerinde cross-owner veri izolasyonu
- foreign project risk erişiminin reddi
- dört business kaynağında CRUD, client rol reddi ve cross-owner negatifleri

Better Auth HTTP smoke testi ayrıca:

- `/chat` ve aktif business sayfalarının authenticated SSR yanıtını
- anonim AI route reddini
- API key bulunmayan kontrollü AI configuration hatasını
- reddedilen chat isteğinin message yazmamasını
- SSR çıktısında Supabase izi bulunmamasını

doğrular.

Targeted Faz 7 ESLint, typecheck, production build ve `git diff --check` başarılıdır. Repo genel lint'i Faz 7 dışındaki mevcut client-component borçları nedeniyle başarısız kalır; master plandaki genel lint checkbox'ı bu nedenle işaretlenmemiştir.

## Bilinçli olarak Faz 8/10'a bırakılanlar

- Kullanılmayan `lib/ai/embeddings.ts` aktif runtime tarafından import edilmez; Supabase package ve legacy dosya temizliği Faz 8 kapsamındadır.
- Supabase production export'undan chat/business veri import'u Faz 8 import aracının parçasıdır.
- Business create/edit/delete ekranları ve chat/business görsel revizyonları Faz 10'da kullanıcı yönlendirmesiyle ele alınacaktır.
- Provider model seçimi için yeni UX bu backend fazında eklenmemiştir.
