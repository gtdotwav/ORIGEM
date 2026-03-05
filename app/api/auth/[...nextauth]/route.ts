import { NextResponse } from "next/server";
import { handlers, authEnabled } from "@/lib/auth";

// When auth is not configured, return empty session so SessionProvider doesn't crash
function emptySessionHandler() {
  return NextResponse.json({});
}

export const GET = authEnabled ? handlers.GET : emptySessionHandler;
export const POST = authEnabled ? handlers.POST : emptySessionHandler;
