import { spawnSync } from 'node:child_process';

const baseRef = process.env.QUALITY_BASE_REF || '06e2c58';
const semanticAny = /(?:\:\s*any\b|\bas\s+any\b|<any>|\bany\[\]|Record<[^>]*any)/;
const violations = [];

const diffResult = spawnSync(
  'git',
  ['diff', '--unified=0', baseRef, '--', '*.ts', '*.tsx'],
  { encoding: 'utf8' },
);

if (diffResult.status !== 0) {
  console.error(`Unable to inspect TypeScript diff from ${baseRef}.`);
  process.exit(1);
}

let currentFile = '';
let currentLine = 0;
for (const line of diffResult.stdout.split(/\r?\n/)) {
  if (line.startsWith('+++ b/')) {
    currentFile = line.slice(6);
    continue;
  }

  const hunk = line.match(/^@@ .* \+(\d+)/);
  if (hunk) {
    currentLine = Number(hunk[1]);
    continue;
  }

  if (line.startsWith('+') && !line.startsWith('+++')) {
    if (semanticAny.test(line.slice(1))) {
      violations.push(`${currentFile}:${currentLine} [explicit-any]`);
    }
    currentLine++;
  } else if (!line.startsWith('-')) {
    currentLine++;
  }
}

const whitespaceResult = spawnSync(
  'git',
  ['diff', '--check', baseRef, '--'],
  { encoding: 'utf8' },
);

if (whitespaceResult.status !== 0) {
  for (const line of whitespaceResult.stdout.split(/\r?\n/)) {
    const match = line.match(/^(.+?:\d+): (trailing whitespace|new blank line at EOF)/);
    if (match) violations.push(`${match[1]} [${match[2].replaceAll(' ', '-')}]`);
  }
}

if (violations.length > 0) {
  console.error(`Recent code quality audit failed with ${violations.length} violation(s):`);
  for (const violation of violations) console.error(`- ${violation}`);
  process.exitCode = 1;
} else {
  console.log(`Recent code quality audit passed for ${baseRef}..working-tree.`);
}
