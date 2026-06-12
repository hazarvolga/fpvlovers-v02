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

function ProductCard({ product, winner, score, side }: { product: FpvCatalogProduct; winner: boolean; score: number, side: 'left' | 'right' }) {
  const specs = Object.entries(product.specs).slice(0, 5);

  return (
    <div className={cn(
      'relative bg-zinc-950 rounded-xl overflow-hidden p-6 lg:p-10 transition-colors flex flex-col h-full',
      winner 
        ? side === 'left' ? 'border border-[#FF5C00]/40 shadow-2xl' : 'border border-[#00F2FF]/40 shadow-2xl'
        : 'border border-white/5 opacity-80'
    )}>
      {/* Background Accent Lines */}
      <div className="absolute inset-0 pointer-events-none carbon-grid opacity-[0.03]"></div>

      <div className="flex items-start justify-between gap-4 mb-6 z-10">
        <div>
          <div className={cn(
            "text-[11px] font-black uppercase tracking-[0.2em] mb-2",
             side === 'left' ? 'text-[#FF5C00]' : 'text-[#00F2FF]'
          )}>
             {product.brand}
          </div>
          <h3 className="text-2xl lg:text-3xl font-black uppercase text-white leading-tight">{product.name}</h3>
        </div>
        <div className={cn(
          'border px-3 py-1.5 text-[11px] font-black uppercase tracking-[0.2em] backdrop-blur-md',
           winner 
            ? side === 'left' ? 'border-[#FF5C00] bg-[#FF5C00]/10 text-[#FF5C00]' : 'border-[#00F2FF] bg-[#00F2FF]/10 text-[#00F2FF]'
            : 'border-white/10 text-[#A0A0A0] bg-black/40'
        )}>
          {winner ? 'WINNER' : 'SCORE'} <span className="ml-1 text-white">{score}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-8 z-10">
        <div className="border border-white/10 bg-black/40 p-4 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#00FF66]/50"></div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#A0A0A0] mb-1">PRICE</div>
          <div className="font-mono text-xl text-white tracking-tight">${product.price.toFixed(2)}</div>
        </div>
        <div className="border border-white/10 bg-black/40 p-4 relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-1 h-full bg-[#00FF66]/50"></div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-[#A0A0A0] mb-1">TRUST</div>
          <div className="font-mono text-xl text-[#00FF66] tracking-tight">{product.trustScore}<span className="text-sm text-white/40">/100</span></div>
        </div>
      </div>

      <div className="space-y-3 flex-grow z-10">
        {specs.map(([key, value]) => (
          <div key={key} className="flex items-center justify-between gap-4 border-b border-white/5 pb-3">
            <span className="text-[11px] uppercase tracking-widest text-[#A0A0A0]">{key}</span>
            <span className="font-mono text-sm text-white">{formatSpecValue(value)}</span>
          </div>
        ))}
      </div>

      <Button asChild variant="outline" className={cn(
        "mt-8 w-full z-10 font-bold tracking-widest text-xs uppercase border-none text-black",
        side === 'left' ? "bg-[#FF5C00] hover:bg-[#FF5C00]/90" : "bg-[#00F2FF] hover:bg-[#00F2FF]/90"
      )}>
        <a href={product.url} target="_blank" rel="nofollow sponsored noopener noreferrer">
          VIEW SOURCE <ArrowUpRight className="ml-2 h-4 w-4" />
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
      <div className="w-full h-64 bg-zinc-950/50 rounded-2xl border border-white/5 flex flex-col items-center justify-center p-8 text-center backdrop-blur-sm">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-zinc-600 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
        </svg>
        <h3 className="text-xl font-bold text-white mb-2">Insufficient Catalog Data</h3>
        <p className="text-zinc-500 max-w-md">
          The catalog currently needs at least two products of the selected category before the Component Duel engine can run comparison metrics.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-[1200px] mx-auto w-full">
      {/* Type Selector & Settings */}
      <section className="bg-zinc-950 rounded-xl border border-white/5 shadow-2xl p-6 lg:p-8 relative">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-wrap items-center gap-2">
            {TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setComparisonType(option.value)}
                className={cn(
                  'border px-4 py-2 text-[11px] font-black uppercase tracking-widest transition-all',
                  type === option.value 
                    ? 'border-[#FF5C00] bg-[#FF5C00]/10 text-white shadow-[0_0_15px_rgba(255,92,0,0.2)]' 
                    : 'border-white/10 text-[#A0A0A0] hover:border-white/30 hover:text-white',
                )}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-4 border border-white/10 bg-black/40 px-4 py-3 text-xs">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#FF5C00] animate-pulse"></div>
                <span className="text-white font-mono uppercase tracking-wider">Alpha</span>
             </div>
             <span className="text-white/30">VS</span>
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#00F2FF] animate-pulse"></div>
                <span className="text-white font-mono uppercase tracking-wider">Beta</span>
             </div>
          </div>
        </div>

        {/* Component Selectors */}
        <div className="mt-8 grid gap-8 md:grid-cols-2 relative">
          
          <div className="space-y-3 relative z-20">
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[#FF5C00] flex items-center gap-2">
               <span className="w-1 h-3 bg-[#FF5C00] inline-block"></span>
               Component Alpha
            </label>
            <div className="relative group">
              <select 
                value={productA.id} 
                onChange={(event) => setProductAId(event.target.value)} 
                className="w-full appearance-none border border-white/10 bg-black px-4 py-4 font-mono text-sm text-white outline-none focus:border-[#FF5C00] focus:ring-1 focus:ring-[#FF5C00]/50 transition-all cursor-pointer group-hover:border-white/30"
              >
                {availableProducts.map((product) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50 group-hover:text-white transition-colors">
                 ▼
              </div>
            </div>
          </div>

          <div className="hidden md:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 items-center justify-center bg-[#050505] border border-white/10 rounded-full text-xs font-black text-white/40 z-30">
             VS
          </div>

          <div className="space-y-3 relative z-20">
            <label className="text-[11px] font-black uppercase tracking-[0.2em] text-[#00F2FF] flex items-center gap-2">
               <span className="w-1 h-3 bg-[#00F2FF] inline-block"></span>
               Component Beta
            </label>
            <div className="relative group">
              <select 
                value={productB.id} 
                onChange={(event) => setProductBId(event.target.value)} 
                className="w-full appearance-none border border-white/10 bg-black px-4 py-4 font-mono text-sm text-white outline-none focus:border-[#00F2FF] focus:ring-1 focus:ring-[#00F2FF]/50 transition-all cursor-pointer group-hover:border-white/30"
              >
                {availableProducts.filter((product) => product.id !== productA.id).map((product) => (
                  <option key={product.id} value={product.id}>{product.name}</option>
                ))}
              </select>
              <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-white/50 group-hover:text-white transition-colors">
                 ▼
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Duel Cards (Split Screen) */}
      <div className="grid gap-6 lg:gap-8 md:grid-cols-2 relative">
        <ProductCard product={productA} winner={result.winnerId === productA.id} score={result.scoreA} side="left" />
        <ProductCard product={productB} winner={result.winnerId === productB.id} score={result.scoreB} side="right" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Verdict Box */}
        <section className="lg:col-span-5 bg-zinc-950 rounded-xl border border-[#00FF66]/30 p-8 relative overflow-hidden h-full flex flex-col justify-center shadow-2xl">
          <div className="absolute -right-4 -top-4 opacity-5">
             <Trophy className="w-48 h-48" />
          </div>
          <div className="relative z-10 flex flex-col items-start gap-4">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-[#00FF66]/10 border border-[#00FF66]/20">
                <Trophy className="h-6 w-6 text-[#00FF66]" />
              </div>
              <h3 className="text-xl font-black uppercase tracking-widest text-white">System Verdict</h3>
            </div>
            <p className="mt-2 text-base leading-relaxed text-[#d8d5cf]">{result.verdict}</p>
          </div>
        </section>

        {/* Telemetry Matrix */}
        <section className="lg:col-span-7 bg-zinc-950 rounded-xl border border-white/5 shadow-2xl p-6 lg:p-8">
          <h3 className="mb-6 flex items-center gap-3 text-[11px] font-black uppercase tracking-[0.2em] text-[#A0A0A0]">
            <Gauge className="h-4 w-4 text-white" />
            Telemetry Matchup Matrix
          </h3>
          <div className="space-y-3">
            {result.metrics.map((metric) => (
              <div key={metric.label} className="grid grid-cols-[1.5fr_1fr_1fr] gap-4 border-b border-white/5 bg-transparent pb-3 text-xs md:text-sm items-center">
                <span className="font-mono uppercase tracking-widest text-[#A0A0A0]">{metric.label}</span>
                <span className={cn(
                  "font-mono px-3 py-1 text-center bg-black/40 border",
                  metric.winner === 'A' ? 'text-[#00FF66] border-[#00FF66]/30' : 'text-white border-white/10'
                )}>{metric.productA}</span>
                <span className={cn(
                  "font-mono px-3 py-1 text-center bg-black/40 border",
                  metric.winner === 'B' ? 'text-[#00FF66] border-[#00FF66]/30' : 'text-white border-white/10'
                )}>{metric.productB}</span>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="grid gap-6 md:grid-cols-2">
        {[productA, productB].map((product) => (
          <div key={product.id} className="bg-zinc-950 rounded-xl border border-[#FFCC00]/20 p-6 relative overflow-hidden shadow-2xl">
             <div className="absolute top-0 left-0 w-1 h-full bg-[#FFCC00]/50"></div>
            <div className="mb-4 flex items-center gap-3 text-[#FFCC00]">
              <ShieldAlert className="h-5 w-5" />
              <span className="text-[11px] font-black uppercase tracking-[0.2em]">Pilot Note: {product.brand}</span>
            </div>
            <p className="text-sm leading-relaxed text-[#d8d5cf]">{result.warnings[product.id]}</p>
          </div>
        ))}
      </section>

      <div className="flex items-center gap-3 border border-white/10 bg-black/40 p-5 text-xs text-[#A0A0A0] font-mono mt-8">
        <CheckCircle2 className="h-4 w-4 text-[#00FF66] flex-shrink-0" />
        <p>Uses the shared FPVLovers catalog seeded from current affiliate/product data. Crawler-backed expansion will replace MVP seed coverage before production positioning.</p>
      </div>
    </div>
  );
}
