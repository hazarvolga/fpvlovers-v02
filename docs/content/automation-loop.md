# Content Automation Loop

## Overview

The self-feeding content loop converts the first-wave content registry into enqueueable briefs, prioritizes them automatically, and feeds them into the Dify generation pipeline without manual topic entry.

## Data Flow

```
content-plan.ts (ContentBrief[])
  → brief-from-source.ts (briefFromContentEntry)
  → ContentJob (status: 'brief')
  → queue.ts (enqueueContentJob)
  → Admin UI [Queue] button
  → dify-generation.ts (generateContentViaDify)
  → SEO Content Generator workflow (Dify)
  → parse-generated-content.ts
  → Admin UI [Review] → [Approve] → [Publish]
  → content/published/<slug>.{json,md}
```

## Brief Prioritization

`pickNextBestBriefs()` scores each unprocessed brief:

| Factor | Score |
|--------|-------|
| Pillar content (`tier === 'pillar'`) | +100 |
| Troubleshooting category | +50 |
| Diagnostic search intent | +30 |
| Beginner audience | +20 |

Priority categories:
1. **Pillar gaps** — foundational content missing from the published set
2. **High-intent troubleshooting** — diagnostic content with strong search demand
3. **Support articles** — reinforces existing pillar clusters

## Reviewer Feedback Loop

When a job is reviewed, the editor can leave feedback via the `PATCH /api/admin/content/jobs/:id` endpoint:

```json
{ "status": "reviewed", "feedback": "needs simpler intro, shorter paragraphs" }
```

The feedback is stored on the `ContentJob.feedback` field and persists through state transitions. Future generation rounds can reference this feedback to improve output quality.

## Automation Triggers

| Trigger | What happens |
|---------|-------------|
| Admin clicks "New Brief" | Manual brief creation via form |
| `enqueueBestBriefs()` called | Auto-picks top N unprocessed briefs from registry |
| `[Generate]` button | Calls Dify workflow, advances status to `generated` |
| `[Publish]` button | Writes `content/published/<slug>.{json,md}` |

## File Layout

```
src/lib/
├── content-plan.ts                        # First-wave content registry (10 briefs)
├── content-types.ts                       # ContentBrief, ContentCategory types
└── content-automation/
    ├── types.ts                           # ContentJob, ContentJobStatus
    ├── queue.ts                           # File-backed queue (data/content-jobs.json)
    ├── brief-from-source.ts               # Registry → ContentJob conversion + prioritization
    ├── dify-generation.ts                 # Dify API integration
    ├── parse-generated-content.ts         # JSON response parsing
    └── ...
data/
└── content-jobs.json                      # Queue state
content/
└── published/
    └── <slug>.json, <slug>.md             # Published artifacts
```

## Maintenance Notes

- Add new content ideas to `content-plan.ts` as `ContentBrief` entries
- Run `enqueueBestBriefs(entries, existingSlugs, 3)` to get the next 3 briefs
- Use `content-jobs.json` to check queue state at any time
- Dify workflow is external — this loop only orchestrates briefs and consumes results
