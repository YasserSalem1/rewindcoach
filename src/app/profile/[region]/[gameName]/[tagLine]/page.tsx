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
  params: Promise<{
    region: string;
    gameName: string;
    tagLine: string;
  }>;
}

export default async function ProfilePage({ params }: ProfilePageProps) {
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
      <section className="flex flex-col gap-6 rounded-3xl border border-white/10 bg-slate-950/70 p-6 shadow-[0_0_60px_rgba(79,70,229,0.18)] md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-5">
          <div className="relative h-24 w-24 overflow-hidden rounded-3xl border border-violet-400/45">
            <Image
              src={summoner.profileIcon}
              alt={`${summoner.summonerName} icon`}
              fill
              className="object-cover"
            />
          </div>
          <div>
            <h1 className="font-heading text-3xl text-slate-100">
              {summoner.summonerName}
              <span className="text-slate-300/70">#{summoner.tagline}</span>
            </h1>
            <p className="text-sm text-slate-300/75">
              Level {summoner.level} • {region} • Ranked {summoner.rankedTier}{" "}
              {summoner.rankedDivision} ({summoner.rankedLp} LP)
            </p>
          </div>
        </div>
      </section>
      <section className="grid gap-6 lg:grid-cols-[1.1fr,1.8fr,1fr]">
        <StyleDNA data={styleDNA} />
        <MatchList
          matches={matches}
          gameName={normalizedGameName}
          tagLine={normalizedTagLine}
        />
        <HighlightsCard highlights={highlights} />
      </section>
    </div>
      <ProfileContent
        bundle={bundle}
        region={region}
        gameName={normalizedGameName}
        tagLine={normalizedTagLine}
      />
    </>
  );
}
