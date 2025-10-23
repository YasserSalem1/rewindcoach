import { notFound } from "next/navigation";

import { ChronicleContent } from "@/components/ChronicleContent";
import { PersistProfilePref } from "@/components/PersistProfilePref";
import { REGIONS, type Region, getProfileBundle } from "@/lib/riot";

interface ChroniclePageProps {
  params: Promise<{
    region: string;
    gameName: string;
    tagLine: string;
  }>;
}

export default async function ChroniclePage({ params }: ChroniclePageProps) {
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
    bundle = await getProfileBundle(region, normalizedGameName, normalizedTagLine);
  } catch (error) {
    console.error("[ChroniclePage] Failed to load profile:", error);
    notFound();
  }

  return (
    <>
      <PersistProfilePref
        region={region}
        gameName={normalizedGameName}
        tagLine={normalizedTagLine}
      />
      <ChronicleContent
        bundle={bundle}
        region={region}
      />
    </>
  );
}
