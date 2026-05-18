# FPVLovers Content Plan Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current Dify-shaped home feed with an English-first editorial content system that surfaces FPV guides, troubleshooting, components, racing, and regulations in a user-facing way.

**Architecture:** Create one shared content registry for taxonomy, article briefs, and first-wave topics. Render the homepage and category/article surfaces from that shared registry so the public UI stays editorial and we do not leak internal terms like dataset names, token counts, or ingest metadata. Keep the duplicated `app/` and `src/app/` trees in sync for now, but move reusable content logic into shared modules so the duplicate page files stay thin.

**Tech Stack:** Next.js 15, React 19, TypeScript, Tailwind, existing shadcn/ui cards/badges/buttons, Playwright for browser smoke, ESLint, `npx tsc`.

---

### Task 1: Add a shared editorial content registry and brief schema

**Files:**
- Create: `src/lib/content-types.ts`
- Create: `src/lib/content-plan.ts`
- Create: `docs/content/content-brief-template.md`
- Create: `docs/content/first-wave-topics.md`

- [ ] **Step 1: Define the shared content types**

```ts
export type ContentCategory =
  | 'Flight Guides'
  | 'Build Guides'
  | 'Troubleshooting'
  | 'Components'
  | 'Racing'
  | 'Regulations'
  | 'News and Reviews';

export type ContentTier = 'pillar' | 'support' | 'editor-pick';

export type ContentBrief = {
  slug: string;
  title: string;
  category: ContentCategory;
  tier: ContentTier;
  primaryKeyword: string;
  searchIntent: 'informational' | 'transactional' | 'navigational' | 'troubleshooting';
  audienceLevel: 'beginner' | 'intermediate' | 'advanced';
  summary: string;
  excerpt: string;
  relatedTopics: string[];
};
```

- [ ] **Step 2: Add the first-wave topic registry**

```ts
export const firstWaveContent: ContentBrief[] = [
  {
    slug: 'fpv-beginner-setup-guide',
    title: 'FPV Beginner Setup Guide',
    category: 'Build Guides',
    tier: 'pillar',
    primaryKeyword: 'fpv beginner setup',
    searchIntent: 'informational',
    audienceLevel: 'beginner',
    summary: 'A complete starting point for new FPV pilots.',
    excerpt: 'Learn the hardware stack, basic setup flow, and the safest way to get flying.',
    relatedTopics: ['radio link', 'goggles', 'frame selection', 'battery basics'],
  },
  {
    slug: 'fpv-troubleshooting-guide',
    title: 'FPV Troubleshooting Guide',
    category: 'Troubleshooting',
    tier: 'pillar',
    primaryKeyword: 'fpv troubleshooting',
    searchIntent: 'troubleshooting',
    audienceLevel: 'beginner',
    summary: 'A practical fix-first guide for the most common FPV issues.',
    excerpt: 'No video, no arm, desync, failsafe, and weak signal problems explained step by step.',
    relatedTopics: ['failsafe', 'vtx', 'receiver', 'arming issues'],
  },
  {
    slug: 'fpv-core-components-and-wiring-guide',
    title: 'FPV Core Components and Wiring Guide',
    category: 'Components',
    tier: 'pillar',
    primaryKeyword: 'fpv components wiring',
    searchIntent: 'informational',
    audienceLevel: 'beginner',
    summary: 'A clear map of the parts that make up a modern FPV build.',
    excerpt: 'Learn what each part does, how they connect, and where beginners usually get stuck.',
    relatedTopics: ['fc', 'esc', 'vtx', 'camera', 'receiver'],
  },
  {
    slug: 'choosing-your-first-radio-link',
    title: 'Choosing Your First Radio Link',
    category: 'Components',
    tier: 'support',
    primaryKeyword: 'best fpv radio link for beginners',
    searchIntent: 'informational',
    audienceLevel: 'beginner',
    summary: 'Compare the main control link options and pick one with confidence.',
    excerpt: 'Use case-driven guidance for ELRS, Crossfire-style systems, and starter radios.',
    relatedTopics: ['expresslrs', 'binding', 'telemetry'],
  },
  {
    slug: 'esc-firmware-basics-bluejay-vs-am32-vs-blheli',
    title: 'ESC Firmware Basics: Bluejay vs AM32 vs BLHeli',
    category: 'Build Guides',
    tier: 'support',
    primaryKeyword: 'esc firmware bluejay am32 blheli',
    searchIntent: 'informational',
    audienceLevel: 'intermediate',
    summary: 'A practical comparison of the three firmware families that matter most.',
    excerpt: 'Learn what each firmware is good at and how to avoid common compatibility mistakes.',
    relatedTopics: ['esc configurator', 'dshot', 'motor timing'],
  },
  {
    slug: 'camera-and-vtx-setup',
    title: 'Camera and VTX Setup',
    category: 'Build Guides',
    tier: 'support',
    primaryKeyword: 'fpv camera vtx setup',
    searchIntent: 'informational',
    audienceLevel: 'beginner',
    summary: 'How to wire and configure your video path without guessing.',
    excerpt: 'A simple setup path for analog and digital video systems.',
    relatedTopics: ['power filtering', 'channels', 'smartaudio', 'tramp'],
  },
  {
    slug: 'no-video-troubleshooting',
    title: 'No Video Troubleshooting',
    category: 'Troubleshooting',
    tier: 'support',
    primaryKeyword: 'fpv no video fix',
    searchIntent: 'troubleshooting',
    audienceLevel: 'beginner',
    summary: 'A focused fix guide for the most common display failure.',
    excerpt: 'Check power, wiring, channel mapping, and camera configuration in the right order.',
    relatedTopics: ['goggles', 'vtx', 'camera', 'osd'],
  },
  {
    slug: 'betaflight-pid-basics',
    title: 'Betaflight PID Basics',
    category: 'Flight Guides',
    tier: 'support',
    primaryKeyword: 'betaflight pid basics',
    searchIntent: 'informational',
    audienceLevel: 'intermediate',
    summary: 'An approachable intro to the core tuning controls.',
    excerpt: 'Understand what PID changes do before touching the sliders.',
    relatedTopics: ['rates', 'filters', 'propwash'],
  },
  {
    slug: 'fpv-goggles-and-receiver-comparison',
    title: 'FPV Goggles and Receiver Comparison',
    category: 'Components',
    tier: 'support',
    primaryKeyword: 'fpv goggles comparison',
    searchIntent: 'informational',
    audienceLevel: 'beginner',
    summary: 'Compare goggles and receivers by workflow, not hype.',
    excerpt: 'Make a purchase choice based on range, latency, comfort, and ecosystem support.',
    relatedTopics: ['analog', 'digital', 'receiver modules'],
  },
  {
    slug: 'fpv-racing-rules-and-basics',
    title: 'FPV Racing Rules and Basics',
    category: 'Racing',
    tier: 'support',
    primaryKeyword: 'fpv racing rules',
    searchIntent: 'informational',
    audienceLevel: 'beginner',
    summary: 'A first look at the rules and structure of FPV racing.',
    excerpt: 'Learn the terms, gate logic, and what makes a race format feel official.',
    relatedTopics: ['multigp', 'gates', 'race formats'],
  },
];
```

- [ ] **Step 3: Write the brief template and first-wave topic notes**

```md
# Content Brief Template

- Title:
- Slug:
- Category:
- Tier:
- Primary keyword:
- Search intent:
- Audience level:
- Summary:
- Excerpt:
- Outline:
- Source notes:
- Internal notes:
```

- [ ] **Step 4: Run a type check for the new registry files**

Run: `npx tsc --noEmit --pretty false`
Expected: pass with no new type errors.

---

### Task 2: Rebuild the homepage into a hybrid editorial layout

**Files:**
- Modify: `app/page.tsx`
- Modify: `src/app/page.tsx`
- Create: `src/components/content/EditorialHomeSections.tsx`
- Create: `src/components/content/ContentCard.tsx`

- [ ] **Step 1: Extract the homepage content model away from raw Dify feed language**

```tsx
type HomeSection = {
  title: string;
  subtitle: string;
  variant: 'featured-guides' | 'recent-posts' | 'editors-picks' | 'category-grid';
};
```

- [ ] **Step 2: Implement the shared editorial section renderer**

```tsx
export function EditorialHomeSections({ sections }: { sections: HomeSection[] }) {
  return (
    <div className="flex flex-col gap-12">
      {sections.map((section) => (
        <section key={section.title} className="w-full">
          {/* Render clean category chips, titles, excerpts, and lightweight cards here */}
        </section>
      ))}
    </div>
  );
}
```

- [ ] **Step 3: Replace internal labels on the homepage with public-facing language**

Use section labels like:
```ts
[
  'Featured Guides',
  'Recent Posts',
  "Editor's Picks",
  'Flight Guides',
  'Build Guides',
  'Troubleshooting',
  'Components',
]
```

and remove any visible `dataset`, `token`, or `Dify` strings from rendered text.

- [ ] **Step 4: Keep sponsor and newsletter blocks as secondary, not dominant, homepage content**

The homepage should still include partner and newsletter areas, but they should sit after the editorial content blocks and never take over the first screen.

- [ ] **Step 5: Verify the homepage visually in the local browser**

Run: `pnpm dev` or reuse the existing dev server, then open `http://127.0.0.1:3000/`

Expected:
- category blocks are visible
- featured article cards are readable
- no internal operational terms are shown
- the page feels editorial instead of technical-dashboard heavy

---

### Task 3: Update article and category surfaces to use the shared taxonomy

**Files:**
- Modify: `app/article/[slug]/page.tsx`
- Modify: `src/app/article/[slug]/page.tsx`
- Modify: `app/category/page.tsx`
- Modify: `src/app/category/page.tsx`
- Modify: `src/lib/seo/metadata.ts`
- Modify: `lib/seo/metadata.ts`
- Modify: `src/lib/dify.ts`
- Modify: `lib/dify.ts`

- [ ] **Step 1: Replace raw `Drone Parts` / `AI Software` naming with user-facing editorial categories**

```ts
const categoryLabelMap: Record<string, string> = {
  'Drone Parts': 'Components',
  'AI Software': 'Flight Guides',
  'Flight Guides': 'Flight Guides',
};
```

- [ ] **Step 2: Remove dataset and token text from summaries and cards**

```ts
const cleanSummary = (value: string) =>
  value
    .replace(/\bDify\b/gi, '')
    .replace(/\btoken(s)?\b/gi, '')
    .replace(/\bdataset(s)?\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
```

- [ ] **Step 3: Make category pages read from the editorial taxonomy instead of internal feed categories**

Expected visible user categories:
```ts
[
  'Flight Guides',
  'Build Guides',
  'Troubleshooting',
  'Components',
  'Racing',
  'Regulations',
  'News and Reviews',
]
```

- [ ] **Step 4: Update metadata generation so titles and descriptions are SEO-friendly**

Use metadata that matches the content intent:
```ts
{
  title: 'FPV Beginner Setup Guide',
  description: 'A beginner-friendly guide to FPV setup, components, and first-flight preparation.',
}
```

- [ ] **Step 5: Smoke-check article and category routes in the browser**

Run: open a sample article and category URL in the local browser

Expected:
- canonical metadata is present
- the article page uses the public category label
- the category archive page groups articles by the new taxonomy

---

### Task 4: Add the content brief workflow and the first publishing checklist

**Files:**
- Create: `docs/content/publishing-checklist.md`
- Create: `docs/content/first-10-articles.md`
- Modify: `NEXT_ACTIONS.md`
- Modify: `PROJECT_MEMORY.md`

- [ ] **Step 1: Write the publishing checklist**

```md
# Publishing Checklist

1. Pick one brief from the registry.
2. Draft the article in English.
3. Add the category and canonical slug.
4. Generate a clean excerpt for the homepage card.
5. Verify the article shows only user-facing terms.
6. Run lint and typecheck.
7. Open the page in the browser and confirm readability.
```

- [ ] **Step 2: Record the first 10 article topics in a publishable order**

```md
1. FPV Beginner Setup Guide
2. FPV Troubleshooting Guide
3. FPV Core Components and Wiring Guide
4. Choosing Your First Radio Link
5. ESC Firmware Basics: Bluejay vs AM32 vs BLHeli
6. Camera and VTX Setup
7. No Video Troubleshooting
8. Betaflight PID Basics
9. FPV Goggles and Receiver Comparison
10. FPV Racing Rules and Basics
```

- [ ] **Step 3: Update the repo handoff notes so the content phase is the new default next step**

Capture that the source-corpus work is complete enough for content generation to begin, while `IntoFPV` remains an edge-case deferred source and does not block publishing.

- [ ] **Step 4: Validate the final deliverable**

Run:
```bash
npm run lint
npx tsc --noEmit --pretty false
```

Then open the homepage in the browser and confirm:
- hybrid editorial layout
- English-first content presentation
- no visible internal ops language
- category chips and featured sections read cleanly

---

## Self-Review

- Spec coverage: homepage content sections, article card metadata, category labels, content brief format, and first 10 article topics are all covered.
- Placeholder scan: no TBD/TODO placeholders were used.
- Type consistency: the shared category and brief types are defined once and reused across the plan.

