import NextAuth from "next-auth";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";

/**
 * Auth is active when AUTH_SECRET is set and at least one provider is configured.
 */
const hasGitHub = !!process.env.AUTH_GITHUB_ID;
const hasGoogle = !!process.env.AUTH_GOOGLE_ID;

export const authEnabled = !!process.env.AUTH_SECRET && (hasGitHub || hasGoogle);

/** Which providers are available — used by the login page */
export const enabledProviders = {
  github: hasGitHub,
  google: hasGoogle,
};

const providers = [
  ...(hasGitHub
    ? [GitHub({ authorization: { params: { scope: "read:user user:email repo" } } })]
    : []),
  ...(hasGoogle
    ? [Google({ authorization: { params: { prompt: "consent", access_type: "offline" } } })]
    : []),
];

const nextAuth = authEnabled
  ? NextAuth({
      providers,
      pages: { signIn: "/login" },
      callbacks: {
        async jwt({ token, account, profile }) {
          if (account?.access_token) {
            token.accessToken = account.access_token;
            token.provider = account.provider;
          }
          if (account?.provider === "github") {
            token.githubUsername = account.providerAccountId;
          }
          if (profile?.picture) {
            token.picture = profile.picture as string;
          }
          return token;
        },
        async session({ session, token }) {
          const s = session as unknown as Record<string, unknown>;
          s.accessToken = token.accessToken;
          s.provider = token.provider;
          if (token.githubUsername) s.githubUsername = token.githubUsername;
          if (token.picture && session.user) {
            session.user.image = token.picture as string;
          }
          return session;
        },
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
