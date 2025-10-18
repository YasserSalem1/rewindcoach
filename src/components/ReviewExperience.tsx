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
  const [showAllEvents, setShowAllEvents] = useState(true);

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
      <ReviewHeader 
        match={match} 
        currentTime={currentTime}
        gameName={focusGameName}
        tagLine={focusTagLine}
        region={match.region}
      />
      
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
            {showAllEvents ? "Focus Selection" : "Show Entire Match"}
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
            <div className="flex gap-2 overflow-x-auto pb-2">
              {match.participants
                .filter((p) => p.teamId === 100)
                .map((participant) => {
                  const isSelected = selectedPlayers.has(participant.puuid);
                  const isPrimary = participant.puuid === match.primaryParticipantPuuid;
                  return (
                    <motion.button
                      key={participant.puuid}
                      whileHover={{ scale: 1.04, y: -3 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => togglePlayerSelection(participant.puuid)}
                      className={cn(
                        "group relative flex min-w-[11rem] flex-col items-center gap-2 rounded-2xl border bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-blue-900/50 px-4 py-3 text-center shadow transition-all",
                        isSelected
                          ? "border-blue-400/70 shadow-lg shadow-blue-500/25"
                          : "border-white/10 hover:border-blue-400/40",
                        isPrimary && "ring-2 ring-yellow-300/60 ring-offset-2 ring-offset-slate-950"
                      )}
                      title={`${participant.summonerName} (${participant.championName})`}
                    >
                      <div
                        className="relative h-16 w-16 overflow-hidden rounded-2xl border border-blue-400/50 bg-slate-950/80 shadow-inner transition group-hover:scale-105"
                        style={{ minWidth: "4rem" }}
                      >
                        <Image
                          src={participant.championIcon}
                          alt={participant.championName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="space-y-1 leading-tight">
                        <p className="text-sm font-semibold text-slate-100">
                          {participant.championName}
                        </p>
                        <p className="text-[11px] text-slate-300/70 line-clamp-1">
                          {participant.summonerName}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-slate-950 bg-blue-400 shadow" />
                      )}
                      {isPrimary && (
                        <div className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-slate-950 bg-yellow-300 text-[9px] font-bold text-slate-900 shadow">
                          ★
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
            <div className="flex gap-2 overflow-x-auto pb-2">
              {match.participants
                .filter((p) => p.teamId === 200)
                .map((participant) => {
                  const isSelected = selectedPlayers.has(participant.puuid);
                  const isPrimary = participant.puuid === match.primaryParticipantPuuid;
                  return (
                    <motion.button
                      key={participant.puuid}
                      whileHover={{ scale: 1.04, y: -3 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => togglePlayerSelection(participant.puuid)}
                      className={cn(
                        "group relative flex min-w-[11rem] flex-col items-center gap-2 rounded-2xl border bg-gradient-to-br from-slate-900/70 via-slate-900/60 to-rose-900/50 px-4 py-3 text-center shadow transition-all",
                        isSelected
                          ? "border-red-400/70 shadow-lg shadow-red-500/25"
                          : "border-white/10 hover:border-red-400/40",
                        isPrimary && "ring-2 ring-yellow-300/60 ring-offset-2 ring-offset-slate-950"
                      )}
                      title={`${participant.summonerName} (${participant.championName})`}
                    >
                      <div
                        className="relative h-16 w-16 overflow-hidden rounded-2xl border border-red-400/50 bg-slate-950/80 shadow-inner transition group-hover:scale-105"
                        style={{ minWidth: "4rem" }}
                      >
                        <Image
                          src={participant.championIcon}
                          alt={participant.championName}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="space-y-1 leading-tight">
                        <p className="text-sm font-semibold text-slate-100">
                          {participant.championName}
                        </p>
                        <p className="text-[11px] text-slate-300/70 line-clamp-1">
                          {participant.summonerName}
                        </p>
                      </div>
                      {isSelected && (
                        <div className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2 border-slate-950 bg-red-400 shadow" />
                      )}
                      {isPrimary && (
                        <div className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-slate-950 bg-yellow-300 text-[9px] font-bold text-slate-900 shadow">
                          ★
                        </div>
                      )}
                    </motion.button>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Map and Chat Grid */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-stretch">
        <div className="flex flex-col">
          <div className="relative w-full min-h-[360px] max-lg:aspect-video lg:aspect-square">
            <RiftMap
              events={filteredEvents}
              currentTime={currentTime}
              participants={match.participants}
              primaryPuuid={match.primaryParticipantPuuid}
              selectedPlayers={selectedPlayers}
              focusSelection={!showAllEvents}
              className="h-full w-full"
            />
          </div>
        </div>
        <div className="flex h-full flex-col">
          <CoachChat
            matchId={match.id}
            currentTime={currentTime}
            puuid={activePuuid}
            gameName={focusGameName ?? focusParticipant?.summonerName}
            tagLine={focusTagLine}
            className="flex-1 min-h-[360px] lg:min-h-0 lg:h-full"
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
