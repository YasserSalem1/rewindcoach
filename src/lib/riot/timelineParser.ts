/**
 * Parser for text-based timeline format
 */

import type { TimelineEvent, TimelineFrame, TimelineEventType, RiotMatchDto } from "./types";

interface ParsedPlayerPosition {
  team: "Blue" | "Red";
  summonerName: string;
  championName: string;
  x: number;
  y: number;
}

interface ParsedTimelineEvent {
  timestamp: string; // e.g., "02:48"
  description: string;
  positions: ParsedPlayerPosition[];
}

/**
 * Parses a timeline text file into TimelineFrame[] format
 */
export function parseTimelineText(
  textContent: string,
  matchDto: RiotMatchDto,
): TimelineFrame[] {
  const lines = textContent.split('\n');
  const events: ParsedTimelineEvent[] = [];
  
  // Find the Timeline section
  let inTimelineSection = false;
  let currentEvent: ParsedTimelineEvent | null = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Check for Timeline section start
    if (trimmed === 'Timeline:') {
      inTimelineSection = true;
      continue;
    }
    
    // Check for section end (Minute-by-minute or empty lines after timeline)
    if (inTimelineSection && (trimmed === 'Minute-by-minute — All Champions:' || trimmed === '')) {
      if (currentEvent && trimmed === 'Minute-by-minute — All Champions:') {
        inTimelineSection = false;
        break;
      }
      continue;
    }
    
    if (!inTimelineSection) continue;
    
    // Parse timeline event lines (format: "  02:48 — Red Sympponyy (Janna) killed Blue Jinzo (Hecarim)...")
    const eventMatch = trimmed.match(/^(\d{2}:\d{2})\s+—\s+(.+)$/);
    if (eventMatch) {
      // Save previous event if exists
      if (currentEvent) {
        events.push(currentEvent);
      }
      
      currentEvent = {
        timestamp: eventMatch[1],
        description: eventMatch[2],
        positions: [],
      };
    } else if (currentEvent && trimmed.startsWith('positions:')) {
      // Parse positions line
      const positionsText = trimmed.substring('positions:'.length).trim();
      const playerPositions = positionsText.split('|').map(p => p.trim());
      
      for (const playerPos of playerPositions) {
        // Format: "Blue bigtid3ies (Sion) @(1421,12917)"
        const match = playerPos.match(/^(Blue|Red)\s+(.+?)\s+\((.+?)\)\s+@\((\d+),(\d+)\)$/);
        if (match) {
          currentEvent.positions.push({
            team: match[1] as "Blue" | "Red",
            summonerName: match[2],
            championName: match[3],
            x: parseInt(match[4], 10),
            y: parseInt(match[5], 10),
          });
        }
      }
    }
  }
  
  // Add last event
  if (currentEvent) {
    events.push(currentEvent);
  }
  
  // Convert to TimelineFrame format
  return convertToTimelineFrames(events, matchDto);
}

/**
 * Converts parsed text events to TimelineFrame format
 */
function convertToTimelineFrames(
  parsedEvents: ParsedTimelineEvent[],
  matchDto: RiotMatchDto,
): TimelineFrame[] {
  const frames: TimelineFrame[] = [];
  
  // Create a map of summoner names to puuids from match participants
  const summonerToPuuid = new Map<string, string>();
  const championToPuuid = new Map<string, string>();
  
  for (const puuid of matchDto.metadata.participants) {
    const participant = matchDto.info.participants.find(p => p.puuid === puuid);
    if (participant) {
      // Store by both summoner name and champion name for matching
      summonerToPuuid.set(participant.summonerName.toLowerCase(), puuid);
      summonerToPuuid.set(participant.riotIdGameName?.toLowerCase() || '', puuid);
      championToPuuid.set(participant.championName.toLowerCase(), puuid);
    }
  }
  
  let eventIndex = 0;
  for (const event of parsedEvents) {
    const timestampSeconds = parseTimestamp(event.timestamp);
    
    // Determine event type and extract killer/victim
    const eventType = determineEventType(event.description);
    const { killerPuuid, victimPuuid, teamId } = extractEventParticipants(
      event.description,
      summonerToPuuid,
      championToPuuid,
    );
    
    // Get position - use killer's position if available, otherwise victim's, otherwise first position
    const killerPos = killerPuuid ? event.positions.find(
      p => summonerToPuuid.get(p.summonerName.toLowerCase()) === killerPuuid
    ) : null;
    
    const victimPos = victimPuuid ? event.positions.find(
      p => summonerToPuuid.get(p.summonerName.toLowerCase()) === victimPuuid
    ) : null;
    
    const position = killerPos || victimPos || event.positions[0] || { x: 7435, y: 7435 };
    
    const timelineEvent: TimelineEvent = {
      id: `event-${timestampSeconds}-${eventIndex}`,
      type: eventType,
      timestamp: timestampSeconds,
      position: { x: position.x, y: position.y },
      teamId,
      killerPuuid,
      victimPuuid,
      description: event.description,
      // Store all player positions for this event
      playerPositions: event.positions.map(p => ({
        puuid: summonerToPuuid.get(p.summonerName.toLowerCase()) || '',
        x: p.x,
        y: p.y,
        summonerName: p.summonerName,
        championName: p.championName,
        team: p.team,
      })),
    };
    
    // Add to appropriate frame (group by minute for timeline frames)
    const frameTimestamp = Math.floor(timestampSeconds / 60) * 60;
    let frame = frames.find(f => f.timestamp === frameTimestamp);
    
    if (!frame) {
      frame = {
        timestamp: frameTimestamp,
        events: [],
      };
      frames.push(frame);
    }
    
    frame.events.push(timelineEvent);
    eventIndex++;
  }
  
  return frames.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Parses timestamp from MM:SS format to seconds
 */
function parseTimestamp(timestamp: string): number {
  const [minutes, seconds] = timestamp.split(':').map(Number);
  return minutes * 60 + seconds;
}

/**
 * Determines the event type from the description
 */
function determineEventType(description: string): TimelineEventType {
  const lower = description.toLowerCase();
  
  if (lower.includes('killed')) return 'KILL';
  if (lower.includes('destroyed') && lower.includes('turret')) return 'TOWER';
  if (lower.includes('dragon')) return 'DRAGON';
  if (lower.includes('baron')) return 'BARON';
  if (lower.includes('herald')) return 'HERALD';
  if (lower.includes('ward') && lower.includes('placed')) return 'WARD_PLACED';
  if (lower.includes('ward') && lower.includes('kill')) return 'WARD_KILL';
  if (lower.includes('destroyed') || lower.includes('secured')) return 'OBJECTIVE';
  
  return 'OBJECTIVE';
}

/**
 * Extracts killer and victim puuids from event description
 */
function extractEventParticipants(
  description: string,
  summonerToPuuid: Map<string, string>,
  championToPuuid: Map<string, string>,
): { killerPuuid?: string; victimPuuid?: string; teamId?: number } {
  let killerPuuid: string | undefined;
  let victimPuuid: string | undefined;
  let teamId: number | undefined;
  
  // Match patterns like "Red Sympponyy (Janna) killed Blue Jinzo (Hecarim)"
  const killMatch = description.match(/^(Blue|Red)\s+(.+?)\s+\((.+?)\)\s+killed\s+(Blue|Red)\s+(.+?)\s+\((.+?)\)/);
  if (killMatch) {
    const killerTeam = killMatch[1];
    const killerName = killMatch[2];
    const killerChamp = killMatch[3];
    const victimTeam = killMatch[4];
    const victimName = killMatch[5];
    const victimChamp = killMatch[6];
    
    killerPuuid = summonerToPuuid.get(killerName.toLowerCase()) || championToPuuid.get(killerChamp.toLowerCase());
    victimPuuid = summonerToPuuid.get(victimName.toLowerCase()) || championToPuuid.get(victimChamp.toLowerCase());
    teamId = killerTeam === 'Blue' ? 100 : 200;
  }
  
  // Match patterns like "Red team destroyed Outer Turret"
  const teamMatch = description.match(/^(Blue|Red)\s+team/);
  if (teamMatch) {
    teamId = teamMatch[1] === 'Blue' ? 100 : 200;
  }
  
  return { killerPuuid, victimPuuid, teamId };
}

