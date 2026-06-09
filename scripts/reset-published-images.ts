import fs from 'fs';
import path from 'path';

const publishedDir = path.join(process.cwd(), 'content', 'published');
const files = fs.readdirSync(publishedDir).filter(f => f.endsWith('.json'));

let resetCount = 0;
for (const file of files) {
  const filePath = path.join(publishedDir, file);
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    let changed = false;
    
    if (data.bodySections) {
      for (const sec of data.bodySections) {
        if (sec.imageMatch) {
          delete sec.imageMatch;
          changed = true;
        }
      }
    }
    
    if (data.media?.gallery && data.media.gallery.length > 0) {
      data.media.gallery = [];
      changed = true;
    }
    
    if (changed) {
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
      resetCount++;
    }
  } catch (e) {
    console.error(`Error processing ${file}:`, e);
  }
}

console.log(`Reset images in ${resetCount} files.`);
