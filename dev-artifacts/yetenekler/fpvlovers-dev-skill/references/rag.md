# RAG & Retrieval Uzman Referansı

## Stack

```
Embedding:  gemini-embedding-001
Vector DB:  Qdrant (http://80.225.231.62:6333)
Reranker:   Jina Reranker v2
Search:     Hybrid (dense + sparse)
Dify:       v1.14.0 (RAG orchestration)
```

## 9 Dataset Detaylı Konfigürasyon

| Dataset | Chunk Size | Overlap | TopK | Score | Notlar |
|---------|-----------|---------|------|-------|--------|
| fpv-flight-tuning | 512 | 50 | 5 | 0.60 | |
| fpv-pid-profiles | 400 | 40 | 6 | 0.65 | Teknik, kısa chunk |
| fpv-troubleshooting | 600 | 60 | 5 | 0.55 | Geniş bağlam |
| fpv-components-specs | 500 | 50 | 4 | 0.60 | |
| fpv-build-guides | 800 | 80 | 4 | 0.50 | Uzun prosedürler |
| fpv-news-reviews | 1000 | 100 | 3 | 0.45 | Haberler, düşük threshold |
| fpv-racing-events | 750 | 75 | 3 | 0.50 | |
| fpv-community-knowledge | 600 | 60 | 4 | 0.55 | |
| fpv-regulations | 400 | 40 | 4 | **0.70** | ⚠️ Hukuki hassasiyet |

## Retrieval Pipeline

```typescript
// src/lib/retrieval-orchestrator.ts
import { retrievalAgent } from '@/lib/agents/retrievalAgent'

const results = await retrievalAgent.retrieve({
  query: 'Betaflight PID tuning for freestyle',
  datasets: ['fpv-pid-profiles', 'fpv-flight-tuning'],
  topK: 5,
  scoreThreshold: 0.60,
  useReranker: true,
})
```

## Retrieval Kalite Testi (Açık Görev #2)

Her dataset için test query paketi çalıştır:

```typescript
// scripts/test-retrieval.ts
const TEST_QUERIES = {
  'fpv-pid-profiles': [
    'Betaflight PID tuning beginner',
    'Blackbox analysis tips',
    'P gain oscillation fix',
  ],
  'fpv-flight-tuning': [
    'freestyle tune setup',
    'motor timing recommendation',
    'filter settings 2024',
  ],
  'fpv-regulations': [
    'Turkey drone regulations 2024',
    'SHGM registration requirements',
    'drone no fly zones',
  ],
}

async function testRetrieval() {
  const results: Record<string, {query: string; topScore: number; hits: number}[]> = {}
  
  for (const [dataset, queries] of Object.entries(TEST_QUERIES)) {
    results[dataset] = []
    for (const query of queries) {
      const hits = await retrievalAgent.retrieve({
        query, datasets: [dataset], topK: 3, scoreThreshold: 0.0
      })
      results[dataset].push({
        query,
        topScore: hits[0]?.score ?? 0,
        hits: hits.length,
      })
    }
  }
  
  console.table(results)
  // Score < threshold olan dataset'leri işaretle
}
```

### Kalite Kriterleri

```
✅ İyi:    topScore > threshold, hits >= 2
⚠️ Zayıf: topScore yakın threshold'a (0.05 fark)
❌ Kötü:   hits = 0 veya topScore << threshold → dataset boş/zayıf
```

## Qdrant Doğrudan Erişim

```typescript
import { QdrantClient } from '@qdrant/js-client-rest'

const qdrant = new QdrantClient({ url: 'http://80.225.231.62:6333' })

// Collection listesi
const { collections } = await qdrant.getCollections()

// Collection detayı
const info = await qdrant.getCollection('fpv-pid-profiles')
console.log(`Vektör sayısı: ${info.vectors_count}`)

// Manuel arama (test)
const results = await qdrant.search('fpv-pid-profiles', {
  vector: embeddingVector,  // gemini-embedding-001 çıktısı
  limit: 5,
  score_threshold: 0.60,
})

// Collection temizle (DİKKAT!)
// await qdrant.deleteCollection('collection-name')
```

## Embedding Üretimi

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
const model = genAI.getGenerativeModel({ model: 'gemini-embedding-001' })

async function embed(text: string): Promise<number[]> {
  const result = await model.embedContent(text)
  return result.embedding.values
}

// UYARI: Her embed çağrısı token harcar
// Batch/AI çağrıları için src/lib/dify-client.ts wrapper'ını kullan (throttle koruması var)
```

## Jina Reranker v2

```typescript
// Reranker Dify üzerinden çağrılıyor — doğrudan çağırma

// Reranker'ı devre dışı bırak (sadece test için)
const results = await retrievalAgent.retrieve({
  query: '...',
  datasets: ['fpv-pid-profiles'],
  useReranker: false,  // ham score ile karşılaştır
})
```

## Chunking Stratejisi

```typescript
// Yeni içerik eklerken chunk boyutuna uy
function chunkContent(content: string, datasetName: string): string[] {
  const config = DATASET_CONFIG[datasetName]
  // config.chunkSize: 400-1000
  // config.overlap: chunkSize * 0.1
  
  const chunks: string[] = []
  let start = 0
  while (start < content.length) {
    chunks.push(content.slice(start, start + config.chunkSize))
    start += config.chunkSize - config.overlap
  }
  return chunks
}
```

## RAG Optimizasyon Rehberi

### Score threshold çok düşük → gürültü
```
Belirti: İlgisiz sonuçlar, hallucination artışı
Çözüm:   threshold 0.05 artır, reranker'ı aktif et
```

### Score threshold çok yüksek → boş sonuç
```
Belirti: hits = 0, "bilgi bulunamadı"
Çözüm:   threshold 0.05 düşür VEYA dataset'e içerik ekle
```

### Reranker sonrası sıralama bozuk
```
Belirti: TopK=5 alınıyor ama en iyi sonuç 4. sırada
Çözüm:   topK'yı 8-10'a çıkar, reranker daha geniş havuzda çalışsın
```

### fpv-regulations için özel dikkat
- Threshold 0.70 — kasıtlı yüksek (hukuki hata kabul edilemez)
- Bu threshold'u düşürme
- Eğer sonuç yoksa: "Bu konuda güncel mevzuatı yetkili kaynaktan kontrol edin" cevabını döndür

## Dataset Güncelleme Sonrası

```bash
# Dify'da re-index tetikle (UI üzerinden)
# Dify → Knowledge → Dataset → ... → Re-index

# Veya API
curl -X POST https://dify.affexai.tr/v1/datasets/{dataset_id}/indexing-estimate \
  -H "Authorization: Bearer dataset-57xGhkCvaQKR2YoSljA94NVu"
```
