'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { FileText, ExternalLink, RefreshCw, Loader2, ImageIcon, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { PublishedArtifact } from '@/lib/content-automation/content-reader';

type BackfillResult = {
  slug: string;
  status: 'updated' | 'updated_hotlink_fallback' | 'skipped' | 'no_images' | 'error';
  reason?: string;
  oldSrc?: string;
  newSrc?: string;
};

type BackfillSummary = {
  dryRun: boolean;
  total: number;
  updated: number;
  skipped: number;
  failed: number;
  results: BackfillResult[];
};

export default function PublishedContentPanel() {
  const [articles, setArticles] = useState<PublishedArtifact[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<string | null>(null);
  const [backfilling, setBackfilling] = useState(false);
  const [backfillSummary, setBackfillSummary] = useState<BackfillSummary | null>(null);

  const fetchPublished = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch('/api/admin/content/published');
      const data = await resp.json();
      setArticles(data.articles || []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchPublished();
  }, [fetchPublished]);

  const selectedArticle = selected ? articles.find((a) => a.slug === selected) : null;

  const handleBackfill = useCallback(async (dryRun = false) => {
    setBackfilling(true);
    setBackfillSummary(null);
    try {
      const resp = await fetch('/api/admin/content/backfill-images', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dryRun }),
      });
      const data = await resp.json();
      if (data.success) {
        setBackfillSummary(data);
        if (!dryRun) void fetchPublished();
      }
    } catch {}
    setBackfilling(false);
  }, [fetchPublished]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-black uppercase text-white tracking-tight flex items-center gap-2">
            <FileText className="text-[#00FF66]" /> Published Content
          </h2>
          <p className="text-[#A0A0A0] font-mono text-xs mt-1">
            {articles.length} article{articles.length !== 1 ? 's' : ''} published via content automation pipeline.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="border-[#333] text-[#A0A0A0]" onClick={() => handleBackfill(true)} disabled={loading || backfilling}>
            <ImageIcon className="w-4 h-4 mr-2" /> Dry Run
          </Button>
          <Button variant="cyber" size="sm" className="border-[#FF5C00] text-[#FF5C00] hover:bg-[#FF5C00] hover:text-white" onClick={() => handleBackfill(false)} disabled={loading || backfilling}>
            {backfilling ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Backfilling...</> : <><ImageIcon className="w-4 h-4 mr-2" /> Backfill Images</>}
          </Button>
          <Button variant="outline" size="sm" className="border-[#333] text-[#A0A0A0]" onClick={fetchPublished} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {backfillSummary && (
        <div className="bg-[#0A0A0B] border border-[#FF5C00]/40 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-mono text-white">
            <ImageIcon className="w-4 h-4 text-[#FF5C00]" />
            Backfill {backfillSummary.dryRun ? '(Dry Run)' : 'Complete'} — {backfillSummary.total} articles processed
          </div>
          <div className="flex gap-4 text-xs font-mono">
            <span className="text-[#00FF66] flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> {backfillSummary.updated} updated</span>
            <span className="text-[#A0A0A0] flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {backfillSummary.skipped} skipped</span>
            <span className="text-red-400 flex items-center gap-1"><XCircle className="w-3 h-3" /> {backfillSummary.failed} failed</span>
          </div>
          <div className="max-h-40 overflow-y-auto space-y-1">
            {backfillSummary.results.filter((r) => r.status === 'updated').map((r) => (
              <div key={r.slug} className="text-[10px] font-mono text-[#00FF66]">
                ✓ {r.slug} → {r.newSrc?.slice(0, 60)}
              </div>
            ))}
            {backfillSummary.results.filter((r) => r.status === 'updated_hotlink_fallback').map((r) => (
              <div key={r.slug} className="text-[10px] font-mono text-[#FFB800]" title={r.reason}>
                ⚠ {r.slug} → hotlink only (local cache write failed) → {r.newSrc?.slice(0, 60)}
              </div>
            ))}
            {backfillSummary.results.filter((r) => r.status === 'error').map((r) => (
              <div key={r.slug} className="text-[10px] font-mono text-red-400">
                ✗ {r.slug}: {r.reason}
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="text-[#A0A0A0] font-mono text-sm py-8 text-center flex items-center justify-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin" /> Loading published content...
        </div>
      ) : articles.length === 0 ? (
        <div className="text-[#A0A0A0] font-mono text-sm py-8 text-center bg-[#0A0A0B] border border-[#333]">
          No published content yet. Use the <span className="text-[#00F2FF]">Content Jobs</span> tab to create, generate, and publish articles.
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-[#0A0A0B] border border-[#333]">
            <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-[#333] bg-[#111]">
              <div className="col-span-5 text-[10px] font-mono uppercase text-[#A0A0A0] tracking-widest">Title</div>
              <div className="col-span-2 text-[10px] font-mono uppercase text-[#A0A0A0] tracking-widest">Category</div>
              <div className="col-span-2 text-[10px] font-mono uppercase text-[#A0A0A0] tracking-widest">Template</div>
              <div className="col-span-2 text-[10px] font-mono uppercase text-[#A0A0A0] tracking-widest">Published</div>
              <div className="col-span-1 text-[10px] font-mono uppercase text-[#A0A0A0] tracking-widest text-right">View</div>
            </div>

            {articles.map((article) => {
              const date = article.publishedAt
                ? new Date(article.publishedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                : '—';

              return (
                <div
                  key={article.slug}
                  className={`grid grid-cols-12 gap-2 px-4 py-3 border-b border-[#1A1A1A] hover:bg-[#0F0F0F] transition-colors cursor-pointer ${selected === article.slug ? 'bg-[#0A1A2A] border-l-2 border-l-[#00F2FF]' : ''}`}
                  onClick={() => setSelected(selected === article.slug ? null : article.slug)}
                >
                  <div className="col-span-5 flex items-center min-w-0">
                    <div className="truncate">
                      <div className="text-sm text-white font-mono truncate">{article.title}</div>
                      <div className="text-[10px] text-[#A0A0A0] font-mono truncate mt-0.5">{article.excerpt}</div>
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-xs text-[#A0A0A0] font-mono">{article.category}</span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="inline-flex px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border border-[#00FF66]/30 text-[#00FF66] bg-[#0A1A0A]">
                      {article.template}
                    </span>
                  </div>
                  <div className="col-span-2 flex items-center">
                    <span className="text-[10px] text-[#A0A0A0] font-mono">{date}</span>
                  </div>
                  <div className="col-span-1 flex items-center justify-end">
                    <a
                      href={`/article/${article.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00F2FF] hover:text-white"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>

          {selectedArticle && (
            <div className="bg-[#0A0A0B] border border-[#00F2FF]/30 p-6 space-y-4">
              <h3 className="text-sm font-mono text-white font-bold">{selectedArticle.title}</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs font-mono">
                <div>
                  <div className="text-[#A0A0A0]">Slug</div>
                  <div className="text-white">{selectedArticle.slug}</div>
                </div>
                <div>
                  <div className="text-[#A0A0A0]">Keywords</div>
                  <div className="text-white">{selectedArticle.seo.keywords.join(', ') || '—'}</div>
                </div>
                <div>
                  <div className="text-[#A0A0A0]">Sections</div>
                  <div className="text-white">{selectedArticle.bodySections.length}</div>
                </div>
                <div>
                  <div className="text-[#A0A0A0]">Job ID</div>
                  <div className="text-[#00FF66]">{selectedArticle.jobId}</div>
                </div>
              </div>
              <div className="max-h-64 overflow-y-auto bg-[#111] border border-[#1A1A1A] p-4">
                <pre className="text-xs text-[#A0A0A0] font-mono whitespace-pre-wrap">
                  {selectedArticle.bodySections.slice(0, 3).map((s) => `## ${s.title}\n${s.content.slice(0, 200)}...`).join('\n\n')}
                </pre>
              </div>

              {selectedArticle.media?.coverImage?.src && (
                <div className="space-y-2">
                  <div className="text-[10px] uppercase tracking-widest text-[#A0A0A0] font-mono">Cover Media</div>
                  <div className="relative aspect-[16/9] rounded-xl overflow-hidden border border-[#1A1A1A]">
                    <Image
                      src={selectedArticle.media.coverImage.src}
                      alt={selectedArticle.media.coverImage.alt || selectedArticle.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div className="text-[11px] text-[#A0A0A0] font-mono space-y-1">
                    {selectedArticle.media.coverImage.caption && <div>{selectedArticle.media.coverImage.caption}</div>}
                    {selectedArticle.media.coverImage.source && <div className="text-[#00F2FF]">{selectedArticle.media.coverImage.source}</div>}
                  </div>
                </div>
              )}

              {selectedArticle.media?.attribution?.length ? (
                <div className="space-y-1">
                  <div className="text-[10px] uppercase tracking-widest text-[#A0A0A0] font-mono">Attribution</div>
                  {selectedArticle.media.attribution.map((item, index) => (
                    <div key={`${selectedArticle.slug}-attr-${index}`} className="text-[11px] text-[#A0A0A0] font-mono italic">
                      {item}
                    </div>
                  ))}
                </div>
              ) : null}

              <div className="flex gap-2">
                <a href={`/article/${selectedArticle.slug}`} target="_blank" rel="noopener noreferrer">
                  <Button variant="cyber" size="sm" className="border-[#00FF66] text-[#00FF66] hover:bg-[#00FF66] hover:text-black">
                    <ExternalLink className="w-4 h-4 mr-2" /> View Live
                  </Button>
                </a>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
