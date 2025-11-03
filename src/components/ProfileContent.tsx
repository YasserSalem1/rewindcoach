"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import Image from "next/image";
import { ArrowLeft, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { MatchList } from "@/components/MatchList";
import { StyleDNA } from "@/components/StyleDNA";
import { Button } from "@/components/ui/button";
import type { ProfileBundle, RiotMatch, StyleDNA as StyleDNAType } from "@/lib/riot";
import { summarizeMatches } from "@/lib/riot";

interface ProfileContentProps {
  bundle: ProfileBundle;
  region: string;
}

export function ProfileContent({ bundle, region }: ProfileContentProps) {
  const router = useRouter();
  const { profile: summoner, puuid } = bundle;
  
  const [styleDNA, setStyleDNA] = useState<StyleDNAType>(bundle.styleDNA);
  const [isGenerating, setIsGenerating] = useState(false);
  const [buttonText, setButtonText] = useState("Your Season Rewind");
  
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleMatchesUpdate = useCallback((updatedMatches: RiotMatch[]) => {
    // Recalculate style DNA with all matches
    const { styleDNA: newStyleDNA } = summarizeMatches(updatedMatches, puuid);
    setStyleDNA(newStyleDNA);
  }, [puuid]);

  const handleBack = () => {
    router.back();
  };

  const stopPolling = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
  }, []);

  const checkStatus = useCallback(async () => {
    try {
      const response = await fetch(`/api/season-rewind?puuid=${encodeURIComponent(puuid)}`);
      const data = await response.json();

      if (response.status === 200) {
        if (data.status === "COMPLETE") {
          // Stop polling and navigate to chronicle page
          stopPolling();
          setIsGenerating(false);
          setButtonText("View Your Season Rewind");
          // Navigate to chronicle page to display the stats
          router.push(
            `/profile/${region}/${encodeURIComponent(summoner.summonerName)}/${encodeURIComponent(summoner.tagline)}/chronicle`,
          );
        } else if (data.status === "CALCULATING") {
          // Keep polling - button stays in generating state
          // Polling will continue via the interval
        }
      }
    } catch (error) {
      console.error("Error checking status:", error);
      // Continue polling on error
    }
  }, [puuid, region, summoner.summonerName, summoner.tagline, router, stopPolling]);

  const startPolling = useCallback(() => {
    // Initial check
    checkStatus();
    
    // Poll every 10 seconds
    pollingIntervalRef.current = setInterval(() => {
      checkStatus();
    }, 10000);
  }, [checkStatus]);

  // Check status on page load
  useEffect(() => {
    const checkInitialStatus = async () => {
      try {
        const response = await fetch(`/api/season-rewind?puuid=${encodeURIComponent(puuid)}`);
        const data = await response.json();

        if (response.status === 404) {
          // Not found - keep default state (clickable, "Your Season Rewind")
          setIsGenerating(false);
          setButtonText("Your Season Rewind");
        } else if (response.status === 200) {
          if (data.status === "CALCULATING") {
            // Currently calculating - disable button and start polling
            setIsGenerating(true);
            setButtonText("Generating your rewind...");
            startPolling();
          } else if (data.status === "COMPLETE") {
            // Already complete - enable button with view text
            setIsGenerating(false);
            setButtonText("View Your Season Rewind");
          }
        }
      } catch (error) {
        console.error("Error checking initial status:", error);
        // On error, keep default state
        setIsGenerating(false);
        setButtonText("Your Season Rewind");
      }
    };

    checkInitialStatus();
  }, [puuid, startPolling]);

  // Clean up polling interval on unmount
  useEffect(() => {
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, []);

  const initiateCalculation = async () => {
    try {
      const response = await fetch("/api/season-rewind", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          gameName: summoner.summonerName,
          tagLine: summoner.tagline,
        }),
      });

      if (response.ok) {
        // Start polling after successful initiation
        startPolling();
      } else {
        // Handle error - re-enable button
        setIsGenerating(false);
        setButtonText("Your Season Rewind");
        alert("Failed to initiate season rewind. Please try again.");
      }
    } catch (error) {
      console.error("Error initiating calculation:", error);
      setIsGenerating(false);
      setButtonText("Your Season Rewind");
      alert("Failed to initiate season rewind. Please try again.");
    }
  };

  const handleSeasonRewind = async () => {
    // Disable button and set loading state
    setIsGenerating(true);
    setButtonText("Generating your rewind...");

    try {
      const response = await fetch(`/api/season-rewind?puuid=${encodeURIComponent(puuid)}`);
      const data = await response.json();

      if (response.status === 404) {
        // Not found - initiate calculation
        await initiateCalculation();
      } else if (response.status === 200) {
        if (data.status === "CALCULATING") {
          // Already calculating - start polling
          startPolling();
        } else if (data.status === "COMPLETE") {
          // Already complete - navigate to chronicle
          setIsGenerating(false);
          router.push(
            `/profile/${region}/${encodeURIComponent(summoner.summonerName)}/${encodeURIComponent(summoner.tagline)}/chronicle`,
          );
        }
      } else {
        // Unexpected status - re-enable button
        setIsGenerating(false);
        setButtonText("Your Season Rewind");
        alert("Unexpected response. Please try again.");
      }
    } catch (error) {
      console.error("Error fetching season rewind:", error);
      setIsGenerating(false);
      setButtonText("Your Season Rewind");
      alert("Failed to fetch season rewind. Please try again.");
    }
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
    <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 pb-32">
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
      <section className="relative overflow-hidden rounded-3xl border border-white/10 bg-slate-950/90 p-8 shadow-[0_0_60px_rgba(79,70,229,0.2)]">
        <div className="pointer-events-none absolute -top-24 left-1/2 h-48 w-48 -translate-x-1/2 rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative flex flex-col gap-6">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:items-center md:justify-between md:gap-10 md:text-left">
            <div className="flex items-center gap-5 md:gap-7">
              <div className="relative h-28 w-28 overflow-hidden rounded-3xl border border-violet-400/50 shadow-[0_18px_55px_rgba(124,58,237,0.35)]">
                <Image
                  src={summoner.profileIcon}
                  alt={`${summoner.summonerName} icon`}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex flex-col gap-2">
                <h1 className="font-heading text-3xl text-slate-100 md:text-4xl">
                  {summoner.summonerName}
                  <span className="ml-1 text-slate-300/70">#{summoner.tagline}</span>
                </h1>
                <div className="flex flex-col items-center gap-1 text-sm text-slate-300/75 md:flex-row md:items-center md:gap-3 md:text-left">
                  <p>
                    Level {summoner.level} • {region}
                  </p>
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-slate-900/75 px-4 py-1 backdrop-blur-sm transition-shadow duration-200 hover:shadow-[0_12px_35px_rgba(79,70,229,0.25)]">
                    <span className={`font-heading text-base font-semibold tracking-tight ${rankColor}`}>
                      {rankDisplay}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex w-full flex-col items-center gap-2 md:w-auto md:items-end">
              <Button
                onClick={handleSeasonRewind}
                disabled={isGenerating}
                variant="default"
                className="group relative w-full rounded-lg border border-white/20 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-violet-500 px-6 py-3 text-sm font-semibold uppercase tracking-[0.2em] text-slate-950 shadow-[0_12px_35px_rgba(232,121,249,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_50px_rgba(167,139,250,0.55)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-200 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-[0_12px_35px_rgba(232,121,249,0.45)] md:w-auto"
              >
                <span className="flex items-center justify-center gap-2">
                  {isGenerating && <Loader2 className="h-4 w-4 animate-spin" />}
                  {buttonText}
                </span>
              </Button>
              <span className="text-xs text-slate-300/75 md:text-right">
                Chronicle your split and relive every highlight.
              </span>
            </div>
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
      </section>

    </div>
  );
}
