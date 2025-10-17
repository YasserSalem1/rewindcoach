/**
 * Data transformation utilities for converting Riot API DTOs to app types
 */

import {
  CDN_BASE,
  STAT_SHARD_ICONS,
  QUEUE_NAMES,
  type Region,
  type RiotMatch,
  type RiotParticipant,
  type ItemSlot,
  type MatchTeam,
  type RiotMatchDto,
  type TimelineFrame,
  type TimelineEvent,
  type TimelineEventType,
  type RiotTimelineDto,
  type StyleDNA,
  type ProfileHighlights,
} from "./types";

import {
  getLatestVersion,
  getRuneMaps,
  getSummonerSpellMap,
  getItemMap,
} from "./fetchers";

// ============================================================================
// Helper Functions
// ============================================================================

function queueNameFromId(id: number) {
  return QUEUE_NAMES[id] ?? `Queue ${id}`;
}

function toIsoString(timestamp: number) {
  return new Date(timestamp).toISOString();
}

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

// ============================================================================
// Match Data Transformation
// ============================================================================

export async function mapParticipantData(
  match: RiotMatchDto,
  region: Region,
  focusPuuid: string,
) {
  const version = await getLatestVersion();
  const { runeIconMap: runes, runeStyleIconMap: runeStyles } =
    await getRuneMaps();
  const spells = await getSummonerSpellMap();
  const items = await getItemMap();

  const participants: RiotParticipant[] = match.info.participants.map(
    (participant) => {
      const championName =
        participant.championName === "FiddleSticks"
          ? "Fiddlesticks"
          : participant.championName;
      const championIcon = `${CDN_BASE}/${version}/img/champion/${championName}.png`;

      const itemSlots: ItemSlot[] = [];
      const itemKeys = [
        "item0",
        "item1",
        "item2",
        "item3",
        "item4",
        "item5",
      ] as const;
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
          primary:
            primaryRuneId && runes.get(primaryRuneId)
              ? `${CDN_BASE}/img/${runes.get(primaryRuneId)}`
              : "",
          secondary:
            secondaryRuneStyleId && runeStyles.get(secondaryRuneStyleId)
              ? `${CDN_BASE}/img/${runeStyles.get(secondaryRuneStyleId)}`
              : "",
          shards: runeShards as string[],
        },
        spells: summonerSpells as string[],
        visionScore: participant.visionScore,
        dragonKills: participant.dragonKills,
        baronKills: participant.baronKills,
      };
    },
  );

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

// ============================================================================
// Timeline Transformation
// ============================================================================

export function mapTimeline(
  timeline: RiotTimelineDto,
  match: RiotMatchDto,
): TimelineFrame[] {
  // Safety check for timeline structure
  if (!timeline?.info?.frames) {
    console.warn("[mapTimeline] Timeline has no frames, returning empty array");
    return [];
  }

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

// ============================================================================
// Match Summarization & Style DNA
// ============================================================================

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
  const avgKda =
    totalDeaths === 0
      ? avgKills + avgAssists
      : (totalKills + totalAssists) / Math.max(1, totalDeaths);

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

