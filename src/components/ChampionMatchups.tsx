"use client";

import type { ComponentType } from "react";
import { useMemo } from "react";
import Image from "next/image";
import { Castle, Flame, Crown, Mountain, ChevronLeft, ChevronRight } from "lucide-react";

import type { RiotParticipant } from "@/lib/riot";
import { cn } from "@/lib/ui";
import { Button } from "@/components/ui/button";

const TRINKET_IDS = new Set([
  3340, // Stealth Ward (Warding Totem)
  3363, // Farsight Alteration
  3364, // Oracle Lens
  3330, // Scarecrow Effigy
  3361, // Greater Stealth Totem
  3362, // Greater Vision Totem
  3365, // Greater Orb of True Sight
]);

interface MomentStats {
  kills: number;
  deaths: number;
  assists: number;
  cs: number;
  level: number;
  items: number[];
}

interface ChampionMatchupsProps {
  participants: RiotParticipant[];
  currentMinuteStats: Record<string, MomentStats>;
  currentMinute: number;
  totalMinutes: number;
  selectedPuuid: string | null;
  primaryPuuid: string;
  objectives: {
    blue: {
      towers: number;
      dragons: number;
      heralds: number;
      barons: number;
    };
    red: {
      towers: number;
      dragons: number;
      heralds: number;
      barons: number;
    };
  };
  resolveItemIcon: (itemId: number) => string | null;
  onChampionClick: (puuid: string) => void;
  onClearSelection: () => void;
  onMinuteChange?: (minute: number) => void;
  coachRoles?: Map<string, string>;
}

interface ParticipantWithLane extends RiotParticipant {
  laneLabel: string;
}

const LANE_ORDER: Array<{ key: string; label: string }> = [
  { key: "TOP", label: "TOP" },
  { key: "JUNGLE", label: "JGL" },
  { key: "MIDDLE", label: "MID" },
  { key: "BOTTOM", label: "BOT" },
  { key: "UTILITY", label: "SUP" },
];

const laneFallbacks: Record<string, string> = {
  MID: "MIDDLE",
  MIDL: "MIDDLE",
  SUPPORT: "UTILITY",
  DUO_SUPPORT: "UTILITY",
  DUO_CARRY: "BOTTOM",
  CARRY: "BOTTOM",
  BOT: "BOTTOM",
  BOTTOM: "BOTTOM",
};

function detectLane(participant: RiotParticipant, coachRole?: string): string {
  // Prioritize coach_match role data (most accurate)
  if (coachRole) {
    const normalized = laneFallbacks[coachRole] || coachRole;
    if (LANE_ORDER.some((lane) => lane.key === normalized)) {
      return normalized;
    }
  }

  // Fallback to Riot API data
  const roleRaw = (participant.role ?? "").toUpperCase().trim();
  const laneRaw = (participant.lane ?? "").toUpperCase().trim();

  const roleDetected = laneFallbacks[roleRaw] || (LANE_ORDER.some(l => l.key === roleRaw) ? roleRaw : null);
  const laneDetected = laneFallbacks[laneRaw] || (LANE_ORDER.some(l => l.key === laneRaw) ? laneRaw : null);

  if (roleDetected) return roleDetected;
  if (laneDetected) return laneDetected;

  // Fallback to participantId (1-5 Blue, 6-10 Red map to TOP,JG,MID,BOT,SUP)
  const participantId = participant.participantId;
  const isBlue = participant.teamId === 100;
  const teamOffset = isBlue ? 0 : 5;
  const laneIndex = (participantId - 1 - teamOffset) % 5;
  const laneByParticipantId = LANE_ORDER[laneIndex]?.key;
  
  if (laneByParticipantId && participantId >= 1 && participantId <= 10) {
    return laneByParticipantId;
  }

  return "UNKNOWN";
}

function createLaneRows(participants: RiotParticipant[], coachRoles?: Map<string, string>) {
  const withLane: ParticipantWithLane[] = participants.map((participant) => ({
    ...participant,
    laneLabel: detectLane(participant, coachRoles?.get(participant.puuid)),
  }));

  const blue: Record<string, ParticipantWithLane | undefined> = {};
  const red: Record<string, ParticipantWithLane | undefined> = {};

  const blueLeftovers: ParticipantWithLane[] = [];
  const redLeftovers: ParticipantWithLane[] = [];

  withLane.forEach((participant) => {
    const bucket = participant.teamId === 100 ? blue : red;
    const leftovers = participant.teamId === 100 ? blueLeftovers : redLeftovers;

    const lane = participant.laneLabel;
    if (LANE_ORDER.some((entry) => entry.key === lane)) {
      if (!bucket[lane]) {
        bucket[lane] = participant;
      } else {
        leftovers.push(participant);
      }
    } else {
      leftovers.push(participant);
    }
  });

  const rows = LANE_ORDER.map(({ key, label }) => ({
    laneKey: key,
    laneLabel: label,
    blue: blue[key] ?? blueLeftovers.shift() ?? null,
    red: red[key] ?? redLeftovers.shift() ?? null,
  }));

  while (blueLeftovers.length || redLeftovers.length) {
    rows.push({
      laneKey: "FLEX",
      laneLabel: "FLEX",
      blue: blueLeftovers.shift() ?? null,
      red: redLeftovers.shift() ?? null,
    });
  }

  return rows;
}

interface ChampionSlotProps {
  participant: ParticipantWithLane | null;
  side: "blue" | "red";
  stats: MomentStats;
  isSelected: boolean;
  isPrimary: boolean;
  onClick: () => void;
  resolveItemIcon: (itemId: number) => string | null;
}

function ChampionSlot({
  participant,
  side,
  stats,
  isSelected,
  isPrimary,
  onClick,
  resolveItemIcon,
}: ChampionSlotProps) {
  const hasParticipant = Boolean(participant);
  const borderClass =
    side === "blue"
      ? "border-blue-500/40 hover:border-blue-300/70"
      : "border-red-500/40 hover:border-red-300/70";
  const selectedClass =
    side === "blue"
      ? "ring-2 ring-blue-300/90 shadow-[0_14px_30px_rgba(59,130,246,0.28)]"
      : "ring-2 ring-red-300/90 shadow-[0_14px_30px_rgba(248,113,113,0.28)]";
  const backgroundClass =
    side === "blue"
      ? "from-blue-950/60 via-slate-950/65 to-blue-900/40"
      : "from-red-950/60 via-slate-950/65 to-rose-900/40";
  const spells = participant?.spells ?? [];
  const runePrimary = participant?.runes?.primary;
  const runeSecondary = participant?.runes?.secondary;
  const rawItems = stats.items ?? [];
  const paddedItems =
    rawItems.length >= 7
      ? rawItems.slice(0, 7)
      : [...rawItems, ...Array(Math.max(0, 7 - rawItems.length)).fill(0)];

  const inventorySlots: Array<number | null> = [];
  let trinketId: number | null = null;

  paddedItems.forEach((itemId) => {
    if (typeof itemId !== "number" || itemId <= 0) return;
    
    // Handle trinkets (Stealth Ward, Oracle Lens, Farsight Alteration)
    if (TRINKET_IDS.has(itemId)) {
      if (!trinketId) trinketId = itemId;
      return;
    }
    
    // Add to inventory if not duplicate and under 6 items
    if (!inventorySlots.includes(itemId) && inventorySlots.length < 6) {
      inventorySlots.push(itemId);
    }
  });

  while (inventorySlots.length < 6) {
    inventorySlots.push(null);
  }

  // If no trinket found in timeline data, show default Stealth Ward (3340) for early game
  if (!trinketId && stats.level <= 9) {
    trinketId = 3340; // Default starting trinket
  }

  const itemSlots: Array<number | null> = [...inventorySlots, trinketId];

  return (
    <button
      type="button"
      onClick={hasParticipant ? onClick : undefined}
      disabled={!hasParticipant}
      className={cn(
        "group relative flex w-full items-center gap-4 rounded-2xl border bg-gradient-to-br px-4 py-4 text-left transition",
        borderClass,
        backgroundClass,
        hasParticipant
          ? "hover:bg-slate-900/80"
          : "opacity-50 cursor-not-allowed text-slate-600",
        isSelected && selectedClass,
      )}
      aria-pressed={isSelected}
    >
      <div className="grid grid-cols-2 gap-1 text-slate-200">
        {[spells[0] ?? null, spells[1] ?? null, runePrimary ?? null, runeSecondary ?? null].map(
          (icon, index) => (
            <div
              key={`spell-rune-${index}`}
              className={cn(
                "relative h-8 w-8 overflow-hidden rounded-md border bg-slate-900/80",
                index >= 2 && "rounded-full border-white/30"
              )}
            >
              {icon ? (
                <Image src={icon} alt="" fill className="object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                  —
                </div>
              )}
            </div>
          ),
        )}
      </div>

      <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-slate-900/70 shadow-lg shadow-slate-900/40">
        {hasParticipant ? (
          <Image
            src={participant!.championIcon}
            alt={participant!.championName}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-lg text-slate-500">
            ?
          </div>
        )}
        {isPrimary && hasParticipant && (
          <div className="absolute -left-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-slate-900 bg-yellow-300 text-[10px] font-bold text-slate-900 shadow">
            ★
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-0 flex items-center gap-2">
            <p className="truncate text-base font-semibold text-slate-100">
              {participant?.championName ?? "Unknown"}
            </p>
            <span className="rounded-full border border-white/15 bg-slate-900/60 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-slate-200">
              Lvl {stats.level}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-base font-semibold text-slate-100">
              {stats.kills}/{stats.deaths}/{stats.assists}
            </span>
            <span className="rounded-full border border-slate-500/40 bg-slate-900/70 px-3 py-1 text-xs font-semibold text-slate-200 shadow">
              CS {stats.cs}
            </span>
          </div>
        </div>

        <p className="text-xs uppercase tracking-[0.26em] text-slate-400">
          {participant?.summonerName ?? "—"}
        </p>

        <div className="flex flex-wrap items-center gap-1">
          {itemSlots.map((itemId, index) => {
            const icon = itemId ? resolveItemIcon(itemId) : null;
            return (
              <div
                key={`item-slot-${index}-${itemId ?? "empty"}`}
                className={cn(
                  "relative h-9 w-9 overflow-hidden rounded-md border border-white/15 bg-slate-900/65 shadow-inner",
                  index === itemSlots.length - 1 && "ring-1 ring-yellow-400/40",
                  !icon && "border-dashed border-white/10 bg-slate-900/30"
                )}
              >
                {icon ? (
                  <Image src={icon} alt="" fill className="object-cover" sizes="36px" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-600">
                    •
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </button>
  );
}

export function ChampionMatchups({
  participants,
  currentMinuteStats,
  currentMinute,
  totalMinutes,
  selectedPuuid,
  primaryPuuid,
  objectives,
  resolveItemIcon,
  onChampionClick,
  onClearSelection,
  onMinuteChange,
  coachRoles,
}: ChampionMatchupsProps) {
  const rows = useMemo(
    () => createLaneRows(participants, coachRoles),
    [participants, coachRoles],
  );

  const displayedMinute =
    currentMinute >= totalMinutes
      ? Math.max(0, totalMinutes - 1)
      : Math.max(0, currentMinute);

  const timeLabel = `${String(displayedMinute).padStart(2, "0")}:00`;

  const handlePreviousMinute = () => {
    if (onMinuteChange && displayedMinute > 0) {
      onMinuteChange(displayedMinute - 1);
    }
  };

  const handleNextMinute = () => {
    if (onMinuteChange && displayedMinute < totalMinutes - 1) {
      onMinuteChange(displayedMinute + 1);
    }
  };

  return (
    <div className="rounded-3xl border border-white/10 bg-slate-950/70 p-5 shadow-lg shadow-slate-950/40">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-300/80">
          Champion Matchups
        </h3>
        {/* Hidden but kept in code */}
        <Button
          type="button"
          size="sm"
          variant={selectedPuuid ? "secondary" : "ghost"}
          onClick={onClearSelection}
          className="hidden text-xs"
        >
          {selectedPuuid ? "Show Everyone" : "All Players Selected"}
        </Button>
      </div>

      {/* Centered Time Navigation */}
      <div className="mb-5 flex items-center justify-center gap-4">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handlePreviousMinute}
          disabled={displayedMinute === 0}
          className="h-9 w-9 p-0 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Previous minute"
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">
            Live KDA
          </p>
          <p className="text-2xl font-bold text-slate-100 tracking-tight">
            {timeLabel}
          </p>
        </div>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={handleNextMinute}
          disabled={displayedMinute >= totalMinutes - 1}
          className="h-9 w-9 p-0 hover:bg-slate-800 disabled:opacity-30 disabled:cursor-not-allowed"
          aria-label="Next minute"
        >
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="mb-5 grid grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)] gap-3">
        <TeamObjectiveSummary side="blue" data={objectives.blue} />
        <div aria-hidden className="hidden md:block" />
        <TeamObjectiveSummary side="red" data={objectives.red} />
      </div>

      <div className="grid grid-cols-[minmax(0,1fr)_4rem_minmax(0,1fr)] gap-3">
        {rows.map(({ laneKey, laneLabel, blue, red }) => {
          const blueStats = currentMinuteStats[blue?.puuid ?? ""] ?? {
            kills: 0,
            deaths: 0,
            assists: 0,
            cs: 0,
            level: blue?.level ?? 1,
            items: [],
          };
          const redStats = currentMinuteStats[red?.puuid ?? ""] ?? {
            kills: 0,
            deaths: 0,
            assists: 0,
            cs: 0,
            level: red?.level ?? 1,
            items: [],
          };

          return (
            <div
              key={`${laneKey}-${blue?.puuid ?? "empty"}-${red?.puuid ?? "empty"}`}
              className="contents"
            >
              <ChampionSlot
                participant={blue}
                side="blue"
                stats={blueStats}
                isSelected={Boolean(blue && selectedPuuid === blue.puuid)}
                isPrimary={Boolean(blue && blue.puuid === primaryPuuid)}
                resolveItemIcon={resolveItemIcon}
                onClick={() => blue && onChampionClick(blue.puuid)}
              />

              <div className="flex h-full items-center justify-center rounded-2xl border border-white/5 bg-slate-950/60 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">
                {laneLabel}
              </div>

              <ChampionSlot
                participant={red}
                side="red"
                stats={redStats}
                isSelected={Boolean(red && selectedPuuid === red.puuid)}
                isPrimary={Boolean(red && red.puuid === primaryPuuid)}
                resolveItemIcon={resolveItemIcon}
                onClick={() => red && onChampionClick(red.puuid)}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}
type TeamKey = "blue" | "red";

interface TeamObjectiveSummaryProps {
  side: TeamKey;
  data: {
    towers: number;
    dragons: number;
    heralds: number;
    barons: number;
  };
}

const OBJECTIVE_ICONS: Array<{
  key: keyof TeamObjectiveSummaryProps["data"];
  label: string;
  Icon: ComponentType<{ className?: string }>;
}> = [
  { key: "towers", label: "Towers", Icon: Castle },
  { key: "dragons", label: "Dragons", Icon: Flame },
  { key: "heralds", label: "Heralds", Icon: Mountain },
  { key: "barons", label: "Barons", Icon: Crown },
];

function TeamObjectiveSummary({ side, data }: TeamObjectiveSummaryProps) {
  const isBlue = side === "blue";
  const sideLabel = isBlue ? "Blue Team" : "Red Team";
  const accent = isBlue ? "text-blue-200" : "text-red-200";
  const border =
    side === "blue"
      ? "border-blue-500/35 bg-gradient-to-r from-blue-950/60 via-blue-900/40 to-slate-950/40"
      : "border-red-500/35 bg-gradient-to-r from-rose-950/55 via-rose-900/35 to-slate-950/40";

  return (
    <div
      className={cn(
        "flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-sm text-slate-200 shadow-inner",
        border,
      )}
    >
      <span className={cn("font-semibold uppercase tracking-wide", accent)}>
        {sideLabel}
      </span>
      <div className="flex items-center gap-3">
        {OBJECTIVE_ICONS.map(({ key, label, Icon }) => (
          <div
            key={`${side}-${key}`}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-950/50 px-3 py-1.5"
          >
            <Icon className="h-4 w-4 text-slate-300" />
            <div className="text-right leading-tight">
              <p className="text-xs text-slate-400">{label}</p>
              <p className="font-semibold text-slate-100">{data[key]}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
