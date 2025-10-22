"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useCallback, useEffect, useRef } from "react";
import { ArrowLeft } from "lucide-react";

import type { MatchBundle, TimelineEvent, TimelineFrame } from "@/lib/riot";
import { parseReviewTimeline, type CoachParsedEvent } from "@/lib/parseReviewOutput";
import { useScrubber } from "@/hooks/useScrubber";
import { CoachChat } from "@/components/CoachChat";
import { RiftMap } from "@/components/RiftMap";
import { Timeline } from "@/components/Timeline";
import { ChampionMatchups } from "@/components/ChampionMatchups";
import { MinuteNavigator } from "@/components/MinuteNavigator";
import { cn } from "@/lib/ui";

interface ReviewExperienceProps {
  bundle: MatchBundle;
  focusPuuid?: string;
  focusGameName?: string;
  focusTagLine?: string;
  coachReviewText?: string;
}

export function ReviewExperience({
  bundle,
  focusPuuid,
  focusGameName,
  focusTagLine,
  coachReviewText,
}: ReviewExperienceProps) {
  const { match, timeline } = bundle;
  const participants = match.participants;
  const gameDuration = match.gameDuration;

  const coachEvents = useMemo<CoachParsedEvent[]>(() => {
    if (!coachReviewText) return [];
    try {
      return parseReviewTimeline(coachReviewText, participants);
    } catch (error) {
      console.warn("[ReviewExperience] Failed to parse coach review timeline", error);
      return [];
    }
  }, [coachReviewText, participants]);

  const activePuuid = focusPuuid ?? match.primaryParticipantPuuid;
  const [selectedPlayer, setSelectedPlayer] = useState<string | null>(activePuuid);
  const [currentEventIndex, setCurrentEventIndex] = useState<number | null>(null);
  const manualEventRef = useRef<number | null>(null);

  useEffect(() => {
    setSelectedPlayer(activePuuid);
  }, [activePuuid]);

  useEffect(() => {
    if (!coachEvents.length) {
      setCurrentEventIndex(null);
      manualEventRef.current = null;
      return;
    }
    setCurrentEventIndex((prev) => {
      if (prev === null) return 0;
      return Math.min(prev, coachEvents.length - 1);
    });
  }, [coachEvents]);

  const events = useMemo(
    () =>
      timeline?.reduce<TimelineEvent[]>(
        (acc, frame) => acc.concat(frame.events),
        [],
      ) || [],
    [timeline],
  );

  const selectedPlayersSet = useMemo(() => {
    if (!selectedPlayer) return new Set<string>();
    return new Set<string>([selectedPlayer]);
  }, [selectedPlayer]);

  const selectedParticipantMeta = useMemo(
    () => (selectedPlayer ? participants.find((p) => p.puuid === selectedPlayer) : null),
    [participants, selectedPlayer],
  );

  const normalizeText = useCallback(
    (value?: string | null) => (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, ""),
    [],
  );

  const involvesSelected = useCallback(
    (event: CoachParsedEvent) => {
      if (!selectedPlayer) return true;
      const matchActor = (actor?: { puuid?: string; summonerName?: string; championName?: string }) => {
        if (!actor) return false;
        if (actor.puuid && actor.puuid === selectedPlayer) return true;
        if (selectedParticipantMeta?.summonerName && actor.summonerName) {
          if (normalizeText(actor.summonerName) === normalizeText(selectedParticipantMeta.summonerName)) {
            return true;
          }
        }
        if (selectedParticipantMeta?.championName && actor.championName) {
          if (normalizeText(actor.championName) === normalizeText(selectedParticipantMeta.championName)) {
            return true;
          }
        }
        return false;
      };

      if (matchActor(event.killer)) return true;
      if (matchActor(event.victim)) return true;
      if (event.assists.some((assist) => matchActor(assist))) return true;
      if (matchActor(event.objectiveActor)) return true;
      return false;
    },
    [normalizeText, selectedParticipantMeta, selectedPlayer],
  );

  const visibleCoachEvents = useMemo(
    () =>
      coachEvents
        .map((event, index) => ({ ...event, sourceIndex: index }))
        .filter((event) => involvesSelected(event)),
    [coachEvents, involvesSelected],
  );

  const findNearestVisibleEventIndex = useCallback(
    (time: number) => {
      if (!visibleCoachEvents.length) return null;
      let bestEvent = visibleCoachEvents[0];
      let bestDiff = Math.abs(coachEvents[bestEvent.sourceIndex].timestampSeconds - time);
      for (let i = 1; i < visibleCoachEvents.length; i += 1) {
        const candidate = visibleCoachEvents[i];
        const diff = Math.abs(coachEvents[candidate.sourceIndex].timestampSeconds - time);
        if (diff < bestDiff) {
          bestDiff = diff;
          bestEvent = candidate;
        }
      }
      return bestEvent.sourceIndex;
    },
    [coachEvents, visibleCoachEvents],
  );

  const { statsByMinute, totalMinutes, objectivesByMinute } = useMemo(() => {
    const totalMinutes = Math.max(0, Math.ceil(gameDuration / 60));
    const sortedEvents = [...events].sort((a, b) => a.timestamp - b.timestamp);
    const running = new Map<string, { kills: number; deaths: number; assists: number }>();

    const participantMeta = new Map<string, (typeof participants)[number]>();
    participants.forEach((participant) => {
      running.set(participant.puuid, { kills: 0, deaths: 0, assists: 0 });
      participantMeta.set(participant.puuid, participant);
    });

    const framesByMinute = new Map<number, TimelineFrame>();
    timeline?.forEach((frame) => {
      const minute = Math.max(0, Math.floor(frame.timestamp / 60));
      framesByMinute.set(minute, frame);
    });

    const minuteSnapshots: Array<
      Record<
        string,
        {
          kills: number;
          deaths: number;
          assists: number;
          cs: number;
          level: number;
          items: number[];
        }
      >
    > = [];
    const objectiveSnapshots: Array<{
      blue: { towers: number; dragons: number; heralds: number; barons: number };
      red: { towers: number; dragons: number; heralds: number; barons: number };
    }> = [];

    const objectiveRunning = {
      blue: { towers: 0, dragons: 0, heralds: 0, barons: 0 },
      red: { towers: 0, dragons: 0, heralds: 0, barons: 0 },
    };

    let eventIndex = 0;
    const previousState = new Map<string, { cs: number; level: number; items: number[] }>();

    for (let minute = 0; minute <= totalMinutes; minute++) {
      while (
        eventIndex < sortedEvents.length &&
        Math.floor(sortedEvents[eventIndex].timestamp / 60) <= minute
      ) {
        const event = sortedEvents[eventIndex];
        const desc = event.description?.toLowerCase?.() ?? "";
        
        // Handle KILL events - update killer's kills AND victim's deaths
        if (event.type === "KILL") {
          if (event.killerPuuid) {
            const killerStats = running.get(event.killerPuuid);
            if (killerStats) killerStats.kills += 1;
          }
          if (event.victimPuuid) {
            const victimStats = running.get(event.victimPuuid);
            if (victimStats) victimStats.deaths += 1;
          }
          
          // Parse assists from description if available
          // Format: "Blue X (Y) killed Red A (B) (assists: Blue C (D), Blue E (F))"
          const assistMatch = event.description?.match(/\(assists:\s*(.+?)\)\s*$/i);
          if (assistMatch) {
            const assistsText = assistMatch[1];
            // Parse each assist: "Blue name (champion)" or "Red name (champion)"
            const assistMatches = assistsText.matchAll(/(Blue|Red)\s+(.+?)\s+\(([^)]+)\)/gi);
            for (const match of assistMatches) {
              const assistName = match[2].trim();
              const assistChamp = match[3].trim();
              // Find puuid by summoner name or champion name
              const assistParticipant = participants.find(p => 
                p.summonerName?.toLowerCase() === assistName.toLowerCase() ||
                p.championName?.toLowerCase() === assistChamp.toLowerCase()
              );
              if (assistParticipant) {
                const assistStats = running.get(assistParticipant.puuid);
                if (assistStats) assistStats.assists += 1;
              }
            }
          }
        } else if (
          (event.type === "TOWER" && !desc.includes("plate")) ||
          event.type === "DRAGON" ||
          event.type === "HERALD" ||
          event.type === "BARON"
        ) {
          const eventParticipant = event.actorPuuid
            ? participantMeta.get(event.actorPuuid)
            : undefined;
          const teamId = eventParticipant?.teamId ?? event.teamId;
          const teamKey = teamId === 100 ? "blue" : teamId === 200 ? "red" : null;
          if (teamKey) {
            if (event.type === "TOWER") {
              objectiveRunning[teamKey].towers = Math.min(
                objectiveRunning[teamKey].towers + 1,
                11,
              );
            }
            if (event.type === "DRAGON") {
              objectiveRunning[teamKey].dragons = Math.min(
                objectiveRunning[teamKey].dragons + 1,
                6,
              );
            }
            if (event.type === "HERALD") {
              objectiveRunning[teamKey].heralds = Math.min(
                objectiveRunning[teamKey].heralds + 1,
                2,
              );
            }
            if (event.type === "BARON") {
              objectiveRunning[teamKey].barons = Math.min(
                objectiveRunning[teamKey].barons + 1,
                3,
              );
            }
          }
        }
        eventIndex += 1;
      }

      const frame = framesByMinute.get(minute);
      const snapshot: Record<
        string,
        { kills: number; deaths: number; assists: number; cs: number; level: number; items: number[] }
      > = {};
      running.forEach((value, puuid) => {
        const prior = previousState.get(puuid);
        const participantFrame = frame?.participants?.[puuid];
        const participant = participantMeta.get(puuid);
        const cs =
          participantFrame?.cs ??
          prior?.cs ??
          (minute >= totalMinutes ? participant?.cs ?? 0 : 0);
        const level =
          participantFrame?.level ??
          prior?.level ??
          participant?.level ??
          1;
        const frameItems =
          participantFrame?.items?.map((item) =>
            typeof item === "number" ? item : 0,
          ) ?? [];
        const items =
          minute === 0
            ? []
            : frameItems.length
              ? [...frameItems]
              : prior?.items
                ? [...prior.items]
                : [];

        previousState.set(puuid, { cs, level, items });

        snapshot[puuid] = { ...value, cs, level, items };
      });
      minuteSnapshots[minute] = snapshot;
      objectiveSnapshots[minute] = {
        blue: { ...objectiveRunning.blue },
        red: { ...objectiveRunning.red },
      };
    }

    if (minuteSnapshots.length === 0) {
      const baseline: Record<
        string,
        { kills: number; deaths: number; assists: number; cs: number; level: number; items: number[] }
      > = {};
      running.forEach((value, puuid) => {
        const participant = participantMeta.get(puuid);
        baseline[puuid] = {
          ...value,
          cs: participant?.cs ?? 0,
          level: participant?.level ?? 1,
          items: [],
        };
        previousState.set(puuid, {
          cs: participant?.cs ?? 0,
          level: participant?.level ?? 1,
          items: [],
        });
      });
      minuteSnapshots[0] = baseline;
      objectiveSnapshots[0] = {
        blue: { towers: 0, dragons: 0, heralds: 0, barons: 0 },
        red: { towers: 0, dragons: 0, heralds: 0, barons: 0 },
      };
    }

    return { statsByMinute: minuteSnapshots, totalMinutes, objectivesByMinute: objectiveSnapshots };
  }, [events, gameDuration, participants, timeline]);

  const { currentTime, scrubTo, togglePlay } = useScrubber({
    duration: match.gameDuration,
    onChange: () => {},
  });

  useEffect(() => {
    if (!visibleCoachEvents.length) {
      if (currentEventIndex !== null) {
        setCurrentEventIndex(null);
      }
      manualEventRef.current = null;
      return;
    }

    const manualIndex = manualEventRef.current;
    if (
      manualIndex !== null &&
      visibleCoachEvents.some((event) => event.sourceIndex === manualIndex)
    ) {
      const manualEvent = coachEvents[manualIndex];
      if (
        manualEvent &&
        Math.abs(manualEvent.timestampSeconds - currentTime) <= 0.35
      ) {
        return;
      }
    }

    manualEventRef.current = null;
    const nearest = findNearestVisibleEventIndex(currentTime);
    if (nearest !== null && nearest !== currentEventIndex) {
      setCurrentEventIndex(nearest);
    }
  }, [
    coachEvents,
    currentEventIndex,
    currentTime,
    findNearestVisibleEventIndex,
    visibleCoachEvents,
  ]);

  useEffect(() => {
    if (!visibleCoachEvents.length) {
      manualEventRef.current = null;
      if (currentEventIndex !== null) {
        setCurrentEventIndex(null);
      }
      return;
    }
    if (currentEventIndex === null) {
      manualEventRef.current = null;
      setCurrentEventIndex(visibleCoachEvents[0].sourceIndex);
      return;
    }
    const isCurrentVisible = visibleCoachEvents.some((event) => event.sourceIndex === currentEventIndex);
    if (!isCurrentVisible) {
      manualEventRef.current = null;
      setCurrentEventIndex(visibleCoachEvents[0].sourceIndex);
    }
  }, [visibleCoachEvents, currentEventIndex]);

  const currentMinute = Math.min(
    totalMinutes,
    Math.max(0, Math.floor(currentTime / 60)),
  );

  const fallbackMinuteStats =
    statsByMinute.length > 0 ? statsByMinute[statsByMinute.length - 1] : {};

  const currentMinuteStats =
    statsByMinute[currentMinute] ?? fallbackMinuteStats;

  const zeroObjectives = {
    blue: { towers: 0, dragons: 0, heralds: 0, barons: 0 },
    red: { towers: 0, dragons: 0, heralds: 0, barons: 0 },
  };

  const currentObjectives =
    objectivesByMinute[currentMinute] ??
    objectivesByMinute[objectivesByMinute.length - 1] ??
    zeroObjectives;

  const focusParticipant = useMemo(
    () =>
      match.participants.find((p) => p.puuid === activePuuid),
    [activePuuid, match.participants],
  );

  const currentCoachEvent =
    currentEventIndex !== null ? coachEvents[currentEventIndex] ?? null : null;

  const handleChampionClick = useCallback((puuid: string) => {
    setSelectedPlayer((prev) => (prev === puuid ? null : puuid));
  }, []);

  const clearChampionSelection = useCallback(() => {
    setSelectedPlayer(null);
  }, []);

  const handleMinuteSelect = useCallback(
    (minute: number) => {
      togglePlay(false);
      const target = Math.min(gameDuration, Math.max(0, minute * 60));
      scrubTo(target);
    },
    [gameDuration, scrubTo, togglePlay],
  );

  const handleScrub = useCallback(
    (time: number) => {
      togglePlay(false);
      scrubTo(time);
    },
    [scrubTo, togglePlay],
  );

  const handleCoachEventSelect = useCallback(
    (sourceIndex: number) => {
      const event = coachEvents[sourceIndex];
      if (!event) return;
      manualEventRef.current = sourceIndex;
      togglePlay(false);
      scrubTo(event.timestampSeconds);
      setCurrentEventIndex(sourceIndex);
    },
    [coachEvents, scrubTo, togglePlay],
  );

  useEffect(() => {
    const isEditingElement = (element: EventTarget | null) => {
      if (!(element instanceof HTMLElement)) return false;
      const tag = element.tagName;
      if (element.isContentEditable) return true;
      return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (isEditingElement(event.target)) return;

      if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
        if (!visibleCoachEvents.length) return;
        const visibleIndex = currentEventIndex !== null
          ? visibleCoachEvents.findIndex((item) => item.sourceIndex === currentEventIndex)
          : -1;
        if (event.key === "ArrowRight") {
          const nextIndex = visibleIndex >= 0
            ? Math.min(visibleIndex + 1, visibleCoachEvents.length - 1)
            : 0;
          event.preventDefault();
          handleCoachEventSelect(visibleCoachEvents[nextIndex].sourceIndex);
        } else if (event.key === "ArrowLeft") {
          const prevIndex = visibleIndex >= 0
            ? Math.max(visibleIndex - 1, 0)
            : visibleCoachEvents.length - 1;
          event.preventDefault();
          handleCoachEventSelect(visibleCoachEvents[prevIndex].sourceIndex);
        }
        return;
      }

      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        if (totalMinutes <= 0) return;
        if (event.key === "ArrowUp") {
          const previousMinute = Math.max(0, currentMinute - 1);
          if (previousMinute !== currentMinute) {
            event.preventDefault();
            handleMinuteSelect(previousMinute);
          }
        } else {
          const nextMinute = Math.min(totalMinutes, currentMinute + 1);
          if (nextMinute !== currentMinute) {
            event.preventDefault();
            handleMinuteSelect(nextMinute);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    currentEventIndex,
    currentMinute,
    handleCoachEventSelect,
    handleMinuteSelect,
    totalMinutes,
    visibleCoachEvents,
  ]);

  const itemIconBase = useMemo(() => {
    for (const participant of participants) {
      for (const item of participant.items ?? []) {
        if (item?.icon) {
          const idx = item.icon.lastIndexOf("/");
          if (idx > 0) {
            return item.icon.slice(0, idx);
          }
        }
      }
      if (participant.trinket?.icon) {
        const idx = participant.trinket.icon.lastIndexOf("/");
        if (idx > 0) {
          return participant.trinket.icon.slice(0, idx);
        }
      }
    }
    return "https://ddragon.leagueoflegends.com/cdn/latest/img/item";
  }, [participants]);

  const resolveItemIcon = useCallback(
    (itemId: number) => {
      if (!itemId) return null;
      return `${itemIconBase}/${itemId}.png`;
    },
    [itemIconBase],
  );

  const matchTypeLabel = (match.queueType ?? "Match").toUpperCase();
  const outcomeText = focusParticipant?.win ? "Victory" : "Defeat";
  const heroCardClass = focusParticipant?.win
    ? "border-emerald-500/20 bg-gradient-to-br from-emerald-900/35 via-slate-950/70 to-slate-950/50"
    : "border-rose-500/40 bg-gradient-to-br from-rose-900/65 via-rose-800/35 to-slate-950/55";

  const championSplashUrl = focusParticipant?.championName 
    ? `https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${focusParticipant.championName}_0.jpg`
    : null;

  // Construct profile URL for back button
  // Try to use focus player's info, or extract from summonerName
  let profileUrl = null;
  let gameName = focusGameName;
  let tagLine = focusTagLine;
  
  // If not provided, try to extract from participant's summonerName (format: Name#TAG)
  if ((!gameName || !tagLine) && focusParticipant?.summonerName) {
    const parts = focusParticipant.summonerName.split('#');
    if (parts.length === 2) {
      gameName = gameName || parts[0];
      tagLine = tagLine || parts[1];
    }
  }
  
  if (gameName && tagLine && match.region) {
    profileUrl = `/profile/${match.region}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`;
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Back Button */}
      {profileUrl ? (
        <Link
          href={profileUrl}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-all group w-fit"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Profile</span>
        </Link>
      ) : (
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-300 hover:text-white bg-slate-800/50 hover:bg-slate-800 rounded-lg border border-slate-700/50 hover:border-slate-600 transition-all group w-fit"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
          <span>Back</span>
        </button>
      )}
      <div className={cn("relative overflow-hidden rounded-3xl border p-6 shadow-lg shadow-violet-900/25", heroCardClass)}>
        {/* Champion Splash Art Background */}
        {championSplashUrl && (
          <>
            <div className="absolute inset-0">
              <Image
                src={championSplashUrl}
                alt={focusParticipant?.championName ?? "Champion"}
                fill
                className="object-cover object-top"
                priority
              />
            </div>
            {/* Gradient overlay for readability */}
            <div className={cn(
              "absolute inset-0",
              focusParticipant?.win
                ? "bg-gradient-to-br from-emerald-900/90 via-slate-950/85 to-slate-950/90"
                : "bg-gradient-to-br from-rose-900/90 via-rose-950/85 to-slate-950/90"
            )} />
          </>
        )}
        
        {/* Content */}
        <div className="relative z-10">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-slate-300/80">
                Match Type
              </p>
              <h2 className="text-2xl font-semibold text-slate-100">
                {matchTypeLabel}
              </h2>
            </div>
            <div
              className={cn(
                "rounded-full border px-4 py-1 text-sm font-semibold uppercase tracking-wide",
                focusParticipant?.win
                  ? "border-emerald-500/60 bg-emerald-500/25 text-emerald-100"
                  : "border-rose-500/80 bg-rose-500/35 text-rose-100",
              )}
            >
              {outcomeText}
            </div>
          </div>

          <div className="mt-5 flex items-center gap-4">
            {focusParticipant?.championIcon ? (
              <div className="relative h-14 w-14 overflow-hidden rounded-2xl border border-white/15 bg-slate-900/80 shadow">
                <Image
                  src={focusParticipant.championIcon}
                  alt={focusParticipant.championName}
                  fill
                  className="object-cover"
                />
              </div>
            ) : null}
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-400">
                Played As
              </p>
              <p className="text-lg font-semibold text-slate-100">
                {focusParticipant?.championName ?? "Unknown"}
              </p>
              <p className="text-sm text-slate-400">
                {focusParticipant?.summonerName ?? focusGameName ?? "—"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <ChampionMatchups
        participants={match.participants}
        currentMinuteStats={currentMinuteStats}
        currentMinute={currentMinute}
        totalMinutes={totalMinutes}
        selectedPuuid={selectedPlayer}
        primaryPuuid={match.primaryParticipantPuuid}
        objectives={currentObjectives}
        resolveItemIcon={resolveItemIcon}
        onChampionClick={handleChampionClick}
        onClearSelection={clearChampionSelection}
      />

      <MinuteNavigator
        totalMinutes={totalMinutes}
        currentMinute={currentMinute}
        onSelect={handleMinuteSelect}
      />

      {/* Map + Chat */}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] lg:items-stretch">
        <div className="flex flex-col">
          <div className="relative w-full min-h-[360px] max-lg:aspect-video lg:aspect-square">
            <RiftMap
              participants={match.participants}
              primaryPuuid={match.primaryParticipantPuuid}
              selectedPlayers={selectedPlayersSet}
              currentEvent={currentCoachEvent}
              timeline={timeline}
              currentMinute={currentMinute}
              focusSelection={Boolean(selectedPlayer)}
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
        events={visibleCoachEvents}
        duration={match.gameDuration}
        currentTime={currentTime}
        currentEventIndex={currentEventIndex}
        onScrub={handleScrub}
        onSelectEvent={handleCoachEventSelect}
        selectedPuuid={selectedPlayer}
      />
    </div>
  );
}
