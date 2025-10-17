"use client";

import { useMemo } from "react";
import Image from "next/image";
import { ArrowLeft, Trophy, Target, Swords, Eye, TrendingUp, Calendar, Zap, Shield, Flame } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart,
  ResponsiveContainer,
  BarChart,
  Bar,
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
import type { ProfileBundle } from "@/lib/riot";

interface ChronicleContentProps {
  bundle: ProfileBundle;
  region: string;
}

export function ChronicleContent({ bundle, region }: ChronicleContentProps) {
  const router = useRouter();
  const { profile: summoner, styleDNA, highlights, matches, puuid } = bundle;

  // Calculate season stats (season starts at beginning of year)
  const seasonStats = useMemo(() => {
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
              Season started: {seasonStats.seasonStart}
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
              {Math.round(seasonStats.winRate * 100)}%
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {seasonStats.wins}W / {seasonStats.losses}L
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
              {seasonStats.avgKda.toFixed(2)}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              {seasonStats.avgKills.toFixed(1)} / {seasonStats.avgDeaths.toFixed(1)} / {seasonStats.avgAssists.toFixed(1)}
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
              {seasonStats.gamesPlayed}
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
              {seasonStats.avgVision.toFixed(1)}
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
                <LineChart data={seasonStats.monthlyChartData}>
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
              <span className="font-semibold text-slate-100">{seasonStats.avgKills.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Avg Deaths</span>
              <span className="font-semibold text-slate-100">{seasonStats.avgDeaths.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Avg Assists</span>
              <span className="font-semibold text-slate-100">{seasonStats.avgAssists.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Penta Kills</span>
              <span className="font-semibold text-yellow-400">{seasonStats.pentaKills}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Quadra Kills</span>
              <span className="font-semibold text-purple-400">{seasonStats.quadraKills}</span>
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
              <span className="font-semibold text-slate-100">{seasonStats.avgGold.toFixed(0)}g</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Avg CS</span>
              <span className="font-semibold text-slate-100">{seasonStats.avgCs.toFixed(0)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">CS per Min</span>
              <span className="font-semibold text-slate-100">{seasonStats.avgCsPerMin.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Dragons</span>
              <span className="font-semibold text-red-400">{seasonStats.totalDragons}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Barons</span>
              <span className="font-semibold text-purple-400">{seasonStats.totalBarons}</span>
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
                <Badge variant="good">{seasonStats.mostPlayedRole}</Badge>
              </div>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Avg Vision Score</span>
              <span className="font-semibold text-slate-100">{seasonStats.avgVision.toFixed(1)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Total Games</span>
              <span className="font-semibold text-slate-100">{seasonStats.gamesPlayed}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Win Streak Best</span>
              <span className="font-semibold text-green-400">-</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Current Form</span>
              <Badge variant={seasonStats.winRate >= 0.55 ? "good" : seasonStats.winRate >= 0.45 ? "default" : "destructive"}>
                {seasonStats.winRate >= 0.55 ? "Hot" : seasonStats.winRate >= 0.45 ? "Stable" : "Cold"}
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {seasonStats.topChampions.map((champ) => (
                <Card key={champ.name} className="border-slate-700 bg-slate-900/50">
                  <CardContent className="p-4">
                    <div className="flex flex-col items-center gap-2">
                      <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-violet-400/30">
                        <Image
                          src={champ.icon}
                          alt={champ.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <h3 className="text-center text-sm font-semibold text-slate-100">
                        {champ.name}
                      </h3>
                      <div className="flex flex-col items-center gap-1 text-xs text-slate-400">
                        <span>{champ.games} games</span>
                        <Badge 
                          variant={champ.winRate >= 0.55 ? "good" : champ.winRate >= 0.45 ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {Math.round(champ.winRate * 100)}% WR
                        </Badge>
                        <span className="text-slate-300">{champ.kda.toFixed(2)} KDA</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}


