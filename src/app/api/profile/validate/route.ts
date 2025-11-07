"use server";

import { NextRequest, NextResponse } from "next/server";

import { REGIONS, type Region } from "@/lib/riot";
import { fetchAccount } from "@/lib/riot/fetchers";

export async function GET(req: NextRequest) {
  const regionParam = (req.nextUrl.searchParams.get("region") ?? "").toUpperCase();
  const gameName = (req.nextUrl.searchParams.get("gameName") ?? "").trim();
  const tagLine = (req.nextUrl.searchParams.get("tagLine") ?? "").trim();

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
    const account = await fetchAccount(
      regionParam as Region,
      gameName,
      tagLine,
    );

    if (!account?.puuid) {
      return NextResponse.json(
        { error: "We couldn’t find that Riot ID." },
        { status: 404 },
      );
    }

    return NextResponse.json({
      ok: true,
      puuid: account.puuid,
    });
  } catch (error) {
    const message = (error as Error).message ?? "Failed to validate profile";
    const isNotFound =
      message.includes("(404)") ||
      /not found/i.test(message);

    return NextResponse.json(
      {
        error: isNotFound
          ? "We couldn’t find that Riot ID. Double-check the name and tagline."
          : "Unable to validate that Riot ID right now. Please try again.",
      },
      { status: isNotFound ? 404 : 500 },
    );
  }
}
