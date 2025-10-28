"use client";

import { useMemo, useRef } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Swords,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
  BarChart,
  Bar,
  ReferenceLine,
} from "recharts";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ProfileCoachChat } from "@/components/ProfileCoachChat";
import type { ProfileBundle } from "@/lib/riot";
import { cn } from "@/lib/ui";

interface MatchAnalysisContentProps {
  bundle: ProfileBundle;
}

interface TimelineDatum {
  name: string;
  kda: number;
  cs: number;
  kp: number;
  vision: number;
  duration: number;
  result: "W" | "L";
}

interface MatchSummaryCard {
  id: string;
  championName: string;
  championIcon: string;
  queue: string;
  kda: string;
  csPerMin: string;
  killParticipation: number;
  duration: number;
  result: string;
  date: string;
}

const formatPercent = (value: number) => `${Math.round((value || 0) * 100)}%`;
const formatMinutes = (minutes: number) => `${Math.round(minutes || 0)}m`;
const formatGold = (value: number) => `${Math.round(value || 0).toLocaleString()}g`;

const CANONICAL_LANES: readonly ["Top", "Jungle", "Mid", "Bot", "Support"] = [
  "Top",
  "Jungle",
  "Mid",
  "Bot",
  "Support",
];
type CanonicalLane = (typeof CANONICAL_LANES)[number];

const CANONICAL_LANE_LABELS: Record<CanonicalLane, string> = {
  Top: "Top",
  Jungle: "Jungle",
  Mid: "Mid",
  Bot: "Bot",
  Support: "Support",
};

export function MatchAnalysisContent({ bundle }: MatchAnalysisContentProps) {
  const router = useRouter();
  const { profile, matches, styleDNA, highlights, puuid } = bundle;

  const matchesWindow = useMemo(() => matches.slice(0, 20), [matches]);

  const analysis = useMemo(() => {
    if (!matchesWindow.length) {
      return {
        sample: 0,
        wins: 0,
        losses: 0,
        avgKills: 0,
        avgDeaths: 0,
        avgAssists: 0,
        avgKda: 0,
        avgCsPerMin: 0,
        avgVision: 0,
        avgGold: 0,
        avgKillParticipation: 0,
        avgGameDuration: 0,
        objectiveRate: 0,
        impactRate: 0,
        survivalRate: 0,
        laneFocus: [] as Array<{ lane: string; share: number; games: number }>,
        timelineData: [] as TimelineDatum[],
        matchCards: [] as MatchSummaryCard[],
        objectiveLedger: {
          dragons: 0,
          barons: 0,
          towers: 0,
        },
        bestKdaMatch: null,
        bestFarmMatch: null,
        fastestMatch: null,
        longestMatch: null,
        clutchMoments: [] as MatchSummaryCard[],
      };
    }

    let wins = 0;
    let kills = 0;
    let deaths = 0;
    let assists = 0;
    let csPerMinSum = 0;
    let csSamples = 0;
    let visionSum = 0;
    let goldSum = 0;
    let kpSum = 0;
    let kpSamples = 0;
    let durationSum = 0;
    let dragons = 0;
    let barons = 0;
    let teamDragons = 0;
    let teamBarons = 0;
    let teamTowers = 0;
    let impactMatches = 0;
    let lowDeathMatches = 0;

    const laneTally: Record<string, number> = {};
    const timelineData: TimelineDatum[] = [];
    const matchCards: MatchSummaryCard[] = [];
    const clutchCandidates: Array<{ summary: MatchSummaryCard; kp: number }> = [];
    let bestKdaMatch: { summary: MatchSummaryCard; score: number } | null = null;
    let bestFarmMatch: { summary: MatchSummaryCard; score: number } | null = null;
    let fastestMatch: { summary: MatchSummaryCard; duration: number } | null = null;
    let longestMatch: { summary: MatchSummaryCard; duration: number } | null = null;

    matchesWindow.forEach((match, index) => {
      const participant =
        match.participants.find((p) => p.puuid === puuid) ??
        match.participants.find((p) => p.puuid === match.primaryParticipantPuuid);
      if (!participant) return;

      const minutes = Math.max(1, match.gameDuration / 60);
      const team = match.teams.find((t) => t.teamId === participant.teamId);

      if (team) {
        teamDragons += team.dragons;
        teamBarons += team.barons;
        teamTowers += team.towers;
      }

      if (participant.win) wins++;
      kills += participant.kills;
      deaths += participant.deaths;
      assists += participant.assists;
      csPerMinSum += participant.cs / minutes;
      csSamples++;
      if (typeof participant.visionScore === "number") {
        visionSum += participant.visionScore;
      }
      goldSum += participant.goldEarned;
      if (team && team.kills > 0) {
        kpSum += (participant.kills + participant.assists) / team.kills;
        kpSamples++;
      }

      dragons += participant.dragonKills ?? 0;
      barons += participant.baronKills ?? 0;
      durationSum += minutes;

      const rawLane = participant.role || participant.lane || "FLEX";
      laneTally[rawLane] = (laneTally[rawLane] || 0) + 1;

      const kdaValue = Number(((participant.kills + participant.assists) / Math.max(1, participant.deaths)).toFixed(2));
      const csPerMin = Number((participant.cs / minutes).toFixed(2));
      const kpPercent =
        team && team.kills > 0
          ? Number((((participant.kills + participant.assists) / team.kills) * 100).toFixed(0))
          : 0;

      if (kpPercent >= 55) {
        impactMatches++;
      }
      if (participant.deaths <= 4) {
        lowDeathMatches++;
      }

      timelineData.push({
        name: `G${matchesWindow.length - index}`,
        kda: kdaValue,
        cs: csPerMin,
        kp: kpPercent,
        vision: participant.visionScore ?? 0,
        duration: Number(minutes.toFixed(1)),
        result: participant.win ? "W" : "L",
      });

      const matchSummary: MatchSummaryCard = {
        id: match.id,
        championName: participant.championName,
        championIcon: participant.championIcon,
        queue: match.queueType,
        kda: `${participant.kills}/${participant.deaths}/${participant.assists}`,
        csPerMin: csPerMin.toFixed(1),
        killParticipation: kpPercent,
        duration: Math.round(minutes),
        result: participant.win ? "Victory" : "Defeat",
        date: new Date(match.gameCreation).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
        }),
      };

      matchCards.push(matchSummary);
      clutchCandidates.push({ summary: matchSummary, kp: kpPercent });

      if (!bestKdaMatch || kdaValue > bestKdaMatch.score) {
        bestKdaMatch = { summary: matchSummary, score: kdaValue };
      }
      if (!bestFarmMatch || csPerMin > bestFarmMatch.score) {
        bestFarmMatch = { summary: matchSummary, score: csPerMin };
      }
      if (!fastestMatch || minutes < fastestMatch.duration) {
        fastestMatch = { summary: matchSummary, duration: minutes };
      }
      if (!longestMatch || minutes > longestMatch.duration) {
        longestMatch = { summary: matchSummary, duration: minutes };
      }
    });

    const sample = timelineData.length || 1;
    const avgKills = kills / sample;
    const avgDeaths = deaths / sample;
    const avgAssists = assists / sample;
    const avgKda = Number(((avgKills + avgAssists) / Math.max(1, avgDeaths)).toFixed(2));
    const avgCsPerMin = Number((csPerMinSum / Math.max(1, csSamples)).toFixed(2));
    const avgVision = Number((visionSum / Math.max(1, sample)).toFixed(1));
    const avgGold = goldSum / Math.max(1, sample);
    const avgKillParticipation = kpSum / Math.max(1, kpSamples);
    const objectiveRate = (dragons + barons) / sample;
    const impactRate = impactMatches / Math.max(1, sample);
    const survivalRate = lowDeathMatches / Math.max(1, sample);

    const laneFocus = CANONICAL_LANES.map((laneName) => {
      const games = laneTally[laneName];
      return {
        lane: CANONICAL_LANE_LABELS[laneName],
        share: sample ? games / sample : 0,
        games,
      };
    });

    const clutchMoments = clutchCandidates
      .sort((a, b) => b.kp - a.kp)
      .slice(0, 3)
      .map(({ summary, kp }) => ({
        ...summary,
        killParticipation: kp,
      }));

    return {
      sample,
      wins,
      losses: sample - wins,
      avgKills,
      avgDeaths,
      avgAssists,
      avgKda,
      avgCsPerMin,
      avgVision,
      avgGold,
      avgKillParticipation,
      avgGameDuration: durationSum / Math.max(1, sample),
      objectiveRate,
      laneFocus,
      timelineData: timelineData.reverse(),
      matchCards,
      impactRate,
      survivalRate,
      objectiveLedger: {
        dragons: teamDragons,
        barons: teamBarons,
        towers: teamTowers,
      },
      bestKdaMatch: bestKdaMatch?.summary ?? null,
      bestFarmMatch: bestFarmMatch?.summary ?? null,
      fastestMatch: fastestMatch?.summary ?? null,
      longestMatch: longestMatch?.summary ?? null,
      clutchMoments,
    };
  }, [matchesWindow, puuid]);

  const iconLookup = useMemo(() => {
    const map = new Map<string, string>();
    matches.forEach((match) => {
      match.participants.forEach((participant) => {
        if (!map.has(participant.championName)) {
          map.set(participant.championName, participant.championIcon);
        }
      });
    });
    highlights.topChampions.forEach((champion) => {
      if (!map.has(champion.championName)) {
        map.set(champion.championName, champion.icon);
      }
    });
    return map;
  }, [matches, highlights.topChampions]);

  const recentChampionPool = useMemo(() => {
    const championMap = new Map<string, { games: number; wins: number }>();
    matchesWindow.forEach((match) => {
      const participant =
        match.participants.find((p) => p.puuid === puuid) ??
        match.participants.find((p) => p.puuid === match.primaryParticipantPuuid);
      if (!participant) return;

      const record = championMap.get(participant.championName) ?? { games: 0, wins: 0 };
      record.games += 1;
      if (participant.win) record.wins += 1;
      championMap.set(participant.championName, record);
    });

    return Array.from(championMap.entries())
      .sort((a, b) => b[1].games - a[1].games)
      .map(([championName, record]) => ({
        championName,
        icon: iconLookup.get(championName),
        games: record.games,
        winRate: record.games ? record.wins / record.games : 0,
      }));
  }, [matchesWindow, puuid, iconLookup]);

  const streakChartData = useMemo(() => {
    let streak = 0;
    return analysis.timelineData.map((entry) => {
      if (entry.result === "W") {
        streak = streak >= 0 ? streak + 1 : 1;
      } else {
        streak = streak <= 0 ? streak - 1 : -1;
      }
      return { ...entry, streak };
    });
  }, [analysis.timelineData]);

  const timelineCompositeData = useMemo(
    () => analysis.timelineData.slice(),
    [analysis.timelineData],
  );

  const recentPerformance = useMemo(() => {
    const segment = analysis.timelineData.slice(-5);
    if (!segment.length) {
      return null;
    }
    const games = segment.length;
    const wins = segment.filter((entry) => entry.result === "W").length;
    const losses = games - wins;
    const totals = segment.reduce(
      (acc, entry) => {
        acc.kda += entry.kda || 0;
        acc.cs += entry.cs || 0;
        acc.kp += entry.kp || 0;
        acc.vision += entry.vision || 0;
        acc.duration += entry.duration || 0;
        return acc;
      },
      { kda: 0, cs: 0, kp: 0, vision: 0, duration: 0 },
    );
    const lastResult = segment[segment.length - 1]?.result ?? "W";
    return {
      games,
      wins,
      losses,
      avgKda: totals.kda / games,
      avgCs: totals.cs / games,
      avgKp: totals.kp / games,
      avgVision: totals.vision / games,
      avgDuration: totals.duration / games,
      lastResult,
    };
  }, [analysis.timelineData]);

  const recentWindowSize = recentPerformance?.games ?? Math.min(5, analysis.timelineData.length);

  const focusRecommendations = useMemo(() => {
    const recs: Array<{
      title: string;
      detail: string;
      metric: string;
      tone: "positive" | "warning";
      icon: "macro" | "vision" | "team" | "tempo" | "survival";
    }> = [];

    if (analysis.avgCsPerMin && analysis.avgCsPerMin < 6.5) {
      recs.push({
        title: "Wave Discipline",
        detail: "Your lane farm pace is trailing the meta average. Track first two waves and thin before fights.",
        metric: `${analysis.avgCsPerMin.toFixed(1)} cs/min`,
        tone: "warning",
        icon: "macro",
      });
    }

    if (analysis.avgVision && analysis.avgVision < 20) {
      recs.push({
        title: "Vision Sync",
        detail: "Vision score dips below 20 per game. Swap trinkets earlier and pair wards with objective timers.",
        metric: `${analysis.avgVision.toFixed(0)} vision / game`,
        tone: "warning",
        icon: "vision",
      });
    }

    if (analysis.avgKillParticipation && analysis.avgKillParticipation < 0.55) {
      recs.push({
        title: "Teamfight Timing",
        detail: "Impact fades in mid skirmishes. Hover sooner when your jungler invades to lift KP.",
        metric: `${Math.round(analysis.avgKillParticipation * 100)}% KP`,
        tone: "warning",
        icon: "team",
      });
    }

    if (analysis.objectiveRate < 0.3) {
      recs.push({
        title: "Objective Pressure",
        detail: "Few neutral objectives secured. Call for earlier herald converts and leverage prio lanes.",
        metric: `${analysis.objectiveRate.toFixed(1)} bosses / game`,
        tone: "warning",
        icon: "tempo",
      });
    }

    if (analysis.avgDeaths > analysis.avgKills) {
      recs.push({
        title: "Survivability",
        detail: "Deaths outweigh takedowns in this block. Slow the fight entry until key cooldowns are seen.",
        metric: `${analysis.avgDeaths.toFixed(1)} deaths`,
        tone: "warning",
        icon: "survival",
      });
    }

    if (!recs.length) {
      recs.push({
        title: "On Pace",
        detail: "Your fundamentals are trending up. Keep reinforcing the habits that brought this momentum.",
        metric: `${(analysis.wins / Math.max(1, analysis.sample) * 100).toFixed(0)}% recent WR`,
        tone: "positive",
        icon: "macro",
      });
    }

    return recs.slice(0, 3);
  }, [analysis]);

  const highlightMatches = useMemo(() => {
    const entries = [
      analysis.bestKdaMatch
        ? {
            title: "Clutch Carry",
            label: "Highest KDA performance",
            data: analysis.bestKdaMatch,
          }
        : null,
      analysis.bestFarmMatch
        ? {
            title: "Farming Clinic",
            label: "Peak CS pace",
            data: analysis.bestFarmMatch,
          }
        : null,
      analysis.fastestMatch
        ? {
            title: "Speedrun Victory",
            label: "Fastest finish",
            data: analysis.fastestMatch,
          }
        : null,
      analysis.longestMatch
        ? {
            title: "Endurance Test",
            label: "Longest game survived",
            data: analysis.longestMatch,
          }
        : null,
    ].filter(Boolean) as Array<{
      title: string;
      label: string;
      data: MatchSummaryCard;
    }>;
    return entries.slice(0, 3);
  }, [analysis.bestFarmMatch, analysis.bestKdaMatch, analysis.fastestMatch, analysis.longestMatch]);

  const rankDisplay =
    profile.rankedTier === "UNRANKED"
      ? "Unranked"
      : `${profile.rankedTier} ${profile.rankedDivision}`;

  const snapshotRef = useRef<HTMLDivElement>(null);

  const shareTags = useMemo(() => styleDNA.tags.slice(0, 3), [styleDNA.tags]);
  const shareObjectiveEntries = useMemo(
    () => [
      {
        label: "Dragons",
        value: analysis.objectiveLedger?.dragons ?? 0,
        icon: "/images/objectives/gragon.jpeg",
      },
      {
        label: "Barons",
        value: analysis.objectiveLedger?.barons ?? 0,
        icon: "/images/objectives/baronicon.png",
      },
      {
        label: "Towers",
        value: analysis.objectiveLedger?.towers ?? 0,
        icon: "/images/objectives/tower.png",
      },
    ],
    [analysis.objectiveLedger?.barons, analysis.objectiveLedger?.dragons, analysis.objectiveLedger?.towers],
  );
  const shareMomentumGames = useMemo(
    () => analysis.timelineData.slice(-6),
    [analysis.timelineData],
  );
  const shareWinRate = analysis.sample ? Math.round((analysis.wins / analysis.sample) * 100) : 0;
  const snapshotGeneratedOn = useMemo(() => new Date().toLocaleDateString(), []);

  const profileSummary = useMemo(() => {
    const recentWr = analysis.sample ? Math.round((analysis.wins / analysis.sample) * 100) : 0;
    return `Player: ${profile.summonerName}#${profile.tagline}, Rank: ${rankDisplay}, Level: ${profile.level}, Recent WR: ${recentWr}%, Avg KDA: ${analysis.avgKda.toFixed(
      2,
    )}, CS/min: ${analysis.avgCsPerMin.toFixed(2)}`;
  }, [
    analysis.avgCsPerMin,
    analysis.avgKda,
    analysis.sample,
    analysis.wins,
    profile.level,
    profile.summonerName,
    profile.tagline,
    rankDisplay,
  ]);

  return (
    <>
      <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Button
          variant="ghost"
          className="w-fit text-slate-300 hover:text-slate-100"
          onClick={() => router.back()}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
      </div>

      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/90 p-6 shadow-[0_0_50px_rgba(79,70,229,0.25)]">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(99,102,241,0.25),_transparent_55%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-1 flex-col gap-4">
            <div>
              <p className="text-xs uppercase tracking-[0.4em] text-slate-400">
                Match Intelligence Lab • Last 20 Games
              </p>
              <h1 className="mt-2 font-heading text-3xl text-slate-100 md:text-4xl">
                {profile.summonerName}
                <span className="ml-1 text-slate-400/70">#{profile.tagline}</span>
              </h1>
              <p className="text-sm text-slate-300">
                Level {profile.level} • {rankDisplay}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {styleDNA.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="neutral"
                  className="border-violet-500/30 bg-violet-500/10 text-xs uppercase tracking-wide text-violet-100"
                >
                  {tag}
                </Badge>
              ))}
            </div>
            <p className="max-w-xl text-sm text-slate-300/90">
              {styleDNA.description}
            </p>
          </div>
          <div className="flex gap-4">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-6 py-4 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Recent WR
              </p>
              <p className="text-3xl font-semibold text-emerald-300">
                {analysis.sample ? Math.round((analysis.wins / analysis.sample) * 100) : 0}%
              </p>
              <p className="text-xs text-slate-400">{analysis.wins}-{analysis.losses}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-6 py-4 text-center">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">
                Avg KDA
              </p>
              <p className="text-3xl font-semibold text-violet-300">{analysis.avgKda.toFixed(2)}</p>
              <p className="text-xs text-slate-400">
                {(analysis.avgKills).toFixed(1)}/{analysis.avgDeaths.toFixed(1)}/{analysis.avgAssists.toFixed(1)}
              </p>
            </div>
          </div>
        </div>
        <div className="relative mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">20-Game Sample</p>
            <p className="mt-2 text-2xl font-semibold text-slate-100">{analysis.sample} Games</p>
            <p className="text-xs text-slate-400">{analysis.wins}-{analysis.losses} record</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Avg Length</p>
            <p className="mt-2 text-2xl font-semibold text-slate-100">{formatMinutes(analysis.avgGameDuration)}</p>
            <p className="text-xs text-slate-400">Fast wins at {analysis.fastestMatch ? `${analysis.fastestMatch.duration}m` : "—"}</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Avg Gold Earned</p>
            <p className="mt-2 text-2xl font-semibold text-amber-200">{formatGold(analysis.avgGold)}</p>
            <p className="text-xs text-slate-400">Economy built per game</p>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Impact Presence</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-300">{formatPercent(analysis.avgKillParticipation)}</p>
            <p className="text-xs text-slate-400">Kill participation average</p>
          </div>
        </div>
      </section>

      <section className="flex flex-col gap-6">
        <Card className="border-white/10 bg-slate-950/90 shadow-[0_0_60px_rgba(15,23,42,0.35)]">
          <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <CardTitle>Momentum Timeline</CardTitle>
              <CardDescription>
                Trends pulled from your last 20 games: KDA, CS cadence, kill participation, and vision heat
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-col gap-6">
            {timelineCompositeData.length ? (
              <>
                <ScrollArea className="w-full rounded-2xl border border-white/5">
                  <div className="h-72 min-w-[960px] p-4">
                    <ResponsiveContainer>
                      <ComposedChart data={timelineCompositeData}>
                        <defs>
                          <linearGradient id="kdaGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#a78bfa" stopOpacity={0.85} />
                            <stop offset="95%" stopColor="#a78bfa" stopOpacity={0} />
                          </linearGradient>
                          <linearGradient id="csGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#38bdf8" stopOpacity={0.75} />
                            <stop offset="95%" stopColor="#38bdf8" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                        <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 10 }} />
                        <YAxis
                          yAxisId="left"
                          stroke="#64748b"
                          tick={{ fontSize: 10 }}
                          domain={[0, (dataMax: number) => Math.ceil(dataMax + 1)]}
                        />
                        
                        <Tooltip
                          formatter={(value: number, name: string) => {
                            if (name === "CS / min") {
                              return [`${value.toFixed(2)} cs/min`, "CS cadence"];
                            }
                            if (name === "KDA") {
                              return [value.toFixed(2), "KDA"];
                            }
                            if (name === "Kill Participation %") {
                              return [`${value}%`, "Kill Participation"];
                            }
                            if (name === "Vision Score") {
                              return [value, "Vision Score"];
                            }
                            return [value, name];
                          }}
                          contentStyle={{
                            backgroundColor: "rgba(2,6,23,0.95)",
                            border: "1px solid rgba(255,255,255,0.1)",
                            borderRadius: "12px",
                          }}
                        />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="kda"
                          stroke="#c4b5fd"
                          fill="url(#kdaGradient)"
                          name="KDA"
                          strokeWidth={2}
                          activeDot={{ r: 4 }}
                        />
                        <Area
                          yAxisId="left"
                          type="monotone"
                          dataKey="cs"
                          stroke="#38bdf8"
                          fill="url(#csGradient)"
                          name="CS / min"
                          strokeWidth={2}
                          activeDot={{ r: 4 }}
                        />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </ScrollArea>
                <div className="grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
                      <span>KP • Vision</span>
                      <span>per game</span>
                    </div>
                    <div className="mt-2 h-48">
                      <ResponsiveContainer>
                        <LineChart data={analysis.timelineData}>
                          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                          <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 10 }} />
                          <YAxis
                            yAxisId="left"
                            orientation="left"
                            stroke="#a855f7"
                            tick={{ fontSize: 10 }}
                          />
                          <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#22d3ee"
                            tick={{ fontSize: 10 }}
                          />
                          <Tooltip
                            formatter={(value: number, name: string) =>
                              name === "Kill Participation %" ? [`${value}%`, "Kill Participation"] : [value, "Vision Score"]
                            }
                            contentStyle={{
                              backgroundColor: "rgba(2,6,23,0.95)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              borderRadius: "12px",
                            }}
                          />
                          <Line
                            yAxisId="left"
                            type="monotone"
                            dataKey="kp"
                            stroke="#c084fc"
                            strokeWidth={2}
                            dot={false}
                            name="Kill Participation %"
                          />
                          <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="vision"
                            stroke="#22d3ee"
                            strokeWidth={2}
                            dot={false}
                            name="Vision Score"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                    <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
                      <span>Win Streak Pulse</span>
                      <span>positive up</span>
                    </div>
                    <div className="mt-2 h-48">
                      <ResponsiveContainer>
                        <BarChart data={streakChartData}>
                          <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
                          <XAxis dataKey="name" stroke="#475569" tick={{ fontSize: 10 }} />
                          <YAxis stroke="#475569" tick={{ fontSize: 10 }} />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: "rgba(2,6,23,0.95)",
                              border: "1px solid rgba(255,255,255,0.08)",
                              borderRadius: "12px",
                            }}
                          />
                          <ReferenceLine y={0} stroke="#475569" />
                          <defs>
                            <linearGradient id="streakGradient" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#34d399" stopOpacity={0.9} />
                              <stop offset="100%" stopColor="#f87171" stopOpacity={0.9} />
                            </linearGradient>
                          </defs>
                          <Bar dataKey="streak" radius={[4, 4, 4, 4]} fill="url(#streakGradient)" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400">We need a few more matches to chart momentum.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <Card className="border-white/10 bg-slate-950/80">
          <CardHeader>
            <CardTitle>Consistency Gauges</CardTitle>
            <CardDescription>How often you hit high-impact marks</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>High impact games</span>
                <span className="font-semibold text-emerald-300">{formatPercent(analysis.impactRate)}</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800/70">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400"
                  style={{ width: `${Math.min(100, Math.round((analysis.impactRate || 0) * 100))}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">KP ≥ 55% in {Math.round((analysis.impactRate || 0) * analysis.sample)} games</p>
            </div>
            <div>
              <div className="flex items-center justify-between text-sm text-slate-300">
                <span>Low death outings</span>
                <span className="font-semibold text-sky-300">{formatPercent(analysis.survivalRate)}</span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800/70">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-sky-400 to-indigo-400"
                  style={{ width: `${Math.min(100, Math.round((analysis.survivalRate || 0) * 100))}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-slate-500">≤ 4 deaths in {Math.round((analysis.survivalRate || 0) * analysis.sample)} games</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-950/80">
          <CardHeader>
            <CardTitle>Objective Ledger</CardTitle>
            <CardDescription>Team objective haul across the sample</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            {[
              {
                label: "Dragons",
                value: analysis.objectiveLedger?.dragons ?? 0,
                accent: "from-emerald-400/50 via-emerald-500/20 to-teal-500/10",
                icon: "/images/objectives/gragon.jpeg",
              },
              {
                label: "Barons",
                value: analysis.objectiveLedger?.barons ?? 0,
                accent: "from-fuchsia-500/60 via-violet-500/25 to-purple-500/10",
                icon: "/images/objectives/baronicon.png",
              },
              {
                label: "Towers",
                value: analysis.objectiveLedger?.towers ?? 0,
                accent: "from-sky-500/60 via-indigo-500/20 to-slate-500/10",
                icon: "/images/objectives/tower.png",
              },
            ].map((objective) => {
              const perGame =
                analysis.sample > 0 ? objective.value / analysis.sample : 0;
              const perGameDisplay =
                perGame > 0
                  ? perGame >= 10
                    ? perGame.toFixed(1)
                    : perGame.toFixed(2)
                  : "0";

              return (
                <div
                  key={objective.label}
                  className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-950/70 px-4 py-4"
                >
                  <div className={`absolute inset-0 bg-gradient-to-br ${objective.accent} opacity-60`} />
                  <div className="absolute inset-0 bg-slate-950/85" />
                  <div className="relative flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="relative h-12 w-12 overflow-hidden rounded-xl border border-white/10 bg-slate-900/80 shadow-lg shadow-black/40">
                        <Image
                          src={objective.icon}
                          alt={`${objective.label} icon`}
                          fill
                          sizes="48px"
                          className="object-contain"
                          priority={false}
                        />
                      </div>
                      <div>
                        <p className="text-xs uppercase tracking-[0.3em] text-slate-100/70">
                          {objective.label}
                        </p>
                        <p className="text-2xl font-semibold text-slate-50 drop-shadow">
                          {objective.value}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[0.65rem] uppercase tracking-[0.25em] text-slate-200/70">
                        Per game
                      </p>
                      <p className="text-lg font-semibold text-slate-50">
                        {perGameDisplay}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-950/80">
          <CardHeader>
            <CardTitle>Tempo & Economy</CardTitle>
            <CardDescription>Game length + resource control</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-3">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Avg Game</p>
              <p className="text-xl font-semibold text-slate-100">{formatMinutes(analysis.avgGameDuration)}</p>
              <p className="text-xs text-slate-400">Fastest: {analysis.fastestMatch ? `${analysis.fastestMatch.duration}m` : "—"} • Longest: {analysis.longestMatch ? `${analysis.longestMatch.duration}m` : "—"}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-slate-900/60 p-3">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Economy</p>
              <p className="text-xl font-semibold text-amber-200">{formatGold(analysis.avgGold)}</p>
              <p className="text-xs text-slate-400">CS Pace: {analysis.avgCsPerMin.toFixed(2)} / min</p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6">
        <Card className="border-white/10 bg-slate-950/80">
          <CardHeader>
            <CardTitle>Focus Priorities</CardTitle>
            <CardDescription>Actionable habits surfaced from the last twenty games</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {focusRecommendations.map((rec) => (
              <div
                key={rec.title}
                className={cn(
                  "rounded-2xl border px-4 py-3",
                  rec.tone === "positive"
                    ? "border-emerald-400/30 bg-emerald-400/5 text-emerald-100"
                    : "border-amber-400/30 bg-amber-400/5 text-amber-100",
                )}
              >
                <p className="text-xs font-semibold uppercase tracking-[0.3em]">
                  {rec.metric}
                </p>
                <p className="mt-1 text-lg font-semibold">{rec.title}</p>
                <p className="text-sm opacity-80">{rec.detail}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="border-white/10 bg-slate-950/80">
          <CardHeader>
            <CardTitle>Signature Performances</CardTitle>
            <CardDescription>Standout games from this block</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {highlightMatches.length ? (
              highlightMatches.map((entry) => (
                <div
                  key={entry.title}
                  className="flex items-center justify-between rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-violet-400/40">
                      <Image
                        src={entry.data.championIcon}
                        alt={entry.data.championName}
                        fill
                        sizes="48px"
                        className="object-cover"
                      />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{entry.label}</p>
                      <p className="text-base font-semibold text-slate-100">{entry.title}</p>
                      <p className="text-xs text-slate-400">
                        {entry.data.championName} • {entry.data.kda} • {entry.data.csPerMin} cs/min
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                    <p>{entry.data.result}</p>
                    <p>{entry.data.date}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">Play a few matches to surface highlight reels.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-950/80">
          <CardHeader>
            <CardTitle>Clutch Moments</CardTitle>
            <CardDescription>Highest kill-participation outings</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {analysis.clutchMoments.length ? (
              analysis.clutchMoments.map((moment) => (
                <div
                  key={moment.id}
                  className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3"
                >
                  <div className="flex items-center justify-between text-sm text-slate-300">
                    <span>{moment.championName}</span>
                    <span className="font-semibold text-emerald-300">{moment.killParticipation}% KP</span>
                  </div>
                  <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800/60">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-violet-400"
                      style={{ width: `${Math.min(moment.killParticipation, 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-slate-500">
                    {moment.queue} • {moment.kda} • {moment.date}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">Need more games to spotlight clutch plays.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <Card className="border-white/10 bg-slate-950/80">
          <CardHeader>
            <CardTitle>Key Performance Pulse</CardTitle>
            <CardDescription>Digestible deltas for the current match block</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">CS Pace</p>
              <p className="text-2xl font-semibold text-sky-300">{analysis.avgCsPerMin.toFixed(2)}</p>
              <p className="text-xs text-slate-400">per minute</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Vision</p>
              <p className="text-2xl font-semibold text-emerald-300">{analysis.avgVision.toFixed(0)}</p>
              <p className="text-xs text-slate-400">per game</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Kill Participation</p>
              <p className="text-2xl font-semibold text-fuchsia-300">
                {analysis.avgKillParticipation ? Math.round(analysis.avgKillParticipation * 100) : 0}%
              </p>
              <p className="text-xs text-slate-400">team fights</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
              <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Objective Power</p>
              <p className="text-2xl font-semibold text-amber-300">
                {analysis.objectiveRate.toFixed(1)}
              </p>
              <p className="text-xs text-slate-400">drakes + barons / game</p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-white/10 bg-slate-950/80">
          <CardHeader>
            <CardTitle>Recent Runway</CardTitle>
            <CardDescription>
              {recentWindowSize
                ? `Pulse across your last ${recentWindowSize} games`
                : "Pulse across your upcoming games"}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            {recentPerformance ? (
              <>
                <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/15 via-slate-900/90 to-slate-950/90 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Momentum</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-100">
                    {recentPerformance.wins}-{recentPerformance.losses}
                  </p>
                  <p className="text-xs text-slate-400">
                    {recentPerformance.lastResult === "W" ? "Last game: Victory" : "Last game: Defeat"}
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Efficiency</p>
                  <p className="mt-2 text-lg font-semibold text-violet-200">
                    {recentPerformance.avgKda.toFixed(2)} KDA
                  </p>
                  <p className="text-xs text-slate-400">
                    {recentPerformance.avgCs.toFixed(1)} cs/min cadence
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Team Impact</p>
                  <p className="mt-2 text-lg font-semibold text-fuchsia-200">
                    {Math.round(recentPerformance.avgKp)}% KP
                  </p>
                  <p className="text-xs text-slate-400">
                    {recentPerformance.avgVision.toFixed(0)} vision score
                  </p>
                </div>
                <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
                  <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Tempo</p>
                  <p className="mt-2 text-lg font-semibold text-slate-100">
                    {formatMinutes(recentPerformance.avgDuration)}
                  </p>
                  <p className="text-xs text-slate-400">Average game length</p>
                </div>
              </>
            ) : (
              <p className="text-sm text-slate-400">Queue a few more games to unlock recency insights.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 lg:grid-cols-5">
        <Card className="border-white/10 bg-slate-950/80 lg:col-span-3">
          <CardHeader>
            <CardTitle>Recent Match Files</CardTitle>
            <CardDescription>Per-match impact cues for the latest outings</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {analysis.matchCards.length ? (
              <ScrollArea className="h-[36rem] pr-2">
                <div className="flex flex-col gap-3">
                  {analysis.matchCards.map((match) => (
                    <div
                      key={match.id}
                      className="rounded-xl border border-white/10 bg-slate-900/65 px-3 py-3 transition-colors duration-200 hover:border-violet-400/40 hover:bg-slate-900/90"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                        <div className="flex items-start gap-3 sm:items-center">
                          <div className="relative mt-0.5 h-10 w-10 overflow-hidden rounded-xl border border-violet-400/40 sm:mt-0">
                            <Image
                              src={match.championIcon}
                              alt={match.championName}
                              fill
                              sizes="40px"
                              className="object-cover"
                            />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[0.6rem] uppercase tracking-[0.35em] text-slate-500">
                              {match.queue}
                            </p>
                            <p className="truncate text-base font-semibold text-slate-100">
                              {match.championName} • {match.result}
                            </p>
                            <p className="text-xs text-slate-400">
                              {match.date} • {match.duration}m
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-xs text-slate-200 sm:text-sm">
                          <span className="flex items-center gap-1 whitespace-nowrap">
                            <Swords className="h-4 w-4 text-fuchsia-300" />
                            {match.kda}
                          </span>
                          <span className="flex items-center gap-1 whitespace-nowrap">
                            <Target className="h-4 w-4 text-sky-300" />
                            {match.csPerMin} cs/min
                          </span>
                          <span className="flex items-center gap-1 whitespace-nowrap">
                            <TrendingUp className="h-4 w-4 text-emerald-300" />
                            {match.killParticipation}% KP
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <p className="text-sm text-slate-400">No matches yet—queue a few games and come back.</p>
            )}
          </CardContent>
        </Card>
        <div className="flex flex-col gap-6 lg:col-span-2">
          <Card className="border-white/10 bg-slate-950/80 flex h-full flex-col lg:h-[36rem]">
            <CardHeader>
              <CardTitle>Champion Pool Radar</CardTitle>
              <CardDescription>Your staple picks and how they’re landing lately</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden">
              {recentChampionPool.length ? (
                <ScrollArea className="flex-1 pr-2">
                  <div className="flex flex-col gap-4">
                    {recentChampionPool.map((champion) => (
                      <div
                        key={champion.championName}
                        className="flex items-center gap-3 rounded-2xl border border-white/10 bg-slate-900/70 px-3 py-2 transition-colors duration-200 hover:border-fuchsia-400/40 hover:bg-slate-900/90"
                      >
                        <div className="relative h-12 w-12 overflow-hidden rounded-2xl border border-violet-400/30">
                          {champion.icon ? (
                            <Image
                              src={champion.icon}
                              alt={champion.championName}
                              fill
                              sizes="48px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-slate-500">
                              {champion.championName.slice(0, 2)}
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-sm text-slate-300">
                            <p className="font-semibold text-slate-100">{champion.championName}</p>
                            <span className="text-xs text-slate-400">{champion.games} games</span>
                          </div>
                          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-800/60">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-fuchsia-400 via-sky-400 to-emerald-400"
                              style={{ width: `${Math.min(100, Math.round((champion.winRate || 0) * 100))}%` }}
                            />
                          </div>
                          <p className="mt-1 text-xs uppercase tracking-[0.3em] text-slate-500">
                            {Math.round((champion.winRate || 0) * 100)}% win rate
                          </p>
                        </div>
                      </div>
                    ))}
                    <p className="text-xs text-slate-500">
                      Showcasing every champion you piloted across your last {analysis.sample} games.
                    </p>
                  </div>
                </ScrollArea>
              ) : (
                <div className="flex flex-1 items-center justify-center rounded-2xl border border-dashed border-white/10 bg-slate-900/50 p-6 text-center text-sm text-slate-400">
                  Play more unique champions to populate this radar.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      </div>
      <div
        ref={snapshotRef}
        className="pointer-events-none fixed left-[-2000px] top-0 z-[-1] w-[960px] rounded-3xl border border-white/10 bg-slate-950 p-8 text-slate-100 shadow-[0_0_50px_rgba(88,28,135,0.45)]"
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-[0.65rem] uppercase tracking-[0.4em] text-fuchsia-300/70">
              Match Intelligence Lab Snapshot
            </p>
            <h2 className="mt-3 font-heading text-4xl font-semibold text-slate-50">
              {profile.summonerName}
              <span className="ml-1 text-slate-400/80">#{profile.tagline}</span>
            </h2>
            <p className="mt-2 text-sm text-slate-300/90">
              Level {profile.level} • {rankDisplay}
            </p>
            {shareTags.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {shareTags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-fuchsia-400/40 bg-fuchsia-500/10 px-3 py-1 text-xs uppercase tracking-wide text-fuchsia-100"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : null}
          </div>
          <div className="rounded-3xl border border-white/10 bg-slate-900/80 px-6 py-4 text-right shadow-[0_10px_30px_rgba(79,70,229,0.25)]">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400/80">
              Last {analysis.sample} Games
            </p>
            <p className="mt-3 text-4xl font-semibold text-emerald-300">{shareWinRate}% WR</p>
            <p className="text-sm text-slate-300">
              {analysis.wins}-{analysis.losses}
            </p>
          </div>
        </div>

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">Momentum Timeline</p>
            {shareMomentumGames.length ? (
              <div className="mt-3 space-y-3 text-sm text-slate-200">
                <div className="rounded-xl border border-violet-400/30 bg-violet-500/10 px-3 py-2 text-slate-100">
                  <p className="text-[0.6rem] uppercase tracking-[0.3em] text-violet-200/80">Impact Pulse</p>
                  <p className="text-2xl font-semibold text-violet-100">
                    {Math.round(analysis.avgKillParticipation * 100)}% KP
                  </p>
                  <p className="text-xs text-slate-300/80">Across {analysis.sample} matches</p>
                </div>
                {recentPerformance ? (
                  <div className="rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-xs text-slate-300">
                    <p className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-400/80">Recent 5</p>
                    <p className="text-base font-semibold text-slate-100">
                      {recentPerformance.wins}-{recentPerformance.losses}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      {recentPerformance.avgKda.toFixed(2)} KDA • {recentPerformance.avgCs.toFixed(2)} cs/min •{" "}
                      {Math.round(recentPerformance.avgKp)}% KP • {formatMinutes(recentPerformance.avgDuration)}
                    </p>
                  </div>
                ) : null}
                <div>
                  <p className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-400/80">Latest games</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {shareMomentumGames
                      .slice()
                      .reverse()
                      .map((game) => (
                        <div
                          key={game.name}
                          className={cn(
                            "flex h-12 w-12 flex-col items-center justify-center rounded-xl border text-xs font-semibold",
                            game.result === "W"
                              ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-100"
                              : "border-rose-400/40 bg-rose-400/10 text-rose-100",
                          )}
                        >
                          <span>{game.result}</span>
                          <span className="text-[0.55rem] uppercase tracking-[0.3em] text-slate-300/80">
                            {game.name}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
                <ul className="space-y-1 text-xs text-slate-300">
                  {shareMomentumGames.slice(-1).map((lastGame) => (
                    <li key={`${lastGame.name}-summary`}>
                      Last game: {lastGame.kda.toFixed(2)} KDA • {lastGame.cs.toFixed(1)} cs/min •{" "}
                      {Math.round(lastGame.kp)}% KP
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p className="mt-3 text-sm text-slate-400">Queue more matches to chart momentum.</p>
            )}
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">Objective Ledger</p>
            <p className="mt-1 text-xs text-slate-400">
              Team takes secured during this match block.
            </p>
            <div className="mt-3 flex flex-col gap-3">
              {shareObjectiveEntries.map((objective) => {
                const perGame =
                  analysis.sample > 0 ? (objective.value / analysis.sample).toFixed(objective.value >= 10 ? 1 : 2) : "0";
                return (
                  <div
                    key={objective.label}
                    className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-slate-900">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={objective.icon}
                          alt={`${objective.label} icon`}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-[0.65rem] uppercase tracking-[0.3em] text-slate-400/80">
                          {objective.label}
                        </p>
                        <p className="text-xl font-semibold text-slate-50">{objective.value}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-400/80">Per game</p>
                      <p className="text-xs text-slate-300">{perGame}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
            <p className="text-xs uppercase tracking-[0.35em] text-slate-400/80">Signature Performances</p>
            <div className="mt-3 flex flex-col gap-3">
              {highlightMatches.length ? (
                highlightMatches.slice(0, 3).map((entry) => (
                  <div
                    key={entry.title}
                    className="flex items-center justify-between rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative h-10 w-10 overflow-hidden rounded-xl border border-violet-400/30">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={entry.data.championIcon}
                          alt={entry.data.championName}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <p className="text-[0.6rem] uppercase tracking-[0.3em] text-slate-400/80">{entry.label}</p>
                        <p className="text-sm font-semibold text-slate-100">{entry.title}</p>
                        <p className="text-xs text-slate-400">
                          {entry.data.championName} • {entry.data.kda} • {entry.data.csPerMin} cs/min •{" "}
                          {Math.round(entry.data.killParticipation)}% KP
                        </p>
                      </div>
                    </div>
                    <div className="text-right text-xs text-slate-400">
                      <p>{entry.data.result}</p>
                      <p>{entry.data.date}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-slate-400">
                  Play a few more matches to spotlight your standout games.
                </p>
              )}
            </div>
          </section>
        </div>

        <div className="mt-8 rounded-2xl border border-slate-700/60 bg-slate-950/80 px-4 py-3 text-[0.65rem] uppercase tracking-[0.4em] text-slate-500">
          Generated with Rewind Coach • {snapshotGeneratedOn}
        </div>
      </div>

      <ProfileCoachChat
        puuid={puuid}
        gameName={profile.summonerName}
        tagLine={profile.tagline}
        profileSummary={profileSummary}
      />

    </>
  );
}
