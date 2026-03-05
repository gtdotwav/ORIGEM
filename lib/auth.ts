import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";

/**
 * Auth is only active when AUTH_SECRET + AUTH_GITHUB_ID are set.
 * Without them, all routes are accessible (dev / unconfigured deploys).
 */
export const authEnabled =
  !!process.env.AUTH_SECRET && !!process.env.AUTH_GITHUB_ID;

const nextAuth = authEnabled
  ? NextAuth({
      providers: [GitHub],
      pages: { signIn: "/login" },
      callbacks: {
        authorized({ auth: session, request: { nextUrl } }) {
          const isLoggedIn = !!session?.user;
          const isProtected =
            nextUrl.pathname.startsWith("/dashboard") ||
            (nextUrl.pathname.startsWith("/api") &&
              !nextUrl.pathname.startsWith("/api/auth"));

          if (isProtected) return isLoggedIn;
          return true;
        },
      },
    })
  : null;

// Export real handlers when configured, no-ops otherwise
export const handlers = nextAuth?.handlers ?? {
  GET: () => new Response("Auth not configured", { status: 404 }),
  POST: () => new Response("Auth not configured", { status: 404 }),
};
export const auth = nextAuth?.auth ?? null;
export const signIn = nextAuth?.signIn ?? (async () => {});
export const signOut = nextAuth?.signOut ?? (async () => {});
