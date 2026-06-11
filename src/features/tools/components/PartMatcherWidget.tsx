'use client';
// Part matcher needs local selection state and deterministic compatibility checks.

import React, { useMemo, useState } from 'react';
import { Activity, Battery, CheckCircle2, Cpu, Radio, ShieldAlert, Video, Wind, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { analyzeBuildCompatibility } from '@/lib/tools/component-compatibility';
import type { BuildSelection, BuildSlot, FpvCatalogProduct, FpvProductType } from '@/lib/tools/fpv-product-types';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { AffiliateCard } from '@/features/monetization/components/AffiliateCard';

type Props = {
  products: FpvCatalogProduct[];
};

type SlotConfig = {
  slot: BuildSlot;
  label: string;
  type: FpvProductType | FpvProductType[];
  icon: React.ComponentType<{ className?: string }>;
  required?: boolean;
};

type PartMatcherApiResponse = {
  success: boolean;
  source?: 'dify' | 'local';
  markdown?: string;
  warning?: string;
  error?: string;
};

const SLOT_CONFIG: SlotConfig[] = [
  { slot: 'frame', label: 'Frame', type: 'frame', icon: Activity, required: true },
  { slot: 'motor', label: 'Motor', type: 'motor', icon: Zap, required: true },
  { slot: 'prop', label: 'Propeller', type: 'prop', icon: Wind, required: true },
  { slot: 'stack', label: 'FC/ESC Stack', type: 'stack', icon: Cpu, required: true },
  { slot: 'battery', label: 'Battery', type: 'battery', icon: Battery, required: true },
  { slot: 'video', label: 'Video System', type: ['video', 'camera', 'vtx'], icon: Video },
  { slot: 'receiver', label: 'Receiver', type: 'receiver', icon: Radio },
];

const DEFAULT_SELECTION: BuildSelection = {
  style: 'freestyle',
};

function optionMatches(product: FpvCatalogProduct, type: FpvProductType | FpvProductType[]): boolean {
  return Array.isArray(type) ? type.includes(product.type) : product.type === type;
}

export function PartMatcherWidget({ products }: Props) {
  const [selection, setSelection] = useState<BuildSelection>(DEFAULT_SELECTION);
  const [review, setReview] = useState<PartMatcherApiResponse | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const result = useMemo(() => analyzeBuildCompatibility(selection, products), [selection, products]);
  const requiredComplete = SLOT_CONFIG.filter((slot) => slot.required).every((slot) => Boolean(selection[slot.slot]));
  const hasStarted = SLOT_CONFIG.some((slot) => Boolean(selection[slot.slot]));

  const setSlot = (slot: BuildSlot, value: string) => {
    setSelection((current) => ({ ...current, [slot]: value || undefined }));
    setReview(null);
    setReviewError(null);
  };

  const setStyle = (style: BuildSelection['style']) => {
    setSelection((current) => ({ ...current, style }));
    setReview(null);
    setReviewError(null);
  };

  const fillDemo = () => {
    const find = (slot: SlotConfig) => products.find((product) => optionMatches(product, slot.type));
    setSelection({
      style: 'freestyle',
      frame: find(SLOT_CONFIG[0])?.id,
      motor: find(SLOT_CONFIG[1])?.id,
      prop: find(SLOT_CONFIG[2])?.id,
      stack: find(SLOT_CONFIG[3])?.id,
      battery: find(SLOT_CONFIG[4])?.id,
      video: find(SLOT_CONFIG[5])?.id,
      receiver: find(SLOT_CONFIG[6])?.id,
    });
    setReview(null);
    setReviewError(null);
  };

  const runGuidedReview = async () => {
    if (!requiredComplete) return;

    setReviewLoading(true);
    setReviewError(null);
    setReview(null);

    try {
      const response = await fetch('/api/tools/part-matcher', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(selection),
      });
      const data = await response.json() as PartMatcherApiResponse;
      if (!response.ok || !data.success || !data.markdown) {
        throw new Error(data.error || 'Part Matcher review failed.');
      }
      setReview(data);
      if (data.warning) setReviewError(data.warning);
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : 'Part Matcher review failed.');
    } finally {
      setReviewLoading(false);
    }
  };

  const verdictTone = result.verdict === 'ready'
    ? 'border-[#00FF66]/40 text-[#00FF66]'
    : result.verdict === 'caution'
      ? 'border-yellow-300/40 text-yellow-300'
      : 'border-red-400/40 text-red-400';

  return (
    <div className="flex w-full flex-col gap-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">Compatibility Matrix v2.1</h3>
          <p className="mt-1 text-xs text-zinc-400">Catalog-backed checks. Live catalog expansion is in progress; guided review stays behind the server gateway.</p>
        </div>
        <button
          onClick={fillDemo}
          className="self-start border-b border-[#00F2FF]/20 text-[10px] font-bold uppercase tracking-widest text-[#00F2FF]/60 transition-colors hover:text-[#00F2FF]"
        >
          [LOAD_CATALOG_BUILD]
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="part-matcher-style" className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#00F2FF]/70">
            <SendIcon /> Target Style
          </label>
          <select
            id="part-matcher-style"
            value={selection.style}
            onChange={(event) => setStyle(event.target.value as BuildSelection['style'])}
            className="w-full border border-white/10 bg-zinc-950 px-4 py-4 font-mono text-sm text-white outline-none transition-all focus:border-[#00F2FF] rounded-lg"
          >
            <option value="freestyle">Freestyle</option>
            <option value="racing">Racing</option>
            <option value="cinematic">Cinematic</option>
            <option value="longRange">Long Range</option>
            <option value="whoop">Whoop</option>
          </select>
        </div>

        {SLOT_CONFIG.map((slot) => {
          const options = products.filter((product) => optionMatches(product, slot.type));
          const Icon = slot.icon;
          const inputId = `part-matcher-${slot.slot}`;
          return (
            <div key={slot.slot} className="space-y-2">
              <label htmlFor={inputId} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#00F2FF]/70">
                <Icon aria-hidden="true" className="h-3 w-3" /> {slot.label}{slot.required ? ' *' : ''}
              </label>
              <select
                id={inputId}
                value={selection[slot.slot] || ''}
                onChange={(event) => setSlot(slot.slot, event.target.value)}
                className="w-full border border-white/10 bg-zinc-950 px-4 py-4 font-mono text-sm text-white outline-none transition-all focus:border-[#00F2FF] rounded-lg"
              >
                <option value="">Select {slot.label}</option>
                {!options.length && (
                  <option value="" disabled>
                    No catalog entries yet
                  </option>
                )}
                {options.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - ${product.price.toFixed(2)}
                  </option>
                ))}
              </select>
              {selection[slot.slot] && (() => {
                 const selectedProduct = options.find(p => p.id === selection[slot.slot])!;
                 return (
                 <div className="mt-3">
                    <AffiliateCard 
                       title={selectedProduct.name}
                       description={`${selectedProduct.brand} ${selectedProduct.category}`}
                       price={`$${selectedProduct.price.toFixed(2)}`}
                       url={selectedProduct.url || '#'}
                       image={selectedProduct.imageUrl || '/images/placeholders/part-placeholder.jpg'}
                    />
                 </div>
                 );
              })()}
            </div>
          );
        })}
      </div>

      <section className="border border-white/5 bg-zinc-950 rounded-xl shadow-2xl p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-zinc-100">Diagnostic Output</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">
              {hasStarted ? result.summary : 'Select components to begin compatibility checks.'}
            </p>
          </div>
          {hasStarted ? (
            <div className={cn('border px-3 py-2 text-xs font-black uppercase tracking-widest', verdictTone)}>
              {result.verdict} / {result.score}
            </div>
          ) : (
            <div className="border border-white/10 px-3 py-2 text-xs font-bold uppercase tracking-widest text-zinc-500">
              standby
            </div>
          )}
        </div>

        {result.calculator && (
          <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            <Metric label="AUW" value={`${result.calculator.auw}g`} />
            <Metric label="Thrust ratio" value={`${result.calculator.estimatedThrustRatio}:1`} tone="cyan" />
            <Metric label="Hover" value={`${result.calculator.estimatedHoverThrottle}%`} />
            <Metric label="Flight time" value={`${result.calculator.estimatedFlightTimeMin}m`} tone="green" />
          </div>
        )}

        <div className="mt-6 space-y-3">
          {hasStarted && result.checks.map((check) => (
            <div key={check.label} className={cn(
              'flex items-start gap-3 border p-4 text-sm',
              check.status === 'pass' ? 'border-[#00FF66]/20 bg-[#00FF66]/5' : check.status === 'warn' ? 'border-yellow-300/20 bg-yellow-300/5' : 'border-red-400/20 bg-red-400/5',
            )}>
              {check.status === 'pass' ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#00FF66]" /> : <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-yellow-300" />}
              <div>
                <div className="font-black uppercase tracking-widest text-white">{check.label}</div>
                <div className="mt-1 text-[#d8d5cf]">{check.detail}</div>
              </div>
            </div>
          ))}
        </div>

        {result.calculator?.warnings.length ? (
          <div className="mt-5 border border-yellow-300/20 bg-yellow-300/5 p-4">
            <div className="mb-2 text-xs font-black uppercase tracking-widest text-yellow-200">Calculator warnings</div>
            <ul className="space-y-2 text-sm text-[#d8d5cf]">
              {result.calculator.warnings.map((warning) => (
                <li key={warning}>- {warning}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </section>

      <section className="border border-white/5 bg-zinc-950 rounded-xl shadow-2xl p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-zinc-100">Compatibility Review</h2>
            <p className="mt-2 text-sm leading-relaxed text-zinc-400">Deterministic checks return instantly; the review gateway adds source-backed buying and risk guidance when it responds in time.</p>
          </div>
          {review?.source && (
            <span className={cn(
              'self-start border px-3 py-2 text-xs font-black uppercase tracking-widest',
              review.source === 'dify' ? 'border-[#00F2FF]/40 text-[#00F2FF]' : 'border-yellow-300/40 text-yellow-300',
            )}>
              {review.source}
            </span>
          )}
        </div>

        <Button variant="outline" className="mt-6 h-14 w-full uppercase tracking-widest font-bold bg-[#FF5C00] text-black border-none hover:bg-[#FF5C00]/90" onClick={runGuidedReview} disabled={reviewLoading || !requiredComplete}>
          {reviewLoading ? 'Running Compatibility Review...' : requiredComplete ? 'Run Compatibility Review' : 'Complete Required Parts'}
        </Button>

        {reviewError && (
          <div className="mt-5 border border-yellow-300/20 bg-yellow-300/5 p-4 text-sm leading-relaxed text-yellow-100">
            {reviewError}
          </div>
        )}

        {review?.markdown && (
          <div className="prose prose-invert prose-sm mt-6 max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-widest prose-headings:text-white prose-p:text-[#d8d5cf] prose-li:text-[#d8d5cf]">
            <ReactMarkdown>{review.markdown}</ReactMarkdown>
          </div>
        )}
      </section>
    </div>
  );
}

function SendIcon() {
  return <Activity aria-hidden="true" className="h-3 w-3" />;
}

function Metric({ label, value, tone = 'white' }: { label: string; value: string; tone?: 'white' | 'cyan' | 'green' }) {
  const color = tone === 'cyan' ? 'text-[#00F2FF]' : tone === 'green' ? 'text-[#00FF66]' : 'text-white';
  return (
    <div className="border border-white/10 bg-white/[0.02] p-4">
      <div className="text-[9px] uppercase tracking-widest text-[#8e8b86]">{label}</div>
      <div className={cn('mt-1 text-xl font-black', color)}>{value}</div>
    </div>
  );
}
