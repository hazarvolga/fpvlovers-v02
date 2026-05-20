# Frontpage Stabilization Fix Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the public homepage deploy-safe and fully editorial by adding a published-content fallback, surfacing Propeller Lab as a first-class engineering topic, and updating root metadata to match the new public frontpage hierarchy.

**Architecture:** The homepage should keep using the new editorial hub structure, but it must never rely solely on untracked generated artifacts. A small shared resolver should combine published content with a deterministic first-wave fallback so the page always has featured/recent/editorial content. Engineering Lab should expose propellers through a real section and anchor, and both root layouts should present the updated public brand language.

**Tech Stack:** Next.js App Router, React Server Components, TypeScript, existing content automation artifacts in `content/published/*.json`, `src/lib/content-plan.ts`, `src/lib/homepage/homepage-content.ts`, existing cyber UI components, lucide-react, shadcn-based cards/badges/buttons.

---

### Task 1: Make the homepage resolver deploy-safe

**Files:**
- Create: `src/lib/homepage/homepage-defaults.ts`
- Modify: `src/lib/homepage/homepage-content.ts`
- Modify: `src/lib/content-plan.ts` only if the fallback seed data needs a small export helper

- [ ] **Step 1: Add a fallback homepage seed catalog**

Create a small helper that turns the first-wave editorial plan into homepage cards. Use the already-checked-in plan items as the canonical fallback when published content is thin.

```ts
import { firstWaveContentPlan } from '@/lib/content-plan';

export function buildFallbackHomepageCards() {
  return firstWaveContentPlan.map((item) => ({
    slug: item.slug,
    title: item.title,
    excerpt: item.summary,
    category: item.category,
    readingTime: `${Math.max(1, Math.round(item.estimatedWordCount / 200))} min read`,
    publishedAt: 'Seed content',
    href: `/article/${item.slug}`,
    tier: item.tier,
  }));
}
```

- [ ] **Step 2: Merge published content with fallback content**

Update `resolveHomepageContent()` so it:
1. reads published content,
2. maps it into homepage cards,
3. fills any missing featured/recent/editor slots from the fallback catalog,
4. de-duplicates by slug.

```ts
const cards = [...publishedCards, ...fallbackCards];
const uniqueBySlug = new Map(cards.map((card) => [card.slug, card]));
const merged = [...uniqueBySlug.values()];
```

Required behavior:
- `featuredGuides` should never be empty if any fallback or published content exists.
- `recentPosts` should prefer published content but can backfill from the fallback seed catalog.
- `editorsPicks` should use support-tier fallback items when published content is too pillar-heavy.

- [ ] **Step 3: Keep public cards editorial, not operational**

Do not expose internal Dify/feed language, token counts, or dataset names through the homepage resolver.

Example public card shape:
```ts
{
  slug: 'fpv-components-wiring-guide',
  title: 'FPV Components and Wiring Guide: What Each Part Does',
  excerpt: 'A beginner-friendly map of every core FPV component...',
  category: 'Build Guides',
  readingTime: '2 min read',
  publishedAt: 'May 18, 2026',
  href: '/article/fpv-components-wiring-guide'
}
```

- [ ] **Step 4: Run typecheck**

Run:
```bash
npx tsc --noEmit --pretty false
```

Expected:
- the homepage resolver compiles
- fallback and published content share one consistent card shape

---

### Task 2: Surface Propeller Lab as a first-class engineering topic

**Files:**
- Create: `src/features/engineering/components/PropellerLabSection.tsx`
- Modify: `src/app/engineering/hardware/page.tsx`
- Modify: `app/engineering/hardware/page.tsx`
- Modify: `src/lib/homepage/homepage-content.ts`

- [ ] **Step 1: Create a reusable Propeller Lab section**

The propeller topic should be visibly represented, not hidden under a small note.

```tsx
export function PropellerLabSection() {
  return (
    <section id="props" className="space-y-4">
      <div className="flex items-center gap-2 border-b border-[#333333] pb-2">
        <Wind className="w-5 h-5 text-[#00F2FF]" />
        <h3 className="text-lg font-black uppercase text-[#f8fafc] tracking-widest">Propeller Lab</h3>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        <div className="bg-[#0A0A0B] border border-[#333] p-5">
          <h4 className="font-bold text-white mb-2">Size and pitch</h4>
          <p className="text-xs text-[#A0A0A0]">How diameter and pitch change thrust, efficiency, and motor load.</p>
        </div>
        <div className="bg-[#0A0A0B] border border-[#333] p-5">
          <h4 className="font-bold text-white mb-2">Blade count</h4>
          <p className="text-xs text-[#A0A0A0]">Bi-blade and tri-blade tradeoffs for grip, noise, and current draw.</p>
        </div>
        <div className="bg-[#0A0A0B] border border-[#333] p-5">
          <h4 className="font-bold text-white mb-2">Vibration and feel</h4>
          <p className="text-xs text-[#A0A0A0]">Prop choices that reduce oscillation and make tuning easier.</p>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Insert the section into both hardware pages**

Add the new section immediately after the hardware summary area and before the main hardware card list so the propeller topic is visible above the fold.

```tsx
import { PropellerLabSection } from '@/features/engineering/components/PropellerLabSection';

// ... after AISummaryBox
<PropellerLabSection />
```

- [ ] **Step 3: Keep the homepage teaser aligned**

Ensure the homepage engineering teaser card still points the user to the hardware page, and the hardware page itself now has a real `#props` anchor target.

Run:
```bash
npx tsc --noEmit --pretty false
```

Expected:
- the `Propeller Lab` card no longer points to a dead anchor
- the engineering page visibly introduces propeller decision-making

---

### Task 3: Update the root metadata to match the editorial homepage

**Files:**
- Modify: `src/app/layout.tsx`
- Modify: `app/layout.tsx`

- [ ] **Step 1: Replace the old HUD metadata**

Update both root layout metadata objects so the public site reads as an editorial hub, not a Dify dashboard.

```ts
export const metadata: Metadata = {
  title: 'FPV LOVERS | Editorial Hub, Academy, Engineering Lab, and AI Tools',
  description: 'English-first FPV guides, engineering references, and practical AI tools for building, tuning, and learning faster.',
  keywords: ['FPV', 'Editorial', 'Academy', 'Engineering Lab', 'AI Tools', 'Build Guides', 'Troubleshooting'],
};
```

- [ ] **Step 2: Keep the cyber visual shell**

Do not change the existing dark theme or HUD shell here. This task is only about public-facing copy and SEO alignment.

- [ ] **Step 3: Verify the metadata output**

Run:
```bash
curl -s http://localhost:3000/ | grep -o 'Editorial Hub, Academy, Engineering Lab, and AI Tools'
```

Expected:
- the title/description used by the homepage reflect the editorial positioning

---

### Task 4: Validate the homepage locally and remove stale public feed language

**Files:**
- Modify only if validation reveals a rendering issue in:
  - `src/app/page.tsx`
  - `app/page.tsx`
  - `src/lib/homepage/homepage-content.ts`

- [ ] **Step 1: Run the fast checks**

Run:
```bash
npx tsc --noEmit --pretty false
pnpm lint
```

Expected:
- TypeScript passes
- ESLint passes for the changed homepage files

- [ ] **Step 2: Verify the homepage in the browser**

Open the local homepage and confirm:
- the public content reads as an editorial hub
- the old operational feed language is gone
- the three AI tools are ordered as:
  1. Build Calculator
  2. Blackbox Tuning
  3. Component Duel
- the engineering section shows Propeller Lab as a first-class block
- sponsor blocks remain visible but subordinate

- [ ] **Step 3: Verify the fallback behavior**

Confirm that the homepage still renders sensibly if published content is sparse.

Expected:
- no empty featured/recent/editor sections on a fresh deploy
- fallback content fills the gaps without exposing internal mechanics

- [ ] **Step 4: Commit and handoff**

Commit message:
```bash
git commit -m "fix: stabilize editorial homepage hierarchy"
```

Then update:
- `PROJECT_MEMORY.md`
- `NEXT_ACTIONS.md`
- `docs/handoff/latest.md`
- `docs/handoff/latest.json`

---

## Self-Review Checklist

- The homepage now has a deploy-safe content path.
- The homepage no longer depends on an empty or untracked generated-content set.
- Propeller Lab is visible and its CTA target is real.
- Root metadata matches the editorial homepage story.
- AI tools remain prioritized as Build Calculator, Blackbox Tuning, and Component Duel.
- The plan is focused on frontpage stabilization and does not reopen the Dify workflow work.

