# FAZ 8/8 — Health API & Master Orchestrator Tamamlama
> Implementasyon Spesifikasyonu — Cowork tarafından hazırlandı

## Hedef

Master Orchestrator döngüsünü kapat:
1. `/api/master?action=health` endpoint'ini **zenginleştir** — tüm FAZ'ların durumunu tek çağrıda göster
2. Admin paneline **Orchestrator Status** sekmesi ekle — sistem sağlığı canlı görünsün
3. `tsc --noEmit` + E2E smoke test — tüm action'lar çalışır durumda doğrula

---

## Mevcut `getEcosystemHealth()` Çıktısı

`lib/master-orchestrator.ts`'deki `getEcosystemHealth()` zaten bir şey döndürüyor.
Önce bak: `grep -n "getEcosystemHealth\|ecosystem_health" lib/master-orchestrator.ts`

---

## Kesin Dosya Listesi

```
lib/master-health.ts                    ← NEW  Unified health aggregator
app/api/master/route.ts                 ← UPDATE  health case → master-health kullan
app/admin/page.tsx                      ← UPDATE  yeni "Orchestrator" sekmesi (11. sekme → 12.)
```

> ⚠️ `app/admin/page.tsx` 1000+ satır. SADECE sekme listesine yeni entry ve
> yeni sekmenin render fonksiyonunu ekle — başka hiçbir şeye dokunma.

---

## 1. `lib/master-health.ts`

```typescript
// Master Orchestrator — Unified Health Report
// Tüm katmanları (routing, retrieval, dify, ecosystem) tek raporda toplar.

import { getEcosystemHealth } from './master-orchestrator';
import { getBudgetStatus } from './dify-client';
import { generateEcosystemReport } from './ecosystem-intelligence';

export interface LayerHealth {
  name: string;
  status: 'ok' | 'degraded' | 'down';
  detail?: string;
}

export interface MasterHealthReport {
  generated_at: string;
  overall: 'ok' | 'degraded' | 'down';
  ecosystem_health_score: number;
  layers: LayerHealth[];
  budget: ReturnType<typeof getBudgetStatus>;
  content_gaps: string[];
  weak_routes: string[];
  action_endpoints: string[];
}

export function getMasterHealth(): MasterHealthReport {
  const eco = getEcosystemHealth();
  const budget = getBudgetStatus();
  const report = generateEcosystemReport();

  const score: number = eco.ecosystem_health_score ?? 0;

  const layers: LayerHealth[] = [
    {
      name: 'routing',
      status: (eco.total_routes ?? 0) > 0 ? 'ok' : 'down',
      detail: `${eco.total_routes ?? 0} intent route tanımlı`,
    },
    {
      name: 'retrieval',
      status: (eco.total_datasets ?? 0) > 0 ? 'ok' : 'down',
      detail: `${eco.total_datasets ?? 0} dataset, ${eco.total_documents ?? 0} doküman`,
    },
    {
      name: 'dify_budget',
      status: budget.remaining > 0 ? 'ok' : 'down',
      detail: `${budget.remaining}/${budget.limit} token kaldı (${budget.percentUsed.toFixed(0)}% kullanıldı)`,
    },
    {
      name: 'ecosystem_intelligence',
      status: report.insights.length >= 0 ? 'ok' : 'degraded',
      detail: `${report.insights.length} insight, score: ${score}`,
    },
  ];

  const degraded = layers.some(l => l.status === 'degraded');
  const down = layers.some(l => l.status === 'down');
  const overall: 'ok' | 'degraded' | 'down' = down ? 'down' : degraded ? 'degraded' : 'ok';

  return {
    generated_at: new Date().toISOString(),
    overall,
    ecosystem_health_score: score,
    layers,
    budget,
    content_gaps: report.content_gaps,
    weak_routes: report.weak_routes,
    action_endpoints: ['route', 'retrieval', 'compose', 'intelligence', 'health', 'routes', 'datasets'],
  };
}
```

---

## 2. `app/api/master/route.ts` — Güncelleme

Import ekle:
```typescript
import { getMasterHealth } from '@/lib/master-health';
```

`health` case'ini güncelle:
```typescript
// ESKİ:
case 'health':
  return NextResponse.json(getEcosystemHealth());

// YENİ:
case 'health':
  return NextResponse.json(getMasterHealth());
```

`getEcosystemHealth` import'u hâlâ başka yerlerde kullanılıyorsa bırak,
sadece bu case'deki çağrıyı değiştir.

---

## 3. `app/admin/page.tsx` — Orchestrator Sekmesi

### a) Sekme listesine ekle (mevcut sekme array'inin sonuna):
```typescript
{ id: 'orchestrator', label: 'Orchestrator' },
```

### b) Switch/if bloğuna yeni render fonksiyonu ekle:
```typescript
{activeTab === 'orchestrator' && <OrchestratorTab />}
```

### c) Aynı dosyada (page.tsx içinde, diğer tab component'lerinin yanına) yeni component:
```typescript
function OrchestratorTab() {
  const [health, setHealth] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const r = await fetch('/api/master?action=health');
      setHealth(await r.json());
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => { fetchHealth(); }, []);

  if (loading || !health) return <div className="p-4 text-gray-400">Yükleniyor…</div>;

  const statusColor = (s: string) =>
    s === 'ok' ? 'text-green-400' : s === 'degraded' ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white">Master Orchestrator</h2>
        <span className={`text-sm font-medium ${statusColor(health.overall)}`}>
          {health.overall.toUpperCase()} — Score: {health.ecosystem_health_score}
        </span>
      </div>

      {/* Layers */}
      <div className="grid gap-2">
        {health.layers?.map((l: any) => (
          <div key={l.name} className="flex items-center justify-between rounded bg-gray-800 px-3 py-2">
            <span className="text-sm text-gray-300 font-mono">{l.name}</span>
            <div className="text-right">
              <span className={`text-xs font-medium ${statusColor(l.status)}`}>{l.status}</span>
              {l.detail && <p className="text-xs text-gray-500">{l.detail}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Content Gaps */}
      {health.content_gaps?.length > 0 && (
        <div className="rounded bg-yellow-900/20 border border-yellow-700/30 p-3">
          <p className="text-xs text-yellow-400 font-medium mb-1">İçerik Eksikleri</p>
          {health.content_gaps.map((g: string) => (
            <p key={g} className="text-xs text-gray-400">• {g}</p>
          ))}
        </div>
      )}

      {/* Endpoints */}
      <div className="rounded bg-gray-800/50 p-3">
        <p className="text-xs text-gray-500 mb-1">Aktif Endpoint'ler</p>
        <div className="flex flex-wrap gap-1">
          {health.action_endpoints?.map((ep: string) => (
            <span key={ep} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded">
              ?action={ep}
            </span>
          ))}
        </div>
      </div>

      <button
        onClick={fetchHealth}
        className="text-xs text-gray-500 hover:text-gray-300 underline"
      >
        Yenile
      </button>
    </div>
  );
}
```

---

## 4. E2E Smoke Test

Commit'ten sonra çalıştır:
```bash
curl -s "http://localhost:3000/api/master?action=health" | jq '.overall, .layers[].name'
curl -s "http://localhost:3000/api/master?action=intelligence" | jq '.health_score, (.content_gaps | length)'
curl -s "http://localhost:3000/api/master?action=compose&q=betaflight+pid" | jq '.layout, (.blocks | length)'
```

Her endpoint 200 dönmeli. `compose`'da `blocks` ≥ 2 olmalı.

---

## Acceptance Criteria

- [ ] `lib/master-health.ts` oluşturuldu — `getMasterHealth()` export ediliyor
- [ ] `GET /api/master?action=health` → `{ overall, layers[], budget, content_gaps[], action_endpoints[] }` dönüyor
- [ ] Admin panelde "Orchestrator" sekmesi görünüyor ve health verisi yükleniyor
- [ ] `tsc --noEmit` hatasız
- [ ] Mevcut tüm action'lar (route, retrieval, compose, intelligence, datasets, routes) bozulmamış

## Kritik Uyarılar

1. `app/admin/page.tsx` çok büyük — SADECE sekme array'i + render satırı + `OrchestratorTab` fonksiyonu ekle
2. `getBudgetStatus()` `lib/dify-client.ts`'den, `getEcosystemHealth()` `lib/master-orchestrator.ts`'den — doğru import'ları kullan
3. `generateEcosystemReport()` sync fonksiyon — await YOK
4. Bu FAZ tüm sistemi tamamlıyor — commit mesajı: `feat: Master Orchestrator FAZ 8/8 — Health API & Orchestrator Dashboard`
