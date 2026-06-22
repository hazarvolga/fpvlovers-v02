'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Lightbulb, RefreshCw, Sparkles, CheckCircle2, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ContentJob } from '@/lib/content-automation/types';

export default function IdeationPanel() {
  const [ideas, setIdeas] = useState<ContentJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [suggesting, setSuggesting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const fetchIdeas = useCallback(async (options?: { skipLoading?: boolean }) => {
    if (!options?.skipLoading) {
      setLoading(true);
    }
    try {
      const resp = await fetch('/api/admin/content/jobs');
      const data = await resp.json();
      const allJobs: ContentJob[] = data.jobs || [];
      // Filter only jobs that are pending approval
      setIdeas(allJobs.filter(j => j.status === 'pending-approval'));
    } catch {
      setMessage({ text: 'Failed to fetch content ideas.', type: 'error' });
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchIdeas({ skipLoading: true });
  }, [fetchIdeas]);

  const handleSuggest = async () => {
    setSuggesting(true);
    setMessage(null);
    try {
      const resp = await fetch('/api/admin/cron/ideate?count=10');
      const data = await resp.json();
      if (data.success) {
        setMessage({ text: data.message || '10 new content ideas suggested successfully!', type: 'success' });
        await fetchIdeas();
      } else {
        setMessage({ text: data.error || 'Failed to generate ideas.', type: 'error' });
      }
    } catch {
      setMessage({ text: 'API error occurred during idea generation.', type: 'error' });
    }
    setSuggesting(false);
  };

  const handleAction = async (job: ContentJob, action: 'approve' | 'reject') => {
    setActionLoading(`${job.id}-${action}`);
    setMessage(null);
    try {
      const status = action === 'approve' ? 'queued' : 'failed';
      const feedback = action === 'reject' ? 'Rejected by admin' : 'Approved by admin';
      
      const resp = await fetch(`/api/admin/content/jobs/${job.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, feedback }),
      });
      const data = await resp.json();
      if (data.success) {
        setMessage({ text: `Idea "${job.title}" ${action === 'approve' ? 'approved and enqueued' : 'rejected'}.`, type: 'success' });
        await fetchIdeas();
      } else {
        setMessage({ text: data.error || 'Action failed.', type: 'error' });
      }
    } catch {
      setMessage({ text: 'Network error occurred.', type: 'error' });
    }
    setActionLoading(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
            <Lightbulb className="text-[#FF8800]" /> Content Ideas (Ideation)
          </h2>
          <p className="text-[#A0A0A0] font-mono text-xs mt-1">
            Weekly automated suggestions based on FPV community trends. Approve to queue them for auto-generation.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-[#333] text-[#A0A0A0]" onClick={fetchIdeas} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button variant="cyber" size="sm" className="border-[#FF8800] text-[#FF8800] hover:bg-[#FF8800] hover:text-black" onClick={handleSuggest} disabled={suggesting}>
            {suggesting ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Suggesting...</>
            ) : (
              <><Sparkles className="w-4 h-4 mr-2" /> Suggest 10 New Ideas</>
            )}
          </Button>
        </div>
      </div>

      {message && (
        <div className={`p-3 border font-mono text-xs ${message.type === 'success' ? 'bg-[#0A1A0A] border-[#00FF66]/30 text-[#00FF66]' : 'bg-[#1A0A0A] border-[#FF4444]/30 text-[#FF4444]'}`}>
          {message.text}
        </div>
      )}

      {loading ? (
        <div className="text-[#A0A0A0] font-mono text-sm py-8 text-center flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading ideas...
        </div>
      ) : ideas.length === 0 ? (
        <div className="bg-[#0A0A0B] border border-[#333] p-8 text-center space-y-4">
          <p className="text-[#A0A0A0] font-mono text-sm">No pending content ideas at the moment.</p>
          <Button variant="outline" size="sm" className="border-[#FF8800] text-[#FF8800] hover:bg-[#FF8800]/10" onClick={handleSuggest} disabled={suggesting}>
            <Sparkles className="w-4 h-4 mr-2" /> Generate 10 Content Ideas Now
          </Button>
        </div>
      ) : (
        <div className="bg-[#0A0A0B] border border-[#333]">
          <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-[#333] bg-[#111]">
            <div className="col-span-5 text-[10px] font-mono uppercase text-[#A0A0A0] tracking-widest">Suggested Content Idea</div>
            <div className="col-span-2 text-[10px] font-mono uppercase text-[#A0A0A0] tracking-widest">Category / Type</div>
            <div className="col-span-3 text-[10px] font-mono uppercase text-[#A0A0A0] tracking-widest">Keywords</div>
            <div className="col-span-2 text-[10px] font-mono uppercase text-[#A0A0A0] tracking-widest text-right">Action</div>
          </div>

          {ideas.map((idea) => {
            const isApproveLoading = actionLoading === `${idea.id}-approve`;
            const isRejectLoading = actionLoading === `${idea.id}-reject`;

            return (
              <div key={idea.id} className="grid grid-cols-12 gap-2 px-4 py-4 border-b border-[#1A1A1A] hover:bg-[#0F0F0F] transition-colors">
                <div className="col-span-5 flex items-start min-w-0 pr-3">
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-white font-mono">{idea.title}</div>
                    <div className="text-xs text-[#A0A0A0] font-mono">{idea.topic}</div>
                    {idea.sourceHints && idea.sourceHints.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {idea.sourceHints.map((hint, i) => (
                          <span key={i} className="text-[9px] font-mono bg-[#111] text-[#A0A0A0] border border-[#222] px-1 py-0.5 rounded">
                            • {hint}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-span-2 flex flex-col justify-center">
                  <span className="text-xs text-white font-mono font-bold">{idea.category}</span>
                  <span className="text-[10px] text-[#A0A0A0] font-mono mt-0.5">{idea.template}</span>
                </div>
                <div className="col-span-3 flex items-center flex-wrap gap-1 pr-2">
                  {idea.seo?.keywords?.map((kw, i) => (
                    <span key={i} className="text-[10px] font-mono text-[#00F2FF] bg-[#0A1A2A]/50 px-1.5 py-0.5 border border-[#00F2FF]/20 rounded">
                      {kw}
                    </span>
                  )) || <span className="text-[10px] text-[#A0A0A0] font-mono">None</span>}
                </div>
                <div className="col-span-2 flex items-center justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#00FF66]/30 text-[#00FF66] hover:bg-[#00FF66] hover:text-black text-[10px] h-7 px-2"
                    onClick={() => handleAction(idea, 'approve')}
                    disabled={!!actionLoading}
                  >
                    {isApproveLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3 mr-1" />}
                    Approve
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-[#FF4444]/30 text-[#FF4444] hover:bg-[#FF4444] hover:text-white text-[10px] h-7 px-2"
                    onClick={() => handleAction(idea, 'reject')}
                    disabled={!!actionLoading}
                  >
                    {isRejectLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3 mr-1" />}
                    Reject
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
