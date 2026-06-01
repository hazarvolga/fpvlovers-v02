'use client';
// Renders Markdown content with react-markdown + remark-gfm for full GFM support
// Supports gallery image injection after specific sections

import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

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
    <div className="prose prose-invert max-w-none text-white/70 antialiased leading-relaxed
      prose-headings:text-white prose-headings:font-black prose-headings:tracking-tight
      prose-h1:text-3xl prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4
      prose-h3:text-xl prose-h3:mt-8 prose-h3:mb-3 prose-h3:text-[#00F5FF]
      prose-h4:text-base prose-h4:mt-6 prose-h4:mb-2 prose-h4:text-[#00FF66]
      prose-p:text-white/70 prose-p:leading-8 prose-p:mb-4
      prose-a:text-[#00F5FF] prose-a:no-underline hover:prose-a:text-[#00FF66]
      prose-strong:text-white/90 prose-strong:font-bold
      prose-em:text-white/60 prose-em:italic
      prose-li:text-white/60 prose-li:leading-7
      prose-ul:my-4 prose-ol:my-4
      prose-ul:list-disc prose-ol:list-decimal
      prose-code:text-[#00FF66] prose-code:bg-black/40 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-sm
      prose-pre:bg-[#050810] prose-pre:border prose-pre:border-[#00F5FF]/10 prose-pre:rounded-xl
      prose-blockquote:border-l-[#00F5FF] prose-blockquote:text-white/50 prose-blockquote:pl-4
      prose-hr:border-white/10
      prose-table:text-white/70 prose-th:text-white prose-th:font-bold
    ">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
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
            <h2 className="text-2xl font-black text-white mt-10 mb-4 tracking-tight">{children}</h2>
          ),
          h2: ({ children }) => (
            <h3 className="text-xl font-bold text-[#00F5FF] mt-8 mb-3 tracking-tight">{children}</h3>
          ),
          h3: ({ children }) => (
            <h4 className="text-lg font-bold text-[#00FF66] mt-6 mb-2">{children}</h4>
          ),
          // Code block
          pre: ({ children }) => (
            <pre className="bg-[#050810] border border-[#00F5FF]/10 rounded-xl p-4 overflow-x-auto text-sm font-mono text-[#00FF66] my-6">
              {children}
            </pre>
          ),
          // Table
          table: ({ children }) => (
            <div className="overflow-x-auto my-6">
              <table className="w-full text-sm border-collapse border border-[#00F5FF]/10">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="px-4 py-2 bg-[#0A0A0B] border border-[#00F5FF]/10 text-white font-bold text-left text-xs uppercase tracking-widest">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-4 py-2 border border-white/5 text-white/60 text-sm">{children}</td>
          ),
          // Blockquote
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[#00F5FF] pl-6 my-6 italic text-white/50">
              {children}
            </blockquote>
          ),
          // Anchor
          a: ({ href, children }) => (
            <a
              href={href}
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
              className="text-[#00F5FF] hover:text-[#00FF66] transition-colors underline decoration-[#00F5FF]/30 underline-offset-2"
            >
              {children}
            </a>
          ),
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
