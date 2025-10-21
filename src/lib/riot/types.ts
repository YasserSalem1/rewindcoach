/**
 * Type definitions and interfaces for Riot API data structures
 */

// ============================================================================
// Region Configuration
// ============================================================================

export const REGIONS = [
  "EUW",
  "EUNE",
  "NA",
  "KR",
  "BR",
  "LAN",
  "LAS",
  "OCE",
  "RU",
  "TR",
] as const;

export type Region = (typeof REGIONS)[number];

export const REGION_CONFIG: Record<
  Region,
  {
    platform: string;
    routing: string;
  }
> = {
  EUW: { platform: "EUW1", routing: "europe" },
  EUNE: { platform: "EUN1", routing: "europe" },
  NA: { platform: "NA1", routing: "americas" },
  KR: { platform: "KR", routing: "asia" },
  BR: { platform: "BR1", routing: "americas" },
  LAN: { platform: "LA1", routing: "americas" },
  LAS: { platform: "LA2", routing: "americas" },
  OCE: { platform: "OC1", routing: "sea" },
  RU: { platform: "RU", routing: "europe" },
  TR: { platform: "TR1", routing: "europe" },
};

export const PLATFORM_TO_REGION: Record<string, Region> = {
  EUW1: "EUW",
  EUN1: "EUNE",
  NA1: "NA",
  KR: "KR",
  BR1: "BR",
  LA1: "LAN",
  LA2: "LAS",
  OC1: "OCE",
  RU: "RU",
  TR1: "TR",
};

// ============================================================================
// Static Data URLs and Constants
// ============================================================================

export const CDN_BASE = "https://ddragon.leagueoflegends.com/cdn";

export const STAT_SHARD_ICONS: Record<number, string> = {
  5001: "img/perk-images/StatMods/StatModsHealthPlusIcon.png",
  5002: "img/perk-images/StatMods/StatModsArmorIcon.png",
  5003: "img/perk-images/StatMods/StatModsMagicResIcon.png",
  5005: "img/perk-images/StatMods/StatModsAttackSpeedIcon.png",
  5007: "img/perk-images/StatMods/StatModsAbilityHasteIcon.png",
  5008: "img/perk-images/StatMods/StatModsAdaptiveForceIcon.png",
  5011: "img/perk-images/StatMods/StatModsAbilityHasteIcon.png",
  5013: "img/perk-images/StatMods/StatModsAbilityHasteIcon.png",
};

export const QUEUE_NAMES: Record<number, string> = {
  420: "Ranked Solo",
  430: "Blind Pick",
  440: "Ranked Flex",
  450: "ARAM",
  700: "Clash",
  900: "URF",
  1020: "One for All",
};

// ============================================================================
// Profile & Style DNA Interfaces
// ============================================================================

export interface StyleDNARadarPoint {
  axis: string;
  score: number; // 0 - 100
}

export interface StyleDNA {
  title: string;
  description: string;
  tags: string[];
  radar: StyleDNARadarPoint[];
}

export interface HighlightChampion {
  championId: string;
  championName: string;
  icon: string;
  games: number;
  winRate: number;
  averageKda: number;
}

export interface ProfileHighlights {
  last20WinRate: number;
  averageKda: number;
  csPerMinute: number;
  topChampions: HighlightChampion[];
}

export interface RiotProfile {
  summonerName: string;
  tagline: string;
  level: number;
  profileIcon: string;
  rankedTier: string;
  rankedDivision: string;
  rankedLp: number;
  rankedTotalMatches?: number;
  rankedWinRate?: number;
}

export interface ProfileBundle {
  puuid: string;
  profile: RiotProfile;
  styleDNA: StyleDNA;
  highlights: ProfileHighlights;
  matches: RiotMatch[];
}

// ============================================================================
// Match & Participant Interfaces
// ============================================================================

export interface ItemSlot {
  id: number;
  name: string;
  icon: string;
}

export interface RuneSelection {
  primary: string;
  secondary: string;
  shards: string[];
}

export interface RiotParticipant {
  participantId: number;
  puuid: string;
  summonerName: string;
  championId: string;
  championName: string;
  championIcon: string;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  level: number;
  goldEarned: number;
  role: string;
  lane: string;
  teamId: number;
  win: boolean;
  items: ItemSlot[];
  trinket?: ItemSlot;
  runes: RuneSelection;
  spells: string[];
  visionScore?: number;
  dragonKills?: number;
  baronKills?: number;
}

export interface MatchTeam {
  teamId: number;
  name: string;
  win: boolean;
  kills: number;
  dragons: number;
  barons: number;
  heralds: number;
  towers: number;
}

export interface RiotMatch {
  id: string;
  region: Region;
  queueId: number;
  queueType: string;
  gameVersion: string;
  gameCreation: string;
  gameDuration: number; // seconds
  primaryParticipantPuuid: string;
  participants: RiotParticipant[];
  teams: MatchTeam[];
}

// ============================================================================
// Timeline Interfaces
// ============================================================================

export type TimelineEventType =
  | "KILL"
  | "ASSIST"
  | "DEATH"
  | "TOWER"
  | "DRAGON"
  | "BARON"
  | "HERALD"
  | "OBJECTIVE"
  | "MOVE";

export interface TimelinePosition {
  x: number;
  y: number;
}

export interface TimelineEvent {
  id: string;
  type: TimelineEventType;
  timestamp: number; // seconds
  position: TimelinePosition;
  teamId?: number;
  killerPuuid?: string;
  victimPuuid?: string;
  actorPuuid?: string;
  assistingPuuids?: string[];
  description: string;
  participantsSnapshot?: TimelineParticipantSnapshot[];
}

export interface TimelineFrame {
  timestamp: number; // seconds
  events: TimelineEvent[];
  participants: Record<string, TimelineParticipantState>;
}

export interface MatchBundle {
  match: RiotMatch;
  timeline: TimelineFrame[];
}

export interface TimelineParticipantSnapshot {
  puuid: string;
  summonerName?: string;
  championName?: string;
  teamId?: number;
  position?: TimelinePosition;
}

export interface TimelineParticipantState {
  puuid: string;
  participantId: number;
  teamId: number;
  level: number;
  cs: number;
  gold: number;
  position?: TimelinePosition;
  items: number[];
}

// ============================================================================
// Coach/Chat Interfaces
// ============================================================================

export interface CoachMatchContext {
  meta?: Record<string, unknown>;
  account?: Record<string, unknown>;
  participants?: unknown[];
  teams?: unknown[];
  timeSeries?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface CoachQuestionPayload {
  matchId: string;
  question: string;
  currentTime: number;
  puuid?: string;
  gameName?: string;
  tagLine?: string;
  messages?: Array<{
    role: "system" | "user" | "assistant";
    content: string;
  }>;
  matchContext?: CoachMatchContext;
}

export interface CoachAnswerChunk {
  content: string;
  done?: boolean;
}

// ============================================================================
// Backend API Response Types (Internal DTOs)
// ============================================================================

export interface RiotMatchParticipantDto {
  puuid: string;
  summonerName: string;
  championId: number;
  championName: string;
  participantId?: number;
  champLevel?: number;
  kills: number;
  deaths: number;
  assists: number;
  totalMinionsKilled: number;
  neutralMinionsKilled: number;
  goldEarned: number;
  role: string;
  lane: string;
  teamId: number;
  win: boolean;
  item0: number;
  item1: number;
  item2: number;
  item3: number;
  item4: number;
  item5: number;
  item6: number;
  summoner1Id: number;
  summoner2Id: number;
  perks: {
    styles: Array<{
      style: number;
      selections: Array<{ perk: number }>;
    }>;
    statPerks: { offense: number; flex: number; defense: number };
  };
  visionScore?: number;
  dragonKills?: number;
  baronKills?: number;
}

export interface RiotMatchDto {
  metadata: {
    matchId: string;
    participants: string[];
  };
  info: {
    gameCreation: number;
    gameDuration: number;
    gameVersion: string;
    queueId: number;
    participants: Array<RiotMatchParticipantDto>;
    teams: Array<{
      teamId: number;
      objectives: {
        tower: { kills: number };
        champion: { kills: number };
        dragon: { kills: number };
        baron: { kills: number };
        riftHerald: { kills: number };
      };
      win: boolean;
    }>;
  };
}

export interface RiotTimelineEventDto {
  type: string;
  timestamp?: number;
  killerId?: number;
  victimId?: number;
  teamId?: number;
  creatorId?: number;
  participantId?: number;
  assistingParticipantIds?: Array<number | null>;
  position?: { x: number; y: number };
  monsterType?: string;
  monsterSubType?: string;
  buildingType?: string;
  laneType?: string;
  killerName?: string;
  victimName?: string;
}

export interface RiotTimelineParticipantFrame {
  participantId: number;
  position?: { x: number; y: number };
  [key: string]: unknown;
}

export interface RiotTimelineDto {
  info: {
    frameInterval: number;
    frames: Array<{
      timestamp: number;
      events: Array<RiotTimelineEventDto>;
      participantFrames?: Record<string, RiotTimelineParticipantFrame>;
    }>;
  };
}

// ============================================================================
// New Proxy API Response Types
// ============================================================================

/**
 * Response from GET /account endpoint
 */
export interface BackendAccountResponse {
  puuid: string;
  platform: string;
  region: string;
  summonerId: string;
  summonerLevel: number;
  profileIconId: number;
  ddVersion: string;
  profileIconUrl: string;
}

/**
 * Single ranked queue entry
 */
export interface RankedQueueEntry {
  queueType: string; // e.g., "RANKED_SOLO_5x5", "RANKED_FLEX_SR"
  tier: string;
  rank: string;
  leaguePoints: number;
  wins: number;
  losses: number;
  veteran?: boolean;
  inactive?: boolean;
  freshBlood?: boolean;
  hotStreak?: boolean;
}

/**
 * Response from GET /ranked endpoint
 */
export interface BackendRankedResponse {
  platform: string;
  puuid?: string;
  summonerId?: string;
  queues: RankedQueueEntry[];
}

/**
 * Response from GET /matches (or /listmatches) endpoint
 */
export interface BackendMatchesResponse {
  puuid: string;
  region: string;
  start: number;
  count: number;
  matchIds: string[];
}

/**
 * Response from GET /match (or /matchdetails) endpoint
 */
export interface BackendMatchResponse {
  matchId: string;
  region: string;
  metadata: RiotMatchDto["metadata"];
  info: RiotMatchDto["info"];
  coachTrigger?: {
    url: string;
    mode: "async" | "sync";
  };
}

/**
 * Response from GET /timeline endpoint
 */
export interface BackendTimelineResponse {
  matchId: string;
  region: string;
  timeline: RiotTimelineDto["info"];
}

// ============================================================================
// Legacy Compatibility Types (for backward compatibility)
// ============================================================================

/**
 * @deprecated Use BackendAccountResponse directly
 */
export type AccountInfoResult = BackendAccountResponse;

/**
 * @deprecated Use BackendRankedResponse directly
 */
export interface RankedInfoResult {
  queues?: RankedQueueEntry[];
  rankedError?: string;
}
