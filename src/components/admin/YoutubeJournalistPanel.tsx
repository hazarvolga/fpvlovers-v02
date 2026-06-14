'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Youtube, RefreshCw, Loader2, Play, AlertTriangle, CheckCircle2, XCircle, ExternalLink, Sparkles, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface YoutubeJob {
  videoId: string;
  url: string;
  status: 'completed' | 'failed' | 'skipped';
  dateAdded: string;
  error?: string;
}

export default function YoutubeJournalistPanel() {
  const [jobs, setJobs] = useState<YoutubeJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [urlInput, setUrlInput] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState<{ success: boolean; message?: string; error?: string; path?: string } | null>(null);
  
  // Cron triggering states
  const [cronLoading, setCronLoading] = useState(false);
  const [cronResult, setCronResult] = useState<{ message: string; processedCount?: number; video?: any; error?: string; candidate?: any; totalUnprocessedFound?: number } | null>(null);
  const [dryRun, setDryRun] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/admin/content/youtube');
      const data = await resp.json();
      setJobs(data.jobs || []);
    } catch (err) {
      console.error('Failed to fetch YouTube jobs:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchJobs();
  }, [fetchJobs]);

  const handleManualGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;

    setGenerating(true);
    setGenResult(null);
    try {
      const resp = await fetch('/api/admin/content/youtube', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: urlInput }),
      });
      const data = await resp.json();
      if (data.success) {
        setGenResult({ success: true, message: data.message, path: data.path });
        setUrlInput('');
        void fetchJobs();
      } else {
        setGenResult({ success: false, error: data.error || 'Failed to generate article' });
      }
    } catch (err: any) {
      setGenResult({ success: false, error: err.message || 'Network error occurred' });
    }
    setGenerating(false);
  };

  const handleTriggerDiscovery = async () => {
    setCronLoading(true);
    setCronResult(null);
    try {
      const endpoint = `/api/admin/cron/youtube${dryRun ? '?dryRun=true' : ''}`;
      const resp = await fetch(endpoint, {
        method: 'GET',
      });
      const data = await resp.json();
      if (resp.ok) {
        setCronResult(data);
        void fetchJobs();
      } else {
        setCronResult({ message: 'Error triggering discovery', error: data.error || data.details || 'Unknown server error' });
      }
    } catch (err: any) {
      setCronResult({ message: 'Network error', error: err.message || 'Could not connect to cron endpoint' });
    }
    setCronLoading(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Title Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
            <Youtube className="text-[#FF5C00]" /> YouTube Journalist
          </h2>
          <p className="text-[#A0A0A0] font-mono text-xs mt-1">
            Generate RAG-enhanced FPV news articles directly from YouTube video transcripts.
          </p>
        </div>
        <Button variant="outline" size="sm" className="border-[#333] text-[#A0A0A0]" onClick={fetchJobs} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh Queue
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Manual Video Processor */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-[#0A0A0B] border border-[#333] p-5 rounded-lg space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
              <Play className="w-4 h-4 text-[#FF5C00]" /> Manual URL Submission
            </h3>
            <p className="text-xs text-[#A0A0A0] font-mono leading-relaxed">
              Paste a YouTube video link (e.g. reviews, builds, flight tutorials) to download its captions, query our 9 RAG datasets for technical verification, and write a publication-ready markdown article.
            </p>
            
            <form onSubmit={handleManualGenerate} className="flex gap-3">
              <input
                type="text"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="flex-1 bg-black border border-[#333] text-white font-mono text-sm p-3 focus:border-[#FF5C00] focus:outline-none"
                disabled={generating}
              />
              <Button 
                type="submit" 
                variant="cyber" 
                className="border-[#FF5C00] text-[#FF5C00] hover:bg-[#FF5C00] hover:text-white font-mono text-xs" 
                disabled={generating || !urlInput.trim()}
              >
                {generating ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> Write Article</>
                )}
              </Button>
            </form>

            {/* Manual submission result alert banner */}
            {genResult && (
              <div className={`p-4 rounded border font-mono text-xs ${genResult.success ? 'bg-[#0A1A0A] border-[#00FF66]/30 text-[#00FF66]' : 'bg-red-950/20 border-red-500/30 text-red-400'}`}>
                <div className="flex items-center gap-2 font-bold mb-1">
                  {genResult.success ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                  <span>{genResult.success ? 'Success' : 'Generation Failed'}</span>
                </div>
                <div>{genResult.success ? genResult.message : genResult.error}</div>
                {genResult.path && (
                  <div className="mt-2 text-[#00F2FF]">
                    Saved at: <span className="underline select-all">{genResult.path}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Video Process Queue Table */}
          <div className="bg-[#0A0A0B] border border-[#333] rounded-lg overflow-hidden">
            <div className="px-4 py-3 border-b border-[#333] bg-[#111] flex justify-between items-center">
              <h3 className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                Video Process Queue ({jobs.length} items)
              </h3>
            </div>

            {loading ? (
              <div className="text-[#A0A0A0] font-mono text-xs py-8 text-center flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-[#00F2FF]" /> Fetching queue state...
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-[#A0A0A0] font-mono text-xs py-8 text-center">
                No YouTube videos have been processed in this queue yet.
              </div>
            ) : (
              <div className="divide-y divide-[#1A1A1A] max-h-96 overflow-y-auto">
                {jobs.map((job) => {
                  const date = new Date(job.dateAdded).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div key={job.videoId} className="p-4 hover:bg-[#111] transition-colors flex items-start justify-between gap-4 font-mono text-xs">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-bold truncate">ID: {job.videoId}</span>
                          <a href={job.url} target="_blank" rel="noopener noreferrer" className="text-[#00F2FF] hover:underline flex items-center gap-0.5">
                            Link <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                        {job.error && (
                          <div className="text-red-400 text-[10px] break-all border-l-2 border-red-500/40 pl-2 py-0.5">
                            Error: {job.error}
                          </div>
                        )}
                        <div className="text-[10px] text-[#A0A0A0]">{date}</div>
                      </div>

                      <span className={`px-2 py-0.5 text-[10px] font-black uppercase rounded tracking-wider shrink-0 border ${
                        job.status === 'completed' ? 'bg-[#0A1A0A] border-[#00FF66]/30 text-[#00FF66]' :
                        job.status === 'failed' ? 'bg-red-950/20 border-red-500/30 text-red-400' :
                        'bg-zinc-900 border-zinc-700 text-zinc-400'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Autonomous Scheduler / Cron Trigger Panel */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#0A0A0B] border border-[#333] p-5 rounded-lg space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono flex items-center gap-1.5">
              <Youtube className="w-4 h-4 text-[#00F2FF]" /> Autonomous Discovery
            </h3>
            <p className="text-xs text-[#A0A0A0] font-mono leading-relaxed">
              Our automated system queries the YouTube API every 20 minutes for trending FPV search terms. It checks video caption availability, filters out previously processed material, and queues/publishes new high-interest articles automatically.
            </p>

            <div className="bg-black border border-[#222] p-4 rounded space-y-3 font-mono text-xs">
              <div className="text-[#00F2FF] uppercase font-bold tracking-widest text-[10px]">Configured Search Queries:</div>
              <ul className="list-disc list-inside text-[#A0A0A0] space-y-1 pl-1">
                <li>FPV drone review</li>
                <li>Cinewhoop build</li>
                <li>Joshua Bardwell</li>
                <li>Oscar Liang FPV</li>
              </ul>
            </div>

            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="dryRunCheckbox"
                  checked={dryRun}
                  onChange={(e) => setDryRun(e.target.checked)}
                  className="rounded bg-black border-[#444] text-[#FF5C00] focus:ring-0 focus:ring-offset-0 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="dryRunCheckbox" className="text-xs text-[#A0A0A0] font-mono cursor-pointer hover:text-white">
                  Dry-Run Mode (Only search, do not write/spend API tokens)
                </label>
              </div>

              <Button
                variant="outline"
                className="w-full border-[#00F2FF]/40 text-[#00F2FF] hover:bg-[#00F2FF] hover:text-[#050810] font-mono text-xs uppercase font-bold"
                onClick={handleTriggerDiscovery}
                disabled={cronLoading}
              >
                {cronLoading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Running Jobs...</>
                ) : (
                  <><Play className="w-4 h-4 mr-2" /> Trigger Discovery Now</>
                )}
              </Button>
            </div>

            {/* Cron action response visualizer */}
            {cronResult && (
              <div className="bg-[#111] border border-[#222] p-4 rounded font-mono text-xs space-y-2 max-h-60 overflow-y-auto">
                <div className="flex items-center gap-2 font-bold text-white">
                  {cronResult.error ? <AlertTriangle className="w-4 h-4 text-red-400" /> : <CheckCircle2 className="w-4 h-4 text-[#00FF66]" />}
                  <span>{cronResult.error ? 'Failure Details' : 'Discovery Completed'}</span>
                </div>
                {cronResult.message && <div className="text-white/80">{cronResult.message}</div>}
                {cronResult.error && <div className="text-red-400">{cronResult.error}</div>}
                
                {cronResult.totalUnprocessedFound !== undefined && (
                  <div className="text-[#A0A0A0]">
                    Total unprocessed videos found: <span className="text-[#00F2FF] font-bold">{cronResult.totalUnprocessedFound}</span>
                  </div>
                )}
                
                {cronResult.candidate && (
                  <div className="border-t border-[#222] pt-2 mt-2 space-y-1">
                    <div className="text-[10px] text-[#A0A0A0] uppercase tracking-wider">Top Candidate Found:</div>
                    <div className="text-[#00FF66] font-bold">{cronResult.candidate.title}</div>
                    <div className="text-xs text-[#A0A0A0]">Channel: {cronResult.candidate.channelTitle}</div>
                    <a href={cronResult.candidate.url} target="_blank" rel="noopener noreferrer" className="text-[#00F2FF] hover:underline flex items-center gap-0.5 mt-1">
                      Watch Video <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}

                {cronResult.video && (
                  <div className="border-t border-[#222] pt-2 mt-2 space-y-1">
                    <div className="text-[10px] text-[#A0A0A0] uppercase tracking-wider">Processed Video:</div>
                    <div className="text-[#00FF66] font-bold">{cronResult.video.title}</div>
                    <div className="text-xs text-[#A0A0A0]">Channel: {cronResult.video.channelTitle}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}
