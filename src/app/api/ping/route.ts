import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    base: process.env.BACKEND_API_BASE_URL ?? "test",
  });
}
