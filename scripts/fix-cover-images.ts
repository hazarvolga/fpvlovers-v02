import fs from 'fs';
import path from 'path';

const PUBLISHED_DIR = path.join(process.cwd(), 'content', 'published');
const files = fs.readdirSync(PUBLISHED_DIR).filter(f => f.endsWith('.json'));

let fixedCount = 0;
for (const file of files) {
  const filepath = path.join(PUBLISHED_DIR, file);
  try {
    const data = JSON.parse(fs.readFileSync(filepath, 'utf-8'));
    
    // Check if the current coverImage is the hardcoded duplicate Pexels image
    // Or if it's just generally better to use the first gallery image if available
    if (data.media) {
      if (data.media.gallery && data.media.gallery.length > 0) {
        // Only override if the coverImage is from pexels or if they want to ensure uniqueness
        // Actually let's just always prefer the first image in the gallery as coverImage 
        // to guarantee it represents the actual crawled content
        data.media.coverImage = data.media.gallery[0];
        data.coverImage = data.media.gallery[0].src;
        
        fs.writeFileSync(filepath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
        fixedCount++;
      } else {
        // If no gallery exists, and it has the bad pexels image, delete the coverImage
        // so it falls back to SVG
        if (data.media.coverImage && data.media.coverImage.src && data.media.coverImage.src.includes('30382834')) {
          delete data.media.coverImage;
          delete data.coverImage;
          fs.writeFileSync(filepath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
          fixedCount++;
        }
      }
    }
  } catch (e) {
    console.error(`Error processing ${file}:`, e);
  }
}

console.log(`Fixed ${fixedCount} files.`);
