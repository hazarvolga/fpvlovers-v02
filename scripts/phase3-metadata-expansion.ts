import fs from 'fs';
import path from 'path';
import { type ContentMetadata } from '../src/lib/content-metadata';

const CONTENT_DIR = path.join(process.cwd(), 'content', 'published');

interface PublishedJson {
  title: string;
  slug: string;
  category?: string;
  tags?: string[];
  metadata?: ContentMetadata;
  [key: string]: unknown;
}

const TARGET_EVERGREEN_SLUGS = [
  // 1. Beginner & Roadmap
  'fpv-beginner-setup-guide-the-easiest-way-to-get-flying',
  'fpv-pilot-roadmap-from-simulator-to-first-flight',
  'first-hover-training',
  'acro-mode-mental-model-for-fpv-beginners',
  'best-fpv-starter-kits-2026-rtf-bundles-for-beginners',
  'fpv-glossary-complete-terms-and-acronyms-guide',

  // 2. Betaflight & Tuning
  'betaflight-firmware-tuning-complete-setup-guide',
  'betaflight-pid-basics-for-beginners-start-with-the-right-mental-model',
  'blackbox-analysis-masterclass',
  'pid-tuning-beyond-presets',
  'modern-betaflight-filter-architecture',
  'props-in-vs-props-out-betaflight-motor-direction-explained',

  // 3. Radio & ELRS
  'expresslrs-beginner-guide',
  'expresslrs-binding-and-flashing-guide-step-by-step-for-edgetx-betaflight',
  'how-to-choose-your-first-fpv-radio-without-buying-twice',
  'rf-link-engineering',

  // 4. Build, Soldering & Wiring
  'fpv-components-wiring-guide',
  'fpv-soldering-masterclass',
  'smoke-stopper-protocol',
  'drone-anatomy-complete-guide',
  'how-to-pick-the-best-5-inch-fpv-frame-durability-layout-and-weight',

  // 5. Simulators
  'the-best-fpv-simulators-in-2026-save-cash-and-log-hours-virtually',

  // 6. Video Systems & Troubleshooting
  'the-ultimate-fpv-video-ecosystem-guide-in-2026-dji-vs-walksnail-vs-hdzero-vs-analog',
  'vtx-and-camera-setup-guide-clean-video-from-the-start',
  'no-video-troubleshooting-guide',
  'video-latency-engineering',
  'fpv-goggles-buying-guide-analog-vs-digital-for-beginners',

  // 7. Batteries & Power
  'fpv-lipo-battery-safety-charging-guide-prevent-fires-and-fly-longer',
  'lihv-vs-lipo-batteries-what-beginners-need-to-know',
  'lipo-performance-engineering',

  // 8. Components & Physics
  'how-to-choose-fpv-motors-understanding-kv-stator-size-and-propeller-matching',
  'fpv-propeller-engineering',
  'motor-efficiency-engineering',
  'frame-resonance-vibration-analysis',

  // 9. Flight Discipline & Safety
  'failsafe-settings-safe-flight-practices-what-happens-when-you-lose-signal',
  'gps-rescue-setup-guide',
  'gps-rescue-reliability',
  'long-range-fpv-basics-how-to-fly-beyond-the-trees-safely',
  'fpv-mountain-surfing-flight-planning-wind-shadows-and-signal-security',

  // 10. Regulations
  'fpv-regulations-for-beginners-in-the-united-states'
];

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

  // ContentType
  if (textToSearch.includes('review')) meta.contentType = 'review';
  else if (textToSearch.includes('news') || json.category?.toLowerCase() === 'news') meta.contentType = 'news';
  else if (textToSearch.includes('tutorial') || textToSearch.includes('how to') || textToSearch.includes('guide') || textToSearch.includes('masterclass')) meta.contentType = 'tutorial';
  else meta.contentType = 'guide';

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

  return meta;
}

async function runMetadataExpansion() {
  const files = fs.readdirSync(CONTENT_DIR).filter(f => f.endsWith('.json'));
  let addedCount = 0;
  let clearedCount = 0;

  for (const file of files) {
    const filePath = path.join(CONTENT_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const json = JSON.parse(content) as PublishedJson;
    const slug = json.slug || file.replace('.json', '');

    if (TARGET_EVERGREEN_SLUGS.includes(slug)) {
      // Should have metadata
      json.metadata = inferMetadata(json);
      fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
      addedCount++;
      console.log(`[+] Added/refined metadata to target: ${slug}`);
    } else {
      // Should NOT have metadata (clean it up if it exists)
      if (json.metadata) {
        delete json.metadata;
        fs.writeFileSync(filePath, JSON.stringify(json, null, 2));
        clearedCount++;
        console.log(`[-] Cleared metadata from non-target: ${slug}`);
      }
    }
  }

  console.log(`\nMetadata footprint adjusted:`);
  console.log(`- Refined metadata on ${addedCount} evergreen targets.`);
  console.log(`- Cleared metadata on ${clearedCount} non-evergreen articles.`);
  console.log(`- Total target evergreen files in list: ${TARGET_EVERGREEN_SLUGS.length}`);
}

runMetadataExpansion().catch(console.error);
