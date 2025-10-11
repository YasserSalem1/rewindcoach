import { NextRequest, NextResponse } from "next/server";

const CHAT_API =
  process.env.CHAT_API ??
  "https://0vsr7n9vj1.execute-api.us-east-1.amazonaws.com/coach";

const CHAT_API_KEY = process.env.CHAT_API_KEY;

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const upstream = await fetch(CHAT_API, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(CHAT_API_KEY ? { "x-api-key": CHAT_API_KEY } : {}),
      },
      body: JSON.stringify(payload),
    });

    const contentType = upstream.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await upstream.json();
      return NextResponse.json(data, { status: upstream.status });
    }

    const text = await upstream.text();
    return new NextResponse(text, {
      status: upstream.status,
      headers: { "content-type": contentType || "text/plain" },
    });
  } catch (error) {
    console.error("[api/chat] Upstream chat call failed.", error);
    return NextResponse.json(
      { error: "Upstream chat call failed." },
      { status: 500 },
    );
  }
}
