"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

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
  const isWin = participant.win;
  const kda = kdaString(participant.kills, participant.deaths, participant.assists);
  const resultLabel = isWin ? "Victory" : "Defeat";
  const resultTone = isWin ? "good" : "bad";

  const review = () => {
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

  return (
    <motion.article
      variants={rowVariants}
      initial="initial"
      animate="animate"
      className="flex flex-col gap-4 rounded-2xl border border-white/5 bg-slate-900/45 p-4 transition hover:border-violet-400/40 hover:bg-slate-900/65 sm:flex-row sm:items-center"
    >
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
        <div className="flex flex-col gap-2">
          <span className="text-xs uppercase text-slate-300/65">Items</span>
          <div className="flex items-center gap-1.5">
            {participant.items.length > 0 ? (
              participant.items.map((item) => (
                <Image
                  key={item.id}
                  src={item.icon}
                  alt={item.name}
                  width={28}
                  height={28}
                  className="rounded-lg border border-white/10 bg-slate-900/60 p-0.5"
                />
              ))
            ) : (
              <span className="text-xs text-slate-400/60">No build data</span>
            )}
            {participant.trinket ? (
              <Image
                src={participant.trinket.icon}
                alt={participant.trinket.name}
                width={28}
                height={28}
                className="rounded-lg border border-violet-400/45 bg-slate-900/60 p-0.5"
              />
            ) : null}
          </div>
        </div>
        {participant.runes?.primary ? (
          <div className="flex flex-col gap-2">
            <span className="text-xs uppercase text-slate-300/65">Runes</span>
            <div className="flex items-center gap-1.5">
              <Image
                src={participant.runes.primary}
                alt="Primary rune"
                width={28}
                height={28}
                className="rounded-full border border-violet-400/45 bg-slate-900/60 p-0.5"
              />
              {participant.runes.secondary ? (
                <Image
                  src={participant.runes.secondary}
                  alt="Secondary rune"
                  width={28}
                  height={28}
                  className="rounded-full border border-white/10 bg-slate-900/60 p-0.5"
                />
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
      <Button
        variant="secondary"
        className="w-full sm:w-auto"
        onClick={review}
      >
        Review
      </Button>
    </motion.article>
  );
}
