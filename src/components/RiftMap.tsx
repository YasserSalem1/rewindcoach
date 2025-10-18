"use client";

import { useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

import type { TimelineEvent, TimelineEventType, RiotParticipant } from "@/lib/riot";
import { cn } from "@/lib/ui";

const MAP_SIZE = 14870;

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

  const eventsForMap = useMemo(
    () =>
      events
        .filter((event) => EVENT_TYPES_FOR_OVERLAY.has(event.type))
        .sort((a, b) => a.timestamp - b.timestamp),
    [events],
  );

  const activeEvents = useMemo(() => {
    if (!eventsForMap.length) return [];
    const windowSeconds = 7;
    const nearEvents = eventsForMap.filter(
      (event) => Math.abs(event.timestamp - currentTime) <= windowSeconds,
    );
    if (nearEvents.length) return nearEvents;

    const nearest = eventsForMap.reduce(
      (closest, event) => {
        const diff = Math.abs(event.timestamp - currentTime);
        if (diff < closest.diff) {
          return { diff, events: [event] };
        }
        if (diff === closest.diff) {
          closest.events.push(event);
        }
        return closest;
      },
      { diff: Infinity, events: [] as TimelineEvent[] },
    );
    return nearest.events;
  }, [eventsForMap, currentTime]);

  const activeEventIds = useMemo(
    () => new Set(activeEvents.map((event) => event.id)),
    [activeEvents],
  );

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
        
        {/* Background markers to show all event locations */}
        {eventsForMap.map((event) => {
          const left = (event.position.x / MAP_SIZE) * 100;
          const bottom = (event.position.y / MAP_SIZE) * 100;
          return (
            <div
              key={`marker-${event.id}`}
              className="pointer-events-none absolute h-2 w-2 -translate-x-1/2 translate-y-1/2 rounded-full bg-white/40 blur-[1px]"
              style={{
                left: `${left}%`,
                bottom: `${bottom}%`,
                zIndex: 8,
                opacity: event.timestamp <= currentTime ? 0.7 : 0.25,
              }}
            />
          );
        })}

        {/* Event icons */}
        {eventsForMap.map((event) => {
          const left = (event.position.x / MAP_SIZE) * 100;
          const bottom = (event.position.y / MAP_SIZE) * 100;
          const actor =
            (event.actorPuuid && participantByPuuid.get(event.actorPuuid)) ||
            (event.killerPuuid && participantByPuuid.get(event.killerPuuid)) ||
            (event.victimPuuid && participantByPuuid.get(event.victimPuuid)) ||
            (event.assistingPuuids && event.assistingPuuids.length
              ? participantByPuuid.get(event.assistingPuuids[0])
              : undefined);
          const overlayLetter = getOverlayLetter(event.type);
          const overlayTone = getOverlayTone(event.type);
          const isActive = activeEventIds.has(event.id);
          const isPast = event.timestamp <= currentTime;
          const isPrimaryActor = actor?.puuid === primaryPuuid;
          const isRelevant =
            !focusSelection ||
            selectedPlayers.size === 0 ||
            (actor && selectedPlayers.has(actor.puuid)) ||
            (event.victimPuuid && selectedPlayers.has(event.victimPuuid)) ||
            (event.assistingPuuids?.some((puuid) => selectedPlayers.has(puuid)) ?? false);

          if (actor) {
            return (
              <motion.div
                key={`event-${event.id}`}
                className="absolute -translate-x-1/2 translate-y-1/2"
                initial={{ scale: 0.65, opacity: 0 }}
                animate={{
                  scale: isActive ? 1.08 : 0.9,
                  opacity: isPast ? (isRelevant ? 1 : 0.35) : 0.35,
                }}
                transition={{ duration: 0.2 }}
                style={{
                  left: `${left}%`,
                  bottom: `${bottom}%`,
                  zIndex: isActive ? 32 : 20,
                }}
              >
                <div
                  className={cn(
                    "relative h-12 w-12 overflow-hidden rounded-full border-2 border-white/50 shadow-lg transition",
                    isActive ? "ring-2 ring-violet-400/70" : "ring-1 ring-slate-900/40",
                    !isRelevant && "grayscale opacity-70",
                    isPrimaryActor && "ring-2 ring-yellow-300/80",
                  )}
                >
                  <Image
                    src={actor.championIcon}
                    alt={actor.championName}
                    fill
                    className="object-cover"
                  />
                  <div
                    className={cn(
                      "absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full border border-white/40 text-[9px] font-bold text-white shadow",
                      overlayTone,
                      !isActive && "opacity-70",
                    )}
                  >
                    {overlayLetter}
                  </div>
                </div>
                {isActive && (
                  <span className="absolute -bottom-6 left-1/2 w-max -translate-x-1/2 rounded-md bg-slate-950/80 px-2 py-1 text-[9px] font-medium text-slate-100 shadow">
                    {actor.summonerName}
                  </span>
                )}
              </motion.div>
            );
          }

          return (
            <motion.div
              key={`event-${event.id}`}
              className={cn(
                "absolute flex h-8 w-8 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border-2 border-white/30 text-xs font-semibold text-white shadow-lg backdrop-blur",
                overlayTone ?? "bg-slate-900/70",
              )}
              initial={{ scale: 0.65, opacity: 0 }}
              animate={{
                scale: isActive ? 1.05 : 0.9,
                opacity: isPast ? (isRelevant ? 1 : 0.35) : 0.3,
              }}
              transition={{ duration: 0.2 }}
              style={{
                left: `${left}%`,
                bottom: `${bottom}%`,
                zIndex: isActive ? 32 : 18,
              }}
            >
              {overlayLetter}
              <span className="sr-only">{event.description}</span>
            </motion.div>
          );
        })}

      </div>
      <div className="pointer-events-none absolute inset-0 rounded-3xl border border-violet-400/20" />
    </div>
  );
}

const EVENT_TYPES_FOR_OVERLAY = new Set<TimelineEventType>([
  "KILL",
  "DEATH",
  "ASSIST",
  "TOWER",
  "DRAGON",
  "BARON",
  "HERALD",
  "OBJECTIVE",
]);

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
    case "BARON":
    case "HERALD":
    case "OBJECTIVE":
      return "O";
    default:
      return type[0] ?? "?";
  }
}

function getOverlayTone(type: TimelineEventType) {
  switch (type) {
    case "KILL":
      return "bg-violet-500/90";
    case "DEATH":
      return "bg-rose-500/90";
    case "ASSIST":
      return "bg-sky-500/90";
    case "TOWER":
      return "bg-amber-500/90";
    case "DRAGON":
    case "OBJECTIVE":
      return "bg-orange-500/90";
    case "BARON":
      return "bg-purple-500/90";
    case "HERALD":
      return "bg-indigo-500/90";
    default:
      return undefined;
  }
}
