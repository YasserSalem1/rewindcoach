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
  type RiotTimelineParticipantFrame,
  type StyleDNA,
  type ProfileHighlights,
  type TimelineParticipantState,
  type BackendTimelineResponse,
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

// Local helpers for safe coercion and optional vendor fields in timeline events
type ExtendedEvent = Partial<{
  type: string;
  timestamp: number;
  position: { x: number; y: number };

  // participant refs
  participantId: number;
  creatorId: number;
  killerId: number;
  victimId: number;
  assistingParticipantIds: number[];
  teamId: number;

  // friendly names sometimes present
  killerName: string;
  victimName: string;

  // item ops
  itemId: number;
  itemBefore: number;
  itemAfter: number;
  itemSlot: number;
  inventorySlot: number;
  slot: number;
  beforeSlot: number;
  afterSlot: number;
  fromItemSlot: number;
  toItemSlot: number;
  swapSlot: number;
  swapItemSlot: number;
  beforeId: number;
  afterId: number;

  // objectives/buildings
  monsterType: "DRAGON" | "BARON_NASHOR" | "RIFT_HERALD" | string;
  monsterSubType?: string;
  buildingType?: string;
  laneType?: string;
  killerNameTeam?: string;
}>;

const num = (v: unknown, d = 0) =>
  typeof v === "number" && Number.isFinite(v) ? v : d;
const toSlot = (v: unknown) =>
  typeof v === "number" && v >= 0 ? v : undefined;

const TRINKET_IDS = new Set([
  3340, // Warding Totem
  3330,
  3361,
  3362,
  3363,
  3364,
  3365,
]);

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
    (participant, index) => {
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
        participantId: Number(participant.participantId ?? index + 1),
        puuid: participant.puuid,
        summonerName: participant.summonerName,
        championId: String(participant.championId),
        championName,
        championIcon,
        kills: participant.kills,
        deaths: participant.deaths,
        assists: participant.assists,
        cs: participant.totalMinionsKilled + participant.neutralMinionsKilled,
        level: Number(participant.champLevel ?? 1),
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

  const INVENTORY_SLOTS = 7;
  const TRINKET_SLOT = 6;

  const inventoryByParticipant = new Map<number, number[]>();
  participantIdToPuuid.forEach((_puuid, id) => {
    inventoryByParticipant.set(id, new Array(INVENTORY_SLOTS).fill(0));
  });

  const getInventory = (participantId: number) => {
    let inventory = inventoryByParticipant.get(participantId);
    if (!inventory) {
      inventory = new Array(INVENTORY_SLOTS).fill(0);
      inventoryByParticipant.set(participantId, inventory);
    }
    return inventory;
  };

  const isTrinket = (itemId: number) => TRINKET_IDS.has(itemId);

  const setSlot = (inventory: number[], slot: number, itemId: number) => {
    if (slot < 0 || slot >= INVENTORY_SLOTS) return;
    inventory[slot] = itemId;
  };

  const findSlotForItem = (inventory: number[], itemId: number, slot?: number) => {
    if (typeof slot === "number" && slot >= 0 && slot < INVENTORY_SLOTS) {
      return slot;
    }
    if (isTrinket(itemId)) {
      return TRINKET_SLOT;
    }
    const emptySlot = inventory.findIndex((value, index) => value === 0 && index < TRINKET_SLOT);
    return emptySlot >= 0 ? emptySlot : TRINKET_SLOT;
  };

  const addItem = (participantId: number, itemId: number, slot?: number) => {
    if (!itemId) return;
    const inventory = getInventory(participantId);
    const targetSlot = findSlotForItem(inventory, itemId, slot);
    setSlot(inventory, targetSlot, itemId);
  };

  const removeItem = (participantId: number, itemId?: number, slot?: number) => {
    const inventory = getInventory(participantId);
    if (typeof slot === "number" && slot >= 0 && slot < INVENTORY_SLOTS) {
      inventory[slot] = 0;
      return;
    }
    if (!itemId) return;
    const index = inventory.findIndex((value) => value === itemId);
    if (index >= 0) inventory[index] = 0;
  };

  const swapItem = (participantId: number, fromSlot?: number, toSlot?: number) => {
    if (typeof fromSlot !== "number" || typeof toSlot !== "number") return;
    const inventory = getInventory(participantId);
    const source = inventory[fromSlot];
    const target = inventory[toSlot];
    inventory[fromSlot] = target;
    inventory[toSlot] = source;
  };

  const framesOutput: TimelineFrame[] = [];

  (timeline.info.frames ?? []).forEach((frame) => {
    const participantFrames = frame.participantFrames ?? {};

    const getFramePosition = (participantId?: number | null) => {
      if (!participantId) return undefined;
      const frameEntry = participantFrames[String(participantId)];
      const pos = frameEntry?.position;
      return pos && typeof pos.x === "number" && typeof pos.y === "number"
        ? { x: pos.x, y: pos.y }
        : undefined;
    };

    const resolvePoint = (
      ...candidates: Array<{ x: number; y: number } | undefined>
    ) => {
      for (const candidate of candidates) {
        if (
          candidate &&
          typeof candidate.x === "number" &&
          typeof candidate.y === "number"
        ) {
          return { x: candidate.x, y: candidate.y };
        }
      }
      return { x: 0, y: 0 };
    };

    const events: TimelineEvent[] = [];
    (frame.events ?? []).forEach((event, eventIdx) => {
      if (!event) return;

      // ---------- Inventory tracking ----------
      if (
        event.type === "ITEM_PURCHASED" ||
        event.type === "ITEM_SOLD" ||
        event.type === "ITEM_DESTROYED" ||
        event.type === "ITEM_UNDO" ||
        event.type === "ITEM_SWAP"
      ) {
        const ev = event as ExtendedEvent;
        const participantId = num(ev.participantId ?? ev.creatorId);
        if (participantId > 0) {
          const slot = toSlot(ev.itemSlot ?? ev.slot ?? ev.inventorySlot);
          switch (event.type) {
            case "ITEM_PURCHASED":
              addItem(participantId, num(ev.itemId), slot);
              break;
            case "ITEM_SOLD":
            case "ITEM_DESTROYED":
              removeItem(participantId, num(ev.itemId), slot);
              break;
            case "ITEM_UNDO": {
              const afterSlot = toSlot(ev.afterSlot ?? slot);
              const beforeSlot = toSlot(ev.beforeSlot ?? slot);
              if (ev.afterId) removeItem(participantId, num(ev.afterId), afterSlot);
              if (ev.beforeId) addItem(participantId, num(ev.beforeId), beforeSlot);
              break;
            }
            case "ITEM_SWAP": {
              const fromSlot = toSlot(ev.fromItemSlot ?? ev.itemSlot ?? ev.slot);
              const toSlotVal = toSlot(ev.toItemSlot ?? ev.swapSlot ?? ev.swapItemSlot);
              if (typeof fromSlot === "number" && typeof toSlotVal === "number") {
                swapItem(participantId, fromSlot, toSlotVal);
              } else {
                // fallback: remove & add
                if (ev.itemBefore) removeItem(participantId, num(ev.itemBefore));
                if (ev.itemAfter ?? ev.itemId) {
                  addItem(participantId, num(ev.itemAfter ?? ev.itemId), toSlotVal);
                }
              }
              break;
            }
          }
        }
        return; // handled inventory; no visual event
      }

      // Skip wards to reduce noise
      if (event.type === "WARD_PLACED" || event.type === "WARD_KILL") {
        return;
      }

      const baseId = `${event.type}-${frame.timestamp}-${eventIdx}`;
      const timestamp = Math.round((num(event.timestamp) || frame.timestamp) / 1000);
      const basePosition = event.position as { x: number; y: number } | undefined;

      const makeEvent = (
        suffix: string,
        data: Omit<TimelineEvent, "id" | "timestamp" | "position"> & {
          positions?: Array<{ x: number; y: number } | undefined>;
        },
      ) => {
        const { positions, ...rest } = data;
        events.push({
          id: `${baseId}-${suffix}`,
          timestamp,
          position: resolvePoint(...(positions ?? []), basePosition),
          ...rest,
        } as TimelineEvent);
      };

      // ---------- Visual events ----------
      switch (event.type) {
        case "CHAMPION_KILL":
        case "CHAMPION_SPECIAL_KILL": {
          const ev = event as ExtendedEvent;
          const killerId = num(ev.killerId);
          const victimId = num(ev.victimId);
          const killerPuuid = killerId ? participantIdToPuuid.get(killerId) : undefined;
          const victimPuuid = victimId ? participantIdToPuuid.get(victimId) : undefined;
          const killerTeam = killerId ? participantIdToTeam.get(killerId) : undefined;

          const assistingParticipants = (ev.assistingParticipantIds ?? []).reduce<
            Array<{ id: number; puuid: string; position?: { x: number; y: number } }>
          >((acc, id) => {
            if (typeof id !== "number" || id <= 0) return acc;
            const puuid = participantIdToPuuid.get(id);
            if (!puuid) return acc;
            acc.push({
              id,
              puuid,
              position: getFramePosition(id),
            });
            return acc;
          }, []);
          const assistingPuuids = assistingParticipants.map((entry) => entry.puuid);

          makeEvent("kill", {
            type: "KILL",
            teamId: killerTeam,
            actorPuuid: killerPuuid,
            killerPuuid,
            victimPuuid,
            assistingPuuids,
            description: `${ev.killerName ?? "Player"} eliminated ${ev.victimName ?? "Opponent"}`,
            positions: [getFramePosition(killerId), getFramePosition(victimId)],
          });

          if (victimPuuid) {
            makeEvent("death", {
              type: "DEATH",
              teamId: victimId ? participantIdToTeam.get(victimId) : undefined,
              actorPuuid: victimPuuid,
              killerPuuid,
              victimPuuid,
              description: `${participantIdToName.get(victimId) ?? "Player"} was defeated`,
              positions: [getFramePosition(victimId), getFramePosition(killerId)],
            });
          }

          assistingParticipants.forEach((assist, assistIdx) => {
            makeEvent(`assist-${assistIdx}`, {
              type: "ASSIST",
              teamId: killerTeam,
              actorPuuid: assist.puuid,
              killerPuuid,
              victimPuuid,
              description: `${participantIdToName.get(assist.id) ?? "Teammate"} assisted in the takedown`,
              positions: [assist.position, getFramePosition(killerId), getFramePosition(victimId)],
            });
          });

          break;
        }

        case "ELITE_MONSTER_KILL": {
          const ev = event as ExtendedEvent;
          const monsterType = ev.monsterType ?? "MONSTER";
          const type: TimelineEventType =
            monsterType === "DRAGON"
              ? "DRAGON"
              : monsterType === "BARON_NASHOR"
              ? "BARON"
              : monsterType === "RIFT_HERALD" // fixed spelling
              ? "HERALD"
              : "OBJECTIVE";

          const killerId = num(ev.killerId);
          const killerPuuid = participantIdToPuuid.get(killerId);

          makeEvent("objective", {
            type,
            teamId: participantIdToTeam.get(killerId),
            actorPuuid: killerPuuid,
            killerPuuid,
            description: `${ev.killerName ?? "Team"} secured ${ev.monsterSubType ?? monsterType}`,
            positions: [getFramePosition(killerId)],
          });
          break;
        }

        case "BUILDING_KILL": {
          const ev = event as ExtendedEvent;
          const killerId = num(ev.killerId ?? ev.participantId);
          const killerPuuid = killerId ? participantIdToPuuid.get(killerId) : undefined;
          makeEvent("tower", {
            type: "TOWER",
            teamId: ev.teamId,
            actorPuuid: killerPuuid,
            killerPuuid,
            description: `${ev.buildingType ?? "Structure"} destroyed`,
            positions: [getFramePosition(killerId)],
          });
          break;
        }

        case "TURRET_PLATE_DESTROYED": {
          const ev = event as ExtendedEvent;
          const killerId = num(ev.killerId ?? ev.participantId);
          const killerPuuid = killerId ? participantIdToPuuid.get(killerId) : undefined;
          makeEvent("plate", {
            type: "TOWER",
            teamId: ev.teamId,
            actorPuuid: killerPuuid,
            killerPuuid,
            description: `${ev.laneType ?? "Lane"} turret plate destroyed`,
            positions: [getFramePosition(killerId)],
          });
          break;
        }

        case "DRAGON_SOUL_GIVEN": {
          const ev = event as ExtendedEvent;
          const killerId = num(ev.killerId);
          const killerPuuid = killerId ? participantIdToPuuid.get(killerId) : undefined;
          makeEvent("soul", {
            type: "OBJECTIVE",
            teamId: ev.teamId,
            actorPuuid: killerPuuid,
            killerPuuid,
            description: `${ev.killerName ?? "Team"} secured Dragon Soul`,
            positions: [getFramePosition(killerId)],
          });
          break;
        }

        default:
          break;
      }
    });

    const participantsState: Record<string, TimelineParticipantState> = {};
    Object.entries(participantFrames).forEach(([participantId, frameEntry]) => {
      const id = Number(participantId);
      if (!Number.isFinite(id) || id <= 0) return;
      const puuid = participantIdToPuuid.get(id);
      if (!puuid) return;

      const cs =
        Number(frameEntry?.minionsKilled ?? 0) +
        Number(frameEntry?.jungleMinionsKilled ?? 0);

      const positionRaw = frameEntry?.position;
      const position =
        positionRaw &&
        typeof positionRaw.x === "number" &&
        typeof positionRaw.y === "number"
          ? { x: positionRaw.x, y: positionRaw.y }
          : undefined;

      participantsState[puuid] = {
        puuid,
        participantId: id,
        teamId: participantIdToTeam.get(id) ?? 0,
        level: Number(frameEntry?.level ?? 1),
        cs,
        gold: Number(frameEntry?.totalGold ?? 0),
        position,
        items: [...getInventory(id)],
      };
    });

    const participantSnapshotArray = Array.from(participantIdToPuuid.entries()).map(
      ([id, puuid]) => {
        const snapshot = participantsState[puuid];
        return {
          puuid,
          summonerName: participantIdToName.get(id),
          championName: match.info.participants[id - 1]?.championName,
          teamId: participantIdToTeam.get(id),
          position: snapshot?.position,
        };
      },
    );

    framesOutput.push({
      timestamp: Math.round(frame.timestamp / 1000),
      events: events.map((event) => ({
        ...event,
        participantsSnapshot: participantSnapshotArray,
      })),
      participants: participantsState,
    });
  });

  return framesOutput;
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

// ============================================================================
// Timeline Transformation
// ============================================================================

/**
 * Transforms a RiotTimelineDto (full timeline with items) into TimelineFrame[]
 */
export function mapFullTimeline(
  timelineResponse: BackendTimelineResponse,
  matchDto: RiotMatchDto,
): TimelineFrame[] {
  const frames: TimelineFrame[] = [];
  
  // The backend returns timeline with info.frames structure
  const timelineData = timelineResponse.timeline;
  const framesData = timelineData?.frames ?? [];
  
  if (framesData.length === 0) {
    return frames;
  }

  // Create a map of participantId to puuid
  const participantIdToPuuid = new Map<number, string>();
  matchDto.info.participants.forEach((participant, index) => {
    participantIdToPuuid.set(participant.participantId ?? index + 1, participant.puuid);
  });

  for (const riotFrame of framesData) {
    const timestamp = Math.floor((riotFrame.timestamp ?? 0) / 1000); // Convert ms to seconds
    
    // Build participants state for this frame
    const participants: Record<string, TimelineParticipantState> = {};
    
    if (riotFrame.participantFrames) {
      const participantFrames = riotFrame.participantFrames as Record<string, RiotTimelineParticipantFrame>;
      for (const participantIdStr of Object.keys(participantFrames)) {
        const frameData = participantFrames[participantIdStr];
        const participantId = parseInt(participantIdStr, 10);
        const puuid = participantIdToPuuid.get(participantId);
        
        if (!puuid) continue;
        
        const participant = matchDto.info.participants.find((matchParticipant) => matchParticipant.puuid === puuid);
        if (!participant) continue;

        const frameRecord = frameData as Record<string, unknown>;

        const items: number[] = [];
        for (let i = 0; i <= 6; i++) {
          const itemValue = frameRecord[`item${i}`];
          if (typeof itemValue === "number" && itemValue > 0) {
            items.push(itemValue);
          }
        }

        const minionsKilledValue = frameRecord["minionsKilled"];
        const jungleMinionsKilledValue = frameRecord["jungleMinionsKilled"];
        const levelValue = frameRecord["level"];
        const totalGoldValue = frameRecord["totalGold"];
        const currentGoldValue = frameRecord["currentGold"];

        const minionsKilled = typeof minionsKilledValue === "number" ? minionsKilledValue : 0;
        const jungleMinionsKilled = typeof jungleMinionsKilledValue === "number" ? jungleMinionsKilledValue : 0;
        const level = typeof levelValue === "number" ? levelValue : 1;
        const totalGold = typeof totalGoldValue === "number" ? totalGoldValue : undefined;
        const currentGold = typeof currentGoldValue === "number" ? currentGoldValue : undefined;
        const gold = totalGold ?? currentGold ?? 0;
        const cs = minionsKilled + jungleMinionsKilled;

        participants[puuid] = {
          puuid,
          participantId,
          teamId: participant.teamId,
          level,
          cs,
          gold,
          position: frameData.position,
          items,
        };
      }
    }

    frames.push({
      timestamp,
      events: [],
      participants,
    });
  }

  return frames;
}
