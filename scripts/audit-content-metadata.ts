import fs from 'fs';
import path from 'path';
import { validateContentMetadata } from '../src/lib/content-metadata';

const PUBLISHED_DIR = path.join(process.cwd(), 'content', 'published');
const REPORT_PATH = path.join(process.cwd(), 'reports', 'unified-metadata-report.md');

async function auditContent() {
  if (!fs.existsSync(PUBLISHED_DIR)) {
    console.error(`Published directory not found at ${PUBLISHED_DIR}`);
    return;
  }

  const files = fs.readdirSync(PUBLISHED_DIR).filter(file => file.endsWith('.json'));
  let totalFiles = 0;
  let completelyMissing = 0;
  let invalidMetadata = 0;
  let validMetadata = 0;

  const missingFieldsCounter: Record<string, number> = {
    difficulty: 0,
    contentType: 0,
    topics: 0,
    audience: 0,
    discipline: 0,
    components: 0
  };

  const detailedErrors: { file: string; errors: string[] }[] = [];

  for (const file of files) {
    totalFiles++;
    const filePath = path.join(PUBLISHED_DIR, file);
    try {
      const contentStr = fs.readFileSync(filePath, 'utf-8');
      const content = JSON.parse(contentStr);

      if (!content.metadata) {
        completelyMissing++;
        Object.keys(missingFieldsCounter).forEach(k => missingFieldsCounter[k]++);
        continue;
      }

      const validation = validateContentMetadata(content.metadata);

      if (!validation.isValid) {
        invalidMetadata++;
        detailedErrors.push({ file, errors: validation.errors });
      } else {
        validMetadata++;
      }

      // Check missing individual fields even if valid overall (since they are optional in the type)
      if (!content.metadata.difficulty) missingFieldsCounter.difficulty++;
      if (!content.metadata.contentType) missingFieldsCounter.contentType++;
      if (!content.metadata.topics) missingFieldsCounter.topics++;
      if (!content.metadata.audience) missingFieldsCounter.audience++;
      if (!content.metadata.discipline) missingFieldsCounter.discipline++;
      if (!content.metadata.components) missingFieldsCounter.components++;

    } catch (e) {
      console.error(`Error reading or parsing ${file}:`, e);
    }
  }

  const report = `# Unified Content Metadata Audit Report

## Summary
- **Total Content Items Audited:** ${totalFiles}
- **Items with Valid Metadata:** ${validMetadata}
- **Items with Invalid Metadata:** ${invalidMetadata}
- **Items Completely Missing Metadata:** ${completelyMissing}

## Missing Field Breakdown
*Number of files missing the following fields:*
- \`difficulty\`: ${missingFieldsCounter.difficulty}
- \`contentType\`: ${missingFieldsCounter.contentType}
- \`topics\`: ${missingFieldsCounter.topics}
- \`audience\`: ${missingFieldsCounter.audience}
- \`discipline\`: ${missingFieldsCounter.discipline}
- \`components\`: ${missingFieldsCounter.components}

## Detailed Validation Errors
${detailedErrors.length === 0 ? 'No validation errors found.' : detailedErrors.map(e => "- **" + e.file + "**\\n  - " + e.errors.join('\\n  - ')).join('\\n')}

## Action Plan
- **Migration Strategy**: Use the Dify orchestrator to re-generate or enrich the missing \`metadata\` blocks for the ${completelyMissing} files that lack them.
- **Validation Strictness**: Once all content is enriched, the \`metadata\` field should be made required in \`PublishedArtifact\`.
`;

  // Keep audit artifacts portable and available to every contributor.
  fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  fs.writeFileSync(REPORT_PATH, report, 'utf-8');
  console.log(`Audit complete. Report generated at: ${REPORT_PATH}`);
}

auditContent().catch(console.error);
