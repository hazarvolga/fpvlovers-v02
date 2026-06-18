import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const statusPath = path.join(repoRoot, 'docs', 'handoff', 'latest.json');

async function readText(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return '';
  }
}

const statusRaw = await readText(statusPath);
if (!statusRaw.trim()) {
  process.stderr.write(`Missing handoff status: ${statusPath}\nRun pnpm handoff first.\n`);
  process.exit(1);
}

const status = JSON.parse(statusRaw);
const blockers = Array.isArray(status.currentBlockers) ? status.currentBlockers : [];
const filesOfTruth = Array.isArray(status.filesOfTruth) ? status.filesOfTruth : [];

const brief = `# Opencode Brief

State: ${status.state || 'unknown'}
Generated at: ${status.generatedAt || 'unknown'}
Branch: ${status.branch || 'unknown'}
HEAD: ${status.head || 'unknown'}

## Read This First

${filesOfTruth.length ? filesOfTruth.map((file) => `- ${file}`).join('\n') : '- No source-of-truth files recorded.'}
- ${status.handoffPath}

## Current Blockers

${blockers.length ? blockers.map((blocker) => `- ${blocker}`).join('\n') : '- No blockers recorded.'}

## Next Task

- ${status.nextTask || 'Review the latest handoff and select the first open task.'}

## Required Behavior

- Start from current Git and handoff evidence, not old chat context.
- Keep local, pushed, deployed, and live-verified states explicit.
- Do not expose credentials or mutate production while gathering release evidence.
- Update PROJECT_MEMORY.md and NEXT_ACTIONS.md after verified work.
`;

process.stdout.write(brief);
