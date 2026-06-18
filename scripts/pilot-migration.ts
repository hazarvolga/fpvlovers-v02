import fs from 'fs';
import path from 'path';

const PUBLISHED_DIR = path.join(process.cwd(), 'content', 'published');

const pilotFiles = {
  'fpv-beginner-setup-guide-the-easiest-way-to-get-flying.json': {
    difficulty: 'beginner',
    contentType: 'guide',
    topics: ['setup', 'getting-started'],
    audience: ['new-pilot'],
    discipline: ['general'],
    components: ['rtf-kit', 'radio', 'goggles']
  },
  'fpv-components-wiring-guide.json': {
    difficulty: 'intermediate',
    contentType: 'guide',
    topics: ['wiring', 'electronics'],
    audience: ['builder'],
    discipline: ['general'],
    components: ['flight-controller', 'esc', 'vtx', 'receiver']
  },
  'fpv-soldering-masterclass.json': {
    difficulty: 'intermediate',
    contentType: 'tutorial',
    topics: ['soldering', 'maintenance'],
    audience: ['builder'],
    discipline: ['general'],
    components: ['soldering-iron', 'flux']
  },
  'cinematic-fpv-orbit-techniques.json': {
    difficulty: 'advanced',
    contentType: 'guide',
    topics: ['flying-techniques', 'cinematography'],
    audience: ['pilot', 'cinematographer'],
    discipline: ['cinematic'],
    components: ['action-camera']
  },
  'multigp-2026-season-kicks-off-with-global-qualifier-registration-and-new-series.json': {
    difficulty: 'beginner',
    contentType: 'news',
    topics: ['events', 'tournaments'],
    audience: ['racer', 'pilot'],
    discipline: ['racing'],
    components: []
  },
  'betaflight-firmware-tuning-complete-setup-guide.json': {
    difficulty: 'intermediate',
    contentType: 'tutorial',
    topics: ['betaflight', 'configuration', 'tuning'],
    audience: ['pilot', 'builder'],
    discipline: ['general'],
    components: ['flight-controller']
  },
  'expresslrs-binding-and-flashing-guide-step-by-step-for-edgetx-betaflight.json': {
    difficulty: 'intermediate',
    contentType: 'guide',
    topics: ['elrs', 'binding', 'flashing', 'edgetx'],
    audience: ['pilot', 'builder'],
    discipline: ['general'],
    components: ['radio', 'receiver']
  },
  '2025-drone-champions-league-standings-update.json': {
    difficulty: 'beginner',
    contentType: 'news',
    topics: ['esports', 'standings'],
    audience: ['racer', 'pilot'],
    discipline: ['racing'],
    components: []
  },
  'fpv-regulations-for-beginners-in-the-united-states.json': {
    difficulty: 'beginner',
    contentType: 'reference',
    topics: ['regulations', 'faa', 'remote-id'],
    audience: ['new-pilot', 'pilot'],
    discipline: ['general'],
    components: []
  },
  'the-best-fpv-simulators-in-2026-save-cash-and-log-hours-virtually.json': {
    difficulty: 'beginner',
    contentType: 'review',
    topics: ['simulators', 'training'],
    audience: ['new-pilot', 'buyer'],
    discipline: ['general'],
    components: ['simulator', 'radio']
  }
};

async function migrate() {
  for (const [filename, metadata] of Object.entries(pilotFiles)) {
    const filePath = path.join(PUBLISHED_DIR, filename);
    if (!fs.existsSync(filePath)) {
      console.warn(`File not found: ${filename}`);
      continue;
    }
    const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    content.metadata = metadata;
    fs.writeFileSync(filePath, JSON.stringify(content, null, 2), 'utf-8');
    console.log(`Updated: ${filename}`);
  }
}

migrate().catch(console.error);
