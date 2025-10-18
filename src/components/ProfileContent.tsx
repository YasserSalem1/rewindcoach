"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

import { MatchList } from "@/components/MatchList";
import { StyleDNA } from "@/components/StyleDNA";
import { ProfileCoachChat } from "@/components/ProfileCoachChat";
import { Button } from "@/components/ui/button";
import type { ProfileBundle, RiotMatch, StyleDNA as StyleDNAType, ProfileHighlights } from "@/lib/riot";
import { summarizeMatches } from "@/lib/riot";

interface ProfileContentProps {
  bundle: ProfileBundle;
  region: string;
}

export function ProfileContent({ bundle, region }: ProfileContentProps) {
  const router = useRouter();
  const { profile: summoner, puuid } = bundle;
  
  const [styleDNA, setStyleDNA] = useState<StyleDNAType>(bundle.styleDNA);
  const [highlights, setHighlights] = useState<ProfileHighlights>(bundle.highlights);

  const handleMatchesUpdate = useCallback((updatedMatches: RiotMatch[]) => {
    // Recalculate style DNA and highlights with all matches
    const { styleDNA: newStyleDNA, highlights: newHighlights } = summarizeMatches(updatedMatches, puuid);
    setStyleDNA(newStyleDNA);
    setHighlights(newHighlights);
  }, [puuid]);

  const handleBack = () => {
    router.back();
  };

  // Format rank display
  const rankDisplay = summoner.rankedTier === "UNRANKED" 
    ? "Unranked"
    : `${summoner.rankedTier} ${summoner.rankedDivision}`;
  
  const rankColor = 
    summoner.rankedTier === "CHALLENGER" || summoner.rankedTier === "GRANDMASTER" || summoner.rankedTier === "MASTER"
      ? "text-purple-400"
      : summoner.rankedTier === "DIAMOND" || summoner.rankedTier === "PLATINUM"
      ? "text-cyan-400"
      : summoner.rankedTier === "GOLD"
      ? "text-yellow-400"
      : summoner.rankedTier === "SILVER"
      ? "text-gray-400"
      : summoner.rankedTier === "BRONZE"
      ? "text-amber-600"
      : "text-slate-400";

  return (
    <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
      {/* Back Button */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="text-slate-300 hover:text-slate-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      {/* Profile Header */}
      <section className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-[0_0_60px_rgba(79,70,229,0.18)] md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-5">
          <div className="relative h-24 w-24 overflow-hidden rounded-3xl border border-violet-400/45">
            <Image
              src={summoner.profileIcon}
              alt={`${summoner.summonerName} icon`}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h1 className="font-heading text-3xl text-slate-100">
              {summoner.summonerName}
              <span className="text-slate-300/70">#{summoner.tagline}</span>
            </h1>
            <p className="text-sm text-slate-300/75">
              Level {summoner.level} • {region}
            </p>
          </div>
        </div>
        
        {/* Prominent Rank Display */}
        <div className="flex flex-col items-center gap-2 rounded-2xl border border-violet-400/30 bg-slate-900/60 p-6">
          <span className="text-xs uppercase tracking-wide text-slate-400">Current Rank</span>
          <div className="flex flex-col items-center">
            <span className={`font-heading text-3xl font-bold ${rankColor}`}>
              {rankDisplay}
            </span>
            {summoner.rankedTier !== "UNRANKED" && (
              <>
              {/* Commenting out rank stats
                <Badge variant="good" className="mt-2">
                  {summoner.rankedLp} LP
                </Badge>
                {summoner.rankedTotalMatches !== undefined && summoner.rankedTotalMatches > 0 && (
                  <div className="mt-3 flex flex-col items-center gap-1">
                    <span className="text-xs text-slate-400">
                      {summoner.rankedTotalMatches} Games
                    </span>
                    {summoner.rankedWinRate !== undefined && (
                      <span className={`text-sm font-semibold ${
                        summoner.rankedWinRate >= 0.55 ? 'text-green-400' : 
                        summoner.rankedWinRate >= 0.50 ? 'text-yellow-400' : 
                        'text-red-400'
                      }`}>
                        {Math.round(summoner.rankedWinRate * 100)}% WR
                      </span>
                    )}
                  </div>
                )}
              
              */}
              </>
            )}
          </div>
        </div>
      </section>

      {/* Main Content Grid */}
      <section className="grid gap-6 lg:grid-cols-[1.1fr,1.8fr,1.2fr]">
        <StyleDNA 
          data={styleDNA}
          region={region}
          gameName={summoner.summonerName}
          tagLine={summoner.tagline}
        />
        <MatchList 
          matches={bundle.matches} 
          puuid={puuid}
          region={region}
          onMatchesUpdate={handleMatchesUpdate}
        />
        <ProfileCoachChat
          puuid={puuid}
          gameName={summoner.summonerName}
          tagLine={summoner.tagline}
          profileSummary={`Player: ${summoner.summonerName}#${summoner.tagline}, Rank: ${rankDisplay} ${summoner.rankedLp} LP, Level: ${summoner.level}, Win Rate: ${highlights.last20WinRate ? Math.round(highlights.last20WinRate * 100) : 0}%, Average KDA: ${highlights.averageKda}, CS/min: ${highlights.csPerMinute}`}
        />
      </section>
    </div>
  );
}
