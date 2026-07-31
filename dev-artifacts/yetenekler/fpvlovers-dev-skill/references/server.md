# Sunucu Yönetimi Referansı

## Altyapı

| Sunucu | IP | SSH Key | Çalışan Servisler |
|--------|-----|---------|-------------------|
| aluplan-one | 80.225.231.62 | aluplan-one.key | Dify v1.14.0, PostgreSQL, Redis, Qdrant, Coolify |
| hulyaekiz | 161.118.171.201 | hulya.key | Crawl4AI primary (:3002) |
| orko | 141.148.206.187 | orko.key | Crawl4AI backup (/c4ai) |

## SSH Bağlantı

```bash
# aluplan-one (Dify/DB/Coolify)
ssh -i ~/.ssh/aluplan-one.key ubuntu@80.225.231.62

# hulyaekiz (Crawl4AI primary)
ssh -i ~/.ssh/hulya.key ubuntu@161.118.171.201

# orko (Crawl4AI backup)
ssh -i ~/.ssh/orko.key ubuntu@141.148.206.187
```

## Coolify (aluplan-one)

Coolify dashboard: http://80.225.231.62:8000
Coolify tüm servisleri Docker Compose ile yönetir.

```bash
# Coolify CLI
cd /data/coolify
docker compose ps                    # Servis durumu
docker compose logs -f dify          # Dify logları
docker compose restart dify          # Dify yeniden başlat
docker compose pull && docker compose up -d  # Güncelle
```

## Dify Servisleri (aluplan-one)

```bash
# Dify container'larını listele
docker ps | grep dify

# Dify API logları
docker logs dify-api-1 -f --tail 100

# Dify worker logları
docker logs dify-worker-1 -f --tail 100

# Dify'ı yeniden başlat
docker restart dify-api-1 dify-worker-1

# Dify UI
open https://dify.affexai.tr
```

## PostgreSQL (aluplan-one)

```bash
# Bağlan
docker exec -it dify-db-1 psql -U postgres -d dify

# content_engine DB
psql -h 80.225.231.62 -U postgres -d content_engine

# raw_content tablosu
SELECT COUNT(*), status FROM raw_content GROUP BY status;
SELECT url, status, created_at FROM raw_content ORDER BY created_at DESC LIMIT 20;

# Başarısız URL'leri bul
SELECT url, error_message FROM raw_content WHERE status = 'failed' LIMIT 50;
```

## Redis (aluplan-one)

```bash
docker exec -it dify-redis-1 redis-cli

# Kuyruk durumu
KEYS crawl:*
LLEN crawl:queue
LRANGE crawl:queue 0 10
```

## Qdrant (aluplan-one)

```bash
# Qdrant dashboard
open http://80.225.231.62:6333/dashboard

# API health check
curl http://80.225.231.62:6333/healthz

# Collection listesi
curl http://80.225.231.62:6333/collections | jq .
```

## Crawl4AI — hulyaekiz (Primary)

```bash
# Health check
curl http://161.118.171.201:3002/health

# Servis durumu
ssh -i hulya.key ubuntu@161.118.171.201 "docker ps | grep crawl"

# Loglar
ssh -i hulya.key ubuntu@161.118.171.201 "docker logs crawl4ai -f --tail 100"

# Yeniden başlat
ssh -i hulya.key ubuntu@161.118.171.201 "docker restart crawl4ai"
```

## Crawl4AI — orko (Backup)

```bash
# Health check
curl http://141.148.206.187/c4ai/health

# Servis durumu
ssh -i orko.key ubuntu@141.148.206.187 "docker ps | grep crawl"
```

## Coolify Deploy (fpv-autoblog-v2/fpvlovers-frontend-websitesi)

```bash
cd fpv-autoblog-v2/fpvlovers-frontend-websitesi

# Production hedefi: Coolify/Oracle VPS
npm run build
docker compose up -d --build

# Environment değişkenleri Coolify UI veya .env.production üzerinden ayrılır
# Kritikler: DIFY_API_KEY, DIFY_BASE_URL, DATABASE_URL, REDIS_URL

# Coolify/Docker logları
docker compose logs -f --tail 100
```

Vercel bu projede öncelikli production hedefi değildir; sadece frontend preview veya açıkça istenen managed deploy senaryosunda düşün.

## Yaygın Sorunlar & Çözümler

### Dify API 503 dönüyor
```bash
ssh -i aluplan-one.key ubuntu@80.225.231.62
docker ps | grep dify-api
docker restart dify-api-1
sleep 10
curl https://dify.affexai.tr/v1/health
```

### Crawl4AI rate limit (429)
- `src/lib/crawl-queue.ts` retry mantığını kontrol et
- `CRAWL_DRY_RUN=true` ile test et
- Batch size'ı küçült (max 5 eşzamanlı)

### Qdrant collection bulunamıyor
```bash
curl http://80.225.231.62:6333/collections | jq '.result.collections[].name'
# Dify dashboard'dan dataset'i re-index et
```

### PostgreSQL bağlantı hatası
```bash
docker exec -it dify-db-1 psql -U postgres -c "SELECT 1"
# Container restart gerekirse:
docker restart dify-db-1
sleep 5
docker restart dify-api-1
```

## Monitoring

```bash
# Sistem kaynakları (tüm sunucular)
ssh -i aluplan-one.key ubuntu@80.225.231.62 "htop -d 5"
ssh -i hulya.key ubuntu@161.118.171.201 "df -h && free -m"

# ntfy.sh alertleri
# Kanal: ntfy.sh/fpv-rag-alerts
curl -H "Title: FPV Alert" -d "Mesaj" ntfy.sh/fpv-rag-alerts
```
