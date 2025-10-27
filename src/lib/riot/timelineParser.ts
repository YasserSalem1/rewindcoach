/**
 * Parser for text-based timeline format
 */

import type { TimelineEvent, TimelineFrame, TimelineEventType, RiotMatchDto, TimelineParticipantState } from "./types";

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

interface ParsedMinuteSnapshot {
  minute: number;
  participants: Array<{
    team: "Blue" | "Red";
    summonerName: string;
    championName: string;
    level: number;
    cs: number;
    gold: number;
    items: number[];
    position: { x: number; y: number };
  }>;
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
  const minuteSnapshots: ParsedMinuteSnapshot[] = [];
  
  // Find the Timeline section
  let inTimelineSection = false;
  let inMinuteSection = false;
  let currentEvent: ParsedTimelineEvent | null = null;
  let currentMinute: number | null = null;
  let currentMinuteData: ParsedMinuteSnapshot | null = null;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    // Check for Timeline section start
    if (trimmed === 'Timeline:') {
      inTimelineSection = true;
      inMinuteSection = false;
      continue;
    }
    
    // Check for Minute-by-minute section start
    if (trimmed === 'Minute-by-minute — All Champions:') {
      inTimelineSection = false;
      inMinuteSection = true;
      if (currentEvent) {
        events.push(currentEvent);
        currentEvent = null;
      }
      continue;
    }
    
    // Parse Timeline section
    if (inTimelineSection) {
      if (trimmed === '') continue;
      
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
    
    // Parse Minute-by-minute section
    if (inMinuteSection) {
      // Check for minute timestamp (format: "00:00" or "01:00")
      const minuteMatch = trimmed.match(/^(\d{2}):00$/);
      if (minuteMatch) {
        // Save previous minute if exists
        if (currentMinuteData) {
          minuteSnapshots.push(currentMinuteData);
        }
        
        currentMinute = parseInt(minuteMatch[1], 10);
        currentMinuteData = {
          minute: currentMinute,
          participants: [],
        };
        continue;
      }
      
      // Parse player line (format: "  - Blue Szpont (Vladimir) — Lvl 1, CS 0, Gold 500 (+0), Items [] @(554,581)")
      const playerMatch = trimmed.match(/^-\s+(Blue|Red)\s+(.+?)\s+\((.+?)\)\s+—\s+Lvl\s+(\d+),\s+CS\s+(\d+),\s+Gold\s+(\d+)\s+\([^)]+\),\s+Items\s+\[([^\]]*)\]\s+@\((\d+),(\d+)\)$/);
      if (playerMatch && currentMinuteData) {
        const team = playerMatch[1] as "Blue" | "Red";
        const summonerName = playerMatch[2];
        const championName = playerMatch[3];
        const level = parseInt(playerMatch[4], 10);
        const cs = parseInt(playerMatch[5], 10);
        const gold = parseInt(playerMatch[6], 10);
        const itemsStr = playerMatch[7];
        const x = parseInt(playerMatch[8], 10);
        const y = parseInt(playerMatch[9], 10);
        
        // Parse items from "ItemName(id), ItemName(id), ..."
        const items: number[] = [];
        if (itemsStr.trim()) {
          const itemMatches = itemsStr.matchAll(/\((\d+)\)/g);
          for (const match of itemMatches) {
            items.push(parseInt(match[1], 10));
          }
        }
        
        currentMinuteData.participants.push({
          team,
          summonerName,
          championName,
          level,
          cs,
          gold,
          items,
          position: { x, y },
        });
      }
    }
  }
  
  // Add last event
  if (currentEvent) {
    events.push(currentEvent);
  }
  
  // Add last minute snapshot
  if (currentMinuteData) {
    minuteSnapshots.push(currentMinuteData);
  }
  
  // Convert to TimelineFrame format with minute snapshots
  return convertToTimelineFrames(events, minuteSnapshots, matchDto);
}

/**
 * Converts parsed text events to TimelineFrame format
 */
function convertToTimelineFrames(
  parsedEvents: ParsedTimelineEvent[],
  minuteSnapshots: ParsedMinuteSnapshot[],
  matchDto: RiotMatchDto,
): TimelineFrame[] {
  const frames: TimelineFrame[] = [];
  
  // Create a map of summoner names to puuids from match participants
  const summonerToPuuid = new Map<string, string>();
  const championToPuuid = new Map<string, string>();
  const puuidToParticipantId = new Map<string, number>();
  const puuidToTeamId = new Map<string, number>();
  
  for (const puuid of matchDto.metadata.participants) {
    const participant = matchDto.info.participants.find(p => p.puuid === puuid);
    if (participant) {
      // Store by both summoner name and champion name for matching
      summonerToPuuid.set(participant.summonerName.toLowerCase(), puuid);
      summonerToPuuid.set(participant.riotIdGameName?.toLowerCase() || '', puuid);
      championToPuuid.set(participant.championName.toLowerCase(), puuid);
      puuidToParticipantId.set(puuid, participant.participantId);
      puuidToTeamId.set(puuid, participant.teamId);
    }
  }
  
  // Create frames from minute snapshots with participant data
  for (const snapshot of minuteSnapshots) {
    const timestamp = snapshot.minute * 60; // Convert minute to seconds
    
    const participants: Record<string, TimelineParticipantState> = {};
    
    for (const playerData of snapshot.participants) {
      const puuid = summonerToPuuid.get(playerData.summonerName.toLowerCase()) ||
                    championToPuuid.get(playerData.championName.toLowerCase());
      
      if (!puuid) {
        console.warn(`[timelineParser] No puuid found for ${playerData.summonerName} (${playerData.championName})`);
        continue;
      }
      
      const participantId = puuidToParticipantId.get(puuid) || 0;
      const teamId = puuidToTeamId.get(puuid) || (playerData.team === 'Blue' ? 100 : 200);
      
      participants[puuid] = {
        puuid,
        participantId,
        teamId,
        level: playerData.level,
        cs: playerData.cs,
        gold: playerData.gold,
        position: playerData.position,
        items: playerData.items,
      };
    }
    
    frames.push({
      timestamp,
      events: [],
      participants,
    });
  }
  
  // Now add events to their respective frames
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
    const frame = frames.find(f => f.timestamp === frameTimestamp);
    
    if (frame) {
      frame.events.push(timelineEvent);
    }
    
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
  // Also handle "None None (None) killed Red X (Y)" for jungle monster deaths
  const killMatch = description.match(/^(Blue|Red|None)\s+(.+?)\s+\((.+?)\)\s+killed\s+(Blue|Red)\s+(.+?)\s+\((.+?)\)/);
  if (killMatch) {
    const killerTeam = killMatch[1];
    const killerName = killMatch[2];
    const killerChamp = killMatch[3];
    const victimTeam = killMatch[4];
    const victimName = killMatch[5];
    const victimChamp = killMatch[6];
    
    // Don't set killer if it's "None"
    if (killerTeam !== 'None') {
      killerPuuid = summonerToPuuid.get(killerName.toLowerCase()) || championToPuuid.get(killerChamp.toLowerCase());
      teamId = killerTeam === 'Blue' ? 100 : 200;
    }
    
    victimPuuid = summonerToPuuid.get(victimName.toLowerCase()) || championToPuuid.get(victimChamp.toLowerCase());
    
    // If no killer, use victim's opposite team
    if (!teamId && victimPuuid) {
      const victimParticipant = Array.from(summonerToPuuid.entries())
        .find(([, puuid]) => puuid === victimPuuid);
      if (victimParticipant) {
        // Get the opposite team
        teamId = victimTeam === 'Blue' ? 200 : 100;
      }
    }
  }
  
  // Match patterns like "Red team destroyed Outer Turret"
  const teamMatch = description.match(/^(Blue|Red)\s+team/);
  if (teamMatch) {
    teamId = teamMatch[1] === 'Blue' ? 100 : 200;
  }
  
  return { killerPuuid, victimPuuid, teamId };
}
