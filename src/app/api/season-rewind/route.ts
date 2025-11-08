import { NextRequest, NextResponse } from "next/server";

const STATS_API_BASE = "https://ncois6bqrc.execute-api.us-east-1.amazonaws.com/stats";

/**
 * GET /api/season-rewind?gameName=<name>&tagLine=<tag>
 * Checks the status of season statistics for a given player
 * Uses the same /stats/initiate endpoint which checks DB first
 */
export async function GET(req: NextRequest) {
  const gameName = req.nextUrl.searchParams.get("gameName");
  const tagLine = req.nextUrl.searchParams.get("tagLine");

  if (!gameName || !tagLine) {
    return NextResponse.json(
      { error: "Missing gameName or tagLine parameters" },
      { status: 400 }
    );
  }

  try {
    // Use the same initiate endpoint - it checks DB first and returns cached status
    const response = await fetch(`${STATS_API_BASE}/initiate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ gameName, tagLine }),
    });

    // Return the response as-is, preserving status codes (404, 200, etc.)
    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[api/season-rewind] GET failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch season rewind status" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/season-rewind
 * Initiates season statistics calculation for a given player
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { gameName, tagLine } = body;

    if (!gameName || !tagLine) {
      return NextResponse.json(
        { error: "Missing gameName or tagLine" },
        { status: 400 }
      );
    }

    const response = await fetch(`${STATS_API_BASE}/initiate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ gameName, tagLine }),
    });

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("[api/season-rewind] POST failed:", error);
    return NextResponse.json(
      { error: "Failed to initiate season rewind" },
      { status: 500 }
    );
  }
}


