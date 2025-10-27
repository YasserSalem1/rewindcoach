"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { useRouter } from "next/navigation";
import type { StyleDNA as StyleDNAType } from "@/lib/riot";
import { cn } from "@/lib/ui";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface StyleDNAProps {
  data: StyleDNAType;
  className?: string;
  region?: string;
  gameName?: string;
  tagLine?: string;
}

export function StyleDNA({ data, className, region, gameName, tagLine }: StyleDNAProps) {
  const router = useRouter();

  const handleShowMore = () => {
    if (region && gameName && tagLine) {
      router.push(`/profile/${region}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}/analysis`);
    }
  };

  return (
    <Card
      className={cn(
        "group relative h-full overflow-hidden border-white/10 bg-slate-950/85 backdrop-blur-sm transition-all duration-300 hover:border-violet-400/40 hover:shadow-[0_0_45px_rgba(139,92,246,0.45)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute -top-32 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="absolute bottom-[-80px] right-[-40px] h-60 w-60 rounded-full bg-fuchsia-500/15 blur-3xl" />
      </div>
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-slate-100">
          Recent Matches Analysis
        </CardTitle>
      </CardHeader>

      <CardContent className="flex flex-col gap-6 p-6">
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-slate-900/55 p-4 transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-[1.01] group-hover:border-violet-400/60 group-hover:shadow-[0_18px_42px_rgba(109,40,217,0.35)]">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-violet-500/15 via-transparent to-fuchsia-500/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          <div className="relative h-64 w-full">
            <ResponsiveContainer>
              <RadarChart
                data={data.radar}
                cx="50%"
                cy="50%"
                outerRadius="80%"
              >
                <PolarGrid stroke="#475569" />
                <PolarAngleAxis
                  dataKey="axis"
                  stroke="#cbd5f5"
                  tick={{ fill: "#cbd5f5", fontSize: 12 }}
                />
                <Radar
                  dataKey="score"
                  stroke="#c4b5fd"
                  fill="#a855f7"
                  fillOpacity={0.28}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="relative mt-4 flex flex-wrap gap-2 text-left">
            {data.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-white/15 bg-slate-800/60 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-200/85 transition-colors duration-300 group-hover:border-violet-500/60 group-hover:text-violet-100"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
        <div className="flex justify-end">
          <Button
            type="button"
            onClick={handleShowMore}
            className="group relative flex items-center justify-center overflow-hidden rounded-lg bg-gradient-to-r from-violet-600 to-purple-600 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-white shadow-lg shadow-violet-500/50 transition-all hover:shadow-xl hover:shadow-violet-500/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-200 sm:w-auto"
            aria-label="Open recent matches performance lab"
          >
            <span className="relative z-10">Open Match Lab</span>
            <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            </div>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
