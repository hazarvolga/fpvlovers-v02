# FPVLovers Product Review Workflow

Product reviews are the only content class that requires a named human editor. The editor is **Hazar Volga Ekiz**. Other guides and research articles remain autonomous, but still pass deterministic source, metadata, link, disclosure, and duplicate-content gates.

## Intake

1. A brand or retailer sends the product through `/advertise#product-evaluation` or `/contact`.
2. Record whether the unit is purchased, supplied, loaned, or unavailable. A supplied or loaned unit must have a visible disclosure.
3. Record the exact product URL, manual/specification URL, firmware/version, test dates, and any compensation or usage-rights terms.
4. Shipping a product does not guarantee a review, score, backlink, affiliate placement, or publication date.

## Editorial states

`generated -> reviewed -> approved -> published` is the human review chain. The admin API rejects missing or non-matching editor identity, invalid testing method, absent evidence URLs, and hands-on claims without a real product relationship.

Hands-on reviews require:

- Hazar Volga Ekiz as editor.
- `hands-on` testing method.
- `purchased`, `supplied`, or `loaned` relationship.
- At least one valid HTTP(S) evidence source.
- Disclosure when a unit is supplied, loaned, or compensated.

Specification analysis may be used when no physical unit exists, but it must not claim personal testing or publish a numeric hands-on verdict.

## Evidence boundary

Unverified product catalog rows remain quarantined. A catalog URL is a source reference, not proof of an affiliate relationship. Real affiliate URLs are added only after the relevant network account and destination are verified; placeholders such as `#`, invented tracking parameters, and unconfirmed partnerships are never rendered as CTAs.

## Publication check

Before publication, verify the draft, source trail, relationship disclosure, and final verdict. If evidence is missing, leave the job in review/held state and record the blocker instead of filling the gap with model inference.
