"use client";

import { useMemo } from "react";

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
}

type CategoryTone = {
  base: string;
  active: string;
  past: string;
};

const CATEGORY_TONES: Record<CoachEventCategory, CategoryTone> = {
  kill: {
    base: "bg-emerald-500/35 border-emerald-400/60",
    active: "bg-emerald-400 border-emerald-200 shadow-[0_0_14px_rgba(52,211,153,0.45)]",
    past: "bg-emerald-500/55 border-emerald-300/70",
  },
  objective: {
    base: "bg-orange-500/35 border-orange-400/55",
    active: "bg-orange-400 border-orange-200 shadow-[0_0_14px_rgba(253,186,116,0.45)]",
    past: "bg-orange-500/55 border-orange-300/70",
  },
  turret: {
    base: "bg-amber-500/30 border-amber-400/55",
    active: "bg-amber-400 border-amber-200 shadow-[0_0_14px_rgba(251,191,36,0.45)]",
    past: "bg-amber-500/55 border-amber-300/70",
  },
  inhibitor: {
    base: "bg-rose-500/30 border-rose-400/50",
    active: "bg-rose-400 border-rose-200 shadow-[0_0_14px_rgba(251,113,133,0.45)]",
    past: "bg-rose-500/55 border-rose-300/70",
  },
  nexus: {
    base: "bg-violet-500/35 border-violet-400/55",
    active: "bg-violet-400 border-violet-200 shadow-[0_0_14px_rgba(167,139,250,0.45)]",
    past: "bg-violet-500/55 border-violet-300/70",
  },
  unknown: {
    base: "bg-slate-500/25 border-slate-400/40",
    active: "bg-slate-300 border-slate-200 shadow-[0_0_14px_rgba(148,163,184,0.35)]",
    past: "bg-slate-500/45 border-slate-300/55",
  },
};

const clampPercent = (value: number) => Math.min(100, Math.max(0, value));

export function Timeline({
  events,
  duration,
  currentTime,
  currentEventIndex,
  onScrub,
  onSelectEvent,
}: TimelineProps) {
  const minuteMarkers = useMemo(() => {
    if (duration <= 0) return [];
    const totalMinutes = Math.ceil(duration / 60);
    return Array.from({ length: totalMinutes + 1 }, (_, minute) => {
      const time = Math.min(minute * 60, duration);
      const position = duration ? (time / duration) * 100 : 0;
      return { minute, time, position };
    });
  }, [duration]);

  const currentPercent = duration ? clampPercent((currentTime / duration) * 100) : 0;

  const groupSizes = useMemo(() => {
    const map = new Map<number, number>();
    events.forEach((event) => {
      const key = Math.round(event.timestampSeconds * 10);
      map.set(key, (map.get(key) ?? 0) + 1);
    });
    return map;
  }, [events]);

  const activeIndex = currentEventIndex ?? -1;
  const offsetsSeen = new Map<number, number>();

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
          <div
            className="absolute left-0 top-1/2 h-2 -translate-y-1/2 rounded-full bg-violet-500"
            style={{ width: `${currentPercent}%` }}
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

        <div className="relative h-16">
          {events.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-400">
              Coach timeline events will appear here once available.
            </div>
          ) : null}
          {events.map((event) => {
            const category = CATEGORY_TONES[event.category] ?? CATEGORY_TONES.unknown;
            const position = clampPercent(duration ? (event.timestampSeconds / duration) * 100 : 0);
            const isPast = currentTime >= event.timestampSeconds;
            const isActive = event.sourceIndex === activeIndex;

            const offsetKey = Math.round(event.timestampSeconds * 10);
            const offsetIndex = offsetsSeen.get(offsetKey) ?? 0;
            offsetsSeen.set(offsetKey, offsetIndex + 1);
            const groupSize = groupSizes.get(offsetKey) ?? 1;
            const offset = (offsetIndex - (groupSize - 1) / 2) * 12;

            return (
              <button
                key={event.id}
              onClick={() => onSelectEvent(event.sourceIndex)}
                className={cn(
                  "group absolute -translate-x-1/2 -translate-y-1/2 rounded-full border px-2 py-2 transition",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300/80",
                  isActive
                    ? category.active
                    : isPast
                      ? category.past
                      : category.base,
                )}
                style={{
                  left: `${position}%`,
                  top: `calc(50% + ${offset}px)`,
                }}
                title={`${formatDuration(Math.floor(event.timestampSeconds))} • ${event.description}`}
              >
                <span className="block h-2 w-2 rounded-full bg-white/90 group-hover:bg-white" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
