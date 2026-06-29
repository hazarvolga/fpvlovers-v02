# Technical Spec Trust Layer Design

Date: 2026-06-29
Status: Proposed
Owner: FPVLovers
Related Decision: Commercial/Affiliate readiness must follow technical spec trust hardening.

## Objective

Upgrade FPVLovers from heuristic product extraction to an evidence-bound technical specification pipeline. The goal is to prevent crawler noise, retailer copy errors, and AI inference from becoming engineering-safe recommendations in Part Matcher, Build Calculator, Hardware Analyzer, buyer guides, comparisons, or affiliate content.

The system must not pretend that marketplace data is verified. Missing critical fields remain unknown. Conflicting fields move products into review. Only verified specs may support engineering-safe tool outputs.

## Brutal Premise

The current product catalog is useful for discovery, images, and early commercial routing, but it is not yet safe enough for hardware compatibility promises. It stores primitive specs such as `kv`, `escAmp`, `cellCount`, `propSize`, `weight`, and `mount` after heuristic parsing. That is acceptable for browsing. It is not acceptable for “this build is safe to power up.”

Affiliate content can wait. A wrong voltage, ESC current, mounting pattern, connector, gyro, or protocol claim can destroy user hardware and brand trust.

## Existing Architecture Constraints

FPVLovers does not currently use Prisma for the catalog path. The implementation must follow the repository's existing structure:

- SQL migrations live in `db/migrations/`.
- Commerce products already exist in `fpvlovers_commerce.products`.
- Database access is through `pg` and server modules, not Prisma models.
- Product extraction currently lives in `src/lib/tools/product-catalog-extractor.ts`.
- Crawler catalog normalization currently lives in `src/lib/tools/crawler-product-catalog.ts`.
- Local/catalog compatibility consumers currently use `src/lib/tools/fpv-product-types.ts`, `src/lib/tools/component-compatibility.ts`, Part Matcher, Build Calculator, and Hardware Analyzer routes.
- UI compatibility must be preserved while the internal trust model becomes stricter.

## Recommended Approach

Use a vertical-slice trust layer, not a big-bang rewrite.

### Rejected approach: affiliate-first

This would improve buyer guides, comparison pages, CTAs, and affiliate applications immediately. It is fast but strategically weak. It increases the number of commercial recommendations before the underlying product data is safe.

### Rejected approach: full big-bang catalog rewrite

This would attempt to migrate database schema, crawler extraction, product admin, every tool, and every commercial page at once. The idea is correct, but the blast radius is too high. It risks breaking working admin, crawler, content, and public tool flows.

### Selected approach: trust-layer vertical slice

Build the smallest real path from extracted spec to verified/unsafe tool behavior:

`raw crawl -> evidence-bound extraction -> quarantine ingestion -> conflict detection -> verified catalog -> guarded tool output`

This path can coexist with the existing catalog and UI. Legacy primitive getters remain available, but only as compatibility serializers over evidence-bound specs.

## Data Model

### Trust statuses

Products receive one catalog-level trust status:

- `QUARANTINE`: newly extracted or imported; not safe for engineering decisions.
- `REVIEW_REQUIRED`: conflicting or incomplete critical data requires human review.
- `VERIFIED`: critical specs have sufficient evidence for safe tool use.
- `REJECTED`: extracted record is invalid, unsafe, spam, or outside engineering limits.

### Evidence-bound spec

Every critical spec field is represented as an evidence object, not a bare primitive:

```ts
type EvidenceBoundSpec = {
  value: number | string | string[] | null;
  unit: string | null;
  sourceUrls: string[];
  sourceType: 'manufacturer' | 'retailer' | 'manual' | 'community';
  confidence: number;
  extractionMethod: 'regex' | 'llm_extraction' | 'manual_override';
  status: 'verified' | 'conflicting' | 'unverified' | 'rejected';
};
```

Domain wrappers define known fields for motors, ESCs/stacks, batteries, frames, video systems, receivers, radios, goggles, and kits. Unknown non-critical specs may remain in a supplemental JSON object, but they cannot be used for engineering-safe decisions.

### Database changes

Add a new migration rather than rewriting existing migrations:

- Add `trust_status TEXT NOT NULL DEFAULT 'QUARANTINE'` to `fpvlovers_commerce.products`.
- Keep `specs JSONB`, but migrate its meaning to evidence-bound spec objects.
- Add `conflict_log JSONB NOT NULL DEFAULT '[]'::JSONB`.
- Add filter columns for common deterministic queries:
  - `max_cell_count INTEGER`
  - `mounting_pattern TEXT`
  - `motor_kv INTEGER`
  - `esc_continuous_amp INTEGER`
  - `prop_diameter NUMERIC(4,2)`
  - `connector TEXT`
- Add indexes for trust status and common compatibility filters.

Existing records must not become `VERIFIED` automatically. Existing products migrate to `QUARANTINE` unless a future manual/import process proves enough evidence.

## Extraction Rules

### No bare primitives

Crawler extraction must stop returning raw `kv: 1850` for critical fields. It must return `kv: EvidenceBoundSpec`.

### No inference for critical fields

If the raw source text does not explicitly state a critical value, the extractor returns:

```ts
{
  value: null,
  unit: 'expected-unit-or-null',
  sourceUrls: [sourceUrl],
  sourceType,
  confidence,
  extractionMethod,
  status: 'unverified'
}
```

Product names are not enough evidence for critical specs. For example, `F405 60A 6S Stack` can be parsed only if the page text explicitly supports the fields; otherwise those fields remain unverified.

### Engineering sanity limits

Normalization must reject or flag impossible values:

- motor KV outside sane category ranges;
- non-industrial ESC current above reasonable FPV limits;
- battery cell counts outside expected FPV LiPo ranges;
- impossible prop diameters or mounting patterns;
- missing unit on ambiguous numeric values;
- contradictory same-source values.

The first implementation should use conservative allowlists and range checks. False negatives are acceptable. False confidence is not.

## Ingestion and Conflict Handling

Create a catalog ingestion service with a strict typed boundary:

- Accept raw crawler extraction payloads as `unknown`, not `any`.
- Validate with Zod schemas.
- Insert new products as `QUARANTINE`.
- Match existing products by stable SKU when available, otherwise normalized brand/name/source URL.
- Compare incoming evidence-bound fields with stored fields.
- If a critical field conflicts, set product `trust_status = 'REVIEW_REQUIRED'`.
- Append conflict details to `conflict_log`.
- Manufacturer and manual data outrank retailer marketplace data, but they do not silently overwrite conflicts without recording evidence.

## Tool Guardrails

Part Matcher, Build Calculator, and Hardware Analyzer must expose safety state.

### Verified-only engineering-safe path

If a tool uses catalog products for compatibility conclusions, it may mark output as engineering-safe only when all required critical fields are verified or manually approved.

### Unverified/custom input path

If a user supplies custom components, legacy catalog items, or unverified products, the tool may still return a helpful educational analysis, but the response must include:

```ts
{
  isEngineeringSafe: false,
  warning: 'Contains unverified specs. Check manufacturer manual before powering up.'
}
```

### UI compatibility

Existing React components that expect primitive specs must not break. Add serializer/getter helpers such as:

- `getSpecNumber(product, 'kv')`
- `getSpecString(product, 'mountingPattern')`
- `getLegacySpecs(product)`
- `getSpecTrustBadge(product, field)`

These helpers read evidence-bound data and return safe legacy values only when available. They must not fabricate defaults for critical fields in engineering contexts.

## Commercial and Affiliate Impact

Affiliate pages may use product tables before every spec is verified only if labels are honest:

- `Verified spec`
- `Retailer-listed, unverified`
- `Spec-analysis only`
- `Manual check required`

Hands-on product reviews remain governed by Hazar Volga Ekiz approval and evidence rules. Spec trust does not create hands-on testing evidence.

Commercial Content & Affiliate Readiness should resume after this trust foundation exists. Then buyer guides and comparisons can make stronger, more defensible claims.

## Phased Delivery

### Phase 0: Architecture fit check

Confirm current DB access, catalog file flows, admin catalog extraction route, Part Matcher, Build Calculator, and Hardware Analyzer consumers. No feature behavior changes.

### Phase 1: Type and schema foundation

Add Zod schemas and TypeScript types for evidence-bound specs. Add migration for `trust_status`, conflict log, and deterministic filter columns.

### Phase 2: Extractor and normalizer upgrade

Wrap critical extracted values in evidence-bound objects. Enforce no-inference and sanity limits. Preserve legacy serializers.

### Phase 3: Quarantine ingestion service

Add the typed ingestion service. Existing crawler writes new/updated products as quarantine or review-required, never verified by default.

### Phase 4: Tool safety integration

Guard Part Matcher, Build Calculator, and Hardware Analyzer outputs. Verified data can be engineering-safe. Unverified data must carry explicit warnings.

### Phase 5: Commercial readiness continuation

Resume affiliate content improvement using verified/spec-analysis labels and clear product evidence boundaries.

## Testing and Acceptance Criteria

- TypeScript strict checks pass without `any`.
- Existing public UI and admin routes keep compiling.
- Existing catalog consumers continue to receive legacy-safe data through serializers.
- New extraction tests prove missing critical fields remain `null`.
- Range tests reject impossible KV, ESC amp, voltage, and mounting values.
- Conflict tests move products to `REVIEW_REQUIRED`.
- Tool tests prove unverified/custom inputs return `isEngineeringSafe: false`.
- Verified-only tests prove engineering-safe output requires verified critical specs.
- Build, lint, route audit, content audit, and relevant tool regression tests pass.

## Non-Goals

- Do not build a full human review admin UI in the first slice.
- Do not auto-verify existing catalog data.
- Do not claim retailer marketplace data is manufacturer-verified.
- Do not rewrite all commercial content during the trust foundation phase.
- Do not remove current fallback/deterministic tool behavior; wrap it with safety state.

## Open Risks

- Existing JSON catalog data may contain inconsistent primitive specs and must be migrated carefully.
- Some tools currently use fallback defaults for missing values. Those defaults are useful for educational estimates but dangerous for engineering-safe conclusions.
- Manufacturer/manual sourcing may be sparse at first, so many products will remain quarantine or review-required. This is acceptable.
- Affiliate pages may look less confident initially because they will expose spec uncertainty. That honesty is preferable to fake precision.

## Decision

Proceed with the vertical-slice Technical Spec Trust Layer before the next Commercial Content & Affiliate Readiness implementation phase.
