import { difyRequest } from '@/lib/dify-client';
import { getRequiredEnv } from '@/lib/env';
import { fetchYoutubeTranscript } from '../youtube-parser';

export async function generateJournalistArticle(youtubeUrl: string): Promise<string> {
  const { videoId, transcript } = await fetchYoutubeTranscript(youtubeUrl);
  
  if (!transcript || transcript.length < 100) {
    throw new Error('Transcript is too short or empty. Cannot generate article.');
  }

  // Truncate transcript to roughly 6000 words (approx 8000 tokens) to avoid limits
  const truncatedTranscript = transcript.split(' ').slice(0, 6000).join(' ');

  const prompt = `Sen FPVLovers için çalışan uzman bir teknoloji muhabirisin. Sana aşağıda popüler bir YouTube FPV videosunun ham konuşma dökümünü (transcript) veriyorum.
  
Bu videoyu izlemiş ve teknik notlar çıkarmış gibi profesyonel, sürükleyici ve bilgi dolu bir blog makalesi yaz.
Lütfen sadece bir "özet" geçme. Konuşmacıya/Yayıncıya atıfta bulunarak (Örn: "Videoda bahsedildiği üzere...", "Joshua'nın dikkat çektiği nokta...") konuyu teknik bir makale diliyle anlat. 
Eğer videoda PID, Rate, motor KV'si veya spesifik donanım isimleri geçiyorsa bunları koru ve doğru bağlamda kullan.

İşte Videonun Ham Altyazısı:
"""
${truncatedTranscript}
"""

Cevabını doğrudan AŞAĞIDAKİ JSON FORMATINDA ver. Herhangi bir ekstra metin veya markdown ekleme, sadece geçerli bir JSON çıktısı üret:
{
  "title": "Makalenin çarpıcı başlığı",
  "seo": {
    "slug": "makale-slug",
    "metaDescription": "SEO uyumlu kısa açıklama",
    "keywords": ["fpv", "drone", "anahtar-kelime"]
  },
  "excerpt": "Ana sayfada görünecek kısa giriş",
  "bodySections": [
    {
      "id": "intro",
      "title": "Giriş",
      "content": "Giriş paragrafı (Markdown destekli)"
    },
    {
      "id": "teknik-detay",
      "title": "Teknik İnceleme",
      "content": "Alt başlık ve içerik"
    }
  ],
  "internalLinks": [],
  "publishNotes": ["YouTube videosundan üretildi"]
}`;

  const expertToken = getRequiredEnv('DIFY_APP_TOKEN_EXPERT');

  const response = await difyRequest('/chat-messages', {
    method: 'POST',
    apiKey: expertToken,
    body: {
      inputs: {},
      query: prompt,
      response_mode: 'blocking',
      user: 'fpv-journalist-system',
    },
    timeout: 300000, // 5 minutes
    taskType: 'content_gen'
  });

  if (!response.ok || !response.data) {
    throw new Error(`Failed to generate article from Dify: ${response.error || 'Unknown error'}`);
  }

  return response.data.answer || '';
}
