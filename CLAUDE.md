<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **FPVLovers** (1437 symbols, 2063 relationships, 41 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/FPVLovers/context` | Codebase overview, check index freshness |
| `gitnexus://repo/FPVLovers/clusters` | All functional areas |
| `gitnexus://repo/FPVLovers/processes` | All execution flows |
| `gitnexus://repo/FPVLovers/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

# FPVLovers AI Platform — Proje Beyni

## Proje Özeti
Next.js 15 tabanlı, Dify v1.14.0 destekli, 7 AI Agent'li FPV drone içerik, RAG, tool ve monetizasyon platformu.
Üç sunucu üzerinde çalışır: Dify backend, Crawl4AI Primary ve Crawl4AI Backup.
**Pure Agentic Architecture**: tüm orchestration TypeScript lib modüllerinde yürütülür — n8n kaldırılmıştır, hiçbir yeni kodda/dokümanda n8n, n8nac veya n8n-as-code referansı kullanılmaz.

## Uzak Repo (Önemli — 31 Temmuz 2026 itibarıyla)
- **Aktif remote**: `https://github.com/hazarvolga/fpvlovers-v02` — tüm push/pull işlemleri bundan sonra bu repoya yapılır.
- Eski repo (`fpvlovers.com.tr`) kullanıcı tarafından **private** yapılmıştır ve artık aktif olarak kullanılmamaktadır.

## Sunucu Yapısı
| Sunucu   | IP / Port                    | Görev                                              |
|----------|------------------------------|----------------------------------------------------|
| Sunucu A | 80.225.231.62                | Dify v1.14.0 · PostgreSQL · Redis · Qdrant         |
| Sunucu B | 161.118.171.201:3002         | Crawl4AI Primary                                   |
| Sunucu C | 141.148.206.187/c4ai         | Crawl4AI Backup                                    |

## Stack
| Katman      | Teknoloji                                              |
|-------------|--------------------------------------------------------|
| Frontend    | Next.js 15 Standalone · React 19 · TypeScript · Tailwind CSS 4 |
| AI/ML       | Gemini 2.5 Flash · Dify v1.14.0 · Qdrant              |
| Database    | PostgreSQL · Redis                                     |
| Crawler     | Crawl4AI (Sunucu B & C)                                |
| Deployment  | Coolify · Docker                                       |
| Monitoring  | ntfy.sh/fpv-rag-alerts                                 |
| LLM Cache   | PostgreSQL tabanlı response cache                      |

## Dify Backend
- **URL**: https://dify.affexai.tr
- **Versiyon**: v1.14.0
- **LLM**: Gemini 2.5 Flash
- **Vektör DB**: Qdrant

## FPV Web Sitesi
- **URL**: http://fpvlovers.com.tr/
- **Uzak Repo**: https://github.com/hazarvolga/fpvlovers-v02

## 8 RAG Dataset
| Dataset ID              | Konu                         |
|--------------------------|------------------------------|
| fpv-flight-tuning        | Uçuş ayarları & tuning       |
| fpv-pid-profiles          | PID profilleri               |
| fpv-troubleshooting       | Sorun giderme rehberleri     |
| fpv-components-specs      | Komponent spesifikasyonları  |
| fpv-build-guides          | Build rehberleri             |
| fpv-news-reviews          | Haberler & incelemeler       |
| fpv-racing-events         | Yarış takvimi & sonuçlar     |
| fpv-community-knowledge   | Topluluk bilgi tabanı        |

## Kod Mimarisi (src/)

Tüm kaynak kod `src/` altında yaşar:

| Dizin | Amaç |
|-------|------|
| `src/app/` | Next.js App Router sayfaları ve API route'ları |
| `src/lib/` | Core TypeScript lib modülleri (orkestratörler, client'lar, yardımcılar) |
| `src/lib/agents/` | 7 AI agent modülü |
| `src/lib/seo/` | SEO metadata yardımcıları |
| `src/types/` | Paylaşılan TypeScript tip tanımları |
| `src/hooks/` | React custom hook'ları |
| `src/components/ui/` | Yeniden kullanılabilir UI bileşenleri (badge, button, card, AISummaryBox) |
| `src/features/admin/components/` | Admin dashboard bileşenleri |
| `src/features/content-blocks/components/` | Block renderer ve block view bileşenleri |
| `src/features/layout/components/` | Navbar, SystemHUD |
| `src/features/monetization/components/` | AdZone, AffiliateButton, AffiliateCard, NativeAds, SponsorDashboard |
| `src/features/navigation/components/` | Breadcrumb |
| `src/features/tools/components/` | Etkileşimli tool widget'ları (AffexDuelEngine, BlackboxTuner, BuildCalculatorWidget, FlightCriticWidget, HardwareAnalyzer, NewsletterWidget, PartMatcherWidget, PilotPulseWidget) |

**Path Alias**: `@/*` → `src/*` (tsconfig.json). Örnek: `@/lib/utils` → `src/lib/utils.ts`

## Lib Modülleri
| Modül                    | Görev                                   |
|---------------------------|-------------------------------------------|
| `dify-client.ts` / `dify-caller.ts` | Dify API sarmalayıcı / LLM entegrasyonu |
| `crawl-queue.ts`           | Crawl4AI iş kuyruğu yöneticisi          |
| `retrieval-orchestrator.ts`| RAG dataset yönlendirmesi / retrieval pipeline koordinasyonu |
| `monetizationOrchestrator.ts` | Affiliate + sponsor iş akışı            |
| `llm-cache.ts`             | PostgreSQL tabanlı LLM yanıt önbelleği  |
| `ecosystem-intelligence.ts`| FPV ekosistem veri zekası               |
| `master-health.ts`         | Sistem sağlık toplayıcısı               |
| `master-routing-tables.ts` | Agent yönlendirme tabloları / route tanımları |
| `master-orchestrator.ts`   | Üst düzey istek yönlendirme ve agent koordinasyonu |
| `response-composer.ts`     | Agent çıktılarından nihai yanıt derlemesi |

## 7 AI Agent (`src/lib/agents/`)
| Agent               | Görev                                    | Lib Modülü              |
|----------------------|--------------------------------------------|-------------------------|
| `seoAgent` (SEO Agent)          | keyword → title / meta / schema.org      | master-routing-tables   |
| `affiliateAgent` (Affiliate Agent)    | content → product match / CTA            | monetizationOrchestrator|
| `sponsorshipAgent` (Sponsorship Agent)  | brand → scoring / tier / placement       | monetizationOrchestrator|
| `retrievalAgent` (Retrieval Agent)    | query → dataset routing                  | retrieval-orchestrator  |
| `metadataAgent` (Metadata Agent)     | content → entity / brand / intent        | ecosystem-intelligence  |
| `recommendationAgent` (Recommendation Agent) | query → best_for / budget_pick        | ecosystem-intelligence  |
| `ecosystemAgent` (Ecosystem Agent)    | advisory → content gap / routing hint    | ecosystem-intelligence  |

`src/lib/agents/index.ts` tüm agent'ları export eder.

## Conventional Commits
Tüm commit'ler Conventional Commits formatına uymalı: `type(scope): description`
Geçerli tipler: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`
commitlint + husky git hook'ları ile zorunlu kılınır.

## Affiliate Ağı
| Partner      | Kapsam                    |
|---------------|----------------------------|
| Amazon        | Genel elektronik & drone  |
| GetFPV        | FPV odaklı parçalar       |
| Banggood      | Çin kaynaklı parçalar     |
| RaceDayQuads  | Yarış drone bileşenleri   |

## Rate-Limit Stack
```
Dry-Run (CRAWL_DRY_RUN) → Throttle 1.5s/req Max 15/m → Queue Batch:3 Retry:60s/5m → Budget embedding-usage.json
```

## Admin Panel Sekmeleri (11)
| Renk | Sekme |
|------|-------|
| 🔵   | RAG Hub · URL Ingestion · Content Gen · Crawl Logs · Retrieval Test · Raw Browser |
| 🟠   | Affiliates · Sponsors · Orchestrator |
| 🟢   | System Health · Pilot Registry · Tool Telemetry |

## Komutlar
```bash
bash scripts/dify-trigger.sh "konu"        # Dify workflow tetikle
bash scripts/dify-health.sh                # Dify + Qdrant sağlık
bash scripts/crawl4ai-run.sh [kaynak]      # Primary crawler başlat
bash scripts/crawl4ai-fallback.sh [kaynak] # Backup crawler (Sunucu C)
bash scripts/affiliate-sync.sh             # Affiliate katalog güncelle
bash scripts/sponsor-check.sh             # Sponsor kampanya durumu
bash scripts/ntfy-alert.sh "[mesaj]"      # ntfy.sh bildirimi
bash scripts/health-all.sh               # Tüm servis sağlık raporu
```
> Not: Bu 8 script CLAUDE.md'de belgelenmiştir ancak repoda henüz gerçek dosya olarak mevcut değildir (31 Temmuz 2026 GAP denetiminde tespit edildi). Kullanmadan önce var olup olmadığını kontrol edin.

## Yayın Kuralları
- SEO skoru >= 80 olmadan yayın yasak
- Minimum 1200 kelime
- Anahtar kelime yoğunluğu %1.5–2.5
- Yayın saati: 09:00 ve 18:00 (UTC+3)
- Tüm görseller alt tag içermeli
- Affiliate linkler nofollow + sponsored rel etiketi taşımalı
- Duplicate içerik llm-cache üzerinden kontrol edilmeli

## FPV Niş Kategoriler
1. inceleme — Drone & parça incelemeleri
2. build-rehberi — 5", 3", Toothpick, Long Range
3. ucus-noktasi — Türkiye odaklı spot rehberleri
4. elektronik — Motor · ESC · FC · VTX · Kamera
5. haber — Yarış & freestyle haberleri
6. baslangic — Başlangıç rehberleri
7. yasal — SHY regulasyonları, SHGM mevzuatı
8. pid-tuning — Betaflight / Emuflight PID rehberleri

## YASAK
- Fiyat/spec doğrulamadan içerik yazma
- SHY/SHGM konularında halüsinasyon
- RAG sonucu olmadan ürün önerme
- .env içeriğini okuma veya loglama
- Doğrulanmamış iddiaları (uydurma fiyat/stok, abartılı skor) tool widget'larına (AffexDuelEngine, FlightCriticWidget, duelEngine.ts) geri getirme — bu sorun 73d8710 commit'iyle düzeltildi, tekrarlanmamalı

## Görsel Entegrasyon & Resilient Parser Sistemi
- **Inline Görsel Enjeksiyonu:** Makalelerdeki bottom gallery yapısı yerine, her bölümün altına Jaccard benzerlik algoritması kullanılarak eşleştirilen görseller `<figure>` biçiminde semantik ve şık olarak yerleştirilir.
- **PostgreSQL Görsel Kazıma:** Yayınlama fazında Dify API'den gelen `sourceHints` üzerinden PostgreSQL `raw_content` tablosundan canlı taranmış orijinal görseller (`harvestImagesFromDatabase` ile) çekilir, telif lisanslarına göre sınıflandırılıp önceliklendirilir.
- **Resilient Parser (cleanSectionContent):** LLM'lerin makale içeriklerini ` ```markdown ` ve en alta ` ```json ` blokları içine sarmalama eğilimine karşı, içerik otomatik olarak süzülüp temizlenir. Bu sayede makalelerin ham kod blokları halinde gösterilmesi engellenir.
- **Dinamik H2 Bölücü (Dynamic H2 Splitter):** Tek bölüm halinde kaydedilmiş eski/yeni makaleler çalışma zamanında `ensureMediaArtifact` içinde `## ` (H2) başlıklarına göre dinamik olarak alt bölümlere bölünür. Bu sayede birden fazla görsel makale boyunca dengeli şekilde dağıtılır.
- **Stok Görsel Havuzu:** `content-media.ts` içinde 30'dan fazla kategorize edilmiş premium FPV/drone stok görseli bulunur ve slug-hash bazlı deterministik seçim algoritması ile redeploy'larda görsellerin kayması engellenir.

## Güvenlik Notları (31 Temmuz 2026 GAP kapatma sonrası)
- `AUTH_SECRET` production'da **zorunludur** — ayarlanmazsa uygulama başlamaz (eski fallback-secret mekanizması kaldırıldı).
- SSH key'leri ve Coolify env yedekleri repo dışında, güvenli bir secrets yöneticisinde tutulmalı — asla `dev-artifacts/`, `server-info/` gibi repo-içi klasörlere konulmamalı. `.gitignore` bu tür klasörleri (`AffexAI-Oracle-Servers/`, `servers-info.txt`, `coolify-env-backup*.env`, `*.env` hariç `.env.example`) hariç tutar.
- `crawl-queue-store.ts` artık `FOR UPDATE` satır kilidi ile idempotent — race condition riski giderildi.

## Canlıya Dağıtım Durumu (Kritik)
> [!IMPORTANT]
> 31 Temmuz 2026 itibarıyla: proje `fpvlovers-v02` reposuna taşındı, GAP raporundaki güvenlik ve trust-hardening düzeltmeleri (auth secret zorunluluğu, crawl-queue idempotency, doğrulanmamış-iddia temizliği, sitemap/cache revalidation) kod tabanına uygulandı. Canlıya deploy öncesi: (1) yeni repoya ilk push yapılmalı, (2) `AUTH_SECRET` production ortam değişkeni olarak Coolify'a eklenmeli, (3) sızıntı riski taşıyan eski SSH key'leri rotate edilmeli.

## graphify

This project has a knowledge graph at graphify-out/ with god nodes, community structure, and cross-file relationships.

Rules:
- For codebase questions, first run `graphify query "<question>"` when graphify-out/graph.json exists. Use `graphify path "<A>" "<B>"` for relationships and `graphify explain "<concept>"` for focused concepts. These return a scoped subgraph, usually much smaller than GRAPH_REPORT.md or raw grep output.
- If graphify-out/wiki/index.md exists, use it for broad navigation instead of raw source browsing.
- Read graphify-out/GRAPH_REPORT.md only for broad architecture review or when query/path/explain do not surface enough context.
- After modifying code, run `graphify update .` to keep the graph current (AST-only, no API cost).
