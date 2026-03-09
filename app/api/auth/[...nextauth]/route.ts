import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { handlers, authEnabled } from "@/lib/auth";

// When auth is not configured, return empty session so SessionProvider doesn't crash
function emptySessionHandler() {
  return NextResponse.json({});
}

// Wrap handlers to ensure they're always callable
async function GET(req: NextRequest) {
  if (!authEnabled) return emptySessionHandler();
  return handlers.GET(req);
}

async function POST(req: NextRequest) {
  if (!authEnabled) return emptySessionHandler();
  return handlers.POST(req);
}

export { GET, POST };
