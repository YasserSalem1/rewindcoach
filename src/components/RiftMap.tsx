"use client";

import { useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

import type { TimelineEvent, RiotParticipant } from "@/lib/riot";
import { cn } from "@/lib/ui";

const MAP_SIZE = 14870;

interface RiftMapProps {
  events: TimelineEvent[];
  currentTime: number;
  participants: RiotParticipant[];
  primaryPuuid: string;
  selectedPlayers: Set<string>;
  className?: string;
}

export function RiftMap({ 
  events, 
  currentTime, 
  participants,
  primaryPuuid,
  selectedPlayers,
  className 
}: RiftMapProps) {
  const visibleEvents = useMemo(
    () => events.filter((event) => event.timestamp <= currentTime),
    [currentTime, events]
  );

  // Get player positions from the most recent events
  const playerPositions = useMemo(() => {
    const positions = new Map<string, { x: number; y: number; participant: RiotParticipant }>();
    
    // Find the most recent position for each player
    for (const event of [...visibleEvents].reverse()) {
      if (event.killerPuuid && !positions.has(event.killerPuuid)) {
        const participant = participants.find((p) => p.puuid === event.killerPuuid);
        if (participant) {
          positions.set(event.killerPuuid, {
            x: event.position.x,
            y: event.position.y,
            participant,
          });
        }
      }
      if (event.victimPuuid && !positions.has(event.victimPuuid)) {
        const participant = participants.find((p) => p.puuid === event.victimPuuid);
        if (participant) {
          positions.set(event.victimPuuid, {
            x: event.position.x,
            y: event.position.y,
            participant,
          });
        }
      }
    }
    
    return positions;
  }, [visibleEvents, participants]);

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden rounded-3xl border border-white/5 bg-slate-950/70",
        className
      )}
      aria-label="Summoner's Rift timeline map"
    >
      <div className="absolute inset-0">
        <img
          src="/images/rift.jpg"
          alt=""
          className="h-full w-full object-cover"
          draggable={false}
          style={{
            pointerEvents: "none",
            borderRadius: '1.5rem',
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/40 via-transparent to-violet-900/60 pointer-events-none" />
        
        {/* Event Markers */}
        {visibleEvents.map((event) => {
          const left = (event.position.x / MAP_SIZE) * 100;
          const bottom = (event.position.y / MAP_SIZE) * 100;
          return (
            <motion.div
              key={event.id}
              className={cn(
                "absolute flex h-6 w-6 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border text-xs font-semibold shadow-lg backdrop-blur",
                markerClasses(event.type),
              )}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              style={{
                left: `${left}%`,
                bottom: `${bottom}%`,
                zIndex: 10,
              }}
            >
              {event.type[0]}
              <span className="sr-only">{event.description}</span>
            </motion.div>
          );
        })}

        {/* Player Positions with Champion Icons */}
        {Array.from(playerPositions.entries()).map(([puuid, { x, y, participant }]) => {
          const left = (x / MAP_SIZE) * 100;
          const bottom = (y / MAP_SIZE) * 100;
          const isSelected = selectedPlayers.has(puuid);
          const isPrimary = puuid === primaryPuuid;
          const isBlueTeam = participant.teamId === 100;
          
          return (
            <motion.div
              key={`player-${puuid}`}
              className={cn(
                "absolute -translate-x-1/2 translate-y-1/2",
                isSelected && "ring-2 ring-violet-400 rounded-full"
              )}
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              style={{
                left: `${left}%`,
                bottom: `${bottom}%`,
                zIndex: 20,
              }}
            >
              <div
                className={cn(
                  "relative h-12 w-12 overflow-hidden rounded-full border-2 shadow-lg",
                  isBlueTeam ? "border-blue-400" : "border-red-400",
                  isPrimary && "ring-2 ring-yellow-400 ring-offset-2 ring-offset-slate-950"
                )}
                title={`${participant.summonerName} (${participant.championName})`}
              >
                <Image
                  src={participant.championIcon}
                  alt={participant.championName}
                  fill
                  className="object-cover"
                />
              </div>
              {/* Small indicator for team */}
              <div
                className={cn(
                  "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-slate-950",
                  isBlueTeam ? "bg-blue-500" : "bg-red-500"
                )}
              />
            </motion.div>
          );
        })}
      </div>
      <div className="pointer-events-none absolute inset-0 rounded-3xl border border-violet-400/20" />
    </div>
  );
}

function markerClasses(type: TimelineEvent["type"]) {
  switch (type) {
    case "KILL":
      return "border-violet-400 bg-violet-500/30 text-violet-50";
    case "DEATH":
      return "border-red-400 bg-red-500/30 text-red-50";
    case "DRAGON":
    case "BARON":
    case "HERALD":
    case "OBJECTIVE":
      return "border-amber-400 bg-amber-500/30 text-amber-50";
    case "TOWER":
      return "border-sky-400 bg-sky-500/30 text-sky-50";
    default:
      return "border-white/30 bg-white/20 text-white";
  }
}
