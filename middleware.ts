import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Auth middleware — only active when AUTH_SECRET is set.
 * Checks for session cookie and redirects to /login directly.
 */
export async function middleware(request: NextRequest) {
  if (!process.env.AUTH_SECRET) {
    return NextResponse.next();
  }

  // Check for NextAuth session token (standard + secure cookie names)
  const hasSession =
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token");

  if (!hasSession) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("callbackUrl", request.nextUrl.pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/((?!auth).*)"],
};
