"use client";

import type { RiotMatch } from "@/lib/riot";
import { formatDuration } from "@/lib/ui";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatPill } from "@/components/StatPill";

interface ReviewHeaderProps {
  match: RiotMatch;
  currentTime: number;
}

export function ReviewHeader({ match, currentTime }: ReviewHeaderProps) {
  const player = match.participants.find(
    (p) => p.puuid === match.primaryParticipantPuuid,
  );
  const winTeam = match.teams.find((team) => team.win);

  return (
    <Card className="border-white/5 bg-slate-950/70">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <span>{match.queueType}</span>
            {player ? (
              <Badge variant={player.win ? "good" : "bad"}>
                {player.win ? "Victory" : "Defeat"}
              </Badge>
            ) : null}
          </CardTitle>
          <div className="flex flex-wrap gap-3">
            <StatPill label="Match Length" value={formatDuration(match.gameDuration)} />
            <StatPill
              label="Scrubbing"
              value={formatDuration(Math.floor(currentTime))}
              caption="Current timestamp"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-wrap justify-between gap-6 text-sm text-slate-200/85">
        <div>
          <p className="font-semibold text-slate-100">Teams</p>
          <div className="mt-2 flex flex-col gap-2 text-sm">
            {match.teams.map((team) => (
              <div key={team.teamId} className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-wide text-slate-300/65">
                  {team.teamId === 100 ? "Blue" : "Red"}
                </span>
                <span className="font-medium">
                  {team.kills} K • {team.towers} towers • {team.dragons} drakes
                </span>
                {team.teamId === winTeam?.teamId ? (
                  <Badge variant="good">Winner</Badge>
                ) : null}
              </div>
            ))}
          </div>
        </div>
        {player ? (
          <div>
            <p className="font-semibold text-slate-100">Your performance</p>
            <p className="text-sm text-slate-300/75">
              {player.championName} • {player.kills}/{player.deaths}/
              {player.assists} • {player.cs} CS
            </p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
