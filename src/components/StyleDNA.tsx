"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";
import { useRouter } from "next/navigation";
import { TrendingUp } from "lucide-react";

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

  const handleViewChronicle = () => {
    if (region && gameName && tagLine) {
      router.push(`/profile/${region}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}/chronicle`);
    }
  };

  return (
    <Card className={cn("h-full", className)}>
      <CardHeader>
        <CardTitle>{data.title}</CardTitle>
        <CardDescription>{data.description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-6 flex flex-col gap-6">
        <div className="h-64 w-full">
          <ResponsiveContainer>
            <RadarChart
              data={data.radar}
              cx="50%"
              cy="50%"
              outerRadius="80%"
            >
              <PolarGrid stroke="#6366f120" />
              <PolarAngleAxis dataKey="axis" stroke="#c7d2fe" />
              <Radar
                dataKey="score"
                stroke="#6366f1"
                fill="#6366f1"
                fillOpacity={0.35}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-2">
          {data.tags.map((tag) => (
            <Badge key={tag} variant="good">
              {tag}
            </Badge>
          ))}
        </div>
        {region && gameName && tagLine && (
          <Button
            onClick={handleViewChronicle}
            variant="outline"
            className="w-full border-violet-400/30 bg-slate-900/40 text-violet-300 hover:bg-violet-400/10 hover:text-violet-200"
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            View Season Chronicle
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
