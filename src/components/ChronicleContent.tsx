"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy, Target, Flame, ChevronDown, Award, Clock, Package, Skull, HeartHandshake, Share2, Download, Link, Crown, Sparkles, Crosshair, Swords } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import type { ProfileBundle, SeasonStatsResponse } from "@/lib/riot";

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
  const { profile: summoner, puuid } = bundle;
  const [seasonStats, setSeasonStats] = useState<SeasonStatsResponse | null>(null);
  const [isLoadingSeasonStats, setIsLoadingSeasonStats] = useState(true);
  const [currentPage, setCurrentPage] = useState(0);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch season stats ONLY from AWS Lambda API
  useEffect(() => {
    const loadSeasonStats = async () => {
      try {
        const response = await fetch(`/api/season-rewind?gameName=${encodeURIComponent(summoner.summonerName)}&tagLine=${encodeURIComponent(summoner.tagline)}`);
        
        if (response.status === 200) {
          const data = await response.json();
          
          if (data.status === "COMPLETE" && data.seasonStats) {
            // Extract the seasonStats object from the response
            // Response structure: { status, puuid, seasonStats: { overallStats, championStats } }
            setSeasonStats(data.seasonStats);
          }
        }
        // If not 200 or not COMPLETE, seasonStats stays null
      } catch (error) {
        console.error("Error fetching season stats from AWS Lambda:", error);
      } finally {
        setIsLoadingSeasonStats(false);
      }
    };

    loadSeasonStats();
  }, [summoner.summonerName, summoner.tagline]);

  // Track current page using IntersectionObserver
  useEffect(() => {
    if (typeof window === 'undefined' || !containerRef.current) return;
    if (!seasonStats) return; // Wait until content is rendered
    
    const timer = setTimeout(() => {
      const container = containerRef.current;
      if (!container) return;
      
      const sections = container.querySelectorAll('section');
      if (sections.length === 0) return;

      const observer = new IntersectionObserver(
        (entries) => {
          // Find the section with highest intersection ratio
          let maxRatio = 0;
          let maxIndex = 0;
          
          entries.forEach((entry) => {
            const sectionsArray = Array.from(sections);
            const index = sectionsArray.findIndex(s => s === entry.target);
            
            if (entry.isIntersecting && entry.intersectionRatio > maxRatio) {
              maxRatio = entry.intersectionRatio;
              maxIndex = index;
            }
          });
          
          if (maxRatio > 0.3) {
            setCurrentPage(maxIndex);
          }
        },
        {
          root: container,
          threshold: [0, 0.25, 0.5, 0.75, 1],
          rootMargin: '0px',
        }
      );

      sections.forEach((section) => {
        observer.observe(section as Element);
      });

      return () => {
        observer.disconnect();
      };
    }, 1000);

    return () => clearTimeout(timer);
  }, [seasonStats]);

  // Close share menu when clicking outside
  useEffect(() => {
    if (!showShareMenu) return;
    
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.share-menu-container')) {
        setShowShareMenu(false);
      }
    };
    
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showShareMenu]);

  // Season start date for display
  const seasonStartDate = useMemo(() => {
    const startTimestamp = seasonStats?.statsPeriodStart;
    if (!startTimestamp) {
      return "Season 2025";
    }
    const date = new Date(startTimestamp);
    return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  }, [seasonStats]);

  // Transform AWS Lambda API season stats data for display
  const displaySeasonStats = useMemo(() => {
    if (!seasonStats || !seasonStats.championStats) {
      return null; // No data available - show "not ready" message
    }

    // Get champions directly from championStats and sort by games played
    const topChampions = Object.entries(seasonStats.championStats)
      .sort((a, b) => b[1].gamesPlayed - a[1].gamesPlayed)
      .map(([name, champStats]) => {
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

    // Calculate averages from total matches
    const totalMatches = seasonStats.overallStats.totalMatches || 1;
    const avgKills = seasonStats.overallStats.mostKills?.value ? seasonStats.overallStats.mostKills.value / totalMatches : 0;
    const avgDeaths = seasonStats.overallStats.mostDeaths?.value ? seasonStats.overallStats.mostDeaths.value / totalMatches : 0;
    const avgAssists = seasonStats.overallStats.mostAssists?.value ? seasonStats.overallStats.mostAssists.value / totalMatches : 0;
    const avgCs = (seasonStats.overallStats.totalCS || 0) / totalMatches;
    
    // Calculate game duration averages
    const avgGameDuration = ((seasonStats.overallStats.longestGameDuration || 0) + (seasonStats.overallStats.shortestGameDuration || 0)) / 2;
    const avgCsPerMin = avgGameDuration ? avgCs / (avgGameDuration / 60) : 0;

    return {
      gamesPlayed: seasonStats.overallStats.totalMatches,
      wins: seasonStats.overallStats.wins,
      losses: seasonStats.overallStats.losses,
      winRate: seasonStats.overallStats.wins / seasonStats.overallStats.totalMatches,
      
      avgKills,
      avgDeaths,
      avgAssists,
      avgKda: avgDeaths === 0 ? (avgKills + avgAssists) : (avgKills + avgAssists) / avgDeaths,
      avgCs,
      avgCsPerMin,
      avgVision: 0, // Not available from Lambda API
      avgGold: 0, // Not available from Lambda API
      totalDragons: 0, // Not available from Lambda API
      totalBarons: 0, // Not available from Lambda API
      pentaKills: topChampions.reduce((sum, champ) => sum + champ.pentaKills, 0),
      quadraKills: topChampions.reduce((sum, champ) => sum + champ.quadraKills, 0),
      mostPlayedRole: "UNKNOWN", // Not available from Lambda API
      monthlyChartData: [], // Not available from Lambda API
      seasonStart: seasonStartDate,
      topChampions,
      uniqueChampionsPlayed: topChampions.length, // Number of unique champions played
    };
  }, [seasonStats, seasonStartDate]);

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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

  // Navigate to specific page
  const goToPage = (pageNum: number) => {
    if (!containerRef.current) return;
    
    const pageHeight = window.innerHeight;
    containerRef.current.scrollTo({
      top: pageNum * pageHeight,
      behavior: 'smooth',
    });
  };

  // Download page as image using dom-to-image-more (better CSS support)
  const downloadPageAsImage = async (pageIndex: number, pageName: string) => {
    try {
      const domtoimage = await import('dom-to-image-more');
      const pages = document.querySelectorAll('.chronicle-container > section');
      const page = pages[pageIndex];
      
      if (!page) {
        alert(`Could not find page ${pageIndex + 1} to download`);
        return;
      }
      
      const dataUrl = await domtoimage.toPng(page as HTMLElement, {
        quality: 0.95,
        bgcolor: '#020617',
        width: page.clientWidth,
        height: page.clientHeight,
        style: {
          margin: '0',
          padding: '0',
          border: 'none',
          outline: 'none',
          boxShadow: 'none',
        },
        filter: (node: Node) => {
          // Remove any debug borders or outlines
          if (node instanceof HTMLElement && node.style) {
            node.style.outline = 'none';
            node.style.border = node.style.border?.includes('border-') ? node.style.border : 'none';
          }
          return true;
        },
      });
      
      const link = document.createElement('a');
      link.download = `${pageName}-${summoner.summonerName}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading page:', error);
      alert(`Failed to download page: ${(error as Error).message}`);
    }
  };

  // Download entire chronicle as one image
  const downloadFullChronicle = async () => {
    try {
      const domtoimage = await import('dom-to-image-more');
      
      // Get all sections to capture
      const sections = document.querySelectorAll('.chronicle-container section');
      if (sections.length === 0) {
        alert('No pages found to download');
        return;
      }
      
      // Create a temporary container to stack all sections vertically
      const tempContainer = document.createElement('div');
      tempContainer.style.position = 'absolute';
      tempContainer.style.left = '-9999px';
      tempContainer.style.top = '0';
      tempContainer.style.width = window.innerWidth + 'px';
      tempContainer.style.backgroundColor = '#020617';
      tempContainer.style.margin = '0';
      tempContainer.style.padding = '0';
      document.body.appendChild(tempContainer);
      
      // Clone and append all sections
      sections.forEach((section) => {
        const clone = section.cloneNode(true) as HTMLElement;
        clone.style.position = 'relative';
        clone.style.height = window.innerHeight + 'px';
        clone.style.width = '100%';
        clone.style.margin = '0';
        clone.style.padding = '0';
        tempContainer.appendChild(clone);
      });
      
      // Use the same approach as single page download
      const dataUrl = await domtoimage.toPng(tempContainer, {
        quality: 0.95,
        bgcolor: '#020617',
        width: tempContainer.clientWidth,
        height: tempContainer.clientHeight,
        style: {
          margin: '0',
          padding: '0',
          border: 'none',
          outline: 'none',
          boxShadow: 'none',
        },
        filter: (node: Node) => {
          // Use the same simple filter as single page download
          if (node instanceof HTMLElement && node.style) {
            node.style.outline = 'none';
            node.style.border = node.style.border?.includes('border-') ? node.style.border : 'none';
          }
          return true;
        },
      });
      
      // Remove temporary container
      document.body.removeChild(tempContainer);
      
      const link = document.createElement('a');
      link.download = `${summoner.summonerName}-Chronicle-2025.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading chronicle:', error);
      alert(`Failed to download chronicle: ${(error as Error).message}`);
    }
  };

  // Copy shareable link to clipboard
  const copyShareableLink = () => {
    const url = window.location.href;
    navigator.clipboard.writeText(url);
    setShowCopiedToast(true);
    setTimeout(() => setShowCopiedToast(false), 3000);
  };

  // Format rank display
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        const estimatedTakedowns = displaySeasonStats?.avgKills ? 
          Math.round(games * displaySeasonStats.avgKills) : 
          Math.round(games * 5); // Fallback estimate
        return {
          riotId,
          summonerName,
          gamesPlayed: games,
          takedowns: estimatedTakedowns,
        };
      });
  }, [seasonStats, displaySeasonStats]);

  // Show loading state while fetching data
  if (isLoadingSeasonStats || !displaySeasonStats) {
    return (
      <div className="relative h-screen w-full flex items-center justify-center bg-slate-950 overflow-hidden">
        {/* Animated background */}
        <motion.div
          className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.4),transparent_70%)]"
          animate={{
            scale: [1, 1.1, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Floating particles */}
        {[...Array(8)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-1 w-1 rounded-full bg-violet-400/30"
            style={{
              left: `${20 + i * 10}%`,
              top: `${30 + (i % 3) * 20}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0, 1, 0],
              scale: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 3 + i * 0.3,
              repeat: Infinity,
              ease: "easeInOut",
              delay: i * 0.2,
            }}
          />
        ))}

        <div className="relative z-10 text-center space-y-6">
          {/* Triple ring spinner */}
          <div className="relative inline-flex items-center justify-center h-32 w-32">
            {/* Outer ring */}
            <motion.div
              className="absolute h-32 w-32 rounded-full border-2 border-violet-400/30"
              animate={{
                rotate: 360,
                scale: [1, 1.1, 1],
              }}
              transition={{
                rotate: { duration: 3, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut" },
              }}
            />
            
            {/* Middle ring */}
            <motion.div
              className="absolute h-24 w-24 rounded-full border-2 border-fuchsia-400/40"
              animate={{
                rotate: -360,
                scale: [1, 1.05, 1],
              }}
              transition={{
                rotate: { duration: 2, repeat: Infinity, ease: "linear" },
                scale: { duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 },
              }}
            />
            
            {/* Inner ring */}
            <motion.div
              className="absolute h-16 w-16 rounded-full border-4 border-violet-500 border-r-transparent"
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 1,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            
            {/* Center glow */}
            <motion.div
              className="absolute h-8 w-8 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-400 blur-xl"
              animate={{
                opacity: [0.4, 0.8, 0.4],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>

          {/* Animated title */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <motion.h2
              className="text-3xl font-bold bg-gradient-to-r from-violet-400 via-fuchsia-400 to-violet-400 bg-clip-text text-transparent"
              animate={{
                backgroundPosition: ["0%", "100%", "0%"],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
              style={{
                backgroundSize: "200% 100%",
              }}
            >
              Loading Your Season Rewind
            </motion.h2>
          </motion.div>

          <motion.p
            className="text-slate-300/80 text-center max-w-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Preparing your chronicle...
          </motion.p>
          
          <motion.p
            className="text-slate-400/70 text-sm text-center max-w-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            This may take 10-15 minutes. Feel free to explore or come back later!
          </motion.p>

          {/* Progress bar animation */}
          <div className="mx-auto w-64 h-1 bg-slate-800/50 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500"
              animate={{
                x: ["-100%", "100%"],
              }}
              transition={{
                duration: 1.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{
                width: "50%",
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="chronicle-container relative h-screen w-full overflow-y-scroll snap-y snap-mandatory scroll-smooth scrollbar-hide">
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

      {/* Page Indicator - Vertical Bars */}
      <div className="fixed right-8 top-1/2 -translate-y-1/2 z-50 animate-in fade-in slide-in-from-right-5 duration-500">
        <div className="flex flex-col gap-3">
          {[0, 1, 2, 3, 4].map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => goToPage(pageNum)}
              className={`w-1.5 h-10 rounded-full transition-all duration-300 cursor-pointer ${
                currentPage === pageNum
                  ? 'bg-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.8)] w-2'
                  : 'bg-slate-600 hover:bg-slate-400 hover:w-2'
              }`}
              title={`Page ${pageNum + 1}`}
              aria-label={`Go to page ${pageNum + 1}`}
            />
          ))}
        </div>
      </div>

      {/* Share Button Component */}
      <div className="fixed top-4 right-4 z-50 animate-in fade-in slide-in-from-right-5 duration-500">
        <div className="relative share-menu-container">
          {(currentPage >= 0 && currentPage < 5) && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowShareMenu(!showShareMenu)}
                className="bg-slate-950/80 backdrop-blur-sm text-slate-300 hover:text-slate-100 border border-white/10 transition-all duration-300 hover:scale-105"
              >
                <Share2 className="h-4 w-4" />
              </Button>
              
              {/* Share Menu Dropdown */}
              {showShareMenu && (
                <div className="absolute right-0 mt-2 w-48 rounded-lg border border-white/10 bg-slate-950/95 backdrop-blur-sm shadow-xl animate-in fade-in zoom-in duration-200">
                  <div className="p-2 flex flex-col gap-1">
                    <button
                      onClick={() => {
                        copyShareableLink();
                        setShowShareMenu(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-slate-300 hover:text-slate-100 hover:bg-slate-800/50 transition-all duration-200 text-sm"
                    >
                      <Link className="h-4 w-4" />
                      Share as Link
                    </button>
                    <button
                      onClick={() => {
                        downloadPageAsImage(currentPage, `Chronicle-Page-${currentPage + 1}`);
                        setShowShareMenu(false);
                      }}
                      className="flex items-center gap-2 px-3 py-2 rounded-md text-slate-300 hover:text-slate-100 hover:bg-slate-800/50 transition-all duration-200 text-sm"
                    >
                      <Download className="h-4 w-4" />
                      Download Page
                    </button>
                  </div>
                </div>
              )}
            </>
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
        <div className="relative z-10 h-full flex items-center justify-center px-4 md:px-8 overflow-y-auto scrollbar-hide py-4">
          <div className="max-w-7xl w-full flex flex-col items-center gap-4">
            {/* Hero Section - Summoner Info */}
            <div className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-950/90 via-slate-900/90 to-slate-950/90 p-4 shadow-[0_0_60px_rgba(99,102,241,0.3)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="pointer-events-none absolute -top-40 left-1/2 h-64 w-64 -translate-x-1/2 rounded-full bg-violet-500/30 blur-3xl" />
              
              {/* Summoner Info - Compact */}
              <div className="relative flex items-center gap-4 mb-2">
                <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-2xl border-2 border-violet-400/50 shadow-lg">
                  <Image
                    src={summoner.profileIcon}
                    alt={`${summoner.summonerName} icon`}
                    fill
                    className="object-cover"
                  />
                </div>
                <div className="flex flex-col gap-1 flex-1">
                  <h2 className="text-2xl font-bold text-slate-100 leading-tight">
                    {summoner.summonerName}<span className="text-slate-400 text-lg">#{summoner.tagline}</span>
                  </h2>
                </div>
              </div>
              
              {/* Main Heading */}
              <div className="relative text-center">
                <h1 className="font-heading text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-violet-400 via-purple-400 to-pink-400 tracking-tight mb-2 drop-shadow-[0_10px_40px_rgba(139,92,246,0.5)]">
                  Season Chronicle 2025
                </h1>
                <p className="text-sm text-slate-400">Your journey through the rift</p>
              </div>
            </div>

            {/* Primary Stats - Big Numbers */}
            <div className="w-full max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-3 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
              <div className="relative overflow-hidden rounded-xl border border-violet-400/30 bg-slate-900/70 p-4 shadow-lg hover:shadow-violet-500/40 transition-all duration-300 hover:scale-105 hover:border-violet-400/60 group">
                <div className="absolute top-0 right-0 h-20 w-20 bg-violet-500/10 rounded-full blur-2xl group-hover:bg-violet-500/20 transition-all" />
                <Trophy className="h-5 w-5 text-violet-400 mb-2" />
                <p className="text-3xl md:text-4xl font-bold text-slate-100">{displaySeasonStats.gamesPlayed}</p>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Games Played</p>
              </div>
              <div className="relative overflow-hidden rounded-xl border border-green-400/30 bg-slate-900/70 p-4 shadow-lg hover:shadow-green-500/40 transition-all duration-300 hover:scale-105 hover:border-green-400/60 group">
                <div className="absolute top-0 right-0 h-20 w-20 bg-green-500/10 rounded-full blur-2xl group-hover:bg-green-500/20 transition-all" />
                <Target className="h-5 w-5 text-green-400 mb-2" />
                <p className="text-3xl md:text-4xl font-bold text-slate-100">{displaySeasonStats.wins}</p>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Victories</p>
              </div>
              <div className="relative overflow-hidden rounded-xl border border-cyan-400/30 bg-slate-900/70 p-4 shadow-lg hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-105 hover:border-cyan-400/60 group">
                <div className="absolute top-0 right-0 h-20 w-20 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all" />
                <Flame className="h-5 w-5 text-cyan-400 mb-2" />
                <p className="text-3xl md:text-4xl font-bold text-slate-100">{Math.round(displaySeasonStats.winRate * 100)}%</p>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Win Rate</p>
              </div>
              <div className="relative overflow-hidden rounded-xl border border-orange-400/30 bg-slate-900/70 p-4 shadow-lg hover:shadow-orange-500/40 transition-all duration-300 hover:scale-105 hover:border-orange-400/60 group">
                <div className="absolute top-0 right-0 h-20 w-20 bg-orange-500/10 rounded-full blur-2xl group-hover:bg-orange-500/20 transition-all" />
                <Award className="h-5 w-5 text-orange-400 mb-2" />
                <p className="text-3xl md:text-4xl font-bold text-slate-100">{displaySeasonStats.uniqueChampionsPlayed}</p>
                <p className="text-xs text-slate-400 uppercase tracking-wider">Champions</p>
              </div>
            </div>

            {/* Glory Moments */}
            <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-300">
              <h3 className="text-lg font-bold text-slate-300 mb-2 text-center uppercase tracking-wider">
                ⚡ Glory Moments
              </h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="relative overflow-hidden rounded-xl border-2 border-yellow-400/40 bg-gradient-to-br from-yellow-900/30 via-orange-900/30 to-red-900/30 p-3 shadow-[0_0_20px_rgba(251,191,36,0.3)] hover:shadow-[0_0_30px_rgba(251,191,36,0.5)] transition-all duration-300 hover:scale-105 group">
                  <div className="absolute top-0 right-0 h-16 w-16 bg-yellow-500/20 rounded-full blur-xl group-hover:bg-yellow-500/30 transition-all" />
                  <Crown className="h-6 w-6 text-yellow-400 mb-1 mx-auto animate-pulse" />
                  <p className="text-3xl font-black text-yellow-100 text-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">{displaySeasonStats.pentaKills}</p>
                  <p className="text-xs text-yellow-200 text-center uppercase tracking-wider font-bold">Pentakills</p>
                </div>
                <div className="relative overflow-hidden rounded-xl border-2 border-purple-400/40 bg-gradient-to-br from-purple-900/30 via-pink-900/30 to-fuchsia-900/30 p-3 shadow-[0_0_15px_rgba(168,85,247,0.3)] hover:shadow-[0_0_25px_rgba(168,85,247,0.5)] transition-all duration-300 hover:scale-105 group">
                  <div className="absolute top-0 right-0 h-16 w-16 bg-purple-500/20 rounded-full blur-xl group-hover:bg-purple-500/30 transition-all" />
                  <Sparkles className="h-6 w-6 text-purple-400 mb-1 mx-auto" />
                  <p className="text-3xl font-black text-purple-100 text-center drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">{displaySeasonStats.quadraKills}</p>
                  <p className="text-xs text-purple-200 text-center uppercase tracking-wider font-bold">Quadras</p>
                </div>
                <div className="relative overflow-hidden rounded-xl border border-cyan-400/40 bg-gradient-to-br from-cyan-900/25 to-blue-900/25 p-3 shadow-sm shadow-cyan-500/20 hover:shadow-cyan-500/40 transition-all duration-300 hover:scale-105 group">
                  <div className="absolute top-0 right-0 h-16 w-16 bg-cyan-500/20 rounded-full blur-xl group-hover:bg-cyan-500/30 transition-all" />
                  <Crosshair className="h-6 w-6 text-cyan-400 mb-1 mx-auto" />
                  <p className="text-3xl font-black text-cyan-100 text-center">{displaySeasonStats.topChampions.reduce((sum, champ) => sum + champ.tripleKills, 0)}</p>
                  <p className="text-xs text-cyan-200 text-center uppercase tracking-wider font-bold">Triple Kills</p>
                </div>
              </div>
            </div>

            {/* Top 5 Champions Preview */}
            <div className="w-full max-w-5xl animate-in fade-in slide-in-from-bottom-8 duration-700 delay-400">
              <h3 className="text-lg font-bold text-slate-300 mb-2 text-center uppercase tracking-wider">
                👑 Top Champions
              </h3>
              <div className="grid grid-cols-5 gap-3">
                {displaySeasonStats.topChampions.slice(0, 5).map((champ, index) => (
                  <div
                    key={champ.name}
                    className="relative h-32 overflow-hidden rounded-xl border border-violet-400/30 shadow-lg hover:shadow-violet-500/40 transition-all duration-300 hover:scale-105 hover:border-violet-400/60 group"
                    style={{
                      backgroundImage: `url('https://ddragon.leagueoflegends.com/cdn/img/champion/splash/${champ.name}_0.jpg')`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent" />
                    <div className="relative h-full flex flex-col justify-between p-3">
                      <div className="flex items-center gap-2">
                        <div className="text-xl font-bold text-violet-400">#{index + 1}</div>
                        <span className="text-sm font-bold text-slate-100">{champ.name}</span>
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Games</span>
                          <span className="font-bold text-slate-200">{champ.games}</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-slate-400">Damage</span>
                          <span className="font-bold text-orange-400">{(champ.totalDamage / 1000).toFixed(0)}k</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick Highlights */}
            {seasonStats?.overallStats && (
              <div className="w-full max-w-5xl grid grid-cols-2 md:grid-cols-4 gap-2 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-500">
                {seasonStats.overallStats.mostKills && (
                  <div className="border border-slate-700/50 bg-slate-900/50 rounded-lg p-2">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Most Deadly</p>
                    <p className="text-lg font-bold text-green-400">{seasonStats.overallStats.mostKills.value} Kills</p>
                    <p className="text-[10px] text-slate-400">{seasonStats.overallStats.mostKills.champion}</p>
                  </div>
                )}
                {seasonStats.overallStats.totalCS && (
                  <div className="border border-slate-700/50 bg-slate-900/50 rounded-lg p-2">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Total CS</p>
                    <p className="text-lg font-bold text-orange-400">{(seasonStats.overallStats.totalCS / 1000).toFixed(1)}k</p>
                    <p className="text-[10px] text-slate-400">Across all games</p>
                  </div>
                )}
                {seasonStats.overallStats.longestGameDuration && (
                  <div className="border border-slate-700/50 bg-slate-900/50 rounded-lg p-2">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Epic Game</p>
                    <p className="text-lg font-bold text-purple-400">
                      {Math.floor(seasonStats.overallStats.longestGameDuration / 60)}m {seasonStats.overallStats.longestGameDuration % 60}s
                    </p>
                    <p className="text-[10px] text-slate-400">Longest match</p>
                  </div>
                )}
                {playersWithTakedowns[0] && (
                  <div className="border border-slate-700/50 bg-slate-900/50 rounded-lg p-2">
                    <p className="text-xs text-slate-500 uppercase tracking-wide mb-0.5">Best Duo</p>
                    <p className="text-lg font-bold text-cyan-400">{playersWithTakedowns[0].gamesPlayed} Games</p>
                    <p className="text-[10px] text-slate-400 truncate">{playersWithTakedowns[0].summonerName}</p>
                  </div>
                )}
              </div>
            )}

            {/* Scroll Indicator */}
            <div className="flex flex-col items-center gap-2 animate-bounce animate-in fade-in duration-1000 delay-700 mt-2">
              <ChevronDown className="h-5 w-5 text-violet-400 animate-pulse" />
              <span className="text-xs text-slate-400 uppercase tracking-wider">Scroll to Explore</span>
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

        <div className="relative z-10 h-full flex flex-col justify-center px-8 py-12">
          <div className="mx-auto max-w-7xl w-full">
            <h2 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-400 to-purple-400 mb-2 text-center animate-in fade-in slide-in-from-top-5 duration-700">
              Your Most Played Champions
            </h2>
            <p className="text-base text-slate-400 text-center mb-3 animate-in fade-in duration-700 delay-150">
              Your most played champions this season
            </p>
            
            <div className="flex flex-col gap-3 max-h-[720px] overflow-y-auto scrollbar-hide">
              {displaySeasonStats.topChampions.slice(0, 3).map((champ, index) => (
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
                  
                  {/* Stats Content - Split Left/Right Layout */}
                  <div className="relative h-full flex flex-col justify-between py-4 px-6">
                    {/* Top Row - Rank + Name (Left) and Stats (Right) */}
                    <div className="flex items-start justify-between gap-6">
                      {/* Left: Rank and Champion Name */}
                      <div className="flex items-top gap-4">
                        <div className="text-3xl font-bold text-violet-400 transition-all duration-300 hover:scale-110">
                          #{index + 1}
                        </div>
                        <span className="text-xl font-bold text-slate-100 transition-all duration-300">{champ.name}</span>
                      </div>
                      
                      {/* Right: All Stats */}
                      <div className="flex items-top gap-4 flex-wrap">
                        <div className="flex flex-col items-center transition-all duration-300 hover:scale-110">
                          <span className="text-sm text-slate-400 uppercase tracking-wide">Games</span>
                          <span className="text-xl font-bold text-slate-100">{champ.games}</span>
                        </div>
                        
                        <div className="flex flex-col items-center transition-all duration-300 hover:scale-110">
                          <span className="text-sm text-slate-400 uppercase tracking-wide">Win Rate</span>
                          <span className={`text-xl font-bold ${champ.winRate >= 0.55 ? 'text-green-400' : champ.winRate >= 0.45 ? 'text-slate-100' : 'text-red-400'}`}>
                            {Math.round(champ.winRate * 100)}%
                          </span>
                        </div>
                        
                        <div className="flex flex-col items-center transition-all duration-300 hover:scale-110">
                          <span className="text-sm text-slate-400 uppercase tracking-wide">Damage</span>
                          <span className="text-xl font-bold text-orange-400">
                            {(champ.totalDamage / 1000).toFixed(0)}k
                          </span>
                        </div>
                        
                        <div className="flex flex-col items-center transition-all duration-300 hover:scale-110">
                          <span className="text-sm text-slate-400 uppercase tracking-wide">Takedowns</span>
                          <span className="text-xl font-bold text-cyan-400">{champ.totalTakedowns}</span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Row - Ability Icons (Left) and Multikills (Right) */}
                    <div className="flex items-end justify-between gap-6">
                      {/* Left: Ability Icons */}
                      {(champ.qCasts > 0 || champ.wCasts > 0 || champ.eCasts > 0 || champ.rCasts > 0) && (
                        <div className="flex flex-col gap-2">
                          <span className="text-sm text-slate-400 uppercase tracking-wide">Ability Casts</span>
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

                      {/* Right: Multikills */}
                      {(champ.pentaKills > 0 || champ.quadraKills > 0 || champ.tripleKills > 0 || champ.doubleKills > 0) && (
                        <div className="flex flex-col items-end gap-2">
                          <span className="text-sm text-slate-400 uppercase tracking-wide">Multikills</span>
                          <div className="flex flex-row gap-2 flex-wrap justify-end">
                            {champ.pentaKills > 0 && (
                              <div className="relative flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-br from-yellow-400/40 via-orange-500/40 to-red-500/40 border-2 border-yellow-300/80 shadow-[0_0_20px_rgba(251,191,36,0.5)] transition-all duration-300 hover:scale-110 hover:shadow-[0_0_30px_rgba(251,191,36,0.7)] animate-pulse">
                                <Crown className="h-5 w-5 text-yellow-200 drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]" />
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-yellow-100 font-black text-lg drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">{champ.pentaKills}</span>
                                  <span className="text-yellow-100 font-bold text-sm uppercase tracking-wider drop-shadow-[0_2px_8px_rgba(0,0,0,0.8)]">Penta</span>
                                </div>
                                {/* Sparkle effect overlay */}
                                <div className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-300 rounded-full animate-ping" />
                              </div>
                            )}
                            {champ.quadraKills > 0 && (
                              <div className="relative flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-br from-purple-400/40 via-pink-500/40 to-fuchsia-500/40 border-2 border-purple-300/80 shadow-[0_0_15px_rgba(168,85,247,0.4)] transition-all duration-300 hover:scale-110 hover:shadow-[0_0_25px_rgba(168,85,247,0.6)]">
                                <Sparkles className="h-4 w-4 text-purple-200 drop-shadow-[0_0_6px_rgba(168,85,247,0.8)]" />
                                <div className="flex items-baseline gap-1.5">
                                  <span className="text-purple-100 font-bold text-base drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">{champ.quadraKills}</span>
                                  <span className="text-purple-100 font-semibold text-sm uppercase tracking-wide drop-shadow-[0_2px_6px_rgba(0,0,0,0.8)]">Quadra</span>
                                </div>
                              </div>
                            )}
                            {champ.tripleKills > 0 && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gradient-to-r from-cyan-500/30 to-blue-500/30 border border-cyan-400/60 shadow-sm shadow-cyan-500/20 transition-all duration-300 hover:scale-105 hover:shadow-cyan-500/40">
                                <Crosshair className="h-3.5 w-3.5 text-cyan-300" />
                                <span className="text-cyan-200 font-bold text-xs">{champ.tripleKills}</span>
                                <span className="text-cyan-200 font-semibold text-xs uppercase tracking-wide">Triple</span>
                              </div>
                            )}
                            {champ.doubleKills > 0 && (
                              <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-gradient-to-r from-blue-500/25 to-indigo-500/25 border border-blue-400/50 shadow-sm shadow-blue-500/10 transition-all duration-300 hover:scale-105 hover:shadow-blue-500/30">
                                <Swords className="h-3.5 w-3.5 text-blue-300" />
                                <span className="text-blue-200 font-bold text-xs">{champ.doubleKills}</span>
                                <span className="text-blue-200 font-semibold text-xs uppercase tracking-wide">Double</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
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
                      className="relative aspect-[1530/1024] overflow-hidden rounded-2xl border-2 border-violet-400/40 bg-slate-900/50 shadow-lg hover:shadow-violet-500/40 transition-all duration-500 hover:scale-105 hover:border-violet-400/80 animate-in zoom-in duration-700"
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
                      className="relative w-[calc((100vw-10rem)/2.2)] max-w-[450px] min-w-[280px] aspect-[1530/1024] overflow-hidden rounded-2xl border-2 border-violet-400/40 bg-slate-900/50 shadow-lg hover:shadow-violet-500/40 transition-all duration-500 hover:scale-105 hover:border-violet-400/80 animate-in zoom-in duration-700"
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

      {/* Custom Toast Notification */}
      {showCopiedToast && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ duration: 0.2 }}
          className="fixed bottom-8 right-8 z-[100] pointer-events-none"
        >
          <div className="relative overflow-hidden rounded-xl border border-green-400/50 bg-gradient-to-br from-green-900/95 via-emerald-900/95 to-teal-900/95 backdrop-blur-xl shadow-lg shadow-green-500/30">
            {/* Content */}
            <div className="relative flex items-center gap-3 px-5 py-3">
              {/* Success Icon */}
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-10 w-10 rounded-full bg-gradient-to-br from-green-400 to-emerald-500">
                  <svg
                    className="h-5 w-5 text-white"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="3"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              
              {/* Text */}
              <div className="flex flex-col">
                <p className="text-base font-semibold text-green-100">
                  Link Copied!
                </p>
                <p className="text-sm text-green-200/80">
                  Ready to share
                </p>
              </div>
            </div>

            {/* Progress bar */}
            <motion.div
              className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400"
              initial={{ scaleX: 1 }}
              animate={{ scaleX: 0 }}
              transition={{ duration: 3, ease: "linear" }}
              style={{ transformOrigin: "left" }}
            />
          </div>
        </motion.div>
      )}
    </div>
  );
}
