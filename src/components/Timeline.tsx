"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";

import type { TimelineEvent, TimelineEventType } from "@/lib/riot";
import { formatDuration, cn } from "@/lib/ui";

interface TimelineProps {
  events: TimelineEvent[];
  duration: number;
  currentTime: number;
  onScrub: (time: number) => void;
}

const EVENT_META: Partial<
  Record<
    TimelineEventType,
    { label: string; symbol: string; color: string; accent: string }
  >
> = {
  KILL: {
    label: "Kill",
    symbol: "⚔️",
    color: "text-emerald-200",
    accent: "bg-emerald-500/30",
  },
  DEATH: {
    label: "Death",
    symbol: "💀",
    color: "text-rose-200",
    accent: "bg-rose-500/30",
  },
  ASSIST: {
    label: "Assist",
    symbol: "🤝",
    color: "text-sky-200",
    accent: "bg-sky-500/30",
  },
  TOWER: {
    label: "Tower",
    symbol: "🏰",
    color: "text-amber-200",
    accent: "bg-amber-500/30",
  },
  DRAGON: {
    label: "Dragon",
    symbol: "🐉",
    color: "text-orange-200",
    accent: "bg-orange-500/30",
  },
  BARON: {
    label: "Baron",
    symbol: "👑",
    color: "text-purple-200",
    accent: "bg-purple-500/30",
  },
  HERALD: {
    label: "Herald",
    symbol: "🌀",
    color: "text-indigo-200",
    accent: "bg-indigo-500/30",
  },
  OBJECTIVE: {
    label: "Objective",
    symbol: "🎯",
    color: "text-lime-200",
    accent: "bg-lime-500/30",
  },
  WARD_PLACED: {
    label: "Ward Placed",
    symbol: "👁️",
    color: "text-yellow-200",
    accent: "bg-yellow-500/25",
  },
  WARD_KILL: {
    label: "Ward Cleared",
    symbol: "🪓",
    color: "text-slate-200",
    accent: "bg-slate-500/30",
  },
};

const EVENT_META_DEFAULT = {
  label: "Moment",
  symbol: "●",
  color: "text-slate-200",
  accent: "bg-slate-700/40",
};

export function Timeline({
  events,
  duration,
  currentTime,
  onScrub,
}: TimelineProps) {
  const orderedEvents = useMemo(
    () => [...events].sort((a, b) => a.timestamp - b.timestamp),
    [events],
  );

  const displayEvents = useMemo(
    () => orderedEvents.length ? orderedEvents : [],
    [orderedEvents],
  );

  const activeEvent = useMemo(() => {
    if (!displayEvents.length) return null;
    const windowSeconds = 7;
    let closest = displayEvents[0];
    let closestDiff = Math.abs(closest.timestamp - currentTime);
    for (let i = 1; i < displayEvents.length; i++) {
      const event = displayEvents[i];
      const diff = Math.abs(event.timestamp - currentTime);
      if (diff < closestDiff) {
        closest = event;
        closestDiff = diff;
      }
    }
    return closestDiff <= windowSeconds ? closest : null;
  }, [displayEvents, currentTime]);

  const minuteMarkers = useMemo(() => {
    if (duration <= 0) return [];
    const totalMinutes = Math.ceil(duration / 60);
    return Array.from({ length: totalMinutes + 1 }, (_, index) => {
      const time = Math.min(index * 60, duration);
      return {
        minute: index,
        time,
        position: duration ? (time / duration) * 100 : 0,
      };
    });
  }, [duration]);

  const currentPercent = duration ? (currentTime / duration) * 100 : 0;
  const currentMinute = Math.floor(currentTime / 60);

  return (
    <div className="relative flex w-full flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/85 p-4 backdrop-blur-xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <span className="text-xs uppercase tracking-wide text-slate-300/70">
          Timeline
        </span>
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
        {/* Scrubbable progress bar */}
        <div className="relative h-7">
          <div className="absolute inset-x-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-slate-800/80" />
          <motion.div
            className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-violet-500"
            style={{ width: `${Math.min(currentPercent, 100)}%` }}
          />
          <motion.div
            className="absolute top-1/2 h-4 w-4 -translate-y-1/2 -translate-x-1/2 rounded-full border-2 border-white/70 bg-violet-400 shadow-lg"
            style={{ left: `${Math.min(Math.max(currentPercent, 0), 100)}%` }}
          />
          <input
            type="range"
            min={0}
            max={duration}
            value={currentTime}
            onChange={(event) => onScrub(Number(event.target.value))}
            className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
            aria-label="Scrub match timeline"
          />
        </div>

        {/* Minute markers */}
        <div className="relative h-4">
          {minuteMarkers.map((marker, index) => (
            <div
              key={`minute-${marker.minute}`}
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2"
              style={{ left: `${Math.min(marker.position, 100)}%` }}
            >
              <div
                className={cn(
                  "h-3 w-0.5 rounded-full",
                  index <= currentMinute
                    ? "bg-violet-400"
                    : "bg-slate-700/60",
                )}
              />
            </div>
          ))}
          <motion.div
            className="absolute inset-y-0 w-px bg-violet-400/70"
            style={{ left: `${Math.min(Math.max(currentPercent, 0), 100)}%` }}
          />
        </div>

        {/* Event icons */}
        <div className="relative h-14">
          {displayEvents.map((event) => {
            const meta = EVENT_META[event.type] ?? EVENT_META_DEFAULT;
            const position = duration
              ? (event.timestamp / duration) * 100
              : 0;
            const isPast = currentTime >= event.timestamp;
            const isActive = activeEvent?.id === event.id;

            return (
              <motion.button
                key={event.id}
                whileHover={{ scale: 1.12, y: -4 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onScrub(event.timestamp)}
                style={{ left: `${Math.min(Math.max(position, 0), 100)}%` }}
                className={cn(
                  "absolute -translate-x-1/2 rounded-full px-2 py-1 text-xl shadow-md transition-all",
                  meta.accent,
                  isActive
                    ? "ring-2 ring-violet-200/80 shadow-lg shadow-violet-500/40 scale-110"
                    : isPast
                      ? "ring-2 ring-violet-400/70"
                      : "ring-1 ring-white/10 hover:ring-violet-300/60",
                )}
                title={`${meta.label} • ${event.description} (${formatDuration(
                  Math.floor(event.timestamp),
                )})`}
              >
                <span className={cn("leading-none", meta.color)}>
                  {meta.symbol}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
