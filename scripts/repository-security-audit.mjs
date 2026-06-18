import fs from 'node:fs';
import { execFileSync } from 'node:child_process';

const trackedFiles = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' })
  .split('\0')
  .filter(Boolean);

const violations = [];

function addViolation(file, line, rule) {
  violations.push({ file, line, rule });
}

for (const file of trackedFiles) {
  if (file === 'scripts/repository-security-audit.mjs') continue;

  let source;
  try {
    source = fs.readFileSync(file, 'utf8');
  } catch {
    continue;
  }

  const lines = source.split(/\r?\n/);
  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    if (/Dify login credentials:|Credentials for Dify console:|\*\*Dify console:\*\*/i.test(line)) {
      addViolation(file, lineNumber, 'tracked-dify-credential-record');
    }

    if (/CRON_SECRET:\*\*\s*`?[^<\s][^`\s]*/i.test(line)) {
      addViolation(file, lineNumber, 'tracked-cron-secret-value');
    }

    if (/['"](?:app|dataset)-[A-Za-z0-9_-]{12,}['"]/.test(line)
      && file !== 'src/lib/master-routing-tables.ts') {
      addViolation(file, lineNumber, 'hardcoded-dify-token');
    }

    if (/\.gemini['"),/].*antigravity|antigravity['"),/].*brain/.test(line)) {
      addViolation(file, lineNumber, 'developer-specific-report-path');
    }
  });

  if (file === 'scripts/test-retrieval.ts'
    && /fetch\s*\(.*DIFY_BASE_URL/s.test(source)) {
    addViolation(file, 1, 'direct-dify-fetch-outside-client');
  }
}

if (violations.length > 0) {
  console.error(`Repository security audit failed with ${violations.length} violation(s):`);
  for (const violation of violations) {
    console.error(`- ${violation.file}:${violation.line} [${violation.rule}]`);
  }
  process.exitCode = 1;
} else {
  console.log(`Repository security audit passed (${trackedFiles.length} tracked files checked).`);
}
