import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Auth middleware — only active when AUTH_SECRET is set.
 * Without it, all routes pass through (dev / unconfigured deploys).
 */
export async function middleware(request: NextRequest) {
  if (!process.env.AUTH_SECRET) {
    return NextResponse.next();
  }

  // Dynamically import so NextAuth doesn't crash when env vars are missing
  const { auth } = await import("@/lib/auth");
  if (!auth) return NextResponse.next();

  // @ts-expect-error — auth is a middleware handler when configured
  return auth(request);
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/((?!auth).*)"],
};
