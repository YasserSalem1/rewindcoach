import { notFound } from "next/navigation";

import { PersistProfilePref } from "@/components/PersistProfilePref";
import { ProfileContent } from "@/components/ProfileContent";
import { REGIONS, type ProfileBundle, type Region } from "@/lib/riot";

function getInternalUrl(path: string) {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  if (!path.startsWith("/")) {
    return `${base}/${path}`;
  }
  return `${base}${path}`;
}

async function loadProfileData(region: Region, gameName: string, tagLine: string) {
  const params = new URLSearchParams({
    region,
    gameName,
    tagLine,
  });

  const res = await fetch(getInternalUrl(`/api/profile?${params.toString()}`), {
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  return (await res.json()) as ProfileBundle;
}

interface ProfilePageProps {
  params: {
    region: string;
    gameName: string;
    tagLine: string;
  };
}

export default async function ProfilePage({ params }: ProfilePageProps) {
  const regionParam = decodeURIComponent(params.region).toUpperCase();
  const gameName = decodeURIComponent(params.gameName);
  const tagLine = decodeURIComponent(params.tagLine);
  const normalizedGameName = gameName.trim();
  const normalizedTagLine = tagLine.trim();
  const region = regionParam as Region;

  if (!REGIONS.includes(region) || !normalizedGameName || !normalizedTagLine) {
    notFound();
  }

  const bundle = await loadProfileData(region, normalizedGameName, normalizedTagLine);

  if (!bundle) {
    notFound();
  }

  return (
    <>
      <PersistProfilePref
        region={region}
        gameName={normalizedGameName}
        tagLine={normalizedTagLine}
      />
      <ProfileContent
        bundle={bundle}
        region={region}
        gameName={normalizedGameName}
        tagLine={normalizedTagLine}
      />
    </>
  );
}
