'use client';
// Interactive FPV build calculator needs local input state and instant derived outputs.

import React, { useMemo, useState } from 'react';
import { Activity, AlertTriangle, Battery, Gauge, RotateCcw, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateBuild, type BuildCalculatorInput, type BuildStyle } from '@/lib/tools/build-calculator';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';

const STYLE_OPTIONS: { value: BuildStyle; label: string; hint: string }[] = [
  { value: 'freestyle', label: 'Freestyle', hint: '5:1 target' },
  { value: 'racing', label: 'Racing', hint: '8:1 target' },
  { value: 'cinematic', label: 'Cinematic', hint: '3.5:1 target' },
  { value: 'longRange', label: 'Long Range', hint: '3:1 target' },
  { value: 'whoop', label: 'Whoop', hint: '3.2:1 target' },
];

const DEFAULT_BUILD: BuildCalculatorInput = {
  style: 'freestyle',
  frameWeight: 130,
  motorWeight: 32,
  stackWeight: 28,
  videoWeight: 36,
  propWeight: 18,
  batteryWeight: 190,
  payloadWeight: 0,
  cellCount: 6,
  batteryCapacityMah: 1100,
  batteryCRating: 100,
  motorKv: 1900,
  propDiameter: 5,
  propPitch: 3.6,
  escAmpRating: 45,
};

type NumberField = {
  key: keyof Omit<BuildCalculatorInput, 'style'>;
  label: string;
  suffix: string;
  min: number;
  max: number;
  step?: number;
};

type BuildWizardApiResponse = {
  success: boolean;
  source?: 'dify' | 'local';
  markdown?: string;
  warning?: string;
  error?: string;
};

const WEIGHT_FIELDS: NumberField[] = [
  { key: 'frameWeight', label: 'Frame', suffix: 'g', min: 15, max: 400 },
  { key: 'motorWeight', label: 'Motor each', suffix: 'g', min: 3, max: 80 },
  { key: 'stackWeight', label: 'Stack', suffix: 'g', min: 5, max: 120 },
  { key: 'videoWeight', label: 'Camera/VTX', suffix: 'g', min: 3, max: 120 },
  { key: 'propWeight', label: 'Props total', suffix: 'g', min: 2, max: 80 },
  { key: 'payloadWeight', label: 'Payload', suffix: 'g', min: 0, max: 800 },
];

const POWER_FIELDS: NumberField[] = [
  { key: 'cellCount', label: 'Battery cells', suffix: 'S', min: 2, max: 8 },
  { key: 'batteryCapacityMah', label: 'Capacity', suffix: 'mAh', min: 300, max: 8000, step: 50 },
  { key: 'batteryWeight', label: 'Battery weight', suffix: 'g', min: 18, max: 900 },
  { key: 'batteryCRating', label: 'C rating', suffix: 'C', min: 30, max: 180 },
  { key: 'motorKv', label: 'Motor KV', suffix: 'KV', min: 800, max: 6000, step: 25 },
  { key: 'escAmpRating', label: 'ESC rating', suffix: 'A', min: 12, max: 80 },
  { key: 'propDiameter', label: 'Prop diameter', suffix: '"', min: 1.6, max: 8, step: 0.1 },
  { key: 'propPitch', label: 'Prop pitch', suffix: '"', min: 1, max: 6, step: 0.1 },
];

function NumberInput({
  field,
  value,
  onChange,
}: {
  field: NumberField;
  value: number;
  onChange: (key: NumberField['key'], value: number) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="flex items-center justify-between gap-3 text-[10px] font-black uppercase tracking-widest text-[#9eeef2]">
        <span>{field.label}</span>
        <span className="text-[#d8d5cf]">{value}{field.suffix}</span>
      </span>
      <input
        type="number"
        min={field.min}
        max={field.max}
        step={field.step || 1}
        value={value}
        onChange={(event) => onChange(field.key, Number(event.target.value))}
        className="w-full bg-[#080808] border border-white/10 px-3 py-2.5 font-mono text-sm text-white outline-none transition-colors focus:border-[#28d7df]"
      />
    </label>
  );
}

function Metric({
  label,
  value,
  tone = 'cyan',
}: {
  label: string;
  value: string;
  tone?: 'cyan' | 'orange' | 'green' | 'white';
}) {
  const color = {
    cyan: 'text-[#28d7df]',
    orange: 'text-[#ff5a1f]',
    green: 'text-[#00FF66]',
    white: 'text-white',
  }[tone];

  return (
    <div className="border border-white/10 bg-black/35 p-4">
      <div className="text-[10px] uppercase tracking-widest text-[#8e8b86] font-mono mb-2">{label}</div>
      <div className={cn('text-2xl font-black tracking-tight', color)}>{value}</div>
    </div>
  );
}

export function BuildCalculatorWidget() {
  const [build, setBuild] = useState<BuildCalculatorInput>(DEFAULT_BUILD);
  const [copied, setCopied] = useState(false);
  const [review, setReview] = useState<BuildWizardApiResponse | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const result = useMemo(() => calculateBuild(build), [build]);

  const setNumber = (key: NumberField['key'], value: number) => {
    setBuild((current) => ({ ...current, [key]: value }));
  };

  const copySnapshot = async () => {
    const payload = {
      build,
      result,
      generatedAt: new Date().toISOString(),
    };

    await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const runBuildReview = async () => {
    setReviewLoading(true);
    setReviewError(null);
    setReview(null);

    try {
      const response = await fetch('/api/tools/build-wizard', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(build),
      });
      const data = await response.json() as BuildWizardApiResponse;
      if (!response.ok || !data.success || !data.markdown) {
        throw new Error(data.error || 'Build Wizard review failed.');
      }
      setReview(data);
      if (data.warning) setReviewError(data.warning);
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : 'Build Wizard review failed.');
    } finally {
      setReviewLoading(false);
    }
  };

  const verdictTone = result.verdict === 'balanced'
    ? 'border-[#00FF66]/35 text-[#00FF66]'
    : result.verdict === 'caution'
      ? 'border-yellow-300/35 text-yellow-300'
      : 'border-red-400/35 text-red-400';

  return (
    <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
      <div className="space-y-6">
        <section className="border border-white/10 bg-[#050505] p-5">
          <div className="flex items-center justify-between gap-4 mb-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-white">Flight Profile</h2>
              <p className="text-xs text-[#8e8b86] mt-1">Choose the thrust target before sizing the build.</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setBuild(DEFAULT_BUILD)} title="Reset calculator">
              <RotateCcw className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2">
            {STYLE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setBuild((current) => ({ ...current, style: option.value }))}
                className={cn(
                  'border px-3 py-3 text-left transition-colors',
                  build.style === option.value
                    ? 'border-[#28d7df] bg-[#28d7df]/10 text-white'
                    : 'border-white/10 bg-white/[0.02] text-[#8e8b86] hover:border-white/25',
                )}
              >
                <span className="block text-xs font-black uppercase tracking-wide">{option.label}</span>
                <span className="block text-[10px] font-mono mt-1">{option.hint}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="border border-white/10 bg-[#050505] p-5">
          <h2 className="text-sm font-black uppercase tracking-widest text-white mb-4 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#28d7df]" /> Weight Stack
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {WEIGHT_FIELDS.map((field) => (
              <NumberInput key={field.key} field={field} value={Number(build[field.key])} onChange={setNumber} />
            ))}
          </div>
        </section>

        <section className="border border-white/10 bg-[#050505] p-5">
          <h2 className="text-sm font-black uppercase tracking-widest text-white mb-4 flex items-center gap-2">
            <Battery className="w-4 h-4 text-[#ff5a1f]" /> Powertrain
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {POWER_FIELDS.map((field) => (
              <NumberInput key={field.key} field={field} value={Number(build[field.key])} onChange={setNumber} />
            ))}
          </div>
        </section>
      </div>

      <aside className="space-y-6">
        <section className="border border-white/10 bg-[#050505] p-5">
          <div className="flex items-start justify-between gap-4 mb-5">
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-white">Diagnostic Output</h2>
              <p className="text-xs text-[#8e8b86] mt-1">Live estimate for a quad build.</p>
            </div>
            <div className={cn('border px-2 py-1 text-[10px] font-black uppercase tracking-widest', verdictTone)}>
              {result.verdict}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Metric label="AUW" value={`${result.auw}g`} tone="white" />
            <Metric label="Dry Weight" value={`${result.dryWeight}g`} />
            <Metric label="Thrust Ratio" value={`${result.estimatedThrustRatio}:1`} tone={result.estimatedThrustRatio >= result.targetThrustRatio ? 'green' : 'orange'} />
            <Metric label="Required" value={`${result.requiredThrustPerMotor}g/m`} tone="orange" />
            <Metric label="Est. Thrust" value={`${result.estimatedThrustPerMotor}g/m`} />
            <Metric label="Hover" value={`${result.estimatedHoverThrottle}%`} tone={result.estimatedHoverThrottle <= 35 ? 'green' : 'orange'} />
            <Metric label="Flight Time" value={`${result.estimatedFlightTimeMin}m`} tone="green" />
            <Metric label="Peak Current" value={`${result.estimatedPeakCurrent}A/m`} tone={result.currentMargin >= 8 ? 'green' : 'orange'} />
          </div>
        </section>

        <section className="border border-white/10 bg-[#050505] p-5">
          <h2 className="text-sm font-black uppercase tracking-widest text-white mb-4 flex items-center gap-2">
            <Gauge className="w-4 h-4 text-[#28d7df]" /> Fit Window
          </h2>
          <div className="space-y-4 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-[#8e8b86]">Voltage</span>
              <span className="text-white">{result.nominalVoltage}V nominal / {result.fullVoltage}V full</span>
            </div>
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-[#8e8b86]">Safe KV Range</span>
              <span className="text-[#28d7df]">{result.safeKvRange.min}-{result.safeKvRange.max}KV</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#8e8b86]">Disc Loading</span>
              <span className="text-white">{result.discLoading} kg/m2</span>
            </div>
          </div>
        </section>

        <section className="border border-white/10 bg-[#050505] p-5">
          <h2 className="text-sm font-black uppercase tracking-widest text-white mb-4 flex items-center gap-2">
            {result.warnings.length ? <AlertTriangle className="w-4 h-4 text-yellow-300" /> : <ShieldCheck className="w-4 h-4 text-[#00FF66]" />}
            Safety Notes
          </h2>
          {result.warnings.length ? (
            <div className="space-y-3">
              {result.warnings.map((warning) => (
                <div key={warning} className="border border-yellow-300/20 bg-yellow-300/5 p-3 text-xs text-[#d8d5cf] leading-relaxed">
                  {warning}
                </div>
              ))}
            </div>
          ) : (
            <div className="border border-[#00FF66]/20 bg-[#00FF66]/5 p-3 text-xs text-[#d8d5cf] leading-relaxed">
              No major fit warnings. Verify manufacturer thrust tables before purchasing parts.
            </div>
          )}
        </section>

        <section className="border border-white/10 bg-[#050505] p-5">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <h2 className="text-sm font-black uppercase tracking-widest text-white">Guided Build Review</h2>
              <p className="text-xs text-[#8e8b86] mt-1">Calculator stays deterministic; the review layer adds source-backed build guidance.</p>
            </div>
            {review?.source && (
              <span className={cn(
                'border px-2 py-1 text-[10px] font-black uppercase tracking-widest',
                review.source === 'dify' ? 'border-[#28d7df]/35 text-[#28d7df]' : 'border-yellow-300/35 text-yellow-300',
              )}>
                {review.source}
              </span>
            )}
          </div>

          <Button variant="cyber" className="w-full h-12" onClick={runBuildReview} disabled={reviewLoading}>
            <Zap className="w-4 h-4 mr-2" /> {reviewLoading ? 'Running Build Review...' : 'Run Build Review'}
          </Button>

          {reviewError && (
            <div className="mt-4 border border-yellow-300/20 bg-yellow-300/5 p-3 text-xs text-yellow-100 leading-relaxed">
              {reviewError}
            </div>
          )}

          {review?.markdown && (
            <div className="prose prose-invert prose-sm mt-5 max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-widest prose-headings:text-white prose-p:text-[#d8d5cf] prose-li:text-[#d8d5cf]">
              <ReactMarkdown>{review.markdown}</ReactMarkdown>
            </div>
          )}
        </section>

        <Button variant="cyber" className="w-full h-12" onClick={copySnapshot}>
          <Zap className="w-4 h-4 mr-2" /> {copied ? 'Snapshot Copied' : 'Copy Build Snapshot'}
        </Button>
      </aside>
    </div>
  );
}
