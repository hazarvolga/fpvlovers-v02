#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import process from 'node:process';

function parseArgs(argv) {
  const args = { root: '.', out: '' };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === '--root') args.root = argv[++index] ?? '.';
    else if (value === '--out') args.out = argv[++index] ?? '';
    else if (value === '--help') {
      console.log('Usage: node audit-readiness.mjs [--root PATH] [--out FILE]');
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${value}`);
    }
  }
  return args;
}

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function walk(directory, predicate) {
  if (!(await exists(directory))) return [];
  const found = [];
  const entries = await fs.readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.name === 'node_modules' || entry.name === '.next' || entry.name === '.git') continue;
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) found.push(...await walk(fullPath, predicate));
    else if (predicate(fullPath)) found.push(fullPath);
  }
  return found.sort();
}

function relative(root, filePath) {
  return path.relative(root, filePath).split(path.sep).join('/');
}

function routeFromPage(appRoot, filePath) {
  const directory = path.relative(appRoot, path.dirname(filePath));
  if (!directory) return '/';
  return `/${directory.split(path.sep).filter((segment) => !segment.startsWith('(')).join('/')}`;
}

function canonicalSlug(filePath) {
  return path.basename(filePath).replace(/\.(json|md|mdx)$/i, '');
}

function classifyCommercial(slug) {
  const normalized = slug.toLowerCase().replaceAll('-', ' ');
  if (/\b(vs|comparison|compare)\b/.test(normalized)) return 'comparison';
  if (/\breview\b/.test(normalized)) return 'review';
  if (/\b(best|buyer|buyers|buying)\b/.test(normalized) || /\bstarter kits?\b/.test(normalized)) return 'buyer-guide';
  return '';
}

async function inspectSource(filePath) {
  const text = await fs.readFile(filePath, 'utf8');
  return {
    metadata: /export\s+const\s+metadata|generateMetadata\s*\(/.test(text),
    canonical: /canonical|alternates\s*:/.test(text),
    openGraph: /openGraph\s*:/.test(text),
    twitter: /twitter\s*:/.test(text),
    jsonLd: /application\/ld\+json|schema\.org|JSON-LD/i.test(text),
    affiliateLanguage: /affiliate|sponsored/i.test(text),
    contactLanguage: /mailto:|contact|inquir/i.test(text),
    chars: text.length,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const root = path.resolve(args.root);
  const appRoot = path.join(root, 'src', 'app');
  if (!(await exists(path.join(root, 'package.json'))) || !(await exists(appRoot))) {
    throw new Error(`Expected an app root with package.json and src/app: ${root}`);
  }

  const pageFiles = await walk(appRoot, (filePath) => filePath.endsWith(`${path.sep}page.tsx`));
  const routes = [];
  for (const filePath of pageFiles) {
    routes.push({
      route: routeFromPage(appRoot, filePath),
      file: relative(root, filePath),
      ...await inspectSource(filePath),
    });
  }

  const trustCandidates = {
    about: ['/about'],
    contact: ['/contact'],
    privacy: ['/privacy', '/privacy-policy'],
    terms: ['/terms', '/terms-of-service'],
    editorialPolicy: ['/editorial-policy'],
    affiliateDisclosure: ['/affiliate-disclosure', '/disclosure'],
    advertisingPolicy: ['/advertise', '/advertising', '/sponsorship-policy'],
  };
  const routeSet = new Set(routes.map((entry) => entry.route));
  const trustRoutes = Object.fromEntries(Object.entries(trustCandidates).map(([key, candidates]) => [
    key,
    { present: candidates.some((candidate) => routeSet.has(candidate)), matches: candidates.filter((candidate) => routeSet.has(candidate)) },
  ]));

  const contentRoot = path.join(root, 'content', 'published');
  const contentFiles = await walk(contentRoot, (filePath) => /\.(json|md|mdx)$/i.test(filePath));
  const canonical = new Map();
  for (const filePath of contentFiles) {
    const slug = canonicalSlug(filePath);
    const text = await fs.readFile(filePath, 'utf8');
    const current = canonical.get(slug) ?? { slug, files: [], types: new Set(), internalLinkSignals: 0 };
    current.files.push(relative(root, filePath));
    const type = classifyCommercial(slug);
    if (type) current.types.add(type);
    current.internalLinkSignals += (text.match(/\]\(\//g) ?? []).length;
    if (filePath.endsWith('.json')) {
      try {
        const artifact = JSON.parse(text);
        if (Array.isArray(artifact.internalLinks)) current.internalLinkSignals += artifact.internalLinks.length;
      } catch {
        // Invalid JSON belongs to the project's content audit; retain text-only evidence here.
      }
    }
    canonical.set(slug, current);
  }
  const content = [...canonical.values()].map((entry) => ({
    slug: entry.slug,
    files: entry.files,
    commercialTypes: [...entry.types].sort(),
    internalLinkSignals: entry.internalLinkSignals,
  }));

  const importantFiles = [
    'src/app/layout.tsx',
    'src/app/robots.ts',
    'src/app/sitemap.ts',
    'src/app/sitemap.xml/route.ts',
    'data/affiliates.json',
    'data/ctas.json',
    'data/sponsors.json',
  ];
  const filePresence = {};
  for (const candidate of importantFiles) filePresence[candidate] = await exists(path.join(root, candidate));

  const commercialCounts = { review: 0, comparison: 0, 'buyer-guide': 0 };
  for (const entry of content) {
    for (const type of entry.commercialTypes) commercialCounts[type] += 1;
  }

  const report = {
    generatedAt: new Date().toISOString(),
    root,
    caveat: 'Static inventory only. Confirm material findings in source and verify live behavior separately.',
    summary: {
      routeCount: routes.length,
      canonicalPublishedContentCount: content.length,
      rawPublishedFileCount: contentFiles.length,
      commercialCounts,
      commercialCountCaveat: 'Counts are filename signals, not an editorial quality assessment.',
      commercialPagesWithoutInternalLinkSignals: content.filter((entry) => entry.commercialTypes.length > 0 && entry.internalLinkSignals === 0).map((entry) => entry.slug),
      routeMetadataCoverage: `${routes.filter((entry) => entry.metadata).length}/${routes.length}`,
    },
    trustRoutes,
    filePresence,
    routes,
    content,
  };

  const output = `${JSON.stringify(report, null, 2)}\n`;
  if (args.out) {
    const outputPath = path.resolve(root, args.out);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, output, 'utf8');
    console.log(`Wrote ${relative(root, outputPath)}`);
  } else {
    process.stdout.write(output);
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
