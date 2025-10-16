"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import type { RiotMatch } from "@/lib/riot";
import { formatDuration } from "@/lib/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatPill } from "@/components/StatPill";

interface ReviewHeaderProps {
  match: RiotMatch;
  currentTime: number;
  gameName?: string;
  tagLine?: string;
  region?: string;
}

export function ReviewHeader({ match, currentTime, gameName, tagLine, region }: ReviewHeaderProps) {
  const router = useRouter();
  const player = match.participants.find(
    (p) => p.puuid === match.primaryParticipantPuuid,
  );
  const winTeam = match.teams.find((team) => team.win);

  const handleBack = () => {
    if (gameName && tagLine && region) {
      router.push(`/profile/${region}/${encodeURIComponent(gameName)}/${encodeURIComponent(tagLine)}`);
    } else {
      router.back();
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={handleBack}
        className="text-slate-300 hover:text-slate-100"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Profile
      </Button>

      {/* Improved Header Design */}
      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/90 via-slate-950/80 to-violet-950/30 p-8 shadow-[0_0_60px_rgba(139,92,246,0.15)] backdrop-blur-xl">
        {/* Top Section - Queue Type & Result */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="font-heading text-3xl text-slate-100">
              {match.queueType}
            </h1>
            {player && (
              <Badge 
                variant={player.win ? "good" : "bad"}
                className="text-base px-4 py-1"
              >
                {player.win ? "Victory" : "Defeat"}
              </Badge>
            )}
          </div>
          <StatPill 
            label="Match Duration" 
            value={formatDuration(match.gameDuration)}
          />
        </div>

        {/* Player Performance - Highlighted */}
        {player && (
          <div className="mb-6 rounded-2xl border border-violet-400/30 bg-violet-500/10 p-6">
            <div className="flex flex-wrap items-center justify-between gap-6">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400 mb-2">
                  Your Performance
                </p>
                <div className="flex items-center gap-4">
                  <span className="font-heading text-2xl text-violet-100">
                    {player.championName}
                  </span>
                  <div className="flex items-center gap-3 text-lg">
                    <span className="font-semibold text-green-400">{player.kills}</span>
                    <span className="text-slate-400">/</span>
                    <span className="font-semibold text-red-400">{player.deaths}</span>
                    <span className="text-slate-400">/</span>
                    <span className="font-semibold text-blue-400">{player.assists}</span>
                  </div>
                  <span className="text-slate-300">•</span>
                  <span className="text-slate-300">{player.cs} CS</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Team Stats */}
        <div className="grid gap-4 sm:grid-cols-2">
          {match.teams.map((team) => {
            const isBlue = team.teamId === 100;
            const isWinner = team.teamId === winTeam?.teamId;
            return (
              <div
                key={team.teamId}
                className={`rounded-2xl border p-4 ${
                  isBlue
                    ? "border-blue-400/30 bg-blue-500/10"
                    : "border-red-400/30 bg-red-500/10"
                }`}
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div
                      className={`h-3 w-3 rounded-full ${
                        isBlue ? "bg-blue-500" : "bg-red-500"
                      }`}
                    />
                    <span className={`font-semibold ${
                      isBlue ? "text-blue-300" : "text-red-300"
                    }`}>
                      {isBlue ? "Blue Team" : "Red Team"}
                    </span>
                  </div>
                  {isWinner && <Badge variant="good">Winner</Badge>}
                </div>
                <div className="flex flex-wrap gap-4 text-sm text-slate-300">
                  <span>{team.kills} Kills</span>
                  <span>•</span>
                  <span>{team.towers} Towers</span>
                  <span>•</span>
                  <span>{team.dragons} Drakes</span>
                  {team.barons > 0 && (
                    <>
                      <span>•</span>
                      <span>{team.barons} Baron{team.barons > 1 ? "s" : ""}</span>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
