/**
 * Main entry point for Riot API integration
 * 
 * This module provides high-level functions for fetching and transforming
 * League of Legends data from the Riot Games API via our backend proxy.
 */

// ============================================================================
// Re-export all types
// ============================================================================

export * from "./types";

// ============================================================================
// Re-export utility functions that might be needed
// ============================================================================

export { getAccountInfo, getRankedInfo, fetchTimeline, fetchSeasonStats, fetchFullTimeline } from "./fetchers";
export { mapParticipantData, summarizeMatches, mapFullTimeline } from "./transformers";

// ============================================================================
// Imports for main API functions
// ============================================================================

import {
  type Region,
  type ProfileBundle,
  type MatchBundle,
  type RiotMatch,
  type RiotMatchDto,
  type TimelineFrame,
} from "./types";

import {
  getRegionConfig,
  getRankedInfo,
  fetchAccount,
  fetchMatches,
  fetchMatch,
  fetchTimeline,
} from "./fetchers";

import {
  mapParticipantData,
  summarizeMatches,
} from "./transformers";

import { parseTimelineText } from "./timelineParser";

const MATCH_FETCH_BUFFER = 10;
const MATCH_HISTORY_LIMIT = 100;

// ============================================================================
// High-Level API Functions
// ============================================================================

/**
 * Fetches complete profile data including matches, Style DNA, and highlights
 * 
 * @param region - Player's region (e.g., "EUW", "NA")
 * @param gameName - Riot account game name
 * @param tagLine - Riot account tagline
 * @param matchCount - Number of recent matches to fetch (default: 10)
 * @returns Complete profile bundle with all data
 */
export async function getProfileBundle(
  region: Region,
  gameName: string,
  tagLine: string,
  matchCount = 10,
): Promise<ProfileBundle> {
  getRegionConfig(region);

  // New /account endpoint returns everything we need in one call
  const account = await fetchAccount(region, gameName, tagLine);

  if (!account.puuid) {
    throw new Error("Account lookup did not return a PUUID.");
  }

  // Fetch ranked information (optional - don't fail if this errors)
  let rankedInfo;
  try {
    rankedInfo = await getRankedInfo({
      platform: account.platform,
      puuid: account.puuid,
    });
  } catch (error) {
    console.warn("[riot] Failed to load ranked info", error);
  }

  // Account response already includes profileIconUrl from the new API
  const profileIcon = account.profileIconUrl;

  // Fetch matches with a buffer so intermittent failures still yield a full window
  const matches: RiotMatch[] = [];
  let startIndex = 0;

  while (matches.length < matchCount && startIndex < MATCH_HISTORY_LIMIT) {
    const remaining = matchCount - matches.length;
    const requestCount = Math.min(
      Math.max(remaining + MATCH_FETCH_BUFFER, MATCH_FETCH_BUFFER),
      MATCH_HISTORY_LIMIT - startIndex,
    );

    if (requestCount <= 0) {
      break;
    }

    const matchIds = await fetchMatches(
      account.puuid,
      region,
      requestCount,
      startIndex,
    );

    if (matchIds.length === 0) {
      break;
    }

    const matchDtos: RiotMatchDto[] = await Promise.all(
      matchIds.map(async (id) => {
        try {
          const response = await fetchMatch(id);
          return {
            metadata: response.metadata,
            info: response.info,
          };
        } catch (error) {
          console.warn(`[backend] Failed to load match ${id}`, error);
          return null;
        }
      }),
    ).then((results) =>
      results.filter((dto): dto is RiotMatchDto => dto !== null),
    );

    if (matchDtos.length > 0) {
      const mappedMatches = await Promise.all(
        matchDtos.map((dto) =>
          mapParticipantData(dto, region, account.puuid),
        ),
      );

      for (const match of mappedMatches) {
        matches.push(match);
        if (matches.length >= matchCount) {
          break;
        }
      }
    }

    if (matches.length >= matchCount) {
      break;
    }

    if (matchIds.length < requestCount) {
      // No more matches available
      break;
    }

    startIndex += matchIds.length;
  }

  const { highlights, styleDNA } = summarizeMatches(matches, account.puuid);

  // Extract ranked stats from queues array
  let rankedTier = "UNRANKED";
  let rankedDivision = "-";
  let rankedLp = 0;
  let rankedTotalMatches: number | undefined;
  let rankedWinRate: number | undefined;

  if (rankedInfo?.queues && rankedInfo.queues.length > 0) {
    // Find RANKED_SOLO_5x5 queue type
    const soloQueueEntry = rankedInfo.queues.find(
      (entry) => entry.queueType === "RANKED_SOLO_5x5",
    );

    if (soloQueueEntry) {
      rankedTier = soloQueueEntry.tier || "UNRANKED";
      rankedDivision = soloQueueEntry.rank || "-";
      rankedLp = soloQueueEntry.leaguePoints || 0;

      // Calculate stats
      const wins = soloQueueEntry.wins || 0;
      const losses = soloQueueEntry.losses || 0;
      rankedTotalMatches = wins + losses;
      rankedWinRate =
        rankedTotalMatches > 0 ? wins / rankedTotalMatches : undefined;
    }
  }

  return {
    puuid: account.puuid,
    profile: {
      summonerName: gameName,
      tagline: tagLine.toUpperCase(),
      level: account.summonerLevel,
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

/**
 * Fetches a single match with timeline data
 * 
 * @param matchId - Match ID (e.g., "EUW1_7564503755")
 * @param focusPuuid - PUUID of the player to focus on (optional)
 * @returns Match bundle with match data and timeline
 */
export async function getMatchBundle(
  matchId: string,
  focusPuuid?: string,
): Promise<MatchBundle> {
  const [platformPrefix] = matchId.split("_");
  
  // Import PLATFORM_TO_REGION from types to avoid circular dependency
  const { PLATFORM_TO_REGION } = await import("./types");
  const region = PLATFORM_TO_REGION[platformPrefix];
  
  if (!region) {
    throw new Error(`Unable to determine region for match ${matchId}`);
  }
  getRegionConfig(region);

  // Fetch match details (without timeline in new API)
  const matchResponse = await fetchMatch(matchId);

  // Convert new API format to RiotMatchDto
  const matchDto: RiotMatchDto = {
    metadata: matchResponse.metadata,
    info: matchResponse.info,
  };

  const riotMatch = await mapParticipantData(
    matchDto,
    region,
    focusPuuid ?? matchDto.metadata.participants[0],
  );

  // Fetch timeline - use text format which has item progression
  let timeline: TimelineFrame[] = [];
  
  try {
    const timelineText = await fetchTimeline(matchId, focusPuuid);
    timeline = parseTimelineText(timelineText, matchDto);
  } catch (error) {
    console.warn(`[backend] Failed to load text timeline for ${matchId}`, error);
  }

  return {
    match: riotMatch,
    timeline,
  };
}
