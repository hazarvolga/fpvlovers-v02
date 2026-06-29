import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchEditorialInsights } from '@/lib/dify';
import {
  getPublishedContentBySlugAsync,
  isIndexablePublishedArtifact,
  type PublishedArtifact,
} from '@/lib/content-automation/content-reader';
import { getRelatedContent } from '@/lib/content-discovery/related-engine';
import { getRecommendedNextSteps } from '@/lib/content-discovery/progression-engine';
import { firstWaveContentPlan } from '@/lib/content-plan';
import { AffiliateButton } from '@/features/monetization/components/AffiliateButton';
import { AdZone } from '@/features/monetization/components/AdZone';
import { AdStickySidebar } from '@/features/monetization/components/NativeAds';
import { Cpu, Shield, Zap, FileText, BookOpen, ArrowRight } from 'lucide-react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { ActiveSortieWidget } from '@/features/academy/components/ActiveSortieWidget';
import { DiscoveryLink } from '@/components/DiscoveryLink';
import { ResilientArticleCover } from '@/features/content/components/ResilientArticleCover';
import { EditorialTrustPanel } from '@/features/content/components/EditorialTrustPanel';
import { resolveFallbackCover } from '@/lib/content-automation/fallback-cover';

function categoryHref(category: string | undefined) {
  const normalized = (category || 'article').toLowerCase().trim().replace(/\s+/g, '-');
  const routeMap: Record<string, string> = {
    reviews: '/reviews',
    review: '/reviews',
    'buyer-guides': '/buyers-guides',
    'buyer-guide': '/buyers-guides',
    comparisons: '/comparisons',
    comparison: '/comparisons',
    racing: '/racing',
    regulations: '/regulations',
    regulation: '/regulations',
    tutorial: '/academy/roadmap',
    tutorials: '/academy/roadmap',
    guide: '/academy/roadmap',
    guides: '/academy/roadmap',
    troubleshooting: '/academy/roadmap',
    parts: '/category/parts',
    components: '/category/parts',
    software: '/category/software',
    engineering: '/engineering',
    'build-guides': '/engineering',
  };

  return routeMap[normalized] || '/#latest';
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;
  const published = await getPublishedContentBySlugAsync(resolvedParams.slug);
  if (published) {
    const canonical = `/article/${published.slug}`;
    const image = published.media?.coverImage?.src;
    return {
      title: `${published.title} | FPVLovers`,
      description: published.excerpt || published.seo.metaDescription,
      keywords: published.seo.keywords,
      alternates: { canonical },
      robots: isIndexablePublishedArtifact(published)
        ? { index: true, follow: true }
        : { index: false, follow: true },
      openGraph: {
        type: 'article' as const,
        url: canonical,
        title: published.title,
        description: published.excerpt || published.seo.metaDescription,
        publishedTime: published.publishedAt,
        images: image ? [{ url: image, alt: published.media?.coverImage?.alt || published.title }] : [],
      },
      twitter: {
        card: 'summary_large_image' as const,
        title: published.title,
        description: published.excerpt || published.seo.metaDescription,
        images: image ? [image] : [],
      },
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
  const fallbackCover = resolveFallbackCover({ category: a.category, metadata: a.metadata });
  const baseUrl = process.env.APP_URL || 'https://fpvlovers.com.tr';
  const articleUrl = `${baseUrl}/article/${a.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: a.title,
    description: a.excerpt || a.seo.metaDescription,
    datePublished: a.publishedAt,
    mainEntityOfPage: articleUrl,
    image: a.media?.coverImage?.src ? [a.media.coverImage.src] : undefined,
    publisher: { '@type': 'Organization', name: 'FPVLovers', url: baseUrl },
  };
  const safeJsonLd = JSON.stringify(jsonLd).replace(/</g, '\\u003c');
  const breadcrumbs = [
    { label: 'Content', href: '/#latest' },
    { label: a.category || 'Article', href: categoryHref(a.category) },
    { label: a.title, isCurrentPage: true }
  ];
  const sectionCount = a.bodySections?.length || 0;
  const contentType = a.metadata?.contentType || a.template || 'article';
  const isCommercial = ['review', 'comparison', 'buyer-guide', 'product-roundup'].includes(contentType);

  return (
    <div className="fpv-public-shell mx-auto max-w-7xl px-4 py-12 pt-28 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd }} />
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 col-span-1 flex flex-col gap-8 min-w-0">
        <article className="fpv-public-panel relative overflow-hidden rounded-xl bg-[#050810]/70">
          <div className="absolute inset-0 carbon-grid opacity-20 pointer-events-none" />
          {a.media?.coverImage?.src && (
            <ResilientArticleCover
              asset={a.media.coverImage}
              category={a.category || 'Article'}
              fallbackSrc={fallbackCover}
              title={a.title}
            />
          )}
          <div className={`p-8 md:p-12 lg:p-16 ${!a.media?.coverImage?.src ? 'pt-12' : 'relative z-10 -mt-20'} relative z-10`}>
            <div className="flex items-center gap-2 mb-6">
              <span className="rounded border border-white/10 bg-black/80 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-300">
                {a.category || 'Article'}
              </span>
              <span className="flex items-center gap-1.5 rounded border border-[#FF5C00]/25 bg-[#FF5C00]/10 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF5C00]">
                <Shield className="w-3 h-3" /> PUBLISHED
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-white mb-6 leading-tight">
              {a.title}
            </h1>

            {a.excerpt && (
              <p className="mb-10 border-b border-white/10 pb-8 text-xl font-bold tracking-tight text-white/90 md:text-2xl">
                {a.excerpt}
              </p>
            )}

            <EditorialTrustPanel article={a} />

            <div className="mb-12 grid grid-cols-2 gap-3 border-b border-white/10 pb-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 md:grid-cols-4">
              <span className="flex items-center gap-1.5"><Cpu className="w-3 h-3" /> FPVLOVERS EDITORIAL</span>
              {a.publishedAt && (
                <span>{new Date(a.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              )}
              <span>{sectionCount} field notes</span>
              <span className={isCommercial ? 'text-[#FFB800]' : 'text-[#00FF66]'}>
                {isCommercial ? 'Disclosure active' : contentType}
              </span>
            </div>

            {/* Loop through sections and render inline */}
            <div className="prose prose-invert mb-12 max-w-none text-white/70 antialiased prose-a:text-[#FF5C00] prose-headings:text-white">
              {(a.bodySections || []).map((section, idx) => (
                <div key={section.id || `sec-${idx}`} className="mb-14">
                  <h2 className="text-3xl font-black uppercase tracking-tight text-white mt-12 mb-6">
                    {section.title}
                  </h2>

                  <MarkdownRenderer content={section.content} />

                  {section.imageMatch?.src && (
                    <figure className="not-prose relative my-10 overflow-hidden rounded-xl border border-white/10 bg-[#050810] p-1 shadow-[0_18px_60px_rgba(0,0,0,0.35)]">
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
                          <figcaption className="relative z-10 mt-1 flex flex-col gap-2 border-t border-white/10 bg-black/40 p-4 font-mono text-[10px] text-[#A0A0A0] md:flex-row md:items-center md:justify-between">
                            <span className="uppercase tracking-widest">{section.imageMatch.caption || section.imageMatch.alt}</span>
                            {section.imageMatch.credit && (
                              <div className="flex items-center gap-3 flex-wrap">
                                <span>{section.imageMatch.credit}</span>
                                {section.imageMatch.sourceUrl && (
                                  <a
                                    href={section.imageMatch.sourceUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-black uppercase tracking-widest text-[#FF5C00] transition-colors hover:text-[#FF7A33]"
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
              <div className="mt-12 border-t border-white/10 pt-8">
                <h3 className="mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#FF5C00]">
                  <Zap className="w-4 h-4" /> RELATED GUIDES
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
                      <Link key={i} href={link.startsWith('/') ? link : `/${link}`} className="rounded border border-white/10 bg-black/40 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/70 transition-colors hover:border-[#FF5C00]/50 hover:text-[#FF5C00]">
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
        <div className="flex flex-col gap-8">
          {nextSteps.length > 0 && (
            <div className="fpv-public-panel rounded-xl p-6 bg-[#050810]/70">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#FF5C00]">
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
                    className="group block rounded border border-white/5 bg-black/40 p-4 transition-all hover:border-[#FF5C00]/50"
                  >
                    <div className="text-[10px] font-mono text-[#A0A0A0] uppercase mb-1">
                      {step.metadata?.difficulty} &bull; {step.category}
                    </div>
                    <div className="font-bold text-white transition-colors group-hover:text-[#FF5C00]">
                      {step.title}
                    </div>
                  </DiscoveryLink>
                ))}
              </div>
            </div>
          )}

          {relatedContent.length > 0 && (
            <div className="fpv-public-panel rounded-xl p-6 bg-[#050810]/70">
              <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#FF5C00]">
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
                    className="group relative block overflow-hidden rounded border border-white/5 bg-black/40 p-4 transition-all hover:border-[#FF5C00]/50"
                  >
                    {rel.media?.coverImage?.src && (
                      <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Image src={rel.media.coverImage.src} alt="" fill className="object-cover" unoptimized />
                      </div>
                    )}
                    <div className="relative z-10">
                      <div className="mb-1 font-mono text-[10px] uppercase text-[#FF5C00]">
                        {rel.metadata?.topics?.[0] || 'ARTICLE'}
                      </div>
                      <div className="line-clamp-2 text-sm font-bold text-white transition-colors group-hover:text-[#FF5C00]">
                        {rel.title}
                      </div>
                    </div>
                  </DiscoveryLink>
                ))}
              </div>
            </div>
          )}
        </div>
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
      <div className="fpv-public-shell mx-auto max-w-7xl px-4 py-12 pt-28 sm:px-6 lg:px-8">
        <CyberBreadcrumb items={[
          { label: 'Content', href: '/#latest' },
          { label: seed.category, href: categoryHref(seed.category) },
          { label: seed.title, isCurrentPage: true },
        ]} className="mb-8" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <article className="lg:col-span-8 col-span-1 border border-white/5 bg-zinc-950 rounded-xl overflow-hidden shadow-2xl">
            <div className="p-8 md:p-12 lg:p-16 pt-12 relative z-10">
              <div className="flex items-center gap-2 mb-6">
                <span className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 bg-zinc-900 border border-white/10 text-zinc-300 rounded">{seed.category}</span>
                <span className="text-[10px] uppercase font-bold tracking-widest px-3 py-1 bg-[#FF5C00]/10 border border-[#FF5C00]/20 text-[#FF5C00] rounded">Editorial Plan</span>
                {seed.tier === 'pillar' && (
                  <span className="rounded border border-[#FF5C00]/20 bg-[#FF5C00]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-[#FF5C00]">Pillar</span>
                )}
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-zinc-100 mb-6 leading-[1.1]">{seed.title}</h1>
              <p className="text-xl md:text-2xl text-zinc-400 mb-6 font-sans leading-relaxed">{seed.summary}</p>
              <p className="text-base text-zinc-500 mb-10 leading-relaxed font-serif">{seed.whyThisMatters}</p>

              <div className="mb-10 flex items-center gap-4 border-b border-white/10 pb-6 text-[10px] font-black uppercase tracking-widest text-[#A0A0A0]">
                <span className="flex items-center gap-1.5"><BookOpen className="w-3 h-3 text-[#FF5C00]" /> FPVLovers Editorial Plan</span>
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

              <div className="mt-8 border-t border-white/10 pt-6">
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
    { label: insight.category, href: categoryHref(insight.category) },
    { label: insight.title, isCurrentPage: true }
  ];

  return (
    <div className="fpv-public-shell mx-auto max-w-7xl px-4 py-12 pt-28 sm:px-6 lg:px-8">
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <article className="fpv-public-panel relative col-span-1 overflow-hidden rounded-xl bg-[#050810]/70 lg:col-span-8">
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
               <span className="rounded border border-[#FF5C00]/40 bg-black/80 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-[#FF5C00] backdrop-blur-md">
                  {insight.category}
               </span>
             </div>
          </div>
        )}

        <div className={`p-8 md:p-12 ${!insight.imageUrl ? 'pt-12' : 'relative z-10 -mt-20'} relative z-10`}>
           <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-white mb-6 leading-tight">
             {insight.title}
           </h1>

           <div className="mb-10 flex items-center gap-4 border-b border-white/10 pb-6 text-[10px] font-black uppercase tracking-widest text-zinc-400">
              <span className="flex items-center gap-1.5"><Cpu className="w-3 h-3" /> LEGACY SOURCE</span>
              <span className="flex items-center gap-1.5 text-[#FF5C00]"><Shield className="w-3 h-3" /> ARCHIVED</span>
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

           <div className="relative mb-10 rounded border border-white/10 bg-[#050810]/80 p-6">
              <div className="absolute inset-0 carbon-grid opacity-10 pointer-events-none" />
              <h3 className="relative z-10 mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#FF5C00]">
                <Zap className="w-4 h-4" /> TECHNICAL SPECIFICATIONS
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 {Object.entries(insight.technicalSpecs).map(([key, value]) => (
                   <div key={key} className="flex flex-col p-3 rounded bg-black/40 border border-white/5">
                      <span className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{key}</span>
                      <span className="mt-1 text-sm font-black tracking-tight text-zinc-100">{value}</span>
                   </div>
                 ))}
              </div>
           </div>

           <div className="-mx-8 -mb-8 mt-8 flex flex-col items-center justify-between border-t border-white/10 bg-gradient-to-r from-transparent to-[#FF5C00]/5 p-8 sm:-mx-12 sm:-mb-12 sm:flex-row sm:items-end">
              <div className="absolute inset-0 bg-[#FF5C00]/5 pointer-events-none mix-blend-screen" />
              <div className="flex-1 mb-6 sm:mb-0 text-center sm:text-left relative z-10">
                <h4 className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-[#FF5C00]">Commercial Link</h4>
                <p className="text-[9px] text-[#A0A0A0] font-mono uppercase tracking-widest max-w-[200px] mx-auto sm:mx-0">
                   Commission may be earned. Editorial policy still applies.
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
