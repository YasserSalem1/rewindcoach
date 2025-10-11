import Image from "next/image";

import type { ProfileHighlights } from "@/lib/riot";
import { formatNumber } from "@/lib/ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StatPill } from "@/components/StatPill";

interface HighlightsCardProps {
  highlights: ProfileHighlights;
}

export function HighlightsCard({ highlights }: HighlightsCardProps) {
  return (
    <Card className="border-white/5 bg-slate-950/70">
      <CardHeader>
        <CardTitle>Highlights</CardTitle>
        <CardDescription>Last 20 games snapshot</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <div className="flex flex-wrap gap-3">
          <StatPill
            label="Win Rate"
            value={`${Math.round(highlights.last20WinRate * 100)}%`}
            tone={highlights.last20WinRate > 0.5 ? "good" : "neutral"}
          />
          <StatPill
            label="Avg KDA"
            value={formatNumber(highlights.averageKda, 2)}
            tone={highlights.averageKda >= 3 ? "good" : "neutral"}
          />
          <StatPill
            label="CS / Min"
            value={formatNumber(highlights.csPerMinute, 1)}
          />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-100">
            Top champions
          </p>
          <div className="mt-3 flex flex-col gap-3">
            {highlights.topChampions.map((champ) => (
              <div
                key={champ.championId}
                className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/45 p-2"
              >
                <Image
                  src={champ.icon}
                  alt={champ.championName}
                  width={40}
                  height={40}
                  className="rounded-xl border border-violet-400/45"
                />
                <div className="flex flex-1 items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-100">
                      {champ.championName}
                    </p>
                    <p className="text-xs text-slate-300/70">
                      {champ.games} games • {Math.round(champ.winRate * 100)}%
                      win
                    </p>
                  </div>
                  <span className="text-xs text-slate-300/80">
                    {formatNumber(champ.averageKda, 2)} KDA
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
