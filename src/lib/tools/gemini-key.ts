import fs from 'fs';
import path from 'path';

const KEY_CANDIDATES = [
  'GEMINI_API_KEY',
  'GOOGLE_API_KEY',
  'NEXT_PUBLIC_GEMINI_API_KEY',
];

function cleanKey(value: string | undefined): string | undefined {
  const raw = value?.trim();
  const match = raw?.match(/AIza[0-9A-Za-z_-]+/);
  const trimmed = match?.[0] || raw?.replace(/^GEMINI_API_KEY\s*=\s*/i, '').replace(/^GOOGLE_API_KEY\s*=\s*/i, '').replace(/^["'`]|["'`]$/g, '').trim();
  if (!trimmed || trimmed === 'AIzaSy...') return undefined;
  return trimmed;
}

function readKeyFile(): string | undefined {
  const candidates = [
    path.join(process.cwd(), 'gemini-apikey.md'),
    path.join(process.cwd(), '..', 'gemini-apikey.md'),
  ];

  for (const candidate of candidates) {
    try {
      if (!fs.existsSync(candidate)) continue;
      const key = cleanKey(fs.readFileSync(candidate, 'utf-8'));
      if (key) return key;
    } catch {
      continue;
    }
  }

  return undefined;
}

export function getGeminiApiKey(): string | undefined {
  for (const name of KEY_CANDIDATES) {
    const key = cleanKey(process.env[name]);
    if (key) return key;
  }

  return readKeyFile();
}
