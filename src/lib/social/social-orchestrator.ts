import { createHash } from 'node:crypto';
import type { PublishedArtifact } from '@/lib/content-automation/content-reader';
import type {
  SocialFact,
  SocialFactPack,
  SocialJob,
  SocialPlatform,
  SocialVariant,
} from '@/lib/social/types';

function factId(sourceSlug: string, sectionId: string, text: string): string {
  const digest = createHash('sha256')
    .update(`${sourceSlug}:${sectionId}:${text}`)
    .digest('hex')
    .slice(0, 12);
  return `fact-${digest}`;
}

function splitFacts(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((value) => value.trim())
    .filter((value) => value.length >= 20);
}

export function buildSocialFactPack(article: PublishedArtifact): SocialFactPack {
  const candidates: Array<{ sourceSectionId: string; text: string }> = [
    { sourceSectionId: 'title', text: article.title },
    { sourceSectionId: 'excerpt', text: article.excerpt || article.seo.metaDescription },
    ...article.bodySections.flatMap((section) => splitFacts(section.content).map((text) => ({
      sourceSectionId: section.id,
      text,
    }))),
  ];
  const seen = new Set<string>();
  const facts: SocialFact[] = [];
  for (const candidate of candidates) {
    const normalized = candidate.text.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!normalized || seen.has(normalized)) continue;
    seen.add(normalized);
    facts.push({
      id: factId(article.slug, candidate.sourceSectionId, candidate.text),
      text: candidate.text,
      sourceSectionId: candidate.sourceSectionId,
    });
  }

  const contentType = article.metadata?.contentType || 'article';
  return {
    sourceSlug: article.slug,
    sourceUrl: `/article/${article.slug}`,
    title: article.title,
    contentType,
    facts,
    commercialDisclosureRequired: ['review', 'comparison', 'buyer-guide', 'product-roundup']
      .includes(contentType),
  };
}

export function createSocialJob(
  article: PublishedArtifact,
  platforms: SocialPlatform[],
  now = new Date().toISOString(),
): SocialJob {
  const uniquePlatforms = [...new Set(platforms)];
  const factPack = buildSocialFactPack(article);
  const id = createHash('sha256')
    .update(`${article.slug}:${uniquePlatforms.join(',')}`)
    .digest('hex')
    .slice(0, 16);

  return {
    id: `social-${id}`,
    sourceSlug: article.slug,
    status: 'draft',
    platforms: uniquePlatforms,
    requiresHumanApproval: factPack.contentType === 'review'
      || article.editorial?.contentClass === 'product-review',
    factPack,
    variants: buildSocialVariants(factPack, uniquePlatforms),
    createdAt: now,
    updatedAt: now,
  };
}

export function buildSocialVariants(
  factPack: SocialFactPack,
  platforms: SocialPlatform[],
): SocialVariant[] {
  const lead = factPack.facts[1]?.text || factPack.facts[0]?.text || factPack.title;
  const detail = factPack.facts[2]?.text || 'Check compatibility and current specifications before making a hardware decision.';
  const url = factPack.sourceUrl;
  const disclosure = factPack.commercialDisclosureRequired
    ? 'The linked guide may contain affiliate links.'
    : undefined;

  return platforms.map((platform) => {
    if (platform === 'x') {
      return { platform, text: `${factPack.title}\n\n${lead}\n\n${url}`, disclosure };
    }
    if (platform === 'reddit') {
      return {
        platform,
        text: `I work on FPVLovers. Here is the useful part without requiring a click:\n\n${lead}\n\n${detail}\n\nFull source and context: ${url}`,
        disclosure,
      };
    }
    if (platform === 'linkedin') {
      return {
        platform,
        text: `A better FPV hardware decision starts with the system, not one headline specification.\n\n${lead}\n\n${detail}\n\nTechnical context: ${url}`,
        disclosure,
      };
    }
    if (platform === 'instagram') {
      return { platform, text: `${factPack.title}\n\n${lead}\n\nSave this decision rule, then open the full guide from FPVLovers.`, disclosure };
    }
    if (platform === 'youtube-shorts' || platform === 'tiktok') {
      return { platform, text: `${lead}\n\nOne decision, one tradeoff, no universal winner. Full guide: ${url}`, disclosure };
    }
    return { platform, text: `${factPack.title}\n\n${lead}\n\n${detail}\n\nRead and discuss: ${url}`, disclosure };
  });
}

export type { SocialFactPack, SocialJob, SocialPlatform, SocialVariant } from '@/lib/social/types';
