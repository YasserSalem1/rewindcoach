import { NextRequest, NextResponse } from "next/server";

import { REGIONS, type Region, getProfileBundle } from "@/lib/riot";

/**
 * API route for profile data
 * 
 * This route exists specifically for client-side validation in SearchCard.tsx.
 * Server components call getProfileBundle() directly from riot.ts.
 */
export async function GET(req: NextRequest) {
  const regionParam = (req.nextUrl.searchParams.get("region") ?? "").toUpperCase();
  const gameName = req.nextUrl.searchParams.get("gameName") ?? "";
  const tagLine = req.nextUrl.searchParams.get("tagLine") ?? "";

  if (!regionParam || !gameName || !tagLine) {
    return NextResponse.json(
      { error: "Missing region, gameName, or tagLine" },
      { status: 400 },
    );
  }

  if (!REGIONS.includes(regionParam as Region)) {
    return NextResponse.json(
      { error: `Unsupported region ${regionParam}` },
      { status: 400 },
    );
  }

  try {
    const bundle = await getProfileBundle(
      regionParam as Region,
      gameName.trim(),
      tagLine.trim(),
    );

    return NextResponse.json(bundle, {
      headers: {
        "Cache-Control": "s-maxage=60, stale-while-revalidate=60",
      },
    });
  } catch (error) {
    console.error("[api/profile] Failed", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Failed to load profile" },
      { status: 500 },
    );
  }
}
