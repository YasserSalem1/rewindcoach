"use client";

import { useMemo } from "react";
import { Sword, Skull, Castle, Flame, Crown, Mountain, Eye, EyeOff, Users, UserPlus } from "lucide-react";

import type { CoachParsedEvent, CoachEventCategory } from "@/lib/parseReviewOutput";
import { formatDuration, cn } from "@/lib/ui";

type TimelineEventItem = CoachParsedEvent & { sourceIndex: number };

interface TimelineProps {
  events: TimelineEventItem[];
  duration: number;
  currentTime: number;
  currentEventIndex: number | null;
  onScrub: (time: number) => void;
  onSelectEvent: (sourceIndex: number) => void;
  selectedPuuid?: string | null;
}

type TimelineEventType = "KILL" | "DEATH" | "ASSIST" | "TOWER" | "DRAGON" | "BARON" | "HERALD" | "WARD_PLACED" | "WARD_KILL" | "OBJECTIVE";

const CATEGORY_TONES: Record<CoachEventCategory, { base: string; past: string; active: string }> = {
  kill: {
    base: "border-green-500/40 bg-green-500/10 hover:bg-green-500/20",
    past: "border-green-500/60 bg-green-500/20 hover:bg-green-500/30",
    active: "border-green-400 bg-green-500/40 shadow-lg shadow-green-500/50",
  },
  objective: {
    base: "border-purple-500/40 bg-purple-500/10 hover:bg-purple-500/20",
    past: "border-purple-500/60 bg-purple-500/20 hover:bg-purple-500/30",
    active: "border-purple-400 bg-purple-500/40 shadow-lg shadow-purple-500/50",
  },
  turret: {
    base: "border-amber-500/40 bg-amber-500/10 hover:bg-amber-500/20",
    past: "border-amber-500/60 bg-amber-500/20 hover:bg-amber-500/30",
    active: "border-amber-400 bg-amber-500/40 shadow-lg shadow-amber-500/50",
  },
  inhibitor: {
    base: "border-orange-500/40 bg-orange-500/10 hover:bg-orange-500/20",
    past: "border-orange-500/60 bg-orange-500/20 hover:bg-orange-500/30",
    active: "border-orange-400 bg-orange-500/40 shadow-lg shadow-orange-500/50",
  },
  nexus: {
    base: "border-red-500/40 bg-red-500/10 hover:bg-red-500/20",
    past: "border-red-500/60 bg-red-500/20 hover:bg-red-500/30",
    active: "border-red-400 bg-red-500/40 shadow-lg shadow-red-500/50",
  },
  unknown: {
    base: "border-slate-600/40 bg-slate-600/10 hover:bg-slate-600/20",
    past: "border-slate-600/60 bg-slate-600/20 hover:bg-slate-600/30",
    active: "border-slate-500 bg-slate-600/40 shadow-lg shadow-slate-600/50",
  },
};

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, value));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getEventIcon(type: TimelineEventType) {
  switch (type) {
    case "KILL":
      return Sword;
    case "DEATH":
      return Skull;
    case "ASSIST":
      return Users;
    case "TOWER":
      return Castle;
    case "DRAGON":
      return Flame;
    case "BARON":
      return Crown;
    case "HERALD":
      return Mountain;
    case "WARD_PLACED":
      return Eye;
    case "WARD_KILL":
      return EyeOff;
    default:
      return Flame; // Default for OBJECTIVE and others
  }
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function getEventColor(type: TimelineEventType) {
  switch (type) {
    case "KILL":
      return "text-green-400";
    case "DEATH":
      return "text-red-400";
    case "ASSIST":
      return "text-blue-400";
    case "TOWER":
      return "text-amber-400";
    case "DRAGON":
      return "text-orange-400";
    case "BARON":
      return "text-purple-400";
    case "HERALD":
      return "text-cyan-400";
    case "WARD_PLACED":
      return "text-yellow-400";
    case "WARD_KILL":
      return "text-slate-400";
    default:
      return "text-slate-300";
  }
}

export function Timeline({
  events,
  duration,
  currentTime,
  currentEventIndex,
  onScrub,
  onSelectEvent,
  selectedPuuid,
}: TimelineProps) {
  const currentPercent = duration ? clampPercent((currentTime / duration) * 100) : 0;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const groupSizes = useMemo(() => {
    const map = new Map<number, number>();
    events.forEach((event) => {
      // Group events within 20-second windows for vertical stacking
      const key = Math.floor(event.timestampSeconds / 20);
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return map;
  }, [events]);

  const activeIndex = currentEventIndex ?? -1;
  const offsetsSeen = new Map<number, number>();

  return (
    <div className="relative flex w-full flex-col gap-3 rounded-2xl border border-white/10 bg-slate-950/85 p-4 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs uppercase tracking-wide text-slate-300/70">Timeline</span>
        <div className="flex items-center gap-2 text-xs text-slate-300">
          <div className="rounded-lg border border-violet-400/40 bg-violet-500/15 px-2.5 py-1">
            <span className="mr-1.5 text-[10px] text-slate-300/70">Current</span>
            <span className="font-mono text-sm font-semibold text-violet-200">
              {formatDuration(Math.floor(currentTime))}
            </span>
          </div>
          <span className="text-[11px] text-slate-500">/ {formatDuration(duration)}</span>
        </div>
      </div>

      <div className="relative space-y-3">
        <div className="relative h-8">
          <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-slate-800/90" />
          <div
            className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-violet-500"
            style={{ width: `${currentPercent}%` }}
          />
          <input
            type="range"
            min={0}
            max={Math.max(duration, 1)}
            value={Math.min(currentTime, duration)}
            onChange={(event) => onScrub(Number(event.target.value))}
            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
            aria-label="Scrub match timeline"
          />
        </div>

        <div className="relative h-14">
          {events.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-[11px] text-slate-400">
              Coach timeline events will appear here once available.
            </div>
          ) : null}
          {events.map((event) => {
            const category = CATEGORY_TONES[event.category] ?? CATEGORY_TONES.unknown;
            const position = clampPercent(duration ? (event.timestampSeconds / duration) * 100 : 0);
            const isPast = currentTime >= event.timestampSeconds;
            const isActive = event.sourceIndex === activeIndex;

            // Group events within 20-second windows and stack them vertically
            const offsetKey = Math.floor(event.timestampSeconds / 20);
            const offsetIndex = offsetsSeen.get(offsetKey) ?? 0;
            offsetsSeen.set(offsetKey, offsetIndex + 1);
            // Stack events downward (below the timeline), not centered
            const offset = offsetIndex * 18;

            // Determine icon based on selected player's involvement
            let EventIcon = null;
            if (selectedPuuid) {
              // Check if selected player is the killer
              if (event.killer?.puuid === selectedPuuid) {
                EventIcon = Sword;
              }
              // Check if selected player is the victim
              else if (event.victim?.puuid === selectedPuuid) {
                EventIcon = Skull;
              }
              // Check if selected player assisted
              else if (event.assists.some(a => a.puuid === selectedPuuid)) {
                EventIcon = UserPlus;
              }
              // Check if selected player did objective
              else if (event.objectiveActor?.puuid === selectedPuuid) {
                const desc = event.description.toLowerCase();
                if (desc.includes('dragon')) EventIcon = Flame;
                else if (desc.includes('baron')) EventIcon = Crown;
                else if (desc.includes('herald')) EventIcon = Mountain;
                else if (desc.includes('turret') || desc.includes('tower')) EventIcon = Castle;
              }
            }
            
            // For objectives without selected player involvement, still show icon
            if (!EventIcon && event.category === 'objective') {
              const desc = event.description.toLowerCase();
              if (desc.includes('dragon')) EventIcon = Flame;
              else if (desc.includes('baron')) EventIcon = Crown;
              else if (desc.includes('herald')) EventIcon = Mountain;
              else if (desc.includes('turret') || desc.includes('tower')) EventIcon = Castle;
            }

            return (
              <button
                key={event.id}
                onClick={() => onSelectEvent(event.sourceIndex)}
                className={cn(
                  "group absolute -translate-x-1/2 -translate-y-1/2 rounded-full border transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/80",
                  EventIcon ? "p-1" : "px-1.5 py-1.5",
                  isActive
                    ? category.active
                    : isPast
                      ? category.past
                      : category.base,
                )}
                style={{
                  left: `${position}%`,
                  top: `calc(6px + ${offset}px)`,
                }}
                title={`${formatDuration(Math.floor(event.timestampSeconds))} • ${event.description}`}
              >
                {EventIcon ? (
                  <EventIcon className="h-3 w-3" />
                ) : (
                  <span className="block h-1.5 w-1.5 rounded-full bg-white/90 group-hover:bg-white" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
