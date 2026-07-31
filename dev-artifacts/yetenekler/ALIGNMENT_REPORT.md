# FPVLovers Yetenekler Alignment Report

Date: 2026-05-29

## Scope

`yetenekler/fpvlovers-dev-skill` klasoru, root proje talimatlari ve Codex/Claude agent tanimlari guncel FPVLovers mimarisine hizalandi.

## Findings

- Skill paketi eski `app/` ve `lib/` route agacini varsayiyordu; aktif route agaci `fpvlovers-frontend-websitesi/src/app` ve core moduller `src/lib`.
- Agent promptlarinda n8n webhook/status adimlari kalmisti; proje artik pure TypeScript orchestration kullaniyor.
- Skill referanslari bazi yerlerde hayali API'ler oneriyordu (`crawlQueue.add`, `difyClient.chat` gibi); mevcut export'lara gore sadeleştirildi.
- UI referansi eski gri/kirmizi palete yaslaniyordu; mevcut cockpit black, cyan telemetry ve orange CTA tasarim diliyle hizalandi.
- Skill archive dosyalari kaynak klasorden daha eski tarihliydi; kaynak klasorden yeniden paketlendi.

## Applied Changes

- `SKILL.md` ana mimari haritasi `src/app`, `src/lib`, `src/features`, `src/components` yapisina cekildi.
- `references/crawler.md` mevcut `enqueueUrls` / `getQueueStatus` akisina gore duzeltildi.
- `references/dify.md` mevcut `difyRequest` / `runWorkflow` wrapper imzasina gore duzeltildi.
- `references/ui.md` mevcut FPVLovers tasarim diline ve admin/tab yapisina gore duzeltildi.
- Root `AGENTS.md`, root `CLAUDE.md`, app `CLAUDE.md`, `.codex/agents/*` ve `.claude/agents/*` n8n ve eski agent/path varsayimlarindan temizlendi.

## How To Use In This Project

1. FPVLovers gelistirme, crawler, Dify, RAG, admin UI veya monetization gorevlerinde once `yetenekler/fpvlovers-dev-skill/SKILL.md` okunmali.
2. Goreve gore ilgili referans dosyasi acilmali: `crawler.md`, `dify.md`, `rag.md`, `ui.md`, `server.md`, `monetization-agents.md`.
3. Crawler islemlerinde direkt Crawl4AI HTTP cagrisi yerine `src/lib/crawl-queue.ts` veya mevcut script wrapper'lari kullanilmali.
4. Dify islemlerinde direkt fetch yerine `src/lib/dify-client.ts` wrapper'i kullanilmali.
5. Yeni tool icin once deterministik motor `src/lib/tools/`, sonra UI `src/features/tools/components/`, sonra route `src/app/tools/...` eklenmeli.

## Packaging

`fpvlovers-dev-skill.skill` ve `fpvlovers-cto-assistant.skill` paketleri guncel kaynak klasorden yeniden uretildi.
