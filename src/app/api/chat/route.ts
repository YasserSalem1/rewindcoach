import { NextRequest, NextResponse } from "next/server";

const CHAT_API =
  process.env.CHAT_API ??
  "https://0vsr7n9vj1.execute-api.us-east-1.amazonaws.com/coach";

const CHAT_API_KEY = process.env.CHAT_API_KEY;

const COACH_MATCH_API =
  process.env.COACH_MATCH_API ??
  "https://0vsr7n9vj1.execute-api.us-east-1.amazonaws.com/coach_match";

const COACH_MATCH_API_KEY =
  process.env.COACH_MATCH_API_KEY ?? process.env.CHAT_API_KEY;

async function fetchCoachMatchContext({
  matchId,
  gameName,
  tagLine,
}: {
  matchId: string;
  gameName: string;
  tagLine: string;
}) {
  const url = new URL(COACH_MATCH_API);
  url.searchParams.set("matchId", matchId);
  url.searchParams.set("gameName", gameName);
  url.searchParams.set("tagLine", tagLine);

  const response = await fetch(url.toString(), {
    headers: {
      Accept: "application/json",
      ...(COACH_MATCH_API_KEY ? { "x-api-key": COACH_MATCH_API_KEY } : {}),
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const body = await response.text().catch(() => "");
    throw new Error(
      `Coach match fetch failed (${response.status}) for ${url.toString()}: ${body}`,
    );
  }

  return response.json();
}

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    let enrichedPayload = payload;

    if (
      payload &&
      !payload.matchContext &&
      typeof payload.matchId === "string" &&
      typeof payload.gameName === "string" &&
      typeof payload.tagLine === "string"
    ) {
      try {
        const matchContext = await fetchCoachMatchContext({
          matchId: payload.matchId,
          gameName: payload.gameName,
          tagLine: payload.tagLine,
        });

        if (matchContext) {
          enrichedPayload = { ...payload, matchContext };
        }
      } catch (contextError) {
        console.error("[api/chat] Failed to enrich payload with match context.", contextError);
      }
    }

    const upstream = await fetch(CHAT_API, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(CHAT_API_KEY ? { "x-api-key": CHAT_API_KEY } : {}),
      },
      body: JSON.stringify(enrichedPayload),
      cache: "no-store",
    });

    const contentType = upstream.headers.get("content-type") || "";
    const isJson = contentType.includes("application/json");

    if (isJson) {
      const data = await upstream.json();

      if (!upstream.ok) {
        return NextResponse.json(data, { status: upstream.status });
      }

      const output =
        typeof data.output === "string"
          ? data.output
          : typeof data.message === "string"
            ? data.message
            : typeof data.completion === "string"
              ? data.completion
              : null;

      if (output) {
        const encoder = new TextEncoder();
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(output));
            controller.close();
          },
        });

        return new NextResponse(stream, {
          status: upstream.status,
          headers: { "content-type": "text/plain; charset=utf-8" },
        });
      }

      return NextResponse.json(data, { status: upstream.status });
    }

    if (!upstream.ok) {
      const text = await upstream.text();
      return new NextResponse(text || "Upstream chat call failed.", {
        status: upstream.status,
        headers: {
          "content-type": contentType || "text/plain; charset=utf-8",
        },
      });
    }

    return new NextResponse(upstream.body, {
      status: upstream.status,
      headers: {
        "content-type": contentType || "text/plain; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("[api/chat] Upstream chat call failed.", error);
    return NextResponse.json(
      { error: "Upstream chat call failed." },
      { status: 500 },
    );
  }
}
