'use client';
// Interactive FPV build calculator needs local input state and instant derived outputs.

import React, { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, Battery, Gauge, RotateCcw, ShieldCheck, Zap, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { calculateBuild, type BuildCalculatorInput, type BuildStyle } from '@/lib/tools/build-calculator';
import { loadDossierFromBrowser } from '@/lib/state/dossier-serializer';
import { cn } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'motion/react';

const STYLE_OPTIONS: { value: BuildStyle; label: string; hint: string }[] = [
  { value: 'freestyle', label: 'Freestyle', hint: '5:1 target' },
  { value: 'racing', label: 'Racing', hint: '8:1 target' },
  { value: 'cinematic', label: 'Cinematic', hint: '3.5:1 target' },
  { value: 'longRange', label: 'Long Range', hint: '3:1 target' },
  { value: 'whoop', label: 'Whoop', hint: '3.2:1 target' },
];

const PRESETS: Record<string, BuildCalculatorInput> = {
  'whoop': {
    style: 'whoop',
    frameWeight: 5, motorWeight: 3, stackWeight: 4, videoWeight: 4,
    propWeight: 1, batteryWeight: 12, payloadWeight: 0,
    cellCount: 1, batteryCapacityMah: 300, batteryCRating: 50,
    motorKv: 19000, propDiameter: 1.6, propPitch: 1.5, escAmpRating: 5,
  },
  '3inch': {
    style: 'freestyle',
    frameWeight: 40, motorWeight: 10, stackWeight: 12, videoWeight: 15,
    propWeight: 4, batteryWeight: 80, payloadWeight: 0,
    cellCount: 4, batteryCapacityMah: 650, batteryCRating: 80,
    motorKv: 3600, propDiameter: 3, propPitch: 2, escAmpRating: 20,
  },
  '5inch': {
    style: 'freestyle',
    frameWeight: 130, motorWeight: 32, stackWeight: 28, videoWeight: 36,
    propWeight: 18, batteryWeight: 190, payloadWeight: 0,
    cellCount: 6, batteryCapacityMah: 1100, batteryCRating: 100,
    motorKv: 1900, propDiameter: 5, propPitch: 3.6, escAmpRating: 45,
  },
  '7inch': {
    style: 'longRange',
    frameWeight: 180, motorWeight: 42, stackWeight: 30, videoWeight: 40,
    propWeight: 35, batteryWeight: 350, payloadWeight: 150,
    cellCount: 6, batteryCapacityMah: 3000, batteryCRating: 60,
    motorKv: 1300, propDiameter: 7, propPitch: 4, escAmpRating: 50,
  }
};

const DEFAULT_BUILD: BuildCalculatorInput = PRESETS['5inch'];

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
  const inputId = `calc-${field.key}`;
  return (
    <div className="space-y-2">
      <label htmlFor={inputId} className="flex items-center justify-between gap-2 text-[10px] font-black uppercase tracking-widest text-[#9eeef2]">
        <span>{field.label}</span>
      </label>
      <div className="relative group">
        <input
          id={inputId}
          type="number"
          inputMode="decimal"
          min={field.min}
          max={field.max}
          step={field.step || 1}
          value={value}
          aria-label={`${field.label} (${field.suffix})`}
          onChange={(event) => onChange(field.key, Number(event.target.value))}
          className="w-full appearance-none border border-white/10 bg-black px-4 pr-12 py-3 font-mono text-sm text-white outline-none focus:border-[#28d7df] focus:ring-1 focus:ring-[#28d7df]/50 transition-all group-hover:border-white/30"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-xs text-[#8e8b86] pointer-events-none">{field.suffix}</span>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  tone = 'cyan',
  progress
}: {
  label: string;
  value: string;
  tone?: 'cyan' | 'orange' | 'green' | 'white' | 'red';
  progress?: { value: number; max: number };
}) {
  const colors = {
    cyan: { text: 'text-[#28d7df]', border: 'border-l-[#28d7df]', bg: 'bg-[#28d7df]' },
    orange: { text: 'text-[#ff5a1f]', border: 'border-l-[#ff5a1f]', bg: 'bg-[#ff5a1f]' },
    green: { text: 'text-[#00FF66]', border: 'border-l-[#00FF66]', bg: 'bg-[#00FF66]' },
    red: { text: 'text-[#ff3333]', border: 'border-l-[#ff3333]', bg: 'bg-[#ff3333]' },
    white: { text: 'text-white', border: 'border-l-white/20', bg: 'bg-white' },
  };

  const style = colors[tone];

  return (
    <div className={cn("bg-black/40 border border-white/5 p-5 relative overflow-hidden transition-colors border-l-2", style.border)}>
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div className="text-[10px] uppercase tracking-[0.15em] text-[#8e8b86] font-mono mb-3">{label}</div>
        <motion.div 
          key={value}
          initial={{ opacity: 0.5, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn('text-2xl lg:text-3xl font-mono font-medium tracking-tighter drop-shadow-md', style.text)}
        >
          {value}
        </motion.div>
      </div>
      {progress && (
        <div className="absolute bottom-0 left-0 h-1 w-full bg-white/5">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (progress.value / progress.max) * 100)}%` }}
            transition={{ type: "spring", stiffness: 40, damping: 12 }}
            className={cn("h-full opacity-60", style.bg)} 
          />
        </div>
      )}
    </div>
  );
}

export function BuildCalculatorWidget() {
  const [build, setBuild] = useState<BuildCalculatorInput>(DEFAULT_BUILD);
  const [copied, setCopied] = useState(false);
  const [review, setReview] = useState<BuildWizardApiResponse | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    // Load dossier client-side from secure cookie
    const activeDossier = loadDossierFromBrowser();
    if (activeDossier && activeDossier.activeBuild) {
      const activeBuild = activeDossier.activeBuild;

      let style: BuildStyle = 'freestyle';
      if (activeDossier.assignedClass === 'Cinematic Operator') style = 'cinematic';
      else if (activeDossier.assignedClass === 'Long Range Explorer') style = 'longRange';
      else if (activeDossier.assignedClass === 'Competitive Racer') style = 'racing';
      else if (activeBuild.frame.style === 'Whoop') style = 'whoop';

      const mappedBuild: BuildCalculatorInput = {
        style,
        frameWeight: activeBuild.frame.weightGrams || 130,
        motorWeight: activeBuild.propulsion.motorWeightGrams || 32,
        stackWeight: 28, // Default stack weight
        videoWeight: (activeBuild.vision.vtxWeightGrams || 28) + (activeBuild.vision.cameraWeightGrams || 8),
        propWeight: (activeBuild.propulsion.propellerWeightGrams || 4) * 4,
        batteryWeight: activeBuild.power.targetBatteryCells === '6S' ? 220 : 190,
        payloadWeight: 0,
        cellCount: Number(activeBuild.power.targetBatteryCells.replace('S', '')) || 6,
        batteryCapacityMah: activeBuild.power.targetBatteryCells === '6S' ? 1300 : 1100,
        batteryCRating: 100,
        motorKv: activeBuild.propulsion.motorKv || 1750,
        propDiameter: activeBuild.frame.sizeInches || 5,
        propPitch: 3.6,
        escAmpRating: activeBuild.electronics.escCurrentLimit || 45,
      };

      Promise.resolve().then(() => {
        setBuild(mappedBuild);
      });
    }
  }, []);

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

  // Sub-components to render Outputs cleanly
  const renderDiagnosticOutput = () => (
    <section className="bg-zinc-950 rounded-xl border border-white/5 p-6 lg:p-8 shadow-2xl">
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Diagnostic Output</h2>
          <p className="text-xs text-[#8e8b86] mt-2 font-mono uppercase tracking-widest">Live telemetry estimate</p>
        </div>
        <div className={cn('border px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.2em] rounded-full', verdictTone)}>
          {result.verdict}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Metric label="AUW" value={`${result.auw}g`} tone="white" progress={{value: result.auw, max: 2000}} />
        <Metric label="Dry Weight" value={`${result.dryWeight}g`} progress={{value: result.dryWeight, max: 1500}} />
        <Metric label="Thrust Ratio" value={`${result.estimatedThrustRatio}:1`} tone={result.estimatedThrustRatio >= result.targetThrustRatio ? 'green' : result.estimatedThrustRatio < result.targetThrustRatio * 0.8 ? 'red' : 'orange'} progress={{value: result.estimatedThrustRatio, max: 15}} />
        <Metric label="Est. Thrust" value={`${result.estimatedThrustPerMotor}g/m`} progress={{value: result.estimatedThrustPerMotor, max: 2500}} />
        <Metric label="Hover Throt." value={`${result.estimatedHoverThrottle}%`} tone={result.estimatedHoverThrottle <= 35 ? 'green' : result.estimatedHoverThrottle > 50 ? 'red' : 'orange'} progress={{value: result.estimatedHoverThrottle, max: 100}} />
        <Metric label="Flight Time" value={`${result.estimatedFlightTimeMin}m`} tone={result.estimatedFlightTimeMin >= 5 ? 'green' : result.estimatedFlightTimeMin <= 2.5 ? 'red' : 'cyan'} progress={{value: result.estimatedFlightTimeMin, max: 15}} />
        <Metric label="Peak Current" value={`${result.estimatedPeakCurrent}A/m`} tone={result.currentMargin >= 8 ? 'green' : result.currentMargin <= 0 ? 'red' : 'orange'} progress={{value: result.estimatedPeakCurrent, max: 100}} />
        <Metric label="ESC Margin" value={`${result.currentMargin > 0 ? '+' : ''}${result.currentMargin}A`} tone={result.currentMargin >= 8 ? 'cyan' : result.currentMargin <= 0 ? 'red' : 'orange'} progress={{value: Math.max(0, result.currentMargin), max: 30}} />
      </div>
    </section>
  );

  const renderFitWindow = () => (
    <section className="bg-zinc-950 rounded-xl border border-white/5 p-6 lg:p-8 shadow-2xl">
      <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white mb-6 flex items-center gap-3">
        <Gauge className="w-4 h-4 text-[#00F2FF]" /> Fit Window
      </h2>
      <div className="space-y-5 font-mono text-[13px]">
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <span className="text-[#8e8b86] uppercase tracking-widest text-[10px]">Voltage</span>
          <span className="text-white">{result.nominalVoltage}V nominal / {result.fullVoltage}V full</span>
        </div>
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <span className="text-[#8e8b86] uppercase tracking-widest text-[10px]">Safe KV Range</span>
          <span className="text-[#28d7df]">{result.safeKvRange.min}-{result.safeKvRange.max}KV</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[#8e8b86] uppercase tracking-widest text-[10px]">Disc Loading</span>
          <span className="text-white">{result.discLoading} kg/m²</span>
        </div>
      </div>
    </section>
  );

  const renderSafetyNotes = () => (
    <section className="bg-zinc-950 rounded-xl border border-white/5 p-6 lg:p-8 shadow-2xl">
      <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white mb-6 flex items-center gap-3">
        {result.warnings.length ? <AlertTriangle className="w-4 h-4 text-yellow-300" /> : <ShieldCheck className="w-4 h-4 text-[#00FF66]" />}
        Safety Notes
      </h2>
      <AnimatePresence mode="popLayout">
        {result.warnings.length ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
            {result.warnings.map((warning) => (
              <div key={warning} className="border-l-2 border-yellow-300 bg-yellow-300/5 p-4 text-xs font-mono text-[#d8d5cf] leading-relaxed">
                {warning}
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="border-l-2 border-[#00FF66] bg-[#00FF66]/5 p-4 text-xs font-mono text-[#d8d5cf] leading-relaxed">
            SYSTEM GREEN. No major fit warnings detected. Verify manufacturer thrust tables before purchasing parts.
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );

  const renderBuildReviewPanel = () => (
    <section className="bg-zinc-950 rounded-xl border border-[#00F2FF]/20 p-6 lg:p-8 relative overflow-hidden shadow-2xl">
      <div className="absolute top-0 right-0 w-32 h-32 bg-[#00F2FF]/5 blur-[50px] rounded-full pointer-events-none" />
      <div className="flex items-start justify-between gap-4 mb-6 relative z-10">
        <div>
          <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">Guided Build Review</h2>
          <p className="text-[10px] text-[#8e8b86] mt-2 font-mono uppercase tracking-widest leading-relaxed">AI analysis against established RAG datasets.</p>
        </div>
        {review?.source && (
          <span className={cn(
            'border px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.2em] rounded-full',
            review.source === 'dify' ? 'border-[#28d7df]/35 text-[#28d7df]' : 'border-yellow-300/35 text-yellow-300',
          )}>
            {review.source}
          </span>
        )}
      </div>

      <Button variant="outline" className="w-full h-14 relative z-10 font-bold tracking-widest text-xs uppercase bg-[#FF5C00] text-black border-none hover:bg-[#FF5C00]/90" onClick={runBuildReview} disabled={reviewLoading}>
        <Zap className="w-4 h-4 mr-3" /> {reviewLoading ? 'ANALYZING...' : 'RUN AI REVIEW'}
      </Button>

      {reviewError && (
        <div className="mt-6 border-l-2 border-yellow-300 bg-yellow-300/5 p-4 text-xs font-mono text-yellow-100 leading-relaxed relative z-10">
          {reviewError}
        </div>
      )}

      {review?.markdown && (
        <div className="prose prose-invert prose-sm mt-8 max-w-none prose-headings:font-black prose-headings:uppercase prose-headings:tracking-widest prose-headings:text-white prose-p:text-[#A0A0A0] prose-li:text-[#A0A0A0] prose-strong:text-white relative z-10">
          <ReactMarkdown>{review.markdown}</ReactMarkdown>
        </div>
      )}
    </section>
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 xl:gap-20 relative items-start">
      
      {/* LEFT COLUMN: INPUTS */}
      <div className="space-y-8 pb-32 lg:pb-0">
        <section className="bg-zinc-950 rounded-xl border border-white/5 p-6 lg:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-50" />
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#00F2FF]">Presets & Profile</h2>
              <p className="text-[10px] font-mono text-[#8e8b86] mt-2 uppercase tracking-widest">Target Thrust Style</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" size="sm" onClick={() => setBuild(PRESETS['whoop'])} className="text-[10px] font-mono uppercase tracking-widest border border-white/10 hover:bg-zinc-800 text-zinc-300">Whoop</Button>
              <Button variant="ghost" size="sm" onClick={() => setBuild(PRESETS['3inch'])} className="text-[10px] font-mono uppercase tracking-widest border border-white/10 hover:bg-zinc-800 text-zinc-300">3&quot;</Button>
              <Button variant="ghost" size="sm" onClick={() => setBuild(PRESETS['5inch'])} className="text-[10px] font-mono uppercase tracking-widest border border-[#00F2FF]/50 text-[#00F2FF] bg-[#00F2FF]/5 hover:bg-[#00F2FF]/10">5&quot;</Button>
              <Button variant="ghost" size="sm" onClick={() => setBuild(PRESETS['7inch'])} className="text-[10px] font-mono uppercase tracking-widest border border-white/10 hover:bg-zinc-800 text-zinc-300">7&quot;</Button>
              <Button variant="ghost" size="sm" onClick={() => setBuild(DEFAULT_BUILD)} title="Reset calculator" className="ml-2 border border-white/10 hover:bg-zinc-800 text-zinc-300">
                <RotateCcw className="w-3.5 h-3.5 text-[#8e8b86]" />
              </Button>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {STYLE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setBuild((current) => ({ ...current, style: option.value }))}
                className={cn(
                  'border px-4 py-4 text-left transition-all duration-300',
                  build.style === option.value
                    ? 'border-[#00F2FF]/50 bg-[#00F2FF]/10 text-white rounded-lg shadow-lg'
                    : 'border-white/5 bg-zinc-900 rounded-lg text-zinc-400 hover:border-white/10 hover:bg-zinc-800 hover:text-white',
                )}
              >
                <span className="block text-xs font-black uppercase tracking-[0.2em]">{option.label}</span>
                <span className="block text-[10px] font-mono mt-2 opacity-70">{option.hint}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="bg-zinc-950 rounded-xl border border-white/5 p-6 lg:p-8 shadow-2xl">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-300 mb-8 flex items-center gap-3">
            <Activity className="w-5 h-5 text-white/50" /> Weight Stack
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-5">
            {WEIGHT_FIELDS.map((field) => (
              <NumberInput key={field.key} field={field} value={Number(build[field.key])} onChange={setNumber} />
            ))}
          </div>
        </section>

        <section className="bg-zinc-950 rounded-xl border border-white/5 p-6 lg:p-8 shadow-2xl">
          <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-zinc-300 mb-8 flex items-center gap-3">
            <Battery className="w-5 h-5 text-white/50" /> Powertrain
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
            {POWER_FIELDS.map((field) => (
              <NumberInput key={field.key} field={field} value={Number(build[field.key])} onChange={setNumber} />
            ))}
          </div>
        </section>
        
        <div className="hidden lg:block">
           <Button variant="ghost" className="w-full h-14 border border-white/10 hover:bg-white/5 font-mono text-[10px] uppercase tracking-widest text-[#8e8b86]" onClick={copySnapshot}>
             {copied ? 'COPIED TO CLIPBOARD' : 'COPY SNAPSHOT JSON'}
           </Button>
        </div>
      </div>

      {/* RIGHT COLUMN: OUTPUTS (DESKTOP) */}
      <aside className="hidden lg:flex flex-col space-y-8 sticky top-28 h-fit pb-12">
        {renderDiagnosticOutput()}
        {renderFitWindow()}
        {renderSafetyNotes()}
        {renderBuildReviewPanel()}
      </aside>

      {/* MOBILE BOTTOM DRAWER: OUTPUTS */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50 pointer-events-none">
        
        <div 
          className="bg-zinc-950 border-t border-white/10 p-4 flex items-center justify-between pointer-events-auto cursor-pointer shadow-[0_-10px_40px_rgba(0,0,0,0.8)]"
          onClick={() => setDrawerOpen(!drawerOpen)}
        >
          <div className="flex items-center gap-4">
            <div className={cn('w-2 h-2 rounded-full shadow-[0_0_8px_currentColor]', result.verdict === 'balanced' ? 'text-[#00FF66] bg-[#00FF66]' : result.verdict === 'caution' ? 'text-yellow-300 bg-yellow-300' : 'text-red-500 bg-red-500')} />
            <div className="font-mono text-xs text-white uppercase tracking-widest">
              <span className="text-[#8e8b86] mr-2">THRUST</span> {result.estimatedThrustRatio}:1
            </div>
            <div className="font-mono text-xs text-white uppercase tracking-widest">
              <span className="text-[#8e8b86] mr-2">TIME</span> {result.estimatedFlightTimeMin}m
            </div>
          </div>
          <ChevronUp className={cn("w-5 h-5 text-[#28d7df] transition-transform duration-300", drawerOpen && "rotate-180")} />
        </div>

        {/* Expandable Drawer Content */}
        <AnimatePresence>
          {drawerOpen && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="bg-zinc-950 border-t border-white/10 h-[80vh] overflow-y-auto pointer-events-auto pb-safe shadow-2xl"
            >
              <div className="p-4 space-y-6">
                {renderDiagnosticOutput()}
                {renderFitWindow()}
                {renderSafetyNotes()}
                {renderBuildReviewPanel()}
                <Button variant="ghost" className="w-full h-12 border border-white/10 font-mono text-[10px] uppercase tracking-widest" onClick={copySnapshot}>
                  {copied ? 'COPIED TO CLIPBOARD' : 'COPY SNAPSHOT JSON'}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

    </div>
  );
}
