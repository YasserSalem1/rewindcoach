"use client";

import type { ComponentType } from "react";
import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sword, Skull, UserPlus, Castle, Flame, Crown, Mountain, Target, Circle } from "lucide-react";

import type { TimelineEvent, TimelineEventType } from "@/lib/riot";
import { formatDuration, cn } from "@/lib/ui";

interface TimelineProps {
  events: TimelineEvent[];
  duration: number;
  currentTime: number;
  onScrub: (time: number) => void;
}

type TimelineIconMeta = {
  label: string;
  Icon: ComponentType<{ className?: string }>;
  chip: string;
  icon: string;
};

const EVENT_META: Record<TimelineEventType, TimelineIconMeta> = {
  KILL: {
    label: "Kill",
    Icon: Sword,
    chip: "bg-emerald-500/20",
    icon: "text-emerald-300",
  },
  ASSIST: {
    label: "Assist",
    Icon: UserPlus,
    chip: "bg-sky-500/20",
    icon: "text-sky-300",
  },
  DEATH: {
    label: "Death",
    Icon: Skull,
    chip: "bg-rose-500/20",
    icon: "text-rose-300",
  },
  TOWER: {
    label: "Tower",
    Icon: Castle,
    chip: "bg-amber-500/20",
    icon: "text-amber-300",
  },
  DRAGON: {
    label: "Dragon",
    Icon: Flame,
    chip: "bg-orange-500/20",
    icon: "text-orange-300",
  },
  BARON: {
    label: "Baron",
    Icon: Crown,
    chip: "bg-purple-500/20",
    icon: "text-purple-300",
  },
  HERALD: {
    label: "Herald",
    Icon: Mountain,
    chip: "bg-indigo-500/20",
    icon: "text-indigo-300",
  },
  OBJECTIVE: {
    label: "Objective",
    Icon: Target,
    chip: "bg-lime-500/20",
    icon: "text-lime-300",
  },
  MOVE: {
    label: "Moment",
    Icon: Circle,
    chip: "bg-slate-500/20",
    icon: "text-slate-300",
  },
};

export function Timeline({
  events,
  duration,
  currentTime,
  onScrub,
}: TimelineProps) {
  const orderedEvents = useMemo(
    () =>
      [...events]
        .filter((event) => EVENT_META[event.type])
        .sort((a, b) => a.timestamp - b.timestamp),
    [events],
  );

  const minuteMarkers = useMemo(() => {
    if (duration <= 0) return [] as Array<{ minute: number; time: number; position: number }>;
    const totalMinutes = Math.ceil(duration / 60);
    return Array.from({ length: totalMinutes + 1 }, (_, minute) => {
      const time = Math.min(minute * 60, duration);
      const position = duration ? (time / duration) * 100 : 0;
      return { minute, time, position };
    });
  }, [duration]);

  const currentPercent = duration ? Math.min(Math.max((currentTime / duration) * 100, 0), 100) : 0;

  const activeEvent = useMemo(() => {
    if (!orderedEvents.length) return null;
    let closest = orderedEvents[0];
    let diff = Math.abs(closest.timestamp - currentTime);
    for (let i = 1; i < orderedEvents.length; i += 1) {
      const candidate = orderedEvents[i];
      const candidateDiff = Math.abs(candidate.timestamp - currentTime);
      if (candidateDiff < diff) {
        closest = candidate;
        diff = candidateDiff;
      }
    }
    return closest;
  }, [currentTime, orderedEvents]);

  const activeEventIds = useMemo(() => {
    if (!activeEvent) return new Set<string>();
    const tolerance = 1;
    return new Set(
      orderedEvents
        .filter((event) => Math.abs(event.timestamp - activeEvent.timestamp) <= tolerance)
        .map((event) => event.id),
    );
  }, [activeEvent, orderedEvents]);

  const stackedPositions = useMemo(() => {
    const buckets = new Map<number, TimelineEvent[]>();
    const bucketSize = Math.max(duration, 1);
    orderedEvents.forEach((event) => {
      const key = Math.round((event.timestamp / bucketSize) * 1000);
      const list = buckets.get(key) ?? [];
      list.push(event);
      buckets.set(key, list);
    });
    const indexes = new Map<string, number>();
    const sizes = new Map<string, number>();
    buckets.forEach((events) => {
      events.forEach((event, index) => {
        indexes.set(event.id, index);
        sizes.set(event.id, events.length);
      });
    });
    return { indexes, sizes };
  }, [orderedEvents, duration]);

  const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

  return (
    <div className="relative flex w-full flex-col gap-6 rounded-3xl border border-white/10 bg-slate-950/85 p-6 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <span className="text-xs uppercase tracking-wide text-slate-300/70">Timeline</span>
        <div className="flex items-center gap-3 text-xs text-slate-300">
          <div className="rounded-lg border border-violet-400/40 bg-violet-500/15 px-3 py-1.5">
            <span className="mr-2 text-[11px] text-slate-300/70">Current</span>
            <span className="font-mono text-base font-semibold text-violet-200">
              {formatDuration(Math.floor(currentTime))}
            </span>
          </div>
          <span className="text-slate-500">/ {formatDuration(duration)}</span>
        </div>
      </div>

      <div className="relative space-y-5">
        <div className="relative h-10">
          <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-slate-800/90" />
          <motion.div
            className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-violet-500"
            style={{ width: `${clampPercent(currentPercent)}%` }}
          />
          {minuteMarkers.map((marker) => (
            <div
              key={`minute-${marker.minute}`}
              className="absolute top-0 flex -translate-x-1/2 items-center"
              style={{ left: `${clampPercent(marker.position)}%` }}
            >
              <div
                className={cn(
                  "h-4 w-px rounded-full",
                  marker.time <= currentTime ? "bg-violet-400" : "bg-slate-700/80",
                )}
              />
            </div>
          ))}
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

        <div className="relative h-20">
          {orderedEvents.map((event) => {
            const meta = EVENT_META[event.type] ?? EVENT_META.OBJECTIVE;
            const position = clampPercent(duration ? (event.timestamp / duration) * 100 : 0);
            const isPast = currentTime >= event.timestamp;
            const isActive = activeEventIds.has(event.id);
            const Icon = meta.Icon;
            const stackSize = stackedPositions.sizes.get(event.id) ?? 1;
            const stackIndex = stackedPositions.indexes.get(event.id) ?? 0;
            const offset = (stackIndex - (stackSize - 1) / 2) * 26;

            return (
              <motion.button
                key={event.id}
                whileHover={{ scale: 1.1, y: -4 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onScrub(event.timestamp)}
                style={{ left: `${position}%`, top: `calc(50% + ${offset}px)` }}
                className={cn(
                  "absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-2 py-1 shadow-sm transition-all",
                  meta.chip,
                  isActive
                    ? "ring-2 ring-violet-200/80 shadow-lg shadow-violet-500/35"
                    : isPast
                      ? "ring-2 ring-violet-400/60"
                      : "ring-1 ring-white/10 hover:ring-violet-300/50",
                )}
                title={`${meta.label} • ${event.description} (${formatDuration(Math.floor(event.timestamp))})`}
              >
                <Icon className={cn("h-4 w-4", meta.icon)} />
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
