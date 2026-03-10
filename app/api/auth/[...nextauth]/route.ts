import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { handlers, authEnabled } from "@/lib/auth";

// When auth is not configured, return empty session so SessionProvider doesn't crash
function emptySessionHandler() {
  return NextResponse.json({});
}

function unavailableHandler() {
  return NextResponse.json({ error: "auth_not_configured" }, { status: 503 });
}

// Wrap handlers to ensure they're always callable
async function GET(req: NextRequest) {
  if (!authEnabled) {
    return req.nextUrl.pathname.endsWith("/session")
      ? emptySessionHandler()
      : unavailableHandler();
  }
  return handlers.GET(req);
}

async function POST(req: NextRequest) {
  if (!authEnabled) {
    return unavailableHandler();
  }
  return handlers.POST(req);
}

export { GET, POST };
