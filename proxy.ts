import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { auth, authEnabled } from "@/lib/auth";

function isPublicApiPath(pathname: string) {
  return pathname.startsWith("/api/auth") || pathname === "/api/backend/health";
}

function unauthorizedResponse(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set(
      "callbackUrl",
      `${request.nextUrl.pathname}${request.nextUrl.search}`
    );
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.json({ error: "unauthorized" }, { status: 401 });
}

function authNotConfiguredResponse(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/dashboard")) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("setup", "auth");
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.json({ error: "auth_not_configured" }, { status: 503 });
}

const guardedProxy = auth
  ? auth((request) => {
      if (isPublicApiPath(request.nextUrl.pathname)) {
        return NextResponse.next();
      }

      if (!authEnabled) {
        return authNotConfiguredResponse(request);
      }

      if (request.auth?.user) {
        return NextResponse.next();
      }

      return unauthorizedResponse(request);
    })
  : function proxy(request: NextRequest) {
      if (isPublicApiPath(request.nextUrl.pathname)) {
        return NextResponse.next();
      }

      return authEnabled
        ? unauthorizedResponse(request)
        : authNotConfiguredResponse(request);
    };

export default guardedProxy;

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*"],
};
