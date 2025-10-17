import { notFound } from "next/navigation";

import { ReviewExperience } from "@/components/ReviewExperience";
import { getMatchBundle } from "@/lib/riot";

interface ReviewPageProps {
  params: Promise<{
    matchId: string;
  }>;
  searchParams?: Promise<{
    puuid?: string;
    gameName?: string;
    tagLine?: string;
  }>;
}

export default async function ReviewPage({ params, searchParams }: ReviewPageProps) {
  // Await params and searchParams (Next.js 15 requirement)
  const { matchId: matchIdRaw } = await params;
  const searchParamsResolved = searchParams ? await searchParams : undefined;
  
  const matchId = decodeURIComponent(matchIdRaw);
  
  // Call riot.ts directly - no HTTP overhead
  let bundle;
  try {
    bundle = await getMatchBundle(matchId, searchParamsResolved?.puuid);
  } catch (error) {
    console.error("[ReviewPage] Failed to load match:", error);
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10">
      <ReviewExperience
        bundle={bundle}
        focusPuuid={searchParamsResolved?.puuid ?? bundle.match.primaryParticipantPuuid}
        focusGameName={searchParamsResolved?.gameName ?? undefined}
        focusTagLine={searchParamsResolved?.tagLine ?? undefined}
      />
    </div>
  );
}
