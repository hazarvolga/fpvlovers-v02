import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const memoryPath = path.join(repoRoot, 'PROJECT_MEMORY.md');
const actionsPath = path.join(repoRoot, 'NEXT_ACTIONS.md');
const planPath = path.join(
  repoRoot,
  'docs',
  'superpowers',
  'plans',
  '2026-06-18-post-analysis-gap-closure.md',
);
const outputDir = path.join(repoRoot, 'docs', 'handoff');
const outputPath = path.join(outputDir, 'latest.md');
const statusPath = path.join(outputDir, 'latest.json');

async function readText(filePath) {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return '';
  }
}

function extractSection(text, heading) {
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
    if (inSection && line.startsWith('## ')) break;
    if (inSection) collected.push(line);
  }

  return collected.join('\n').trim();
}

function actionLines(text, limit) {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => /^(- |\d+\. )/.test(line))
    .slice(0, limit)
    .map((line) => line.replace(/^\d+\.\s*/, '- '));
}

function gitText(args) {
  try {
    return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();
  } catch {
    return '';
  }
}

const memoryText = await readText(memoryPath);
const actionsText = await readText(actionsPath);
const planText = await readText(planPath);
const currentState = actionLines(extractSection(memoryText, 'Current Known State'), 12);
const securityActions = actionLines(extractSection(actionsText, 'Immediate Security Actions'), 6);
const deploymentTasks = actionLines(extractSection(actionsText, 'Deployment Tasks'), 6);
const planSummary = planText
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line.startsWith('**Goal:**') || line.startsWith('### Task '))
  .slice(0, 8);

const head = gitText(['rev-parse', '--short=12', 'HEAD']);
const branch = gitText(['branch', '--show-current']);
const aheadBehind = gitText(['rev-list', '--left-right', '--count', 'origin/main...HEAD'])
  .split(/\s+/)
  .map(Number);
const behind = Number.isFinite(aheadBehind[0]) ? aheadBehind[0] : null;
const ahead = Number.isFinite(aheadBehind[1]) ? aheadBehind[1] : null;
const generatedAt = new Date().toISOString();
const currentBlockers = [...securityActions, ...deploymentTasks];
const nextTask = 'Run the complete release gate, then verify the production commit and public routes read-only.';

const handoff = `# FPVLovers Handoff Packet

Generated at: ${generatedAt}

## Git State

- Branch: \`${branch || 'unknown'}\`
- HEAD: \`${head || 'unknown'}\`
- Against \`origin/main\`: behind ${behind ?? 'unknown'}, ahead ${ahead ?? 'unknown'}

## What Happened

${currentState.length ? currentState.join('\n') : '- No current-state entries found.'}

## Current Blockers

${currentBlockers.length ? currentBlockers.join('\n') : '- No blockers recorded.'}

## Active Plan

${planSummary.length ? planSummary.join('\n') : '- No active plan summary found.'}

## Next Move

- ${nextTask}
- Do not claim the release is live until the production image or commit matches the deployed revision.
- Do not deploy env-only credential changes until exposed credentials have been rotated in their owning systems.

## Source Of Truth

- \`${memoryPath}\`
- \`${actionsPath}\`
- \`${planPath}\`

## Copy-Paste Continuation Prompt

\`\`\`text
Continue FPVLovers from the latest handoff packet.

Read PROJECT_MEMORY.md, NEXT_ACTIONS.md, and docs/handoff/latest.md first.
Run the complete local release gate. Then inspect production read-only and compare its deployed commit/image with local HEAD. Keep credential rotation, Git-history cleanup, push, and deploy boundaries explicit. Update project memory after obtaining fresh evidence.
\`\`\`
`;

const status = {
  generatedAt,
  project: 'fpvlovers-frontend-websitesi',
  state: 'release-verification-pending',
  branch,
  head,
  behind,
  ahead,
  currentBlockers: currentBlockers.map((line) => line.replace(/^-\s*/, '')),
  nextTask,
  filesOfTruth: [memoryPath, actionsPath, planPath],
  handoffPath: outputPath,
};

await fs.mkdir(outputDir, { recursive: true });
await fs.writeFile(outputPath, handoff, 'utf8');
await fs.writeFile(statusPath, `${JSON.stringify(status, null, 2)}\n`, 'utf8');

process.stdout.write(`${outputPath}\n${statusPath}\n`);
