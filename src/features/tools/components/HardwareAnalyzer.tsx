'use client';

import React, { useState } from 'react';
import { Activity, ShieldAlert, Cpu, Battery, Video, Send, Loader2, Zap } from 'lucide-react';
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

export function HardwareAnalyzerWidget() {
  const [formData, setFormData] = useState({
    frame: 'Apex 5" Freestyle',
    motor: '2207 2400KV',
    esc: '45A 4-in-1',
    battery: '6S 1300mAh LiPo',
    fc: 'SpeedyBee F405 V3 30.5x30.5',
    vtx: 'DJI O3 Air Unit'
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [engineeringSafety, setEngineeringSafety] = useState<EngineeringSafety | null>(null);
  const [responseSource, setResponseSource] = useState<HardwareApiResponse['source'] | null>(null);

  const analyzeHardware = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    setEngineeringSafety(null);
    setResponseSource(null);

    try {
      const response = await fetch('/api/tools/hardware-analyzer', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json() as HardwareApiResponse;
      if (!response.ok || !data.success || !data.markdown) {
        throw new Error(data.error || 'Hardware analysis failed.');
      }

      setResult(data.markdown);
      setEngineeringSafety(data.engineeringSafety ?? null);
      setResponseSource(data.source ?? null);
      if (data.warning) setError(data.warning);
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
             placeholder='e.g., Apex 5"'
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
             placeholder="e.g., 2207 2400KV"
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
             placeholder="e.g., 45A 4-in-1"
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
             placeholder="e.g., 6S 1300mAh"
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
             placeholder="e.g., SpeedyBee F405 V3"
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

      {error && (
        <div className="p-4 border border-red-500/50 bg-red-500/10 text-red-400 font-mono text-sm">
          <ShieldAlert className="w-5 h-5 mb-2 inline-block" /> {error}
        </div>
      )}

      {result && (
        <div className="mt-8 pt-8 border-t border-white/10">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-[#FF5C00]" />
            <h2 className="text-xl font-bold tracking-tight text-zinc-100">Diagnostic Report</h2>
            {responseSource === 'dify' && (
              <span title="AI-Assisted: The Dify gateway found matching RAG sources and grounded its answer in catalog data." className="ml-auto text-[10px] font-bold uppercase tracking-widest text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded cursor-help">
                AI-Assisted ⓘ
              </span>
            )}
            {responseSource === 'dify_unverified' && (
              <span title="AI — No Sources: The AI responded but found no catalog sources to cite. Treat as unverified reasoning." className="ml-auto text-[10px] font-bold uppercase tracking-widest text-amber-400 border border-amber-500/40 px-2 py-0.5 rounded cursor-help">
                AI — No Sources ⓘ
              </span>
            )}
            {responseSource === 'local' && (
              <span title="Local Guardrail: The AI gateway was not available. This result comes from deterministic catalog checks only." className="ml-auto text-[10px] font-bold uppercase tracking-widest text-zinc-400 border border-zinc-600 px-2 py-0.5 rounded cursor-help">
                Local Guardrail ⓘ
              </span>
            )}
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
        </div>
      )}
    </div>
  );
}
