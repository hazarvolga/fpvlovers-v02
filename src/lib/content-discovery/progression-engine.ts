import { getPublishedContentBySlugAsync, listPublishedContentAsync, type PublishedArtifact } from '@/lib/content-automation/content-reader';

// A simple progression map for beginner concepts
const progressionMap: Record<string, string[]> = {
  // Topics progression
  'setup': ['simulators', 'radio', 'first-flight'],
  'getting-started': ['simulators', 'setup', 'tools'],
  'simulators': ['radio', 'first-flight'],
  'first-flight': ['maintenance', 'acro-mode'],
  'soldering': ['wiring', 'tools'],
  'wiring': ['configuration', 'betaflight'],
  'betaflight': ['tuning', 'first-flight'],
  'elrs': ['betaflight', 'first-flight']
};

export async function getRecommendedNextSteps(sourceSlug: string): Promise<PublishedArtifact[]> {
  const source = await getPublishedContentBySlugAsync(sourceSlug);
  if (!source || !source.metadata) return [];

  // Progression is mainly useful for beginners/new-pilots
  if (source.metadata.difficulty !== 'beginner' && !source.metadata.audience?.includes('new-pilot')) {
    return [];
  }

  const allContent = await listPublishedContentAsync();
  const sourceTopics = source.metadata.topics || [];

  // Find progression topics based on current article's topics
  const targetTopics = new Set<string>();
  for (const topic of sourceTopics) {
    if (progressionMap[topic]) {
      progressionMap[topic].forEach((t: string) => targetTopics.add(t));
    }
  }

  if (targetTopics.size === 0) return [];

  // Find articles that match the target progression topics and are also beginner/intermediate friendly
  const recommended = allContent
    .filter((a: PublishedArtifact) => a.slug !== sourceSlug && a.metadata)
    .filter((a: PublishedArtifact) => {
      const isBeginnerFriendly = a.metadata!.difficulty === 'beginner' || a.metadata!.difficulty === 'intermediate' || a.metadata!.audience?.includes('new-pilot');
      if (!isBeginnerFriendly) return false;

      // Ensure it covers one of the target progression topics
      return a.metadata!.topics?.some((t: string) => targetTopics.has(t));
    });

  // Sort by difficulty (beginner first) then by whether it's a guide
  recommended.sort((a: PublishedArtifact, b: PublishedArtifact) => {
    if (a.metadata!.difficulty === 'beginner' && b.metadata!.difficulty !== 'beginner') return -1;
    if (a.metadata!.difficulty !== 'beginner' && b.metadata!.difficulty === 'beginner') return 1;
    if (a.metadata!.contentType === 'guide' && b.metadata!.contentType !== 'guide') return -1;
    if (a.metadata!.contentType !== 'guide' && b.metadata!.contentType === 'guide') return 1;
    return 0;
  });

  // Return up to 3 next steps
  return recommended.slice(0, 3);
}
