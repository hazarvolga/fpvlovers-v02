# Affiliate Catalog Evidence Audit

**Status:** blocked pending real network verification
**Rule:** a product source URL is not an affiliate URL.

## Current boundary

The seed catalog is intentionally fail-closed. A product is eligible for an affiliate CTA only when all of these are true:

1. `active` is `true`.
2. `affiliateUrlVerified` is explicitly `true`.
3. `url` is a valid HTTP(S) destination.
4. `verificationEvidence` contains at least one HTTP(S) record proving the destination and network relationship.

Rows without this evidence remain visible only as research/source references. They are excluded from the recommendation engine and must not be described as partner links.

Run the audit with:

```bash
npm run catalog:affiliate-audit
```

The command reports the current counts from `data/affiliates.json` and `data/fpv-products.catalog.json`. It fails if a row claims explicit verification but does not carry a valid destination and evidence URL.

## Required operator evidence before enabling a row

- Network approval or account identifier stored in the private deployment secret manager, never in public content data.
- Destination test from the production region with the final tracking URL.
- Product identity match between the catalog row and the destination page.
- Date and reviewer recorded in `verificationEvidence` or the associated editorial record.
- Disclosure and `rel="sponsored nofollow"` preserved on the rendered CTA.

No URL parameters, commission rates, traffic numbers, or partner claims should be invented to make a row pass this gate.

## Current interpretation

Until the operator completes the evidence checklist, the correct public state is **source pending verification**, not “affiliate ready”. This is deliberate and protects both application credibility and reader trust.
