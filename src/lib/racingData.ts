export type RacingSectionSlug =
  | 'events'
  | 'calendar'
  | 'leagues'
  | 'pilots'
  | 'teams'
  | 'tracks'
  | 'rankings'
  | 'results'
  | 'technology'
  | 'academy'
  | 'history'
  | 'news'
  | 'media'
  | 'hall-of-fame'
  | 'future-systems';

export type RacingSection = {
  slug: RacingSectionSlug;
  title: string;
  label: string;
  description: string;
  href: string;
  status: 'live-structure' | 'crawler-ready' | 'future-system';
  modules: string[];
  seoTargets: string[];
};

export type RacingEvent = {
  id: string;
  name: string;
  organizer: string;
  scope: string;
  format: string;
  ruleset: string;
  locationModel: string;
  history: string;
  notableData: string;
  officialUrl: string;
};

export type RankingMetric = {
  label: string;
  weight: string;
  description: string;
};

export type RaceCalendarPreview = {
  window: string;
  event: string;
  region: string;
  league: string;
  status: 'source-needed' | 'crawler-target' | 'schema-ready';
};

export type RankingPreviewRow = {
  position: string;
  entity: string;
  scope: string;
  ratingSignal: string;
  sourceState: string;
};

export type TrackSpotlight = {
  name: string;
  location: string;
  gateCount: string;
  lapDistance: string;
  speedRating: string;
  difficulty: string;
  notes: string;
};

export const racingMission = {
  title: 'FPV Lovers Racing Division',
  statement:
    'Racing Division is the competitive command center for FPV aviation: global events, pilots, teams, tracks, rankings, results, race technology, media, and history in one motorsport-grade knowledge platform.',
  philosophy: [
    'Archive answers what aircraft exists.',
    'Academy answers how pilots learn.',
    'Tools answer how pilots apply knowledge.',
    'Racing answers how the best FPV pilots in the world compete.',
  ],
  northStar:
    'Build the Formula 1 style knowledge base for FPV racing, with credible data models first and live timing, rankings, and registration systems later.',
};

export const racingSections: RacingSection[] = [
  {
    slug: 'events',
    title: 'Global Events',
    label: 'Event database',
    description: 'Organizer profiles, official formats, rule links, historic winners, venues, and source-backed event pages.',
    href: '/racing/events',
    status: 'crawler-ready',
    modules: ['Event overview', 'Organizer', 'Ruleset', 'Format', 'History', 'Notable winners', 'Official links'],
    seoTargets: ['FPV racing events', 'drone racing championships', 'MultiGP events', 'FAI drone racing'],
  },
  {
    slug: 'calendar',
    title: 'Race Calendar',
    label: 'Season control',
    description: 'Upcoming, current, and completed competitions with filters for region, league, class, date, and source confidence.',
    href: '/racing/calendar',
    status: 'future-system',
    modules: ['Upcoming events', 'Current events', 'Completed events', 'Season overview', 'World calendar filters'],
    seoTargets: ['FPV racing calendar', 'drone racing schedule', 'drone race dates'],
  },
  {
    slug: 'leagues',
    title: 'Leagues',
    label: 'Competition bodies',
    description: 'Profiles for MultiGP, FAI, DRL, DCL, Street League, regional series, national bodies, and simulator leagues.',
    href: '/racing/leagues',
    status: 'crawler-ready',
    modules: ['League profile', 'Classes', 'Season scoring', 'Event pipeline', 'Official results', 'Federation links'],
    seoTargets: ['FPV racing leagues', 'drone racing league', 'MultiGP', 'Drone Champions League'],
  },
  {
    slug: 'pilots',
    title: 'Pilots',
    label: 'Driver profiles',
    description: 'Formula 1 style pilot dossiers with callsign, country, teams, league participation, achievements, race history, aircraft, and highlights.',
    href: '/racing/pilots',
    status: 'future-system',
    modules: ['Callsign', 'Country', 'Team', 'Achievements', 'Podiums', 'Rankings', 'Aircraft', 'Video highlights'],
    seoTargets: ['FPV pilots', 'drone racing pilots', 'best FPV racers'],
  },
  {
    slug: 'teams',
    title: 'Teams',
    label: 'Paddock registry',
    description: 'Team history, active pilots, championships, sponsors, technical focus, race results, and media presence.',
    href: '/racing/teams',
    status: 'future-system',
    modules: ['Team history', 'Active pilots', 'Sponsors', 'Technical focus', 'Results', 'Championships'],
    seoTargets: ['FPV racing teams', 'drone racing teams', 'DCL teams'],
  },
  {
    slug: 'tracks',
    title: 'Tracks',
    label: 'Circuit library',
    description: 'Track layouts, gate count, technical difficulty, speed rating, best laps, notable events, and visual map systems.',
    href: '/racing/tracks',
    status: 'future-system',
    modules: ['Layout map', 'Gate count', 'Difficulty', 'Speed rating', 'Best lap', 'Footage', 'Event history'],
    seoTargets: ['FPV race tracks', 'drone racing track layout', 'gate racing FPV'],
  },
  {
    slug: 'rankings',
    title: 'World Rankings',
    label: 'Rating model',
    description: 'Global, regional, national, league, season, pilot, and team rankings with transparent methodology.',
    href: '/racing/rankings',
    status: 'live-structure',
    modules: ['Global ranking', 'Regional ranking', 'Season ranking', 'Pilot rating', 'Team ranking', 'Methodology'],
    seoTargets: ['FPV world rankings', 'drone racing rankings', 'FPV pilot rating'],
  },
  {
    slug: 'results',
    title: 'Results',
    label: 'Race archive',
    description: 'Official race results, heat ladders, qualifying sheets, final brackets, split timing, and source provenance.',
    href: '/racing/results',
    status: 'crawler-ready',
    modules: ['Qualifying', 'Brackets', 'Finals', 'Lap timing', 'Winner records', 'Official PDFs'],
    seoTargets: ['FPV racing results', 'drone racing results', 'MultiGP results'],
  },
  {
    slug: 'technology',
    title: 'Race Technology',
    label: 'Engineering side',
    description: 'Latency, video systems, race motors, frames, batteries, weight optimization, track optimization, and aerodynamics.',
    href: '/racing/technology',
    status: 'live-structure',
    modules: ['Race latency', 'Video systems', 'Race motors', 'Race frames', 'Batteries', 'Aerodynamics'],
    seoTargets: ['FPV race technology', 'drone racing setup', 'low latency FPV racing'],
  },
  {
    slug: 'academy',
    title: 'Racing Academy',
    label: 'Competition training',
    description: 'Race lines, gate management, throttle discipline, track reading, mental training, qualifying, finals, and race strategy.',
    href: '/racing/academy',
    status: 'live-structure',
    modules: ['Race fundamentals', 'Race lines', 'Gate management', 'Throttle discipline', 'Track reading', 'Finals strategy'],
    seoTargets: ['learn FPV racing', 'FPV racing training', 'drone racing academy'],
  },
  {
    slug: 'history',
    title: 'History',
    label: 'Culture archive',
    description: 'Origins, milestones, technology evolution, famous championships, legendary pilots, historic tracks, and culture preservation.',
    href: '/racing/history',
    status: 'crawler-ready',
    modules: ['Origins', 'Milestones', 'Technology evolution', 'Historic pilots', 'Historic aircraft', 'Historic moments'],
    seoTargets: ['history of FPV racing', 'drone racing history', 'FPV racing champions'],
  },
  {
    slug: 'news',
    title: 'Racing News',
    label: 'Paddock feed',
    description: 'Race announcements, league updates, team moves, technology changes, simulator qualifiers, and event coverage.',
    href: '/racing/news',
    status: 'crawler-ready',
    modules: ['League updates', 'Event previews', 'Team news', 'Race tech updates', 'Qualifier notes'],
    seoTargets: ['FPV racing news', 'drone racing news', 'MultiGP news'],
  },
  {
    slug: 'media',
    title: 'Media Center',
    label: 'Broadcast hub',
    description: 'Race highlights, interviews, event coverage, documentaries, technical breakdowns, track walkthroughs, and race analysis.',
    href: '/racing/media',
    status: 'future-system',
    modules: ['Highlights', 'Interviews', 'Event coverage', 'Documentaries', 'Track walkthroughs', 'Race analysis'],
    seoTargets: ['FPV race highlights', 'drone racing videos', 'FPV pilot interviews'],
  },
  {
    slug: 'hall-of-fame',
    title: 'Hall of Fame',
    label: 'Legacy vault',
    description: 'Legendary pilots, historic teams, iconic aircraft, landmark championships, and major contributions to the sport.',
    href: '/racing/hall-of-fame',
    status: 'future-system',
    modules: ['Legendary pilots', 'Historic teams', 'Iconic aircraft', 'Historic championships', 'Major contributions'],
    seoTargets: ['FPV racing hall of fame', 'legendary FPV pilots', 'drone racing champions'],
  },
  {
    slug: 'future-systems',
    title: 'Future Systems',
    label: 'Product roadmap',
    description: 'Live results, live timing, leaderboards, event registration, fantasy racing, race predictor, and community rankings.',
    href: '/racing/future-systems',
    status: 'future-system',
    modules: ['Live timing', 'Live leaderboards', 'Track maps', 'Registration', 'Fantasy racing', 'Race predictor'],
    seoTargets: ['live FPV racing results', 'FPV fantasy racing', 'drone racing leaderboard'],
  },
];

export const racingEvents: RacingEvent[] = [
  {
    id: 'multigp',
    name: 'MultiGP',
    organizer: 'MultiGP Drone Racing League',
    scope: 'Global chapter network and championship ecosystem',
    format: 'Local chapters, qualifiers, international open events, championship brackets, spec classes, and community race formats.',
    ruleset: 'League and event-specific MultiGP rules, classes, brackets, and qualifying formats.',
    locationModel: 'Chapter fields, regional venues, championship venues, and international open race sites.',
    history: 'A major grassroots-to-championship FPV racing infrastructure with broad chapter participation.',
    notableData: 'Good source for event pages, results, brackets, chapter coverage, and pilot participation signals.',
    officialUrl: 'https://www.multigp.com/',
  },
  {
    id: 'fai-world-cup',
    name: 'FAI Drone Racing World Cup',
    organizer: 'World Air Sports Federation / CIAM',
    scope: 'Open international F9U drone racing events',
    format: 'Series of international events with annual ranking, official documents, jury process, and result templates.',
    ruleset: 'FAI Sporting Code Section 4, Volume F9 Drone Sport, F9U class rules.',
    locationModel: 'FAI-sanctioned events registered on the international calendar.',
    history: 'Official air-sport framework for drone racing with previous editions and formal result structures.',
    notableData: 'Best source for rulebook references, official ranking templates, permissions, and sanctioned calendar data.',
    officialUrl: 'https://www.fai.org/droneracingworldcup',
  },
  {
    id: 'fai-world-championship',
    name: 'FAI World Drone Racing Championship',
    organizer: 'World Air Sports Federation / national host federation',
    scope: 'World championship competition',
    format: 'National team and individual competition with official classifications and championship result PDFs.',
    ruleset: 'FAI F9 drone sport rules and event bulletins.',
    locationModel: 'Rotating international host venues.',
    history: 'Flagship world championship layer for preserving official winners, national teams, and historical results.',
    notableData: 'Use official PDFs and classification tables for historical and Hall of Fame pages.',
    officialUrl: 'https://www.fai.org/',
  },
  {
    id: 'drl',
    name: 'Drone Racing League',
    organizer: 'DRL',
    scope: 'Professional media-first drone racing property',
    format: 'Professional pilots, arena or landmark courses, broadcast/media racing, and league-owned race hardware.',
    ruleset: 'DRL race and hardware format, source-backed from official DRL pages.',
    locationModel: 'Iconic arenas, stadiums, and landmarks.',
    history: 'Important professional and media layer in FPV racing culture.',
    notableData: 'Use for pilot profiles, professional race media, tech history, and broadcast-era FPV storytelling.',
    officialUrl: 'https://www.drl.io/',
  },
  {
    id: 'dcl',
    name: 'Drone Champions League',
    organizer: 'DCL',
    scope: 'International team-based FPV racing and simulator-linked competition',
    format: 'Team racing, simulator qualification pathways, cup finals, super finals, and emerging autonomous racing links.',
    ruleset: 'DCL league format and event-specific competition rules.',
    locationModel: 'International venues plus simulator qualification systems.',
    history: 'A strong source for team profiles, team rankings, simulator qualification, and international race media.',
    notableData: 'Useful for team database, league standings, media coverage, and future autonomous racing context.',
    officialUrl: 'https://dronechampionsleague.com/',
  },
  {
    id: 'street-league',
    name: 'Street League Drone Racing',
    organizer: 'Street League',
    scope: 'Spec-oriented FPV racing series',
    format: 'Race schedule, current standings, partner-backed spec racing, and regional race progression.',
    ruleset: 'Street League spec and race-specific rules.',
    locationModel: 'Regional race venues and scheduled series events.',
    history: 'Important modern spec-racing signal for accessibility and race class standardization.',
    notableData: 'Good source for calendar, standings, tech spec pages, and partner ecosystem pages.',
    officialUrl: 'https://www.streetleague.io/',
  },
];

export const rankingMethodology: RankingMetric[] = [
  {
    label: 'Qualifying pace',
    weight: '20%',
    description: 'Measures raw speed from qualifying position, fastest clean lap, and field-adjusted lap time.',
  },
  {
    label: 'Finals conversion',
    weight: '22%',
    description: 'Rewards pilots who convert qualifying pace into bracket wins, finals placement, and elimination resilience.',
  },
  {
    label: 'Podium index',
    weight: '18%',
    description: 'Tracks podium frequency, championship wins, and weighted finish position across event tiers.',
  },
  {
    label: 'Field strength',
    weight: '16%',
    description: 'Normalizes results by event difficulty, pilot depth, league tier, and international participation.',
  },
  {
    label: 'Track difficulty',
    weight: '10%',
    description: 'Adjusts results by gate density, verticality, technical turns, average speed, and crash risk.',
  },
  {
    label: 'Consistency',
    weight: '9%',
    description: 'Measures clean-run percentage, DNS/DNF rate, lap variance, and season-long reliability.',
  },
  {
    label: 'Recency and confidence',
    weight: '5%',
    description: 'Applies recency decay and source-confidence weighting so current verified results matter most.',
  },
];

export const raceCalendarPreview: RaceCalendarPreview[] = [
  {
    window: 'Upcoming',
    event: 'MultiGP championship and chapter events',
    region: 'Global / regional',
    league: 'MultiGP',
    status: 'crawler-target',
  },
  {
    window: 'Season',
    event: 'FAI Drone Racing World Cup calendar',
    region: 'International',
    league: 'FAI F9U',
    status: 'crawler-target',
  },
  {
    window: 'League',
    event: 'Drone Champions League events and simulator pathways',
    region: 'International',
    league: 'DCL',
    status: 'crawler-target',
  },
  {
    window: 'Media',
    event: 'Drone Racing League race coverage and pilot media',
    region: 'Broadcast',
    league: 'DRL',
    status: 'source-needed',
  },
  {
    window: 'Series',
    event: 'Street League schedule and standings',
    region: 'Regional',
    league: 'Street League',
    status: 'crawler-target',
  },
];

export const rankingPreviewRows: RankingPreviewRow[] = [
  {
    position: '01',
    entity: 'Verified international event winner',
    scope: 'Global pilot',
    ratingSignal: 'Finals conversion + podium index',
    sourceState: 'Awaiting official result ingestion',
  },
  {
    position: '02',
    entity: 'Regional championship finalist',
    scope: 'Regional pilot',
    ratingSignal: 'Field strength + consistency',
    sourceState: 'Awaiting official result ingestion',
  },
  {
    position: '03',
    entity: 'League season contender',
    scope: 'League pilot',
    ratingSignal: 'Season points + clean-run rate',
    sourceState: 'Awaiting official result ingestion',
  },
  {
    position: '04',
    entity: 'Team roster entry',
    scope: 'Team ranking',
    ratingSignal: 'Team points + pilot depth',
    sourceState: 'Awaiting official team source',
  },
];

export const trackSpotlight: TrackSpotlight = {
  name: 'Source-backed track profile model',
  location: 'Venue, city, country',
  gateCount: '12-40 gates',
  lapDistance: 'Measured per official layout',
  speedRating: 'Technical / balanced / high-speed',
  difficulty: 'Gate density, verticality, crash risk',
  notes:
    'Track pages should combine official maps, gate count, best lap, race footage, event history, and source confidence before publishing any record claim.',
};

export const racingCrawlerTargets = [
  'Official league schedules and result pages',
  'FAI documents, calendars, sporting code, and classification PDFs',
  'MultiGP event pages, championship results, brackets, and chapter race pages',
  'DCL league standings, team pages, cup final reports, and media coverage',
  'Street League schedule, standings, race pages, and spec rules',
  'Official pilot and team websites for profile confirmation',
  'Official YouTube race streams and highlight metadata',
];

export const racingHomepageLayout = [
  'Hero: motorsport-grade mission statement, live-source status, section CTAs, and track telemetry visual.',
  'Ecosystem grid: Events, Calendar, Pilots, Teams, Tracks, Rankings, Technology, Academy, History, Media, Hall of Fame.',
  'Global event database preview: MultiGP, FAI, DRL, DCL, Street League, regional and national championships.',
  'Race calendar control: upcoming/current/completed/season filters with region, league, class, and date facets.',
  'Rankings methodology: transparent FPVLovers Racing Rating formula before any public leaderboard claim.',
  'Track systems: visual gate map, difficulty model, speed rating, and best-lap data model.',
  'Race technology and academy: engineering knowledge paired with training progression.',
  'Media and Hall of Fame: culture preservation, highlights, interviews, and historic achievements.',
  'Future systems: live timing, event registration, race predictor, fantasy racing, community rankings.',
];

export function getRacingSection(slug: string) {
  return racingSections.find((section) => section.slug === slug);
}
