"use client";

import { useMemo, useState, useEffect } from "react";
import Image from "next/image";
import { ArrowLeft, Trophy, Target, Zap, Shield, Flame, ChevronDown, Award, Clock, Package, Skull, HeartHandshake, Share2, Download, Link } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const [currentPage, setCurrentPage] = useState(0);

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

  // Track current page
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const container = document.querySelector('.chronicle-container');
    if (!container) return;

    const handleScroll = () => {
      const scrollPosition = container.scrollTop;
      const pageHeight = window.innerHeight;
      const newPage = Math.floor(scrollPosition / pageHeight);
      setCurrentPage(newPage);
    };

    handleScroll();
    container.addEventListener('scroll', handleScroll, { passive: true });
    return () => container.removeEventListener('scroll', handleScroll);
  }, []);

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
        qCasts: 0, // Not available in calculated stats
        wCasts: 0, // Not available in calculated stats
        eCasts: 0, // Not available in calculated stats
        rCasts: 0, // Not available in calculated stats
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
          qCasts: champStats.qCasts || 0,
          wCasts: champStats.wCasts || 0,
          eCasts: champStats.eCasts || 0,
          rCasts: champStats.rCasts || 0,
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
      .slice(0, 5)
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

  // Download page as image
  const downloadPageAsImage = async (pageIndex: number, pageName: string) => {
    try {
      const { default: html2canvas } = await import('html2canvas');
      const pages = document.querySelectorAll('section');
      const page = pages[pageIndex];
      
      if (!page) return;

      const canvas = await html2canvas(page as HTMLElement, {
        backgroundColor: '#020617',
        scale: 2,
      });
      
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${pageName}-${summoner.summonerName}.png`;
      link.href = url;
      link.click();
    } catch (error) {
      console.error('Error downloading page:', error);
    }
  };

  // Download entire chronicle as one image
  const downloadFullChronicle = async () => {
    try {
      const { default: html2canvas } = await import('html2canvas');
      const container = document.querySelector('.chronicle-container');
      
      if (!container) return;

      const canvas = await html2canvas(container as HTMLElement, {
        backgroundColor: '#020617',
        scale: 2,
        scrollX: 0,
        scrollY: 0,
        height: container.scrollHeight,
      });
      
      const url = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `${summoner.summonerName}-Chronicle-2025.png`;
      link.href = url;
      link.click();
    } catch (error) {
      console.error('Error downloading full chronicle:', error);
    }
  };

  // Copy shareable link to clipboard
  const copyShareableLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    // You could add a toast notification here
    alert('Link copied to clipboard!');
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
    <div className="chronicle-container relative h-screen w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth scrollbar-hide">
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

      {/* Share Button Component */}
      <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-right-5 duration-500">
        <div className="flex gap-2">
          {(currentPage >= 0 && currentPage < 4) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => downloadPageAsImage(currentPage, `Page-${currentPage + 1}`)}
              className="bg-slate-950/80 backdrop-blur-sm text-slate-300 hover:text-slate-100 border border-white/10 transition-all duration-300 hover:scale-105"
            >
              <Download className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Page 1: Landing Page */}
      <section className="relative h-screen w-full snap-start snap-always overflow-hidden">
        {/* Website Background System */}
        <div className="absolute inset-0 z-0 bg-slate-950/95">
          {/* Radial gradient overlay */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.3),transparent_65%)]" />
          {/* Background image with opacity */}
          <div className="absolute inset-0 opacity-30">
            <Image
              src="/images/background.png"
              alt="Summoner's Rift background"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 h-full flex items-center justify-center px-8">
          <div className="max-w-6xl w-full flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-1000">
            {/* Hero Content Card */}
            <div className="relative w-full max-w-4xl overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-slate-950/90 via-slate-900/90 to-slate-950/90 p-8 shadow-[0_0_80px_rgba(99,102,241,0.3)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-200">
              {/* Glow effect */}
              <div className="pointer-events-none absolute -top-40 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-violet-500/30 blur-3xl" />
              
              {/* Summoner Info */}
              <div className="relative flex items-center gap-8 mb-6 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-400">
                {/* Profile Icon */}
                <div className="relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-3xl border-4 border-violet-400/50 shadow-[0_20px_60px_rgba(124,58,237,0.4)] transition-all duration-300 hover:scale-105 hover:shadow-[0_20px_80px_rgba(124,58,237,0.6)]">
                  <Image
                    src={summoner.profileIcon}
                    alt={`${summoner.summonerName} icon`}
                    fill
                    className="object-cover"
                  />
                </div>
                
                {/* Summoner Details */}
                <div className="flex flex-col gap-2 flex-1">
                  <h2 className="text-4xl font-bold text-slate-100 leading-tight">
                    {summoner.summonerName}
                  </h2>
                  <p className="text-xl text-slate-400 font-medium">
                    #{summoner.tagline}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/20 border border-violet-400/30">
                      <Trophy className="h-4 w-4 text-violet-400" />
                      <span className="text-slate-200 text-sm font-medium">{displaySeasonStats.gamesPlayed} Games</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/20 border border-green-400/30">
                      <span className="text-green-400 text-sm font-bold">{Math.round(displaySeasonStats.winRate * 100)}%</span>
                      <span className="text-slate-300 text-sm">Win Rate</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Main Heading */}
              <div className="relative text-center animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-600">
                <h1 className="font-heading text-6xl md:text-7xl lg:text-8xl text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 tracking-tight mb-4 drop-shadow-[0_10px_40px_rgba(139,92,246,0.5)]">
                  Let&apos;s Rewind 2025
                </h1>
                <p className="text-xl md:text-2xl text-slate-300 font-light tracking-wide">
                  Your journey through the rift awaits
                </p>
              </div>

              {/* Stats Preview */}
              <div className="relative grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-slate-700 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-800">
                <div className="text-center p-4 rounded-xl bg-slate-800/40 backdrop-blur-sm border border-violet-400/10 hover:border-violet-400/30 transition-all duration-300 hover:scale-105">
                  <p className="text-3xl font-bold text-cyan-400 mb-1">
                    {(displaySeasonStats.avgKills + displaySeasonStats.avgAssists).toFixed(0)}
                  </p>
                  <p className="text-sm text-slate-400 uppercase tracking-wide">Avg Takedowns</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-slate-800/40 backdrop-blur-sm border border-violet-400/10 hover:border-violet-400/30 transition-all duration-300 hover:scale-105">
                  <p className="text-3xl font-bold text-purple-400 mb-1">
                    {displaySeasonStats.avgKda.toFixed(1)}
                  </p>
                  <p className="text-sm text-slate-400 uppercase tracking-wide">Avg KDA</p>
                </div>
                <div className="text-center p-4 rounded-xl bg-slate-800/40 backdrop-blur-sm border border-violet-400/10 hover:border-violet-400/30 transition-all duration-300 hover:scale-105">
                  <p className="text-3xl font-bold text-orange-400 mb-1">
                    {displaySeasonStats.topChampions.length}
                  </p>
                  <p className="text-sm text-slate-400 uppercase tracking-wide">Champions</p>
                </div>
              </div>
            </div>

            {/* Scroll Indicator */}
            <div className="flex flex-col items-center gap-3 animate-bounce animate-in fade-in duration-1000 delay-1000">
              <div className="flex flex-col items-center gap-1">
                <ChevronDown className="h-6 w-6 text-violet-400 animate-pulse" />
                <ChevronDown className="h-4 w-4 text-violet-400/60 animate-pulse" style={{ animationDelay: '0.15s' }} />
              </div>
              <span className="text-sm text-slate-300 uppercase tracking-wider font-medium">Explore Your Chronicle</span>
            </div>
          </div>
        </div>
      </section>

      {/* Page 2: Season Champion Pool */}
      <section className="relative h-screen w-full snap-start snap-always overflow-hidden">
        {/* Website Background System */}
        <div className="absolute inset-0 z-0 bg-slate-950/95">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.3),transparent_65%)]" />
          <div className="absolute inset-0 opacity-30">
            <Image
              src="/images/background.png"
              alt="Summoner's Rift background"
              fill
              className="object-cover"
            />
          </div>
        </div>

        <div className="relative z-10 h-full flex flex-col justify-center px-8 py-4">
          <div className="mx-auto max-w-7xl w-full">
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400 mb-2 text-center animate-in fade-in slide-in-from-top-5 duration-700">
              Season Champion Pool
            </h2>
            <p className="text-base text-slate-400 text-center mb-3 animate-in fade-in duration-700 delay-150">
              Your most played champions this season
            </p>
            
            <div className="flex flex-col gap-3 max-h-[560px] overflow-y-auto scrollbar-hide">
              {displaySeasonStats.topChampions.slice(0, 5).map((champ, index) => (
                <div
                  key={champ.name}
                  className="relative h-[240px] overflow-hidden rounded-xl border border-violet-400/30 shadow-lg hover:shadow-violet-500/30 transition-all duration-500 hover:scale-[1.02] hover:border-violet-400/60 animate-in fade-in slide-in-from-left-10 duration-700"
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
                  <div className="relative h-full flex flex-col justify-between py-4 px-6">
                    {/* Top Section - Rank, Name, Stats */}
                    <div className="flex items-center gap-4">
                      {/* Rank Indicator */}
                      <div className="text-3xl font-bold text-violet-400 transition-all duration-300 hover:scale-110">
                        #{index + 1}
                      </div>
                      
                      {/* Champion Name */}
                      <div className="flex flex-col">
                        <span className="text-xl font-bold text-slate-100 transition-all duration-300">{champ.name}</span>
                      </div>
                      
                      {/* Champion Stats - Horizontal Compact Layout */}
                      <div className="flex items-top gap-4 text-sm ml-auto">
                        <div className="flex flex-col items-center transition-all duration-300 hover:scale-110">
                          <span className="text-xs text-slate-400 uppercase tracking-wide">Games</span>
                          <span className="text-lg font-bold text-slate-100">{champ.games}</span>
                        </div>
                        
                        <div className="flex flex-col items-center transition-all duration-300 hover:scale-110">
                          <span className="text-xs text-slate-400 uppercase tracking-wide">Win Rate</span>
                          <span className={`text-lg font-bold ${champ.winRate >= 0.55 ? 'text-green-400' : champ.winRate >= 0.45 ? 'text-slate-100' : 'text-red-400'}`}>
                            {Math.round(champ.winRate * 100)}%
                          </span>
                        </div>
                        
                        <div className="flex flex-col items-center transition-all duration-300 hover:scale-110">
                          <span className="text-xs text-slate-400 uppercase tracking-wide">Damage</span>
                          <span className="text-lg font-bold text-orange-400">
                            {(champ.totalDamage / 1000).toFixed(0)}k
                          </span>
                        </div>
                        
                        <div className="flex flex-col items-center transition-all duration-300 hover:scale-110">
                          <span className="text-xs text-slate-400 uppercase tracking-wide">Takedowns</span>
                          <span className="text-lg font-bold text-cyan-400">{champ.totalTakedowns}</span>
                        </div>

                        {/* Multikills Column */}
                        {(champ.pentaKills > 0 || champ.quadraKills > 0 || champ.tripleKills > 0 || champ.doubleKills > 0) && (
                          <div className="flex flex-col transition-all duration-300 hover:scale-110">
                            <span className="text-xs text-slate-400 uppercase tracking-wide">Multikills</span>
                            <div className="flex flex-col gap-0.5 mt-1">
                              {champ.pentaKills > 0 && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-yellow-500/20 border border-yellow-500/40">
                                  <span className="text-yellow-400 font-bold text-[10px]">{champ.pentaKills}</span>
                                  <span className="text-yellow-300 text-[10px]">Penta</span>
                                </div>
                              )}
                              {champ.quadraKills > 0 && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-purple-500/20 border border-purple-500/40">
                                  <span className="text-purple-400 font-bold text-[10px]">{champ.quadraKills}</span>
                                  <span className="text-purple-300 text-[10px]">Quadra</span>
                                </div>
                              )}
                              {champ.tripleKills > 0 && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/20 border border-cyan-500/40">
                                  <span className="text-cyan-400 font-bold text-[10px]">{champ.tripleKills}</span>
                                  <span className="text-cyan-300 text-[10px]">Triple</span>
                                </div>
                              )}
                              {champ.doubleKills > 0 && (
                                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/20 border border-blue-500/40">
                                  <span className="text-blue-400 font-bold text-[10px]">{champ.doubleKills}</span>
                                  <span className="text-blue-300 text-[10px]">Double</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Bottom Section - Ability Icons */}
                    {(champ.qCasts > 0 || champ.wCasts > 0 || champ.eCasts > 0 || champ.rCasts > 0) && (
                      <div className="flex flex-col gap-2 mt-2">
                        <span className="text-xs text-slate-400 uppercase tracking-wide">Ability Casts</span>
                        <div className="flex items-center gap-3">
                          {champ.qCasts > 0 && (
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-red-400/50 bg-slate-900/80 hover:scale-110 transition-all duration-300">
                              <Image
                                src={`https://ddragon.leagueoflegends.com/cdn/15.21.1/img/spell/${champ.name}Q.png`}
                                alt="Q Ability"
                                fill
                                className="object-cover"
                              />
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="text-white font-bold text-xs">{champ.qCasts.toLocaleString()}</span>
                              </div>
                            </div>
                          )}
                          {champ.wCasts > 0 && (
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-blue-400/50 bg-slate-900/80 hover:scale-110 transition-all duration-300">
                              <Image
                                src={`https://ddragon.leagueoflegends.com/cdn/15.21.1/img/spell/${champ.name}W.png`}
                                alt="W Ability"
                                fill
                                className="object-cover"
                              />
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="text-white font-bold text-xs">{champ.wCasts.toLocaleString()}</span>
                              </div>
                            </div>
                          )}
                          {champ.eCasts > 0 && (
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-green-400/50 bg-slate-900/80 hover:scale-110 transition-all duration-300">
                              <Image
                                src={`https://ddragon.leagueoflegends.com/cdn/15.21.1/img/spell/${champ.name}E.png`}
                                alt="E Ability"
                                fill
                                className="object-cover"
                              />
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="text-white font-bold text-xs">{champ.eCasts.toLocaleString()}</span>
                              </div>
                            </div>
                          )}
                          {champ.rCasts > 0 && (
                            <div className="relative w-16 h-16 rounded-lg overflow-hidden border-2 border-purple-400/50 bg-slate-900/80 hover:scale-110 transition-all duration-300">
                              <Image
                                src={`https://ddragon.leagueoflegends.com/cdn/15.21.1/img/spell/${champ.name}R.png`}
                                alt="R Ability"
                                fill
                                className="object-cover"
                              />
                              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="text-white font-bold text-xs">{champ.rCasts.toLocaleString()}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
                    </div>
          </div>
        </div>
      </section>

      {/* Page 3: Summoner Spells Stats */}
      <section className="relative h-screen w-full snap-start snap-always overflow-hidden">
        {/* Website Background System */}
        <div className="absolute inset-0 z-0 bg-slate-950/95">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.3),transparent_65%)]" />
          <div className="absolute inset-0 opacity-30">
            <Image
              src="/images/background.png"
              alt="Summoner's Rift background"
              fill
              className="object-cover"
            />
          </div>
        </div>

        <div className="relative z-10 h-full flex flex-col justify-center px-8 py-4">
          <div className="mx-auto max-w-7xl w-full">
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400 mb-2 text-center animate-in fade-in slide-in-from-top-5 duration-700">
              Summoner Spells
            </h2>
            <p className="text-base text-slate-400 text-center mb-3 animate-in fade-in duration-700 delay-150">
              Your most used summoner spells this season
            </p>
            
            {isLoadingSeasonStats ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-slate-400">Loading summoner spell stats...</p>
              </div>
            ) : topSummonerSpells.length > 0 ? (
              <>
                {/* First row with 3 spells */}
                <div className="grid gap-4 grid-cols-1 md:grid-cols-3 max-w-7xl mx-auto mb-2">
                  {topSummonerSpells.slice(0, 3).map((spell, index) => (
                    <div
                      key={spell.name}
                      className="relative h-48 overflow-hidden rounded-2xl border-2 border-violet-400/40 bg-slate-900/50 shadow-lg hover:shadow-violet-500/40 transition-all duration-500 hover:scale-105 hover:border-violet-400/80 animate-in zoom-in duration-700"
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
                      
                      {/* Total casts overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center transition-transform duration-500 hover:scale-110">
                          <span className="block text-5xl font-extrabold text-white/80 tracking-tighter drop-shadow-2xl">
                          {spell.totalCasts}
                        </span>
                          <span className="block text-sm font-semibold text-slate-300 uppercase tracking-wider mt-1">
                            Casts
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Second row with 2 spells - centered, rectangular */}
                <div className="flex justify-center gap-4 mt-2">
                  {topSummonerSpells.slice(3, 5).map((spell, index) => (
                    <div
                      key={spell.name}
                      className="relative h-40 w-[calc((100vw-10rem)/2.2)] max-w-[450px] min-w-[280px] overflow-hidden rounded-2xl border-2 border-violet-400/40 bg-slate-900/50 shadow-lg hover:shadow-violet-500/40 transition-all duration-500 hover:scale-105 hover:border-violet-400/80 animate-in zoom-in duration-700"
                      style={{
                        backgroundImage: `url('${spell.icon}')`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        backgroundRepeat: 'no-repeat',
                        animationDelay: `${(index + 3) * 150 + 300}ms`,
                      }}
                    >
                      {/* Dark overlay to reduce brightness */}
                      <div className="absolute inset-0 bg-gradient-to-br from-black/60 via-black/40 to-transparent transition-all duration-500 hover:from-black/50" />
                      
                      {/* Total casts overlay */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="text-center transition-transform duration-500 hover:scale-110">
                          <span className="block text-5xl font-extrabold text-white/80 tracking-tighter drop-shadow-2xl">
                          {spell.totalCasts}
                        </span>
                          <span className="block text-sm font-semibold text-slate-300 uppercase tracking-wider mt-1">
                            Casts
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Funny caption */}
                <p className="text-base text-slate-400 text-center mt-2 animate-in fade-in duration-700 delay-750">
                  Don&apos;t worry! We will not tell anyone how many of those flashes hit the walls!
                </p>
              </>
            ) : (
              <div className="flex items-center justify-center py-12">
                <p className="text-slate-400">No summoner spell data available</p>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Page 4: Season Summary */}
      <section className="relative h-screen w-full snap-start snap-always overflow-hidden">
        {/* Website Background System */}
        <div className="absolute inset-0 z-0 bg-slate-950/95">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.3),transparent_65%)]" />
          <div className="absolute inset-0 opacity-30">
            <Image
              src="/images/background.png"
              alt="Summoner's Rift background"
              fill
              className="object-cover"
            />
          </div>
        </div>

        <div className="relative z-10 h-full flex flex-col justify-center px-8 py-4 scroll-smooth overflow-hidden">
          <div className="mx-auto max-w-7xl w-full">
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400 mb-2 text-center animate-in fade-in slide-in-from-top-5 duration-700">
              Season Summary
            </h2>
            
            {/* Most Played With Section */}
            <div className="mb-3">
              <h3 className="text-2xl font-bold text-slate-100 mb-2 text-center animate-in fade-in slide-in-from-top-5 duration-700">Most Played With</h3>
            {isLoadingSeasonStats ? (
              <div className="flex items-center justify-center py-12">
                <p className="text-slate-400">Loading teammates...</p>
              </div>
              ) : playersWithTakedowns.length > 0 ? (
                <>
                  <div className="grid gap-4 grid-cols-1 md:grid-cols-3 max-w-4xl mx-auto mb-2">
                    {playersWithTakedowns.map((player, index) => (
                      <div 
                        key={player.riotId} 
                        className="border border-violet-400/30 bg-slate-900/70 rounded-xl p-4 hover:shadow-lg hover:shadow-violet-500/30 transition-all duration-500 hover:scale-105 hover:border-violet-400/60 animate-in fade-in zoom-in duration-700"
                        style={{ animationDelay: `${index * 150 + 300}ms` }}
                      >
                        <div className="flex flex-col gap-3">
                      <div className="flex items-center gap-3">
                            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-purple-600 text-xl font-bold text-white shadow-lg transition-transform duration-300 hover:scale-110">
                          #{index + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                              <h3 className="text-base font-semibold text-slate-100 truncate transition-colors duration-300">
                            {player.summonerName}
                          </h3>
                          <p className="text-xs text-slate-400">
                            {player.gamesPlayed} {player.gamesPlayed === 1 ? 'game' : 'games'} together
                          </p>
                        </div>
                      </div>
                          
                          {/* Individual Takedowns */}
                          <div className="border-t border-violet-400/20 pt-2 mt-1">
                            <p className="text-center text-slate-300">
                              <span className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
                                {player.takedowns}
                              </span>
                              {' '}
                              <span className="text-xs text-slate-400">enemies taken down</span>
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
            
            {/* Season Stats from season stats.txt */}
            {seasonStats?.overallStats && (
              <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Personal Records */}
                {(seasonStats.overallStats.mostKills || seasonStats.overallStats.mostDeaths || seasonStats.overallStats.mostAssists) && (
                  <div className="border border-violet-400/30 bg-slate-900/70 rounded-xl p-4 transition-all duration-500 hover:shadow-lg hover:shadow-violet-500/30 hover:border-violet-400/60 animate-in fade-in zoom-in duration-700 delay-500">
                    <div className="flex items-center gap-2 mb-3">
                      <Award className="h-4 w-4 text-yellow-400" />
                      <h4 className="text-lg font-bold text-slate-100">Personal Records</h4>
                    </div>
                    <div className="space-y-2">
                      {seasonStats.overallStats.mostKills && (
                        <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded border-green-500/20">
                          <div className="flex items-center gap-2">
                            <Flame className="h-4 w-4 text-green-400" />
                            <div>
                              <p className="text-xs text-slate-400">Most Kills</p>
                              <p className="text-sm font-semibold text-slate-100">{seasonStats.overallStats.mostKills.champion}</p>
                            </div>
                          </div>
                          <p className="text-2xl font-bold text-green-400">{seasonStats.overallStats.mostKills.value}</p>
                        </div>
                      )}
                      {seasonStats.overallStats.mostAssists && (
                        <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded border-blue-500/20">
                          <div className="flex items-center gap-2">
                            <HeartHandshake className="h-4 w-4 text-blue-400" />
                            <div>
                              <p className="text-xs text-slate-400">Most Assists</p>
                              <p className="text-sm font-semibold text-slate-100">{seasonStats.overallStats.mostAssists.champion}</p>
                            </div>
                          </div>
                          <p className="text-2xl font-bold text-blue-400">{seasonStats.overallStats.mostAssists.value}</p>
                        </div>
                      )}
                      {seasonStats.overallStats.mostDeaths && (
                        <div className="flex items-center justify-between p-2 bg-slate-800/50 rounded border-red-500/20">
                          <div className="flex items-center gap-2">
                            <Skull className="h-4 w-4 text-red-400" />
                            <div>
                              <p className="text-xs text-slate-400">Most Deaths</p>
                              <p className="text-sm font-semibold text-slate-100">{seasonStats.overallStats.mostDeaths.champion}</p>
                            </div>
                          </div>
                          <p className="text-2xl font-bold text-red-400">{seasonStats.overallStats.mostDeaths.value}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Game Duration & Total CS */}
                <div className="space-y-4">
                  {(seasonStats.overallStats.longestGameDuration || seasonStats.overallStats.shortestGameDuration) && (
                    <div className="border border-violet-400/30 bg-slate-900/70 rounded-xl p-4 transition-all duration-500 hover:shadow-lg hover:shadow-violet-500/30 hover:border-violet-400/60">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-purple-400" />
                        <h4 className="text-lg font-bold text-slate-100">Game Durations</h4>
                      </div>
                      <div className="space-y-2">
                        {seasonStats.overallStats.longestGameDuration && (
                          <div className="flex justify-between text-xs p-2 bg-slate-800/50 rounded">
                            <span className="text-slate-400">Longest Game</span>
                            <span className="font-semibold text-purple-400">
                              {Math.floor(seasonStats.overallStats.longestGameDuration / 60)}:{String(seasonStats.overallStats.longestGameDuration % 60).padStart(2, '0')}
                            </span>
                          </div>
                        )}
                        {seasonStats.overallStats.shortestGameDuration && (
                          <div className="flex justify-between text-xs p-2 bg-slate-800/50 rounded">
                            <span className="text-slate-400">Shortest Game</span>
                            <span className="font-semibold text-cyan-400">
                              {Math.floor(seasonStats.overallStats.shortestGameDuration / 60)}:{String(seasonStats.overallStats.shortestGameDuration % 60).padStart(2, '0')}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {seasonStats.overallStats.totalCS && (
                    <div className="border border-violet-400/30 bg-slate-900/70 rounded-xl p-4 transition-all duration-500 hover:shadow-lg hover:shadow-violet-500/30 hover:border-violet-400/60">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="h-4 w-4 text-orange-400" />
                        <h4 className="text-lg font-bold text-slate-100">Total CS</h4>
                      </div>
                      <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-400">
                        {seasonStats.overallStats.totalCS.toLocaleString()}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        across {seasonStats.overallStats.totalMatches} games
                      </p>
                    </div>
                  )}
                </div>

                {/* Top Items */}
                {seasonStats.overallStats.topItems && seasonStats.overallStats.topItems.length > 0 && (
                  <div className="md:col-span-2 border border-violet-400/30 bg-slate-900/70 rounded-xl p-4 transition-all duration-500 hover:shadow-lg hover:shadow-violet-500/30 hover:border-violet-400/60">
                    <div className="flex items-center gap-2 mb-3">
                      <Package className="h-4 w-4 text-cyan-400" />
                      <h4 className="text-lg font-bold text-slate-100">Most Purchased Items</h4>
                    </div>
                    <div className="grid gap-3 grid-cols-5">
                      {seasonStats.overallStats.topItems.slice(0, 5).map((item, index) => (
                        <div
                          key={item.itemId}
                          className="relative flex flex-col items-center gap-1 p-2 bg-slate-800/50 rounded border-cyan-500/20 hover:border-cyan-400/40 transition-all duration-300 hover:scale-105"
                        >
                          <div className="absolute top-0.5 left-0.5 bg-cyan-500 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center z-10">
                            {index + 1}
                          </div>
                          <Image
                            src={`https://ddragon.leagueoflegends.com/cdn/15.21.1/img/item/${item.itemId}.png`}
                            alt={`Item ${item.itemId}`}
                            width={40}
                            height={40}
                            className="rounded"
                          />
                          <div className="text-center">
                            <p className="text-[10px] font-semibold text-slate-200">{item.gamesBought}</p>
                            <p className="text-[10px] text-slate-400">games</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Page 5: Share & Download */}
      <section className="relative h-screen w-full snap-start snap-always overflow-hidden">
        {/* Website Background System */}
        <div className="absolute inset-0 z-0 bg-slate-950/95">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(99,102,241,0.3),transparent_65%)]" />
          <div className="absolute inset-0 opacity-30">
            <Image
              src="/images/background.png"
              alt="Summoner's Rift background"
              fill
              className="object-cover"
            />
          </div>
        </div>

        <div className="relative z-10 h-full flex items-center justify-center px-8 py-4">
          <div className="max-w-4xl w-full">
            {/* Heading */}
            <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <h2 className="text-5xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 mb-4 tracking-tight drop-shadow-[0_10px_40px_rgba(139,92,246,0.5)]">
                Share Your Chronicle
              </h2>
              <p className="text-xl text-slate-300 font-light">
                Download your journey or share it with the world
              </p>
            </div>

            {/* Download/Share Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Download Full Chronicle */}
              <div className="border border-violet-400/30 bg-slate-900/70 rounded-2xl p-8 hover:shadow-lg hover:shadow-violet-500/30 transition-all duration-500 hover:border-violet-400/60 animate-in fade-in slide-in-from-left-8 duration-700">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative h-20 w-20 flex items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg">
                    <Download className="h-10 w-10 text-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-slate-100 mb-2">Download Chronicle</h3>
                    <p className="text-slate-400 mb-6">
                      Get your complete 2025 season chronicle as a high-quality image
                    </p>
                  </div>
                  <Button
                    onClick={downloadFullChronicle}
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white font-semibold px-8 py-6 text-lg transition-all duration-300 hover:scale-105"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Download Full Chronicle
                  </Button>
                </div>
              </div>

              {/* Share Link */}
              <div className="border border-violet-400/30 bg-slate-900/70 rounded-2xl p-8 hover:shadow-lg hover:shadow-violet-500/30 transition-all duration-500 hover:border-violet-400/60 animate-in fade-in slide-in-from-right-8 duration-700">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative h-20 w-20 flex items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg">
                    <Link className="h-10 w-10 text-white" />
                  </div>
                  <div className="text-center">
                    <h3 className="text-2xl font-bold text-slate-100 mb-2">Share Link</h3>
                    <p className="text-slate-400 mb-6">
                      Copy a shareable link to your chronicle
                    </p>
                  </div>
                  <Button
                    onClick={copyShareableLink}
                    className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold px-8 py-6 text-lg transition-all duration-300 hover:scale-105"
                  >
                    <Link className="mr-2 h-5 w-5" />
                    Copy Shareable Link
                  </Button>
                </div>
              </div>
            </div>

            {/* Footer Message */}
            <div className="text-center mt-12 animate-in fade-in duration-700 delay-300">
              <p className="text-lg text-slate-400 font-light">
                Your journey through the rift, captured forever
              </p>
              <div className="flex items-center justify-center gap-2 mt-4">
                <Trophy className="h-5 w-5 text-yellow-400" />
                <span className="text-slate-300">
                  {displaySeasonStats.wins} Wins • {displaySeasonStats.losses} Losses
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
