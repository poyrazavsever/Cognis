---
title: AI Asistan
description: Neta'nın AI sohbet ve analiz özelliklerinin nasıl çalıştığı.
order: 10
status: legacy-v2-archive
---

# AI Asistan

> Arşiv: Bu belge v2 veri erişimini anlatır. v3 AI provider ve context katmanı server-side çalışır; secret browser'a dönmez. Güncel teknik kayıt `docs/self-hosted-redesign/phase-7-ai-business-backend.md` dosyasındadır.

Neta'daki AI asistanı, uygulamanın içindeki veriler hakkında hızlıca soru sorabilmek için ekledim. Bu asistanın amacı genel bir chatbot olmak değil; görevler, projeler, finans kayıtları ve günlük notları üzerinden bana bağlama dayalı cevap verebilmesi.

## Chat Ekranı

AI sohbet ekranı şu route altında bulunur:

```txt
/chat
```

Bu ekranda konuşmalar session olarak tutulur.

Kullanılan tablolar:

- `chat_sessions`
- `chat_messages`

Her yeni sohbet için `chat_sessions` içinde bir kayıt açılır. Kullanıcı ve asistan mesajları `chat_messages` tablosunda saklanır.

## API Route

Chat yanıtları şu endpoint üzerinden üretilir:

```txt
/api/chat
```

Bu endpoint önce kullanıcıyı Supabase session üzerinden doğrular. Sonra kullanıcının son verilerinden kısa bir bağlam oluşturur.

Bağlama dahil edilen örnek veriler:

- Son görevler.
- Son projeler.
- Son 30 gün finans kayıtları.
- Son günlük kayıtlar.

Bu bağlam sistem mesajı içine eklenir. Böylece AI model sadece boş sohbet etmiyor, Neta içindeki güncel kayıtları da dikkate alıyor.

## AI Provider Ayarları

AI provider bilgisi `app_settings` tablosunda tutulur.

Desteklenen provider'lar:

- OpenAI
- Google Gemini
- Groq
- Ollama

Web uygulamasındaki ana AI chat akışı cloud provider'lara göre kurgulanmıştır. Ollama seçeneği schema'da ve bazı yardımcı yapılarda geçer, ama local Ollama kullanımının asıl pratiği `main.pyw` gibi masaüstü yardımcı script tarafındadır.

## Ayarlar Ekranı

AI ayarları uygulama içinde şu ekrandan yönetilir:

```txt
/settings
```

Buradan provider ve API key kaydedilir.

Kaydedilen alanlar:

- `ai_provider`
- `ai_model`
- `api_key`

Bu değerler `app_settings` tablosunda saklanır.

## Finans Analizi

Finans analizi için ayrı bir endpoint vardır:

```txt
/api/finance-analysis
```

Bu endpoint son 30 günün finans işlemlerini alır, gelir-gider toplamlarını hesaplar ve AI modelden kısa bir finansal yorum ister.

Bu özellik muhasebe tavsiyesi vermek için değil, freelancer olarak finansal gidişatı hızlıca yorumlamak için eklenmiştir.

## Proje Risk Analizi

Proje risk analizi endpoint'i:

```txt
/api/project-risk
```

Bu endpoint tek bir proje veya aktif projeler üzerinden risk ve durum raporu üretir.

Kullanılan bilgiler:

- Proje adı.
- Müşteri adı.
- Durum.
- Bütçe.
- İlerleme.
- Başlangıç ve bitiş tarihleri.
- Görev sayısı.
- Tamamlanan görev sayısı.

## Embedding ve pgvector

Projede `document_embeddings` tablosu ve `match_documents` function'ı için altyapı bulunur. Bu yapı, ileride daha gelişmiş RAG özellikleri için kullanılabilir.

İlgili yardımcı fonksiyonlar:

- `generateEmbedding`
- `saveDocumentEmbedding`
- `searchSimilarDocuments`

Bu yapı tam ürün akışının merkezinde değil, ama gelecekte döküman, not veya proje içeriği üzerinden daha güçlü arama ve bağlam üretme için hazır tutulur.

## Local Python/Ollama Yardımcısı

Repo içinde `main.pyw` dosyası da bulunur. Bu dosya web uygulamasından bağımsız bir masaüstü metin işleme yardımcısıdır.

Ne yapar?

- Seçili metni kopyalar.
- F8 ile menü açar.
- Ollama API üzerinden metin düzeltme, çeviri, özetleme gibi işler yapar.

Bu dosya Neta web deployment akışının parçası değildir. Vercel, Coolify veya Dokploy deploy'u için gerekli değildir. Ama lokal kullanım için korunur.

## AI İçin Dikkat Edilecekler

- API key'ler doğru provider'a ait olmalıdır.
- Provider seçimi ile model adı uyumlu olmalıdır.
- Kullanıcı verisi AI modele gönderildiği için hangi provider'ın kullanıldığı bilinçli seçilmelidir.
- Finansal, hukuki veya klinik kesin hüküm üretmemesi için sistem prompt'larında sınırlayıcı ifadeler kullanılmalıdır.
