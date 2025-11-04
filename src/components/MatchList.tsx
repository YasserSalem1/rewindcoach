"use client";

import { useMemo, useState, useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";

import { MatchRow } from "@/components/MatchRow";
import type { RiotMatch } from "@/lib/riot";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface MatchListProps {
  matches: RiotMatch[];
  heading?: string;
  puuid?: string;
  region?: string;
  onMatchesUpdate?: (matches: RiotMatch[]) => void;
}

export function MatchList({ 
  matches: initialMatches, 
  heading = "Match History",
  puuid,
  region,
  onMatchesUpdate 
}: MatchListProps) {
  const [matches, setMatches] = useState<RiotMatch[]>(initialMatches);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const matchEntries = useMemo(
    () =>
      matches.map((match) => {
        const participant = match.participants.find(
          (p) => p.puuid === match.primaryParticipantPuuid,
        );
        return participant ? { match, participant } : null;
      }),
    [matches],
  ).filter(Boolean) as Array<{ match: RiotMatch; participant: RiotMatch["participants"][number] }>;

  const loadMoreMatches = useCallback(async () => {
    if (!puuid || !region || isLoading) return;

    setIsLoading(true);
    try {
      const startIndex = matches.length;
      const response = await fetch(
        `/api/matches?puuid=${encodeURIComponent(puuid)}&region=${encodeURIComponent(region)}&start=${startIndex}&count=5`
      );

      if (!response.ok) {
        throw new Error("Failed to load more matches");
      }

      const data = await response.json();
      const { matchIds, hasMore: moreAvailable } = data;

      // Only hide button if we got no matches at all
      if (!matchIds || matchIds.length === 0) {
        setHasMore(false);
        return;
      }

      // Fetch full match data for each match ID IN PARALLEL for better performance
      const matchPromises = matchIds.map(async (matchId: string) => {
        try {
          const matchResponse = await fetch(
            `/api/match?matchId=${encodeURIComponent(matchId)}&puuid=${encodeURIComponent(puuid)}`
          );
          if (matchResponse.ok) {
            const bundle = await matchResponse.json();
            // Extract just the match from the bundle (API returns MatchBundle with match + timeline)
            return bundle.match || bundle;
          }
          return null;
        } catch (error) {
          console.error(`Failed to load match ${matchId}:`, error);
          return null;
        }
      });

      const matchResults = await Promise.all(matchPromises);
      const newMatches: RiotMatch[] = matchResults.filter((m): m is RiotMatch => m !== null);

      // Only update hasMore if we got fewer matches than requested or backend says no more
      if (newMatches.length === 0) {
        setHasMore(false);
        return;
      }

      const updatedMatches = [...matches, ...newMatches];
      setMatches(updatedMatches);
      
      // Keep button visible unless backend explicitly says no more
      setHasMore(moreAvailable);
      
      // Always notify parent component of updates for analytics recalculation
      if (onMatchesUpdate) {
        onMatchesUpdate(updatedMatches);
      }
    } catch (error) {
      console.error("Failed to load more matches:", error);
    } finally {
      setIsLoading(false);
    }
  }, [matches, puuid, region, isLoading, onMatchesUpdate]);

  return (
    <Card className="h-full border-white/5 bg-slate-950/65">
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>{heading}</CardTitle>
      </CardHeader>
      <CardContent className="mt-4">
        <ScrollArea className="h-[28rem] pr-2">
          <div className="flex flex-col gap-4">
            {matchEntries.map(({ match, participant }) => (
              <MatchRow
                key={match.id}
                match={match}
                participant={participant}
              />
            ))}
            {puuid && region && hasMore && (
              <Button 
                variant="secondary" 
                onClick={loadMoreMatches}
                disabled={isLoading}
                className="w-full mt-2 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Loading matches...
                  </span>
                ) : (
                  "Load More Matches"
                )}
              </Button>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
