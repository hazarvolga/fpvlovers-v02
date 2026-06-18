import { getPublishedContentBySlugAsync, listPublishedContentAsync, type PublishedArtifact } from '@/lib/content-automation/content-reader';

export async function getRelatedContent(sourceSlug: string, maxResults = 8): Promise<PublishedArtifact[]> {
  const source = await getPublishedContentBySlugAsync(sourceSlug);
  if (!source) return [];

  const allContent = await listPublishedContentAsync();
  const sourceMeta = source.metadata;

  let scoredContent: { article: PublishedArtifact; score: number }[] = [];

  if (sourceMeta) {
    scoredContent = allContent
      .filter((a: PublishedArtifact) => a.slug !== sourceSlug && a.metadata)
      .map((a: PublishedArtifact) => {
        const targetMeta = a.metadata!;
        let score = 0;

        // topics (5pts)
        if (sourceMeta.topics && targetMeta.topics) {
          const commonTopics = sourceMeta.topics.filter(t => targetMeta.topics!.includes(t));
          score += commonTopics.length * 5;
        }

        // components (4pts)
        if (sourceMeta.components && targetMeta.components) {
          const commonComponents = sourceMeta.components.filter(c => targetMeta.components!.includes(c));
          score += commonComponents.length * 4;
        }

        // discipline (3pts)
        if (sourceMeta.discipline && targetMeta.discipline) {
          const commonDiscipline = sourceMeta.discipline.filter(d => targetMeta.discipline!.includes(d));
          score += commonDiscipline.length * 3;
        }

        // audience (2pts)
        if (sourceMeta.audience && targetMeta.audience) {
          const commonAudience = sourceMeta.audience.filter(aud => targetMeta.audience!.includes(aud));
          score += commonAudience.length * 2;
        }

        // difficulty (1pt)
        if (sourceMeta.difficulty && targetMeta.difficulty && sourceMeta.difficulty === targetMeta.difficulty) {
          score += 1;
        }

        // Commercial content boost (+10 pts) if it matches on topics or components
        const isCommercial = ['review', 'comparison', 'buyer-guide', 'product-roundup'].includes(targetMeta.contentType || '');
        if (isCommercial) {
          const hasCommonTopic = sourceMeta.topics && targetMeta.topics && sourceMeta.topics.some(t => targetMeta.topics!.includes(t));
          const hasCommonComponent = sourceMeta.components && targetMeta.components && sourceMeta.components.some(c => targetMeta.components!.includes(c));
          if (hasCommonTopic || hasCommonComponent) {
            score += 10;
          }
        }

        return { article: a, score };
      })
      .filter((sc: { article: PublishedArtifact; score: number }) => sc.score > 0)
      .sort((a: { article: PublishedArtifact; score: number }, b: { article: PublishedArtifact; score: number }) => b.score - a.score);
  }

  const results = scoredContent.slice(0, maxResults).map((sc: { article: PublishedArtifact; score: number }) => sc.article);

  // Fallback 1: Same category
  if (results.length < maxResults) {
    const familyContent = allContent
      .filter((a: PublishedArtifact) => a.slug !== sourceSlug && !results.some((r: PublishedArtifact) => r.slug === a.slug) && a.category === source.category);

    for (const item of familyContent) {
      if (results.length >= maxResults) break;
      results.push(item);
    }
  }

  // Fallback 2: Latest articles
  if (results.length < maxResults) {
    const remaining = allContent.filter((a: PublishedArtifact) => a.slug !== sourceSlug && !results.some((r: PublishedArtifact) => r.slug === a.slug));
    for (const item of remaining) {
      if (results.length >= maxResults) break;
      results.push(item);
    }
  }

  return results;
}
