'use client';

import React from 'react';
import { Sparkles, CheckCircle2, Send, Eye, Loader2, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { ContentJob } from '@/lib/content-automation/types';

type ContentJobTableProps = {
  jobs: ContentJob[];
  actionLoading: string | null;
  feedback: string;
  setFeedback: (v: string) => void;
  onAction: (job: ContentJob, action: string, detail?: string) => void;
  onNavigateToGeneration?: () => void;
};

const STATUS_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'pending-approval': { bg: 'bg-[#1A110A]', text: 'text-[#FF8800]', border: 'border-[#FF8800]/30' },
  brief:       { bg: 'bg-[#111]',        text: 'text-[#A0A0A0]', border: 'border-[#333]' },
  queued:      { bg: 'bg-[#0A1A2A]',     text: 'text-[#00F2FF]', border: 'border-[#00F2FF]/30' },
  generating:  { bg: 'bg-[#1A1A0A]',     text: 'text-[#FFD700]', border: 'border-[#FFD700]/30' },
  generated:   { bg: 'bg-[#0A1A0A]',     text: 'text-[#00FF66]', border: 'border-[#00FF66]/30' },
  reviewed:    { bg: 'bg-[#0A0A2A]',     text: 'text-[#8B5CF6]', border: 'border-[#8B5CF6]/30' },
  approved:    { bg: 'bg-[#1A0A1A]',     text: 'text-[#EC4899]', border: 'border-[#EC4899]/30' },
  published:   { bg: 'bg-[#0A1A1A]',     text: 'text-[#00FF66]', border: 'border-[#00FF66]/30' },
  failed:      { bg: 'bg-[#1A0A0A]',     text: 'text-[#FF4444]', border: 'border-[#FF4444]/30' },
};

const ACTIONS_BY_STATUS: Record<string, { label: string; action: string; icon: React.ElementType }[]> = {
  'pending-approval': [{ label: 'Approve', action: 'queue', icon: CheckCircle2 }],
  brief:      [{ label: 'Queue',  action: 'queue',   icon: ChevronRight }],
  queued:     [{ label: 'Generate', action: 'generate', icon: Sparkles }],
  generating: [],
  generated:  [{ label: 'Review',  action: 'review',  icon: Eye }],
  reviewed:   [{ label: 'Approve', action: 'approve', icon: CheckCircle2 }],
  approved:   [{ label: 'Publish', action: 'publish', icon: Send }],
  published:  [],
  failed:     [],
};

export default function ContentJobTable({
  jobs,
  actionLoading,
  feedback,
  setFeedback,
  onAction,
  onNavigateToGeneration,
}: ContentJobTableProps) {
  if (jobs.length === 0) {
    return (
      <div className="text-[#A0A0A0] font-mono text-sm py-8 text-center">
        No jobs in queue. Click <span className="text-[#00F2FF]">New Brief</span> to create the first content job.
      </div>
    );
  }

  return (
    <div className="bg-[#0A0A0B] border border-[#333]">
      <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-[#333] bg-[#111]">
        <div className="col-span-4 text-[10px] font-mono uppercase text-[#A0A0A0] tracking-widest">Title</div>
        <div className="col-span-2 text-[10px] font-mono uppercase text-[#A0A0A0] tracking-widest">Category</div>
        <div className="col-span-2 text-[10px] font-mono uppercase text-[#A0A0A0] tracking-widest">Status</div>
        <div className="col-span-2 text-[10px] font-mono uppercase text-[#A0A0A0] tracking-widest">Updated</div>
        <div className="col-span-2 text-[10px] font-mono uppercase text-[#A0A0A0] tracking-widest text-right">Actions</div>
      </div>

      {jobs.map((job) => {
        const colors = STATUS_COLORS[job.status] || STATUS_COLORS.brief;
        const actions = ACTIONS_BY_STATUS[job.status] || [];
        const isPublished = job.status === 'published';
        const updated = new Date(job.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

        return (
          <div key={job.id} className={`grid grid-cols-12 gap-2 px-4 py-3 border-b border-[#1A1A1A] hover:bg-[#0F0F0F] transition-colors ${isPublished ? 'opacity-60' : ''}`}>
            <div className="col-span-4 flex items-center min-w-0">
              <div className="truncate">
                <div className="text-sm text-white font-mono truncate">{job.title}</div>
                <div className="text-[10px] text-[#A0A0A0] font-mono truncate mt-0.5">{job.topic}</div>
              </div>
            </div>
            <div className="col-span-2 flex items-center">
              <span className="text-xs text-[#A0A0A0] font-mono">{job.category}</span>
            </div>
            <div className="col-span-2 flex items-center">
              <span className={`inline-flex items-center px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border ${colors.border} ${colors.text} ${colors.bg}`}>
                {isPublished ? '✓ ' : ''}{job.status}
              </span>
            </div>
            <div className="col-span-2 flex items-center">
              <span className="text-[10px] text-[#A0A0A0] font-mono">{updated}</span>
            </div>
            <div className="col-span-2 flex items-center justify-end gap-1">
              {isPublished ? (
                <span className="text-[10px] text-[#00FF66] font-mono">Live</span>
              ) : (
                <>
                  {(job.status === 'generated' || job.status === 'reviewed') && (
                    <input
                      type="text"
                      placeholder="Feedback..."
                      value={feedback}
                      onChange={(e) => setFeedback(e.target.value)}
                      className="w-16 bg-black border border-[#333] text-[#A0A0A0] font-mono text-[10px] px-1 py-0.5 focus:border-[#00F2FF] focus:outline-none"
                    />
                  )}
                  {actions.map(({ label, action, icon: Icon }) => {
                    const isLoading = actionLoading === `${job.id}-${action}`;
                    return (
                      <Button
                        key={action}
                        variant="outline"
                        size="sm"
                        className="border-[#333] text-[#A0A0A0] text-[10px] h-6 px-2 py-0"
                        onClick={() => onAction(job, action)}
                        disabled={!!actionLoading}
                      >
                        {isLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Icon className="w-3 h-3" />}
                        <span className="ml-1">{label}</span>
                      </Button>
                    );
                  })}
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
