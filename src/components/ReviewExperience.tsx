"use client";

import { useMemo, useState, useCallback } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

import type { MatchBundle, TimelineEvent } from "@/lib/riot";
import { useScrubber } from "@/hooks/useScrubber";
import { CoachChat } from "@/components/CoachChat";
import { ReviewHeader } from "@/components/ReviewHeader";
import { RiftMap } from "@/components/RiftMap";
import { Timeline } from "@/components/Timeline";
import { cn } from "@/lib/ui";
import { Button } from "@/components/ui/button";

interface ReviewExperienceProps {
  bundle: MatchBundle;
  focusPuuid?: string;
  focusGameName?: string;
  focusTagLine?: string;
}

export function ReviewExperience({
  bundle,
  focusPuuid,
  focusGameName,
  focusTagLine,
}: ReviewExperienceProps) {
  const { match, timeline } = bundle;
  // Initialize with primary player selected by default
  const [selectedPlayers, setSelectedPlayers] = useState<Set<string>>(
    new Set([match.primaryParticipantPuuid])
  );
  const [showAllEvents, setShowAllEvents] = useState(false);

  const events = useMemo(
    () =>
      timeline?.reduce<TimelineEvent[]>(
        (acc, frame) => acc.concat(frame.events),
        [],
      ) || [],
    [timeline],
  );

  const activePuuid = focusPuuid ?? match.primaryParticipantPuuid;
  const focusParticipant = useMemo(
    () =>
      match.participants.find(
        (participant) => participant.puuid === activePuuid,
      ),
    [activePuuid, match.participants],
  );
  // Filter and transform events based on selected players
  const filteredEvents = useMemo(() => {
    if (showAllEvents || selectedPlayers.size === 0) {
      return events;
    }
    
    const playerEvents: TimelineEvent[] = [];
    
    for (const event of events) {
      // Check each selected player's involvement
      for (const playerPuuid of selectedPlayers) {
        let shouldInclude = false;
        let transformedEvent = { ...event };
        
        // Only process champion kills (not towers/objectives)
        if (event.type === "KILL") {
          // Player was the killer - show as KILL
          if (event.killerPuuid === playerPuuid) {
            transformedEvent.type = "KILL";
            shouldInclude = true;
          }
          // Player was the victim - show as DEATH
          else if (event.victimPuuid === playerPuuid) {
            transformedEvent.type = "DEATH";
            shouldInclude = true;
          }
          // Player participated in the kill but wasn't the killer (check playerPositions for assists)
          else if (event.killerPuuid && event.killerPuuid !== playerPuuid) {
            // Check if player was nearby (likely an assist)
            const playerPosition = event.playerPositions?.find(p => p.puuid === playerPuuid);
            if (playerPosition) {
              // Get killer and victim positions to determine if player was close enough for assist
              const killerPosition = event.playerPositions?.find(p => p.puuid === event.killerPuuid);
              const victimPosition = event.playerPositions?.find(p => p.puuid === event.victimPuuid);
              
              if (killerPosition && victimPosition) {
                // Calculate distance - if player is within reasonable assist range, count it
                const distanceToKill = Math.sqrt(
                  Math.pow(playerPosition.x - victimPosition.x, 2) + 
                  Math.pow(playerPosition.y - victimPosition.y, 2)
                );
                
                // Assist range approximately 1500 units
                if (distanceToKill < 2000) {
                  transformedEvent = {
                    ...event,
                    type: "ASSIST",
                    id: `${event.id}-assist-${playerPuuid}`,
                  };
                  shouldInclude = true;
                }
              }
            }
          }
        }
        // Handle objectives (TOWER, DRAGON, BARON, HERALD) - show if player's team was involved
        else if (["TOWER", "DRAGON", "BARON", "HERALD", "OBJECTIVE"].includes(event.type)) {
          // Check if player's team took this objective
          const participant = match.participants.find(p => p.puuid === playerPuuid);
          if (participant && event.teamId === participant.teamId) {
            shouldInclude = true;
          }
        }
        // Other events (wards, etc.) involving the player
        else if (event.killerPuuid === playerPuuid || event.victimPuuid === playerPuuid) {
          shouldInclude = true;
        }
        
        if (shouldInclude) {
          // Avoid duplicates
          if (!playerEvents.find(e => e.id === transformedEvent.id)) {
            playerEvents.push(transformedEvent);
          }
        }
      }
    }
    
    return playerEvents;
  }, [events, selectedPlayers, showAllEvents, match.participants]);

  const { currentTime, scrubTo, togglePlay } = useScrubber({
    duration: match.gameDuration,
    onChange: () => {
      // no-op placeholder for future analytics
    },
  });

  const togglePlayerSelection = useCallback((puuid: string) => {
    setSelectedPlayers((prev) => {
      const next = new Set(prev);
      if (next.has(puuid)) {
        next.delete(puuid);
      } else {
        next.add(puuid);
      }
      return next;
    });
  }, []);

  const toggleShowAllEvents = useCallback(() => {
    setShowAllEvents((prev) => !prev);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <ReviewHeader 
        match={match} 
        currentTime={currentTime}
        gameName={focusGameName}
        tagLine={focusTagLine}
        region={match.region}
      />
      
      {/* Champion Filter - Team Grid by Lane */}
      <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-4">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300/75">
            Filter by Champion
          </h3>
          <Button
            variant={showAllEvents ? "default" : "secondary"}
            size="sm"
            onClick={toggleShowAllEvents}
            className="text-xs"
          >
            {showAllEvents ? "Show All" : "Show Selected"}
          </Button>
        </div>
        
        {/* Grid Layout: Lanes as Rows, Teams as Columns */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-blue-500/20 bg-blue-950/30 p-2">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-blue-500" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-blue-400">
                      Blue Team
                    </span>
                  </div>
                </th>
                <th className="border border-red-500/20 bg-red-950/30 p-2">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="text-xs font-semibold uppercase tracking-wide text-red-400">
                      Red Team
                    </span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                { key: "TOP", lane: "TOP", role: null },
                { key: "JUNGLE", lane: "JUNGLE", role: null },
                { key: "MIDDLE", lane: "MIDDLE", role: null },
                { key: "BOTTOM_CARRY", lane: "BOTTOM", role: "CARRY" },
                { key: "BOTTOM_SUPPORT", lane: "BOTTOM", role: "SUPPORT" },
              ].map((position) => {
                const bluePlayer = match.participants.find(
                  (p) => p.teamId === 100 && p.lane === position.lane && 
                  (position.role === null || p.role === position.role || 
                   (position.lane === "BOTTOM" && position.role === "CARRY" && p.role !== "SUPPORT") ||
                   (p.lane === "UTILITY" && position.role === "SUPPORT"))
                );
                const redPlayer = match.participants.find(
                  (p) => p.teamId === 200 && p.lane === position.lane && 
                  (position.role === null || p.role === position.role || 
                   (position.lane === "BOTTOM" && position.role === "CARRY" && p.role !== "SUPPORT") ||
                   (p.lane === "UTILITY" && position.role === "SUPPORT"))
                );
                
                return (
                  <tr key={position.key}>
                    {/* Blue Team Cell */}
                    <td className="border border-blue-500/10 bg-slate-900/20 p-2">
                      {bluePlayer && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => togglePlayerSelection(bluePlayer.puuid)}
                          className={cn(
                            "relative flex w-full items-center gap-3 rounded-xl border p-2 transition-all",
                            selectedPlayers.has(bluePlayer.puuid)
                              ? "border-blue-400 bg-blue-500/20 shadow-md shadow-blue-500/20"
                              : "border-white/10 bg-slate-900/40 hover:border-blue-400/50",
                            bluePlayer.puuid === match.primaryParticipantPuuid && "ring-2 ring-yellow-400/50"
                          )}
                          title={`${bluePlayer.summonerName} (${bluePlayer.championName})`}
                        >
                          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-blue-400/30">
                            <Image
                              src={bluePlayer.championIcon}
                              alt={bluePlayer.championName}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-xs font-semibold text-slate-100">
                              {bluePlayer.championName}
                            </p>
                            <p className="text-xs text-slate-300/60 truncate max-w-[120px]">
                              {bluePlayer.summonerName}
                            </p>
                            <p className="text-xs font-mono text-blue-300 mt-0.5">
                              {bluePlayer.kills}/{bluePlayer.deaths}/{bluePlayer.assists}
                            </p>
                          </div>
                          {selectedPlayers.has(bluePlayer.puuid) && (
                            <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-slate-950 bg-blue-400" />
                          )}
                          {bluePlayer.puuid === match.primaryParticipantPuuid && (
                            <div className="absolute -left-1 -top-1 h-4 w-4 rounded-full border-2 border-slate-950 bg-yellow-400 flex items-center justify-center">
                              <span className="text-[8px] font-bold text-slate-900">★</span>
                            </div>
                          )}
                        </motion.button>
                      )}
                    </td>
                    {/* Red Team Cell */}
                    <td className="border border-red-500/10 bg-slate-900/20 p-2">
                      {redPlayer && (
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => togglePlayerSelection(redPlayer.puuid)}
                          className={cn(
                            "relative flex w-full items-center gap-3 rounded-xl border p-2 transition-all",
                            selectedPlayers.has(redPlayer.puuid)
                              ? "border-red-400 bg-red-500/20 shadow-md shadow-red-500/20"
                              : "border-white/10 bg-slate-900/40 hover:border-red-400/50",
                            redPlayer.puuid === match.primaryParticipantPuuid && "ring-2 ring-yellow-400/50"
                          )}
                          title={`${redPlayer.summonerName} (${redPlayer.championName})`}
                        >
                          <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-lg border border-red-400/30">
                            <Image
                              src={redPlayer.championIcon}
                              alt={redPlayer.championName}
                              fill
                              className="object-cover"
                            />
                          </div>
                          <div className="flex-1 text-left">
                            <p className="text-xs font-semibold text-slate-100">
                              {redPlayer.championName}
                            </p>
                            <p className="text-xs text-slate-300/60 truncate max-w-[120px]">
                              {redPlayer.summonerName}
                            </p>
                            <p className="text-xs font-mono text-red-300 mt-0.5">
                              {redPlayer.kills}/{redPlayer.deaths}/{redPlayer.assists}
                            </p>
                          </div>
                          {selectedPlayers.has(redPlayer.puuid) && (
                            <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-slate-950 bg-red-400" />
                          )}
                          {redPlayer.puuid === match.primaryParticipantPuuid && (
                            <div className="absolute -left-1 -top-1 h-4 w-4 rounded-full border-2 border-slate-950 bg-yellow-400 flex items-center justify-center">
                              <span className="text-[8px] font-bold text-slate-900">★</span>
                            </div>
                          )}
                        </motion.button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Map and Chat Grid */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Square Map Container */}
        <div className="aspect-square w-full lg:col-span-2">
          <RiftMap
            events={filteredEvents}
            currentTime={currentTime}
            participants={match.participants}
            primaryPuuid={match.primaryParticipantPuuid}
            selectedPlayers={selectedPlayers}
          />
        </div>
        {/* Chat - fixed height */}
        <div className="flex flex-col h-[737px]">
          <CoachChat
            matchId={match.id}
            currentTime={currentTime}
            puuid={activePuuid}
            gameName={focusGameName ?? focusParticipant?.summonerName}
            tagLine={focusTagLine}
          />
        </div>
      </div>

      {/* Timeline spans full width below */}
      <Timeline
        events={filteredEvents}
        duration={match.gameDuration}
        currentTime={currentTime}
        onScrub={(time) => {
          togglePlay(false);
          scrubTo(time);
        }}
      />
    </div>
  );
}
