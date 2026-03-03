import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "origem-backend",
    timestamp: Date.now(),
  });
}
