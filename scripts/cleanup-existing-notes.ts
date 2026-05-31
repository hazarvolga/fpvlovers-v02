import fs from 'fs';
import path from 'path';

const PUBLISHED_DIR = path.join(process.cwd(), 'content', 'published');

function main() {
  console.log('--- CLEANING UP SPECIFIC PUBLISH NOTES IN EXISTING ARTICLES ---');
  
  const files = fs.readdirSync(PUBLISHED_DIR);
  const jsonFiles = files.filter(f => f.endsWith('.json'));
  
  let cleanedCount = 0;
  
  for (const file of jsonFiles) {
    const jsonPath = path.join(PUBLISHED_DIR, file);
    const mdPath = path.join(PUBLISHED_DIR, file.replace(/\.json$/, '.md'));
    
    try {
      // 1. Process JSON
      const rawJson = fs.readFileSync(jsonPath, 'utf-8');
      const data = JSON.parse(rawJson);
      
      if (Array.isArray(data.publishNotes)) {
        const filtered = data.publishNotes.filter(
          (note: string) =>
            note !== 'Schema generated' &&
            note !== 'Affiliate analysis generated' &&
            note !== 'SEO research generated'
        );
        
        if (filtered.length !== data.publishNotes.length) {
          data.publishNotes = filtered;
          fs.writeFileSync(jsonPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');
          
          // 2. Process MD if it exists
          if (fs.existsSync(mdPath)) {
            let mdContent = fs.readFileSync(mdPath, 'utf-8');
            
            // Re-render MD from JSON to keep it perfectly aligned and remove notes cleanly
            const markdown = [
              `# ${data.title}`,
              '',
              `> ${data.excerpt}`,
              '',
              ...data.bodySections.map(
                (section: any) => `## ${section.title}\n\n${section.content}\n`
              ),
              ...(filtered.length > 0
                ? ['', '---', '', ...filtered.map((note: string) => `_${note}_`)]
                : []),
            ].join('\n');
            
            fs.writeFileSync(mdPath, markdown + '\n', 'utf-8');
          }
          
          console.log(`✓ Cleaned publish notes in: ${file}`);
          cleanedCount++;
        }
      }
    } catch (err: any) {
      console.error(`✗ Error processing ${file}:`, err.message);
    }
  }
  
  console.log(`\n==================================================`);
  console.log(`COMPLETED: Cleaned publish notes in ${cleanedCount} files!`);
  console.log(`==================================================\n`);
}

main();
