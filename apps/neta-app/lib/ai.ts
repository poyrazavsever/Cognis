export interface AIAnalysisResult {
  ai_tags: string[];
  ai_sentiment_score: number;
  ai_summary: string;
  suggested_tasks: string[];
}

export async function analyzeJournalWithLocalAI(
  content: string,
  model: string = "llama3",
): Promise<AIAnalysisResult | null> {
  const prompt = `
  Sen şefkatli bir yapay zeka asistanı ve kişisel yansıma (reflection) yardımcısısın. 
  Aşağıdaki günlük girdisini analiz edip tam olarak belirtilen JSON formatında yanıt vermelisin. Düz metin kullanma, SADECE geçerli bir JSON objesi döndür.
  
  Günlük Metni: "${content}"
  
  İstenen JSON Formatı:
  {
    "ai_tags": ["#duygu", "#konu", vb.],
    "ai_sentiment_score": 0.5, // -1.0 (çok negatif) ile +1.0 (çok pozitif) arası ondalıklı bir değer
    "ai_summary": "Kullanıcının durumunu özetleyen 1-2 cümlelik şefkatli geri bildirim.",
    "suggested_tasks": ["yapılabilecek pratik aksiyon 1", "aksiyon 2"] // Eylem gerektirmiyorsa boş dizi []
  }
  `;

  try {
    const response = await fetch("http://localhost:11434/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model, // Gerekirse "gemini-3-flash-preview:latest" gibi kendi modeliniz de olabilir
        prompt: prompt,
        stream: false,
        format: "json",
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API Hatası: ${response.statusText}`);
    }

    const data = await response.json();
    const parsedResult = JSON.parse(data.response);
    return parsedResult as AIAnalysisResult;
  } catch (error) {
    console.error(
      "AI Analizi başarısız oldu (Ollama açık olmayabilir):",
      error,
    );
    return null;
  }
}
