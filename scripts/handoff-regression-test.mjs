import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const markdown = fs.readFileSync('docs/handoff/latest.md', 'utf8');
const status = JSON.parse(fs.readFileSync('docs/handoff/latest.json', 'utf8'));
const violations = [];

if (markdown.includes('retrieval_mode needs to be resaved')) {
  violations.push('latest.md contains obsolete retrieval warning');
}
if (markdown.includes('ready-for-task-2')) {
  violations.push('latest.md contains obsolete Task 2 state');
}
if (status.state !== 'release-verification-pending') {
  violations.push(`latest.json has stale state: ${status.state}`);
}
if (typeof status.head !== 'string' || !/^[0-9a-f]{7,40}$/.test(status.head)) {
  violations.push('latest.json is missing a Git HEAD');
}
if (typeof status.head === 'string' && !markdown.includes(status.head)) {
  violations.push('latest.md and latest.json disagree on Git HEAD');
}
if (typeof status.branch !== 'string' || !status.branch || !markdown.includes(`Branch: \`${status.branch}\``)) {
  violations.push('latest.md and latest.json disagree on branch');
}
if (!Number.isInteger(status.ahead) || !Number.isInteger(status.behind)) {
  violations.push('latest.json is missing ahead/behind counts');
}
if (!Array.isArray(status.currentBlockers) || status.currentBlockers.length === 0) {
  violations.push('latest.json is missing current blockers');
}
if (status.currentBlockers?.some((blocker) => blocker.includes('✅'))) {
  violations.push('latest.json lists completed work as a blocker');
}

const currentBranch = execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim();
if (status.branch !== currentBranch) {
  violations.push(`latest.json has stale branch: ${status.branch}`);
}

if (violations.length > 0) {
  console.error(`Handoff regression test failed with ${violations.length} violation(s):`);
  for (const violation of violations) console.error(`- ${violation}`);
  process.exitCode = 1;
} else {
  console.log(`Handoff regression test passed for ${status.head}.`);
}
