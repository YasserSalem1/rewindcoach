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
      className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-white/5 bg-slate-900/45 p-4 transition-all duration-300 ease-out hover:border-amber-200/80 hover:bg-slate-900/70 hover:shadow-[0_0_55px_rgba(250,215,36,0.45)] sm:flex-row sm:items-center"
    >
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 rounded-2xl bg-[radial-gradient(circle_at_top,_rgba(252,211,77,0.35),_transparent_60%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-full h-24 w-[150%] -translate-x-1/2 -translate-y-1/3 rounded-full bg-gradient-to-b from-[#FEDC56]/55 via-[#FBBF24]/35 to-transparent blur-3xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 overflow-hidden rounded-2xl border border-violet-400/45">
          <Image
            src={participant.championIcon}
            alt={participant.championName}
            fill
            className="object-cover"
          />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-slate-100">
              {participant.championName}
            </h3>
            <Badge variant={resultTone}>{resultLabel}</Badge>
          </div>
          <p className="text-sm text-slate-300/75">
            {match.queueType} • {formatDuration(match.gameDuration)} •{" "}
            {formatRelativeDate(new Date(match.gameCreation))}
          </p>
        </div>
      </div>
      <div className="flex flex-1 flex-wrap items-center gap-4">
        <div className="flex min-w-[120px] flex-col">
          <span className="text-base font-semibold text-slate-100">{kda}</span>
          <span className="text-xs uppercase tracking-wide text-slate-300/65">
            K / D / A
          </span>
        </div>
        {/* Summoner Spells - stacked vertically */}
        <div className="flex flex-col gap-1.5">
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
        {/* Items row, always fixed slots */}
        <div className="flex flex-col gap-2">
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
                <span className="ml-2 text-xs text-slate-400/60">No build data</span>
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
        {/* Runes row, always fixed location on the row */}
        <div className="flex flex-col gap-2">
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
