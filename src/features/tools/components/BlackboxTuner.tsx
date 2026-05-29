'use client';
// Blackbox tuning submits private log text to a guarded server route; no client API key is exposed.

import React, { useState } from 'react';
import { Activity, ShieldAlert, Cpu, Radio, Send, Loader2, BarChart2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';

type BlackboxApiResponse = {
  success: boolean;
  source?: 'dify' | 'local';
  model?: string;
  result?: {
    confidence: number;
    riskLevel: 'low' | 'medium' | 'high';
    markdown: string;
  };
  warning?: string;
  error?: string;
};

export function BlackboxTunerWidget() {
  const [formData, setFormData] = useState({
    droneType: '5" Freestyle',
    batterySpec: '6S',
    problem: 'Propwash oscillations during sharp turns',
    logData: 'Gyro traces show 150Hz resonance, mostly on Yaw axis. Step response shows mild bounce-back on Roll.',
    currentPIDs: 'P: 45, I: 80, D: 40, FF: 100'
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number | null>(null);
  const [riskLevel, setRiskLevel] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);

  const analyzeLog = async () => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const payload = new FormData();
      payload.set('droneType', formData.droneType);
      payload.set('batterySpec', formData.batterySpec);
      payload.set('problem', formData.problem);
      payload.set('logData', formData.logData);
      payload.set('currentPIDs', formData.currentPIDs);
      if (selectedFile) payload.set('file', selectedFile);

      const response = await fetch('/api/tools/blackbox-tuning', {
        method: 'POST',
        body: payload,
      });

      const data = await response.json() as BlackboxApiResponse;
      if (!response.ok || !data.success || !data.result) {
        throw new Error(data.error || 'Blackbox analysis failed.');
      }

      setResult(data.result.markdown);
      setSource(data.model ? `${data.source} · ${data.model}` : data.source || 'local');
      setConfidence(data.result.confidence);
      setRiskLevel(data.result.riskLevel);
      if (data.warning) setError(data.warning);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred during analysis.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
           <label className="text-[10px] font-black tracking-widest uppercase text-[#FF5C00] flex items-center gap-2">
             <Cpu className="w-3 h-3" /> Drone Configuration
           </label>
           <input
             type="text"
             name="droneType"
             value={formData.droneType}
             onChange={handleInputChange}
             placeholder='e.g., 5" Freestyle'
             className="w-full bg-[#0A0A0B] border border-[#333333] px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#FF5C00] transition-colors"
           />
        </div>

        <div className="space-y-2">
           <label className="text-[10px] font-black tracking-widest uppercase text-[#FF5C00] flex items-center gap-2">
             <Activity className="w-3 h-3" /> Battery Setup
           </label>
           <input
             type="text"
             name="batterySpec"
             value={formData.batterySpec}
             onChange={handleInputChange}
             placeholder="e.g., 6S"
             className="w-full bg-[#0A0A0B] border border-[#333333] px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#FF5C00] transition-colors"
           />
        </div>

        <div className="space-y-2 md:col-span-2">
           <label className="text-[10px] font-black tracking-widest uppercase text-[#FF5C00] flex items-center gap-2">
             <ShieldAlert className="w-3 h-3" /> Issue / Symptoms
           </label>
           <input
             type="text"
             name="problem"
             value={formData.problem}
             onChange={handleInputChange}
             placeholder="e.g., Propwash oscillations during sharp turns"
             className="w-full bg-[#0A0A0B] border border-[#333333] px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#FF5C00] transition-colors"
           />
        </div>

        <div className="space-y-2 md:col-span-2">
           <label className="text-[10px] font-black tracking-widest uppercase text-[#FF5C00] flex items-center gap-2">
             <BarChart2 className="w-3 h-3" /> Log Insights / Gyro Traces summary
           </label>
           <textarea
             name="logData"
             value={formData.logData}
             onChange={handleInputChange}
             rows={3}
             placeholder="e.g., Gyro traces show 150Hz resonance..."
             className="w-full bg-[#0A0A0B] border border-[#333333] px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#FF5C00] transition-colors resize-none"
           />
        </div>

        <div className="space-y-2 md:col-span-2">
           <label className="text-[10px] font-black tracking-widest uppercase text-[#FF5C00] flex items-center gap-2">
             <Upload className="w-3 h-3" /> Optional Log / CLI Dump
           </label>
           <input
             type="file"
             accept=".bbl,.bfl,.csv,.log,.txt"
             onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
             className="w-full bg-[#0A0A0B] border border-[#333333] px-4 py-3 font-mono text-sm text-white file:mr-4 file:border-0 file:bg-[#FF5C00] file:px-3 file:py-2 file:text-xs file:font-black file:uppercase file:tracking-widest file:text-white focus:outline-none focus:border-[#FF5C00] transition-colors"
           />
           <p className="text-[10px] font-mono text-[#666666] uppercase">
             MVP limit: 256KB text excerpt. Large raw logs should be summarized first.
           </p>
        </div>

        <div className="space-y-2 md:col-span-2">
           <label className="text-[10px] font-black tracking-widest uppercase text-[#FF5C00] flex items-center gap-2">
             <Radio className="w-3 h-3" /> Current PIDs
           </label>
           <input
             type="text"
             name="currentPIDs"
             value={formData.currentPIDs}
             onChange={handleInputChange}
             placeholder="e.g., P: 45, I: 80, D: 40, FF: 100"
             className="w-full bg-[#0A0A0B] border border-[#333333] px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#FF5C00] transition-colors"
           />
        </div>
      </div>

      <Button
        variant="cyber"
        className="w-full h-14 text-lg border-[#FF5C00] text-[#FF5C00] hover:bg-[#FF5C00] hover:text-white group"
        onClick={analyzeLog}
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin text-white" />
            <span className="text-white">EXTRACTING LOG TELEMETRY...</span>
          </>
        ) : (
          <>
            <Send className="w-5 h-5 mr-2" />
            INITIATE PID ANALYSIS
          </>
        )}
      </Button>

      {error && (
        <div className="p-4 border border-yellow-300/40 bg-yellow-300/10 text-yellow-100 font-mono text-sm">
          <ShieldAlert className="w-5 h-5 mb-2 inline-block" /> {error}
        </div>
      )}

      {result && (
        <div className="mt-8 pt-8 border-t border-[#333333]">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-[#FF5C00]" />
            <h2 className="text-xl font-black uppercase text-white tracking-tight">Tuning Solution Matrix</h2>
          </div>

          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="border border-[#333333] bg-[#0A0A0B] p-3">
              <div className="text-[9px] uppercase tracking-widest text-[#666666]">Source</div>
              <div className="text-sm font-black text-[#FF5C00] uppercase">{source || 'local'}</div>
            </div>
            <div className="border border-[#333333] bg-[#0A0A0B] p-3">
              <div className="text-[9px] uppercase tracking-widest text-[#666666]">Confidence</div>
              <div className="text-sm font-black text-white">{confidence ?? '--'}/100</div>
            </div>
            <div className="border border-[#333333] bg-[#0A0A0B] p-3">
              <div className="text-[9px] uppercase tracking-widest text-[#666666]">Risk</div>
              <div className="text-sm font-black text-white uppercase">{riskLevel || 'unknown'}</div>
            </div>
          </div>

          <div className="prose prose-invert prose-p:font-mono prose-p:text-sm prose-p:text-[#A0A0A0] prose-headings:font-black prose-headings:uppercase prose-headings:text-[#FF5C00] prose-li:font-mono prose-li:text-sm max-w-none">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
