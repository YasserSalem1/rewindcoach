"use client";

import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts";

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

interface StyleDNAProps {
  data: StyleDNAType;
  className?: string;
}

export function StyleDNA({ data, className }: StyleDNAProps) {
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
      </CardContent>
    </Card>
  );
}
