"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sword, Skull, Castle, Flame, Crown, Mountain, Eye, EyeOff, Users } from "lucide-react";

import type { CoachParsedEvent, CoachEventCategory } from "@/lib/parseReviewOutput";
import { formatDuration, cn } from "@/lib/ui";

type TimelineEventItem = CoachParsedEvent & { sourceIndex: number };

interface TimelineProps {
  events: TimelineEventItem[];
  duration: number;
  currentTime: number;
  currentEventIndex: number | null;
  onScrub: (time: number) => void;
}

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
