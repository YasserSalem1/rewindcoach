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
  className,
  focusSelection = false,
}: RiftMapProps) {
  const participantLookup = useMemo(() => {
    const byPuuid = new Map<string, RiotParticipant>();
    const byChampion = new Map<string, RiotParticipant>();

    participants.forEach((participant) => {
      byPuuid.set(participant.puuid, participant);
      const key = `${toTeamColor(participant.teamId)}::${normalize(participant.championName)}`;
      byChampion.set(key, participant);
    });

    return { byPuuid, byChampion };
  }, [participants]);

  const positions = useMemo<ResolvedPosition[]>(() => {
    if (!currentEvent) return [];

    return currentEvent.positions.map((position, index) => {
      const teamColor = position.teamColor ?? toTeamColor(position.teamId);
      const fromPuuid = position.puuid ? participantLookup.byPuuid.get(position.puuid) : undefined;
      const fromChampion =
        participantLookup.byChampion.get(`${teamColor}::${normalize(position.championName)}`) ?? null;

      const participant = fromPuuid ?? fromChampion ?? undefined;

      const resolvedTeamId =
        participant?.teamId ?? position.teamId ?? (teamColor === "red" ? 200 : 100);
      const resolvedPuuid =
        participant?.puuid ??
        position.puuid ??
        `${resolvedTeamId}-${normalize(position.championName) || normalize(position.summonerName) || index}`;

      return {
        key: `${resolvedPuuid}-${index}`,
        puuid: resolvedPuuid,
        teamId: resolvedTeamId,
        teamColor,
        championName: participant?.championName ?? position.championName ?? "Unknown",
        championIcon: participant?.championIcon ?? position.championIcon,
        summonerName: participant?.summonerName ?? position.summonerName,
        coordinates: { x: position.x, y: position.y },
        meta: position,
      };
    });
  }, [currentEvent, participantLookup]);

  const badgeFor = useMemo(() => {
    if (!currentEvent) return new Map<string, BadgeDescriptor>();
    const map = new Map<string, BadgeDescriptor>();
    positions.forEach((position) => {
      const badge = resolveBadge(currentEvent, position.meta);
      if (badge) {
        map.set(position.key, badge);
      }
    });
    return map;
  }, [currentEvent, positions]);

  const hasPositions = Boolean(currentEvent && positions.length > 0);

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
          const dimmed =
            focusSelection && selectedPlayers.size > 0 && !isSelected;
          const badge = badgeFor.get(position.key);

          const ringClass =
            position.teamId === 100
              ? "ring-blue-400/80 border-blue-300/60"
              : "ring-red-400/80 border-red-300/60";

          return (
            <motion.div
              key={position.key}
              className="absolute -translate-x-1/2 translate-y-1/2"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: dimmed ? 0.35 : 1 }}
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

      {!currentEvent ? (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-slate-400">
          Select a timeline event to show player locations.
        </div>
      ) : null}

      {currentEvent && !hasPositions ? (
        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-slate-400">
          No positional snapshot captured for this event.
        </div>
      ) : null}
    </div>
  );
}
