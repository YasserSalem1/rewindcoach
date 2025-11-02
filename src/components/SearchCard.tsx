"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

import { useLocalStorage } from "@/hooks/useLocalStorage";
import { REGIONS, type Region } from "@/lib/riot";
import { cn } from "@/lib/ui";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function SearchCard({
  className,
}: {
  className?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [profilePref, setProfilePref] = useLocalStorage<{
    region: Region;
    gameName: string;
    tagLine: string;
  }>("rewindcoach:last-profile", {
    region: "EUW",
    gameName: "",
    tagLine: "",
  });

  const [region, setRegion] = useState<Region>(profilePref.region ?? "EUW");
  const [gameName, setGameName] = useState("");
  const [tagLine, setTagLine] = useState("");
  const [error, setError] = useState<string>();
  const [isValidating, setIsValidating] = useState(false);

  const submit = async () => {
    if (!gameName.trim() || !tagLine.trim()) {
      setError("Enter both your in-game name and tagline.");
      return;
    }

    setError(undefined);
    setIsValidating(true);

    const trimmedGame = gameName.trim();
    const trimmedTag = tagLine.trim();

    try {
      // Save preference and navigate directly - validation will happen on profile page
      // This is faster than pre-validating via API call
      setProfilePref({ region, gameName: trimmedGame, tagLine: trimmedTag });
      const path = `/profile/${region}/${encodeURIComponent(trimmedGame)}/${encodeURIComponent(trimmedTag)}`;
      
      startTransition(() => {
        router.push(path);
      });
    } catch (error) {
      console.error("[SearchCard] navigation failed", error);
      setError("Navigation error. Please try again.");
      setIsValidating(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className={cn("flex w-full justify-center", className)}
    >
      <Card className="w-full max-w-xl border-white/10 bg-slate-900/60 p-8 shadow-[0_0_60px_rgba(79,70,229,0.25)]">
        <CardHeader className="items-center text-center">
          <CardTitle className="font-heading text-3xl text-slate-100">
            Ready to rewind your season?
          </CardTitle>
          <CardDescription className="text-base text-slate-300/80">
            Plug in your Riot IGN and tagline to generate a personalised year in
            review plus game-by-game coaching insights.
          </CardDescription>
        </CardHeader>
        <CardContent className="mt-6 flex flex-col gap-5">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-200">
                Region
              </label>
              <Select value={region} onValueChange={(value) => setRegion(value as Region)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  {REGIONS.map((r) => (
                    <SelectItem key={r} value={r}>
                      {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-200">
                In-Game Name
              </label>
              <Input
                value={gameName}
                onChange={(event) => setGameName(event.target.value)}
                aria-label="Riot in-game name"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    submit();
                  }
                }}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-slate-200">
                Tagline
              </label>
              <Input
                value={tagLine}
                onChange={(event) => setTagLine(event.target.value)}
                aria-label="Riot tagline"
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    submit();
                  }
                }}
              />
            </div>
          </div>
          {error ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-lg border border-red-400/40 bg-red-500/10 p-3"
            >
              <p className="text-sm font-medium text-red-300">{error}</p>
            </motion.div>
          ) : (
            <p className="text-sm text-slate-300/70">
              Enter the exact Riot details from your Riot client (IGN on the left,
              tagline on the right).
            </p>
          )}
          <Button
            className="mt-2 h-12 w-full text-base shadow-[0_15px_45px_-18px_rgba(99,102,241,0.8)]"
            onClick={() => {
              submit();
            }}
            disabled={isPending || isValidating}
          >
            {isPending || isValidating ? (
              <span className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                {isValidating ? "Validating..." : "Loading profile…"}
              </span>
            ) : (
              "Show my profile"
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
