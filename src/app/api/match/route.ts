import { NextRequest, NextResponse } from "next/server";

import { getMatchBundle } from "@/lib/riot";

export async function GET(req: NextRequest) {
  const matchId = req.nextUrl.searchParams.get("matchId");
  const focusPuuid = req.nextUrl.searchParams.get("focusPuuid") ?? undefined;

  if (!matchId) {
    return NextResponse.json({ error: "Missing matchId" }, { status: 400 });
  }

  try {
    const bundle = await getMatchBundle(matchId, focusPuuid ?? undefined);
    return NextResponse.json(bundle);
  } catch (error) {
    console.error("[api/match] Failed to build bundle", error);
    return NextResponse.json(
      { error: (error as Error).message ?? "Failed to load match bundle." },
      { status: 500 },
    );
  }
}
