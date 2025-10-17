import { NextRequest, NextResponse } from "next/server";
import { getMatchBundle } from "@/lib/riot";

/**
 * API route for match data
 * 
 * This route exists for client-side fetching in MatchList.tsx (load more functionality).
 * Server components call getMatchBundle() directly from riot.ts.
 */
export async function GET(req: NextRequest) {
  const matchId = req.nextUrl.searchParams.get("matchId");
  const focusPuuid = req.nextUrl.searchParams.get("focusPuuid") || req.nextUrl.searchParams.get("puuid");

  if (!matchId) {
    return NextResponse.json(
      { error: "Missing matchId" },
      { status: 400 },
    );
  }

  try {
    // Use the existing getMatchBundle function which returns match + timeline
    const bundle = await getMatchBundle(matchId, focusPuuid || undefined);

    return NextResponse.json(bundle, {
      headers: {
        "Cache-Control": "s-maxage=300, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("[api/match] Failed", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Failed to load match" },
      { status: 500 },
    );
  }
}
