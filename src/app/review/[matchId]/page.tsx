import { notFound } from "next/navigation";

import { ReviewExperience } from "@/components/ReviewExperience";
import type { MatchBundle } from "@/lib/riot";

interface ReviewPageProps {
  params: {
    matchId: string;
  };
  searchParams?: {
    puuid?: string;
  };
}

function getInternalUrl(path: string) {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000");

  if (!path.startsWith("/")) {
    return `${base}/${path}`;
  }
  return `${base}${path}`;
}

async function loadMatch(matchId: string, focusPuuid?: string) {
  const params = new URLSearchParams({
    matchId,
    ...(focusPuuid ? { focusPuuid } : {}),
  });

  const res = await fetch(getInternalUrl(`/api/match?${params.toString()}`), {
    cache: "no-store",
  });

  if (!res.ok) {
    return null;
  }

  return (await res.json()) as MatchBundle;
}

export default async function ReviewPage({ params, searchParams }: ReviewPageProps) {
  const matchId = decodeURIComponent(params.matchId);
  const bundle = await loadMatch(matchId, searchParams?.puuid);

  if (!bundle) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <ReviewExperience bundle={bundle} />
    </div>
  );
}
