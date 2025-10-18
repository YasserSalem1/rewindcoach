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

export { getAccountInfo, getRankedInfo, fetchTimeline } from "./fetchers";
export { mapParticipantData, summarizeMatches } from "./transformers";

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
  CDN_BASE,
} from "./types";

import {
  getRegionConfig,
  getAccountInfo,
  getRankedInfo,
  fetchAccount,
  fetchMatches,
  fetchMatch,
  fetchTimeline,
  getLatestVersion,
} from "./fetchers";

import {
  mapParticipantData,
  mapTimeline,
  summarizeMatches,
} from "./transformers";

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
  const regionConfig = getRegionConfig(region); // validate region early

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

  // Fetch matches
  const matchIds = await fetchMatches(account.puuid, region, matchCount);

  const matchDtos: RiotMatchDto[] = [];
  for (const id of matchIds) {
    try {
      const response = await fetchMatch(id);
      // New API returns { matchId, region, metadata, info }
      // Convert to RiotMatchDto format
      const dto: RiotMatchDto = {
        metadata: response.metadata,
        info: response.info,
      };
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

  // Fetch timeline separately (new API has separate /timeline endpoint)
  let timeline: TimelineFrame[] = [];
  try {
    const timelineResponse = await fetchTimeline(matchId);
    // timelineResponse.timeline contains both metadata and info
    // Extract the info object which has the frames
    if (timelineResponse.timeline?.info?.frames) {
      const timelineDto: RiotTimelineDto = {
        info: timelineResponse.timeline.info,
      };
      timeline = mapTimeline(timelineDto, matchDto);
    } else {
      console.warn(`[backend] Timeline for ${matchId} has no frames`);
    }
  } catch (error) {
    console.warn(`[backend] Failed to load timeline for ${matchId}`, error);
  }

  return {
    match: riotMatch,
    timeline,
  };
}
