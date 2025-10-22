/**
 * Backend API fetchers and static data loaders
 */

import {
  CDN_BASE,
  type BackendAccountResponse,
  type BackendRankedResponse,
  type BackendMatchesResponse,
  type BackendMatchResponse,
  type BackendTimelineResponse,
  type AccountInfoResult,
  type RankedInfoResult,
  type Region,
  REGION_CONFIG,
  type RankedQueueEntry,
} from "./types";

// ============================================================================
// Backend Configuration
// ============================================================================

const BACKEND_FALLBACK_BASE =
  process.env.BACKEND_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL ||
  "https://l7has1ta0f.execute-api.us-east-1.amazonaws.com/";

const BACKEND_API_KEY =
  process.env.BACKEND_API_KEY ?? process.env.CHAT_API_KEY ?? null;

function getBackendBase() {
  return BACKEND_FALLBACK_BASE.endsWith("/")
    ? BACKEND_FALLBACK_BASE.slice(0, -1)
    : BACKEND_FALLBACK_BASE;
}

// ============================================================================
// Static Data Cache
// ============================================================================

let cachedVersion: string | undefined;
let runeIconMap: Map<number, string> | undefined;
let runeStyleIconMap: Map<number, string> | undefined;
let summonerSpellMap: Map<number, string> | undefined;
let itemDataMap: Map<number, { name: string; icon: string }> | undefined;

// ============================================================================
// Core Fetchers
// ============================================================================

export async function backendFetch<T>(path: string): Promise<T> {
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

export async function riotStaticFetch(url: string) {
  const resp = await fetch(url, { cache: "force-cache" });
  if (!resp.ok) {
    throw new Error(`Static data fetch failed (${resp.status}) for ${url}`);
  }
  return resp.json();
}

// ============================================================================
// Region Utilities
// ============================================================================

export function getRegionConfig(region: Region) {
  const config = REGION_CONFIG[region];
  if (!config) {
    throw new Error(`Unsupported region ${region}`);
  }
  return config;
}

// ============================================================================
// Static Data Fetchers
// ============================================================================

export async function getLatestVersion(): Promise<string> {
  if (cachedVersion) {
    return cachedVersion;
  }
  const versions = (await riotStaticFetch(
    "https://ddragon.leagueoflegends.com/api/versions.json",
  )) as string[];
  cachedVersion = versions[0];
  return cachedVersion;
}

export async function getRuneMaps() {
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

export async function getSummonerSpellMap() {
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

export async function getItemMap() {
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

// ============================================================================
// Account Info Fetchers
// ============================================================================

/**
 * Fetches account information using the new /account endpoint
 * 
 * @param params - Can provide riotId, gameName+tagLine, or puuid
 * @param region - Optional region hint (routing value like "europe", "americas", etc.)
 */
export async function getAccountInfo(
  params: {
    riotId?: string;
    gameName?: string;
    tagLine?: string;
    puuid?: string;
    platform?: string;
    region?: string;
  },
): Promise<AccountInfoResult> {
  const search = new URLSearchParams();

  if (params.riotId) {
    search.set("riotId", params.riotId);
  } else if (params.gameName && params.tagLine) {
    search.set("gameName", params.gameName);
    search.set("tagLine", params.tagLine);
  } else if (params.puuid) {
    search.set("puuid", params.puuid);
  } else {
    throw new Error(
      "Provide riotId, gameName+tagLine, or puuid to fetch account info.",
    );
  }

  // Add optional hints
  if (params.platform) {
    search.set("platform", params.platform);
  }
  if (params.region) {
    search.set("region", params.region);
  }

  const info = await backendFetch<BackendAccountResponse>(
    `/account?${search.toString()}`,
  );

  return info;
}

/**
 * Fetches ranked information using the new /ranked endpoint
 * 
 * @param params - Must provide platform and either puuid or summonerId
 */
export async function getRankedInfo(
  params: {
    platform: string;
    puuid?: string;
    summonerId?: string;
  },
): Promise<RankedInfoResult> {
  try {
    const search = new URLSearchParams();
    search.set("platform", params.platform);

    if (params.puuid) {
      search.set("puuid", params.puuid);
    } else if (params.summonerId) {
      search.set("summonerId", params.summonerId);
    } else {
      throw new Error("Must provide either puuid or summonerId");
    }

    const response = await backendFetch<BackendRankedResponse>(
      `/ranked?${search.toString()}`,
    );

    return {
      queues: response.queues,
    };
  } catch (error) {
    console.error("[getRankedInfo] Failed to fetch ranked info:", error);
    return {
      rankedError: (error as Error).message ?? "Failed to fetch ranked info",
    };
  }
}

/**
 * Fetches account using gameName and tagLine
 * This is a convenience wrapper around getAccountInfo
 */
export async function fetchAccount(
  region: Region,
  gameName: string,
  tagLine: string,
): Promise<BackendAccountResponse> {
  const regionConfig = REGION_CONFIG[region];
  return getAccountInfo({
    gameName,
    tagLine,
    region: regionConfig.routing, // Use routing value (europe, americas, etc.)
  }) as Promise<BackendAccountResponse>;
}

/**
 * Fetches list of match IDs for a player
 * Uses /listmatches endpoint (alias for /matches)
 */
export async function fetchMatches(
  puuid: string,
  region: Region,
  count: number,
  start = 0,
): Promise<string[]> {
  const regionConfig = REGION_CONFIG[region];
  const search = new URLSearchParams();
  search.set("puuid", puuid);
  search.set("region", regionConfig.routing); // Use routing value
  search.set("count", count.toString());
  if (start > 0) {
    search.set("start", start.toString());
  }

  const response = await backendFetch<BackendMatchesResponse>(
    `/listmatches?${search.toString()}`,
  );
  
  return response.matchIds;
}

/**
 * Fetches a single match details
 * Note: Timeline is now a separate endpoint (/timeline)
 * Uses /matchdetails endpoint (alias for /match)
 */
export async function fetchMatch(matchId: string) {
  const search = new URLSearchParams();
  search.set("matchId", matchId);
  
  return backendFetch<BackendMatchResponse>(
    `/matchdetails?${search.toString()}`,
  );
}

/**
 * Fetches timeline for a match
 * Uses the coach_match endpoint which returns text format
 */
export async function fetchTimeline(matchId: string, puuid?: string): Promise<string> {
  const search = new URLSearchParams();
  search.set("matchId", matchId);
  if (puuid) {
    search.set("puuid", puuid);
  }
  
  const url = `https://0vsr7n9vj1.execute-api.us-east-1.amazonaws.com/coach_match?${search.toString()}`;
  
  const resp = await fetch(url, {
    headers: BACKEND_API_KEY ? { "x-api-key": BACKEND_API_KEY } : undefined,
    cache: "no-store",
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`Timeline API error (${resp.status}) for ${url}: ${body}`);
  }

  // Return text format
  return await resp.text();
}

/**
 * Fetches season stats for a summoner
 */
export async function fetchSeasonStats(
  puuid: string,
  region: string,
  summonerName: string,
  opggRegion: string,
) {
  const search = new URLSearchParams();
  search.set("puuid", puuid);
  search.set("region", region);
  search.set("summonerName", summonerName);
  search.set("opggRegion", opggRegion);
  
  return backendFetch<import("./types").SeasonStatsResponse>(
    `/seasonstats?${search.toString()}`,
  );
}

