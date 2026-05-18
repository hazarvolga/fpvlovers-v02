import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const statusPath = path.join(repoRoot, 'docs', 'handoff', 'latest.json');
const memoryPath = path.join(repoRoot, 'PROJECT_MEMORY.md');
const actionsPath = path.join(repoRoot, 'NEXT_ACTIONS.md');
const protocolPath = path.join(
  repoRoot,
  'docs',
  'superpowers',
  'plans',
  '2026-05-18-opencode-codex-collaboration-protocol.md',
);

const readText = async (filePath) => {
  try {
    return await fs.readFile(filePath, 'utf8');
  } catch {
    return '';
  }
};

const statusRaw = await readText(statusPath);
if (!statusRaw.trim()) {
  process.stderr.write(
    `Missing handoff status: ${statusPath}\nRun npm run handoff first.\n`,
  );
  process.exit(1);
}

const status = JSON.parse(statusRaw);
const memory = await readText(memoryPath);
const actions = await readText(actionsPath);
const protocol = await readText(protocolPath);

const readSection = (text, heading) => {
  const target = `## ${heading}`;
  const lines = text.split('\n');
  let active = false;
  const out = [];
  for (const raw of lines) {
    const line = raw.replace(/\r$/, '');
    if (line.trim() === target) {
      active = true;
      continue;
    }
    if (active && line.startsWith('## ')) break;
    if (active) out.push(line);
  }
  return out.join('\n').trim();
};

const immediatePriority = readSection(actions, 'Immediate Priority');
const nextActions = immediatePriority
  .split('\n')
  .map((line) => line.trim())
  .filter((line) => line.startsWith('- ') || line.startsWith('1.'))
  .slice(0, 5)
  .map((line) => line.replace(/^\d+\.\s*/, '- '));

const currentState = readSection(memory, 'Current Known State');
const task2Line = status.nextTask || 'Task 2: Turn the existing Dify generation routes into a single structured content generator';
const task1Line = status.task1Done ? 'Task 1 is done.' : 'Task 1 is not done yet.';
const blockerLine = status.currentBlocker || 'No blocker reported.';
const protocolLine = readSection(protocol, 'Current State') || 'No protocol state found.';

const brief = `# Opencode Brief

State: ${status.state}
Generated at: ${status.generatedAt}

## Read this first

- ${status.handoffPath}
- ${memoryPath}
- ${actionsPath}
- ${protocolPath}

## Status

- ${task1Line}
- ${task2Line}
- Current blocker: ${blockerLine}

## Current memory

${currentState ? currentState.split('\n').slice(0, 8).join('\n') : '- No current memory.'}

## Current priority

${nextActions.length ? nextActions.join('\n') : '- No current priority.'}

## Protocol state

${protocolLine}

## Required behavior

- Start from the handoff packet, not from old chat context.
- If the state is \`ready-for-task-2\`, begin Task 2 immediately.
- After finishing, update PROJECT_MEMORY.md and NEXT_ACTIONS.md.
- Leave a short completion note that includes what changed, what remains, and whether smoke tests passed.
`;

process.stdout.write(brief);
