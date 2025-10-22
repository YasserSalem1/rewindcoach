"use client";

import { useMemo, type ComponentType } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Castle, Crown, Flame, Mountain } from "lucide-react";

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
  Icon?: ComponentType<{ className?: string }>;
  tone?: string;
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
  kill: "bg-emerald-400 text-emerald-950",
  death: "bg-rose-500 text-rose-50",
  assist: "bg-sky-400 text-sky-950",
  objective: "bg-amber-400 text-amber-950",
};

const OBJECTIVE_ICON_RULES: Array<{
  test: RegExp;
  Icon: ComponentType<{ className?: string }>;
  tone: string;
}> = [
  { test: /(dragon|soul)/i, Icon: Flame, tone: "bg-orange-400/95 text-slate-950" },
  { test: /(baron)/i, Icon: Crown, tone: "bg-purple-400/95 text-slate-950" },
  { test: /(herald|voidgrub)/i, Icon: Mountain, tone: "bg-indigo-400/95 text-slate-950" },
  { test: /(turret|tower|inhibitor|nexus)/i, Icon: Castle, tone: "bg-amber-400/95 text-slate-950" },
];

const normalize = (value?: string | null) =>
  (value ?? "").toLowerCase().replace(/[^a-z0-9]/g, "");

const toTeamColor = (teamId?: number, fallback?: "blue" | "red") => {
  if (teamId === 200) return "red";
  if (teamId === 100) return "blue";
  return fallback ?? "blue";
};

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

const resolveObjectiveBadge = (objectiveName?: string): BadgeDescriptor | null => {
  if (!objectiveName) return null;
  const rule = OBJECTIVE_ICON_RULES.find((entry) => entry.test.test(objectiveName));
  if (rule) {
    return { variant: "objective", Icon: rule.Icon, tone: rule.tone };
  }
  return { variant: "objective", label: "O" };
};

const resolveBadge = (event: CoachParsedEvent, position: CoachEventPosition): BadgeDescriptor | null => {
  if (event.category === "kill") {
    if (event.killer && actorMatches(position, event.killer)) {
      return { variant: "kill", label: "K" };
    }
    if (event.victim && actorMatches(position, event.victim)) {
      return { variant: "death", label: "D" };
    }
    if (event.assists.some((assist) => actorMatches(position, assist))) {
      return { variant: "assist", label: "A" };
    }
    return null;
  }

  if (event.objectiveActor && actorMatches(position, event.objectiveActor)) {
    return resolveObjectiveBadge(event.objectiveName) ?? { variant: "objective", label: "O" };
  }

  return null;
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
  focusSelection = false,
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
    
    // Determine badge for killer
    if (currentEvent.killer?.puuid) {
      const key = `${currentEvent.killer.puuid}-${currentEvent.id}`;
      map.set(key, {
        variant: "kill",
        label: "Kill",
        tone: "text-emerald-400",
      });
    }
    
    // Determine badge for victim
    if (currentEvent.victim?.puuid) {
      const key = `${currentEvent.victim.puuid}-${currentEvent.id}`;
      map.set(key, {
        variant: "death",
        label: "Death",
        tone: "text-red-400",
      });
    }
    
    // Determine badge for assists
    currentEvent.assists.forEach((assist) => {
      if (assist.puuid) {
        const key = `${assist.puuid}-${currentEvent.id}`;
        map.set(key, {
          variant: "assist",
          label: "Assist",
          tone: "text-blue-400",
        });
      }
    });
    
    // Determine badge for objectives
    if (currentEvent.objectiveActor?.puuid) {
      const key = `${currentEvent.objectiveActor.puuid}-${currentEvent.id}`;
      let Icon: ComponentType<{ className?: string }> | undefined;
      
      if (currentEvent.description.toLowerCase().includes("dragon")) {
        Icon = Flame;
      } else if (currentEvent.description.toLowerCase().includes("baron")) {
        Icon = Crown;
      } else if (currentEvent.description.toLowerCase().includes("herald")) {
        Icon = Mountain;
      } else if (currentEvent.description.toLowerCase().includes("tower") || currentEvent.description.toLowerCase().includes("turret")) {
        Icon = Castle;
      }
      
      map.set(key, {
        variant: "objective",
        Icon,
        tone: "text-purple-400",
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
          const badge = badgeFor.get(position.key);

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

                {badge ? (
                  <div
                    className={cn(
                      "absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shadow-lg shadow-slate-900/60",
                      badge.tone ?? BADGE_BASE[badge.variant],
                    )}
                  >
                    {badge.Icon ? (
                      <badge.Icon className="h-3 w-3" />
                    ) : (
                      <span>{badge.label}</span>
                    )}
                  </div>
                ) : null}
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
