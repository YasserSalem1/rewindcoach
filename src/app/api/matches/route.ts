import { NextRequest, NextResponse } from "next/server";
import { REGIONS, type Region, REGION_CONFIG } from "@/lib/riot";
import { fetchMatches } from "@/lib/riot/fetchers";

/**
 * API route for fetching match IDs with pagination
 * 
 * This route exists for client-side fetching in MatchList.tsx (load more functionality).
 * It provides paginated match IDs that the client can then fetch individually.
 * 
 * Now uses the refactored riot module which calls /listmatches endpoint.
 */

export async function GET(req: NextRequest) {
  const puuid = req.nextUrl.searchParams.get("puuid");
  const region = req.nextUrl.searchParams.get("region")?.toUpperCase();
  const startIndex = parseInt(req.nextUrl.searchParams.get("start") ?? "0", 10);
  const count = parseInt(req.nextUrl.searchParams.get("count") ?? "10", 10);

  if (!puuid || !region) {
    return NextResponse.json(
      { error: "Missing puuid or region" },
      { status: 400 },
    );
  }

  if (!REGIONS.includes(region as Region)) {
    return NextResponse.json(
      { error: `Unsupported region ${region}` },
      { status: 400 },
    );
  }

  try {
    // Request more matches than needed to determine if there are more available
    // The backend API can return up to 100 matches
    const requestCount = Math.min(startIndex + count + 20, 100);
    
    // Use the riot module fetcher (now uses /listmatches API)
    const allMatchIds = await fetchMatches(
      puuid,
      region as Region,
      requestCount,
      0, // Always start from beginning when checking for pagination
    );

    // Get the subset based on pagination
    const matchIds = allMatchIds.slice(startIndex, startIndex + count);

    // Determine if there are more matches available
    const hasMore = allMatchIds.length > startIndex + count;

    return NextResponse.json(
      { matchIds, hasMore },
      {
        headers: {
          "Cache-Control": "s-maxage=120, stale-while-revalidate=120",
        },
      },
    );
  } catch (error) {
    console.error("[api/matches] Failed", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Failed to load matches" },
      { status: 500 },
    );
  }
}
