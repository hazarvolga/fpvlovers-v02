import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchEditorialInsights } from '@/lib/dify';
import { getPublishedContentBySlugAsync, type PublishedArtifact } from '@/lib/content-automation/content-reader';
import { getRelatedContent } from '@/lib/content-discovery/related-engine';
import { getRecommendedNextSteps } from '@/lib/content-discovery/progression-engine';
import { firstWaveContentPlan } from '@/lib/content-plan';
import { Badge } from '@/components/ui/badge';
import { AffiliateButton } from '@/features/monetization/components/AffiliateButton';
import { AdZone } from '@/features/monetization/components/AdZone';
import { AdStickySidebar } from '@/features/monetization/components/NativeAds';
import { Cpu, Shield, Zap, FileText, BookOpen, ArrowRight } from 'lucide-react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { ActiveSortieWidget } from '@/features/academy/components/ActiveSortieWidget';
import { DiscoveryLink } from '@/components/DiscoveryLink';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const published = await getPublishedContentBySlugAsync(resolvedParams.slug);
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

function PublishedArticle({ article, relatedContent = [], nextSteps = [] }: { article: PublishedArtifact, relatedContent?: PublishedArtifact[], nextSteps?: PublishedArtifact[] }) {
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
        <article className="relative hex-panel glass-panel overflow-hidden lg:col-span-8 col-span-1 border-[#00F2FF]/20 shadow-[inset_0_0_80px_rgba(0,242,255,0.05)] bg-[#050810]/70 rounded-lg">
          <div className="absolute inset-0 carbon-grid opacity-20 pointer-events-none" />
          {a.media?.coverImage?.src && (
            <div className="relative w-full h-[360px] md:h-[420px] border-b border-[#00F2FF]/20 overflow-hidden bg-black/80 flex items-center justify-center">
              {/* Blurred background layer to elegantly fill space for non-16:9 images */}
              <Image
                src={a.media.coverImage.src}
                alt=""
                fill
                className="object-cover opacity-20 blur-2xl scale-125 pointer-events-none"
                unoptimized={true}
              />
              {/* Main cover image, contained so it never stretches or crops awkwardly */}
              <Image
                src={a.media.coverImage.src}
                alt={a.media.coverImage.alt || a.title}
                fill
                sizes="(min-width: 1024px) 66vw, 100vw"
                unoptimized={true}
                className="object-contain relative z-10 p-4"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#050810] via-[#050810]/20 to-transparent z-20 pointer-events-none" />
              <div className="absolute top-6 left-6 z-30">
                <span className="text-[10px] uppercase font-black tracking-widest px-3 py-1 bg-black/80 backdrop-blur-md border border-[#00F2FF]/50 text-[#00F2FF] rounded">
                  {a.category || 'Article'}
                </span>
              </div>
            </div>
          )}
          {a.media?.coverImage?.credit && (
            <div className="px-8 pt-4 text-[10px] text-white/30 font-mono italic flex items-center justify-between">
              <span>{a.media.coverImage.credit}</span>
              {a.media.coverImage.sourceUrl && (
                <a href={a.media.coverImage.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-[#00F2FF] hover:text-[#00FF66] transition-colors uppercase tracking-widest text-[9px] font-black z-10 relative">
                  [ Cover Source ]
                </a>
              )}
            </div>
          )}
          <div className={`p-8 md:p-12 lg:p-16 ${!a.media?.coverImage?.src ? 'pt-12' : 'relative z-10 -mt-20'} relative z-10`}>
            <div className="flex items-center gap-2 mb-6">
              <span className="text-[10px] uppercase font-black tracking-widest px-3 py-1 bg-black/80 border border-[#00F2FF]/30 text-[#00F2FF] rounded">
                {a.category || 'Article'}
              </span>
              <span className="text-[10px] uppercase font-black tracking-widest px-3 py-1 bg-[#00FF66]/10 border border-[#00FF66]/20 text-[#00FF66] rounded flex items-center gap-1.5">
                <Shield className="w-3 h-3" /> PUBLISHED
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-white mb-6 leading-tight">
              {a.title}
            </h1>

            {a.excerpt && (
              <p className="text-xl md:text-2xl font-bold tracking-tight text-white/90 mb-10 pb-8 border-b border-[#00F2FF]/20">
                {a.excerpt}
              </p>
            )}

            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-[#00F2FF] mb-12 pb-6 border-b border-[#00F2FF]/20">
              <span className="flex items-center gap-1.5"><Cpu className="w-3 h-3" /> FPVLOVERS DATASTREAM</span>
              {a.publishedAt && (
                <span>{new Date(a.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              )}
            </div>

            {/* Loop through sections and render inline */}
            <div className="prose prose-invert max-w-none text-white/70 antialiased leading-relaxed mb-12 prose-headings:text-white prose-a:text-[#00F5FF]">
              {(a.bodySections || []).map((section, idx) => (
                <div key={section.id || `sec-${idx}`} className="mb-14">
                  <h2 className="text-3xl font-black uppercase tracking-tight text-white mt-12 mb-6">
                    {section.title}
                  </h2>
                  
                  <MarkdownRenderer content={section.content} />

                  {section.imageMatch?.src && (
                    <figure className="my-10 overflow-hidden rounded-xl border border-[#00F2FF]/20 bg-[#050810] not-prose p-1 shadow-[0_0_30px_rgba(0,242,255,0.1)] relative">
                      <div className="absolute inset-0 carbon-grid opacity-10 pointer-events-none" />
                      <div className="relative w-full aspect-[16/9] overflow-hidden rounded-lg">
                          <Image
                            src={section.imageMatch.src}
                            alt={section.imageMatch.alt || section.title}
                            fill
                            sizes="(min-width: 1024px) 66vw, 100vw"
                            unoptimized={true}
                            className="object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        {(section.imageMatch.caption || section.imageMatch.credit) && (
                          <figcaption className="p-4 text-[10px] text-[#A0A0A0] font-mono flex flex-col md:flex-row md:items-center md:justify-between gap-2 border-t border-[#00F2FF]/20 mt-1 relative z-10 bg-black/40">
                            <span className="uppercase tracking-widest">{section.imageMatch.caption || section.imageMatch.alt}</span>
                            {section.imageMatch.credit && (
                              <div className="flex items-center gap-3 flex-wrap">
                                <span>{section.imageMatch.credit}</span>
                                {section.imageMatch.sourceUrl && (
                                  <a
                                    href={section.imageMatch.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-[#00F2FF] hover:text-[#00FF66] transition-colors uppercase tracking-widest font-black"
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
            </div>

            {a.internalLinks?.length > 0 && (
              <div className="border-t border-[#00F2FF]/20 pt-8 mt-12">
                <h3 className="text-[10px] uppercase font-black tracking-widest text-[#00F2FF] mb-6 flex items-center gap-2">
                  <Zap className="w-4 h-4" /> RELATED DATABANKS
                </h3>
                <div className="flex flex-wrap gap-3">
                  {a.internalLinks.map((link: string, i: number) => {
                    const slug = link.split('/').pop() || link;
                    const label = slug
                      .split('-')
                      .filter(Boolean)
                      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                      .join(' ');
                    return (
                      <Link key={i} href={link.startsWith('/') ? link : `/${link}`} className="text-[10px] font-black text-white/70 hover:text-[#00F2FF] transition-colors px-4 py-2 border border-white/10 hover:border-[#00F2FF]/50 rounded bg-black/40 uppercase tracking-widest shadow-[0_0_15px_rgba(0,242,255,0)] hover:shadow-[0_0_15px_rgba(0,242,255,0.2)]">
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

        {/* Discovery Layer */}
        <div className="lg:col-span-8 col-span-1 flex flex-col gap-8">
          {nextSteps.length > 0 && (
            <div className="hex-panel glass-panel p-6 border-[#00FF66]/30 bg-[#050810]/70 rounded-lg">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#00FF66] mb-4 flex items-center gap-2">
                <ArrowRight className="w-4 h-4" /> Recommended Next Steps
              </h3>
              <div className="flex flex-col gap-3">
                {nextSteps.map(step => (
                  <DiscoveryLink 
                    key={step.slug} 
                    href={`/article/${step.slug}`} 
                    sourceSlug={a.slug}
                    targetSlug={step.slug}
                    linkType="next_step"
                    className="block p-4 border border-white/5 hover:border-[#00FF66]/50 rounded bg-black/40 transition-all group"
                  >
                    <div className="text-[10px] font-mono text-[#A0A0A0] uppercase mb-1">
                      {step.metadata?.difficulty} &bull; {step.category}
                    </div>
                    <div className="font-bold text-white group-hover:text-[#00FF66] transition-colors">
                      {step.title}
                    </div>
                  </DiscoveryLink>
                ))}
              </div>
            </div>
          )}

          {relatedContent.length > 0 && (
            <div className="hex-panel glass-panel p-6 border-[#00F2FF]/20 bg-[#050810]/70 rounded-lg">
              <h3 className="text-sm font-black uppercase tracking-widest text-[#00F2FF] mb-4 flex items-center gap-2">
                <BookOpen className="w-4 h-4" /> Related Articles
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {relatedContent.map(rel => (
                  <DiscoveryLink 
                    key={rel.slug} 
                    href={`/article/${rel.slug}`} 
                    sourceSlug={a.slug}
                    targetSlug={rel.slug}
                    linkType="related"
                    className="block p-4 border border-white/5 hover:border-[#00F2FF]/50 rounded bg-black/40 transition-all group relative overflow-hidden"
                  >
                    {rel.media?.coverImage?.src && (
                      <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Image src={rel.media.coverImage.src} alt="" fill className="object-cover" unoptimized />
                      </div>
                    )}
                    <div className="relative z-10">
                      <div className="text-[10px] font-mono text-[#00F2FF] uppercase mb-1">
                        {rel.metadata?.topics?.[0] || 'ARTICLE'}
                      </div>
                      <div className="font-bold text-sm text-white group-hover:text-[#00F2FF] transition-colors line-clamp-2">
                        {rel.title}
                      </div>
                    </div>
                  </DiscoveryLink>
                ))}
              </div>
            </div>
          )}
        </div>

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

  // Log non-blocking page view if database is active and we are not in build phase
  if (process.env.NEXT_PHASE !== 'phase-production-build') {
    import('@/lib/server/analytics-store')
      .then(({ logAnalyticsEvent }) => {
        logAnalyticsEvent({
          eventType: 'page_view',
          contentSlug: resolvedParams.slug,
          source: 'frontend',
        });
      })
      .catch((err) => {
        console.warn('[ArticlePage] Failed to log page view:', err);
      });
  }

  const published = await getPublishedContentBySlugAsync(resolvedParams.slug);
  if (published) {
    const relatedContent = await getRelatedContent(resolvedParams.slug);
    const nextSteps = await getRecommendedNextSteps(resolvedParams.slug);
    return <PublishedArticle article={published} relatedContent={relatedContent} nextSteps={nextSteps} />;
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

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <article className="lg:col-span-8 col-span-1 border border-white/5 bg-zinc-950 rounded-xl overflow-hidden shadow-2xl">
            <div className="p-8 md:p-12 lg:p-16 pt-12 relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 bg-zinc-900 border border-white/10 text-zinc-300 rounded">{seed.category}</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 bg-[#FF5C00]/10 border border-[#FF5C00]/20 text-[#FF5C00] rounded">Editorial Plan</span>
                {seed.tier === 'pillar' && (
                  <span className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 bg-[#00F2FF]/10 border border-[#00F2FF]/20 text-[#00F2FF] rounded">Pillar</span>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-zinc-100 mb-6 leading-[1.1]">{seed.title}</h1>
              <p className="text-xl md:text-2xl text-zinc-400 mb-6 font-sans leading-relaxed">{seed.summary}</p>
              <p className="text-base text-zinc-500 mb-10 leading-relaxed font-serif">{seed.whyThisMatters}</p>

              <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-[#A0A0A0] mb-10 pb-6 border-b border-[#00F2FF]/20">
                <span className="flex items-center gap-1.5"><BookOpen className="w-3 h-3 text-[#00F2FF]" /> FPVLovers Editorial Plan</span>
                <span>~{seed.estimatedWordCount} words planned</span>
                <span>Audience: {seed.audience}</span>
              </div>

              <div className="space-y-6 mb-10">
                <h2 className="text-xs font-black uppercase text-[#FF5C00] tracking-widest">{"// Planned Article Outline"}</h2>
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

              <div className="border-t border-[#00F2FF]/20 pt-6 mt-8">
                <div className="bg-[#050810]/80 border border-[#FFD700]/30 p-6 text-center rounded hex-panel">
                  <p className="text-[10px] text-[#FFD700] font-black uppercase tracking-widest mb-2">This article is planned and will be generated soon.</p>
                  <p className="text-xs text-[#A0A0A0] font-mono">Visit the admin Content Jobs tab to queue this article for generation.</p>
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
        <article className="relative hex-panel glass-panel overflow-hidden lg:col-span-8 col-span-1 border-[#00F2FF]/20 shadow-[inset_0_0_80px_rgba(0,242,255,0.05)] bg-[#050810]/70 rounded-lg">
          <div className="absolute inset-0 carbon-grid opacity-20 pointer-events-none" />
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
             <div className="absolute top-6 left-6 z-10">
               <span className="text-[10px] uppercase font-black tracking-widest px-3 py-1 bg-black/80 backdrop-blur-md border border-[#00F2FF]/50 text-[#00F2FF] rounded">
                  {insight.category}
               </span>
             </div>
          </div>
        )}

        <div className={`p-8 md:p-12 ${!insight.imageUrl ? 'pt-12' : 'relative z-10 -mt-20'} relative z-10`}>
           <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white mb-6 leading-tight">
             {insight.title}
           </h1>

           <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-[#00F2FF] mb-10 pb-6 border-b border-[#00F2FF]/20">
              <span className="flex items-center gap-1.5"><Cpu className="w-3 h-3" /> LEGACY SOURCE</span>
              <span className="flex items-center gap-1.5"><Shield className="w-3 h-3 text-[#00FF66]" /> VERIFIED</span>
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

           <div className="hex-panel p-6 mb-10 rounded bg-[#050810]/80 border border-[#00F2FF]/20 relative">
              <div className="absolute inset-0 carbon-grid opacity-10 pointer-events-none" />
              <h3 className="text-[10px] uppercase font-black tracking-widest text-[#00F2FF] mb-4 flex items-center gap-2 relative z-10">
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

           <div className="flex flex-col sm:flex-row items-center sm:items-end justify-between p-8 border-t border-[#00F2FF]/20 mt-8 relative bg-gradient-to-r from-transparent to-[#00F2FF]/5 -mx-8 -mb-8 sm:-mx-12 sm:-mb-12">
              <div className="absolute inset-0 bg-[#FF5C00]/5 pointer-events-none mix-blend-screen" />
              <div className="flex-1 mb-6 sm:mb-0 text-center sm:text-left relative z-10">
                <h4 className="text-[10px] font-black tracking-[0.2em] text-[#FF5C00] mb-2 uppercase">Acquire Authorization</h4>
                <p className="text-[9px] text-[#A0A0A0] font-mono uppercase tracking-widest max-w-[200px] mx-auto sm:mx-0">
                   Commission may be earned. System Monetization policies apply.
                </p>
              </div>

              <AffiliateButton
                 url={insight.affiliateLink}
                 price={insight.price}
                 label="PROCEED TO VENDOR"
                 provider={insight.category === 'Flight Guides' ? 'Direct' : 'Amazon'}
                 className="w-full sm:w-[300px] flex-shrink-0 relative z-10"
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
