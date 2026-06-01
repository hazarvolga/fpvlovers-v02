import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchEditorialInsights } from '@/lib/dify';
import { getPublishedContentBySlug, type PublishedArtifact } from '@/lib/content-automation/content-reader';
import { firstWaveContentPlan } from '@/lib/content-plan';
import { Badge } from '@/components/ui/badge';
import { AffiliateButton } from '@/features/monetization/components/AffiliateButton';
import { AdZone } from '@/features/monetization/components/AdZone';
import { AdStickySidebar } from '@/features/monetization/components/NativeAds';
import { Cpu, Shield, Zap, FileText, BookOpen } from 'lucide-react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { ActiveSortieWidget } from '@/features/academy/components/ActiveSortieWidget';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const published = getPublishedContentBySlug(resolvedParams.slug);
  if (published) {
    return {
      title: `${published.title} | FPVLovers`,
      description: published.excerpt || published.seo.metaDescription,
      keywords: published.seo.keywords,
    };
  }

  const seed = firstWaveContentPlan.find((e) => e.slug === resolvedParams.slug);
  if (seed) {
    return {
      title: `${seed.title} | FPVLovers`,
      description: seed.metaDescription,
      keywords: [...seed.secondaryKeywords, seed.primaryKeyword],
    };
  }

  const insights = await fetchEditorialInsights();
  const insight = insights.find(i => i.id === resolvedParams.slug);
  if (!insight) return { title: 'Not Found' };

  return {
    title: `${insight.title} | AFFEXAI FPV ORACLE`,
    description: insight.summary,
    category: insight.category,
    openGraph: {
      title: insight.title,
      description: insight.summary,
      images: insight.imageUrl ? [insight.imageUrl] : [],
    }
  };
}

function PublishedArticle({ article }: { article: PublishedArtifact }) {
  const a = article;
  const breadcrumbs = [
    { label: 'Content', href: '/#latest' },
    { label: a.category || 'Article', href: `/category/${(a.category || 'article').toLowerCase().replace(/\s+/g, '-')}` },
    { label: a.title, isCurrentPage: true }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <article className="glass-card rounded-2xl overflow-hidden lg:col-span-8 col-span-1 border-[#00F5FF]/10">
          {a.media?.coverImage?.src && (
            <div className="relative w-full h-[360px] md:h-[420px] border-b border-white/10">
              <Image
                src={a.media.coverImage.src}
                alt={a.media.coverImage.alt || a.title}
                fill
                sizes="(min-width: 1024px) 66vw, 100vw"
                unoptimized={a.media.coverImage.src.startsWith('/api/content/media/cover/') || a.media.coverImage.src.includes('images.pexels.com')}
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050810] via-transparent to-transparent" />
              <div className="absolute top-6 left-6">
                <Badge className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 bg-black/50 backdrop-blur-md border border-[#00F5FF]/50 text-[#00F5FF]">
                  {a.category || 'Article'}
                </Badge>
              </div>
            </div>
          )}
          {a.media?.coverImage?.credit && (
            <div className="px-8 pt-4 text-[10px] text-white/30 font-mono italic flex items-center justify-between">
              <span>{a.media.coverImage.credit}</span>
              {a.media.coverImage.sourceUrl && (
                <a href={a.media.coverImage.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[#00F5FF] hover:text-[#00FF66] transition-colors uppercase tracking-widest text-[9px] font-bold">
                  [ Cover Source ]
                </a>
              )}
            </div>
          )}
          <div className="p-8 md:p-12 pt-12">
            <div className="flex items-center gap-2 mb-4">
              <Badge className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 bg-black/50 backdrop-blur-md border border-[#00FF66]/50 text-[#00FF66]">
                {a.category || 'Article'}
              </Badge>
              <Badge className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 bg-black/50 backdrop-blur-md border border-[#FFD700]/50 text-[#FFD700]">
                Published
              </Badge>
            </div>

            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white mb-6 leading-tight">
              {a.title}
            </h1>

            {a.excerpt && (
              <p className="text-xl md:text-2xl font-bold tracking-tight text-white/90 mb-10 pb-6 border-b border-white/10">
                {a.excerpt}
              </p>
            )}

            <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-[#A0A0A0] mb-10">
              <span className="flex items-center gap-1.5"><FileText className="w-3 h-3 text-[#00FF66]" /> FPVLovers Editorial</span>
              {a.publishedAt && (
                <span>{new Date(a.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              )}
            </div>

            {/* Loop through sections and render inline */}
            {(a.bodySections || []).map((section, idx) => (
              <div key={section.id || `sec-${idx}`} className="mb-10">
                <h2 className="text-2xl font-black text-white mt-10 mb-4 tracking-tight">
                  {section.title}
                </h2>
                
                <MarkdownRenderer content={section.content} />

                {section.imageMatch && (
                  <figure className="my-8 overflow-hidden rounded-xl border border-[#00F5FF]/10 bg-[#050810]/50 not-prose p-1">
                    <div className="relative w-full aspect-[16/9] overflow-hidden rounded-lg">
                      <Image
                        src={section.imageMatch.src}
                        alt={section.imageMatch.alt || section.title}
                        fill
                        sizes="(min-width: 1024px) 66vw, 100vw"
                        unoptimized={true}
                        className="object-cover hover:scale-[1.02] transition-transform duration-500"
                      />
                    </div>
                    {(section.imageMatch.caption || section.imageMatch.credit) && (
                      <figcaption className="p-3 text-[10px] text-white/40 font-mono flex flex-col md:flex-row md:items-center md:justify-between gap-2">
                        <span>{section.imageMatch.caption || section.imageMatch.alt}</span>
                        {section.imageMatch.credit && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>{section.imageMatch.credit}</span>
                            {section.imageMatch.sourceUrl && (
                              <a
                                href={section.imageMatch.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#00F5FF] hover:text-[#00FF66] transition-colors uppercase tracking-widest text-[9px] font-bold"
                              >
                                [ View Source ]
                              </a>
                            )}
                          </div>
                        )}
                      </figcaption>
                    )}
                  </figure>
                )}
              </div>
            ))}

            {a.internalLinks?.length > 0 && (
              <div className="border-t border-[#00F5FF]/10 pt-6 mt-8">
                <h3 className="text-[10px] uppercase font-bold tracking-widest text-[#FFB800] mb-4">Related Content</h3>
                <div className="flex flex-wrap gap-2">
                  {a.internalLinks.map((link: string, i: number) => {
                    const slug = link.split('/').pop() || link;
                    const label = slug
                      .split('-')
                      .filter(Boolean)
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(' ');
                    return (
                      <Link key={i} href={link.startsWith('/') ? link : `/${link}`} className="text-xs font-mono text-[#00F5FF] hover:text-white transition-colors px-3 py-1 border border-[#00F5FF]/20 rounded">
                        {label}
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {a.media?.attribution?.length ? (
              <div className="border-t border-white/5 pt-6 mt-8">
                {a.media.attribution.map((note: string, i: number) => (
                  <p key={`attr-${i}`} className="text-[10px] text-[#A0A0A0] font-mono italic">{note}</p>
                ))}
              </div>
            ) : null}
          </div>
        </article>

        <aside className="lg:col-span-4 col-span-1 hidden lg:flex flex-col gap-6 w-full h-full">
          <AdStickySidebar />
        </aside>
      </div>

      <ActiveSortieWidget slug={a.slug} />
    </div>
  );
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;

  const published = getPublishedContentBySlug(resolvedParams.slug);
  if (published) {
    return <PublishedArticle article={published} />;
  }

  const seed = firstWaveContentPlan.find((e) => e.slug === resolvedParams.slug);
  if (seed) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
        <CyberBreadcrumb items={[
          { label: 'Content', href: '/#latest' },
          { label: seed.category, href: `/category/${seed.category.toLowerCase().replace(/\s+/g, '-')}` },
          { label: seed.title, isCurrentPage: true },
        ]} className="mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <article className="glass-card rounded-2xl overflow-hidden lg:col-span-8 col-span-1 border-[#00F5FF]/10">
            <div className="p-8 md:p-12 pt-12">
              <div className="flex items-center gap-2 mb-4">
                <Badge className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 bg-black/50 backdrop-blur-md border border-[#FFD700]/50 text-[#FFD700]">{seed.category}</Badge>
                <Badge className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 bg-black/50 backdrop-blur-md border border-[#00F2FF]/50 text-[#00F2FF]">Editorial Plan</Badge>
                {seed.tier === 'pillar' && (
                  <Badge className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 bg-black/50 backdrop-blur-md border border-[#FF5C00]/50 text-[#FF5C00]">Pillar</Badge>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white mb-6 leading-tight">{seed.title}</h1>
              <p className="text-xl md:text-2xl font-bold tracking-tight text-white/90 mb-4">{seed.summary}</p>
              <p className="text-sm text-[#A0A0A0] mb-8 leading-relaxed">{seed.whyThisMatters}</p>

              <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-[#A0A0A0] mb-10 pb-6 border-b border-white/10">
                <span className="flex items-center gap-1.5"><BookOpen className="w-3 h-3 text-[#00FF66]" /> FPVLovers Editorial Plan</span>
                <span>~{seed.estimatedWordCount} words planned</span>
                <span>Audience: {seed.audience}</span>
              </div>

              <div className="space-y-6 mb-10">
                <h2 className="text-lg font-bold uppercase text-[#FFB800] tracking-widest">Planned Article Outline</h2>
                <ol className="list-decimal list-inside space-y-2 text-white/70">
                  {seed.outline.map((item: string, i: number) => (
                    <li key={i} className="text-sm leading-relaxed">{item}</li>
                  ))}
                </ol>
              </div>

              <div className="flex flex-wrap gap-2 mb-8">
                <span className="text-xs font-mono text-[#A0A0A0]">Keywords:</span>
                {[seed.primaryKeyword, ...seed.secondaryKeywords].map((kw: string) => (
                  <span key={kw} className="text-[10px] font-mono px-2 py-0.5 bg-[#0A0A0B] border border-[#333] text-[#A0A0A0]">{kw}</span>
                ))}
              </div>

              <div className="border-t border-[#00F5FF]/10 pt-6 mt-8">
                <div className="bg-[#0A0A0B] border border-[#FFD700]/20 p-6 text-center">
                  <p className="text-sm text-[#FFD700] font-mono mb-2">This article is planned and will be generated soon.</p>
                  <p className="text-xs text-[#A0A0A0]">Visit the admin Content Jobs tab to queue this article for generation.</p>
                </div>
              </div>
            </div>
          </article>

          <aside className="lg:col-span-4 hidden lg:flex flex-col gap-6">
            <AdStickySidebar />
          </aside>
        </div>

        <ActiveSortieWidget slug={seed.slug} />
      </div>
    );
  }

  const insights = await fetchEditorialInsights();
  const insight = insights.find(i => i.id === resolvedParams.slug);

  if (!insight) {
    notFound();
  }

  const breadcrumbs = [
    { label: 'Data Archives', href: '/#latest' },
    { label: insight.category, href: `/category/${insight.category.toLowerCase().replace(/\s+/g, '-')}` },
    { label: insight.title, isCurrentPage: true }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 pt-28">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <article className="glass-card rounded-2xl overflow-hidden lg:col-span-8 col-span-1 border-[#00F5FF]/10">
        {insight.imageUrl && (
          <div className="relative w-full h-[400px]">
             <Image
                src={insight.imageUrl}
                alt={insight.title}
                fill
                className="object-cover"
                referrerPolicy="no-referrer"
             />
             <div className="absolute inset-0 bg-gradient-to-t from-[#050810] to-transparent" />
             <div className="absolute top-6 left-6">
               <Badge className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 bg-black/50 backdrop-blur-md border border-[#00F5FF]/50 text-[#00F5FF]">
                  {insight.category}
               </Badge>
             </div>
          </div>
        )}

        <div className={`p-8 md:p-12 ${!insight.imageUrl ? 'pt-12' : 'relative z-10 -mt-20'}`}>
           <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white mb-6 leading-tight">
             {insight.title}
           </h1>

           <div className="flex items-center gap-4 text-[10px] font-bold uppercase tracking-widest text-[#00F5FF] mb-10 pb-6 border-b border-white/10">
              <span className="flex items-center gap-1.5"><Cpu className="w-3 h-3" /> LEGACY SOURCE</span>
              <span className="flex items-center gap-1.5"><Shield className="w-3 h-3" /> VERIFIED</span>
           </div>

           <div className="prose prose-invert max-w-none text-white/70 antialiased leading-relaxed mb-12 prose-headings:text-white prose-a:text-[#00F5FF]">
             <p className="text-xl md:text-2xl font-bold tracking-tight text-white/90">
               {insight.summary}
             </p>

            {/* Legacy fallback content */}
            <p className="mt-8">
               This article is rendered from the legacy knowledge layer for older slugs. Published articles use the new content pipeline and should be preferred when available.
            </p>

             {/* In-content Advertisement */}
             <div className="my-10 not-prose">
                <AdZone title="OPTIMIZED FLIGHT GEAR" className="neon-border min-h-[100px]" />
             </div>

             <p>
               When comparing parts, make sure the controller, ESC, battery, and video system are compatible before you assemble or upgrade a build.
             </p>
           </div>

           <div className="glass-panel p-6 mb-10 rounded-xl">
              <h3 className="text-[10px] uppercase font-bold tracking-widest text-[#FFB800] mb-4 flex items-center gap-2">
                <Zap className="w-4 h-4" /> TECHNICAL SPECIFICATIONS
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {Object.entries(insight.technicalSpecs).map(([key, value]) => (
                   <div key={key} className="flex flex-col p-3 rounded bg-black/40 border border-white/5">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{key}</span>
                      <span className="text-sm font-black tracking-tight text-[#00F5FF] mt-1">{value}</span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between p-8 border-t border-[#00F5FF]/10 mt-8 relative bg-gradient-to-r from-transparent to-[#00F5FF]/5 rounded-b-xl -mx-8 -mb-8 sm:-mx-12 sm:-mb-12">
              <div className="absolute amber-glow -left-40 bottom-0 pointer-events-none" />
              <div className="flex-1 mb-6 sm:mb-0 text-center sm:text-left">
                <h4 className="text-xs font-black tracking-[0.2em] text-[#00F5FF] mb-2 uppercase">Acquire Authorization</h4>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest max-w-[200px] mx-auto sm:mx-0">
                   Commission may be earned. System Monetization policies apply.
                </p>
              </div>

              <AffiliateButton
                 url={insight.affiliateLink}
                 price={insight.price}
                 label="PROCEED TO VENDOR"
                 provider={insight.category === 'Flight Guides' ? 'Direct' : 'Amazon'}
                 className="w-full sm:w-[300px] neon-border flex-shrink-0"
              />
           </div>
        </div>
      </article>

      <aside className="lg:col-span-4 col-span-1 hidden lg:flex flex-col gap-6 w-full h-full">
         <AdStickySidebar />
      </aside>
      </div>

      <ActiveSortieWidget slug={resolvedParams.slug} />
    </div>
  );
}
