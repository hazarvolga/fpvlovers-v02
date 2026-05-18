# Dify Content Automation Contract

## State Machine

```
brief -> queued -> generating -> generated -> reviewed -> approved -> published
                                                                    |
                                                              (idempotent)
```

## State Definitions

| State | Description | Actor |
|-------|-------------|-------|
| `brief` | Initial content idea with SEO metadata and topic outline | Automation |
| `queued` | Brief accepted and waiting for Dify generation | Automation |
| `generating` | Dify workflow is actively producing content | Automation |
| `generated` | Dify returned structured draft (JSON body sections) | Automation |
| `reviewed` | Human editor reviewed and marked draft as acceptable | Editor |
| `approved` | Draft finalized and ready for publication | Editor |
| `published` | Content written to `content/published/<slug>.md` | Publisher |
| `failed` | Generation or validation error, job halted | Automation |

## Role Boundaries

| Actor | Advances State To |
|-------|-------------------|
| **Automation** | `queued`, `generating`, `generated`, `failed` |
| **Editor** | `reviewed`, `approved` |
| **Publisher** | `published` |

## Type Contract

See `src/lib/content-automation/types.ts`:

- `ContentJobStatus` — union of all valid states
- `ContentJob` — full job payload with SEO, template, and path fields

## Queue Persistence

File-backed queue at `data/content-jobs.json`.

Helpers in `src/lib/content-automation/queue.ts`:

- `loadContentJobs()` — reads queue, returns `[]` if file missing
- `saveContentJobs(jobs)` — writes deduplicated jobs sorted by `updatedAt` desc
- `enqueueContentJob(job)` — appends a job if `id` is not already present, fills `status` to `brief` and timestamps if absent

## Template Categories

| Template | Use Case |
|----------|----------|
| `tech-article` | General how-to, explainer, or gear guide |
| `build-guide` | Step-by-step build walkthrough with parts list |
| `comparison` | Product vs product comparison with decision matrix |
| `troubleshooting` | Symptom-based debug and fix article |
| `regulation-guide` | Legal, airspace, or SHGM compliance explainer |
| `community-roundup` | Event recap, community news, pilot spotlight |
