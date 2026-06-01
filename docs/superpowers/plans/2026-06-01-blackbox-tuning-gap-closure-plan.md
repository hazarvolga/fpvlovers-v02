# Blackbox Tuning GAP Closure Plan

Date: 2026-06-01  
Scope: `/tools/blackbox-tuning`, `/api/tools/blackbox-tuning`, Blackbox Dify/RAG workflow, tuning source ingestion, audit gates.

## Current State Recheck

Recent parallel work improved content, roadmap, queue state, and product media, but Blackbox Tuning's critical gaps are still open.

Evidence from the current checkout and live site:

- `src/app/api/tools/blackbox-tuning/route.ts` still uses local deterministic analysis first, then attempts Dify `/chat-messages`, then falls back to local.
- `src/features/tools/components/BlackboxTuner.tsx` still accepts `.bbl,.bfl,.csv,.log,.txt`, but the server reads uploaded files with `file.text()`. There is no real `.bbl/.bfl` parser.
- Live API smoke on `https://fpvlovers.com.tr/api/tools/blackbox-tuning` still returns `source=local` with `Dry-run is active in this environment`.
- `npm run tools:audit` still marks Blackbox Tuning as `PASS` because app token exists and tuning docs total 11, but `fpv-pid-profiles` and `fpv-troubleshooting` are still effectively empty in routing.
- `data/fpv-rag-source-pack.json` includes two `fpv-pid-profiles` items, both BLHeli-oriented; it is not yet a Blackbox/PID tuning source pack.

Conclusion: the previous GAP report remains directionally correct. The next work should not start with UI polish; it should first make the tool truthful, verifiable, and source-grounded.

## Target Outcome

Blackbox Tuning should become a production-safe FPV tuning assistant that clearly distinguishes:

1. Local guardrail mode: deterministic, conservative, no RAG claim.
2. Dify/RAG mode: source-backed Markdown answer with confidence and citations.
3. Parsed telemetry mode: CSV/text-export based metrics, with `.bbl/.bfl` explicitly unsupported until a parser exists.

The product promise should be: "Blackbox/text-export tuning advisor with conservative PID/filter guidance," not "full raw Blackbox binary analyzer" until parser support is real.

## Phase 0 — Protect Existing Work

Goal: make sure parallel changes are not overwritten.

Steps:

1. Check `git status --short`.
2. Do not touch existing untracked or unrelated runtime data unless explicitly included.
3. Keep all changes under:
   - `src/app/api/tools/blackbox-tuning/route.ts`
   - `src/features/tools/components/BlackboxTuner.tsx`
   - `src/lib/tools/blackbox-tuning.ts`
   - `scripts/tool-truth-audit.ts`
   - `data/fpv-rag-source-pack.blackbox.json` or equivalent new file
   - `docs/...`
4. Re-run focused verification after each phase.

Exit criteria:

- No unrelated files staged.
- Existing committed media/roadmap/queue changes remain intact.

## Phase 1 — Truthful MVP and Production Dify Gate

Goal: close the most damaging P0: live users currently get local fallback while the UI looks like a guided analyzer.

Implementation tasks:

1. Add a Blackbox API smoke script:
   - `npm run tools:blackbox:smoke`
   - posts a small known sample to `/api/tools/blackbox-tuning`
   - reports `source`, `warning`, `confidence`, `riskLevel`, and first Markdown heading
   - supports `BLACKBOX_SMOKE_BASE_URL` for local vs production
2. Add explicit response mode fields from the API:
   - `answerMode: "local_guardrail" | "dify_grounded"`
   - `gatewayStatus: "dry_run" | "dify_ok" | "dify_empty" | "dify_error" | "not_configured"`
3. Update UI result cards:
   - show `Local Guardrail` when source is local
   - show `Source-backed Review` only when Dify returns usable Markdown
   - surface dry-run as a status, not just a warning box
4. Investigate production env separately:
   - confirm whether `CRAWL_DRY_RUN=true`, `NODE_ENV=development`, or missing `FORCE_REAL_LLM=true` causes production dry-run
   - do not disable dry-run blindly without checking budget/rate limits
5. Add release gate:
   - Blackbox can be considered live only if smoke returns either `dify_grounded` or the UI deliberately labels itself local-only.

Exit criteria:

- Live or local smoke clearly reports the mode.
- User cannot mistake local fallback for RAG/Dify analysis.
- If production remains dry-run, this is intentional and visible.

Verification:

```bash
npm run tools:blackbox:smoke
BLACKBOX_SMOKE_BASE_URL=https://fpvlovers.com.tr npm run tools:blackbox:smoke
npx tsc --noEmit
npm run tools:audit
```

## Phase 2 — Fix Raw Log Upload Promise

Goal: remove the false `.bbl/.bfl` parser implication.

Recommended path: CSV/text export first.

Implementation tasks:

1. Change accepted file types in UI to `.csv,.log,.txt` for now.
2. Update helper copy:
   - "Upload a Betaflight Blackbox Explorer CSV export, CLI dump, or short text excerpt."
   - "Raw .bbl/.bfl binary parsing is not enabled yet."
3. Add server-side extension guard:
   - reject `.bbl` and `.bfl` with HTTP 400 and clear message
   - keep max file limit
4. Add parser scaffold for CSV/text:
   - parse headings if CSV
   - detect common columns such as `time`, `gyroADC`, `gyro`, `setpoint`, `motor`, `debug`, `throttle`
   - return `parsedTelemetrySummary`
5. Feed parsed summary into local analyzer and Dify prompt.

Exit criteria:

- Upload promise matches actual parser capability.
- `.bbl/.bfl` no longer silently becomes garbage text.
- CSV/text export path produces a useful summary.

Verification:

```bash
npm run tools:blackbox:test
npx tsc --noEmit
```

## Phase 3 — RAG Corpus and Citation Grounding

Goal: make Dify answers source-backed enough to justify tuning recommendations.

Data plan:

1. Create a dedicated Blackbox/tuning source pack:
   - `data/fpv-rag-source-pack.blackbox.json`
2. Include source metadata:
   - dataset
   - url
   - source type
   - firmware version relevance
   - priority
   - expected coverage
3. Initial target sources:
   - Betaflight official PID tuning docs
   - Betaflight filtering/RPM filter docs
   - Betaflight Blackbox docs
   - Betaflight CLI/reference for tuning parameters
   - Oscar Liang propwash/filter/RPM guides
   - UAV Tech tuning/PIDToolbox workflow references
   - IntoFPV PID tuning examples
   - RotorBuilds known-good tune examples where usable

Dataset targets:

- `fpv-flight-tuning`: conceptual tuning, filters, Blackbox workflows.
- `fpv-pid-profiles`: profile examples, baseline values, firmware-version-specific notes.
- `fpv-troubleshooting`: hot motors, desync, oscillation, propwash diagnostics.

Crawl/RAG rules:

- Do not call Crawl4AI directly from ad hoc code.
- Use dry-run first.
- Use queue/seed ingestion paths.
- Preserve source URL, title, heading path, firmware version, doc type, created/updated timestamp.

Exit criteria:

- `fpv-pid-profiles` is no longer zero.
- `fpv-troubleshooting` has tuning-related troubleshooting docs.
- Dify answer can expose source/citation metadata or route can report low-confidence/no-citation state.

Verification:

```bash
CRAWL_DRY_RUN=true npm run seeds:backlog-pack
CRAWL_DRY_RUN=true npm run seeds:queue
npm run tools:audit
```

## Phase 4 — API Contract for Sources and Confidence

Goal: stop hiding retrieval quality behind confident prose.

Implementation tasks:

1. Extend API response:
   - `sources: Array<{ title: string; url?: string; dataset?: string; score?: number }>`
   - `retrievalConfidence?: number`
   - `answerMode`
   - `gatewayStatus`
2. Update Dify prompt:
   - "Write strictly in English."
   - "Cite sources when available."
   - "If retrieved evidence is weak, say this is a conservative starting point."
   - "Do not provide firmware-version-specific CLI commands unless firmware version is known."
3. Update UI:
   - show source list if available
   - show "No source citations returned" when Dify answer lacks citations
   - lower trust copy when local-only
4. Conservative exact-number rule:
   - if confidence < 72 or local-only, exact P/I/D/FF values are labeled "starting point"
   - D increase warnings must mention motor heat check

Exit criteria:

- User can see whether a recommendation is local heuristic or source-backed.
- Weak retrieval cannot look like a definitive answer.

## Phase 5 — Audit and Regression Gates

Goal: make the truth gate match product reality.

Update `scripts/tool-truth-audit.ts` Blackbox criteria:

Current:

- app token exists
- tuning docs > 0

Proposed:

- app token exists
- `fpv-flight-tuning >= 20`
- `fpv-pid-profiles >= 5`
- `fpv-troubleshooting >= 5`
- smoke script exists
- last smoke can identify local vs Dify mode
- binary `.bbl/.bfl` is either parsed or explicitly rejected

Status rules:

- `PASS`: Dify grounded mode verified, citations supported, parser promise truthful.
- `PARTIAL`: local guardrail mode or weak corpus.
- `FAIL`: route broken, no app token, or upload promise silently accepts unsupported binary.

Regression tests:

1. Propwash + 150Hz sample produces conservative D/filter guidance.
2. Hot motor sample lowers/aggressively limits D.
3. Unsupported `.bbl` returns clear 400 until parser exists.
4. Empty problem/log/file returns 400.
5. Dry-run Dify returns local guardrail mode explicitly.

Exit criteria:

- `tools:audit` stops over-reporting Blackbox as PASS.
- Regression tests cover safety-sensitive behavior.

## Phase 6 — Productization After Safety

Goal: improve retention and monetization only after the safety/RAG truth gap is closed.

Tasks:

1. Add "Load sample log excerpt" button instead of prefilled demo state.
2. Add related guides:
   - Betaflight PID basics
   - Hot motors checklist
   - RPM filter setup
   - Propwash troubleshooting
3. Add safe CTA modules:
   - props
   - soft mounts / gummies
   - spare motors
   - blackbox-capable FC
4. Add "Save tuning checklist" or "Compare after next flight" workflow.

Exit criteria:

- Conversion improvements do not make the tool look more authoritative than it is.

## Recommended Execution Order

1. Phase 1: API/UI truth mode + smoke script.
2. Phase 2: upload promise fix and CSV/text parser MVP.
3. Phase 5 partially: add regression tests and audit criteria.
4. Phase 3: Blackbox-specific source pack and dry-run ingestion.
5. Phase 4: citations/sources in API/UI.
6. Phase 6: content/CTA polish.

## Commit Strategy

Use one commit per phase:

1. `fix(blackbox): expose local and dify answer modes`
2. `fix(blackbox): align upload support with parser capability`
3. `test(blackbox): add tuning safety regressions`
4. `feat(rag): add blackbox tuning source pack`
5. `feat(blackbox): surface retrieval citations`
6. `feat(blackbox): add tuning follow-up CTAs`

## Rollback Strategy

- Phase 1/2 are low-risk UI/API contract hardening; rollback by reverting commits.
- RAG ingestion must be dry-run-first and queue-based. Do not delete existing datasets during this plan.
- If Dify live mode increases latency or budget usage, keep local guardrail as default and expose Dify mode only when smoke passes.

