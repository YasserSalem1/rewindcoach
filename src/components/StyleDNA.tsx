"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";

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
        "relative h-full overflow-hidden border-violet-500/40 bg-gradient-to-br from-slate-950 via-indigo-950/90 to-zinc-950 shadow-[0_25px_65px_rgba(79,70,229,0.35)] transition-transform duration-500 hover:-translate-y-1 hover:shadow-[0_35px_80px_rgba(129,140,248,0.45)]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-8 h-56 w-56 rounded-full bg-purple-500/25 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.16),_transparent_60%)]" />
      </div>

      <CardHeader className="relative z-10 border-b border-white/10 pb-8">
        <div className="flex flex-col gap-4">
          <span className="inline-flex items-center gap-2 self-start rounded-full border border-violet-400/40 bg-violet-500/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.4em] text-violet-200/75">
            <Sparkles className="h-3 w-3" />
            DNA
          </span>
          <CardTitle className="text-2xl font-bold text-slate-50">{data.title}</CardTitle>
          <CardDescription className="max-w-xl text-sm leading-relaxed text-slate-200/70">
            {data.description}
          </CardDescription>
        </div>
      </CardHeader>

      <CardContent className="relative z-10 flex flex-col gap-6 p-6">
        <div className="rounded-3xl border border-violet-400/30 bg-slate-950/60 p-4 shadow-[0_20px_50px_rgba(99,102,241,0.25)]">
          <div className="h-64 w-full">
            <ResponsiveContainer>
              <RadarChart
                data={data.radar}
                cx="50%"
                cy="50%"
                outerRadius="80%"
              >
                <PolarGrid stroke="#6366f120" />
                <PolarAngleAxis dataKey="axis" stroke="#c7d2fe" tick={{ fill: "#c7d2fe", fontSize: 12 }} />
                <Radar
                  dataKey="score"
                  stroke="#6366f1"
                  fill="#6366f1"
                  fillOpacity={0.3}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {data.tags.map((tag) => (
            <Badge
              key={tag}
              variant="outline"
              className="border-transparent bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.25em] text-violet-100/90 backdrop-blur"
            >
              {tag}
            </Badge>
          ))}
        </div>
        {region && gameName && tagLine && (
          <Button
            onClick={handleGenerateChronicle}
            variant="default"
            className="group relative mt-2 w-full overflow-hidden rounded-2xl bg-gradient-to-r from-violet-500 via-fuchsia-500 to-amber-400 text-sm font-semibold text-slate-950 shadow-[0_18px_40px_rgba(217,70,239,0.35)] transition-all hover:shadow-[0_24px_55px_rgba(249,115,22,0.45)]"
          >
            <span className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.25),_transparent_60%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
            <span className="relative z-10 font-heading uppercase tracking-[0.3em]">
              Generate Chroniccle
            </span>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
