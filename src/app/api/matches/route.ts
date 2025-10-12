import { NextRequest, NextResponse } from "next/server";
import { REGIONS, type Region } from "@/lib/riot";

// We'll need a helper to fetch additional matches
interface BackendMatchesResponse {
  matches?: string[];
  matchIds?: string[];
}

interface BackendMatchDto {
  metadata: {
    matchId: string;
    participants: string[];
  };
  info: {
    gameCreation: number;
    gameDuration: number;
    gameVersion: string;
    queueId: number;
    participants: Array<any>;
    teams: Array<any>;
  };
}

const BACKEND_FALLBACK_BASE =
  process.env.BACKEND_API_BASE_URL ||
  process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL ||
  "https://0vsr7n9vj1.execute-api.us-east-1.amazonaws.com";

const BACKEND_API_KEY =
  process.env.BACKEND_API_KEY ?? process.env.CHAT_API_KEY ?? null;

function getBackendBase() {
  return BACKEND_FALLBACK_BASE.endsWith("/")
    ? BACKEND_FALLBACK_BASE.slice(0, -1)
    : BACKEND_FALLBACK_BASE;
}

async function backendFetch<T>(path: string): Promise<T> {
  const base = getBackendBase();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;
  const resp = await fetch(url, {
    headers: BACKEND_API_KEY ? { "x-api-key": BACKEND_API_KEY } : undefined,
    cache: "no-store",
  });

  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`Backend API error (${resp.status}) for ${url}: ${body}`);
  }

  return (await resp.json()) as T;
}

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
    // Riot's match API typically returns up to 100 matches
    const requestCount = Math.min(startIndex + count + 20, 100);
    
    // Fetch match IDs from backend
    const matchesResponse = await backendFetch<BackendMatchesResponse | string[]>(
      `/matches?puuid=${encodeURIComponent(puuid)}&count=${requestCount}&region=${encodeURIComponent(region)}`,
    );

    const allMatchIds = Array.isArray(matchesResponse)
      ? matchesResponse
      : (matchesResponse as BackendMatchesResponse).matches ?? 
        (matchesResponse as any).matchIds ?? [];

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

