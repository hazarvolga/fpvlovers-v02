# FPVLovers OpenCode Agent — Coordination Protocol

Sen FPVLovers projesinin implementasyon ajanısın. Cowork (Claude Cowork) ile
bir MCP coordination server üzerinden çalışıyoruz.

## MCP Server: fpvlovers-coord

Bu MCP sana şu araçları sağlar:

- `get_pending_tasks`  → Cowork'ün sana atadığı görevleri çek
- `complete_task`      → Bir görevi tamamladığında rapor et
- `get_analysis`       → Cowork'ün yazdığı analiz/context belgelerini oku
- `write_analysis`     → Tamamladığın işin sonuçlarını Cowork için yaz
- `list_analyses`      → Mevcut tüm analiz belgelerini listele
- `list_tasks`         → Tüm görevlerin durumunu gör
- `create_task`        → (isteğe bağlı) Sen de Cowork'e görev yazabilirsin

---

## Çalışma Akışı

1. **Oturum başında:** `get_pending_tasks` çalıştır — varsa görevleri al
2. **Her görev için:**
   - Görevi oku
   - Eğer `context` alanında bir analiz adı varsa `get_analysis` ile oku
   - `gitnexus_impact "<etkilenen fonksiyon>" upstream` ile etki analizi yap
   - Kodu yaz / dosyaları düzenle
   - `tsc --noEmit` veya mümkünse testleri çalıştır
3. **Görev bitince:** `complete_task` ile sonucu raporla
4. **Önemli bulgu/sorun varsa:** `write_analysis` ile Cowork için belgele
5. **Sonraki görev:** `get_pending_tasks` tekrar çalıştır

---

## Proje Kuralları (FPVLovers — zorunlu)

- **TypeScript strict** — `any` kullanma, tip güvenli yaz
- **Import alias:** `@/lib/...`, `@/components/...` (asla relative `../../`)
- **Yeni API route** → `app/api/admin/` altına, mevcut pattern'e bak
- **Agent eklerken** → `lib/agents/index.ts` registry'sine kaydet
- **`app/admin/page.tsx`** 1026 satır — sadece ilgili sekmeyi hedef al, tümünü değiştirme
- **`data/*.json` şeması** → `monetizationOrchestrator.ts` referans alır, şemayı koru
- **Büyük değişiklik öncesi:** `gitnexus_impact "<fonksiyon>" upstream` çalıştır

---

## Görev Önceliği

`critical` → `high` → `normal` → `low`

Önce critical/high görevleri tamamla.

---

## complete_task Sonuç Formatı

```
✅ Yapılan: <ne yapıldı, 1-2 cümle>
📁 Dosyalar: <oluşturulan/düzenlenen dosya listesi>
🧪 Test: <tsc/jest/manuel sonucu>
⚠️ Notlar: <açık kalem, debt, Cowork'ün onaylaması gereken karar varsa>
```

---

## Kritik Dosya Haritası

```
lib/orchestrator/           ← Phase 1/8 yeni modül (henüz yok, oluşturulacak)
lib/agents/index.ts         ← 6 agent registry + dispatch
lib/monetizationOrchestrator.ts  ← 11 fonksiyon, monetization mantığı
lib/dify-client.ts          ← Rate-limit throttle (1.5s, 15/dk, 500tok/gün)
lib/crawl-queue.ts          ← Job queue, batch 3, retry
app/admin/page.tsx          ← 1026 satır, 11 sekme
app/api/admin/              ← 16 endpoint
data/*.json                 ← 8 JSON veri dosyası
dify_workflows/*.yml        ← 8 DSL (import'a hazır, API'den henüz çağrılmıyor)
```

---

## Altyapı Referansı

| Sunucu | IP | Rol |
|--------|-----|-----|
| A | 80.225.231.62 | Dify v1.14.0, PostgreSQL, Redis, Qdrant |
| B | 161.118.171.201 | Crawl4AI primary (:3002/crawl) |
| C | 141.148.206.187 | Crawl4AI backup (/c4ai/crawl) |

**Dify base:** https://dify.affexai.tr/v1  
**Dataset API:** `dataset-57xGhkCvaQKR2YoSljA94NVu`

### 9 Dataset UUID'leri:
- `fpv-flight-tuning` → `d1d5e44b-...` (11 dok)
- `fpv-pid-profiles` → `8f2a1c9e-...`
- `fpv-troubleshooting` → `3b7d4f8a-...`
- `fpv-components-specs` → `a5c2e1f3-...` (BOŞ)
- `fpv-build-guides` → `6e9b0d7c-...` (BOŞ)
- `fpv-news-reviews` → `2d4f6a8b-...` (1 dok)
- `fpv-racing-events` → `9c1e3b5d-...` (BOŞ)
- `fpv-community-knowledge` → `4a7f2c0e-...` (3 dok)
- `fpv-regulations` → `1b8e5d3a-...` (5+ dok) ⚠️ threshold 0.70

### 5 Dify App Token'ları:
- Expert: `app-C7zocan03yFGIbGtJCQG0iUs`
- Build: `app-JH8Fu38ezY8sUyhHb8ykHIWq`
- Part: `app-fHeOtuCMfHNujevKEXaTEDJn`
- Blackbox: `app-4mCgiWoe3bYOxNYQbspqNhyh`
- Community: `app-1Oil9DvSgUHj9Yf8eEtTuShF`

---

## Dikkat: Dify Sandbox Kısıtı

Dify'ın Code node'larının içinden Dify API'ye çağrı **yapılamaz** (403 Forbidden).
Orchestration mantığı Next.js server-side'da (`lib/orchestrator/`) olmalı.

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
