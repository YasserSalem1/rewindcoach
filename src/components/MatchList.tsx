"use client";

import { useMemo } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";

import { MatchRow } from "@/components/MatchRow";
import type { RiotMatch } from "@/lib/riot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface MatchListProps {
  matches: RiotMatch[];
  heading?: string;
}

export function MatchList({ matches, heading = "Recent Matches" }: MatchListProps) {
  const matchEntries = useMemo(
    () =>
      matches.map((match) => {
        const participant = match.participants.find(
          (p) => p.puuid === match.primaryParticipantPuuid,
        );
        return participant ? { match, participant } : null;
      }),
    [matches],
  ).filter(Boolean) as Array<{ match: RiotMatch; participant: RiotMatch["participants"][number] }>;

  return (
    <Card className="h-full border-white/5 bg-slate-950/65">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{heading}</CardTitle>
      </CardHeader>
      <CardContent className="mt-4">
        <ScrollArea className="h-[28rem] pr-2">
          <div className="flex flex-col gap-4">
            {matchEntries.map(({ match, participant }) => (
              <MatchRow
                key={match.id}
                match={match}
                participant={participant}
              />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
