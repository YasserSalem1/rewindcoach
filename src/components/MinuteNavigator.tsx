"use client";

import { useMemo } from "react";
import { cn } from "@/lib/ui";

interface MinuteNavigatorProps {
  totalMinutes: number;
  currentMinute: number;
  onSelect: (minute: number) => void;
}

export function MinuteNavigator({
  totalMinutes,
  currentMinute,
  onSelect,
}: MinuteNavigatorProps) {
  const minutes = useMemo(
    () =>
      Array.from({ length: Math.max(totalMinutes + 1, 1) }, (_, index) => index),
    [totalMinutes],
  );

  const handleSelect = (minute: number) => {
    if (minute < 0 || minute > totalMinutes) return;
    onSelect(minute);
  };

  return (
    <div className="overflow-hidden rounded-3xl border border-white/10 bg-slate-950/65 p-2 shadow shadow-slate-950/40">
      <div className="flex min-w-full gap-2 overflow-x-auto pb-1">
        {minutes.map((minute) => {
          const isActive = minute === currentMinute;
          return (
            <button
              key={`minute-${minute}`}
              type="button"
              onClick={() => handleSelect(minute)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition",
                isActive
                  ? "border-violet-300/90 bg-violet-500/25 text-violet-100 shadow-[0_0_16px_rgba(139,92,246,0.45)]"
                  : "border-white/10 bg-slate-950/70 text-slate-300 hover:border-violet-300/60 hover:text-violet-100"
              )}
              aria-pressed={isActive}
            >
              {minute.toString().padStart(2, "0")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

