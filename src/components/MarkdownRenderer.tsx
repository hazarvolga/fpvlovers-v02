'use client';
// Renders Markdown content with react-markdown + remark-gfm for full GFM support
// Supports gallery image injection after specific sections

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { ChevronDown, BookOpen } from 'lucide-react';

interface GalleryAsset {
  src: string;
  alt: string;
  caption?: string;
  credit?: string;
  sourceUrl?: string;
}

interface MarkdownRendererProps {
  content: string;
  gallery?: GalleryAsset[];
  /** If provided, inject gallery[0] after this section index and gallery[1] after another */
  injectImageAtSections?: number[];
}

export function MarkdownRenderer({ content, gallery = [], injectImageAtSections = [1, 3] }: MarkdownRendererProps) {
  return (
    <div className="prose prose-invert max-w-none text-zinc-300 antialiased leading-[1.8] text-lg font-sans
      prose-headings:text-zinc-100 prose-headings:font-bold prose-headings:tracking-tight
      prose-h1:text-4xl prose-h2:text-3xl prose-h2:mt-12 prose-h2:mb-6
      prose-h3:text-2xl prose-h3:mt-8 prose-h3:mb-4
      prose-h4:text-xl prose-h4:mt-6 prose-h4:mb-3
      prose-p:text-zinc-300 prose-p:mb-6
      prose-a:text-[#FF5C00] prose-a:no-underline hover:prose-a:text-[#FF4500] prose-a:border-b prose-a:border-[#FF5C00]/30 hover:prose-a:border-[#FF5C00] transition-colors
      prose-strong:text-zinc-100 prose-strong:font-bold
      prose-em:text-zinc-400 prose-em:italic
      prose-li:text-zinc-300 prose-li:leading-relaxed
      prose-ul:my-6 prose-ol:my-6
      prose-code:font-mono prose-code:text-[#00F2FF] prose-code:bg-zinc-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm prose-code:border prose-code:border-white/5
      prose-pre:bg-zinc-950 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl
      prose-blockquote:border-l-4 prose-blockquote:border-[#FF5C00]/50 prose-blockquote:bg-zinc-900/50 prose-blockquote:text-zinc-300 prose-blockquote:px-6 prose-blockquote:py-4 prose-blockquote:rounded-r-lg prose-blockquote:not-italic prose-blockquote:my-8
      prose-hr:border-white/10
      prose-table:text-zinc-300 prose-th:text-zinc-100 prose-th:font-bold prose-th:uppercase prose-th:tracking-wider prose-th:text-xs prose-td:border-white/5
    ">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeRaw]}
        components={{
          // Custom image renderer with FPV premium styling
          img: ({ src, alt }) => (
            <figure className="my-8 overflow-hidden rounded-xl border border-[#00F5FF]/10 bg-[#050810]/50 not-prose">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={src || ''}
                alt={alt || ''}
                className="w-full object-cover aspect-[16/9] hover:scale-[1.02] transition-transform duration-500"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
              {alt && (
                <figcaption className="p-3 text-[10px] text-white/40 font-mono flex items-center justify-between">
                  <span>{alt}</span>
                </figcaption>
              )}
            </figure>
          ),
          // Custom heading overrides to prevent h1/h2 from being too large inside sections
          h1: ({ children }) => (
            <h2 className="text-3xl font-bold text-zinc-100 mt-12 mb-6 tracking-tight">{children}</h2>
          ),
          h2: ({ children }) => (
            <h3 className="text-2xl font-bold text-zinc-100 mt-10 mb-4 tracking-tight">{children}</h3>
          ),
          h3: ({ children }) => (
            <h4 className="text-xl font-bold text-zinc-200 mt-8 mb-3">{children}</h4>
          ),
          // Code block
          pre: ({ children }) => (
            <pre className="bg-zinc-950 border border-white/10 rounded-xl p-4 overflow-x-auto text-sm font-mono text-[#00F2FF] my-6">
              {children}
            </pre>
          ),
          // Table
          table: ({ children }) => (
            <div className="overflow-x-auto my-6 border border-white/5 rounded-lg bg-zinc-900/30">
              <table className="w-full text-sm border-collapse">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="px-4 py-3 bg-zinc-900/80 border-b border-white/10 text-zinc-100 font-bold text-left text-xs uppercase tracking-widest">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-3 border-b border-white/5 text-zinc-300 text-sm last:border-b-0">{children}</td>
          ),
          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[#FF5C00]/50 bg-zinc-900/50 px-6 py-4 rounded-r-lg my-8 not-italic">
              {children}
            </blockquote>
          ),
          // Anchor and Component Interception (Phase 3 Fix)
          a: ({ href, children }) => {
            // Safe Component Injection: Intercept special internal links starting with #render:
            if (href?.startsWith('#render:')) {
              const componentType = href.split(':')[1];
              
              if (componentType === 'telemetry-graph') {
                return (
                  <div className="not-prose my-8 flex flex-col items-center justify-center rounded-xl border border-[#FF5C00]/30 bg-zinc-950 p-6 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
                    <span className="mb-2 flex items-center gap-2 font-mono text-xs uppercase tracking-widest text-[#FF5C00]">
                      <span className="h-2 w-2 rounded-full bg-[#FF5C00]" />
                      Flight Data Reference
                    </span>
                    <div className="w-full h-32 bg-black/50 rounded-lg border border-white/5 relative overflow-hidden">
                      {/* Placeholder for actual telemetry charts */}
                      <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,92,0,0.05)_50%,transparent_100%)]" />
                      <div className="absolute bottom-0 h-px w-full bg-[#FF5C00]/30" />
                      <div className="absolute bottom-0 left-1/4 h-16 w-1/2 rounded-t-full border-t border-[#FF5C00] opacity-50" />
                    </div>
                    <p className="mt-4 text-xs text-zinc-500 font-sans text-center">{children}</p>
                  </div>
                );
              }
              
              if (componentType === 'callout') {
                return (
                  <div className="my-6 p-5 border-l-4 border-[#FFB800] bg-[#FFB800]/10 rounded-r-xl not-prose">
                    <strong className="block text-[#FFB800] font-bold uppercase tracking-wider text-xs mb-1">
                      Pilot Briefing
                    </strong>
                    <span className="text-zinc-200 text-sm leading-relaxed">{children}</span>
                  </div>
                );
              }
            }

            // Standard Link
            return (
              <a
                href={href}
                target={href?.startsWith('http') ? '_blank' : undefined}
                rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
                className="text-[#FF5C00] hover:text-[#FF4500] border-b border-[#FF5C00]/30 hover:border-[#FF5C00] transition-colors"
              >
                {children}
              </a>
            );
          },
          // Collapsible Knowledge Blocks (details / summary)
          details: ({ children }) => (
            <details className="group border border-white/10 bg-zinc-900/50 rounded-lg my-8 overflow-hidden not-prose">
              {children}
            </details>
          ),
          summary: ({ children }) => (
            <summary className="p-4 bg-zinc-900 font-bold text-zinc-100 cursor-pointer list-none flex items-center justify-between border-b border-white/5 group-open:border-white/10 hover:bg-zinc-800 transition-colors">
              <span className="flex items-center gap-3">
                <BookOpen className="w-4 h-4 text-[#00F2FF]" />
                <span className="font-sans text-base tracking-tight">{children}</span>
              </span>
              <ChevronDown className="w-4 h-4 text-[#00F2FF] group-open:rotate-180 transition-transform" />
            </summary>
          ),
          // Map div to ensure content inside details is padded
          div: ({ className, children }) => {
            if (className?.includes('knowledge-content')) {
              return <div className="p-6 text-zinc-300 text-base leading-relaxed prose prose-invert max-w-none">{children}</div>;
            }
            return <div className={className}>{children}</div>;
          }
        }}
      >
        {content}
      </ReactMarkdown>

      {/* Gallery section at bottom if provided */}
      {gallery.length > 0 && (
        <div className="mt-12 pt-8 border-t border-white/5 not-prose">
          <h3 className="text-[10px] uppercase font-bold tracking-widest text-[#FFB800] mb-6">Visual References</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {gallery.map((asset, i) => (
              <figure key={i} className="bg-black/30 border border-white/10 rounded-xl overflow-hidden">
                <div className="relative aspect-[16/9]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={asset.src}
                    alt={asset.alt}
                    className="w-full h-full object-cover hover:scale-[1.02] transition-transform duration-500"
                    loading="lazy"
                    referrerPolicy="no-referrer"
                  />
                </div>
                {(asset.caption || asset.credit || asset.sourceUrl) && (
                  <figcaption className="p-3 text-[11px] text-[#A0A0A0] font-mono space-y-1">
                    {asset.caption && <div>{asset.caption}</div>}
                    {asset.credit && <div className="text-white/40">{asset.credit}</div>}
                    {asset.sourceUrl && (
                      <div className="mt-1">
                        <a
                          href={asset.sourceUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#00F5FF] hover:text-[#00FF66] transition-colors font-bold uppercase tracking-widest text-[9px] flex items-center gap-1"
                        >
                          [ View Original Source ]
                        </a>
                      </div>
                    )}
                  </figcaption>
                )}
              </figure>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
