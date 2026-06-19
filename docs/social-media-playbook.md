# FPVLovers Social Media Playbook

## Positioning

FPVLovers is a tactical FPV knowledge system for pilots who want cleaner decisions before the next flight. It serves beginners, builders, racers, and cinematic pilots through practical education, product context, engineering tools, and community knowledge.

Voice: cinematic, technical, credible, calm, community-first. Teach before selling. Avoid hype, fake urgency, engagement bait, and claims that are not supported by the article.

## Platform system

| Platform | Role | Recommended cadence | Native formats | Primary CTA | Signals |
|---|---|---|---|---|---|
| Facebook | Community discussion and article discovery | 3 posts/week | image, short video, useful group post | Read, discuss, save | qualified clicks, comments, saves |
| Instagram | Visual identity and saveable education | 3-4 posts/week | carousel, Reel, Story | Save or read guide | saves, profile visits, link clicks |
| YouTube Shorts | Searchable micro-education | 2/week | 20-45s demo/explainer | Full guide in profile | retention, rewatches, guide visits |
| TikTok | Accessible technical discovery | 2-3/week | myth, mistake, setup, comparison | Learn the tradeoff | completion, shares, search traffic |
| X | Timely technical notes and threads | 4-5 posts/week | observation, mini-thread, release note | Read source/guide | replies, bookmarks, link clicks |
| Reddit | Native community contribution | 1 strong post/week where permitted | complete text post, transparent link | Discuss/correct | useful replies, moderator acceptance |
| LinkedIn | Engineering credibility, governance, and sponsor-safe business updates | 2 posts/week | technical note, system lesson, project update | Read the method or discuss | qualified profile visits, partner inquiries |

Cadence is a recommendation, not a commitment. Start with the volume the team can sustain for four weeks.

## Automation workflow

1. A published article becomes a deterministic fact pack; each factual sentence receives a stable fact ID.
2. `POST /api/admin/social/jobs` creates platform-specific copy and, for vertical-video platforms, a private video manifest.
3. Dify may direct scene order and narration only through allowed fact IDs. Unsupported facts fail validation.
4. Product-review and sponsored jobs require human approval. Other content may advance after automated QA.
5. Rendered YouTube uploads remain private by default. `ENABLE_YOUTUBE_UPLOAD=true` plus valid OAuth credentials is required even for private upload.
6. Public scheduling remains a separate, auditable operation; implementation never posts automatically merely because copy was generated.

## Reusable templates

### New article announcement

`[PROBLEM]` looks simple until `[CONSEQUENCE]`. Our new guide maps the setup, tradeoffs, and mistakes that matter: `[ARTICLE TITLE]`. Read: `[URL]`
Affiliate note: `[INCLUDE ONLY IF COMMERCIAL LINKS EXIST]`.

### Product comparison

`[PRODUCT A]` vs `[PRODUCT B]` is not one universal winner. Choose A for `[USE CASE]`; choose B for `[USE CASE]`. The deciding variables are `[VARIABLE 1]`, `[VARIABLE 2]`, and `[VARIABLE 3]`. Full comparison: `[URL]`.

### Beginner tip

Beginner signal check: before `[ACTION]`, verify `[CHECK 1]`, `[CHECK 2]`, and `[CHECK 3]`. It takes `[REALISTIC TIME]` and can prevent `[FAILURE]`. Save this for the workbench.

### Weekly FPV deal

Observed `[DATE/TIME/TIMEZONE]`: `[PRODUCT]` at `[PRICE]` from `[RETAILER]`. Good fit for `[USE CASE]`; check `[COMPATIBILITY LIMIT]` before buying. Price and stock can change. `[AFFILIATE DISCLOSURE]` `[URL]`.

### Race/event announcement

Race signal: `[EVENT]` takes place `[DATE]` in `[LOCATION/PLATFORM]`. Watch for `[CLASS/PILOT/STORYLINE]`. Official details: `[PRIMARY SOURCE]`. FPVLovers preview: `[URL, OPTIONAL]`.

### Educational thread

1. `[TOPIC]` in FPV, without the folklore.
2. The system is doing `[MECHANISM]`.
3. The common mistake is `[MISTAKE]`.
4. Use `[CHECK/METHOD]` to decide.
5. Full reference, sources, and limits: `[URL]`.

### Sponsor-safe post

Sponsored by `[BRAND]`. We collaborated on `[FORMAT/SCOPE]`; the relationship does not guarantee a positive conclusion. Here is what matters for `[AUDIENCE]`: `[USEFUL DETAIL]`, `[TRADEOFF]`, `[SAFETY/COMPATIBILITY NOTE]`. Details: `[URL]`.

## Platform adaptations

- Instagram carousel: problem, three decision cards, tradeoff card, checklist, source/CTA card.
- Short/TikTok: 2-second problem hook, visual proof or diagram, one decision rule, caveat, guide CTA.
- X: publish the useful conclusion in the post; use the link for depth, not as a substitute.
- Reddit: disclose affiliation in the opening, provide the full useful answer natively, follow subreddit rules, and avoid affiliate links unless explicitly allowed.
- Facebook groups: answer the member's question first; link only when it adds material detail and group rules permit it.

## Four-week repeatable loop

| Week | Anchor | Supporting assets |
|---|---|---|
| 1 | Beginner buyer guide | carousel, beginner tip, Short, Reddit checklist |
| 2 | Product comparison | split-screen video, X thread, poll with real tradeoff |
| 3 | Engineering/safety guide | diagram carousel, myth video, community Q&A |
| 4 | Racing/community story | event card, pilot/team context, weekly roundup |

## Disclosure patterns

- Affiliate: `This post/article contains affiliate links. FPVLovers may earn a commission from eligible purchases.`
- Sponsored: `Sponsored by [BRAND]. Editorial conclusions remain FPVLovers' own.`
- Supplied product: `[BRAND] supplied this product for evaluation and did not receive approval rights over the verdict.` Use only when true.

## Asset and tracking checklist

- 1080x1350 feed master, 1080x1920 vertical master, 1200x630 link image
- readable first frame, captions, alt text, safe-zone check, source/date label
- UTM taxonomy: `utm_source`, `utm_medium=social`, `utm_campaign`, `utm_content`
- record article slug, platform, asset ID, publish time, disclosure type
- review 24-hour and 7-day results; optimize for qualified clicks, saves, retention, and signups rather than impressions alone
