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
  puuid: string;
  summonerName: string;
  championId: string;
  championName: string;
  championIcon: string;
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
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

export type TimelineEventType =
  | "KILL"
  | "DEATH"
  | "TOWER"
  | "DRAGON"
  | "BARON"
  | "HERALD"
  | "WARD_PLACED"
  | "WARD_KILL"
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
  description: string;
}

export interface TimelineFrame {
  timestamp: number; // seconds
  events: TimelineEvent[];
}

export interface MatchBundle {
  match: RiotMatch;
  timeline: TimelineFrame[];
}

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

const BACKEND_FALLBACK_BASE =
  process.env.BACKEND_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL ||
  "https://0vsr7n9vj1.execute-api.us-east-1.amazonaws.com";

const BACKEND_API_KEY =
  process.env.BACKEND_API_KEY ?? process.env.CHAT_API_KEY ?? null;

function getBackendBase() {
  return BACKEND_FALLBACK_BASE.endsWith("/")
    ? BACKEND_FALLBACK_BASE.slice(0, -1)
    : BACKEND_FALLBACK_BASE;
}

export interface ProfileBundle {
  puuid: string;
  profile: RiotProfile;
  styleDNA: StyleDNA;
  highlights: ProfileHighlights;
  matches: RiotMatch[];
}

const REGION_CONFIG: Record<
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

const CDN_BASE = "https://ddragon.leagueoflegends.com/cdn";
const STAT_SHARD_ICONS: Record<number, string> = {
  5001: "img/perk-images/StatMods/StatModsHealthPlusIcon.png",
  5002: "img/perk-images/StatMods/StatModsArmorIcon.png",
  5003: "img/perk-images/StatMods/StatModsMagicResIcon.png",
  5005: "img/perk-images/StatMods/StatModsAttackSpeedIcon.png",
  5007: "img/perk-images/StatMods/StatModsAbilityHasteIcon.png",
  5008: "img/perk-images/StatMods/StatModsAdaptiveForceIcon.png",
  5011: "img/perk-images/StatMods/StatModsAbilityHasteIcon.png",
  5013: "img/perk-images/StatMods/StatModsAbilityHasteIcon.png",
};

const QUEUE_NAMES: Record<number, string> = {
  420: "Ranked Solo",
  430: "Blind Pick",
  440: "Ranked Flex",
  450: "ARAM",
  700: "Clash",
  900: "URF",
  1020: "One for All",
};

let cachedVersion: string | undefined;
let runeIconMap: Map<number, string> | undefined;
let runeStyleIconMap: Map<number, string> | undefined;
let summonerSpellMap: Map<number, string> | undefined;
let itemDataMap: Map<number, { name: string; icon: string }> | undefined;

async function backendFetch<T>(path: string): Promise<T> {
  const base = getBackendBase();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const resp = await fetch(url, {
    headers: BACKEND_API_KEY ? { "x-api-key": BACKEND_API_KEY } : undefined,
    cache: "no-store",
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`Backend API error (${resp.status}) for ${url}: ${body}`);
  }

  return (await resp.json()) as T;
}

function getRegionConfig(region: Region) {
  const config = REGION_CONFIG[region];
  if (!config) {
    throw new Error(`Unsupported region ${region}`);
  }
  return config;
}

async function getLatestVersion(): Promise<string> {
  if (cachedVersion) {
    return cachedVersion;
  }
  const versions = (await riotStaticFetch("https://ddragon.leagueoflegends.com/api/versions.json")) as string[];
  cachedVersion = versions[0];
  return cachedVersion;
}

async function riotStaticFetch(url: string) {
  const resp = await fetch(url, { cache: "force-cache" });
  if (!resp.ok) {
    throw new Error(`Static data fetch failed (${resp.status}) for ${url}`);
  }
  return resp.json();
}

async function getRuneMaps() {
  if (runeIconMap && runeStyleIconMap) {
    return { runeIconMap, runeStyleIconMap };
  }
  const version = await getLatestVersion();
  const data = (await riotStaticFetch(
    `${CDN_BASE}/${version}/data/en_US/runesReforged.json`,
  )) as Array<{
    id: number;
    icon: string;
    slots: Array<{
      runes: Array<{ id: number; icon: string }>;
    }>;
  }>;

  runeIconMap = new Map<number, string>();
  runeStyleIconMap = new Map<number, string>();

  for (const style of data) {
    runeStyleIconMap.set(style.id, style.icon);
    for (const slot of style.slots) {
      for (const rune of slot.runes) {
        runeIconMap.set(rune.id, rune.icon);
      }
    }
  }

  return { runeIconMap: runeIconMap!, runeStyleIconMap: runeStyleIconMap! };
}

async function getSummonerSpellMap() {
  if (summonerSpellMap) {
    return summonerSpellMap;
  }
  const version = await getLatestVersion();
  const data = (await riotStaticFetch(
    `${CDN_BASE}/${version}/data/en_US/summoner.json`,
  )) as {
    data: Record<
      string,
      {
        key: string;
        id: string;
        image: { full: string };
      }
    >;
  };

  summonerSpellMap = new Map<number, string>();
  for (const spell of Object.values(data.data)) {
    summonerSpellMap.set(Number(spell.key), spell.image.full);
  }
  return summonerSpellMap;
}

async function getItemMap() {
  if (itemDataMap) {
    return itemDataMap;
  }
  const version = await getLatestVersion();
  const data = (await riotStaticFetch(
    `${CDN_BASE}/${version}/data/en_US/item.json`,
  )) as {
    data: Record<
      string,
      {
        name: string;
        image: { full: string };
      }
    >;
  };

  itemDataMap = new Map<number, { name: string; icon: string }>();
  for (const [id, item] of Object.entries(data.data)) {
    itemDataMap.set(Number(id), { name: item.name, icon: item.image.full });
  }
  return itemDataMap;
}

function queueNameFromId(id: number) {
  return QUEUE_NAMES[id] ?? `Queue ${id}`;
}

function toIsoString(timestamp: number) {
  return new Date(timestamp).toISOString();
}

interface RiotMatchParticipantDto {
  puuid: string;
  summonerName: string;
  championId: number;
  championName: string;
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

interface RiotMatchDto {
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

interface RiotTimelineDto {
  info: {
    frameInterval: number;
    frames: Array<{
      timestamp: number;
      events: Array<RiotTimelineEventDto>;
    }>;
  };
}

interface RiotTimelineEventDto {
  type: string;
  timestamp?: number;
  killerId?: number;
  victimId?: number;
  teamId?: number;
  creatorId?: number;
  position?: { x: number; y: number };
  monsterType?: string;
  monsterSubType?: string;
  buildingType?: string;
  killerName?: string;
  victimName?: string;
}

interface BackendAccountResponse {
  puuid: string;
  gameName?: string;
  tagLine?: string;
  summonerName?: string;
  summonerLevel?: number;
  profileIcon?: string | number;
  profileIconId?: number;
  rankedTier?: string;
  rankedDivision?: string;
  rankedLp?: number;
  ranked?: {
    tier?: string;
    rank?: string;
    leaguePoints?: number;
  };
}

export interface RankedEntry {
  queueType?: string;
  queue_type?: string;  // Handle snake_case variant
  tier: string;
  rank: string;
  leaguePoints?: number;
  league_points?: number;  // Handle snake_case variant
  wins: number;
  losses: number;
}

interface BackendAccountInfoResponse {
  puuid: string;
  platform?: string;
  summonerLevel?: number;
  profileIconId?: number;
  profileIconUrl?: string | null;
  ddVersion?: string;
}

type BackendRankedInfoResponse = RankedEntry[] | {
  rankedEntries?: RankedEntry[];
  ranked_entries?: RankedEntry[];  // Handle snake_case variant
  rankedError?: string;
  ranked_error?: string;  // Handle snake_case variant
};

type BackendMatchesResponse = string[] | { matches: string[] };

type BackendMatchResponse =
  | RiotMatchDto
  | {
      match: RiotMatchDto;
      timeline?: RiotTimelineDto;
    };

export async function mapParticipantData(
  match: RiotMatchDto,
  region: Region,
  focusPuuid: string,
) {
  const version = await getLatestVersion();
  const { runeIconMap: runes, runeStyleIconMap: runeStyles } = await getRuneMaps();
  const spells = await getSummonerSpellMap();
  const items = await getItemMap();

  const participants: RiotParticipant[] = match.info.participants.map((participant) => {
    const championName = participant.championName === "FiddleSticks" ? "Fiddlesticks" : participant.championName;
    const championIcon = `${CDN_BASE}/${version}/img/champion/${championName}.png`;

    const itemSlots: ItemSlot[] = [];
    const itemKeys = ["item0", "item1", "item2", "item3", "item4", "item5"] as const;
    for (const itemKey of itemKeys) {
      const itemId = participant[itemKey];
      if (itemId) {
        const itemMeta = items.get(itemId);
        itemSlots.push({
          id: itemId,
          name: itemMeta?.name ?? `Item ${itemId}`,
          icon: `${CDN_BASE}/${version}/img/item/${itemMeta?.icon ?? `${itemId}.png`}`,
        });
      }
    }

    const trinketId = participant.item6;
    const trinketMeta = trinketId ? items.get(trinketId) : null;

    const primaryRuneId = participant.perks?.styles?.[0]?.selections?.[0]?.perk;
    const secondaryRuneStyleId = participant.perks?.styles?.[1]?.style;
    const runeShards = participant.perks?.statPerks
      ? [
          participant.perks.statPerks.offense,
          participant.perks.statPerks.flex,
          participant.perks.statPerks.defense,
        ]
          .map((id: number) => STAT_SHARD_ICONS[id])
          .filter(Boolean)
          .map((icon) => `${CDN_BASE}/${icon}`)
      : [];

    const summonerSpells = [participant.summoner1Id, participant.summoner2Id]
      .map((id: number) => spells.get(id))
      .filter((filename): filename is string => typeof filename === "string")
      .map((filename) => `${CDN_BASE}/${version}/img/spell/${filename}`);

    return {
      puuid: participant.puuid,
      summonerName: participant.summonerName,
      championId: String(participant.championId),
      championName,
      championIcon,
      kills: participant.kills,
      deaths: participant.deaths,
      assists: participant.assists,
      cs: participant.totalMinionsKilled + participant.neutralMinionsKilled,
      goldEarned: participant.goldEarned,
      role: participant.role,
      lane: participant.lane,
      teamId: participant.teamId,
      win: participant.win,
      items: itemSlots,
      trinket: trinketId
        ? {
            id: trinketId,
            name: trinketMeta?.name ?? `Item ${trinketId}`,
            icon: `${CDN_BASE}/${version}/img/item/${trinketMeta?.icon ?? `${trinketId}.png`}`,
          }
        : undefined,
      runes: {
        primary: primaryRuneId && runes.get(primaryRuneId)
          ? `${CDN_BASE}/img/${runes.get(primaryRuneId)}`
          : "",
        secondary: secondaryRuneStyleId && runeStyles.get(secondaryRuneStyleId)
          ? `${CDN_BASE}/img/${runeStyles.get(secondaryRuneStyleId)}`
          : "",
        shards: runeShards as string[],
      },
      spells: summonerSpells as string[],
      visionScore: participant.visionScore,
      dragonKills: participant.dragonKills,
      baronKills: participant.baronKills,
    };
  });

  const teams: MatchTeam[] = match.info.teams.map((team) => ({
    teamId: team.teamId,
    name: team.teamId === 100 ? "Blue Team" : "Red Team",
    win: team.win,
    kills: team.objectives.champion.kills,
    dragons: team.objectives.dragon.kills,
    barons: team.objectives.baron.kills,
    heralds: team.objectives.riftHerald.kills,
    towers: team.objectives.tower.kills,
  }));

  const riotMatch: RiotMatch = {
    id: match.metadata.matchId,
    region,
    queueId: match.info.queueId,
    queueType: queueNameFromId(match.info.queueId),
    gameVersion: match.info.gameVersion,
    gameCreation: toIsoString(match.info.gameCreation),
    gameDuration: match.info.gameDuration,
    primaryParticipantPuuid: focusPuuid,
    participants,
    teams,
  };

  return riotMatch;
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function summarizeMatches(matches: RiotMatch[], focusPuuid: string) {
  let wins = 0;
  let totalKills = 0;
  let totalDeaths = 0;
  let totalAssists = 0;
  let totalCs = 0;
  let totalDurationMinutes = 0;
  let totalVision = 0;
  let totalObjectiveKills = 0;
  const championStats = new Map<
    string,
    {
      icon: string;
      games: number;
      wins: number;
      kills: number;
      assists: number;
      deaths: number;
    }
  >();

  for (const match of matches) {
    const participant = match.participants.find((p) => p.puuid === focusPuuid);
    if (!participant) continue;

    if (participant.win) wins += 1;
    totalKills += participant.kills;
    totalDeaths += participant.deaths;
    totalAssists += participant.assists;
    totalCs += participant.cs;
    totalDurationMinutes += match.gameDuration / 60;
    totalVision += participant.visionScore ?? 0;
    totalObjectiveKills +=
      (participant.dragonKills ?? 0) + (participant.baronKills ?? 0);

    const champ = championStats.get(participant.championName) ?? {
      icon: participant.championIcon,
      games: 0,
      wins: 0,
      kills: 0,
      assists: 0,
      deaths: 0,
    };
    champ.games += 1;
    champ.kills += participant.kills;
    champ.assists += participant.assists;
    champ.deaths += participant.deaths;
    if (participant.win) champ.wins += 1;
    championStats.set(participant.championName, champ);
  }

  const games = matches.length || 1;
  const winRate = wins / games;
  const avgKills = totalKills / games;
  const avgAssists = totalAssists / games;
  const avgCsPerMinute = totalDurationMinutes
    ? totalCs / totalDurationMinutes
    : 0;
  const avgKda = totalDeaths === 0 ? avgKills + avgAssists : (totalKills + totalAssists) / Math.max(1, totalDeaths);

  const highlights: ProfileHighlights = {
    last20WinRate: winRate,
    averageKda: parseFloat(avgKda.toFixed(2)),
    csPerMinute: parseFloat(avgCsPerMinute.toFixed(2)),
    topChampions: Array.from(championStats.entries())
      .sort((a, b) => b[1].games - a[1].games)
      .slice(0, 3)
      .map(([championName, data]) => ({
        championId: championName,
        championName,
        icon: data.icon,
        games: data.games,
        winRate: data.wins / data.games,
        averageKda:
          data.deaths === 0
            ? data.kills + data.assists
            : (data.kills + data.assists) / Math.max(1, data.deaths),
      })),
  };

  const aggressionScore = clampScore(((avgKills + avgAssists * 0.6) / 15) * 100);
  const objectiveScore = clampScore((totalObjectiveKills / games / 3) * 100);
  const visionScore = clampScore((totalVision / games / 40) * 100);
  const macroScore = clampScore((avgCsPerMinute / 9) * 100);
  const consistencyScore = clampScore(winRate * 100);

  const styleDNA: StyleDNA = {
    title: "Style DNA",
    description:
      "Automatically derived from your recent matches using Riot's public data. Higher scores indicate stronger trends.",
    tags: [
      aggressionScore > 60 ? "Aggressive Playmaker" : "Controlled Fighter",
      objectiveScore > 60 ? "Objective Oriented" : "Lane Strategist",
      visionScore > 55 ? "Vision Controller" : "Mechanical Focus",
    ],
    radar: [
      { axis: "Aggression", score: aggressionScore },
      { axis: "Objective Control", score: objectiveScore },
      { axis: "Vision", score: visionScore },
      { axis: "Macro", score: macroScore },
      { axis: "Consistency", score: consistencyScore },
    ],
  };

  return { highlights, styleDNA };
}

function mapTimeline(
  timeline: RiotTimelineDto,
  match: RiotMatchDto,
): TimelineFrame[] {
  const participantIdToPuuid = new Map<number, string>();
  const participantIdToTeam = new Map<number, number>();
  const participantIdToName = new Map<number, string>();
  match.info.participants.forEach((participant, index) => {
    participantIdToPuuid.set(index + 1, participant.puuid);
    participantIdToTeam.set(index + 1, participant.teamId);
    participantIdToName.set(index + 1, participant.summonerName);
  });

  return timeline.info.frames.map((frame) => {
    const events: TimelineEvent[] = [];
    (frame.events ?? []).forEach((event, eventIdx) => {
      const base: Omit<TimelineEvent, "type" | "description"> = {
        id: `${event.type}-${frame.timestamp}-${eventIdx}`,
        timestamp: Math.round((event.timestamp ?? frame.timestamp) / 1000),
        position: {
          x: event.position?.x ?? 0,
          y: event.position?.y ?? 0,
        },
      };

      switch (event.type) {
        case "CHAMPION_KILL": {
          const killerId = event.killerId ?? 0;
          const victimId = event.victimId ?? 0;
          const killerPuuid = participantIdToPuuid.get(killerId);
          const victimPuuid = participantIdToPuuid.get(victimId);
          const killerTeam = killerPuuid
            ? participantIdToTeam.get(killerId)
            : undefined;
          events.push({
            ...base,
            type: "KILL",
            teamId: killerTeam,
            killerPuuid,
            victimPuuid,
            description: `${event.killerName ?? "Player"} eliminated ${event.victimName ?? "Opponent"}`,
          });
          break;
        }
        case "ELITE_MONSTER_KILL": {
          const monsterType = event.monsterType ?? "MONSTER";
          const type: TimelineEventType =
            monsterType === "DRAGON"
              ? "DRAGON"
              : monsterType === "BARON_NASHOR"
                ? "BARON"
                : monsterType === "RIFTHERALD"
                  ? "HERALD"
                  : "OBJECTIVE";
          const killerId = event.killerId ?? 0;
          events.push({
            ...base,
            type,
            teamId: participantIdToTeam.get(killerId),
            killerPuuid: participantIdToPuuid.get(killerId),
            description: `${event.killerName ?? "Team"} secured ${event.monsterSubType ?? monsterType}`,
          });
          break;
        }
        case "BUILDING_KILL": {
          events.push({
            ...base,
            type: "TOWER",
            teamId: event.teamId,
            description: `${event.buildingType ?? "Structure"} destroyed`,
          });
          break;
        }
        case "WARD_PLACED": {
          const creatorId = event.creatorId ?? 0;
          events.push({
            ...base,
            type: "WARD_PLACED",
            teamId: participantIdToTeam.get(creatorId),
            killerPuuid: participantIdToPuuid.get(creatorId),
            description: `${participantIdToName.get(creatorId) ?? "Player"} placed a ward`,
          });
          break;
        }
        case "WARD_KILL": {
          const killerId = event.killerId ?? 0;
          events.push({
            ...base,
            type: "WARD_KILL",
            teamId: participantIdToTeam.get(killerId),
            killerPuuid: participantIdToPuuid.get(killerId),
            description: `${participantIdToName.get(killerId) ?? "Player"} cleared a ward`,
          });
          break;
        }
        default:
          break;
      }
    });

    return {
      timestamp: Math.round(frame.timestamp / 1000),
      events,
    };
  });
}

interface AccountInfoParams {
  riotId?: string;
  gameName?: string;
  tagLine?: string;
  puuid?: string;
  platform?: string;
}

export interface AccountInfoResult {
  puuid: string;
  platform?: string;
  summonerLevel?: number;
  profileIconId?: number;
  profileIconUrl?: string | null;
  ddVersion?: string;
}

export async function getAccountInfo(params: AccountInfoParams): Promise<AccountInfoResult> {
  const search = new URLSearchParams();

  if (params.riotId) {
    search.set("riotId", params.riotId);
  } else if (params.gameName && params.tagLine) {
    search.set("gameName", params.gameName);
    search.set("tagLine", params.tagLine);
  } else if (params.puuid) {
    search.set("puuid", params.puuid);
    if (params.platform) {
      search.set("platform", params.platform);
    }
  } else {
    throw new Error("Provide riotId, gameName+tagLine, or puuid to fetch account info.");
  }

  if (params.platform && !search.has("platform")) {
    search.set("platform", params.platform);
  }

  const info = await backendFetch<BackendAccountInfoResponse>(
    `/account_info?${search.toString()}`,
  );

  return {
    puuid: info.puuid,
    platform: info.platform,
    summonerLevel: info.summonerLevel,
    profileIconId: info.profileIconId,
    profileIconUrl: info.profileIconUrl,
    ddVersion: info.ddVersion,
  };
}

export interface RankedInfoResult {
  rankedEntries?: RankedEntry[];
  rankedError?: string;
}

export async function getRankedInfo(puuid: string, platform: string): Promise<RankedInfoResult> {
  try {
    const response = await backendFetch<BackendRankedInfoResponse>(
      `/ranked_info?puuid=${encodeURIComponent(puuid)}&platform=${encodeURIComponent(platform)}`,
    );
    
    // Handle both array response and object response
    if (Array.isArray(response)) {
      return {
        rankedEntries: response,
      };
    }

    // Handle both camelCase and snake_case property names
    const rankedEntries = response.rankedEntries || response.ranked_entries;
    const rankedError = response.rankedError || response.ranked_error;

    return {
      rankedEntries,
      rankedError,
    };
  } catch (error) {
    console.error("[getRankedInfo] Failed to fetch ranked info:", error);
    return {
      rankedError: (error as Error).message ?? "Failed to fetch ranked info",
    };
  }
}

export async function getProfileBundle(
  region: Region,
  gameName: string,
  tagLine: string,
  matchCount = 10,
): Promise<ProfileBundle> {
  const regionConfig = getRegionConfig(region); // validate region early

  const account = await backendFetch<BackendAccountResponse>(
    `/account?region=${encodeURIComponent(region)}&gameName=${encodeURIComponent(
      gameName,
    )}&tagLine=${encodeURIComponent(tagLine)}`,
  );

  if (!account.puuid) {
    throw new Error("Account lookup did not return a PUUID.");
  }

  let accountInfo: AccountInfoResult | undefined;
  try {
    accountInfo = await getAccountInfo({
      puuid: account.puuid,
      platform: regionConfig.platform,
    });
  } catch (error) {
    console.warn("[riot] Failed to load account info, falling back to /account response", error);
  }

  // Fetch ranked information (optional - don't fail if this errors)
  let rankedInfo: RankedInfoResult | undefined;
  try {
    rankedInfo = await getRankedInfo(account.puuid, regionConfig.platform);
  } catch (error) {
    console.warn("[riot] Failed to load ranked info", error);
  }

  const version = await getLatestVersion();
  const profileIconId =
    accountInfo?.profileIconId ??
    (typeof account.profileIcon === "number"
      ? account.profileIcon
      : account.profileIconId);
  const profileIcon = (() => {
    if (accountInfo?.profileIconUrl) {
      return accountInfo.profileIconUrl;
    }
    if (typeof account.profileIcon === "string") {
      return account.profileIcon.startsWith("http")
        ? account.profileIcon
        : `${CDN_BASE}/${version}/img/profileicon/${account.profileIcon}.png`;
    }
    if (profileIconId) {
      return `${CDN_BASE}/${version}/img/profileicon/${profileIconId}.png`;
    }
    return `${CDN_BASE}/${version}/img/profileicon/29.png`;
  })();

  const matchesResponse = await backendFetch<BackendMatchesResponse>(
    `/matches?puuid=${encodeURIComponent(account.puuid)}&count=${matchCount}&region=${encodeURIComponent(region)}`,
  );
  const matchIds = Array.isArray(matchesResponse)
    ? matchesResponse
    : matchesResponse.matches ?? (matchesResponse as { matchIds?: string[] }).matchIds ?? [];

  const matchDtos: RiotMatchDto[] = [];
  for (const id of matchIds) {
    try {
      const response = await backendFetch<BackendMatchResponse>(
        `/match?matchId=${encodeURIComponent(id)}`,
      );
      const dto = "match" in response ? response.match : response;
      matchDtos.push(dto);
    } catch (error) {
      console.warn(`[backend] Failed to load match ${id}`, error);
    }
  }

  const matches: RiotMatch[] = [];
  for (const dto of matchDtos) {
    const riotMatch = await mapParticipantData(dto, region, account.puuid);
    matches.push(riotMatch);
  }

  const { highlights, styleDNA } = summarizeMatches(matches, account.puuid);

  const summonerLevelValue =
    Number(accountInfo?.summonerLevel ?? account.summonerLevel ?? 0) || 0;

  // Extract ranked stats and rank info from ranked_info endpoint
  let rankedTier = "UNRANKED";
  let rankedDivision = "-";
  let rankedLp = 0;
  let rankedTotalMatches: number | undefined;
  let rankedWinRate: number | undefined;
  
  if (rankedInfo?.rankedEntries && rankedInfo.rankedEntries.length > 0) {
    // Find RANKED_SOLO_5x5 queue type (handle both camelCase and snake_case)
    const soloQueueEntry = rankedInfo.rankedEntries.find(
      (entry) => (entry.queueType || entry.queue_type) === "RANKED_SOLO_5x5"
    );

    if (soloQueueEntry) {
      // Extract rank information (handle both camelCase and snake_case)
      rankedTier = soloQueueEntry.tier || "UNRANKED";
      rankedDivision = soloQueueEntry.rank || "-";
      rankedLp = soloQueueEntry.leaguePoints || soloQueueEntry.league_points || 0;
      
      // Calculate stats
      const wins = soloQueueEntry.wins || 0;
      const losses = soloQueueEntry.losses || 0;
      rankedTotalMatches = wins + losses;
      rankedWinRate = rankedTotalMatches > 0 ? wins / rankedTotalMatches : undefined;
    }
  } else {
    // Fallback to account data if ranked_info fails
    rankedTier = (account.rankedTier ?? account.ranked?.tier ?? "UNRANKED").toUpperCase();
    rankedDivision = account.rankedDivision ?? account.ranked?.rank ?? "-";
    const rankedLpRaw = account.rankedLp ?? account.ranked?.leaguePoints ?? 0;
    rankedLp = Number.isFinite(Number(rankedLpRaw)) ? Number(rankedLpRaw) : 0;
  }

  return {
    puuid: account.puuid,
    profile: {
      summonerName:
        account.gameName ?? account.summonerName ?? gameName ?? "Unknown",
      tagline: account.tagLine ?? tagLine.toUpperCase(),
      level: summonerLevelValue,
      profileIcon,
      rankedTier,
      rankedDivision,
      rankedLp,
      rankedTotalMatches,
      rankedWinRate,
    },
    styleDNA,
    highlights,
    matches,
  };
}

export async function getMatchBundle(
  matchId: string,
  focusPuuid?: string,
): Promise<MatchBundle> {
  const [platformPrefix] = matchId.split("_");
  const region = PLATFORM_TO_REGION[platformPrefix];
  if (!region) {
    throw new Error(`Unable to determine region for match ${matchId}`);
  }
  getRegionConfig(region);

  const matchResponse = await backendFetch<BackendMatchResponse>(
    `/match?matchId=${encodeURIComponent(matchId)}&timeline=1`,
  );

  const matchDto =
    "match" in matchResponse ? matchResponse.match : (matchResponse as RiotMatchDto);
  let timelineDto =
    "timeline" in matchResponse && matchResponse.timeline
      ? matchResponse.timeline
      : undefined;

  const riotMatch = await mapParticipantData(
    matchDto,
    region,
    focusPuuid ?? matchDto.metadata.participants[0],
  );

  if (!timelineDto) {
    try {
      const timelineResponse = await backendFetch<BackendMatchResponse>(
        `/match?matchId=${encodeURIComponent(matchId)}&timeline=1`,
      );
      if ("timeline" in timelineResponse && timelineResponse.timeline) {
        timelineDto = timelineResponse.timeline;
      }
    } catch (error) {
      console.warn(`[backend] Failed to load timeline for ${matchId}`, error);
    }
  }

  const timeline = timelineDto ? mapTimeline(timelineDto, matchDto) : [];

  return {
    match: riotMatch,
    timeline,
  };
}
