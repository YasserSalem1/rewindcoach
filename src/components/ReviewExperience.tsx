"use client";

import { useMemo } from "react";

import type { MatchBundle, TimelineEvent } from "@/lib/riot";
import { useScrubber } from "@/hooks/useScrubber";
import { CoachChat } from "@/components/CoachChat";
import { ReviewHeader } from "@/components/ReviewHeader";
import { RiftMap } from "@/components/RiftMap";
import { Timeline } from "@/components/Timeline";

interface ReviewExperienceProps {
  bundle: MatchBundle;
  focusPuuid?: string;
  focusGameName?: string;
  focusTagLine?: string;
}

export function ReviewExperience({
  bundle,
  focusPuuid,
  focusGameName,
  focusTagLine,
}: ReviewExperienceProps) {
  const { match, timeline } = bundle;
  const events = useMemo(
    () =>
      timeline.reduce<TimelineEvent[]>(
        (acc, frame) => acc.concat(frame.events),
        [],
      ),
    [timeline],
  );

  const activePuuid = focusPuuid ?? match.primaryParticipantPuuid;
  const focusParticipant = useMemo(
    () =>
      match.participants.find(
        (participant) => participant.puuid === activePuuid,
      ),
    [activePuuid, match.participants],
  );

  const { currentTime, scrubTo, togglePlay } = useScrubber({
    duration: match.gameDuration,
    onChange: () => {
      // no-op placeholder for future analytics
    },
  });

  return (
    <div className="flex flex-col gap-6">
      <ReviewHeader match={match} currentTime={currentTime} />
      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="flex flex-col gap-4">
          <div className="h-[28rem]">
            <RiftMap events={events} currentTime={currentTime} />
          </div>
          <Timeline
            events={events}
            duration={match.gameDuration}
            currentTime={currentTime}
            onScrub={(time) => {
              togglePlay(false);
              scrubTo(time);
            }}
          />
        </div>
        <CoachChat
          matchId={match.id}
          currentTime={currentTime}
          gameName={focusGameName ?? focusParticipant?.summonerName}
          tagLine={focusTagLine}
        />
      </div>
    </div>
  );
}
