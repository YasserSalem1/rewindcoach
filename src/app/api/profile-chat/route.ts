import { NextRequest, NextResponse } from "next/server";

const PROFILE_CHAT_API =
  process.env.PROFILE_CHAT_API ??
  "https://0vsr7n9vj1.execute-api.us-east-1.amazonaws.com/coach_profile";

const PROFILE_CHAT_API_KEY =
  process.env.PROFILE_CHAT_API_KEY ?? process.env.CHAT_API_KEY;

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();

    const upstream = await fetch(PROFILE_CHAT_API, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(PROFILE_CHAT_API_KEY ? { "x-api-key": PROFILE_CHAT_API_KEY } : {}),
      },
      body: JSON.stringify(payload),
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
      return new NextResponse(text || "Upstream profile chat call failed.", {
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
    console.error("[api/profile-chat] Upstream coach_profile call failed.", error);
    return NextResponse.json(
      { error: "Profile coach call failed." },
      { status: 500 },
    );
  }
}
