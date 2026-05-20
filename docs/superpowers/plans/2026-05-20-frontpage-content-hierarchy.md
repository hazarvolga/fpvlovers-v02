# Frontpage Content Hierarchy Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current operational Dify feed on the public homepage with an editorial, published-content-driven frontpage that preserves the existing cyber brand language and surfaces Pilot Academy, Engineering Lab, AI Tools, sponsor blocks, and published articles in a clear hierarchy.

**Architecture:** The homepage should stop reading raw Dify insight cards and instead compose its public content from published content artifacts plus a small homepage data resolver. The resolver will derive featured guides, recent posts, editor’s picks, academy teasers, engineering lab teasers, and primary tool cards from published content and the current navigation structure. The result should be shared by both app/page.tsx and src/app/page.tsx so the local app and the duplicated app router stay visually identical.

**Tech Stack:** Next.js App Router, React Server Components, TypeScript, existing content automation artifacts in `content/published/*.json`, `src/lib/content-automation/content-reader.ts`, existing cyber UI components, lucide-react, shadcn-based cards/badges/buttons.

---

### Task 1: Build a shared homepage content resolver

**Files:**
- Create: `src/lib/homepage/homepage-content.ts`
- Modify: `src/lib/content-automation/content-reader.ts`
- Modify: `src/lib/content-automation/content-types.ts` if a published-content field is missing from the current shape

- [ ] **Step 1: Define the homepage data shape**

```ts
export type HomepageSectionCard = {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readingTime: string;
  publishedAt: string;
  href: string;
  coverImage?: string;
  tier?: 'pillar' | 'support';
};

export type HomepageContentModel = {
  featuredGuides: HomepageSectionCard[];
  recentPosts: HomepageSectionCard[];
  editorsPicks: HomepageSectionCard[];
  academyCards: {
    title: string;
    description: string;
    href: string;
    label: string;
  }[];
  engineeringCards: {
    title: string;
    description: string;
    href: string;
    label: string;
  }[];
  toolCards: {
    title: string;
    description: string;
    href: string;
    label: string;
  }[];
  sponsorSlot: {
    title: string;
    description: string;
    href?: string;
  };
};
```

- [ ] **Step 2: Implement the resolver from published artifacts**

```ts
import { listPublishedContent, PublishedArtifact } from '@/lib/content-automation/content-reader';

const PILLAR_CATEGORIES = new Set([
  'Flight Guides',
  'Build Guides',
  'Troubleshooting',
  'Components',
]);

function toHomepageCard(item: PublishedArtifact) {
  return {
    slug: item.slug,
    title: item.title,
    excerpt: item.excerpt || item.summary || '',
    category: item.category,
    readingTime: item.readingTime || '5 min read',
    publishedAt: item.publishedAt,
    href: `/article/${item.slug}`,
    coverImage: item.coverImage,
    tier: item.tier,
  };
}

export function resolveHomepageContent(): HomepageContentModel {
  const published = listPublishedContent().map(toHomepageCard);
  const featuredGuides = published.filter((item) => item.tier === 'pillar' || PILLAR_CATEGORIES.has(item.category)).slice(0, 3);
  const recentPosts = [...published].slice(0, 6);
  const editorsPicks = published.filter((item) => item.tier === 'support').slice(0, 3);

  return {
    featuredGuides,
    recentPosts,
    editorsPicks,
    academyCards: [
      { title: 'Pilot Roadmap', description: 'The beginner-first path from simulator to first flights.', href: '/academy/roadmap', label: 'Roadmap' },
      { title: 'Starter Kits', description: 'What to buy first and why it matters.', href: '/academy/starter-kits', label: 'Start Here' },
      { title: 'FPV Glossary', description: 'Decode the acronyms and setup terms.', href: '/academy/glossary', label: 'Glossary' },
      { title: 'Simulators', description: 'Practice before the first real flight.', href: '/academy/simulators', label: 'Practice' },
    ],
    engineeringCards: [
      { title: 'Hardware Data', description: 'Motors, ESCs, FCs, and video systems.', href: '/engineering/hardware', label: 'Reference' },
      { title: 'Propeller Lab', description: 'Prop size, pitch, blade count, and vibration.', href: '/engineering/hardware#props', label: 'High Friction' },
      { title: 'Firmware Tuning', description: 'Betaflight PID, EdgeTX, and ELRS setup.', href: '/engineering/firmware', label: 'Workflow' },
      { title: 'Workshop Masterclass', description: 'Soldering, repair, and maintenance.', href: '/engineering/workshop', label: 'Repair' },
    ],
    toolCards: [
      { title: 'Build Calculator', description: 'Weight, thrust, KV, and battery sizing.', href: '/tools/calculator', label: 'Priority 1' },
      { title: 'Blackbox Tuning', description: 'Log analysis, vibration review, and tuning guidance.', href: '/tools/blackbox-tuning', label: 'Priority 2' },
      { title: 'Component Duel', description: 'Side-by-side FPV part comparison.', href: '/tools/component-duel', label: 'Priority 3' },
    ],
    sponsorSlot: {
      title: 'Featured Partner',
      description: 'Strategic sponsor slot kept below the hero and above secondary content.',
      href: undefined,
    },
  };
}
```

- [ ] **Step 3: Verify the resolver compiles against existing published-content fields**

Run:
```bash
npx tsc --noEmit --pretty false
```

Expected:
- TypeScript passes with the new homepage content resolver using the existing published content artifact shape.

---

### Task 2: Replace the homepage Dify feed with the editorial hub layout

**Files:**
- Modify: `src/app/page.tsx`
- Modify: `app/page.tsx`

- [ ] **Step 1: Remove the `fetchDifyInsights()` dependency from the public homepage**

Replace the current `NEURAL FEED` section and technical spec cards with data from `resolveHomepageContent()`. Preserve the hero styling and current cyber palette, but do not expose raw dataset names, token counts, or Dify feed language on the public front page.

- [ ] **Step 2: Render the homepage in this order**

1. Hero
2. Sponsor strip
3. Featured Guides
4. Pilot Academy
5. Engineering Lab
6. AI Tools
7. Recent Posts
8. Editor’s Picks
9. Category rails
10. Newsletter / lower sponsor strip

- [ ] **Step 3: Use the shared card model for public content**

```tsx
{content.featuredGuides.map((card) => (
  <Card key={card.slug} className="group">
    <CardHeader>
      <Badge>{card.category}</Badge>
      <Link href={card.href}>
        <CardTitle>{card.title}</CardTitle>
      </Link>
      <CardDescription>{card.excerpt}</CardDescription>
    </CardHeader>
    <CardFooter>
      <span>{card.readingTime}</span>
      <span>{card.publishedAt}</span>
    </CardFooter>
  </Card>
))}
```

- [ ] **Step 4: Keep the current brand identity**

Keep the dark cyber visual language, but simplify the text layer so the page reads as an editorial product. The hero can remain ambitious, but the blocks beneath it must read like a public content hub rather than an operations dashboard.

- [ ] **Step 5: Verify the render in both router entrypoints**

Because this repo still duplicates the homepage in `src/app/page.tsx` and `app/page.tsx`, both files must render the same visual hierarchy with the same data resolver.

Run:
```bash
npx tsc --noEmit --pretty false
```

Expected:
- TypeScript passes.
- Both route entrypoints render the same homepage hierarchy.

---

### Task 3: Update the public home navigation and supporting teaser blocks

**Files:**
- Modify: `src/lib/navigationData.ts`
- Modify: `src/app/layout.tsx` if the homepage metadata needs a better public-facing title/description
- Modify: `src/app/sitemap.xml/route.ts` if any homepage-linked paths need priority changes

- [ ] **Step 1: Make the nav and homepage teaser labels match the new hierarchy**

Use the same public labels everywhere:
- Pilot Academy
- Engineering Lab
- AI Tools
- Featured Guides
- Recent Posts
- Editor’s Picks

Avoid using internal terms like `NEURAL FEED`, `SYS.DIFY.RAG_SYNC`, or anything that looks like a developer console.

- [ ] **Step 2: Make the public metadata match the editorial positioning**

Update the homepage metadata so the public site is described as an FPV editorial and tooling hub, not a Dify feed.

Example shape:
```ts
export const metadata = {
  title: 'FPV Lovers | Editorial Hub, Academy, Engineering Lab, and AI Tools',
  description: 'English-first FPV guides, engineering references, and practical AI tools for building, tuning, and learning faster.',
};
```

- [ ] **Step 3: Make sitemap priorities reflect the public content path**

Keep `academy`, `engineering`, `tools`, and top article pages high-priority, while the homepage remains the top-level entry point.

Run:
```bash
npx tsc --noEmit --pretty false
```

Expected:
- Navigation and metadata line up with the new homepage story.

---

### Task 4: Local browser verification with real content

**Files:**
- No new code unless a small display bug appears in one of the homepage components

- [ ] **Step 1: Start or reuse the local dev server**

Run:
```bash
PATH="$HOME/.nvm/versions/node/v20.20.2/bin:$PATH" pnpm dev
```

Expected:
- Local site runs on `http://localhost:3000`

- [ ] **Step 2: Verify the homepage in the in-app browser**

Check that the homepage shows:
- the cyber hero
- featured guides
- Pilot Academy
- Engineering Lab
- AI Tools
- sponsor strip
- recent posts
- editor’s picks
- category rails

- [ ] **Step 3: Verify no internal feed language leaks**

Confirm the public homepage does not show:
- `NEURAL FEED`
- dataset IDs
- token counts
- Dify internal labels
- feed/ingest jargon

- [ ] **Step 4: Verify mobile behavior**

On smaller widths, confirm the following stack cleanly:
- hero
- sponsor
- featured content
- academy
- engineering lab
- tools
- recent content
- editor’s picks

The fold should still feel manageable without the desktop layout collapsing awkwardly.

- [ ] **Step 5: Commit once the homepage renders cleanly**

Commit message:
```bash
git commit -m "feat: convert homepage into editorial content hub"
```

Expected:
- The homepage is now an editorial hub, not an operational feed.

---

### Task 5: Documentation and handoff refresh

**Files:**
- Modify: `PROJECT_MEMORY.md`
- Modify: `NEXT_ACTIONS.md`
- Modify: `docs/handoff/latest.md`
- Modify: `docs/handoff/latest.json`
- Modify: `docs/superpowers/specs/2026-05-18-content-plan-design.md` if the homepage hierarchy changes the published content strategy

- [ ] **Step 1: Record the new homepage hierarchy**

Write down that the public homepage now has this hierarchy:
- hero
- sponsor strip
- featured guides
- Pilot Academy
- Engineering Lab
- AI Tools
- recent posts
- editor’s picks
- category rails
- newsletter / lower sponsor strip

- [ ] **Step 2: Record the design choice for the tool trio**

Document that the frontpage AI tool priority is:
1. Build Calculator
2. Blackbox Tuning
3. Component Duel

and that RAG Explorer stays postponed until a later phase.

- [ ] **Step 3: Update the handoff packet**

Make sure the next agent sees:
- what changed
- what the homepage now depends on
- what still needs deploy verification

Run:
```bash
npm run handoff
```

Expected:
- `docs/handoff/latest.md` and `docs/handoff/latest.json` reflect the new homepage direction.

---

## Self-Review Checklist

- The homepage no longer depends on `fetchDifyInsights()` as its public source of truth.
- The same homepage hierarchy is implemented in both `src/app/page.tsx` and `app/page.tsx`.
- Public copy stays editorial and does not leak internal Dify/feed language.
- Pilot Academy, Engineering Lab, and AI Tools each have a clear visible role.
- Sponsor blocks are present but visually subordinate to the editorial content.
- Propeller content is surfaced as its own visible Engineering Lab block.
- The tool priority is Build Calculator, Blackbox Tuning, then Component Duel.
- The plan is scoped to a single frontend homepage rewrite and does not reopen Dify workflow work.

