# Crawler & Veri Kazıma Referansı

## Endpoint'ler

```
Primary health:  http://161.118.171.201:3002/health    (hulyaekiz)
Primary crawl:   http://161.118.171.201:3002/crawl
Backup health:   http://141.148.206.187/c4ai/health    (orko)
Backup crawl:    http://141.148.206.187/c4ai/crawl
Timeout:         5 saniye health, 40 saniye crawl
Fallback:        Primary başarısız → Backup aktif
```

## Temel Kullanım

```typescript
import { enqueueUrls, getQueueStatus } from '@/lib/crawl-queue'

// TEK URL — önce queue'ya al, direkt Crawl4AI çağırma
const jobs = enqueueUrls(
  ['https://oscarliang.com/fpv-pid-tuning/'],
  'fpv-pid-profiles',
)

// BATCH — admin cron/crawl veya crawl-queue endpoint'i ile batch'i yönet
const queue = getQueueStatus()
console.log(queue.stats)
```

## CRAWL_DRY_RUN=true (Zorunlu Test Modu)

```bash
# .env.local veya terminal'de
CRAWL_DRY_RUN=true npm run routes:audit
CRAWL_DRY_RUN=true bash ../scripts/crawl4ai-fallback.sh hepsi

# Dry-run: gerçek HTTP isteği yok, embedding harcanmaz
# Başarılı dry-run sonrası gerçek çalıştır:
CRAWL_DRY_RUN=false bash ../scripts/crawl4ai-fallback.sh hepsi
```

## src/lib/crawl-queue.ts Retry Mantığı

```
1. Deneme  → hata → 60s bekle
2. Deneme  → hata → 5dk bekle
3. Deneme  → hata → 15dk bekle
4. Deneme  → hata → FAILED olarak işaretle
```

**Bypass etme.** Rate limit veya geçici hata durumunda retry otomatik çalışır.

## Başarısız URL Analizi (Açık Görev #1)

```sql
-- PostgreSQL: content_engine.raw_content
SELECT 
  url,
  status,
  error_message,
  attempt_count,
  last_attempt_at
FROM raw_content 
WHERE status = 'failed'
ORDER BY last_attempt_at DESC;
```

### Hata Kategorileri & Çözümleri

| Hata | Çözüm |
|------|-------|
| `timeout` | URL'nin erişilebilir olup olmadığını kontrol et; timeout 5s → 10s artır |
| `403 Forbidden` | robots.txt kontrol et; User-Agent header ekle |
| `javascript_required` | Crawl4AI JS mode aktif et: `{ jsEnabled: true }` |
| `rate_limited` | Batch size küçült; delay artır |
| `content_too_short` | Min content length threshold'u düşür |
| `encoding_error` | `{ encoding: 'utf-8' }` zorla |

### Başarısız URL'leri Yeniden Dene

```typescript
import { enqueueUrls } from '@/lib/crawl-queue'

// Dry-run önce
process.env.CRAWL_DRY_RUN = 'true'
enqueueUrls(
  ['https://example.com/failed-source'],
  'fpv-components-specs',
)
```

## Boş Dataset'leri Doldurma (Açık Görev #5)

### Hedef Dataset → URL Kaynakları

```
fpv-pid-profiles:
  - https://oscarliang.com/tag/pid/
  - https://betaflight.com/docs/tuning/
  - https://github.com/betaflight/betaflight/wiki/PID-Tuning-Guide

fpv-build-guides:
  - https://oscarliang.com/category/build/
  - https://www.rcgroups.com/forums/forumdisplay.php?f=915

fpv-troubleshooting:
  - https://oscarliang.com/tag/troubleshooting/
  - https://www.reddit.com/r/fpv/wiki/

fpv-components-specs:
  - https://www.getfpv.com/motors.html (product specs)
  - https://iflight-rc.com/collections/motors

fpv-racing-events:
  - https://www.multirotorguide.com/races/
  - https://www.dr1racing.com/events/
```

### Batch Crawl Script Şablonu

```typescript
import { enqueueUrls, getQueueStatus } from '@/lib/crawl-queue'

const URLS_BY_DATASET = {
  'fpv-pid-profiles': [
    'https://oscarliang.com/fpv-pid-tuning/',
    // ...
  ],
  'fpv-build-guides': [
    'https://oscarliang.com/build-fpv-drone/',
    // ...
  ],
}

async function main() {
  // 1. Dry-run
  if (process.env.CRAWL_DRY_RUN !== 'false') {
    console.log('DRY RUN — embedding harcanmıyor')
  }
  
  for (const [dataset, urls] of Object.entries(URLS_BY_DATASET)) {
    console.log(`\n📦 ${dataset}: ${urls.length} URL`)
    enqueueUrls(urls, dataset)
  }
  console.log(getQueueStatus().stats)
}

main()
```

## Crawl4AI Gelişmiş Ayarlar

```typescript
// JavaScript gerektiren sayfalar için mevcut app route'a alan eklenmeden
// önce crawler payload sözleşmesini genişlet. Veri şeması net değilse URL'yi
// queue'da pending bırak ve admin ingest route'unu bozma.

// Auth gerektiren sayfalar
// Auth gerektiren sayfalar için cookie/env değerlerini loglama.

// Belirli CSS selector'ı hedef al
// Belirli selector gerekiyorsa önce source-specific parser ekle.
```

## Pipeline: Crawl → Chunk → Embed → Qdrant

```
URL → Crawl4AI → raw HTML
    → Content Extraction (selector/main content)
    → Chunking (dataset'e göre: 400-1000 token)
    → gemini-embedding-001 → vektör
    → Qdrant collection
    → Dify dataset sync
```

## Monitoring

```bash
# Kuyruk durumu
redis-cli -h 80.225.231.62 LLEN crawl:queue

# Günlük crawl istatistikleri
SELECT DATE(created_at), COUNT(*), SUM(CASE WHEN status='success' THEN 1 ELSE 0 END) as ok
FROM raw_content GROUP BY DATE(created_at) ORDER BY 1 DESC LIMIT 7;

# Embedding kullanımı
cat fpv-autoblog-v2/fpvlovers-frontend-websitesi/data/embedding-usage.json | jq .
```
