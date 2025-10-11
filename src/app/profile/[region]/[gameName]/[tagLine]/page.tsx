import Image from "next/image";
import { notFound } from "next/navigation";

import { HighlightsCard } from "@/components/HighlightsCard";
import { MatchList } from "@/components/MatchList";
import { PersistProfilePref } from "@/components/PersistProfilePref";
import { StyleDNA } from "@/components/StyleDNA";
import { REGIONS, type ProfileBundle, type Region } from "@/lib/riot";
import { Card, CardContent } from "@/components/ui/card";

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

  const { profile: summoner, styleDNA, highlights, matches } = bundle;

  return (
    <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-10">
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
        <Card className="bg-slate-900/45 p-4 text-sm text-slate-200">
          <CardContent className="flex items-center gap-4">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-300/65">
                Season Focus
              </p>
              <p className="text-sm text-slate-300/75">
                RewindCoach summarises your last 20 games and reveals your style DNA
                fingerprint. Dive into any match to see timeline events with coach
                highlights.
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
      <section className="grid gap-6 lg:grid-cols-[1.1fr,1.8fr,1fr]">
        <StyleDNA data={styleDNA} />
        <MatchList matches={matches} />
        <HighlightsCard highlights={highlights} />
      </section>
    </div>
  );
}
