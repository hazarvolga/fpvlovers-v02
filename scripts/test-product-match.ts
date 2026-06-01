import { listPublishedContent } from '../src/lib/content-automation/content-reader';

async function main() {
  console.log('Fetching published content...');
  const published = listPublishedContent();
  const elrsGuide = published.find(p => p.slug.includes('expresslrs-binding'));
  
  if (!elrsGuide) {
    console.error('ExpressLRS guide not found!');
    return;
  }
  
  console.log(`\nArticle: ${elrsGuide.title}`);
  console.log('Sections with matched images:');
  for (const sec of elrsGuide.bodySections) {
    if (sec.imageMatch) {
      console.log(`- Section "${sec.title}" has image:`);
      console.log(`  * SRC: ${sec.imageMatch.src}`);
      console.log(`  * ALT: ${sec.imageMatch.alt}`);
      console.log(`  * CAPTION: ${sec.imageMatch.caption}`);
    } else {
      console.log(`- Section "${sec.title}" has NO image`);
    }
  }
}

main();
