import { notFound } from "next/navigation";

import { MatchAnalysisContent } from "@/components/MatchAnalysisContent";
import { PersistProfilePref } from "@/components/PersistProfilePref";
import { REGIONS, type Region, getProfileBundle } from "@/lib/riot";

interface AnalysisPageProps {
  params: Promise<{
    region: string;
    gameName: string;
    tagLine: string;
  }>;
}

export default async function AnalysisPage({ params }: AnalysisPageProps) {
  const { region: regionRaw, gameName: gameNameRaw, tagLine: tagLineRaw } = await params;
  const regionParam = decodeURIComponent(regionRaw).toUpperCase();
  const gameName = decodeURIComponent(gameNameRaw);
  const tagLine = decodeURIComponent(tagLineRaw);
  const normalizedGameName = gameName.trim();
  const normalizedTagLine = tagLine.trim();
  const region = regionParam as Region;

  if (!REGIONS.includes(region) || !normalizedGameName || !normalizedTagLine) {
    notFound();
  }

  let bundle;
  try {
    bundle = await getProfileBundle(region, normalizedGameName, normalizedTagLine, 20);
  } catch (error) {
    console.error("[AnalysisPage] Failed to load profile:", error);
    notFound();
  }

  return (
    <>
      <PersistProfilePref
        region={region}
        gameName={normalizedGameName}
        tagLine={normalizedTagLine}
      />
      <MatchAnalysisContent
        bundle={bundle}
        region={region}
      />
    </>
  );
}
