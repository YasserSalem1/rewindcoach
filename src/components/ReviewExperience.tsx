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
      match.participants.find((p) => p.puuid === activePuuid),
    [activePuuid, match.participants],
  );

  const filteredEvents = useMemo(() => {
    if (showAllEvents || selectedPlayers.size === 0) return events;
    return events.filter((event) => {
      const related = new Set<string>();
      if (event.actorPuuid) related.add(event.actorPuuid);
      if (event.killerPuuid) related.add(event.killerPuuid);
      if (event.victimPuuid) related.add(event.victimPuuid);
      (event.assistingPuuids ?? []).forEach((puuid) => puuid && related.add(puuid));
      for (const puuid of related) if (selectedPlayers.has(puuid)) return true;
      return false;
    });
  }, [events, selectedPlayers, showAllEvents]);

  const { currentTime, scrubTo, togglePlay } = useScrubber({
    duration: match.gameDuration,
    onChange: () => {},
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

  // Shared card classes for both teams
  const cardBase =
    "relative shrink-0 flex items-center gap-3 rounded-2xl border transition-all backdrop-blur overflow-visible " +
    "w-[200px] h-[70px] px-4 py-3"; // bigger boxes
  const nameCls = "text-[15px] md:text-[16px] font-semibold leading-snug"; // bigger name
  const subCls = "text-[20px] text-slate-300/85 truncate"; // bigger sub
  const iconBase =
    "relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border bg-slate-950/60 p-1 shadow-inner";
  const iconImageCls = "object-contain";

  return (
    <div className="flex flex-col gap-6">
      <ReviewHeader
        match={match}
        gameName={focusGameName}
        tagLine={focusTagLine}
        region={match.region}
      />

      {/* Champion Filter */}
      <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-300/75">
            Filter by Champion
          </h3>
          <Button
            variant={showAllEvents ? "secondary" : "default"}
            size="sm"
            onClick={toggleShowAllEvents}
            className="text-xs"
          >
            {showAllEvents ? "Focus Selected" : "Show All"}
          </Button>
        </div>

        <div className="space-y-5">
          {/* Blue Team */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-blue-500" />
              <h4 className="text-xs font-semibold uppercase tracking-wide text-blue-400">
                Blue Team
              </h4>
            </div>

            {/* Single-line row, tighter gap, bigger cards */}
            <div className="overflow-x-auto">
              <div className="flex flex-nowrap gap-2 min-w-max pr-1">
                {match.participants
                  .filter((p) => p.teamId === 100)
                  .map((participant) => {
                    const isSelected = selectedPlayers.has(participant.puuid);
                    const isPrimary = participant.puuid === match.primaryParticipantPuuid;
                    return (
                      <motion.button
                        key={participant.puuid}
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => togglePlayerSelection(participant.puuid)}
                        className={cn(
                          cardBase,
                          isSelected
                            ? "border-blue-200/80 bg-gradient-to-r from-blue-600/35 via-blue-500/25 to-blue-400/10 text-slate-100 shadow-[0_14px_30px_rgba(59,130,246,0.28)]"
                            : "border-white/10 bg-slate-900/60 hover:border-blue-400/70 hover:bg-blue-500/10",
                          isPrimary && "ring-2 ring-yellow-300/70 ring-offset-2 ring-offset-slate-950/70"
                        )}
                        aria-pressed={isSelected}
                        title={`${participant.summonerName} (${participant.championName})`}
                      >
                        <div className={cn(iconBase, "border-blue-200/70")}>
                          <Image
                            src={participant.championIcon}
                            alt={participant.championName}
                            fill
                            className={iconImageCls}
                          />
                        </div>
                        <div className="min-w-0 text-left leading-tight">
                          <p className={nameCls}>{participant.championName}</p>
                          <p className={subCls}>{participant.summonerName}</p>
                        </div>

                        {isSelected && (
                          <>
                            <div className="pointer-events-none absolute inset-0 rounded-2xl border border-blue-100/60 shadow-[0_0_20px_rgba(59,130,246,0.45)]" />
                            <div className="pointer-events-none absolute right-1 top-1 h-3.5 w-3.5 rounded-full border-2 border-slate-950 bg-blue-400 shadow" />
                          </>
                        )}
                        {isPrimary && (
                          <div className="pointer-events-none absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-slate-950 bg-yellow-400 shadow">
                            <span className="text-[8px] font-bold text-slate-900">★</span>
                          </div>
                        )}
                      </motion.button>
                    );
                  })}
              </div>
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

            <div className="overflow-x-auto">
              <div className="flex flex-nowrap gap-2 min-w-max pr-1">
                {match.participants
                  .filter((p) => p.teamId === 200)
                  .map((participant) => {
                    const isSelected = selectedPlayers.has(participant.puuid);
                    const isPrimary = participant.puuid === match.primaryParticipantPuuid;
                    return (
                      <motion.button
                        key={participant.puuid}
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => togglePlayerSelection(participant.puuid)}
                        className={cn(
                          cardBase,
                          isSelected
                            ? "border-red-200/80 bg-gradient-to-r from-red-600/35 via-red-500/25 to-red-400/10 text-slate-100 shadow-[0_14px_30px_rgba(248,113,113,0.28)]"
                            : "border-white/10 bg-slate-900/60 hover:border-red-400/70 hover:bg-red-500/10",
                          isPrimary && "ring-2 ring-yellow-300/70 ring-offset-2 ring-offset-slate-950/70"
                        )}
                        aria-pressed={isSelected}
                        title={`${participant.summonerName} (${participant.championName})`}
                      >
                        <div className={cn(iconBase, "border-red-200/70")}>
                          <Image
                            src={participant.championIcon}
                            alt={participant.championName}
                            fill
                            className={iconImageCls}
                          />
                        </div>
                        <div className="min-w-0 text-left leading-tight">
                          <p className={nameCls}>{participant.championName}</p>
                          <p className={subCls}>{participant.summonerName}</p>
                        </div>

                        {isSelected && (
                          <>
                            <div className="pointer-events-none absolute inset-0 rounded-2xl border border-red-100/60 shadow-[0_0_20px_rgba(248,113,113,0.45)]" />
                            <div className="pointer-events-none absolute right-1 top-1 h-3.5 w-3.5 rounded-full border-2 border-slate-950 bg-red-400 shadow" />
                          </>
                        )}
                        {isPrimary && (
                          <div className="pointer-events-none absolute left-1 top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-slate-950 bg-yellow-400 shadow">
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
      </div>

      {/* Map + Chat */}
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
            className="h-full"
          />
        </div>
      </div>

      {/* Timeline */}
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
