"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { ArrowLeft, Trophy, Target, Swords, Eye, TrendingUp, Calendar, Zap, Shield, Flame, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
} from "recharts";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProfileBundle, SeasonStatsResponse } from "@/lib/riot";
import { REGION_CONFIG, fetchSeasonStats } from "@/lib/riot";

interface ChronicleContentProps {
  bundle: ProfileBundle;
  region: string;
}

// Summoner spell name to ID mapping for DDragon
const SUMMONER_SPELL_IDS: Record<string, string> = {
  "Flash": "SummonerFlash",
  "Teleport": "SummonerTeleport",
  "Ignite": "SummonerDot",
  "Heal": "SummonerHeal",
  "Barrier": "SummonerBarrier",
  "Exhaust": "SummonerExhaust",
  "Cleanse": "SummonerBoost",
  "Smite": "SummonerSmite",
  "Ghost": "SummonerHaste",
  "Mark": "SummonerSnowball",
};

export function ChronicleContent({ bundle, region }: ChronicleContentProps) {
  const router = useRouter();
  const { profile: summoner, styleDNA, highlights, matches, puuid } = bundle;
  const [seasonStats, setSeasonStats] = useState<SeasonStatsResponse | null>(null);
  const [isLoadingSeasonStats, setIsLoadingSeasonStats] = useState(true);

  // Fetch season stats from API
  useEffect(() => {
    const loadSeasonStats = async () => {
      try {
        const summonerName = `${summoner.summonerName}-${summoner.tagline}`;
        const regionRouting = REGION_CONFIG[region as keyof typeof REGION_CONFIG]?.routing || region.toLowerCase();
        
        const data = await fetchSeasonStats(
          puuid,
          regionRouting,
          summonerName,
          region.toLowerCase()
        );
        
        setSeasonStats(data);
      } catch (error) {
        console.error("Error fetching season stats:", error);
      } finally {
        setIsLoadingSeasonStats(false);
      }
    };

    loadSeasonStats();
  }, [puuid, region, summoner.summonerName, summoner.tagline]);

  // Fallback season stats for when season stats API is not available
  const fallbackSeasonStats = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const seasonStart = new Date(currentYear, 0, 1); // January 1st

    const seasonMatches = matches.filter(
      (match) => new Date(match.gameCreation) >= seasonStart
    );

    let totalKills = 0;
    let totalDeaths = 0;
    let totalAssists = 0;
    let totalCs = 0;
    let totalDuration = 0;
    let totalVision = 0;
    let totalGold = 0;
    let totalDragons = 0;
    let totalBarons = 0;
    let wins = 0;
    let pentaKills = 0;
    let quadraKills = 0;
    const roleCount: Record<string, number> = {};
    const championStats: Record<string, {
      games: number;
      wins: number;
      kills: number;
      deaths: number;
      assists: number;
      icon: string;
    }> = {};

    // Monthly performance data
    const monthlyStats: Record<string, { wins: number; games: number; kills: number; deaths: number; assists: number }> = {};

    seasonMatches.forEach((match) => {
      const participant = match.participants.find((p) => p.puuid === puuid);
      if (!participant) return;

      // Basic stats
      totalKills += participant.kills;
      totalDeaths += participant.deaths;
      totalAssists += participant.assists;
      totalCs += participant.cs;
      totalDuration += match.gameDuration;
      totalVision += participant.visionScore ?? 0;
      totalGold += participant.goldEarned;
      totalDragons += participant.dragonKills ?? 0;
      totalBarons += participant.baronKills ?? 0;
      
      if (participant.win) wins++;
      
      // Multi-kills
      if (participant.kills >= 5 && participant.deaths === 0) pentaKills++;
      else if (participant.kills >= 4) quadraKills++;

      // Role tracking
      const role = participant.role || "UNKNOWN";
      roleCount[role] = (roleCount[role] || 0) + 1;

      // Champion stats
      const champName = participant.championName;
      if (!championStats[champName]) {
        championStats[champName] = {
          games: 0,
          wins: 0,
          kills: 0,
          deaths: 0,
          assists: 0,
          icon: participant.championIcon,
        };
      }
      championStats[champName].games++;
      if (participant.win) championStats[champName].wins++;
      championStats[champName].kills += participant.kills;
      championStats[champName].deaths += participant.deaths;
      championStats[champName].assists += participant.assists;

      // Monthly stats
      const monthKey = new Date(match.gameCreation).toLocaleDateString('en-US', { month: 'short' });
      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { wins: 0, games: 0, kills: 0, deaths: 0, assists: 0 };
      }
      monthlyStats[monthKey].games++;
      if (participant.win) monthlyStats[monthKey].wins++;
      monthlyStats[monthKey].kills += participant.kills;
      monthlyStats[monthKey].deaths += participant.deaths;
      monthlyStats[monthKey].assists += participant.assists;
    });

    const gamesPlayed = seasonMatches.length || 1;
    const avgKills = totalKills / gamesPlayed;
    const avgDeaths = totalDeaths / gamesPlayed;
    const avgAssists = totalAssists / gamesPlayed;
    const avgKda = totalDeaths === 0 ? (totalKills + totalAssists) : (totalKills + totalAssists) / totalDeaths;
    const avgCs = totalCs / gamesPlayed;
    const avgCsPerMin = totalDuration ? (totalCs / (totalDuration / 60)) : 0;
    const avgVision = totalVision / gamesPlayed;
    const avgGold = totalGold / gamesPlayed;
    const winRate = wins / gamesPlayed;

    // Top champions by games played
    const topChampions = Object.entries(championStats)
      .sort((a, b) => b[1].games - a[1].games)
      .map(([name, stats]) => ({
        name,
        ...stats,
        winRate: stats.wins / stats.games,
        kda: stats.deaths === 0 ? (stats.kills + stats.assists) : (stats.kills + stats.assists) / stats.deaths,
        totalTakedowns: stats.kills + stats.assists,
        totalDamage: 0, // Not available in calculated stats
        avgDamage: 0, // Not available in calculated stats
        doubleKills: 0,
        tripleKills: 0,
        quadraKills: 0,
        pentaKills: 0,
      }));

    // Most played role
    const mostPlayedRole = Object.entries(roleCount)
      .sort((a, b) => b[1] - a[1])[0]?.[0] || "UNKNOWN";

    // Monthly performance chart data
    const monthlyChartData = Object.entries(monthlyStats).map(([month, stats]) => ({
      month,
      winRate: (stats.wins / stats.games) * 100,
      kda: stats.deaths === 0 ? (stats.kills + stats.assists) : (stats.kills + stats.assists) / stats.deaths,
    }));

    return {
      gamesPlayed,
      wins,
      losses: gamesPlayed - wins,
      winRate,
      avgKills,
      avgDeaths,
      avgAssists,
      avgKda,
      avgCs,
      avgCsPerMin,
      avgVision,
      avgGold,
      totalDragons,
      totalBarons,
      pentaKills,
      quadraKills,
      mostPlayedRole,
      topChampions,
      monthlyChartData,
      seasonStart: seasonStart.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
    };
  }, [matches, puuid]);

  // Transform API season stats data for display
  const displaySeasonStats = useMemo(() => {
    if (!seasonStats || !seasonStats.championStats) {
      // Use fallback stats when season stats API is not available
      return fallbackSeasonStats;
    }

    // Get champions directly from championStats and sort by games played
    const topChampions = Object.entries(seasonStats.championStats)
      .sort((a, b) => b[1].gamesPlayed - a[1].gamesPlayed) // Sort by games played descending
      .map(([name, champStats]) => {
        // Use calculated data from season stats API
        // Note: The API provides calculated multikills, totalTakedowns, totalDamage
        // Win rate estimation until API provides individual champion win rates
        const wins = Math.round((champStats.gamesPlayed / seasonStats.overallStats.totalMatches) * seasonStats.overallStats.wins);
        
        return {
          name,
          games: champStats.gamesPlayed,
          wins,
          winRate: wins / champStats.gamesPlayed,
          totalTakedowns: champStats.totalTakedowns,
          totalDamage: champStats.totalDamage,
          doubleKills: champStats.doubleKills || 0,
          tripleKills: champStats.tripleKills || 0,
          quadraKills: champStats.quadraKills || 0,
          pentaKills: champStats.pentaKills || 0,
          avgDamage: champStats.totalDamage / champStats.gamesPlayed,
          icon: `https://ddragon.leagueoflegends.com/cdn/14.23.1/img/champion/${name}.png`,
        };
      });

    // Use calculated data from season stats API
    // The API should provide calculated averages, but if not available, use fallback estimates
    const avgKills = fallbackSeasonStats.avgKills; // Use fallback for now until API provides calculated averages
    const avgDeaths = fallbackSeasonStats.avgDeaths; // Use fallback for now until API provides calculated averages  
    const avgAssists = fallbackSeasonStats.avgAssists; // Use fallback for now until API provides calculated averages

    return {
      // Use calculated data from season stats API
      gamesPlayed: seasonStats.overallStats.totalMatches,
      wins: seasonStats.overallStats.wins,
      losses: seasonStats.overallStats.losses,
      winRate: seasonStats.overallStats.wins / seasonStats.overallStats.totalMatches,
      
      // Use calculated averages from season stats API when available, fallback otherwise
      avgKills,
      avgDeaths,
      avgAssists,
      avgKda: avgDeaths === 0 ? (avgKills + avgAssists) : (avgKills + avgAssists) / avgDeaths,
      
      // These fields may not be available in season stats API yet, using fallback
      avgCs: fallbackSeasonStats.avgCs,
      avgCsPerMin: fallbackSeasonStats.avgCsPerMin,
      avgVision: fallbackSeasonStats.avgVision,
      avgGold: fallbackSeasonStats.avgGold,
      totalDragons: fallbackSeasonStats.totalDragons,
      totalBarons: fallbackSeasonStats.totalBarons,
      pentaKills: fallbackSeasonStats.pentaKills,
      quadraKills: fallbackSeasonStats.quadraKills,
      mostPlayedRole: fallbackSeasonStats.mostPlayedRole,
      monthlyChartData: fallbackSeasonStats.monthlyChartData,
      seasonStart: fallbackSeasonStats.seasonStart,
      
      // Champion data from season stats API
      topChampions,
    };
  }, [seasonStats, fallbackSeasonStats]);

  // Get top 3 summoner spells from API
  const topSummonerSpells = useMemo(() => {
    if (!seasonStats?.overallStats?.topSummonerSpells) {
      return [];
    }

    return Object.entries(seasonStats.overallStats.topSummonerSpells)
      .sort((a, b) => b[1].totalCasts - a[1].totalCasts) // Sort by total casts descending
      .slice(0, 3)
      .map(([name, stats]) => ({
        name,
        id: SUMMONER_SPELL_IDS[name] || name,
        totalCasts: stats.totalCasts,
        icon: `/images/spells/${name.toLowerCase()}.png`,
      }));
  }, [seasonStats]);

  // Get top 3 most played with players from API
  const topPlayedWith = useMemo(() => {
    if (!seasonStats?.overallStats?.mostPlayedWith) {
      return [];
    }

    return Object.entries(seasonStats.overallStats.mostPlayedWith)
      .sort((a, b) => b[1] - a[1]) // Sort by games count descending
      .slice(0, 3)
      .map(([riotId, games]) => {
        // Extract summoner name from the riotId (format: "name#tag_encodedPuuid")
        const summonerName = riotId.split('#')[0];
        return {
          riotId,
          summonerName,
          gamesPlayed: games,
        };
      });
  }, [seasonStats]);

  const handleBack = () => {
    router.push(`/profile/${region}/${encodeURIComponent(summoner.summonerName)}/${encodeURIComponent(summoner.tagline)}`);
  };

  // Format rank display
  const rankDisplay = summoner.rankedTier === "UNRANKED" 
    ? "Unranked"
    : `${summoner.rankedTier} ${summoner.rankedDivision}`;

  // Calculate enemies taken down per player using season stats API data
  const playersWithTakedowns = useMemo(() => {
    if (!seasonStats?.overallStats?.mostPlayedWith) {
      return [];
    }

    return Object.entries(seasonStats.overallStats.mostPlayedWith)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([riotId, games]) => {
        const summonerName = riotId.split('#')[0];
        // Use season stats API data for more accurate takedowns calculation
        const estimatedTakedowns = seasonStats.championStats ? 
          Math.round(games * displaySeasonStats.avgKills) : 
          Math.round(games * 5); // Fallback estimate
        return {
          riotId,
          summonerName,
          gamesPlayed: games,
          takedowns: estimatedTakedowns,
        };
      });
  }, [seasonStats, displaySeasonStats.avgKills]);

  return (
    <div className="relative h-screen w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth scrollbar-hide">
      {/* Fixed Back Button */}
      <div className="fixed top-4 left-4 z-50 animate-in fade-in slide-in-from-left-5 duration-500">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="bg-slate-950/80 backdrop-blur-sm text-slate-300 hover:text-slate-100 border border-white/10 transition-all duration-300 hover:scale-105"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profile
        </Button>
      </div>

      {/* Page 1: Landing Page */}
      <section className="relative h-screen w-full snap-start snap-always flex items-center justify-center bg-gradient-to-br from-violet-950/60 via-slate-950/80 to-slate-950">
        <div className="relative z-10 flex flex-col items-center gap-12 px-8 animate-in fade-in zoom-in duration-1000">
          <div className="relative h-32 w-32 overflow-hidden rounded-3xl border-4 border-violet-400/45 shadow-[0_0_60px_rgba(139,92,246,0.4)] animate-in zoom-in duration-700 delay-300">
            <Image
              src={summoner.profileIcon}
              alt={`${summoner.summonerName} icon`}
              fill
              className="object-cover"
            />
          </div>
          
          <div className="text-center animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-500">
            <h1 className="font-heading text-7xl md:text-8xl text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-violet-400 mb-6 tracking-tight">
              Let&apos;s rewind back 2025
            </h1>
            <p className="text-2xl text-slate-300 mb-2 transition-all duration-300 hover:scale-105">
              {summoner.summonerName}<span className="text-slate-400">#{summoner.tagline}</span>
            </p>
            <p className="text-lg text-slate-400">
              Season Chronicle • {displaySeasonStats.gamesPlayed} Games Played
            </p>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 animate-bounce">
            <span className="text-sm text-slate-400 uppercase tracking-wider">Scroll Down</span>
            <ChevronDown className="h-6 w-6 text-violet-400" />
          </div>
        </div>

        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 -left-20 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>
      </section>

      {/* Page 2: Season Champion Pool */}
      <section className="relative h-screen w-full snap-start snap-always overflow-hidden bg-slate-950">
        <div className="h-full overflow-y-auto px-8 py-16 scroll-smooth">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400 mb-8 text-center animate-in fade-in slide-in-from-top-5 duration-700">
              Season Champion Pool
            </h2>
            <p className="text-lg text-slate-400 text-center mb-12 animate-in fade-in duration-700 delay-150">
              Every champion you've piloted this season, ordered by games played
            </p>
            
            <div className="flex flex-col gap-6">
              {displaySeasonStats.topChampions.map((champ, index) => (
                <div
                  key={champ.name}
                  className="relative h-[250px] overflow-hidden rounded-2xl border border-violet-400/30 shadow-lg hover:shadow-violet-500/30 transition-all duration-500 hover:scale-[1.02] hover:border-violet-400/60 animate-in fade-in slide-in-from-left-10 duration-700"
                  style={{
                    backgroundImage: `url('https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champ.name}_0.jpg')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'top',
                    backgroundRepeat: 'no-repeat',
                    animationDelay: `${index * 100 + 300}ms`,
                  }}
                >
                  {/* Dark overlay for better text readability */}
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/60 to-transparent transition-all duration-500 group-hover:from-slate-900/90" />
                  
                  {/* Stats Content */}
                  <div className="relative h-full flex flex-col justify-between py-6 px-8">
                    <div className="flex items-center gap-8">
                      {/* Rank Indicator */}
                      <div className="text-5xl font-bold text-violet-400 transition-all duration-300 hover:scale-110">
                        #{index + 1}
                      </div>
                      
                      {/* Champion Name */}
                      <div className="flex flex-col">
                        <span className="text-3xl font-bold text-slate-100 transition-all duration-300">{champ.name}</span>
                      </div>
                      
                      {/* Champion Stats */}
                      <div className="flex items-center gap-6 text-lg ml-auto">
                        <div className="flex flex-col transition-all duration-300 hover:scale-110">
                          <span className="text-sm text-slate-400 uppercase tracking-wide">Games</span>
                          <span className="text-xl font-bold text-slate-100">{champ.games}</span>
                        </div>
                        
                        <div className="flex flex-col transition-all duration-300 hover:scale-110">
                          <span className="text-sm text-slate-400 uppercase tracking-wide">Win Rate</span>
                          <span className={`text-xl font-bold ${champ.winRate >= 0.55 ? 'text-green-400' : champ.winRate >= 0.45 ? 'text-slate-100' : 'text-red-400'}`}>
                            {Math.round(champ.winRate * 100)}%
                          </span>
                        </div>
                        
                        <div className="flex flex-col transition-all duration-300 hover:scale-110">
                          <span className="text-sm text-slate-400 uppercase tracking-wide">Total Damage</span>
                          <span className="text-xl font-bold text-orange-400">
                            {champ.totalDamage.toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="flex flex-col transition-all duration-300 hover:scale-110">
                          <span className="text-sm text-slate-400 uppercase tracking-wide">Takedowns</span>
                          <span className="text-xl font-bold text-cyan-400">{champ.totalTakedowns}</span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Multikills Section */}
                    <div className="flex items-center gap-4 pl-24">
                      <span className="text-sm text-slate-400 uppercase tracking-wide">Multikills:</span>
                      <div className="flex items-center gap-3">
                        {champ.pentaKills > 0 && (
                          <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-yellow-500/20 border border-yellow-500/40 transition-all duration-300 hover:scale-110">
                            <span className="text-yellow-400 font-bold text-lg">{champ.pentaKills}×</span>
                            <span className="text-yellow-300 text-sm font-semibold">Penta</span>
                          </div>
                        )}
                        {champ.quadraKills > 0 && (
                          <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-purple-500/20 border border-purple-500/40 transition-all duration-300 hover:scale-110">
                            <span className="text-purple-400 font-bold text-lg">{champ.quadraKills}×</span>
                            <span className="text-purple-300 text-sm font-semibold">Quadra</span>
                          </div>
                        )}
                        {champ.tripleKills > 0 && (
                          <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-cyan-500/20 border border-cyan-500/40 transition-all duration-300 hover:scale-110">
                            <span className="text-cyan-400 font-bold text-lg">{champ.tripleKills}×</span>
                            <span className="text-cyan-300 text-sm font-semibold">Triple</span>
                          </div>
                        )}
                        {champ.doubleKills > 0 && (
                          <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-blue-500/20 border border-blue-500/40 transition-all duration-300 hover:scale-110">
                            <span className="text-blue-400 font-bold text-lg">{champ.doubleKills}×</span>
                            <span className="text-blue-300 text-sm font-semibold">Double</span>
                          </div>
                        )}
                        {champ.pentaKills === 0 && champ.quadraKills === 0 && champ.tripleKills === 0 && champ.doubleKills === 0 && (
                          <span className="text-slate-500 text-sm italic">None</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
                    </div>
          </div>
        </div>
      </section>

      {/* Page 3: Summoner Spells Stats */}
      <section className="relative h-screen w-full snap-start snap-always overflow-hidden bg-slate-950">
        <div className="h-full flex items-center justify-center px-8 py-16">
          <div className="mx-auto max-w-7xl w-full">
            <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400 mb-8 text-center animate-in fade-in slide-in-from-top-5 duration-700">
              Summoner Spells
            </h2>
            <p className="text-lg text-slate-400 text-center mb-12 animate-in fade-in duration-700 delay-150">
              Your most used summoner spells this season
            </p>
            
            {isLoadingSeasonStats ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-slate-400">Loading summoner spell stats...</p>
              </div>
            ) : topSummonerSpells.length > 0 ? (
              <div className="grid gap-8 grid-cols-1 md:grid-cols-3 max-w-5xl mx-auto">
                {topSummonerSpells.map((spell, index) => (
                  <div
                    key={spell.name}
                    className="relative aspect-square overflow-hidden rounded-2xl border-2 border-violet-400/40 bg-slate-900/50 shadow-lg hover:shadow-violet-500/40 transition-all duration-500 hover:scale-110 hover:rotate-2 hover:border-violet-400/80 animate-in zoom-in duration-700"
                    style={{
                      backgroundImage: `url('${spell.icon}')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                      animationDelay: `${index * 150 + 300}ms`,
                    }}
                  >
                    {/* Dark overlay to reduce brightness */}
                    <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-transparent transition-all duration-500 hover:from-black/50" />
                    
                    {/* Spell name at top */}
                    <div className="absolute top-4 left-4 right-4">
                      <h3 className="text-2xl font-bold text-white drop-shadow-lg transition-all duration-300">{spell.name}</h3>
                    </div>
                    
                    {/* Total casts overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center transition-transform duration-500 hover:scale-110">
                        <span className="block text-9xl font-extrabold text-white/80 tracking-tighter drop-shadow-2xl">
                        {spell.totalCasts}
                      </span>
                        <span className="block text-lg font-semibold text-slate-300 uppercase tracking-wider mt-2">
                          Casts
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <p className="text-slate-400">No summoner spell data available</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Page 4: Most Played With + StyleDNA */}
      <section className="relative h-screen w-full snap-start snap-always overflow-hidden bg-slate-950">
        <div className="h-full overflow-y-auto px-8 py-16 scroll-smooth">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400 mb-8 text-center animate-in fade-in slide-in-from-top-5 duration-700">
              Season Summary
            </h2>
            
            {/* Most Played With Section */}
            <div className="mb-12">
              <h3 className="text-3xl font-bold text-slate-100 mb-6 text-center animate-in fade-in slide-in-from-top-5 duration-700">Most Played With</h3>
            {isLoadingSeasonStats ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-slate-400">Loading teammates...</p>
              </div>
              ) : playersWithTakedowns.length > 0 ? (
                <>
                  <div className="grid gap-6 grid-cols-1 md:grid-cols-3 max-w-4xl mx-auto mb-8">
                    {playersWithTakedowns.map((player, index) => (
                      <div 
                        key={player.riotId} 
                        className="border border-violet-400/30 bg-slate-900/70 rounded-xl p-6 hover:shadow-lg hover:shadow-violet-500/30 transition-all duration-500 hover:scale-105 hover:border-violet-400/60 animate-in fade-in zoom-in duration-700"
                        style={{ animationDelay: `${index * 150 + 300}ms` }}
                      >
                        <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-4">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-2xl font-bold text-white shadow-lg transition-transform duration-300 hover:scale-110">
                          #{index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                              <h3 className="text-xl font-semibold text-slate-100 truncate transition-colors duration-300">
                            {player.summonerName}
                          </h3>
                          <p className="text-sm text-slate-400">
                            {player.gamesPlayed} {player.gamesPlayed === 1 ? 'game' : 'games'} together
                          </p>
                        </div>
                      </div>
                          
                          {/* Individual Takedowns */}
                          <div className="border-t border-violet-400/20 pt-3 mt-2">
                            <p className="text-center text-slate-300">
                              <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
                                {player.takedowns}
                              </span>
                              {' '}
                              <span className="text-sm text-slate-400">enemies taken down</span>
                            </p>
                          </div>
                        </div>
                      </div>
                ))}
              </div>
                </>
            ) : (
              <div className="flex items-center justify-center py-12">
                <p className="text-slate-400">No teammate data available</p>
              </div>
            )}
            </div>
            
            {/* StyleDNA and Stats Section */}
            <div className="grid gap-8 lg:grid-cols-2 max-w-6xl mx-auto">
              {/* Style DNA Radar */}
              <div className="border border-violet-400/30 bg-slate-900/70 rounded-2xl p-6 transition-all duration-500 hover:shadow-lg hover:shadow-violet-500/30 hover:border-violet-400/60 animate-in fade-in slide-in-from-left-8 duration-700 delay-500">
                <h3 className="text-2xl font-bold text-slate-100 mb-4 text-center">Style DNA</h3>
                <div className="h-80 w-full transition-transform duration-500 hover:scale-105">
                  <ResponsiveContainer>
                    <RadarChart
                      data={styleDNA.radar}
                      cx="50%"
                      cy="50%"
                      outerRadius="80%"
                    >
                      <PolarGrid stroke="#6366f150" />
                      <PolarAngleAxis 
                        dataKey="axis" 
                        stroke="#c7d2fe"
                        tick={{ fill: '#c7d2fe', fontSize: 12 }}
                      />
                      <Radar
                        dataKey="score"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.4}
                        strokeWidth={2}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-4">
                  {styleDNA.tags.map((tag) => (
                    <Badge key={tag} variant="good" className="text-sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {/* Season Stats Summary */}
              <div className="border border-violet-400/30 bg-slate-900/70 rounded-2xl p-6 transition-all duration-500 hover:shadow-lg hover:shadow-violet-500/30 hover:border-violet-400/60 animate-in fade-in slide-in-from-right-8 duration-700 delay-600">
                <h3 className="text-2xl font-bold text-slate-100 mb-6 text-center">Season Performance</h3>
                <div className="space-y-4">
                  {/* Combat Performance */}
                  <div className="border-b border-slate-700 pb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Flame className="h-5 w-5 text-orange-400" />
                      <span className="text-lg font-semibold text-slate-200">Combat Performance</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Avg KDA</span>
                        <span className="font-bold text-slate-100">{displaySeasonStats.avgKda.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">K/D/A</span>
                        <span className="font-semibold text-slate-100">
                          {displaySeasonStats.avgKills.toFixed(1)}/{displaySeasonStats.avgDeaths.toFixed(1)}/{displaySeasonStats.avgAssists.toFixed(1)}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Economy & Objectives */}
                  <div className="border-b border-slate-700 pb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Zap className="h-5 w-5 text-yellow-400" />
                      <span className="text-lg font-semibold text-slate-200">Economy & Objectives</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Avg Gold</span>
                        <span className="font-bold text-slate-100">{displaySeasonStats.avgGold.toFixed(0)}g</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">CS/min</span>
                        <span className="font-semibold text-slate-100">{displaySeasonStats.avgCsPerMin.toFixed(1)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Dragons</span>
                        <span className="font-semibold text-red-400">{displaySeasonStats.totalDragons}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Barons</span>
                        <span className="font-semibold text-purple-400">{displaySeasonStats.totalBarons}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Playstyle */}
                  <div className="border-b border-slate-700 pb-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Shield className="h-5 w-5 text-cyan-400" />
                      <span className="text-lg font-semibold text-slate-200">Playstyle</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Main Role</span>
                        <Badge variant="good" className="text-xs">{displaySeasonStats.mostPlayedRole}</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Vision</span>
                        <span className="font-semibold text-slate-100">{displaySeasonStats.avgVision.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Overall Stats */}
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <Trophy className="h-5 w-5 text-yellow-400" />
                      <span className="text-lg font-semibold text-slate-200">Overall</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Win Rate</span>
                        <span className="font-bold text-green-400">{Math.round(displaySeasonStats.winRate * 100)}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Games</span>
                        <span className="font-semibold text-slate-100">{displaySeasonStats.gamesPlayed}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
