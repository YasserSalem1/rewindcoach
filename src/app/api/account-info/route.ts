import { NextRequest, NextResponse } from "next/server";

import { getAccountInfo } from "@/lib/riot";

export async function GET(req: NextRequest) {
  const riotId = req.nextUrl.searchParams.get("riotId") ?? undefined;
  const gameName = req.nextUrl.searchParams.get("gameName") ?? undefined;
  const tagLine = req.nextUrl.searchParams.get("tagLine") ?? undefined;
  const puuid = req.nextUrl.searchParams.get("puuid") ?? undefined;
  const platform = req.nextUrl.searchParams.get("platform") ?? undefined;

  if (!riotId && !(gameName && tagLine) && !puuid) {
    return NextResponse.json(
      { error: "Provide riotId, gameName+tagLine, or puuid" },
      { status: 400 },
    );
  }

  try {
    const info = await getAccountInfo({
      riotId,
      gameName,
      tagLine,
      puuid,
      platform,
    });

    return NextResponse.json(info, {
      headers: {
        "Cache-Control": "s-maxage=30, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("[api/account-info] Failed", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Failed to fetch account info" },
      { status: 500 },
    );
  }
}
