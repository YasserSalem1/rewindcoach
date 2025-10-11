"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Dot } from "lucide-react";

import type { TimelineEvent } from "@/lib/riot";
import { formatDuration, cn } from "@/lib/ui";

interface TimelineProps {
  events: TimelineEvent[];
  duration: number;
  currentTime: number;
  onScrub: (time: number) => void;
}

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

  return (
    <div className="relative flex w-full flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/80 p-6 backdrop-blur-xl">
      <div className="flex items-center justify-between text-xs uppercase tracking-wide text-slate-300/70">
        <span>Timeline</span>
        <span>{formatDuration(duration)}</span>
      </div>
      <input
        type="range"
        min={0}
        max={duration}
        value={currentTime}
        onChange={(event) => onScrub(Number(event.target.value))}
        className="h-2 w-full accent-violet-500"
      />
      <div className="flex flex-wrap gap-2">
        {orderedEvents.map((event) => {
          const isActive = currentTime >= event.timestamp;
          return (
            <motion.button
              key={event.id}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onScrub(event.timestamp)}
              className={cn(
                "group flex items-center gap-2 rounded-2xl border px-3 py-1.5 text-xs font-medium transition",
                isActive
                  ? "border-violet-400/60 bg-violet-500/15 text-violet-100"
                  : "border-white/10 bg-white/5 text-slate-200/70 hover:border-violet-400/40 hover:bg-violet-500/5",
              )}
            >
              <Dot className="h-4 w-4" />
              <span className="capitalize">{event.type.toLowerCase()}</span>
              <span className="text-slate-300/70">
                {formatDuration(Math.floor(event.timestamp))}
              </span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
