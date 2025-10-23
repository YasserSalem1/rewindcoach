"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { useRouter } from "next/navigation";
import { ArrowUpRight } from "lucide-react";

import type { StyleDNA as StyleDNAType } from "@/lib/riot";
import { cn } from "@/lib/ui";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

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
      router.push(`/profile/${region}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}/chronicle`);
    }
  };

  return (
    <Card
      className={cn(
        "relative h-full overflow-hidden border-white/10 bg-slate-950/85 backdrop-blur-sm",
        className,
      )}
    >
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-slate-100">
          Recent Matches Analysis
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        <button
          type="button"
          onClick={handleShowMore}
          className="group w-full cursor-pointer overflow-hidden rounded-2xl border border-white/10 bg-slate-900/55 p-3 text-left transition-all duration-200 hover:-translate-y-1 hover:scale-[1.02] hover:border-violet-500/60 hover:shadow-[0_14px_28px_rgba(79,70,229,0.32),0_-12px_28px_rgba(168,85,247,0.32)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400"
          aria-label="Open recent matches chronicle"
        >
          <div className="h-64 w-full cursor-pointer">
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
                  stroke="#94a3b8"
                  tick={{ fill: "#94a3b8", fontSize: 12 }}
                />
                <Radar
                  dataKey="score"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.25}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
          <div className="max-h-0 overflow-hidden transition-all duration-300 group-hover:mt-4 group-hover:max-h-32">
            <div className="flex items-center justify-between gap-3 text-sm text-violet-200/70 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
              <div className="flex flex-wrap gap-2 text-left">
                {data.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/15 bg-slate-800/60 px-3 py-1 text-[11px] font-medium uppercase tracking-wide text-slate-200/85 transition-colors group-hover:border-violet-500/50 group-hover:text-violet-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <span className="flex items-center gap-2 text-right">
                Open Analysis
                <ArrowUpRight className="h-4 w-4 transition-transform duration-200 group-hover:-translate-y-1 group-hover:rotate-12" />
              </span>
            </div>
          </div>
        </button>

        {/* Highlights hidden temporarily per design request */}
        {/* <div className="flex flex-col gap-3">
          <span className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-400">
            Highlights
          </span>
          <div className="flex flex-wrap gap-2">
            {data.tags.map((tag) => (
              <Badge
                key={tag}
                variant="neutral"
                className="border-white/10 bg-slate-800/50 px-3 py-1 text-xs font-medium uppercase tracking-wide text-slate-300"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </div> */}
      </CardContent>
    </Card>
  );
}
