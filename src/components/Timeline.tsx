"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Sword, Skull, Castle, Flame, Crown, Mountain, Eye, EyeOff } from "lucide-react";

import type { TimelineEvent, TimelineEventType } from "@/lib/riot";
import { formatDuration, cn } from "@/lib/ui";

interface TimelineProps {
  events: TimelineEvent[];
  duration: number;
  currentTime: number;
  onScrub: (time: number) => void;
}

function getEventIcon(type: TimelineEventType) {
  switch (type) {
    case "KILL":
      return Sword;
    case "DEATH":
      return Skull;
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
  onScrub,
}: TimelineProps) {
  const orderedEvents = useMemo(
    () => [...events].sort((a, b) => a.timestamp - b.timestamp),
    [events],
  );

  return (
    <div className="relative flex w-full flex-col gap-4 rounded-3xl border border-white/10 bg-slate-950/80 p-6 backdrop-blur-xl">
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-wide text-slate-300/70">Timeline</span>
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-violet-500/20 px-4 py-2 border border-violet-400/40">
            <span className="text-xs text-slate-400 mr-2">Current:</span>
            <span className="font-mono text-lg font-semibold text-violet-200">
              {formatDuration(Math.floor(currentTime))}
            </span>
          </div>
          <span className="text-xs text-slate-400">
            / {formatDuration(duration)}
          </span>
        </div>
      </div>
      
      {/* Timeline bar with events */}
      <div className="relative">
        <input
          type="range"
          min={0}
          max={duration}
          value={currentTime}
          onChange={(event) => onScrub(Number(event.target.value))}
          className="h-2 w-full accent-violet-500"
        />
        
        {/* Event icons positioned along the timeline */}
        <div className="relative mt-3 h-8">
          {orderedEvents.map((event) => {
            const Icon = getEventIcon(event.type);
            const position = (event.timestamp / duration) * 100;
            const isActive = currentTime >= event.timestamp;
            const colorClass = getEventColor(event.type);
            
            return (
              <motion.button
                key={event.id}
                whileHover={{ scale: 1.3, y: -4 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => onScrub(event.timestamp)}
                style={{ left: `${position}%` }}
                className={cn(
                  "absolute -translate-x-1/2 rounded-lg p-1.5 transition-all",
                  isActive
                    ? "bg-violet-500/20 ring-2 ring-violet-400/60"
                    : "bg-slate-900/60 hover:bg-slate-800/80",
                )}
                title={`${event.description} (${formatDuration(Math.floor(event.timestamp))})`}
              >
                <Icon className={cn("h-4 w-4", isActive ? colorClass : "text-slate-400")} />
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
