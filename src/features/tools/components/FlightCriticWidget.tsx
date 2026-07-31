'use client';

import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'motion/react';
import { UploadCloud, Crosshair, Zap, Activity, ShieldAlert, Award, FileVideo, Share2, Play } from 'lucide-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AnalysisResult {
  scores: {
    flow: number;
    speed: number;
    proximity: number;
    acro: number;
    stability: number;
  };
  verdict: string;
  summary: string;
  telemetrySimulation: Array<{
    timestamp: string;
    event: string;
    riskScore: string;
  }>;
}

export function FlightCriticWidget() {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'analyzing' | 'complete'>('idle');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [hudData, setHudData] = useState({ speed: 120, alt: 45, gforce: 1.2 });

  const triggerAnalysis = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('video', file);

      const res = await fetch('/api/analyze-flight', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Analysis failed');

      const data: AnalysisResult = await res.json();
      setAnalysis(data);
      setStatus('complete');
    } catch (error) {
      console.error(error);
      setAnalysis({
         scores: { flow: 50, speed: 50, proximity: 50, acro: 50, stability: 50 },
         verdict: "Manual Review Needed",
         summary: "Automated review is unavailable. No pilot rank or frame-level finding was generated.",
         telemetrySimulation: [
           { timestamp: "N/A", event: "Review pipeline unavailable", riskScore: "Unknown" }
         ]
      });
      setStatus('complete');
    }
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      const file = acceptedFiles[0];
      setVideoFile(file);
      setVideoUrl(URL.createObjectURL(file));
      setStatus('analyzing');
      triggerAnalysis(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'video/*': ['.mp4', '.mov', '.avi'] },
    maxFiles: 1,
  });

  // HUD Simulation Loop
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'analyzing') {
       if (videoRef.current) {
          videoRef.current.play().catch(() => {});
       }
       interval = setInterval(() => {
          setHudData(prev => ({
            speed: Math.floor(Math.random() * 60) + 90,
            alt: Math.floor(Math.random() * 20) + 10,
            gforce: +(Math.random() * 4).toFixed(1)
          }));
       }, 500);
    }
    return () => clearInterval(interval);
  }, [status]);

  const radarData = analysis ? [
    { subject: 'Flow', A: analysis.scores.flow, fullMark: 100 },
    { subject: 'Speed', A: analysis.scores.speed, fullMark: 100 },
    { subject: 'Proximity', A: analysis.scores.proximity, fullMark: 100 },
    { subject: 'Acro', A: analysis.scores.acro, fullMark: 100 },
    { subject: 'Stability', A: analysis.scores.stability, fullMark: 100 },
  ] : [];

  return (
    <div className="w-full max-w-4xl mx-auto glass-card overflow-hidden neon-border shadow-2xl relative">

      {/* JSON-LD Schema for Review (UGC) SEO */}
      {analysis && (
         <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Review",
            "itemReviewed": {
                "@type": "MediaObject",
                "name": "FPV Flight Analysis",
            },
            "reviewRating": {
                "@type": "Rating",
                "ratingValue": (analysis.scores.flow + analysis.scores.speed + analysis.scores.proximity + analysis.scores.acro + analysis.scores.stability) / 5 / 20,
                "bestRating": "5"
            },
            "author": {
                "@type": "Organization",
                "name": "AFFEXAI Oracle"
            },
            "reviewBody": analysis.summary
         })}} />
      )}

      {/* HEADER */}
      <div className="border-b border-white/10 p-4 flex items-center justify-between bg-black/40">
         <div className="flex items-center gap-2">
            <Crosshair className="w-5 h-5 text-[#00F5FF]" />
            <h3 className="font-black tracking-widest text-[#00F5FF] uppercase text-sm">Flight Critic V1.0</h3>
         </div>
         <Badge variant="outline" className="text-[10px]"><Zap className="w-3 h-3 mr-1 text-[#FFB800]"/> PILOT REVIEW</Badge>
      </div>

      <div className="p-6">
        <AnimatePresence mode="wait">
          {/* STATE: IDLE (UPLOAD) */}
          {status === 'idle' && (
            <motion.div
               key="upload"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, scale: 0.95 }}
            >
              <div
                 {...getRootProps()}
                 className={cn("border-2 border-dashed rounded-xl p-16 flex flex-col items-center justify-center cursor-pointer transition-colors",
                   isDragActive ? "border-[#00F5FF] bg-[#00F5FF]/5" : "border-white/10 hover:border-[#00F5FF]/50 bg-black/20")}
              >
                <input {...getInputProps()} />
                <div className="w-16 h-16 rounded-full bg-[#00F5FF]/10 flex items-center justify-center mb-6">
                  <UploadCloud className="w-8 h-8 text-[#00F5FF]" />
                </div>
                <h4 className="text-xl font-black uppercase text-white tracking-tighter mb-2">Upload Flight File</h4>
                <p className="text-white/40 text-sm font-semibold mb-6 text-center max-w-sm">This beta provides a conservative rubric only. It does not claim per-frame visual analysis or official ranking.</p>
                <Button variant="cyber" className="pointer-events-none">Select File</Button>
              </div>
            </motion.div>
          )}

          {/* STATE: ANALYZING (HUD) */}
          {status === 'analyzing' && videoUrl && (
             <motion.div
               key="analyzing"
               initial={{ opacity: 0, scale: 1.05 }}
               animate={{ opacity: 1, scale: 1 }}
               className="relative rounded-xl overflow-hidden aspect-video bg-black neon-border"
             >
                <video
                   ref={videoRef}
                   src={videoUrl}
                   className="w-full h-full object-cover opacity-60 mix-blend-screen grayscale-[30%] contrast-125"
                   loop
                   muted
                />

                {/* HUD Overlay - Target Reticle */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                   <div className="w-32 h-32 border border-[#00F5FF]/30 rounded-full animate-[spin_10s_linear_infinite] flex items-center justify-center">
                     <div className="w-2 h-2 bg-[#FFB800] rounded-full shadow-[0_0_10px_#FFB800]" />
                   </div>
                   <div className="absolute w-[120%] h-[1px] bg-[#00F5FF]/20" />
                   <div className="absolute h-[120%] w-[1px] bg-[#00F5FF]/20" />
                </div>

                {/* HUD Overlay - Telemetry Items (simulated values — not from actual video) */}
                <div className="absolute top-4 left-4 flex flex-col gap-1 font-mono text-[10px] text-[#00F5FF] font-bold">
                   <div className="bg-black/50 px-2 py-1 border border-[#00F5FF]/30 rounded backdrop-blur">SPD: {hudData.speed} KM/H <span className="text-[8px] opacity-40 font-normal">SIM</span></div>
                   <div className="bg-black/50 px-2 py-1 border border-[#00F5FF]/30 rounded backdrop-blur text-[#FFB800]">ALT: {hudData.alt} M <span className="text-[8px] opacity-40 font-normal">SIM</span></div>
                </div>
                <div className="absolute top-4 right-4 flex flex-col items-end gap-1 font-mono text-[10px] text-red-400 font-bold">
                   <div className="bg-black/50 px-2 py-1 border border-red-500/30 rounded backdrop-blur flex items-center gap-2">
                     <ShieldAlert className="w-3 h-3"/> G-FORCE: {hudData.gforce} G <span className="text-[8px] opacity-40 font-normal">SIM</span>
                   </div>
                </div>

                {/* Glitch text */}
                <div className="absolute bottom-10 left-0 w-full flex justify-center text-[#00F5FF]">
                   <span className="font-black text-2xl tracking-[0.3em] uppercase bg-black/40 px-4 py-1 backdrop-blur border-y border-[#00F5FF]/50 animate-pulse">
                     Running Conservative Review...
                   </span>
                </div>

                {/* Scanline */}
                <div className="absolute top-0 left-0 w-full h-2 bg-[#00F5FF]/50 blur-sm animate-[scan_2s_linear_infinite]" />
             </motion.div>
          )}

          {/* STATE: RESULTS */}
          {status === 'complete' && analysis && (
             <motion.div
               key="results"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex flex-col gap-6"
             >
                {/* Honest disclaimer — required, always visible */}
                <div className="p-3 border border-amber-500/30 bg-amber-500/5 rounded-lg flex items-start gap-3">
                  <ShieldAlert className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                  <p className="text-amber-400 text-xs font-mono leading-relaxed">
                    <span className="font-bold">RUBRIC-BASED REVIEW — </span>
                    Video frames are not analyzed. Scores and events are generated from a conservative FPV coaching rubric using only filename, type, and size metadata. Do not treat this as frame-level analysis.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Result Left */}
                <div className="flex flex-col">
                   <div className="mb-6 flex flex-col gap-2 relative">
                      <div className="absolute -left-6 top-0 w-1 h-full bg-[#FFB800]" />
                      <h4 className="text-[10px] font-bold uppercase tracking-widest text-[#FFB800]">Coaching Verdict</h4>
                      <h2 className="text-4xl font-black uppercase text-white tracking-tighter text-glow">{analysis.verdict}</h2>
                   </div>

                   <p className="text-white/60 text-sm leading-relaxed mb-8">{analysis.summary}</p>

                   <div className="glass-panel p-4 rounded-lg mb-8">
                     <h4 className="text-[10px] font-bold text-[#00F5FF] uppercase tracking-widest mb-3 flex items-center gap-2">
                       <Activity className="w-3 h-3" /> Coaching Events <span className="text-[8px] opacity-50 font-normal ml-1">RUBRIC-GENERATED</span>
                     </h4>
                     <div className="flex flex-col gap-2">
                        {analysis.telemetrySimulation.map((event, i) => (
                           <div key={i} className="flex items-center justify-between border-b border-white/5 pb-2 text-xs font-mono">
                             <div className="flex items-center gap-3">
                               <span className="text-white/40">[{event.timestamp}]</span>
                               <span className="text-[#00F5FF]">{event.event}</span>
                             </div>
                             <Badge variant={event.riskScore === 'Extreme' ? 'destructive' : 'outline'} className="text-[9px]">
                                {event.riskScore} RISK
                             </Badge>
                           </div>
                        ))}
                     </div>
                   </div>

                   <div className="flex items-center gap-4 mt-auto">
                      <Button variant="cyber" className="flex-1" onClick={() => setStatus('idle')}>
                         <Play className="w-4 h-4 mr-2" /> RE-ANALYZE
                      </Button>
                      <Button variant="outline" className="text-white">
                         <Share2 className="w-4 h-4" />
                      </Button>
                   </div>
                </div>

                {/* Result Right: Radar */}
                <div className="h-[350px] relative glass bg-gradient-to-tr from-black/50 to-transparent rounded-xl flex items-center justify-center p-4">
                  <div className="absolute top-2 right-2 opacity-20">
                    <Award className="w-16 h-16 text-[#00F5FF]" />
                  </div>
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                      <PolarGrid stroke="rgba(0,245,255,0.2)" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 10, fontFamily: 'monospace' }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                      <Radar
                        name="Pilot"
                        dataKey="A"
                        stroke="#00F5FF"
                        strokeWidth={2}
                        fill="#00F5FF"
                        fillOpacity={0.4}
                      />
                      <Tooltip
                         contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.9)', border: '1px solid rgba(0,245,255,0.3)', borderRadius: '8px' }}
                         itemStyle={{ color: '#00F5FF', fontWeight: 'bold' }}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                </div>
             </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
