"use client";

import { useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

import type { RiotMatch, RiotParticipant } from "@/lib/riot";
import { formatDuration, formatRelativeDate, kdaString } from "@/lib/ui";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface MatchRowProps {
  match: RiotMatch;
  participant: RiotParticipant;
  onReview?: (matchId: string) => void;
  gameName?: string;
  tagLine?: string;
}

const rowVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
};

export function MatchRow({
  match,
  participant,
  onReview,
  gameName,
  tagLine,
}: MatchRowProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const isWin = participant.win;
  const kda = kdaString(participant.kills, participant.deaths, participant.assists);
  const resultLabel = isWin ? "Victory" : "Defeat";
  const resultTone = isWin ? "good" : "bad";

  const review = () => {
    setIsLoading(true);
    
    if (onReview) {
      onReview(match.id);
      return;
    }

    const search = new URLSearchParams({ puuid: participant.puuid });
    if (gameName) {
      search.set("gameName", gameName);
    }
    if (tagLine) {
      search.set("tagLine", tagLine);
    }
    router.push(`/review/${match.id}?${search.toString()}`);
  };

  // For static item slots
  const NUM_ITEM_SLOTS = 6;
  const items = Array(NUM_ITEM_SLOTS)
    .fill(null)
    .map((_, i) => participant.items[i] || null);

  // Runes are always present in a static spot in the layout regardless of items
  return (
    <motion.article
      variants={rowVariants}
      initial="initial"
      animate="animate"
      className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-slate-900/45 p-4 transition hover:border-violet-400/40 hover:bg-slate-900/65 sm:flex-row sm:items-center"
    >
      {/* Champion Info Section - Fixed Width */}
      <div className="flex items-center gap-4 sm:w-[280px] sm:flex-shrink-0">
        <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-violet-400/45 flex-shrink-0">
          <Image
            src={participant.championIcon}
            alt={participant.championName}
            fill
            className="object-cover"
          />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-100 truncate">
              {participant.championName}
            </h3>
            <Badge variant={resultTone}>{resultLabel}</Badge>
          </div>
          <p className="text-sm text-slate-300/75 truncate">
            {match.queueType} • {formatDuration(match.gameDuration)} •{" "}
            {formatRelativeDate(new Date(match.gameCreation))}
          </p>
        </div>
      </div>

      {/* Stats Section - Fixed Widths for Each Element */}
      <div className="flex flex-1 items-center gap-3 overflow-x-auto sm:overflow-visible">
        {/* K/D/A - Fixed Width */}
        <div className="flex w-[100px] flex-col flex-shrink-0">
          <span className="text-base font-semibold text-slate-100">{kda}</span>
          <span className="text-xs uppercase tracking-wide text-slate-300/65">
            K / D / A
          </span>
        </div>

        {/* Summoner Spells - Fixed Width */}
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          {participant.spells && participant.spells[0] ? (
            <Image
              src={participant.spells[0]}
              alt="Summoner spell 1"
              width={28}
              height={28}
              className="rounded-lg border border-violet-400/45 bg-slate-900/60 p-0.5"
            />
          ) : (
            <div
              className="w-7 h-7 rounded-lg border border-violet-400/45 bg-slate-900/30 p-0.5 opacity-40"
              aria-label="No summoner spell 1"
            />
          )}
          {participant.spells && participant.spells[1] ? (
            <Image
              src={participant.spells[1]}
              alt="Summoner spell 2"
              width={28}
              height={28}
              className="rounded-lg border border-white/10 bg-slate-900/60 p-0.5"
            />
          ) : (
            <div
              className="w-7 h-7 rounded-lg border border-white/10 bg-slate-900/30 p-0.5 opacity-40"
              aria-label="No summoner spell 2"
            />
          )}
        </div>

        {/* Items - Fixed Width */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <span className="text-xs uppercase text-slate-300/65">Items</span>
          <div className="flex items-center gap-1.5">
            {items.some((item) => item) ? (
              items.map((item, idx) =>
                item ? (
                  <Image
                    key={`item-${idx}`}
                    src={item.icon}
                    alt={item.name}
                    width={28}
                    height={28}
                    className="rounded-lg border border-white/10 bg-slate-900/60 p-0.5"
                  />
                ) : (
                  <div
                    key={`empty-item-${idx}`}
                    className="w-7 h-7 rounded-lg border border-white/10 bg-slate-900/30 p-0.5 opacity-40"
                  />
                )
              )
            ) : (
              // If *all* slots missing/no data
              <>
                {Array(NUM_ITEM_SLOTS).fill(0).map((_, idx) => (
                  <div
                    key={`no-item-${idx}`}
                    className="w-7 h-7 rounded-lg border border-white/10 bg-slate-900/30 p-0.5 opacity-40"
                  />
                ))}
                <span className="ml-2 text-xs text-slate-400/60 whitespace-nowrap">No build data</span>
              </>
            )}
            {/* Always reserve the next slot for trinket, even if null */}
            {participant.trinket ? (
              <Image
                src={participant.trinket.icon}
                alt={participant.trinket.name}
                width={28}
                height={28}
                className="rounded-lg border border-violet-400/45 bg-slate-900/60 p-0.5"
              />
            ) : (
              <div
                className="w-7 h-7 rounded-lg border border-violet-400/45 bg-slate-900/30 p-0.5 opacity-40"
                aria-label="No trinket"
              />
            )}
          </div>
        </div>

        {/* Runes - Fixed Width */}
        <div className="flex flex-col gap-2 flex-shrink-0">
          <span className="text-xs uppercase text-slate-300/65">Runes</span>
          <div className="flex items-center gap-1.5">
            {participant.runes && participant.runes.primary ? (
              <Image
                src={participant.runes.primary}
                alt="Primary rune"
                width={28}
                height={28}
                className="rounded-full border border-violet-400/45 bg-slate-900/60 p-0.5"
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full border border-violet-400/45 bg-slate-900/30 p-0.5 opacity-40"
                aria-label="No primary rune"
              />
            )}
            {participant.runes && participant.runes.secondary ? (
              <Image
                src={participant.runes.secondary}
                alt="Secondary rune"
                width={28}
                height={28}
                className="rounded-full border border-white/10 bg-slate-900/60 p-0.5"
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full border border-white/10 bg-slate-900/30 p-0.5 opacity-40"
                aria-label="No secondary rune"
              />
            )}
          </div>
        </div>
      </div>
      <motion.div
        whileHover={!isLoading ? { scale: 1.05 } : {}}
        whileTap={!isLoading ? { scale: 0.95 } : {}}
      >
        <Button
          variant="default"
          size="lg"
          className="relative w-full overflow-hidden bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg shadow-violet-500/50 transition-all hover:shadow-xl hover:shadow-violet-500/60 sm:w-auto sm:px-8"
          onClick={review}
          disabled={isLoading}
        >
          {isLoading ? (
            <span className="relative z-10 flex items-center gap-2 font-semibold">
              <Loader2 className="h-5 w-5 animate-spin" />
              Loading...
            </span>
          ) : (
            <>
              <span className="relative z-10 font-semibold">Review Match</span>
              {/* Animated glow effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{
                  x: ["-100%", "100%"],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            </>
          )}
        </Button>
      </motion.div>
    </motion.article>
  );
}
