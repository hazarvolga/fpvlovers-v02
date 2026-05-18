import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const memoryPath = path.join(repoRoot, 'PROJECT_MEMORY.md');
const actionsPath = path.join(repoRoot, 'NEXT_ACTIONS.md');
const planPath = path.join(
  repoRoot,
  'docs',
  'superpowers',
  'plans',
  '2026-05-18-dify-content-automation.md',
);
const protocolPath = path.join(
  repoRoot,
  'docs',
  'superpowers',
  'plans',
  '2026-05-18-opencode-codex-collaboration-protocol.md',
);
const outputDir = path.join(repoRoot, 'docs', 'handoff');
const outputPath = path.join(outputDir, 'latest.md');
const statusPath = path.join(outputDir, 'latest.json');

const readText = async (filePath) => {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch (error) {
    return '';
  }
};

const extractSection = (text, heading) => {
  const lines = text.split('\n');
  const target = `## ${heading}`;
  let inSection = false;
  const collected = [];
  for (const rawLine of lines) {
    const line = rawLine.replace(/\r$/, '');
    if (line.trim() === target) {
      inSection = true;
      continue;
    }
    if (inSection && line.startsWith('## ')) {
      break;
    }
    if (inSection) {
      collected.push(line);
    }
  }
  return collected.join('\n').trim();
};

const bulletLines = (text, limit = 8) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- ') || line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.'))
    .slice(0, limit);

const pickLines = (text, predicates, limit = 8) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => predicates.some((predicate) => predicate(line)))
    .slice(0, limit);

const formatBlock = (title, lines) => {
  if (!lines.length) {
    return `## ${title}\n\n- (no entries found)\n`;
  }
  return `## ${title}\n\n${lines.map((line) => line.replace(/^\d+\.\s*/, '- ')).join('\n')}\n`;
};

const memoryText = await readText(memoryPath);
const actionsText = await readText(actionsPath);
const planText = await readText(planPath);
const protocolText = await readText(protocolPath);

const currentState = extractSection(memoryText, 'Current Known State');
const architecture = extractSection(memoryText, 'Current Architecture Decisions');
const immediate = extractSection(actionsText, 'Immediate Priority');
const architectureFollowUp = extractSection(actionsText, 'Architecture Follow-Up');
const planHighlights = pickLines(planText, [
  (line) => line.startsWith('**Goal:**'),
  (line) => line.startsWith('**Architecture:**'),
  (line) => line.startsWith('**Tech Stack:**'),
  (line) => line.startsWith('### Task '),
  (line) => line.startsWith('- [ ]'),
], 18);
const protocolCurrentState = extractSection(protocolText, 'Current State');

const memoryLines = bulletLines(currentState, 8);
const architectureLines = bulletLines(architecture, 6);
const immediateLines = bulletLines(immediate, 6);
const followUpLines = bulletLines(architectureFollowUp, 6);
const task1Done = /Task 1 DONE/i.test(actionsText) || /Task 1 completed/i.test(memoryText);
const resolvedDify =
  /workflow blockers resolved/i.test(memoryText) ||
  /workflow blockers resolved/i.test(protocolText) ||
  /workflow blockers resolved/i.test(actionsText);
const nextTaskLine = planHighlights.find((line) => line.includes('### Task 2')) || '### Task 2: Turn the existing Dify generation routes into a single structured content generator';
const currentBlockerLine =
  task1Done && resolvedDify
    ? 'No current blocker. Start Task 2.'
    : immediateLines.find((line) => !/Task 1 DONE/i.test(line)) || 'Review the latest Dify state.';

const protocolExcerpt = protocolText
  ? protocolText
      .split('\n')
      .filter((line) => line.startsWith('## ') || line.startsWith('- ') || line.startsWith('1.') || line.startsWith('2.') || line.startsWith('3.'))
      .slice(0, 14)
      .map((line) => line.replace(/^\d+\.\s*/, '- '))
  : [];

const generatedAt = new Date().toISOString();
const handoff = `# FPVLovers Handoff Packet

Generated at: ${generatedAt}

## What happened

${memoryLines.length ? memoryLines.join('\n') : '- No recent memory entries found.'}

## Current blockers

${immediateLines.length ? immediateLines.join('\n') : '- No immediate priorities found.'}

## Relevant follow-ups

${followUpLines.length ? followUpLines.join('\n') : '- No follow-up items found.'}

## Working agreement

${architectureLines.length ? architectureLines.join('\n') : '- No architecture notes found.'}

## Dify / content automation context

${planHighlights.length ? planHighlights.join('\n') : '- No plan summary found.'}

## Collaboration protocol excerpt

${protocolCurrentState ? protocolCurrentState.split('\n').slice(0, 12).join('\n') : '- No protocol current state found.'}

${protocolExcerpt.length ? protocolExcerpt.join('\n') : '- No protocol excerpt found.'}

## Copy-paste prompt for Opencode

\`\`\`text
Continue the FPVLovers work from the latest handoff packet.

Read first:
- /Users/hazarekiz/Projects/fpv-autoblog-v2/fpvlovers-frontend-websitesi/PROJECT_MEMORY.md
- /Users/hazarekiz/Projects/fpv-autoblog-v2/fpvlovers-frontend-websitesi/NEXT_ACTIONS.md
- /Users/hazarekiz/Projects/fpv-autoblog-v2/fpvlovers-frontend-websitesi/docs/superpowers/plans/2026-05-18-dify-content-automation.md
- /Users/hazarekiz/Projects/fpv-autoblog-v2/fpvlovers-frontend-websitesi/docs/superpowers/plans/2026-05-18-opencode-codex-collaboration-protocol.md

Current blocking issue:
- The Dify workflow still shows a validation warning on the RAG Retrieval node: retrieval_mode needs to be resaved or the node recreated.

Your next move:
- Fix the RAG Retrieval node config.
- Republish the Dify workflow.
- Run a smoke test against the live Dify app.
- Update PROJECT_MEMORY.md and NEXT_ACTIONS.md after the change.
\`\`\`
`;

const status = {
  generatedAt,
  project: 'fpvlovers-frontend-websitesi',
  state: task1Done ? 'ready-for-task-2' : 'in-progress',
  task1Done,
  resolvedDify,
  currentBlocker: currentBlockerLine,
  nextTask: nextTaskLine.replace(/^###\s*/, ''),
  filesOfTruth: [
    memoryPath,
    actionsPath,
    planPath,
    protocolPath,
  ],
  handoffPath: outputPath,
};

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(outputPath, handoff, 'utf8');
await fs.writeFile(statusPath, `${JSON.stringify(status, null, 2)}\n`, 'utf8');

process.stdout.write(`${outputPath}\n${statusPath}\n`);
