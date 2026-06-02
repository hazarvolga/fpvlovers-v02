# FPV Lovers: User Management & Authentication Design

This document outlines the finalized, production-hardened architecture, database schema, data flows, and edge cases for the FPV Lovers platform's integrated User Management and Pilot Progress tracking system. 

It incorporates critical enhancements from the multi-agent design review to ensure absolute database resilience under high load, edge-computing performance, and bulletproof security.

---

## 1. Hardened Architectural Overview

To resolve the connection pool starvation risk under our tiny database pool limit (`FPV_DB_POOL_MAX=3`), the platform implements a **Stateless JWT Session Strategy** rather than database-backed session tables. NextAuth v5 decrypts secure HTTP-Only tokens entirely in memory at the edge, requiring **0 database queries for session validation** on page loads.

```
                  ┌────────────────────────────────────────┐
                  │          Next.js App Router            │
                  │       (Next.js 15 + React 19)          │
                  └───────────────────┬────────────────────┘
                                      │
                   [NextAuth Middleware / JWT Session] (0 DB queries!)
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │      Official @auth/pg-adapter         │
                  │   - Connection pooling & leaks safe    │
                  └───────────────────┬────────────────────┘
                                      │
                                      ▼
                  ┌────────────────────────────────────────┐
                  │         PostgreSQL 17 Database         │
                  │   - users, accounts, progress          │
                  │   - indexes on foreign keys            │
                  └────────────────────────────────────────┘
```

---

## 2. Production-Ready Database Schema

All models are created under the `fpvlovers_app` schema in the `0006_user_auth_foundation.sql` migration. To eliminate seq-scan CPU bottlenecks, we explicitly index all foreign key references:

```sql
-- 1. Users Table
CREATE TABLE fpvlovers_app.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE,
    email_verified TIMESTAMP WITH TIME ZONE,
    image VARCHAR(255),
    password_hash VARCHAR(255),
    role VARCHAR(50) DEFAULT 'pilot',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Social Accounts Table (OAuth mapping for Google, Discord, GitHub)
CREATE TABLE fpvlovers_app.accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES fpvlovers_app.users(id) ON DELETE CASCADE,
    type VARCHAR(255) NOT NULL,
    provider VARCHAR(255) NOT NULL,
    provider_account_id VARCHAR(255) NOT NULL,
    refresh_token TEXT,
    access_token TEXT,
    expires_at BIGINT,
    token_type VARCHAR(255),
    scope VARCHAR(255),
    id_token TEXT,
    session_state VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT provider_unique UNIQUE (provider, provider_account_id)
);

-- Create explicit foreign key index to prevent Seq Scans
CREATE INDEX idx_accounts_user_id ON fpvlovers_app.accounts(user_id);

-- 3. Verification Tokens
CREATE TABLE fpvlovers_app.verification_tokens (
    identifier VARCHAR(255) NOT NULL,
    token VARCHAR(255) NOT NULL UNIQUE,
    expires TIMESTAMP WITH TIME ZONE NOT NULL,
    PRIMARY KEY (identifier, token)
);

-- 4. Pilot Progress Table (Roadmap & Quiz Telemetry Tracking)
CREATE TABLE fpvlovers_app.pilot_progress (
    user_id UUID PRIMARY KEY REFERENCES fpvlovers_app.users(id) ON DELETE CASCADE,
    completed_steps JSONB NOT NULL DEFAULT '[]',
    quiz_scores JSONB NOT NULL DEFAULT '{}',
    current_specialization VARCHAR(100) DEFAULT 'Beginner',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

---

## 3. Bulletproof Data Synchronization & Sync Race Resolution

### Atomic Database-Level Union Merging
To prevent lost updates (race conditions) when merging visitor `localStorage` progress with cloud records, we decommission memory-based array merging in the API handler. Instead, progress synchronization executes an **atomic SQL JSONB merge** directly inside a database transaction using the PostgreSQL `jsonb_concat` (`||`) operator:

```sql
INSERT INTO fpvlovers_app.pilot_progress (user_id, completed_steps, quiz_scores, current_specialization)
VALUES ($1, $2::jsonb, $3::jsonb, $4)
ON CONFLICT (user_id) DO UPDATE SET 
    completed_steps = (
        SELECT jsonb_agg(DISTINCT x)
        FROM jsonb_array_elements(pilot_progress.completed_steps || EXCLUDED.completed_steps) x
    ),
    quiz_scores = pilot_progress.quiz_scores || EXCLUDED.quiz_scores,
    updated_at = NOW();
```
This guarantees that concurrent clicks across devices are merged safely at the transaction layer without any lost data anomalies.

### User Synchronization Feedback Loop
Upon user sign-in or registration:
- Tarayıcı reads local `localStorage` progress.
- Fires progress sync API call.
- A premium, telemetry-themed toast notification is triggered on successful merge:
  > *📡 Telemetry Sync: [N] akademi adımı bulut profilinizle başarıyla birleştirildi! Logbook güncellendi.*

---

## 4. Cockpit UX Field-Offline Resilience

To accommodate FPV pilots studying roadmap checklist guides in fields with poor cellular signals:
- **Offline Mode Indicator:** The application listens to `navigator.onLine`. If connection is lost, it displays a non-alarming, telemetry cockpit banner at the top of `/academy/roadmap`:
  > *📡 Uçuş Alanı Çevrimdışı Modu Aktif. İlerlemeniz kumandaya (tarayıcı hafızasına) kaydediliyor. Sinyal yakalandığında buluta otomatik aktarılacaktır.*
- **State Preservation:** Checklist checks are saved to `localStorage` immediately, and synchronized atomically to PostgreSQL on the next online transition.
- **OAuth Transition Screen:** Clicking Discord/Google login triggers a premium loading overlay: *"Discord uydusuna bağlanılıyor... Sinyal aranıyor. Lütfen sayfayı kapatmayın."* to alleviate cognitive load under weak connection speeds.

---

## 5. Peer-Reviewed Decision Log

### Decision 1: Session Management Strategy
- **Decided:** Stateless JWT-based session tokens with `AUTH_SECRET` encryption.
- **Alternatives considered:** Database-backed sessions.
- **Why chosen:** Solves the PostgreSQL connection pool limit starvation (`FPV_DB_POOL_MAX=3`) completely. Reduces database session verification queries to 0, ensuring blazing-fast, edge-compatible routing check latencies.

### Decision 2: Database Adapter Integration
- **Decided:** Official `@auth/pg-adapter` integration.
- **Alternatives considered:** Custom manually written pg connection adapter.
- **Why chosen:** Official adapter has rigorous connection release validations, preventing connection leaks that would quickly exhaust the small active connection pool.

### Decision 3: Sync Conflict Resolution
- **Decided:** Atomic SQL `ON CONFLICT DO UPDATE` JSONB array aggregation merge.
- **Alternatives considered:** In-memory Node.js array manipulation (`Array.from(new Set(...))`).
- **Why chosen:** Prevents race conditions and lost update anomalies when the pilot updates their progress concurrently on multiple devices.

---

## 6. Implementation Plan Checkpoints

- [ ] **Phase 1:** Provision Google, Discord, and GitHub OAuth credentials. Add `AUTH_SECRET` and provider variables in Coolify.
- [ ] **Phase 2:** Execute SQL migration `0006_user_auth_foundation.sql` (creating users, accounts, tokens, progress tables, and explicit user foreign key indexes).
- [ ] **Phase 3:** Install `@auth/pg-adapter`, `next-auth@5.0.0-beta.25` or later, and Edge-compatible `bcryptjs`.
- [ ] **Phase 4:** Configure `src/lib/server/auth.ts` with credentials and social providers.
- [ ] **Phase 5:** Build registration/login screens and integrate the cockpit transition overlay.
- [ ] **Phase 6:** Write `/api/pilot/progress` endpoint with the atomic Postgres JSONB merge transaction.
- [ ] **Phase 7:** Integrate telemetry-style offline mode indicators and sync notifications in `/academy/roadmap`.
- [ ] **Phase 8:** Verify TypeScript compiler, smoke test edge latency, and deploy.
