import type { RiotParticipant } from "@/lib/riot";

export type CoachEventCategory =
  | "kill"
  | "objective"
  | "turret"
  | "inhibitor"
  | "nexus"
  | "unknown";

export interface CoachEventActor {
  puuid?: string;
  summonerName?: string;
  championName?: string;
  teamId?: number;
  teamColor?: "blue" | "red";
  championIcon?: string;
}

export interface CoachEventPosition extends CoachEventActor {
  x: number;
  y: number;
}

export interface CoachParsedEvent {
  id: string;
  rawTimestamp: string;
  timestampSeconds: number;
  description: string;
  category: CoachEventCategory;
  killer?: CoachEventActor;
  victim?: CoachEventActor;
  assists: CoachEventActor[];
  objectiveActor?: CoachEventActor;
  objectiveName?: string;
  positions: CoachEventPosition[];
}

interface ParticipantLookup {
  byName: Map<string, RiotParticipant>;
  byChampion: Map<string, RiotParticipant>;
}

const TIMELINE_MARKER = "Timeline:";
const MINUTE_MARKER = "Minute-by-minute — All Champions:";

const ACTOR_CHUNK_REGEX = /(Blue|Red)\s+(.+?)\s+\(([^)]+)\)/gi;
const POSITION_CHUNK_REGEX = /(Blue|Red)\s+(.+?)\s+\(([^)]+)\)\s*@\((-?\d+),\s*(-?\d+)\)/gi;

const OBJECTIVE_KEYWORDS = ["dragon", "voidgrubs", "voidgrub", "atakhan", "herald", "baron", "soul"];

const STRUCTURE_TURRET_KEYWORDS = ["turret", "tower"];
const STRUCTURE_INHIB_KEYWORDS = ["inhibitor"];
const STRUCTURE_NEXUS_KEYWORDS = ["nexus"];

const normalize = (value?: string | null) =>
  (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

const mmssToSeconds = (mmss: string) => {
  const [mm, ss] = mmss.split(":");
  const minutes = Number.parseInt(mm, 10);
  const seconds = Number.parseInt(ss, 10);
  if (Number.isNaN(minutes) || Number.isNaN(seconds)) return 0;
  return minutes * 60 + seconds;
};

const toTeamId = (color?: string) =>
  (color ?? "").toLowerCase() === "red" ? 200 : 100;

const toTeamColor = (color?: string): "blue" | "red" =>
  (color ?? "").toLowerCase() === "red" ? "red" : "blue";

const buildParticipantLookup = (participants: RiotParticipant[]): ParticipantLookup => {
  const byName = new Map<string, RiotParticipant>();
  const byChampion = new Map<string, RiotParticipant>();

  participants.forEach((participant) => {
    const color = participant.teamId === 200 ? "red" : "blue";
    if (participant.summonerName) {
      byName.set(`${color}::${normalize(participant.summonerName)}`, participant);
    }
    if (participant.championName) {
      byChampion.set(`${color}::${normalize(participant.championName)}`, participant);
    }
  });

  return { byName, byChampion };
};

const extractActor = (
  lookup: ParticipantLookup,
  color?: string,
  name?: string,
  champion?: string,
): CoachEventActor => {
  const teamColor = toTeamColor(color);
  const teamKey = `${teamColor}::`;

  let participant: RiotParticipant | undefined;
  if (name) {
    participant = lookup.byName.get(teamKey + normalize(name));
  }
  if (!participant && champion) {
    participant = lookup.byChampion.get(teamKey + normalize(champion));
  }

  return {
    puuid: participant?.puuid,
    summonerName: participant?.summonerName ?? name?.trim(),
    championName: participant?.championName ?? champion?.trim(),
    teamId: participant?.teamId ?? toTeamId(color),
    teamColor,
    championIcon: participant?.championIcon,
  };
};

const parseAssistList = (
  lookup: ParticipantLookup,
  assistsRaw: string | undefined,
): CoachEventActor[] => {
  if (!assistsRaw) return [];
  const actors: CoachEventActor[] = [];
  ACTOR_CHUNK_REGEX.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = ACTOR_CHUNK_REGEX.exec(assistsRaw)) !== null) {
    const [, color, name, champion] = match;
    actors.push(extractActor(lookup, color, name, champion));
  }
  return actors;
};

const categorizeObjective = (objectiveName: string): CoachEventCategory => {
  const normalized = objectiveName.toLowerCase();
  if (STRUCTURE_NEXUS_KEYWORDS.some((token) => normalized.includes(token))) {
    return "nexus";
  }
  if (STRUCTURE_INHIB_KEYWORDS.some((token) => normalized.includes(token))) {
    return "inhibitor";
  }
  if (STRUCTURE_TURRET_KEYWORDS.some((token) => normalized.includes(token))) {
    return "turret";
  }
  if (OBJECTIVE_KEYWORDS.some((token) => normalized.includes(token))) {
    return "objective";
  }
  return "objective";
};

const parseEventLine = (
  lookup: ParticipantLookup,
  detail: string,
  rawTimestamp: string,
): Omit<CoachParsedEvent, "id" | "positions"> => {
  const description = detail.trim();
  const timestampSeconds = mmssToSeconds(rawTimestamp);

  const killMatch = detail.match(
    /^\s*(Blue|Red)\s+(.+?)\s+\(([^)]+)\)\s+killed\s+(Blue|Red)\s+(.+?)\s+\(([^)]+)\)\s*(?:\(assists:\s*(.+)\))?\s*$/i,
  );
  if (killMatch) {
    const [, killerColor, killerName, killerChamp, victimColor, victimName, victimChamp, assistsRaw] =
      killMatch;
    return {
      rawTimestamp,
      timestampSeconds,
      description,
      category: "kill",
      killer: extractActor(lookup, killerColor, killerName, killerChamp),
      victim: extractActor(lookup, victimColor, victimName, victimChamp),
      assists: parseAssistList(lookup, assistsRaw),
    };
  }

  const securedMatch = detail.match(
    /^\s*(Blue|Red)\s+team\s+secured\s+(.+?)(?:\s*\(by\s+(Blue|Red)\s+(.+?)\s+\(([^)]+)\)\))?\s*$/i,
  );
  if (securedMatch) {
    const [, , objectiveRaw, actorColor, actorName, actorChampion] = securedMatch;
    const objectiveName = objectiveRaw.trim();
    const objectiveActor =
      actorColor && actorName
        ? extractActor(lookup, actorColor, actorName, actorChampion)
        : undefined;

    return {
      rawTimestamp,
      timestampSeconds,
      description,
      category: categorizeObjective(objectiveName),
      assists: [],
      objectiveActor,
      objectiveName,
    };
  }

  const destroyedMatch = detail.match(
    /^\s*(Blue|Red)\s+team\s+destroyed\s+(.+?)(?:\s*\(by\s+(Blue|Red)\s+(.+?)\s+\(([^)]+)\)\))?\s*$/i,
  );
  if (destroyedMatch) {
    const [, , structureRaw, actorColor, actorName, actorChampion] = destroyedMatch;
    const objectiveName = structureRaw.trim();
    const objectiveActor =
      actorColor && actorName
        ? extractActor(lookup, actorColor, actorName, actorChampion)
        : undefined;

    return {
      rawTimestamp,
      timestampSeconds,
      description,
      category: categorizeObjective(objectiveName),
      assists: [],
      objectiveActor,
      objectiveName,
    };
  }

  if (/^[A-Z0-9_ -]+$/.test(detail.trim())) {
    const objectiveName = detail.trim().replace(/_/g, " ");
    return {
      rawTimestamp,
      timestampSeconds,
      description,
      category: categorizeObjective(objectiveName),
      assists: [],
      objectiveName,
    };
  }

  return {
    rawTimestamp,
    timestampSeconds,
    description,
    category: "unknown",
    assists: [],
  };
};

const parsePositionsLine = (
  lookup: ParticipantLookup,
  line: string,
): CoachEventPosition[] => {
  const positions: CoachEventPosition[] = [];
  POSITION_CHUNK_REGEX.lastIndex = 0;

  let match: RegExpExecArray | null;
  while ((match = POSITION_CHUNK_REGEX.exec(line)) !== null) {
    const [, color, name, champion, xRaw, yRaw] = match;
    const x = Number.parseInt(xRaw, 10);
    const y = Number.parseInt(yRaw, 10);
    if (Number.isNaN(x) || Number.isNaN(y)) continue;
    const actor = extractActor(lookup, color, name, champion);
    positions.push({
      ...actor,
      x,
      y,
    });
  }

  return positions;
};

/**
 * Parses role assignments from the "Players — Final Stats:" section
 * Returns a map of puuid -> role (TOP, JUNGLE, MIDDLE, BOTTOM, UTILITY)
 */
export function parsePlayerRoles(
  text: string | null | undefined,
  participants: RiotParticipant[],
): Map<string, string> {
  const roleMap = new Map<string, string>();
  if (!text) return roleMap;

  const statsMarker = "Players — Final Stats:";
  const statsIndex = text.indexOf(statsMarker);
  if (statsIndex < 0) return roleMap;

  // Extract section from "Players — Final Stats:" to "Timeline:" or end
  let section = text.slice(statsIndex + statsMarker.length);
  const timelineIndex = section.indexOf("Timeline:");
  if (timelineIndex >= 0) {
    section = section.slice(0, timelineIndex);
  }

  const lines = section.split(/\r?\n/);
  const lookup = buildParticipantLookup(participants);

  // Parse each player line: "- Blue Szpont (Vladimir) [TOP] K/D/A ..."
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || !trimmed.startsWith('-')) continue;

    const match = trimmed.match(/^-\s+(Blue|Red)\s+(.+?)\s+\((.+?)\)\s+\[([^\]]+)\]/i);
    if (match) {
      const [, color, name, champion, role] = match;
      const teamColor = color.toLowerCase() as "blue" | "red";
      const teamKey = `${teamColor}::`;
      
      // Find participant by name or champion
      let participant = lookup.byName.get(teamKey + normalize(name));
      if (!participant) {
        participant = lookup.byChampion.get(teamKey + normalize(champion));
      }

      if (participant?.puuid) {
        roleMap.set(participant.puuid, role.trim().toUpperCase());
      }
    }
  }

  return roleMap;
}

export function parseReviewTimeline(
  text: string | null | undefined,
  participants: RiotParticipant[],
): CoachParsedEvent[] {
  if (!text) return [];

  const timelineIndex = text.indexOf(TIMELINE_MARKER);
  if (timelineIndex < 0) return [];

  let section = text.slice(timelineIndex + TIMELINE_MARKER.length);
  const minuteIndex = section.indexOf(MINUTE_MARKER);
  if (minuteIndex >= 0) {
    section = section.slice(0, minuteIndex);
  }

  const lines = section.split(/\r?\n/);
  const lookup = buildParticipantLookup(participants);

  const events: CoachParsedEvent[] = [];
  let currentEvent: CoachParsedEvent | null = null;
  let eventCounter = 0;

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) return;
    if (trimmed === TIMELINE_MARKER.trim()) return;
    if (trimmed === "(no events)") return;

    if (trimmed.toLowerCase().startsWith("positions:")) {
      if (!currentEvent) return;
      const positionsText = trimmed.slice("positions:".length).trim();
      const positions = parsePositionsLine(lookup, positionsText);
      if (positions.length) {
        currentEvent.positions = positions;
      }
      return;
    }

    const eventMatch = trimmed.match(/^(\d{2}:\d{2})\s+—\s+(.*)$/);
    if (!eventMatch) {
      return;
    }

    const [, rawTimestamp, detail] = eventMatch;
    const base = parseEventLine(lookup, detail, rawTimestamp);
    const event: CoachParsedEvent = {
      id: `coach-event-${eventCounter}`,
      positions: [],
      ...base,
    };
    eventCounter += 1;
    events.push(event);
    currentEvent = event;
  });

  return events;
}
