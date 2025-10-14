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
  // Filter events based on selected players
  const filteredEvents = useMemo(() => {
    if (showAllEvents || selectedPlayers.size === 0) {
      return events;
    }
    return events.filter(
      (event) =>
        (event.killerPuuid && selectedPlayers.has(event.killerPuuid)) ||
        (event.victimPuuid && selectedPlayers.has(event.victimPuuid))
    );
  }, [events, selectedPlayers, showAllEvents]);

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
      <ReviewHeader match={match} currentTime={currentTime} />
      
      {/* Champion Filter Buttons - Split by Team */}
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
        
        <div className="space-y-4">
          {/* Blue Team */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <h4 className="text-xs font-semibold uppercase tracking-wide text-blue-400">
                Blue Team
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {match.participants
                .filter((p) => p.teamId === 100)
                .map((participant) => {
                  const isSelected = selectedPlayers.has(participant.puuid);
                  const isPrimary = participant.puuid === match.primaryParticipantPuuid;
                  return (
                    <motion.button
                      key={participant.puuid}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => togglePlayerSelection(participant.puuid)}
                      className={cn(
                        "relative flex items-center gap-2 rounded-2xl border p-2 transition-all",
                        isSelected
                          ? "border-blue-400 bg-blue-500/20 shadow-lg shadow-blue-500/20"
                          : "border-white/10 bg-slate-900/40 hover:border-blue-400/50",
                        isPrimary && "ring-2 ring-yellow-400/50"
                      )}
                      title={`${participant.summonerName} (${participant.championName})`}
                    >
                      <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-blue-400/30">
                        <Image
                          src={participant.championIcon}
                          alt={participant.championName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-semibold text-slate-100">
                          {participant.championName}
                        </p>
                        <p className="text-xs text-slate-300/60 max-w-[100px] truncate">
                          {participant.summonerName}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-slate-950 bg-blue-400" />
                      )}
                      {isPrimary && (
                        <div className="absolute -left-1 -top-1 h-4 w-4 rounded-full border-2 border-slate-950 bg-yellow-400 flex items-center justify-center">
                          <span className="text-[8px] font-bold text-slate-900">★</span>
                        </div>
                      )}
                    </motion.button>
                  );
                })}
            </div>
          </div>

          {/* Red Team */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-red-500" />
              <h4 className="text-xs font-semibold uppercase tracking-wide text-red-400">
                Red Team
              </h4>
            </div>
            <div className="flex flex-wrap gap-2">
              {match.participants
                .filter((p) => p.teamId === 200)
                .map((participant) => {
                  const isSelected = selectedPlayers.has(participant.puuid);
                  const isPrimary = participant.puuid === match.primaryParticipantPuuid;
                  return (
                    <motion.button
                      key={participant.puuid}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => togglePlayerSelection(participant.puuid)}
                      className={cn(
                        "relative flex items-center gap-2 rounded-2xl border p-2 transition-all",
                        isSelected
                          ? "border-red-400 bg-red-500/20 shadow-lg shadow-red-500/20"
                          : "border-white/10 bg-slate-900/40 hover:border-red-400/50",
                        isPrimary && "ring-2 ring-yellow-400/50"
                      )}
                      title={`${participant.summonerName} (${participant.championName})`}
                    >
                      <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-red-400/30">
                        <Image
                          src={participant.championIcon}
                          alt={participant.championName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-semibold text-slate-100">
                          {participant.championName}
                        </p>
                        <p className="text-xs text-slate-300/60 max-w-[100px] truncate">
                          {participant.summonerName}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-slate-950 bg-red-400" />
                      )}
                      {isPrimary && (
                        <div className="absolute -left-1 -top-1 h-4 w-4 rounded-full border-2 border-slate-950 bg-yellow-400 flex items-center justify-center">
                          <span className="text-[8px] font-bold text-slate-900">★</span>
                        </div>
                      )}
                    </motion.button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          {/* Square Map Container */}
          <div className="aspect-square w-full">
            <RiftMap
              events={filteredEvents}
              currentTime={currentTime}
              participants={match.participants}
              primaryPuuid={match.primaryParticipantPuuid}
              selectedPlayers={selectedPlayers}
            />
          </div>
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
        <CoachChat
          matchId={match.id}
          currentTime={currentTime}
          gameName={focusGameName ?? focusParticipant?.summonerName}
          tagLine={focusTagLine}
        />
        {/* Sticky Chat on Right - Takes 1/3 */}
        <div className="lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)]">
          <CoachChat matchId={match.id} currentTime={currentTime} />
        </div>
      </div>
    </div>
  );
}
