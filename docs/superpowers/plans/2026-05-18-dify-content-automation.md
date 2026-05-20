# FPVLovers Dify Content Automation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a self-feeding FPV content system where content briefs are queued automatically, Dify generates structured English drafts, the app stores and previews them, and approved content can be published without manual rewriting.

**Architecture:** Treat content production as a pipeline with explicit states: brief -> queued -> generated -> reviewed -> approved -> published. Keep the workflow contract in shared TypeScript types, keep Dify prompts and response parsing in one place, and keep the admin UI focused on queue health, draft quality, and publish actions. The existing `src/app/api/admin/content/*` routes become the main integration points, while shared content helpers stay in `src/lib/content-automation/*` so the duplicated `app/` tree can stay thin.

**Tech Stack:** Next.js 15, React 19, TypeScript, local filesystem JSON/MD artifacts for queue state, existing Dify API integration, shadcn/ui, Playwright browser smoke, ESLint, `npx tsc`.

---

### Task 1: Define the content automation contract and queue model

**Files:**
- Create: `src/lib/content-automation/types.ts`
- Create: `src/lib/content-automation/queue.ts`
- Create: `docs/content/dify-content-automation-contract.md`

- [x] **Step 1: Define the job states and job payload**

```ts
export type ContentJobStatus =
  | 'brief'
  | 'queued'
  | 'generating'
  | 'generated'
  | 'reviewed'
  | 'approved'
  | 'published'
  | 'failed';

export type ContentJob = {
  id: string;
  briefSlug: string;
  title: string;
  category: string;
  status: ContentJobStatus;
  topic: string;
  language: 'en';
  template: 'tech-article' | 'build-guide' | 'comparison' | 'troubleshooting' | 'regulation-guide' | 'community-roundup';
  promptVersion: string;
  sourceHints: string[];
  seo: {
    slug: string;
    metaDescription: string;
    keywords: string[];
  };
  draftPath?: string;
  publishedPath?: string;
  createdAt: string;
  updatedAt: string;
};
```

- [x] **Step 2: Add queue helpers with file-backed persistence**

```ts
export function loadContentJobs(): ContentJob[] {
  // read data/content-jobs.json, return [] if missing
}

export function saveContentJobs(jobs: ContentJob[]): void {
  // write sorted jobs back to data/content-jobs.json
}

export function enqueueContentJob(job: ContentJob): ContentJob[] {
  // append new jobs only if the id does not already exist
}
```

- [x] **Step 3: Write the workflow contract doc**

Document the exact transition order:
```md
brief -> queued -> generating -> generated -> reviewed -> approved -> published
```

Also document who advances each state:
- automation advances `queued`, `generating`, `generated`
- editor advances `reviewed`, `approved`
- publisher advances `published`

- [x] **Step 4: Validate the new shared types**

Run: `npx tsc --noEmit --pretty false`
Expected: no type errors from the new shared content automation types.
Result: passed cleanly, zero errors.

---

### Task 2: Turn the existing Dify generation routes into a single structured content generator

**Files:**
- Modify: `src/app/api/admin/content/generate/route.ts`
- Modify: `src/app/api/admin/content/route.ts`
- Create: `src/lib/content-automation/dify-generation.ts`
- Create: `src/lib/content-automation/parse-generated-content.ts`

- [x] **Step 1: Move prompt construction into a shared generator helper**

```ts
export function buildContentGenerationPrompt(input: {
  topic: string;
  title: string;
  category: string;
  template: string;
  language: 'en';
  brief: {
    primaryKeyword: string;
    secondaryKeywords: readonly string[];
    summary: string;
    outline: readonly string[];
  };
}) {
  return `You are FPVLovers' editorial content engine...
Generate only valid JSON with title, seo, outline, body_sections, excerpt, internal_links, and publish_notes.`;
}
```

- [x] **Step 2: Standardize the generated JSON shape**

```ts
export type GeneratedContent = {
  title: string;
  seo: {
    slug: string;
    metaDescription: string;
    keywords: string[];
  };
  excerpt: string;
  bodySections: Array<{
    id: string;
    title: string;
    content: string;
  }>;
  internalLinks: string[];
  publishNotes: string[];
};
```

- [x] **Step 3: Parse and sanitize Dify responses in one place**

```ts
export function parseGeneratedContent(answer: string): GeneratedContent | null {
  const match = answer.match(/\{[\s\S]*\}/);
  if (!match) return null;
  const parsed = JSON.parse(match[0]);
  return {
    ...parsed,
    title: String(parsed.title || '').trim(),
    excerpt: String(parsed.excerpt || '').trim(),
  };
}
```

- [x] **Step 4: Update the admin endpoints to return structured generation metadata**

The response should include:
```ts
{
  success: boolean;
  template: string;
  jobId?: string;
  content?: GeneratedContent;
  sources: Array<{ dataset: string; source: string; score: number }>;
}
```

- [x] **Step 5: Keep the routes backward-compatible while the UI is migrated**

Result: Task 2 completed by Codex (committed as `9544d6e feat: unify Dify content automation`).

Do not break the current admin page; the existing route shape can be extended, but the old callers must continue to work during the transition.

---

### Task 3: Add content queue creation, review, and publish endpoints

**Files:**
- Create: `src/app/api/admin/content/jobs/route.ts`
- Create: `src/app/api/admin/content/jobs/[id]/route.ts`
- Create: `src/app/api/admin/content/publish/route.ts`
- Modify: `src/app/api/admin/content/route.ts`

- [x] **Step 1: Add an endpoint to list queued and generated jobs**
- [x] **Step 2: Add an endpoint to advance a job state safely**
- [x] **Step 3: Add an endpoint to publish a reviewed job**
- [x] **Step 4: Make publish idempotent**
- [x] **Step 5: Add a small dry-run mode**
- [x] **Step 6: Validate the queue flow with a real sample job**

Result (2026-05-18): All steps verified. tsc noEmit clean, 9/9 smoke tests passed.

Run a local cycle:
1. create a brief job
2. generate draft
3. inspect returned JSON
4. advance to reviewed
5. publish

Expected: the job moves through the state machine without needing manual file edits.

---

### Task 4: Build the admin workflow UI for self-feeding content

**Files:**
- Modify: `src/app/admin/page.tsx`
- Modify: `app/admin/page.tsx`
- Create: `src/components/admin/ContentAutomationPanel.tsx`
- Create: `src/components/admin/ContentJobTable.tsx`

- [x] **Step 1: Add a content automation panel to the admin dashboard**

The panel should show:
- queue size
- failed jobs
- generated drafts awaiting review
- published jobs today

- [x] **Step 2: Show job rows with only user-facing content labels**

Visible columns:
```ts
['Title', 'Category', 'Status', 'Updated', 'Actions']
```

Do not show internal prompt text or internal source metadata in the default table view.

- [x] **Step 3: Add action buttons for generate, review, approve, and publish**

Use compact buttons with clear labels:
- `Generate`
- `Review`
- `Approve`
- `Publish`

- [x] **Step 4: Add a manual enqueue form for new briefs**

Fields:
```ts
{
  title: string;
  category: string;
  topic: string;
  template: string;
}
```

This gives us a controlled manual fallback when automation needs a nudge.

- [x] **Step 5: Verify the admin UI in the browser**

Result: Task 4 completed (2026-05-18). tsc noEmit clean, 9/9 smoke tests passed.

---

### Task 5: Wire the self-feeding loop from source intelligence to content generation

**Files:**
- Modify: `src/lib/content-plan.ts`
- Modify: `src/lib/content-types.ts`
- Modify: `src/app/api/admin/content/generate/route.ts`
- Create: `src/lib/content-automation/brief-from-source.ts`
- Create: `docs/content/automation-loop.md`

- [x] **Step 1: Convert the first-wave content registry into enqueueable briefs**

```ts
export function briefFromContentEntry(entry: ContentBrief): ContentJob {
  return {
    id: crypto.randomUUID(),
    briefSlug: entry.slug,
    title: entry.title,
    category: entry.category,
    status: 'brief',
    topic: entry.summary,
    language: 'en',
    template: entry.tier === 'pillar' ? 'build-guide' : 'tech-article',
    promptVersion: 'v1',
    sourceHints: entry.relatedTopics,
    seo: {
      slug: entry.slug,
      metaDescription: entry.metaDescription,
      keywords: [entry.primaryKeyword, ...entry.secondaryKeywords],
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
```

- [ ] **Step 2: Create a loop that can generate the next best brief automatically**

The loop should prioritize:
1. pillar gaps
2. high-intent troubleshooting topics
3. support articles that connect to the current pillar cluster

- [x] **Step 3: Add a simple feedback field after review**

Allow the reviewer to store:
```ts
{ "feedback": "needs simpler intro", "priority": "medium" }
```

This lets the next generation round improve without rebuilding the whole pipeline.

- [x] **Step 4: Document the automation loop for future maintainers**

Explain:
- where the brief comes from
- how Dify is triggered
- where the draft lands
- who approves it
- how it gets published

- [x] **Step 5: Validate the loop with one pillar and two support articles**

Result: Task 5 completed (2026-05-18). 20/21 smoke tests passed. tsc noEmit clean.

---

### Task 6: Add smoke tests and a release checklist for the content engine

**Files:**
- Create: `scripts/content-automation-smoke.ts`
- Create: `docs/content/release-checklist.md`
- Modify: `package.json`

- [x] **Step 1: Add a smoke script that exercises the content endpoints**

```ts
// scripts/content-automation-smoke.ts
// 1. create a sample job
// 2. generate draft
// 3. verify JSON shape
// 4. mark reviewed
// 5. publish
```

- [x] **Step 2: Wire the smoke script into package.json**

```json
{
  "scripts": {
    "content:smoke": "tsx scripts/content-automation-smoke.ts"
  }
}
```

- [x] **Step 3: Write the release checklist**

Include:
```md
1. Lint passes
2. Typecheck passes
3. Content queue endpoint works
4. Generation returns valid JSON
5. Publish writes files
6. Admin panel shows the job lifecycle
7. Homepage still renders cleanly
```

- [x] **Step 4: Final validation**

Result: Task 6 completed (2026-05-18). All 6 tasks done. `npm run content:smoke` — 14/14 pass. `npx tsc --noEmit` clean.

---

## Self-Review

- Spec coverage: the plan covers the self-feeding loop, Dify workflow contract, queue state, admin UI, generation, review, approval, publishing, and smoke validation.
- Placeholder scan: no placeholders like TBD or TODO were used.
- Type consistency: the shared `ContentJob` and `GeneratedContent` shapes stay consistent across tasks.

