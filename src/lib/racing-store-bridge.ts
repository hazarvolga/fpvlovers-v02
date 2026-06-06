import { readRacingIntelligenceStore } from './racing-intelligence-store';

export function getStoreCalendar() { try { return readRacingIntelligenceStore().sections?.calendar || []; } catch { return []; } }
export function getStorePilots() { try { return readRacingIntelligenceStore().sections?.pilots || []; } catch { return []; } }
export function getStoreLeagues() { try { return readRacingIntelligenceStore().sections?.leagues || []; } catch { return []; } }
export function getStoreEvents() { try { return readRacingIntelligenceStore().sections?.events || []; } catch { return []; } }
export function getStoreTracks() { try { return readRacingIntelligenceStore().sections?.tracks || []; } catch { return []; } }
export function getStoreRankings() { try { return readRacingIntelligenceStore().sections?.rankings || []; } catch { return []; } }
export function getStoreResults() { try { return readRacingIntelligenceStore().sections?.results || []; } catch { return []; } }
export function getStoreTeams() { try { return readRacingIntelligenceStore().sections?.teams || []; } catch { return []; } }
export function getStoreAcademy() { try { return readRacingIntelligenceStore().sections?.academy || []; } catch { return []; } }
export function getStoreHistory() { try { return readRacingIntelligenceStore().sections?.history || []; } catch { return []; } }
export function getStoreNews() { try { return readRacingIntelligenceStore().sections?.news || []; } catch { return []; } }
export function getStoreHallOfFame() { try { return readRacingIntelligenceStore().sections?.hallOfFame || []; } catch { return []; } }

export function getStoreSection(slug: string) {
  try {
    const store = readRacingIntelligenceStore();
    return store.sections?.[slug as keyof typeof store.sections] || [];
  } catch { return []; }
}

export function getStoreSummary() {
  try {
    const store = readRacingIntelligenceStore();
    return {
      pilots: store.sections?.pilots?.length || 0,
      events: store.sections?.events?.length || 0,
      leagues: store.sections?.leagues?.length || 0,
      tracks: store.sections?.tracks?.length || 0,
      rankings: store.sections?.rankings?.length || 0,
      results: store.sections?.results?.length || 0,
      teams: store.sections?.teams?.length || 0,
      contentBriefs: store.contentBriefs?.length || 0,
      workflowRuns: store.workflowRuns?.length || 0,
    };
  } catch { return null; }
}
