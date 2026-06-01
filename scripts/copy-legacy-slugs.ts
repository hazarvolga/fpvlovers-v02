import fs from 'fs';
import path from 'path';

const PUBLISHED_DIR = path.join(process.cwd(), 'content', 'published');

const SLUG_MAPPING = {
  'fpv-goggles-buying-guide-analog-vs-digital-for-beginners': 'fpv-goggles-buyers-guide',
  'fpv-lipo-battery-safety-charging-guide-prevent-fires-and-fly-longer': 'lipo-battery-safety-guide',
  'how-to-choose-fpv-motors-understanding-kv-stator-size-and-propeller-matching': 'fpv-motors-kv-and-stator-explained',
  'soldering-guide-for-fpv-drone-builders-solder-pads-temperature-and-tools': 'fpv-soldering-masterclass',
  'betaflight-pid-basics-for-beginners-start-with-the-right-mental-model': 'betaflight-pid-basics',
  'no-video-in-fpv-a-beginner-troubleshooting-checklist': 'no-video-troubleshooting-guide',
  'gps-rescue-mode-setup-in-betaflight-never-lose-a-drone-to-a-failsafe': 'gps-rescue-setup-guide'
};

function copyFile(legacySlug: string, newSlug: string) {
  const legacyJsonPath = path.join(PUBLISHED_DIR, `${legacySlug}.json`);
  const newJsonPath = path.join(PUBLISHED_DIR, `${newSlug}.json`);
  const legacyMdPath = path.join(PUBLISHED_DIR, `${legacySlug}.md`);
  const newMdPath = path.join(PUBLISHED_DIR, `${newSlug}.md`);

  if (!fs.existsSync(legacyJsonPath)) {
    console.warn(`⚠ Legacy JSON file missing: ${legacyJsonPath}`);
    return;
  }

  // 1. Copy JSON and update internal properties
  try {
    const rawJson = fs.readFileSync(legacyJsonPath, 'utf-8');
    const parsed = JSON.parse(rawJson);
    parsed.slug = newSlug;
    if (parsed.seo) {
      parsed.seo.slug = newSlug;
    }
    if (parsed.media && parsed.media.coverImage && parsed.media.coverImage.src) {
      parsed.media.coverImage.src = `/api/content/media/cover/${newSlug}?v=cover-v2`;
    }
    fs.writeFileSync(newJsonPath, JSON.stringify(parsed, null, 2) + '\n', 'utf-8');
    console.log(`✓ Copied JSON: ${legacySlug} -> ${newSlug}`);
  } catch (err: any) {
    console.error(`✗ Failed to copy JSON for ${legacySlug}:`, err.message);
  }

  // 2. Copy MD
  if (fs.existsSync(legacyMdPath)) {
    try {
      const rawMd = fs.readFileSync(legacyMdPath, 'utf-8');
      fs.writeFileSync(newMdPath, rawMd, 'utf-8');
      console.log(`✓ Copied MD: ${legacySlug} -> ${newSlug}`);
    } catch (err: any) {
      console.error(`✗ Failed to copy MD for ${legacySlug}:`, err.message);
    }
  }
}

function main() {
  console.log('Starting legacy slug compatibility mapping...');
  for (const [legacy, simplified] of Object.entries(SLUG_MAPPING)) {
    copyFile(legacy, simplified);
  }
  console.log('✓ Compatibility mapping complete.');
}

main();
