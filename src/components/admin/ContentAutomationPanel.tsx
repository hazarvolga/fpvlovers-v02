'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Workflow, Plus, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ContentJobTable from './ContentJobTable';
import type { ContentJob, ContentJobStatus } from '@/lib/content-automation/types';
import type { GeneratedContent } from '@/lib/content-automation/parse-generated-content';

type ContentAutomationPanelProps = {
  onNavigateToGeneration?: () => void;
};

export default function ContentAutomationPanel({ onNavigateToGeneration }: ContentAutomationPanelProps) {
  const [jobs, setJobs] = useState<ContentJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/admin/content/jobs');
      const data = await resp.json();
      setJobs(data.jobs || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchJobs();
  }, [fetchJobs]);

  const queueSize = jobs.length;
  const failedCount = jobs.filter((j) => j.status === 'failed').length;
  const awaitingReview = jobs.filter((j) => j.status === 'generated').length;
  const publishedToday = jobs.filter((j) => {
    if (j.status !== 'published') return false;
    const d = new Date(j.updatedAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  const handleCreateJob = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      const form = e.currentTarget;
      const data = new FormData(form);
      const title = String(data.get('title') || '').trim();
      const topic = String(data.get('topic') || '').trim();
      const category = String(data.get('category') || 'tech-article').trim();
      const template = String(data.get('template') || 'tech-article').trim();

      if (!title || !topic) return;

      setCreating(true);
      const id = `job-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      const seoMeta = String(data.get('metaDescription') || topic).trim();
      const keywordStr = String(data.get('keywords') || '').trim();
      const keywords = keywordStr ? keywordStr.split(',').map((k) => k.trim()).filter(Boolean) : [];

      try {
        const resp = await fetch('/api/admin/content/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, title, topic, category, template, slug, metaDescription: seoMeta, keywords }),
        });
        await resp.json();
        setShowCreateForm(false);
        form.reset();
        fetchJobs();
      } catch {}
      setCreating(false);
    },
    [fetchJobs],
  );

  const handleAction = useCallback(
    async (job: ContentJob, action: string, detail?: string) => {
      setActionLoading(`${job.id}-${action}`);
      try {
        if (action === 'generate') {
          const resp = await fetch('/api/admin/content/generate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              topic: job.topic,
              template: job.template,
              language: 'en',
              title: job.title,
              category: job.category,
              brief: { primaryKeyword: job.topic, secondaryKeywords: job.seo.keywords, summary: job.topic, outline: job.sourceHints },
            }),
          });
          const result = await resp.json();
          if (result.success) {
            await fetch('/api/admin/content/jobs/' + job.id, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'generated', feedback: `Generation complete: ${result.totalTokens || '?'} tokens` }),
            });
          } else {
            await fetch('/api/admin/content/jobs/' + job.id, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ status: 'failed', feedback: result.error || 'Generation failed' }),
            });
          }
        } else if (action === 'review') {
          await fetch('/api/admin/content/jobs/' + job.id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'reviewed', feedback: detail || feedback || 'Reviewed' }),
          });
        } else if (action === 'approve') {
          await fetch('/api/admin/content/jobs/' + job.id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'approved', feedback: detail || 'Approved for publishing' }),
          });
        } else if (action === 'publish') {
          const publishResp = await fetch('/api/admin/content/publish', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ jobId: job.id }),
          });
          await publishResp.json();
        } else if (action === 'queue') {
          await fetch('/api/admin/content/jobs/' + job.id, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'queued' }),
          });
        }
        setFeedback('');
        fetchJobs();
      } catch {}
      setActionLoading(null);
    },
    [fetchJobs, feedback],
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
            <Workflow className="text-[#00F2FF]" /> Content Jobs
          </h2>
          <p className="text-[#A0A0A0] font-mono text-xs mt-1">Self-feeding content pipeline: brief → queue → generate → review → approve → publish.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="border-[#333] text-[#A0A0A0]" onClick={fetchJobs} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button variant="cyber" size="sm" className="border-[#00F2FF] text-[#00F2FF] hover:bg-[#00F2FF] hover:text-black" onClick={() => setShowCreateForm(!showCreateForm)}>
            <Plus className="w-4 h-4 mr-2" /> New Brief
          </Button>
        </div>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateJob} className="bg-[#0A0A0B] border border-[#333] p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input name="title" placeholder="Job title *" required className="bg-black border border-[#333] text-white font-mono text-sm p-3 focus:border-[#00F2FF] focus:outline-none" />
            <input name="topic" placeholder="Topic / primary keyword *" required className="bg-black border border-[#333] text-white font-mono text-sm p-3 focus:border-[#00F2FF] focus:outline-none" />
            <select name="category" defaultValue="tech-article" className="bg-black border border-[#333] text-white font-mono text-sm p-3 focus:border-[#00F2FF] focus:outline-none">
              <option value="tech-article">Technical Article</option>
              <option value="build-guide">Build Guide</option>
              <option value="comparison">Comparison</option>
              <option value="troubleshooting">Troubleshooting</option>
              <option value="regulation-guide">Regulation Guide</option>
              <option value="community-roundup">Community Roundup</option>
            </select>
            <select name="template" defaultValue="tech-article" className="bg-black border border-[#333] text-white font-mono text-sm p-3 focus:border-[#00F2FF] focus:outline-none">
              <option value="tech-article">tech-article</option>
              <option value="build-guide">build-guide</option>
              <option value="comparison">comparison</option>
              <option value="troubleshooting">troubleshooting</option>
              <option value="regulation-guide">regulation-guide</option>
              <option value="community-roundup">community-roundup</option>
            </select>
          </div>
          <div className="flex gap-3">
            <input name="metaDescription" placeholder="Meta description (optional)" className="flex-1 bg-black border border-[#333] text-white font-mono text-sm p-3 focus:border-[#00F2FF] focus:outline-none" />
            <input name="keywords" placeholder="Keywords, comma separated" className="flex-1 bg-black border border-[#333] text-white font-mono text-sm p-3 focus:border-[#00F2FF] focus:outline-none" />
          </div>
          <div className="flex gap-2">
            <Button type="submit" variant="cyber" size="sm" className="border-[#00F2FF] text-[#00F2FF] hover:bg-[#00F2FF] hover:text-black" disabled={creating}>
              {creating ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating...</> : 'Create Brief'}
            </Button>
            <Button type="button" variant="outline" size="sm" className="border-[#333] text-[#A0A0A0]" onClick={() => setShowCreateForm(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-[#0A0A0B] border border-[#333] p-3">
          <div className="text-[10px] font-mono uppercase text-[#A0A0A0] tracking-widest">Queue</div>
          <div className="text-xl font-mono text-white mt-1">{queueSize}</div>
        </div>
        <div className="bg-[#0A0A0B] border border-[#333] p-3">
          <div className="text-[10px] font-mono uppercase text-[#A0A0A0] tracking-widest">Awaiting Review</div>
          <div className="text-xl font-mono text-[#FFD700] mt-1">{awaitingReview}</div>
        </div>
        <div className="bg-[#0A0A0B] border border-[#333] p-3">
          <div className="text-[10px] font-mono uppercase text-[#A0A0A0] tracking-widest">Published Today</div>
          <div className="text-xl font-mono text-[#00FF66] mt-1">{publishedToday}</div>
        </div>
        <div className="bg-[#0A0A0B] border border-[#333] p-3">
          <div className="text-[10px] font-mono uppercase text-[#A0A0A0] tracking-widest">Failed</div>
          <div className="text-xl font-mono text-[#FF4444] mt-1">{failedCount}</div>
        </div>
      </div>

      {loading ? (
        <div className="text-[#A0A0A0] font-mono text-sm py-8 text-center flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading jobs...
        </div>
      ) : (
        <ContentJobTable
          jobs={jobs}
          actionLoading={actionLoading}
          feedback={feedback}
          setFeedback={setFeedback}
          onAction={handleAction}
          onNavigateToGeneration={onNavigateToGeneration}
        />
      )}
    </div>
  );
}
