<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# FPVLovers Frontend

A Next.js 15 App Router application for the FPVLovers drone community portal. Uses Tailwind CSS 4, TypeScript 5.9, and a Pure Agentic Architecture where all workflow orchestration is handled by custom TypeScript lib modules.

> **Migration note:** Migrated to `src/` layout — 2025-07-14. All source code now lives under `src/`. The `@/*` path alias resolves to `src/*`.

## Project Structure

```
fpvlovers-frontend-websitesi/
├── src/
│   ├── app/                          # Next.js 15 App Router (routes, API routes, layouts)
│   ├── components/
│   │   └── ui/                       # General-purpose UI primitives (Button, Badge, Card, AISummaryBox)
│   ├── features/                     # Feature-domain components, organized by domain
│   │   ├── admin/components/         # Admin dashboard components
│   │   ├── content-blocks/components/# Block renderer and block views
│   │   ├── layout/components/        # Navbar, SystemHUD
│   │   ├── monetization/components/  # AdZone, AffiliateButton, NativeAds, etc.
│   │   ├── navigation/components/    # Breadcrumb
│   │   └── tools/components/         # Tool widgets (BlackboxTuner, FlightCritic, etc.)
│   ├── hooks/                        # Custom React hooks (e.g., src/hooks/use-mobile.ts)
│   ├── lib/                          # Core lib modules and AI agents
│   │   ├── agents/                   # 6 AI agents (SEO, Affiliate, Sponsorship, etc.)
│   │   └── seo/                      # SEO metadata helpers
│   └── types/                        # Shared TypeScript types (e.g., src/types/blocks.ts)
├── middleware.ts                     # Next.js middleware (stays at project root)
├── data/                             # Runtime data — accessed via process.cwd()
├── content/                          # Runtime content — accessed via process.cwd()
├── tsconfig.json                     # @/* → ./src/*
└── next.config.ts                    # output: standalone
```

## Run Locally

**Prerequisites:** Node.js 20+

1. Install dependencies:
   ```
   npm install
   ```
2. Set environment variables in `.env.local` (see `.env.local` for required keys)
3. Run the dev server:
   ```
   npm run dev
   ```

## Build

```
npm run build
```

The build uses `output: 'standalone'` for Docker deployment. The standalone output is generated at `.next/standalone/`.

## Path Alias

`@/*` resolves to `src/*`. For example:

- `@/lib/utils` → `src/lib/utils.ts`
- `@/features/layout/components/Navbar` → `src/features/layout/components/Navbar.tsx`
- `@/components/ui/button` → `src/components/ui/button.tsx`

## Commit Convention

All commits must follow [Conventional Commits](https://www.conventionalcommits.org/) format: `type(scope): description`

Valid types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`, `perf`, `ci`

Enforced by commitlint + husky git hooks. See [CONTRIBUTING.md](./CONTRIBUTING.md) for details.
