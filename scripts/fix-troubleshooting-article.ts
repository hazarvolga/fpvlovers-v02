import fs from 'fs';
import path from 'path';
import { cleanSectionContent } from '../src/lib/content-automation/parse-generated-content';

const PUBLISHED_DIR = path.join(process.cwd(), 'content', 'published');
const SLUG = 'no-video-in-fpv-a-beginner-troubleshooting-checklist';
const JSON_PATH = path.join(PUBLISHED_DIR, `${SLUG}.json`);
const MD_PATH = path.join(PUBLISHED_DIR, `${SLUG}.md`);

function main() {
  console.log('--- FIXING TROUBLESHOOTING ARTICLE ---');

  if (!fs.existsSync(JSON_PATH)) {
    console.error(`JSON file not found at: ${JSON_PATH}`);
    process.exit(1);
  }

  const rawJson = fs.readFileSync(JSON_PATH, 'utf-8');
  const article = JSON.parse(rawJson);

  console.log(`Original section content preview:`);
  console.log(article.bodySections[0].content.slice(0, 150) + '...');

  // Apply cleanSectionContent
  article.bodySections = article.bodySections.map((section: any) => {
    return {
      ...section,
      content: cleanSectionContent(section.content)
    };
  });

  console.log(`\nCleaned section content preview:`);
  console.log(article.bodySections[0].content.slice(0, 150) + '...');

  // Save JSON
  fs.writeFileSync(JSON_PATH, JSON.stringify(article, null, 2) + '\n', 'utf-8');
  console.log(`✓ Updated JSON: ${JSON_PATH}`);

  // Re-generate MD in exactly the same beautiful standard format
  const filteredNotes = (article.publishNotes || []).filter(
    (note: string) =>
      note !== 'Schema generated' &&
      note !== 'Affiliate analysis generated' &&
      note !== 'SEO research generated'
  );

  const mdSections = article.bodySections.map((section: any) => {
    const imgMd = section.imageMatch
      ? `\n\n![${section.imageMatch.alt}](${section.imageMatch.src})\n_${section.imageMatch.caption || section.imageMatch.alt}_`
      : '';
    return `## ${section.title}\n\n${section.content}${imgMd}\n`;
  });

  const markdown = [
    `# ${article.title}`,
    '',
    `> ${article.excerpt}`,
    '',
    ...mdSections,
    ...(filteredNotes.length > 0
      ? ['', '---', '', ...filteredNotes.map((note: string) => `_${note}_`)]
      : []),
  ].join('\n');

  fs.writeFileSync(MD_PATH, markdown + '\n', 'utf-8');
  console.log(`✓ Updated Markdown: ${MD_PATH}`);

  console.log('--- DONE ---');
}

main();
