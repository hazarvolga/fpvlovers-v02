'use client';

import React, { useState } from 'react';
import { Activity, ShieldAlert, Info, Cpu, Battery, Video, Disc, Send, Loader2, Zap, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';

type EngineeringSafety = {
  isEngineeringSafe: boolean;
  warnings: string[];
};

type HardwareApiResponse = {
  success: boolean;
  source?: 'dify' | 'dify_unverified' | 'local';
  markdown?: string;
  warning?: string;
  error?: string;
  engineeringSafety?: EngineeringSafety;
};

// GAP #1 fix: defaults are exact catalog product names, so the tool's own
// showcased example reliably matches instead of scoring under the threshold.
const DEFAULT_FORM_DATA = {
  frame: 'ImpulseRC Apex EVO 5" Freestyle Frame',
  motor: 'iFlight XING2 2207 1850KV Brushless Motor',
  prop: 'HQProp Ethix S3 Watermelon 5" Propellers',
  esc: '50A BLHeli32 4-in-1',
  battery: 'CNHL 6S 1300mAh LiPo',
  fc: 'SpeedyBee F405 V4 50A 30x30 Stack',
  vtx: 'DJI O3 Air Unit',
};

export function HardwareAnalyzerWidget() {
  const [formData, setFormData] = useState(DEFAULT_FORM_DATA);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [infoNotice, setInfoNotice] = useState<string | null>(null);
  const [engineeringSafety, setEngineeringSafety] = useState<EngineeringSafety | null>(null);
  const [responseSource, setResponseSource] = useState<HardwareApiResponse['source'] | null>(null);
  const [retryAfterSeconds, setRetryAfterSeconds] = useState<number | null>(null);

  const analyzeHardware = async () => {
    setLoading(true);
    setError(null);
    setInfoNotice(null);
    setResult(null);
    setEngineeringSafety(null);
    setResponseSource(null);
    setRetryAfterSeconds(null);

    try {
      const response = await fetch('/api/tools/hardware-analyzer', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.status === 429) {
        const resetHeader = response.headers.get('X-RateLimit-Reset');
        const resetMs = resetHeader ? Number(resetHeader) : NaN;
        const secondsLeft = Number.isFinite(resetMs) ? Math.max(1, Math.ceil((resetMs - Date.now()) / 1000)) : 60;
        setRetryAfterSeconds(secondsLeft);
      }

      const data = await response.json() as HardwareApiResponse;
      if (!response.ok || !data.success || !data.markdown) {
        throw new Error(data.error || 'Hardware analysis failed.');
      }

      setResult(data.markdown);
      setEngineeringSafety(data.engineeringSafety ?? null);
      setResponseSource(data.source ?? null);
      // GAP #3 fix: an expected fallback (gateway unavailable) is an
      // informational notice, not an error — keep it out of the red error box.
      if (data.warning) setInfoNotice(data.warning);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred during analysis.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      {/* HA-UX-P1-1: When to use this tool */}
      <div className="border border-white/10 bg-zinc-900/40 rounded-xl px-4 py-3 text-xs text-zinc-400 font-mono">
        <span className="text-[#FF5C00] font-bold uppercase tracking-widest">When to use: </span>
        Planning a build or upgrade? Enter your components to check voltage compatibility, KV range, ESC margin, and mounting fit before buying.
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
           <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 flex items-center gap-2">
             <Activity className="w-3 h-3" /> Frame
           </label>
           <input
             type="text"
             name="frame"
             value={formData.frame}
             onChange={handleInputChange}
             placeholder='e.g., ImpulseRC Apex EVO 5"'
             className="w-full bg-zinc-950 border border-white/10 px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#FF5C00] transition-colors rounded-lg"
           />
        </div>

        <div className="space-y-2">
           <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 flex items-center gap-2">
             <Zap className="w-3 h-3" /> Motor
           </label>
           <input
             type="text"
             name="motor"
             value={formData.motor}
             onChange={handleInputChange}
             placeholder="e.g., iFlight XING2 2207 1850KV"
             className="w-full bg-zinc-950 border border-white/10 px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#FF5C00] transition-colors rounded-lg"
           />
        </div>

        <div className="space-y-2">
           <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 flex items-center gap-2">
             <Disc className="w-3 h-3" /> Propeller
           </label>
           <input
             type="text"
             name="prop"
             value={formData.prop}
             onChange={handleInputChange}
             placeholder='e.g., HQProp Ethix S3 5"'
             className="w-full bg-zinc-950 border border-white/10 px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#FF5C00] transition-colors rounded-lg"
           />
        </div>

        <div className="space-y-2">
           <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 flex items-center gap-2">
             <Cpu className="w-3 h-3" /> ESC
           </label>
           <input
             type="text"
             name="esc"
             value={formData.esc}
             onChange={handleInputChange}
             placeholder="e.g., 50A BLHeli32 4-in-1"
             className="w-full bg-zinc-950 border border-white/10 px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#FF5C00] transition-colors rounded-lg"
           />
        </div>

        <div className="space-y-2">
           <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 flex items-center gap-2">
             <Battery className="w-3 h-3" /> Battery
           </label>
           <input
             type="text"
             name="battery"
             value={formData.battery}
             onChange={handleInputChange}
             placeholder="e.g., CNHL 6S 1300mAh LiPo"
             className="w-full bg-zinc-950 border border-white/10 px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#FF5C00] transition-colors rounded-lg"
           />
        </div>

        <div className="space-y-2">
           <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 flex items-center gap-2">
             <Cpu className="w-3 h-3" /> Flight Controller (FC)
           </label>
           <input
             type="text"
             name="fc"
             value={formData.fc}
             onChange={handleInputChange}
             placeholder="e.g., SpeedyBee F405 V4 50A"
             className="w-full bg-zinc-950 border border-white/10 px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#FF5C00] transition-colors rounded-lg"
           />
        </div>

        <div className="space-y-2">
           <label className="text-[10px] font-bold tracking-widest uppercase text-zinc-400 flex items-center gap-2">
             <Video className="w-3 h-3" /> VTX / Camera
           </label>
           <input
             type="text"
             name="vtx"
             value={formData.vtx}
             onChange={handleInputChange}
             placeholder="e.g., DJI O3 Air Unit"
             className="w-full bg-zinc-950 border border-white/10 px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#FF5C00] transition-colors rounded-lg"
           />
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full h-14 text-lg font-bold uppercase tracking-widest bg-[#FF5C00] text-black border-none hover:bg-[#FF5C00]/90 mt-4"
        onClick={analyzeHardware}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            ANALYZING SUBSYSTEMS...
          </>
        ) : (
          <>
            <Send className="w-5 h-5 mr-2" />
            RUN FULL DIAGNOSTIC
          </>
        )}
      </Button>

      {/* GAP #7 fix: rate-limit responses get an actionable countdown instead of a bare error string. */}
      {retryAfterSeconds !== null && (
        <div className="p-4 border border-red-500/50 bg-red-500/10 text-red-400 font-mono text-sm flex items-center gap-2">
          <Clock className="w-5 h-5 flex-shrink-0" />
          Too many requests. Try again in {retryAfterSeconds}s.
        </div>
      )}

      {/* GAP #3 fix: a real error (request failed) is visually distinct from an
          informational notice (gateway unavailable, local check returned instead). */}
      {error && retryAfterSeconds === null && (
        <div className="p-4 border border-red-500/50 bg-red-500/10 text-red-400 font-mono text-sm">
          <ShieldAlert className="w-5 h-5 mb-2 inline-block" /> {error}
        </div>
      )}

      {infoNotice && (
        <div className="p-4 border border-amber-500/40 bg-amber-500/10 text-amber-400 font-mono text-sm flex items-start gap-2">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{infoNotice}</span>
        </div>
      )}

      {result && (
        <div className="mt-8 pt-8 border-t border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-[#FF5C00]" />
            <h2 className="text-xl font-bold tracking-tight text-zinc-100">Diagnostic Report</h2>
            <ResponseSourceBadge source={responseSource} />
          </div>

          {engineeringSafety && (
            <div className={`mb-6 p-4 border rounded-lg font-mono text-sm ${
              engineeringSafety.isEngineeringSafe
                ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400'
                : 'border-amber-500/40 bg-amber-500/10 text-amber-400'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                <ShieldAlert className="w-4 h-4 flex-shrink-0" />
                <span className="font-bold uppercase tracking-widest text-[10px]">
                  Engineering Safety Guardrail — {engineeringSafety.isEngineeringSafe ? 'PASSED' : 'WARNINGS DETECTED'}
                </span>
              </div>
              {engineeringSafety.warnings.length > 0 && (
                <ul className="space-y-1 mt-2">
                  {engineeringSafety.warnings.map((w, i) => (
                    <li key={i} className="text-xs">⚠ {w}</li>
                  ))}
                </ul>
              )}
              {engineeringSafety.warnings.length === 0 && (
                <p className="text-xs mt-1">No critical safety concerns detected from verified catalog data.</p>
              )}
            </div>
          )}

          <div className="prose prose-invert prose-p:text-sm prose-p:text-zinc-400 prose-headings:font-bold prose-headings:text-zinc-100 prose-li:text-sm max-w-none">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>

          {/* GAP #5 fix: the score/verdict scale is explained instead of leaving
              a bare number ("14/100") for the reader to interpret on their own. */}
          <div className="mt-6 rounded-lg border border-white/10 bg-zinc-900/40 px-4 py-3 text-xs text-zinc-500 font-mono">
            <span className="text-zinc-400 font-bold uppercase tracking-widest">Score guide: </span>
            Ready (no unresolved checks) · Caution (real parts, but some specs are not manufacturer-verified in our catalog yet — confirm them before buying) · Blocked (a hard mismatch, e.g. wrong prop size for the frame). Most builds land in Caution until every spec carries verified evidence.
          </div>
        </div>
      )}
    </div>
  );
}

// GAP #6 fix: the source badge's explanation is reachable by tap, not only
// hover — mobile users get the same trust signal desktop users do.
function ResponseSourceBadge({ source }: { source: HardwareApiResponse['source'] | null }) {
  const [expanded, setExpanded] = useState(false);

  const copy: Record<NonNullable<HardwareApiResponse['source']>, { label: string; color: string; detail: string }> = {
    dify: {
      label: 'AI-Assisted',
      color: 'text-emerald-400 border-emerald-500/40',
      detail: 'The Dify gateway found matching catalog sources and grounded its answer in them.',
    },
    dify_unverified: {
      label: 'AI — No Sources',
      color: 'text-amber-400 border-amber-500/40',
      detail: 'The AI responded but found no catalog sources to cite. Treat as unverified reasoning.',
    },
    local: {
      label: 'Local Guardrail',
      color: 'text-zinc-400 border-zinc-600',
      detail: 'The AI gateway was not available. This result comes from deterministic catalog checks only.',
    },
  };

  if (!source) return null;
  const entry = copy[source];

  return (
    <div className="ml-auto relative">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        title={entry.detail}
        className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border cursor-help ${entry.color}`}
      >
        {entry.label} ⓘ
      </button>
      {expanded && (
        <div className="absolute right-0 top-full mt-2 w-56 z-10 rounded-lg border border-white/10 bg-zinc-950 p-3 text-[11px] leading-relaxed text-zinc-300 shadow-xl">
          {entry.detail}
        </div>
      )}
    </div>
  );
}
