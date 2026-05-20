<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **FPVLovers** (1437 symbols, 2063 relationships, 41 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/FPVLovers/context` | Codebase overview, check index freshness |
| `gitnexus://repo/FPVLovers/clusters` | All functional areas |
| `gitnexus://repo/FPVLovers/processes` | All execution flows |
| `gitnexus://repo/FPVLovers/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->

## Architecture: Pure Agentic System

FPVLovers uses a **Pure Agentic Architecture** where all workflow orchestration is handled by custom TypeScript lib modules. There are no external workflow tools (n8n has been removed).

### src/ Directory Structure

All source code lives under `src/`:

| Directory | Purpose |
|-----------|---------|
| `src/app/` | Next.js App Router pages and API routes |
| `src/lib/` | Core TypeScript lib modules (orchestrators, clients, utilities) |
| `src/lib/agents/` | 6 AI agent modules |
| `src/lib/seo/` | SEO metadata utilities |
| `src/types/` | Shared TypeScript type definitions |
| `src/hooks/` | React custom hooks |
| `src/components/ui/` | Reusable UI primitives (badge, button, card, AISummaryBox) |
| `src/features/admin/components/` | Admin dashboard components |
| `src/features/content-blocks/components/` | Block renderer and block view components |
| `src/features/layout/components/` | Navbar, SystemHUD |
| `src/features/monetization/components/` | AdZone, AffiliateButton, AffiliateCard, NativeAds, SponsorDashboard |
| `src/features/navigation/components/` | Breadcrumb |
| `src/features/tools/components/` | Interactive tool widgets (AffexDuelEngine, BlackboxTuner, FlightCriticWidget, HardwareAnalyzer, NewsletterWidget, PartMatcherWidget, PilotPulseWidget) |

### Path Alias

`@/*` resolves to `src/*` (configured in `tsconfig.json`).

Example: `@/lib/utils` → `src/lib/utils.ts`

### 8 Core Lib Modules

| Module | Responsibility |
|--------|---------------|
| `master-orchestrator.ts` | Top-level request routing and agent coordination |
| `master-routing-tables.ts` | Route definitions and dispatch rules |
| `retrieval-orchestrator.ts` | RAG retrieval pipeline coordination |
| `response-composer.ts` | Final response assembly from agent outputs |
| `ecosystem-intelligence.ts` | FPV ecosystem knowledge and context |
| `monetizationOrchestrator.ts` | Affiliate, sponsor, and ad orchestration |
| `dify-client.ts` / `dify-caller.ts` | Dify LLM API integration |
| `llm-cache.ts` | LLM response caching layer |

### 6 AI Agents (`src/lib/agents/`)

`affiliateAgent`, `ecosystemAgent`, `metadataAgent`, `recommendationAgent`, `retrievalAgent`, `seoAgent`, `sponsorshipAgent`

`index.ts` exports all agents.

### Conventional Commits

All commits must follow Conventional Commits format: `type(scope): description`

Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`

Enforced by commitlint + husky git hooks.

---

## n8n Removed

n8n workflow orchestration has been removed from this project. All orchestration is now handled by the custom TypeScript lib modules in `src/lib/` listed above. Do not reference n8n, n8nac, or n8n-as-code in any new code or documentation.
