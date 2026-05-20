import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchDifyInsights } from '@/lib/dify';
import { getPublishedContentBySlug } from '@/lib/content-automation/content-reader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AffiliateButton } from '@/features/monetization/components/AffiliateButton';
import { AdZone } from '@/features/monetization/components/AdZone';
import { AdStickySidebar } from '@/features/monetization/components/NativeAds';
import { ArrowLeft, Cpu, Shield, Zap, FileText } from 'lucide-react';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';

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

  const insights = await fetchDifyInsights();
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

function PublishedArticle({ article }: { article: ReturnType<typeof getPublishedContentBySlug> & object }) {
  const a = article as any;
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
              <span className="flex items-center gap-1.5"><FileText className="w-3 h-3 text-[#00FF66]" /> FPVLovers AutoBlog</span>
              {a.publishedAt && (
                <span>{new Date(a.publishedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              )}
            </div>

            <div className="prose prose-invert max-w-none text-white/70 antialiased leading-relaxed mb-12 prose-headings:text-white prose-a:text-[#00F5FF] prose-strong:text-white/90 prose-li:text-white/60 prose-code:text-[#00FF66]">
              {a.bodySections?.map((section: { id: string; title: string; content: string }) => (
                <section key={section.id} className="mb-10">
                  {section.title && section.title !== a.title && (
                    <h2 className="text-2xl font-bold text-white mt-0 mb-4">{section.title}</h2>
                  )}
                  <div
                    className="space-y-4"
                    dangerouslySetInnerHTML={{
                      __html: section.content
                        .replace(/^# /gm, '### ')
                        .replace(/^## /gm, '### ')
                        .replace(/^### /gm, '#### ')
                        .replace(/\n\n/g, '</p><p>')
                        .replace(/^/, '<p>')
                        .replace(/$/, '</p>')
                        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                        .replace(/\*(.+?)\*/g, '<em>$1</em>')
                        .replace(/- (.+)/g, '<li>$1</li>')
                        .replace(/(<li>.*<\/li>)/, '<ul>$1</ul>'),
                    }}
                  />
                </section>
              )) || (
                <p className="text-white/50 italic">No content sections available for this article.</p>
              )}
            </div>

            {a.internalLinks?.length > 0 && (
              <div className="border-t border-[#00F5FF]/10 pt-6 mt-8">
                <h3 className="text-[10px] uppercase font-bold tracking-widest text-[#FFB800] mb-4">Related Content</h3>
                <div className="flex flex-wrap gap-2">
                  {a.internalLinks.map((link: string, i: number) => (
                    <Link key={i} href={link.startsWith('/') ? link : `/${link}`} className="text-xs font-mono text-[#00F5FF] hover:text-white transition-colors px-3 py-1 border border-[#00F5FF]/20 rounded">
                      {link}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {a.publishNotes?.length > 0 && (
              <div className="border-t border-white/5 pt-6 mt-8">
                {a.publishNotes.map((note: string, i: number) => (
                  <p key={i} className="text-[10px] text-[#A0A0A0] font-mono italic">{note}</p>
                ))}
              </div>
            )}
          </div>
        </article>

        <aside className="lg:col-span-4 col-span-1 hidden lg:flex flex-col gap-6 w-full h-full">
          <AdStickySidebar />
        </aside>
      </div>
    </div>
  );
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = await params;

  const published = getPublishedContentBySlug(resolvedParams.slug);
  if (published) {
    return <PublishedArticle article={published} />;
  }

  const insights = await fetchDifyInsights();
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
    </div>
  );
}
