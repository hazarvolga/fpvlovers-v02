# FPVLovers Opencode + Codex Collaboration Protocol

**Purpose:** Keep planning, implementation, and review synchronized when Opencode does the hands-on work and Codex acts as planner, reviewer, and quality gate.

## Roles

- **Codex**
  - defines task order and acceptance criteria
  - maintains project memory and next actions
  - reviews implementation output and smoke tests
  - flags blockers, drift, or risky assumptions

- **Opencode**
  - executes the implementation work
  - edits code, UI, workflow, and docs
  - reports concrete results back to the shared notes
  - avoids reworking unrelated files or reversing others' changes

## Source of Truth

1. `/Users/hazarekiz/Projects/fpv-autoblog-v2/fpvlovers-frontend-websitesi/PROJECT_MEMORY.md`
2. `/Users/hazarekiz/Projects/fpv-autoblog-v2/fpvlovers-frontend-websitesi/NEXT_ACTIONS.md`
3. `/Users/hazarekiz/Projects/fpv-autoblog-v2/fpvlovers-frontend-websitesi/docs/superpowers/plans/2026-05-18-dify-content-automation.md`
4. `/Users/hazarekiz/Projects/fpv-autoblog-v2/dify_workflows/seo-content-generator.dify.yml`

## Update Order

After each meaningful change:

1. Write what changed to `PROJECT_MEMORY.md`.
2. Write remaining work or blockers to `NEXT_ACTIONS.md`.
3. If the work affects Dify/content automation, update the plan doc too.
4. Keep private ops context out of GitHub/public scope.

## Handoff Rules

- Start from the latest memory note, not from old chat context.
- Do not duplicate work that is already finished in memory.
- Do not overwrite unrelated edits made by another agent.
- If a browser/Dify change is made, verify it with a smoke test before declaring success.
- If a node or provider setting still shows validation warnings, treat that as the active blocker until cleared.

## Current State

- Gemini provider was added and the workflow was published.
- Dify workflow blockers were resolved: `retrieval_mode=multiple`, `multiple_retrieval_config`, and `google_api_key` all fixed.
- Content automation Task 1 was completed: contract + queue model + docs.
- Current next fix: start Task 2 (shared prompt construction, JSON parsing, admin endpoint wiring).

## Output Expectations

- Implementation notes should be short and concrete.
- Handoffs should say exactly what was done, what failed, and what to do next.
- Review output should always include the current blocker, not only the general goal.
