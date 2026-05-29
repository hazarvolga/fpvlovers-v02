'use client';
// Component duel needs local product selection state and instant comparison output.

import React, { useMemo, useState } from 'react';
import { ArrowUpRight, CheckCircle2, Gauge, ShieldAlert, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { compareComponents } from '@/lib/tools/component-compatibility';
import type { FpvCatalogProduct, FpvProductType, ProductSpecValue } from '@/lib/tools/fpv-product-types';
import { cn } from '@/lib/utils';

type Props = {
  products: FpvCatalogProduct[];
};

const TYPE_OPTIONS: { value: FpvProductType; label: string }[] = [
  { value: 'motor', label: 'Motors' },
  { value: 'frame', label: 'Frames' },
  { value: 'video', label: 'Digital video' },
  { value: 'receiver', label: 'Receivers' },
  { value: 'battery', label: 'Batteries' },
];

function formatSpecValue(value: ProductSpecValue): string {
  if (Array.isArray(value)) return value.join('/');
  return String(value);
}

function ProductCard({ product, winner, score }: { product: FpvCatalogProduct; winner: boolean; score: number }) {
  const specs = Object.entries(product.specs).slice(0, 5);

  return (
    <div className={cn(
      'border bg-[#050505] p-5 transition-colors',
      winner ? 'border-[#00F2FF] shadow-[0_0_30px_rgba(0,242,255,0.12)]' : 'border-white/10',
    )}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-[#00F2FF]">{product.brand}</div>
          <h3 className="mt-1 text-xl font-black uppercase text-white leading-tight">{product.name}</h3>
        </div>
        <div className={cn('border px-2 py-1 text-[10px] font-black uppercase tracking-widest', winner ? 'border-[#00F2FF] text-[#00F2FF]' : 'border-white/10 text-[#8e8b86]')}>
          {winner ? 'winner' : 'score'} {score}
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2">
        <div className="border border-white/10 bg-white/[0.02] p-3">
          <div className="text-[9px] uppercase tracking-widest text-[#8e8b86]">Price</div>
          <div className="font-mono text-sm text-white">${product.price.toFixed(2)}</div>
        </div>
        <div className="border border-white/10 bg-white/[0.02] p-3">
          <div className="text-[9px] uppercase tracking-widest text-[#8e8b86]">Trust</div>
          <div className="font-mono text-sm text-[#00FF66]">{product.trustScore}/100</div>
        </div>
      </div>

      <div className="mt-5 space-y-2">
        {specs.map(([key, value]) => (
          <div key={key} className="flex items-center justify-between gap-3 border-b border-white/10 pb-2 font-mono text-xs">
            <span className="text-[#8e8b86]">{key}</span>
            <span className="text-white">{formatSpecValue(value)}</span>
          </div>
        ))}
      </div>

      <Button asChild variant="cyber" className="mt-5 w-full">
        <a href={product.url} target="_blank" rel="nofollow sponsored noopener noreferrer">
          Check source <ArrowUpRight className="ml-2 h-4 w-4" />
        </a>
      </Button>
    </div>
  );
}

export function ComponentDuelWidget({ products }: Props) {
  const [type, setType] = useState<FpvProductType>('motor');
  const filtered = useMemo(() => products.filter((product) => product.type === type), [products, type]);
  const [productAId, setProductAId] = useState(filtered[0]?.id || products[0]?.id || '');
  const [productBId, setProductBId] = useState(filtered[1]?.id || products[1]?.id || '');

  const availableProducts = filtered.length >= 2 ? filtered : products;
  const productA = availableProducts.find((product) => product.id === productAId) || availableProducts[0];
  const productB = availableProducts.find((product) => product.id === productBId && product.id !== productA?.id) || availableProducts.find((product) => product.id !== productA?.id);
  const result = productA && productB ? compareComponents(productA, productB) : null;

  const setComparisonType = (nextType: FpvProductType) => {
    const nextProducts = products.filter((product) => product.type === nextType);
    setType(nextType);
    setProductAId(nextProducts[0]?.id || products[0]?.id || '');
    setProductBId(nextProducts[1]?.id || products[1]?.id || '');
  };

  if (!productA || !productB || !result) {
    return (
      <div className="border border-yellow-300/30 bg-yellow-300/5 p-5 text-sm text-yellow-100">
        Catalog needs at least two products before Component Duel can run.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="border border-white/10 bg-[#050505] p-5">
        <div className="flex flex-wrap items-center gap-2">
          {TYPE_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => setComparisonType(option.value)}
              className={cn(
                'border px-3 py-2 text-xs font-black uppercase tracking-widest transition-colors',
                type === option.value ? 'border-[#FF5C00] bg-[#FF5C00]/10 text-white' : 'border-white/10 text-[#8e8b86] hover:border-white/25',
              )}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#FF5C00]">Component Alpha</span>
            <select value={productA.id} onChange={(event) => setProductAId(event.target.value)} className="w-full border border-white/10 bg-black px-3 py-3 font-mono text-sm text-white outline-none focus:border-[#FF5C00]">
              {availableProducts.map((product) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </label>
          <label className="space-y-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-[#00F2FF]">Component Beta</span>
            <select value={productB.id} onChange={(event) => setProductBId(event.target.value)} className="w-full border border-white/10 bg-black px-3 py-3 font-mono text-sm text-white outline-none focus:border-[#00F2FF]">
              {availableProducts.filter((product) => product.id !== productA.id).map((product) => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <ProductCard product={productA} winner={result.winnerId === productA.id} score={result.scoreA} />
        <ProductCard product={productB} winner={result.winnerId === productB.id} score={result.scoreB} />
      </div>

      <section className="border border-[#00F2FF]/25 bg-[#00F2FF]/5 p-5">
        <div className="flex items-start gap-3">
          <Trophy className="mt-1 h-5 w-5 text-[#00F2FF]" />
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-white">Verdict</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#d8d5cf]">{result.verdict}</p>
          </div>
        </div>
      </section>

      <section className="border border-white/10 bg-[#050505] p-5">
        <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-white">
          <Gauge className="h-4 w-4 text-[#FF5C00]" /> Telemetry Matrix
        </h3>
        <div className="space-y-2">
          {result.metrics.map((metric) => (
            <div key={metric.label} className="grid grid-cols-[1fr_1.2fr_1.2fr] gap-3 border border-white/10 bg-white/[0.02] p-3 text-xs">
              <span className="font-black uppercase tracking-widest text-[#8e8b86]">{metric.label}</span>
              <span className={metric.winner === 'A' ? 'text-[#00FF66]' : 'text-white'}>{metric.productA}</span>
              <span className={metric.winner === 'B' ? 'text-[#00FF66]' : 'text-white'}>{metric.productB}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-3 md:grid-cols-2">
        {[productA, productB].map((product) => (
          <div key={product.id} className="border border-yellow-300/20 bg-yellow-300/5 p-4 text-xs leading-relaxed text-[#d8d5cf]">
            <div className="mb-2 flex items-center gap-2 text-yellow-200">
              <ShieldAlert className="h-4 w-4" />
              <span className="font-black uppercase tracking-widest">{product.brand} note</span>
            </div>
            {result.warnings[product.id]}
          </div>
        ))}
      </section>

      <div className="flex items-center gap-2 border border-[#00FF66]/20 bg-[#00FF66]/5 p-4 text-xs text-[#d8d5cf]">
        <CheckCircle2 className="h-4 w-4 text-[#00FF66]" />
        Uses the shared FPVLovers catalog seeded from current affiliate/product data. Crawler-backed expansion will replace MVP seed coverage before production positioning.
      </div>
    </div>
  );
}
