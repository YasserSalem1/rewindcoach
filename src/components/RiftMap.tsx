"use client";

import { useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

import type { TimelineEvent, TimelineEventType, RiotParticipant } from "@/lib/riot";
import { cn } from "@/lib/ui";

const MAP_SIZE = 14870;
const HIGHLIGHT_WINDOW = 7; // seconds

const DISPLAYED_EVENT_TYPES = new Set<TimelineEventType>([
  "KILL",
  "ASSIST",
  "DEATH",
  "TOWER",
  "DRAGON",
  "BARON",
  "HERALD",
  "OBJECTIVE",
]);

interface RiftMapProps {
  events: TimelineEvent[];
  currentTime: number;
  participants: RiotParticipant[];
  primaryPuuid: string;
  selectedPlayers: Set<string>;
  className?: string;
  focusSelection?: boolean;
}

export function RiftMap({
  events,
  currentTime,
  participants,
  primaryPuuid,
  selectedPlayers,
  className,
  focusSelection = false,
}: RiftMapProps) {
  const participantByPuuid = useMemo(() => {
    const map = new Map<string, RiotParticipant>();
    participants.forEach((participant) => map.set(participant.puuid, participant));
    return map;
  }, [participants]);

  const sortedEvents = useMemo(
    () =>
      [...events]
        .filter((event) => DISPLAYED_EVENT_TYPES.has(event.type))
        .sort((a, b) => a.timestamp - b.timestamp),
    [events],
  );

  const displayedEvents = useMemo(() => {
    if (!focusSelection || selectedPlayers.size === 0) {
      return sortedEvents;
    }
    return sortedEvents.filter((event) => {
      const relevant = new Set<string>();
      if (event.actorPuuid) relevant.add(event.actorPuuid);
      if (event.killerPuuid) relevant.add(event.killerPuuid);
      if (event.victimPuuid) relevant.add(event.victimPuuid);
      (event.assistingPuuids ?? []).forEach((puuid) => puuid && relevant.add(puuid));
      for (const puuid of relevant) {
        if (selectedPlayers.has(puuid)) return true;
      }
      return false;
    });
  }, [focusSelection, selectedPlayers, sortedEvents]);

  const highlightEventIds = useMemo(() => {
    const source = displayedEvents.length ? displayedEvents : sortedEvents;
    if (!source.length) return new Set<string>();
    const near = source.filter(
      (event) => Math.abs(event.timestamp - currentTime) <= HIGHLIGHT_WINDOW,
    );
    const focusList = near.length
      ? near
      : source.reduce<{ diff: number; items: TimelineEvent[] }>(
          (acc, event) => {
            const diff = Math.abs(event.timestamp - currentTime);
            if (diff < acc.diff) {
              return { diff, items: [event] };
            }
            if (diff === acc.diff) {
              acc.items.push(event);
            }
            return acc;
          },
          { diff: Infinity, items: [] },
        ).items;
    return new Set(focusList.map((event) => event.id));
  }, [currentTime, displayedEvents, sortedEvents]);

  const eventsToRender = useMemo(() => {
    const highlights = sortedEvents.filter((event) => highlightEventIds.has(event.id));
    if (highlights.length) return highlights;
    if (!sortedEvents.length) return [];
    return sortedEvents.reduce<{ diff: number; items: TimelineEvent[] }>((acc, event) => {
      const diff = Math.abs(event.timestamp - currentTime);
      if (diff < acc.diff) {
        return { diff, items: [event] };
      }
      if (diff === acc.diff) {
        acc.items.push(event);
      }
      return acc;
    }, { diff: Infinity, items: [] }).items;
  }, [currentTime, highlightEventIds, sortedEvents]);

  const clusterSizes = useMemo(() => {
    const sizes = new Map<string, number>();
    eventsToRender.forEach((event) => {
      const key = `${event.timestamp}-${Math.round(event.position.x)}-${Math.round(event.position.y)}`;
      sizes.set(key, (sizes.get(key) ?? 0) + 1);
    });
    return sizes;
  }, [eventsToRender]);

  const clusterCounters = new Map<string, number>();

  const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden rounded-3xl border border-white/5 bg-slate-950/70",
        className
      )}
      aria-label="Summoner's Rift timeline map"
    >
      <div className="absolute inset-0">
        <Image
          src="/images/rift.jpg"
          alt=""
          fill
          className="object-cover"
          draggable={false}
          style={{
            pointerEvents: "none",
            borderRadius: '1.5rem',
          }}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/40 via-transparent to-violet-900/60 pointer-events-none" />
        
        {eventsToRender.map((event) => {
          const baseLeft = clampPercent((event.position.x / MAP_SIZE) * 100);
          const baseBottom = clampPercent((event.position.y / MAP_SIZE) * 100);
          const isActive = highlightEventIds.has(event.id);

          const candidates = [
            event.actorPuuid,
            event.killerPuuid,
            event.victimPuuid,
            ...(event.assistingPuuids ?? []),
          ].filter((puuid): puuid is string => Boolean(puuid));
          const actorParticipant = candidates
            .map((puuid) => participantByPuuid.get(puuid))
            .find((participant): participant is RiotParticipant => Boolean(participant));

          const letter = getOverlayLetter(event.type);
          const styles = getOverlayStyles(event.type);

          const clusterKey = `${event.timestamp}-${Math.round(event.position.x)}-${Math.round(event.position.y)}`;
          const clusterIndex = clusterCounters.get(clusterKey) ?? 0;
          clusterCounters.set(clusterKey, clusterIndex + 1);
          const clusterSize = clusterSizes.get(clusterKey) ?? 1;

          let left = baseLeft;
          let bottom = baseBottom;
          if (clusterSize > 1) {
            const radius = Math.min(5, 14 / clusterSize);
            const angle = (clusterIndex / clusterSize) * 2 * Math.PI;
            left = clampPercent(baseLeft + Math.cos(angle) * radius);
            bottom = clampPercent(baseBottom + Math.sin(angle) * radius);
          }

          if (actorParticipant) {
            const isPrimary = actorParticipant.puuid === primaryPuuid;
            const isSelected = selectedPlayers.has(actorParticipant.puuid);

            return (
              <motion.div
                key={event.id}
                className="absolute -translate-x-1/2 translate-y-1/2"
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: isActive ? 1.08 : 0.96, opacity: focusSelection && !isSelected ? 0.35 : 1 }}
                transition={{ duration: 0.2 }}
                style={{ left: `${left}%`, bottom: `${bottom}%`, zIndex: isActive ? 30 : 18 }}
              >
                <div
                  className={cn(
                    "relative h-12 w-12 overflow-hidden rounded-full border-2 shadow-lg backdrop-blur",
                    styles.container,
                    isPrimary && "ring-2 ring-yellow-300/80",
                  )}
                  title={event.description}
                >
                  <Image
                    src={actorParticipant.championIcon}
                    alt={actorParticipant.championName}
                    fill
                    className="object-cover"
                  />
                  <div className={cn("absolute inset-0 flex items-center justify-center text-[36px] font-black uppercase mix-blend-screen", styles.letter)}>
                    {letter}
                  </div>
                </div>
                <span className="sr-only">{event.description}</span>
              </motion.div>
            );
          }

          return (
            <motion.div
              key={event.id}
              className={cn(
                "absolute flex h-8 w-8 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border-2 text-xs font-semibold text-white shadow-lg backdrop-blur",
                styles.container,
              )}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: isActive ? 1.05 : 0.92, opacity: 0.9 }}
              transition={{ duration: 0.2 }}
              style={{ left: `${left}%`, bottom: `${bottom}%`, zIndex: isActive ? 28 : 16 }}
            >
              {letter}
              <span className="sr-only">{event.description}</span>
            </motion.div>
          );
        })}
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-3xl border border-violet-400/20" />
    </div>
  );
}

function getOverlayLetter(type: TimelineEventType) {
  switch (type) {
    case "KILL":
      return "K";
    case "DEATH":
      return "D";
    case "ASSIST":
      return "A";
    case "TOWER":
      return "T";
    case "DRAGON":
      return "D";
    case "BARON":
      return "B";
    case "HERALD":
      return "H";
    case "OBJECTIVE":
      return "G"; // Grubs or other objective
    default:
      return "?";
  }
}

function getOverlayStyles(type: TimelineEventType) {
  switch (type) {
    case "KILL":
      return {
        container: "border-emerald-400/80 bg-emerald-500/15",
        letter: "text-emerald-200/65",
      };
    case "DEATH":
      return {
        container: "border-rose-400/80 bg-rose-500/15",
        letter: "text-rose-200/65",
      };
    case "ASSIST":
      return {
        container: "border-sky-400/80 bg-sky-500/15",
        letter: "text-sky-200/65",
      };
    case "TOWER":
      return {
        container: "border-amber-400/80 bg-amber-500/15",
        letter: "text-amber-200/65",
      };
    case "DRAGON":
      return {
        container: "border-orange-400/80 bg-orange-500/15",
        letter: "text-orange-200/65",
      };
    case "BARON":
      return {
        container: "border-purple-400/80 bg-purple-500/15",
        letter: "text-purple-200/65",
      };
    case "HERALD":
      return {
        container: "border-indigo-400/80 bg-indigo-500/15",
        letter: "text-indigo-200/65",
      };
    case "OBJECTIVE":
      return {
        container: "border-lime-400/80 bg-lime-500/15",
        letter: "text-lime-200/65",
      };
    case "MOVE":
    default:
      return {
        container: "border-slate-400/80 bg-slate-500/15",
        letter: "text-slate-200/65",
      };
  }
}
