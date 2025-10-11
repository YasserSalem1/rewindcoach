"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";

import type { TimelineEvent } from "@/lib/riot";
import { cn } from "@/lib/ui";

const MAP_SIZE = 14870;
const MIN_SCALE = 0.8;
const MAX_SCALE = 2.2;

interface RiftMapProps {
  events: TimelineEvent[];
  currentTime: number;
  className?: string;
}

export function RiftMap({ events, currentTime, className }: RiftMapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1.05);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const dragging = useRef(false);
  const dragOrigin = useRef({ x: 0, y: 0 });

  const visibleEvents = useMemo(
    () => events.filter((event) => event.timestamp <= currentTime),
    [currentTime, events],
  );

  const clampScale = useCallback(
    (value: number) => Math.min(Math.max(value, MIN_SCALE), MAX_SCALE),
    [],
  );

  const handleWheel = useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      event.preventDefault();
      const delta = event.deltaY > 0 ? -0.1 : 0.1;
      setScale((prev) => clampScale(prev + delta));
    },
    [clampScale],
  );

  const pointerDown = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    dragOrigin.current = { x: event.clientX - offset.x, y: event.clientY - offset.y };
    (event.target as HTMLElement).setPointerCapture(event.pointerId);
  }, [offset]);

  const pointerMove = useCallback((event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    setOffset({
      x: event.clientX - dragOrigin.current.x,
      y: event.clientY - dragOrigin.current.y,
    });
  }, []);

  const pointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  return (
    <div
      ref={containerRef}
      className={cn(
        "relative h-full overflow-hidden rounded-3xl border border-white/5 bg-slate-950/70",
        className,
      )}
      onWheel={handleWheel}
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerLeave={pointerUp}
      aria-label="Summoner's Rift timeline map"
    >
      <motion.div
        className="absolute inset-0 origin-center"
        animate={{ scale, x: offset.x, y: offset.y }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        style={{
          backgroundImage: "url(/images/rift.jpg)",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/40 via-transparent to-violet-900/60" />
        {visibleEvents.map((event) => {
          const left = (event.position.x / MAP_SIZE) * 100;
          const bottom = (event.position.y / MAP_SIZE) * 100;
          return (
            <motion.div
              key={event.id}
              className={cn(
                "absolute flex h-7 w-7 -translate-x-1/2 translate-y-1/2 items-center justify-center rounded-full border text-xs font-semibold shadow-lg backdrop-blur",
                markerClasses(event.type),
              )}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.2 }}
              style={{ left: `${left}%`, bottom: `${bottom}%` }}
            >
              {event.type[0]}
              <span className="sr-only">{event.description}</span>
            </motion.div>
          );
        })}
      </motion.div>
      <div className="pointer-events-none absolute inset-0 rounded-3xl border border-violet-400/20" />
    </div>
  );
}

function markerClasses(type: TimelineEvent["type"]) {
  switch (type) {
    case "KILL":
      return "border-violet-400 bg-violet-500/30 text-violet-50";
    case "DEATH":
      return "border-red-400 bg-red-500/30 text-red-50";
    case "OBJECTIVE":
      return "border-sky-400 bg-sky-500/30 text-sky-50";
    default:
      return "border-white/30 bg-white/20 text-white";
  }
}
