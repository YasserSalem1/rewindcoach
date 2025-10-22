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
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

  const handleGenerateChronicle = () => {
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
      <CardHeader className="border-b border-white/10 pb-6">
        <div className="flex flex-col gap-3">
          <CardTitle className="text-xl font-semibold text-slate-100">{data.title}</CardTitle>
          <CardDescription className="max-w-xl text-sm leading-relaxed text-slate-400">
            {data.description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-6 p-6">
        <div className="rounded-2xl border border-white/10 bg-slate-900/50 p-4">
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <RadarChart
                data={data.radar}
                cx="50%"
                cy="50%"
                outerRadius="80%"
              >
                <PolarGrid stroke="#475569" />
                <PolarAngleAxis dataKey="axis" stroke="#94a3b8" tick={{ fill: "#94a3b8", fontSize: 12 }} />
                <Radar
                  dataKey="score"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.25}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

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
        {region && gameName && tagLine && (
          <Button
            onClick={handleGenerateChronicle}
            variant="default"
            className="mt-2 w-full rounded-xl border border-violet-500/30 bg-violet-600/20 text-sm font-semibold text-violet-100 hover:bg-violet-600/30 hover:border-violet-500/50 transition-all"
          >
            <span className="uppercase tracking-wide">Generate Chronicle</span>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
