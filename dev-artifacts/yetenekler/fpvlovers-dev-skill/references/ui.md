# UI/UX & Frontend Referansı

## Design System

```
Tema:       Endüstriyel / Modern Dark
Framework:  Tailwind CSS 4.1.11
Animasyon:  Motion (Framer Motion)
Grafikler:  Recharts
Component:  components/ui/ (shared)
```

## Renk Paleti

```css
/* Mevcut FPVLovers cockpit dili */
--bg-primary:   #050505
--bg-secondary: #0A0A0B
--border:       #333333

--text-primary:   #ffffff
--text-secondary: #A0A0A0
--text-muted:     #606060

--accent-cyan:    #00F2FF
--accent-orange:  #FF5C00
--accent-green:   #00FF66

/* Durum renkleri */
--success: #00FF66
--warning: #facc15
--error:   #ef4444
```

## Tailwind Kullanım Kuralları

```tsx
// ✅ Doğru — mevcut cockpit diliyle uyumlu
<div className="bg-[#050505] text-white">
<button className="bg-[#FF5C00] hover:bg-[#ff7a3d] text-white">
<input className="bg-[#0A0A0B] border border-[#333333] text-white">

// ❌ Yanlış — tek hue ile bütün sayfayı mor/slate/orange yapmak
<section className="bg-purple-950 text-purple-100">
```

## Component Mimarisi

```
src/components/
├── ui/                  ← Shared primitive'ler (Button, Card, Input, Badge…)
│   ├── Button.tsx
│   ├── Card.tsx
│   └── ...
├── admin/               ← Admin panel component'ları
├── blog/                ← Blog/içerik component'ları
src/features/
└── [feature]/           ← Feature-specific component'lar
```

**Altın kural:** Shared primitive için önce `src/components/ui/`; feature UI için `src/features/[domain]/components/`.

## Component Şablonu

```tsx
// src/components/ui/StatusBadge.tsx
import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: 'success' | 'warning' | 'error' | 'info'
  children: ReactNode
  className?: string
}

const statusStyles = {
  success: 'bg-green-500/20 text-green-400 border-green-500/30',
  warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  error:   'bg-red-500/20 text-red-400 border-red-500/30',
  info:    'bg-blue-500/20 text-blue-400 border-blue-500/30',
}

export function StatusBadge({ status, children, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2 py-1 rounded text-xs font-medium border',
      statusStyles[status],
      className
    )}>
      {children}
    </span>
  )
}
```

## src/app/admin/page.tsx — Aktif Sekmeler

```
Intelligence: RAG Hub, URL Ingestion, Content Gen, Jobs, Published, Logs, Retrieval Test, Raw Browser
Monetization: Affiliates, Sponsors, Orchestrator
System: Health, Pilot Registry, Tool Telemetry
```

**Değişiklik yaparken:** Sadece ilgili sekmenin JSX bloğunu değiştir. Diğer sekmelere dokunma.

```tsx
// Sekmeyi bulmanın yolu — activeTab string'ine göre ara
{activeTab === 'health' && (
  <div>
    {/* SADECE BURADA DEĞİŞİKLİK YAP */}
  </div>
)}
```

## Recharts Kullanımı (Analytics)

```tsx
'use client'  // Recharts client-side
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

// Tema renkleriyle uyumlu stil
const CHART_COLORS = {
  primary: '#ef4444',   // red-500
  secondary: '#3b82f6', // blue-500
  tertiary: '#22c55e',  // green-500
  grid: '#374151',      // gray-700
  text: '#9ca3af',      // gray-400
}

function MetricChart({ data }: { data: MetricData[] }) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={CHART_COLORS.grid} />
        <XAxis dataKey="date" stroke={CHART_COLORS.text} tick={{ fill: CHART_COLORS.text }} />
        <YAxis stroke={CHART_COLORS.text} tick={{ fill: CHART_COLORS.text }} />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1f2937',
            border: '1px solid #374151',
            color: '#f9fafb',
          }}
        />
        <Line type="monotone" dataKey="value" stroke={CHART_COLORS.primary} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

## Motion (Animasyon)

```tsx
import { motion } from 'motion/react'

// Fade-in (en yaygın)
<motion.div
  initial={{ opacity: 0, y: 8 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.2, ease: 'easeOut' }}
>

// Hover efekti
<motion.button
  whileHover={{ scale: 1.02 }}
  whileTap={{ scale: 0.98 }}
  transition={{ type: 'spring', stiffness: 400, damping: 17 }}
>

// prefers-reduced-motion — zorunlu
// Motion kütüphanesi bunu otomatik handle eder
```

## Loading & Empty States (Her Component'ta Zorunlu)

```tsx
// Her data-driven component 3 state içermeli
function DataTable() {
  if (isLoading) return <TableSkeleton rows={5} />
  if (error) return <ErrorState message={error.message} onRetry={refetch} />
  if (data.length === 0) return <EmptyState message="Henüz veri yok" />
  return <Table data={data} />
}

// Skeleton şablonu
function TableSkeleton({ rows }: { rows: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-12 bg-gray-800 rounded animate-pulse" />
      ))}
    </div>
  )
}
```

## Responsive Breakpoints

```
sm:  640px  — mobil/tablet geçişi
md:  768px  — tablet
lg:  1024px — laptop
xl:  1280px — desktop (admin panel hedef)

Admin panel: lg: ve üzeri optimize (1280px+)
Blog sayfaları: sm: den itibaren tam responsive
```

## Performance Kuralları

```tsx
// next/image — zorunlu (img yasak)
import Image from 'next/image'
<Image src="/hero.webp" alt="FPV" width={1200} height={630} priority />

// Lazy loading (fold altı)
<Image src="/card.webp" alt="..." width={400} height={300} loading="lazy" />

// Büyük component'ları lazy import et
const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <ChartSkeleton />,
  ssr: false,  // client-only grafik
})
```
