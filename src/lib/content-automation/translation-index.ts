import type { PublishedArtifact } from './content-reader';

/** Turkish artifacts keyed by the English slug they translate; ignores same-slug coincidence. */
export function indexTranslationsBySource(
  translations: readonly PublishedArtifact[],
  isIndexable: (article: PublishedArtifact) => boolean = () => true,
): Map<string, PublishedArtifact> {
  const index = new Map<string, PublishedArtifact>();
  for (const article of translations) {
    if (!article.slug || !article.translationOf) continue;
    if (!isIndexable(article)) continue;
    index.set(article.translationOf, article);
  }
  return index;
}
