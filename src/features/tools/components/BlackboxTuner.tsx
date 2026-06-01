'use client';
// Blackbox tuning submits private log text to a guarded server route; no client API key is exposed.

import React, { useState, useEffect } from 'react';
import { Activity, ShieldAlert, Cpu, Radio, Send, Loader2, BarChart2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactMarkdown from 'react-markdown';

type BlackboxApiResponse = {
  success: boolean;
  source?: 'dify' | 'local';
  answerMode?: 'local_guardrail' | 'dify_grounded';
  gatewayStatus?: 'dry_run' | 'dify_ok' | 'dify_empty' | 'dify_error' | 'not_configured';
  retrievalConfidence?: number;
  sources?: Array<{
    title: string;
    url?: string;
    dataset?: string;
    score?: number;
  }>;
  model?: string;
  result?: {
    confidence: number;
    riskLevel: 'low' | 'medium' | 'high';
    markdown: string;
  };
  warning?: string;
  error?: string;
};

const SAMPLE_INPUT = {
  droneType: '5" Freestyle',
  batterySpec: '6S',
  problem: 'Propwash oscillations during sharp turns',
  logData: 'Gyro traces show 150Hz resonance, mostly on Yaw axis. Step response shows mild bounce-back on Roll.',
  currentPIDs: 'P: 45, I: 80, D: 40, FF: 100',
  gyroModel: 'ICM42688P',
};

export function BlackboxTunerWidget() {
  const [formData, setFormData] = useState({
    droneType: '',
    batterySpec: '',
    problem: '',
    logData: '',
    currentPIDs: '',
    gyroModel: '',
  });

  useEffect(() => {
    // Defer cookie loading to bypass Next.js SSR hydration warnings
    Promise.resolve().then(() => {
      const { loadDossierFromBrowser } = require('@/lib/state/dossier-serializer');
      const dossier = loadDossierFromBrowser();
      if (dossier && dossier.activeBuild) {
        const build = dossier.activeBuild;
        setFormData(prev => ({
          ...prev,
          droneType: prev.droneType || build.droneClass || '',
          batterySpec: prev.batterySpec || build.power.targetBatteryCells || '',
          gyroModel: prev.gyroModel || build.electronics.gyroModel || '',
        }));
      }
    });
  }, []);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [source, setSource] = useState<string | null>(null);
  const [answerMode, setAnswerMode] = useState<BlackboxApiResponse['answerMode'] | null>(null);
  const [gatewayStatus, setGatewayStatus] = useState<BlackboxApiResponse['gatewayStatus'] | null>(null);
  const [retrievalConfidence, setRetrievalConfidence] = useState<number | null>(null);
  const [sources, setSources] = useState<NonNullable<BlackboxApiResponse['sources']>>([]);
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
      payload.set('gyroModel', formData.gyroModel);
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
      setAnswerMode(data.answerMode || null);
      setGatewayStatus(data.gatewayStatus || null);
      setRetrievalConfidence(data.retrievalConfidence ?? null);
      setSources(data.sources || []);
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const loadSample = () => {
    setFormData(SAMPLE_INPUT);
    setSelectedFile(null);
    setError(null);
  };

  const canAnalyze = Boolean(formData.problem.trim() || formData.logData.trim() || selectedFile);
  const sourceLabel = answerMode === 'dify_grounded' ? 'Source-backed Review' : 'Local Guardrail';
  const gatewayLabel = gatewayStatus ? gatewayStatus.replace(/_/g, ' ') : 'unknown';

  return (
    <div className="flex flex-col gap-8 w-full">
      <div className="flex flex-col gap-3 border border-[#333333] bg-[#0A0A0B] p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="text-[10px] font-black uppercase tracking-widest text-[#FF5C00]">CSV / Text Review</div>
          <p className="mt-1 max-w-2xl font-mono text-xs leading-5 text-[#888888]">
            Upload a CSV export, CLI dump, or short text excerpt. Raw .bbl/.bfl binary parsing is not enabled yet.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          className="h-10 shrink-0 border-[#333333] font-mono text-xs uppercase tracking-widest text-white hover:border-[#FF5C00] hover:text-[#FF5C00]"
          onClick={loadSample}
        >
          Load Sample
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-2">
           <label htmlFor="blackbox-drone-type" className="text-[10px] font-black tracking-widest uppercase text-[#FF5C00] flex items-center gap-2">
             <Cpu className="w-3 h-3" aria-hidden="true" /> Drone Configuration
           </label>
           <input
             id="blackbox-drone-type"
             type="text"
             name="droneType"
             value={formData.droneType}
             onChange={handleInputChange}
             placeholder='e.g., 5" Freestyle'
             className="w-full bg-[#0A0A0B] border border-[#333333] px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#FF5C00] transition-colors"
           />
        </div>

        <div className="space-y-2">
           <label htmlFor="blackbox-battery" className="text-[10px] font-black tracking-widest uppercase text-[#FF5C00] flex items-center gap-2">
             <Activity className="w-3 h-3" aria-hidden="true" /> Battery Setup
           </label>
           <input
             id="blackbox-battery"
             type="text"
             name="batterySpec"
             value={formData.batterySpec}
             onChange={handleInputChange}
             placeholder="e.g., 6S"
             className="w-full bg-[#0A0A0B] border border-[#333333] px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#FF5C00] transition-colors"
           />
        </div>

        <div className="space-y-2">
           <label htmlFor="blackbox-gyro" className="text-[10px] font-black tracking-widest uppercase text-[#FF5C00] flex items-center gap-2">
             <Radio className="w-3 h-3" aria-hidden="true" /> Flight DNA Gyro Sensor
           </label>
           <select
             id="blackbox-gyro"
             name="gyroModel"
             value={formData.gyroModel}
             onChange={handleInputChange}
             className="w-full bg-[#0A0A0B] border border-[#333333] px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#FF5C00] transition-colors appearance-none"
           >
             <option value="">-- SELECT SENSOR --</option>
             <option value="ICM42688P">ICM42688P (Sensitive High-Hz)</option>
             <option value="BMI270">BMI270 (Clean Low-Latency)</option>
             <option value="MPU6000">MPU6000 (Robust Classic)</option>
             <option value="CUSTOM">Other / Custom Gyro</option>
           </select>
        </div>

        <div className="space-y-2 sm:col-span-3">
           <label htmlFor="blackbox-problem" className="text-[10px] font-black tracking-widest uppercase text-[#FF5C00] flex items-center gap-2">
             <ShieldAlert className="w-3 h-3" aria-hidden="true" /> Issue / Symptoms
           </label>
           <input
             id="blackbox-problem"
             type="text"
             name="problem"
             value={formData.problem}
             onChange={handleInputChange}
             placeholder="e.g., Propwash oscillations during sharp turns"
             className="w-full bg-[#0A0A0B] border border-[#333333] px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#FF5C00] transition-colors"
           />
        </div>

        <div className="space-y-2 sm:col-span-3">
           <label htmlFor="blackbox-log-data" className="text-[10px] font-black tracking-widest uppercase text-[#FF5C00] flex items-center gap-2">
             <BarChart2 className="w-3 h-3" aria-hidden="true" /> Log Insights / Gyro Traces Summary
           </label>
           <textarea
             id="blackbox-log-data"
             name="logData"
             value={formData.logData}
             onChange={handleInputChange}
             rows={3}
             placeholder="e.g., Gyro traces show 150Hz resonance..."
             className="w-full bg-[#0A0A0B] border border-[#333333] px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-[#FF5C00] transition-colors resize-none"
           />
        </div>

        <div className="space-y-2 sm:col-span-3">
           <label htmlFor="blackbox-file" className="text-[10px] font-black tracking-widest uppercase text-[#FF5C00] flex items-center gap-2">
             <Upload className="w-3 h-3" aria-hidden="true" /> Optional CSV / CLI Dump
           </label>
           <input
             id="blackbox-file"
             type="file"
             accept=".csv,.log,.txt"
             onChange={(event) => setSelectedFile(event.target.files?.[0] || null)}
             className="w-full bg-[#0A0A0B] border border-[#333333] px-4 py-3 font-mono text-sm text-white file:mr-4 file:border-0 file:bg-[#FF5C00] file:px-3 file:py-2 file:text-xs file:font-black file:uppercase file:tracking-widest file:text-white focus:outline-none focus:border-[#FF5C00] transition-colors"
           />
           <p className="text-[10px] font-mono text-[#666666] uppercase">
             MVP limit: 256KB text excerpt. Export CSV/text from Blackbox Explorer before uploading.
           </p>
        </div>

        <div className="space-y-2 sm:col-span-3">
           <label htmlFor="blackbox-current-pids" className="text-[10px] font-black tracking-widest uppercase text-[#FF5C00] flex items-center gap-2">
             <Radio className="w-3 h-3" aria-hidden="true" /> Current PIDs
           </label>
           <input
             id="blackbox-current-pids"
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
        disabled={loading || !canAnalyze}
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
          <ShieldAlert className="w-5 h-5 mb-2 inline-block" aria-hidden="true" /> {error}
        </div>
      )}

      {result && (
        <div className="mt-8 pt-8 border-t border-[#333333]">
          <div className="flex items-center gap-2 mb-6">
            <Activity className="w-5 h-5 text-[#FF5C00]" aria-hidden="true" />
            <h2 className="text-xl font-black uppercase text-white tracking-tight">Tuning Solution Matrix</h2>
          </div>

          <div className="mb-6 grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="border border-[#333333] bg-[#0A0A0B] p-3">
              <div className="text-[9px] uppercase tracking-widest text-[#666666]">Source</div>
              <div className="text-sm font-black text-[#FF5C00] uppercase">{sourceLabel}</div>
              <div className="mt-1 text-[10px] font-mono uppercase text-[#666666]">{source || 'local'}</div>
            </div>
            <div className="border border-[#333333] bg-[#0A0A0B] p-3">
              <div className="text-[9px] uppercase tracking-widest text-[#666666]">Confidence</div>
              <div className="text-sm font-black text-white">{confidence ?? '--'}/100</div>
            </div>
            <div className="border border-[#333333] bg-[#0A0A0B] p-3">
              <div className="text-[9px] uppercase tracking-widest text-[#666666]">Retrieval</div>
              <div className="text-sm font-black text-white">{retrievalConfidence ?? 0}/100</div>
            </div>
            <div className="border border-[#333333] bg-[#0A0A0B] p-3">
              <div className="text-[9px] uppercase tracking-widest text-[#666666]">Risk</div>
              <div className="text-sm font-black text-white uppercase">{riskLevel || 'unknown'}</div>
              <div className="mt-1 text-[10px] font-mono uppercase text-[#666666]">{gatewayLabel}</div>
            </div>
          </div>

          {sources.length > 0 && (
            <div className="mb-6 border border-[#333333] bg-[#0A0A0B] p-4">
              <div className="mb-3 text-[10px] font-black uppercase tracking-widest text-[#FF5C00]">Retrieved Sources</div>
              <div className="space-y-2">
                {sources.map((item, index) => (
                  <div key={`${item.title}-${index}`} className="font-mono text-xs text-[#B0B0B0]">
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noreferrer" className="text-[#00F2FF] hover:text-white">
                        {item.title}
                      </a>
                    ) : (
                      <span>{item.title}</span>
                    )}
                    {item.dataset && <span className="text-[#666666]"> · {item.dataset}</span>}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="prose prose-invert prose-p:font-mono prose-p:text-sm prose-p:text-[#A0A0A0] prose-headings:font-black prose-headings:uppercase prose-headings:text-[#FF5C00] prose-li:font-mono prose-li:text-sm max-w-none">
            <ReactMarkdown>{result}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}
