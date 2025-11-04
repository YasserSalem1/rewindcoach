"use client";

import { useMemo } from "react";
import Image from "next/image";
import { motion } from "framer-motion";

import type { RiotParticipant } from "@/lib/riot";
import type {
  CoachEventActor,
  CoachEventPosition,
  CoachParsedEvent,
} from "@/lib/parseReviewOutput";
import { cn } from "@/lib/ui";

const MAP_SIZE = 14870;

type BadgeVariant = "kill" | "death" | "assist" | "objective";

interface BadgeDescriptor {
  variant: BadgeVariant;
  label?: string;
  colorClass?: string;
}

interface ResolvedPosition {
  key: string;
  puuid: string;
  teamId: number;
  teamColor: "blue" | "red";
  championName: string;
  championIcon?: string;
  summonerName?: string;
  coordinates: { x: number; y: number };
  meta: CoachEventPosition;
}

interface RiftMapProps {
  participants: RiotParticipant[];
  primaryPuuid: string;
  selectedPlayers: Set<string>;
  currentEvent: CoachParsedEvent | null;
  timeline: import("@/lib/riot").TimelineFrame[];
  currentMinute: number;
  className?: string;
  focusSelection?: boolean;
}

const BADGE_BASE: Record<BadgeVariant, string> = {
  kill: "text-emerald-300",
  death: "text-rose-300",
  assist: "text-sky-300",
  objective: "text-amber-300",
};

const normalize = (value?: string | null) =>
  (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

const toTeamColor = (teamId?: number, fallback?: "blue" | "red") => {
  if (teamId === 200) return "red";
  if (teamId === 100) return "blue";
  return fallback ?? "blue";
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const actorMatches = (a?: CoachEventActor, b?: CoachEventActor) => {
  if (!a || !b) return false;
  if (a.puuid && b.puuid && a.puuid === b.puuid) return true;
  const aColor = a.teamColor ?? toTeamColor(a.teamId);
  const bColor = b.teamColor ?? toTeamColor(b.teamId);
  const sameTeam = !aColor || !bColor || aColor === bColor;
  if (!sameTeam) return false;

  if (a.summonerName && b.summonerName && normalize(a.summonerName) === normalize(b.summonerName)) {
    return true;
  }
  if (a.championName && b.championName && normalize(a.championName) === normalize(b.championName)) {
    return true;
  }
  return false;
};

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

export function RiftMap({
  participants,
  primaryPuuid,
  selectedPlayers,
  currentEvent,
  timeline,
  currentMinute,
  className,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  focusSelection: _focusSelection = false,
}: RiftMapProps) {
  // Get player positions from current minute's timeline frame
  const positions = useMemo((): ResolvedPosition[] => {
    const result: ResolvedPosition[] = [];
    
    // Find the frame for the current minute
    const currentFrame = timeline.find(f => Math.floor(f.timestamp / 60) === currentMinute);
    
    if (!currentFrame) return result;
    
    // Iterate through all participants to show all 10 players
    for (const participant of participants) {
      // Get position from frame participant state, or use default
      const participantState = currentFrame.participants?.[participant.puuid];
      const position = participantState?.position || { x: 7435, y: 7435 };
      
      result.push({
        key: `${participant.puuid}-${currentMinute}`,
        puuid: participant.puuid,
        teamId: participant.teamId,
        teamColor: (participant.teamId === 100 ? "blue" : "red") as "blue" | "red",
        championName: participant.championName,
        championIcon: participant.championIcon || "",
        summonerName: participant.summonerName,
        coordinates: position,
        meta: {
          puuid: participant.puuid,
          x: position.x,
          y: position.y,
          summonerName: participant.summonerName,
          championName: participant.championName,
          teamId: participant.teamId,
          teamColor: (participant.teamId === 100 ? "blue" : "red") as "blue" | "red",
        },
      });
    }
    
    return result;
  }, [timeline, currentMinute, participants]);

  // Create badge map for event participants
  const badgeFor = useMemo(() => {
    const map = new Map<string, BadgeDescriptor>();
    if (!currentEvent) return map;

    const addBadge = (actor: CoachEventActor | undefined, descriptor: BadgeDescriptor) => {
      if (!actor?.puuid) return;
      map.set(actor.puuid, descriptor);
    };

    addBadge(currentEvent.killer, {
      variant: "kill",
      label: "K",
      colorClass: "text-emerald-300 drop-shadow-[0_0_8px_rgba(16,185,129,0.85)]",
    });

    addBadge(currentEvent.victim, {
      variant: "death",
      label: "D",
      colorClass: "text-rose-300 drop-shadow-[0_0_8px_rgba(244,114,182,0.8)]",
    });

    currentEvent.assists.forEach((assist) =>
      addBadge(assist, {
        variant: "assist",
        label: "A",
        colorClass: "text-sky-300 drop-shadow-[0_0_8px_rgba(125,211,252,0.8)]",
      }),
    );

    if (currentEvent.objectiveActor) {
      const descriptor = (currentEvent.objectiveName ?? currentEvent.description ?? "").toLowerCase();

      const isTower =
        currentEvent.category === "turret" ||
        /tower|turret|inhibitor|nexus/.test(descriptor);

      let label = "O";
      let colorClass = "text-violet-300 drop-shadow-[0_0_8px_rgba(167,139,250,0.85)]";

      if (isTower) {
        label = "T";
        colorClass = "text-amber-300 drop-shadow-[0_0_8px_rgba(251,191,36,0.9)]";
      } else if (/dragon|drake|soul/.test(descriptor)) {
        label = "Dr";
        colorClass = "text-orange-300 drop-shadow-[0_0_8px_rgba(251,146,60,0.9)]";
      } else if (/baron|atakhan/.test(descriptor)) {
        label = "B";
        colorClass = "text-purple-300 drop-shadow-[0_0_8px_rgba(192,132,252,0.9)]";
      } else if (/void|grub/.test(descriptor)) {
        label = "V";
        colorClass = "text-fuchsia-300 drop-shadow-[0_0_8px_rgba(232,121,249,0.9)]";
      } else if (/rift|herald/.test(descriptor)) {
        label = "R";
        colorClass = "text-indigo-300 drop-shadow-[0_0_8px_rgba(129,140,248,0.9)]";
      }

      addBadge(currentEvent.objectiveActor, {
        variant: "objective",
        label,
        colorClass,
      });
    }

    return map;
  }, [currentEvent]);

  return (
    <div
      className={cn(
        "relative h-full w-full overflow-hidden rounded-3xl border border-white/5 bg-slate-950/70",
        className,
      )}
      aria-label="Summoner's Rift map"
    >
      <div className="absolute inset-0">
        <Image
          src="/images/rift.jpg"
          alt=""
          fill
          className="object-cover"
          draggable={false}
          style={{ pointerEvents: "none", borderRadius: "1.5rem" }}
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/40 via-transparent to-violet-900/60 pointer-events-none" />

        {positions.map((position) => {
          const { x, y } = position.coordinates;
          const left = clampPercent((x / MAP_SIZE) * 100);
          const bottom = clampPercent((y / MAP_SIZE) * 100);
          const isPrimary = position.puuid === primaryPuuid;
          const isSelected = selectedPlayers.has(position.puuid);
          const badge = badgeFor.get(position.puuid);

          const ringClass =
            position.teamId === 100
              ? "ring-blue-400/80 border-blue-300/60"
              : "ring-red-400/80 border-red-300/60";

          // Check if player is involved in current event
          const isInvolvedInEvent = currentEvent
            ? (currentEvent.killer?.puuid === position.puuid ||
               currentEvent.victim?.puuid === position.puuid ||
               currentEvent.assists.some(a => a.puuid === position.puuid) ||
               currentEvent.objectiveActor?.puuid === position.puuid)
            : true; // If no event, show all at full brightness

          const playerOpacity = isInvolvedInEvent ? 1 : 0.6;

          return (
            <motion.div
              key={position.key}
              className="absolute -translate-x-1/2 translate-y-1/2"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: playerOpacity }}
              transition={{ duration: 0.25 }}
              style={{ left: `${left}%`, bottom: `${bottom}%`, zIndex: isPrimary ? 30 : 20 }}
            >
              <div
                className={cn(
                  "relative h-12 w-12 overflow-hidden rounded-full border bg-slate-950/80 shadow-xl shadow-slate-900/40 backdrop-blur",
                  ringClass,
                  isPrimary && "ring-2",
                  isSelected && "shadow-[0_0_18px_rgba(192,132,252,0.55)]",
                )}
                title={position.summonerName ?? position.championName}
              >
                {position.championIcon ? (
                  <Image src={position.championIcon} alt="" fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-slate-900 text-xs text-slate-400">
                    {position.championName.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {positions.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-slate-400">
          Player positions will appear as the match progresses.
        </div>
      ) : null}
    </div>
  );
}
