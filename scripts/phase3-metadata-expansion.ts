import fs from 'fs';
import path from 'path';
import {
  contentTypes,
  type ContentMetadata,
  type ContentType,
} from '../src/lib/content-metadata';

const CONTENT_DIR = path.join(process.cwd(), 'content', 'published');

interface PublishedJson {
  title: string;
  slug: string;
  category?: string;
  contentType?: string;
  template?: string;
  tags?: string[];
  metadata?: ContentMetadata & { category?: string };
  [key: string]: unknown;
}

const allowedContentTypes = new Set<string>(contentTypes);

function normalizeCategory(category?: string): string | undefined {
  return category === 'Buyers Guides' ? 'Buyer Guides' : category;
}

function inferContentType(json: PublishedJson, textToSearch: string): ContentType {
  const existing = json.metadata?.contentType;
  if (existing) return existing;
  if (json.contentType && allowedContentTypes.has(json.contentType)) {
    return json.contentType as ContentType;
  }

  const category = normalizeCategory(json.category)?.toLowerCase();
  if (category === 'reviews' || textToSearch.includes(' review')) return 'review';
  if (category === 'comparisons') return 'comparison';
  if (category === 'buyer guides') return 'buyer-guide';
  if (textToSearch.includes('reference') || textToSearch.includes('glossary')) return 'reference';
  if (textToSearch.includes('tutorial') || textToSearch.includes('how to') || textToSearch.includes('guide') || textToSearch.includes('masterclass')) return 'tutorial';
  if (category === 'racing' || json.template === 'community-roundup') return 'news';
  if (textToSearch.includes('news') || textToSearch.includes('update') || textToSearch.includes('report')) return 'news';
  return 'guide';
}

// Simple heuristic mapper
function inferMetadata(json: PublishedJson): ContentMetadata {
  const meta: ContentMetadata = {
    topics: [],
    components: [],
    audience: [],
    discipline: []
  };

  const textToSearch = (json.title + ' ' + json.slug + ' ' + (json.tags?.join(' ') || '')).toLowerCase();

  // Difficulty
  if (textToSearch.includes('beginner') || textToSearch.includes('start') || textToSearch.includes('basics')) {
    meta.difficulty = 'beginner';
  } else if (textToSearch.includes('advanced') || textToSearch.includes('pro ') || textToSearch.includes('masterclass') || textToSearch.includes('engineering') || textToSearch.includes('physics')) {
    meta.difficulty = 'advanced';
  } else {
    meta.difficulty = 'intermediate';
  }

  meta.contentType = inferContentType(json, textToSearch);

  // Audience
  if (meta.difficulty === 'beginner') meta.audience!.push('new-pilot');
  if (textToSearch.includes('build') || textToSearch.includes('solder') || textToSearch.includes('wiring') || textToSearch.includes('anatomy') || textToSearch.includes('stopper')) meta.audience!.push('builder');
  if (textToSearch.includes('race') || textToSearch.includes('multigp') || textToSearch.includes('racing')) meta.audience!.push('racer');
  if (textToSearch.includes('cinematic') || textToSearch.includes('gopro') || textToSearch.includes('camera') || textToSearch.includes('surfing') || textToSearch.includes('orbit')) meta.audience!.push('cinematographer');
  if (textToSearch.includes('buy') || textToSearch.includes('best') || textToSearch.includes('review') || textToSearch.includes('buyers')) meta.audience!.push('buyer');
  if (meta.audience!.length === 0) meta.audience!.push('pilot');

  // Discipline
  if (textToSearch.includes('race') || textToSearch.includes('racing')) meta.discipline!.push('racing');
  if (textToSearch.includes('cinematic') || textToSearch.includes('film') || textToSearch.includes('orbit')) meta.discipline!.push('cinematic');
  if (textToSearch.includes('long range') || textToSearch.includes('crossfire') || textToSearch.includes('gps') || textToSearch.includes('surfing') || textToSearch.includes('rescue')) meta.discipline!.push('long-range');
  if (textToSearch.includes('whoop') || textToSearch.includes('indoor') || textToSearch.includes('micro')) meta.discipline!.push('whoop');
  if (meta.discipline!.length === 0) meta.discipline!.push('general');

  // Topics
  const topicKeywords = ['betaflight', 'elrs', 'setup', 'tuning', 'soldering', 'wiring', 'troubleshooting', 'faa', 'regulations', 'remote-id', 'simulators', 'batteries', 'getting-started', 'electronics', 'maintenance'];
  topicKeywords.forEach(t => {
    if (textToSearch.includes(t)) meta.topics!.push(t);
  });
  if (meta.topics!.length === 0) {
    if (textToSearch.includes('pid') || textToSearch.includes('filter')) meta.topics!.push('tuning');
    else if (textToSearch.includes('lipo') || textToSearch.includes('battery')) meta.topics!.push('batteries');
    else meta.topics!.push('general-knowledge');
  }

  // Components
  const componentKeywords = ['motor', 'esc', 'receiver', 'gps', 'goggles', 'radio', 'flight-controller', 'vtx', 'camera', 'frame', 'propellers', 'rtf-kit', 'simulator'];
  componentKeywords.forEach(c => {
    if (textToSearch.includes(c)) meta.components!.push(c);
    // special cases
    if (c === 'flight-controller' && textToSearch.includes('fc')) meta.components!.push('flight-controller');
  });
  // deduplicate
  meta.components = Array.from(new Set(meta.components));

  const existing = json.metadata;
  return {
    ...meta,
    ...existing,
    difficulty: existing?.difficulty ?? meta.difficulty,
    contentType: existing?.contentType ?? meta.contentType,
    topics: existing?.topics?.length ? existing.topics : meta.topics,
    audience: existing?.audience?.length ? existing.audience : meta.audience,
    discipline: existing?.discipline?.length ? existing.discipline : meta.discipline,
    components: existing?.components ?? meta.components,
  };
}

async function runMetadataExpansion() {
  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.json'));
  let updatedCount = 0;

  for (const file of files) {
    const filePath = path.join(CONTENT_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const json = JSON.parse(content) as PublishedJson;
    const slug = json.slug || file.replace('.json', '');
    const before = JSON.stringify(json);
    const category = normalizeCategory(json.category);

    json.category = category;
    const metadata: ContentMetadata & { category?: string } = inferMetadata(json);
    if (category === 'Buyer Guides') metadata.category = category;
    else delete metadata.category;
    json.metadata = metadata;

    if (JSON.stringify(json) !== before) {
      fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
      updatedCount++;
      console.log(`[+] Completed metadata: ${slug}`);
    }
  }

  console.log(`\nMetadata migration completed for ${updatedCount} artifact(s).`);
}

runMetadataExpansion().catch(console.error);
