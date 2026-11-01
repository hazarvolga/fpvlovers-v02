import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, BookOpen, Cpu, Zap } from 'lucide-react';
import { LevelBadge } from '@/components/ui/level-badge';
import { MarkdownRenderer } from '@/components/MarkdownRenderer';
import { CyberBreadcrumb } from '@/features/navigation/components/Breadcrumb';
import { ResilientArticleCover } from '@/features/content/components/ResilientArticleCover';
import { AdStickySidebar } from '@/features/monetization/components/NativeAds';
import { getGuideGroup, getGuideGroupLabel } from '@/lib/content-taxonomy';
import {
  getArtifactWordCount,
  getPublishedContentBySlugAsync,
  isIndexablePublishedArtifact,
  listPublishedContentAsync,
  type PublishedArtifact,
} from '@/lib/content-automation/content-reader';
import { resolveFallbackCover } from '@/lib/content-automation/fallback-cover';
import { generateArticleSchema } from '@/lib/seo/metadata';
import { buildArticleAlternates } from '@/lib/seo/article-alternates';
import { localizeArticleLink, localizeArticlePath, localizePath } from '@/lib/i18n/locale';

function categoryLabel(category: string | undefined): string {
  const group = getGuideGroup(category);
  return group ? getGuideGroupLabel(group, 'tr') : category || 'Makale';
}

function categoryHref(category: string | undefined): string {
  const group = getGuideGroup(category);
  return group ? `/tr/guides?topic=${group.id}` : '/tr/guides';
}

function contentLink(link: string, translatedSlugs: ReadonlySet<string>): string {
  return link.includes('/article/')
    ? localizeArticleLink(link, 'tr', translatedSlugs)
    : localizePath(link, 'tr');
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getPublishedContentBySlugAsync(slug, 'tr');
  if (!article) {
    return { title: 'Sayfa Bulunamadı | FPVLovers', robots: { index: false, follow: false } };
  }

  const englishSource = article.translationOf
    ? await getPublishedContentBySlugAsync(article.translationOf, 'en')
    : null;
  const canonical = localizeArticlePath(article.slug, 'tr');
  const languages = buildArticleAlternates(article.slug, Boolean(englishSource), true);
  const image = article.media?.coverImage?.src;
  const description = article.excerpt || article.seo.metaDescription;

  return {
    title: `${article.title} | FPVLovers`,
    description,
    keywords: article.seo.keywords,
    alternates: Object.keys(languages).length > 0 ? { canonical, languages } : { canonical },
    robots: isIndexablePublishedArtifact(article)
      ? { index: true, follow: true }
      : { index: false, follow: true },
    openGraph: {
      type: 'article' as const,
      url: canonical,
      title: article.title,
      description,
      publishedTime: article.publishedAt,
      locale: 'tr_TR',
      images: image ? [{ url: image, alt: article.media?.coverImage?.alt || article.title }] : [],
    },
    twitter: {
      card: 'summary_large_image' as const,
      title: article.title,
      description,
      images: image ? [image] : [],
    },
  };
}

function TurkishArticle({
  article,
  translatedSlugs,
}: {
  article: PublishedArtifact;
  translatedSlugs: ReadonlySet<string>;
}) {
  const a = article;
  const fallbackCover = resolveFallbackCover({
    category: a.category,
    metadata: a.metadata,
    title: a.title,
    slug: a.slug,
  });
  const baseUrl = process.env.APP_URL || 'https://fpvlovers.com.tr';
  const articleUrl = `${baseUrl}${localizeArticlePath(a.slug, 'tr')}`;
  const evidenceSources = a.editorial?.contentClass === 'product-review'
    ? a.editorial.evidenceSources.filter((source) => /^https?:\/\//i.test(source))
    : [];
  const sourceReferences = (a.sourceReferences || evidenceSources).filter((source) => /^https?:\/\//i.test(source));
  const coverImageSrc = a.media?.coverImage?.src || `/api/content/media/cover/${encodeURIComponent(a.slug)}?locale=tr`;
  const absoluteCoverImage = /^https?:\/\//i.test(coverImageSrc) ? coverImageSrc : `${baseUrl}${coverImageSrc}`;
  const articleSchema = {
    ...generateArticleSchema({
      title: a.title,
      description: a.excerpt || a.seo.metaDescription,
      url: articleUrl,
      datePublished: a.publishedAt,
      dateModified: a.publishedAt,
      image: absoluteCoverImage,
      section: categoryLabel(a.category),
      wordCount: getArtifactWordCount(a),
      citations: sourceReferences,
      inLanguage: 'tr',
    }),
    mainEntityOfPage: { '@type': 'WebPage', '@id': articleUrl },
  };
  const breadcrumbs = [
    { label: 'İçerik', href: '/tr' },
    { label: categoryLabel(a.category), href: categoryHref(a.category) },
    { label: a.title, isCurrentPage: true },
  ];
  const breadcrumbSchema = {
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      ...(item.isCurrentPage ? { item: articleUrl } : { item: `${baseUrl}${item.href}` }),
    })),
  };
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [articleSchema, breadcrumbSchema],
  };
  const safeJsonLd = JSON.stringify(jsonLd).replace(/</g, '\\u003c');
  const sectionCount = a.bodySections?.length || 0;

  return (
    <div className="fpv-public-shell mx-auto max-w-7xl px-4 py-12 pt-28 sm:px-6 lg:px-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd }} />
      <CyberBreadcrumb items={breadcrumbs} className="mb-8" includeSchema={false} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        <div className="lg:col-span-8 col-span-1 flex flex-col gap-8 min-w-0">
          <article className="fpv-public-panel relative overflow-hidden rounded-xl bg-[#050810]/70">
            <div className="absolute inset-0 carbon-grid opacity-20 pointer-events-none" />
            {a.media?.coverImage?.src && (
              <ResilientArticleCover
                asset={a.media.coverImage}
                category={categoryLabel(a.category)}
                fallbackSrc={fallbackCover}
                title={a.title}
              />
            )}
            <div className={`p-8 md:p-12 lg:p-16 ${!a.media?.coverImage?.src ? 'pt-12' : 'pt-6 md:pt-8 lg:pt-10'} relative z-10`}>
              <div className="flex items-center gap-2 mb-6">
                <Link
                  href={categoryHref(a.category)}
                  className="rounded border border-white/10 bg-black/80 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-300 transition-colors hover:text-[#FF5C00]"
                >
                  {categoryLabel(a.category)}
                </Link>
                <LevelBadge difficulty={a.metadata?.difficulty} locale="tr" className="bg-black/80" />
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tighter text-white mb-6 leading-tight">
                {a.title}
              </h1>

              {a.excerpt && (
                <p className="mb-10 border-b border-white/10 pb-8 text-xl font-bold tracking-tight text-white/90 md:text-2xl">
                  {a.excerpt}
                </p>
              )}

              <div className="mb-12 grid grid-cols-2 gap-3 border-b border-white/10 pb-6 text-[10px] font-black uppercase tracking-widest text-zinc-400 md:grid-cols-3">
                <span className="flex items-center gap-1.5"><Cpu className="w-3 h-3" /> FPVLÖVERS EDİTÖRYAL</span>
                {a.publishedAt && (
                  <span>{new Date(a.publishedAt).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                )}
                <span>{sectionCount} bölüm</span>
              </div>

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
                                    [ Kaynağı Görüntüle ]
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
                    <Zap className="w-4 h-4" /> İLGİLİ REHBERLER
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
                        <Link
                          key={i}
                          href={contentLink(link, translatedSlugs)}
                          className="rounded border border-white/10 bg-black/40 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-white/70 transition-colors hover:border-[#FF5C00]/50 hover:text-[#FF5C00]"
                        >
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

          <div className="fpv-public-panel rounded-xl p-6 bg-[#050810]/70">
            <h3 className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-[#FF5C00]">
              <BookOpen className="w-4 h-4" /> DEVAM ET
            </h3>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/tr/guides"
                className="group flex flex-1 items-center justify-between rounded border border-white/5 bg-black/40 p-4 transition-all hover:border-[#FF5C00]/50"
              >
                <span className="font-bold text-white transition-colors group-hover:text-[#FF5C00]">Tüm rehberler</span>
                <ArrowRight className="h-4 w-4 text-zinc-500 transition-colors group-hover:text-[#FF5C00]" />
              </Link>
              <Link
                href="/tr/academy"
                className="group flex flex-1 items-center justify-between rounded border border-white/5 bg-black/40 p-4 transition-all hover:border-[#FF5C00]/50"
              >
                <span className="font-bold text-white transition-colors group-hover:text-[#FF5C00]">Akademi yol haritası</span>
                <ArrowRight className="h-4 w-4 text-zinc-500 transition-colors group-hover:text-[#FF5C00]" />
              </Link>
            </div>
          </div>
        </div>

        <aside className="lg:col-span-4 col-span-1 hidden lg:flex flex-col gap-6 w-full h-full">
          <AdStickySidebar />
        </aside>
      </div>
    </div>
  );
}

export default async function TurkishArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getPublishedContentBySlugAsync(slug, 'tr');
  if (!article) notFound();

  if (process.env.NEXT_PHASE !== 'phase-production-build') {
    import('@/lib/server/analytics-store')
      .then(({ logAnalyticsEvent }) => {
        logAnalyticsEvent({
          eventType: 'page_view',
          contentSlug: slug,
          source: 'frontend',
        });
      })
      .catch((err) => {
        console.warn('[TurkishArticlePage] Failed to log page view:', err);
      });
  }

  const translatedSlugs = new Set((await listPublishedContentAsync('tr')).map((entry) => entry.slug));
  return <TurkishArticle article={article} translatedSlugs={translatedSlugs} />;
}
