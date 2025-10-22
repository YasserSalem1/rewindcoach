"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { ArrowLeft, Trophy, Target, Swords, Eye, TrendingUp, Calendar, Zap, Shield, Flame } from "lucide-react";
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

  // Calculate fallback season stats from matches (season starts at beginning of year)
  const calculatedSeasonStats = useMemo(() => {
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
      .slice(0, 5)
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
      // Use calculated stats as fallback
      return calculatedSeasonStats;
    }

    // Get champions directly from championStats and sort by games played
    const topChampions = Object.entries(seasonStats.championStats)
      .sort((a, b) => b[1].gamesPlayed - a[1].gamesPlayed) // Sort by games played descending
      .slice(0, 5) // Take top 5
      .map(([name, champStats]) => {
        // Calculate win rate estimate based on overall stats
        const wins = Math.round((champStats.gamesPlayed / seasonStats.overallStats.totalMatches) * seasonStats.overallStats.wins);
        
        return {
          name,
          games: champStats.gamesPlayed,
          wins,
          winRate: wins / champStats.gamesPlayed,
          totalTakedowns: champStats.totalTakedowns,
          totalDamage: champStats.totalDamage,
          doubleKills: champStats.doubleKills,
          tripleKills: champStats.tripleKills,
          quadraKills: champStats.quadraKills,
          pentaKills: champStats.pentaKills,
          avgDamage: champStats.totalDamage / champStats.gamesPlayed,
          icon: `https://ddragon.leagueoflegends.com/cdn/14.23.1/img/champion/${name}.png`,
        };
      });

    return {
      ...calculatedSeasonStats,
      gamesPlayed: seasonStats.overallStats.totalMatches,
      wins: seasonStats.overallStats.wins,
      losses: seasonStats.overallStats.losses,
      winRate: seasonStats.overallStats.wins / seasonStats.overallStats.totalMatches,
      topChampions,
    };
  }, [seasonStats, calculatedSeasonStats]);

  // Get top 3 summoner spells from API
  const topSummonerSpells = useMemo(() => {
    if (!seasonStats?.overallStats?.topSummonerSpells) {
      return [];
    }

    return Object.entries(seasonStats.overallStats.topSummonerSpells)
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

  return (
    <div className="relative mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-10">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBack}
          className="text-slate-300 hover:text-slate-100"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Profile
        </Button>
      </div>

      {/* Title Section */}
      <section className="flex flex-col gap-4 rounded-3xl border border-white/10 bg-gradient-to-br from-violet-950/40 to-slate-950/70 p-8 shadow-[0_0_60px_rgba(79,70,229,0.25)]">
        <div className="flex items-center gap-4">
          <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-violet-400/45">
            <Image
              src={summoner.profileIcon}
              alt={`${summoner.summonerName} icon`}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h1 className="font-heading text-4xl text-slate-100">
              Season Chronicle
            </h1>
            <p className="text-lg text-slate-300">
              {summoner.summonerName}<span className="text-slate-400">#{summoner.tagline}</span>
            </p>
            <p className="text-sm text-slate-400">
              Season started: {displaySeasonStats.seasonStart}
            </p>
          </div>
        </div>
      </section>

      {/* Quick Stats Overview */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-violet-400/30 bg-slate-950/70">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-400">
              <Trophy className="h-4 w-4 text-yellow-400" />
              Win Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-100">
              {Math.round(displaySeasonStats.winRate * 100)}%
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {displaySeasonStats.wins}W / {displaySeasonStats.losses}L
            </p>
          </CardContent>
        </Card>

        <Card className="border-violet-400/30 bg-slate-950/70">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-400">
              <Target className="h-4 w-4 text-cyan-400" />
              Average KDA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-100">
              {displaySeasonStats.avgKda.toFixed(2)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {displaySeasonStats.avgKills.toFixed(1)} / {displaySeasonStats.avgDeaths.toFixed(1)} / {displaySeasonStats.avgAssists.toFixed(1)}
            </p>
          </CardContent>
        </Card>

        <Card className="border-violet-400/30 bg-slate-950/70">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-400">
              <Swords className="h-4 w-4 text-orange-400" />
              Games Played
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-100">
              {displaySeasonStats.gamesPlayed}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {rankDisplay}
            </p>
          </CardContent>
        </Card>

        <Card className="border-violet-400/30 bg-slate-950/70">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-slate-400">
              <Eye className="h-4 w-4 text-purple-400" />
              Avg Vision Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-100">
              {displaySeasonStats.avgVision.toFixed(1)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Per game
            </p>
          </CardContent>
        </Card>
      </section>

      {/* Main Content Grid */}
      <section className="grid gap-6 lg:grid-cols-2">
        {/* Style DNA Radar */}
        <Card className="border-violet-400/30 bg-slate-950/70">
          <CardHeader>
            <CardTitle>{styleDNA.title}</CardTitle>
            <CardDescription>{styleDNA.description}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            <div className="h-64 w-full">
              <ResponsiveContainer>
                <RadarChart
                  data={styleDNA.radar}
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
              {styleDNA.tags.map((tag) => (
                <Badge key={tag} variant="good">
                  {tag}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Monthly Performance */}
        <Card className="border-violet-400/30 bg-slate-950/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-violet-400" />
              Monthly Performance
            </CardTitle>
            <CardDescription>Win rate and KDA trends throughout the season</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer>
                <LineChart data={displaySeasonStats.monthlyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="month" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="winRate"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ fill: '#6366f1' }}
                    name="Win Rate %"
                  />
                  <Line
                    type="monotone"
                    dataKey="kda"
                    stroke="#22d3ee"
                    strokeWidth={2}
                    dot={{ fill: '#22d3ee' }}
                    name="KDA"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Detailed Stats Grid */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Combat Stats */}
        <Card className="border-violet-400/30 bg-slate-950/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-400" />
              Combat Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-400">Avg Kills</span>
              <span className="font-semibold text-slate-100">{displaySeasonStats.avgKills.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Avg Deaths</span>
              <span className="font-semibold text-slate-100">{displaySeasonStats.avgDeaths.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Avg Assists</span>
              <span className="font-semibold text-slate-100">{displaySeasonStats.avgAssists.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Penta Kills</span>
              <span className="font-semibold text-yellow-400">{displaySeasonStats.pentaKills}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Quadra Kills</span>
              <span className="font-semibold text-purple-400">{displaySeasonStats.quadraKills}</span>
            </div>
          </CardContent>
        </Card>

        {/* Economy & Objectives */}
        <Card className="border-violet-400/30 bg-slate-950/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              Economy & Objectives
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between">
              <span className="text-slate-400">Avg Gold</span>
              <span className="font-semibold text-slate-100">{displaySeasonStats.avgGold.toFixed(0)}g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Avg CS</span>
              <span className="font-semibold text-slate-100">{displaySeasonStats.avgCs.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">CS per Min</span>
              <span className="font-semibold text-slate-100">{displaySeasonStats.avgCsPerMin.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Dragons</span>
              <span className="font-semibold text-red-400">{displaySeasonStats.totalDragons}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Barons</span>
              <span className="font-semibold text-purple-400">{displaySeasonStats.totalBarons}</span>
            </div>
          </CardContent>
        </Card>

        {/* Role Distribution */}
        <Card className="border-violet-400/30 bg-slate-950/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-cyan-400" />
              Play Style
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="mb-2 flex justify-between">
                <span className="text-slate-400">Most Played Role</span>
                <Badge variant="good">{displaySeasonStats.mostPlayedRole}</Badge>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Avg Vision Score</span>
              <span className="font-semibold text-slate-100">{displaySeasonStats.avgVision.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Games</span>
              <span className="font-semibold text-slate-100">{displaySeasonStats.gamesPlayed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Win Streak Best</span>
              <span className="font-semibold text-green-400">-</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Current Form</span>
              <Badge variant={displaySeasonStats.winRate >= 0.55 ? "good" : displaySeasonStats.winRate >= 0.45 ? "default" : "bad"}>
                {displaySeasonStats.winRate >= 0.55 ? "Hot" : displaySeasonStats.winRate >= 0.45 ? "Stable" : "Cold"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Top Champions */}
      <section>
        <Card className="border-violet-400/30 bg-slate-950/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-violet-400" />
              Season Champion Pool
            </CardTitle>
            <CardDescription>Your most played champions this season</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              {displaySeasonStats.topChampions.slice(0, 3).map((champ, index) => (
                <div
                  key={champ.name}
                  className="relative h-[250px] overflow-hidden rounded-2xl border border-violet-400/30"
                  style={{
                    backgroundImage: `url('https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champ.name}_0.jpg')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'top',
                    backgroundRepeat: 'no-repeat',
                  }}
                >
                  {/* Dark overlay for better text readability */}
                  <div className="absolute inset-0 bg-gradient-to-r from-slate-900/95 via-slate-900/60 to-transparent" />
                  
                  {/* Stats Content */}
                  <div className="relative h-full flex items-center px-8">
                    <div className="flex items-center gap-8">
                      {/* Rank Indicator */}
                      <div className="text-4xl font-bold text-violet-400">
                        #{index + 1}
                      </div>
                      
                      {/* Champion Stats */}
                      <div className="flex items-center gap-6 text-lg">
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-400 uppercase tracking-wide">Games</span>
                          <span className="text-xl font-bold text-slate-100">{champ.games}</span>
                        </div>
                        
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-400 uppercase tracking-wide">Win Rate</span>
                          <span className={`text-xl font-bold ${champ.winRate >= 0.55 ? 'text-green-400' : champ.winRate >= 0.45 ? 'text-slate-100' : 'text-red-400'}`}>
                            {Math.round(champ.winRate * 100)}%
                          </span>
                        </div>
                        
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-400 uppercase tracking-wide">Total Damage</span>
                          <span className="text-xl font-bold text-orange-400">
                            {champ.totalDamage.toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-400 uppercase tracking-wide">Avg Damage</span>
                          <span className="text-lg font-semibold text-slate-200">
                            {Math.round(champ.avgDamage).toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-400 uppercase tracking-wide">Multi-Kills</span>
                          <div className="flex items-center gap-2 text-sm font-semibold">
                            {champ.pentaKills > 0 && (
                              <span className="text-yellow-400">🏆{champ.pentaKills}x Penta</span>
                            )}
                            {champ.quadraKills > 0 && (
                              <span className="text-purple-400">⭐{champ.quadraKills}x Quadra</span>
                            )}
                            {champ.tripleKills > 0 && (
                              <span className="text-cyan-400">💫{champ.tripleKills}x Triple</span>
                            )}
                            {champ.doubleKills > 0 && (
                              <span className="text-blue-400">✨{champ.doubleKills}x Double</span>
                            )}
                            {champ.pentaKills === 0 && champ.quadraKills === 0 && champ.tripleKills === 0 && champ.doubleKills === 0 && (
                              <span className="text-slate-400">None</span>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col">
                          <span className="text-sm text-slate-400 uppercase tracking-wide">Takedowns</span>
                          <span className="text-xl font-bold text-cyan-400">{champ.totalTakedowns}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
                    </div>
                  </CardContent>
                </Card>
      </section>

      {/* Summoner Spells Stats */}
      <section>
        <Card className="border-violet-400/30 bg-slate-950/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-yellow-400" />
              Summoner Spells Stats
            </CardTitle>
            <CardDescription>Your summoner spell usage this season</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSeasonStats ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-slate-400">Loading summoner spell stats...</p>
              </div>
            ) : topSummonerSpells.length > 0 ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {topSummonerSpells.map((spell) => (
                  <div
                    key={spell.name}
                    className="relative aspect-square overflow-hidden rounded-lg border border-slate-700 bg-slate-900/50"
                    style={{
                      backgroundImage: `url('${spell.icon}')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                      backgroundRepeat: 'no-repeat',
                    }}
                  >
                    {/* Dark overlay to reduce brightness */}
                    <div className="absolute inset-0 bg-black/40" />
                    
                    {/* Total casts overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-8xl font-extrabold text-white/60 tracking-tighter">
                        {spell.totalCasts}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <p className="text-slate-400">No summoner spell data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* Most Played With */}
      <section>
        <Card className="border-violet-400/30 bg-slate-950/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-cyan-400" />
              Most Played With
            </CardTitle>
            <CardDescription>Your most frequent teammates this season</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingSeasonStats ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-slate-400">Loading teammates...</p>
              </div>
            ) : topPlayedWith.length > 0 ? (
              <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {topPlayedWith.map((player, index) => (
                  <Card key={player.riotId} className="border-violet-400/20 bg-slate-900/50">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-xl font-bold text-white">
                          #{index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-semibold text-slate-100 truncate">
                            {player.summonerName}
                          </h3>
                          <p className="text-sm text-slate-400">
                            {player.gamesPlayed} {player.gamesPlayed === 1 ? 'game' : 'games'} together
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-12">
                <p className="text-slate-400">No teammate data available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
