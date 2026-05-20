# FPVLovers Content Plan and Frontend Display Design

## Context
FPVLovers now has a large RAG source corpus built from documentation, community sources, manufacturer manuals, and academic material. The next phase is content production focused on English-first SEO traffic, with a frontend that presents content in a clean, editorial way without exposing internal dataset or workflow language.

## Goals
- Grow organic search traffic first.
- Publish English-first content.
- Prioritize beginner-friendly guides with supporting troubleshooting content.
- Build topical authority around FPV setup, tuning, components, and racing.
- Keep the frontend content display simple, hybrid, and readable.
- Hide internal terms like dataset names, Dify, token counts, and ingest mechanics from users.

## Recommended Approach
The first content wave should use a hybrid editorial structure:
- 2 to 3 pillar articles
- 6 to 8 supporting articles
- Beginner-first, but with enough technical depth for intermediate readers
- Content grouped by theme and also surfaced through featured blocks on the homepage

This is the best balance between SEO coverage, content depth, and fast publish velocity.

## Content Strategy
### Primary language
English first.

### Primary content types
- Step-by-step beginner guides
- Troubleshooting and fix-it articles
- Component/setup explainers
- Tuning and flight software articles

### Initial topic priorities
1. Getting started with FPV
2. Building and setup
3. Common troubleshooting
4. Flight software basics and tuning
5. Racing and regulation content after the core base is established

### First wave content shape
- Pillar 1: FPV Beginner Setup Guide
- Pillar 2: FPV Troubleshooting Guide
- Pillar 3: FPV Core Components and Wiring Guide
- Support articles should target narrow search intent such as:
  - choosing the first radio link
  - ESC firmware basics
  - camera/VTX setup
  - no-video troubleshooting
  - Betaflight PID intro
  - FPV goggles and receiver comparisons

## Frontend Display Design
### Homepage structure
Use a hybrid layout:
- Featured guides
- Recent posts
- Editor’s picks
- Category blocks

### Homepage content presentation
- Do not show internal dataset names.
- Do not show token counts or ingestion metadata.
- Use plain article titles, short excerpts, reading time, and category chips.
- Make the content surface feel editorial, not operational.

### Content taxonomy visible to users
Use user-facing categories such as:
- Flight Guides
- Build Guides
- Troubleshooting
- Components
- Racing
- Regulations
- News and Reviews

### Card behavior
- Cards should be simple, compact, and readable.
- Highlight one primary article per section.
- Supporting cards should stay lightweight.
- Featured sections should not feel like marketing blocks.

## Editorial Workflow
1. Gather sources and map them to content themes.
2. Generate a content brief for each article.
3. Draft in English first.
4. Optimize title, headings, and excerpt for search intent.
5. Publish with category and canonical metadata.
6. Track which pillars need more supporting articles.

## Success Criteria
- The homepage clearly communicates content categories and featured reading.
- The first content wave covers both beginner and troubleshooting intent.
- No internal infrastructure language appears in the public UI.
- Search-focused English content is ready to publish consistently.

## Out of Scope For This Phase
- Monetization blocks
- Sponsor placement logic
- Complex recommendation systems
- Multi-language rollout
- Advanced personalization

## Risks
- Overloading the homepage with too many content blocks.
- Using internal terminology in user-facing text.
- Publishing too many shallow articles before the pillar pages are solid.

## Next Step
After this design is approved, create the implementation plan for:
- homepage content sections
- article card metadata
- category labels
- content brief format
- first 10 article topics
