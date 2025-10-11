"use client";

import { useEffect } from "react";

import type { Region } from "@/lib/riot";
import { useLocalStorage } from "@/hooks/useLocalStorage";

interface PersistProfilePrefProps {
  region: Region;
  gameName: string;
  tagLine: string;
}

export function PersistProfilePref({
  region,
  gameName,
  tagLine,
}: PersistProfilePrefProps) {
  const [, setPref] = useLocalStorage("rewindcoach:last-profile", {
    region,
    gameName,
    tagLine,
  });

  useEffect(() => {
    setPref({ region, gameName, tagLine });
  }, [gameName, region, tagLine, setPref]);

  return null;
}
