import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import GitHub from "next-auth/providers/github";
import Google from "next-auth/providers/google";
import {
  authenticateWithPassword,
  getUserByEmail,
  normalizeEmail,
  syncOAuthUser,
} from "@/lib/server/auth/service";
import type { AuthIdentityProvider, AuthRole } from "@/lib/server/auth/types";
import { checkRateLimit, getRateLimitKey } from "@/lib/server/rate-limit";

const hasAuthSecret = Boolean(process.env.AUTH_SECRET?.trim());
const hasGitHub =
  Boolean(process.env.AUTH_GITHUB_ID?.trim()) &&
  Boolean(process.env.AUTH_GITHUB_SECRET?.trim());
const hasGoogle =
  Boolean(process.env.AUTH_GOOGLE_ID?.trim()) &&
  Boolean(process.env.AUTH_GOOGLE_SECRET?.trim());

export const authEnabled = hasAuthSecret;
export const previewAccessEnabled =
  process.env.VERCEL_ENV === "preview" ||
  process.env.ORIGEM_PREVIEW_ACCESS === "1";

const PREVIEW_ACCESS_USER = {
  id: "preview-guest",
  email: "preview@origem.local",
  name: "Preview Access",
  role: "member" as const,
  providers: ["credentials"] as AuthIdentityProvider[],
};

/** Which providers are available — used by the login page */
export const enabledProviders = {
  credentials: authEnabled,
  github: authEnabled && hasGitHub,
  google: authEnabled && hasGoogle,
};

function isAuthRole(value: unknown): value is AuthRole {
  return value === "owner" || value === "member";
}

function isAuthProvider(value: unknown): value is AuthIdentityProvider {
  return value === "credentials" || value === "github" || value === "google";
}

const providers = authEnabled
  ? [
      Credentials({
        name: "Email e senha",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Senha", type: "password" },
        },
        async authorize(credentials, request) {
          const credentialInput = (credentials ?? null) as Record<string, unknown> | null;

          if (
            previewAccessEnabled &&
            credentialInput &&
            typeof credentialInput.previewAccess === "string" &&
            credentialInput.previewAccess === "1"
          ) {
            return PREVIEW_ACCESS_USER;
          }

          const email =
            typeof credentialInput?.email === "string" ? credentialInput.email.trim() : "";
          const password =
            typeof credentialInput?.password === "string" ? credentialInput.password : "";

          if (!email || !password) {
            return null;
          }

          const rateLimit = checkRateLimit(
            getRateLimitKey(request, `auth:login:${normalizeEmail(email)}`),
            8,
            10 * 60_000
          );

          if (!rateLimit.allowed) {
            return null;
          }

          const user = await authenticateWithPassword({ email, password });
          if (!user) {
            return null;
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image ?? undefined,
            role: user.role,
            providers: user.providers,
          };
        },
      }),
      ...(hasGitHub
        ? [
            GitHub({
              authorization: { params: { scope: "read:user user:email repo" } },
            }),
          ]
        : []),
      ...(hasGoogle
        ? [
            Google({
              authorization: {
                params: { prompt: "consent", access_type: "offline" },
              },
            }),
          ]
        : []),
    ]
  : [];

const nextAuth = authEnabled
  ? NextAuth({
      trustHost: true,
      providers,
      session: {
        strategy: "jwt",
        maxAge: 60 * 60 * 24 * 30,
      },
      pages: { signIn: "/login" },
      callbacks: {
        async signIn({ user, account, profile }) {
          if (!account || account.provider === "credentials") {
            return true;
          }

          const email = user.email?.trim();
          if (!email) {
            return "/login?error=OAuthEmailMissing";
          }

          try {
            const profileData = profile as { name?: string; picture?: string } | undefined;
            const syncedUser = await syncOAuthUser({
              email,
              name: user.name ?? profileData?.name ?? null,
              provider: account.provider as "github" | "google",
              image: user.image ?? profileData?.picture ?? null,
            });

            user.id = syncedUser.id;
            user.role = syncedUser.role;
            user.providers = syncedUser.providers;
            user.name = syncedUser.name;
            user.image = syncedUser.image ?? undefined;

            return true;
          } catch (error) {
            if (error instanceof Error && error.message === "registration_closed") {
              return "/login?error=RegistrationClosed";
            }

            console.error("[auth] oauth sign-in failed:", error);
            return "/login?error=OAuthProvisioningFailed";
          }
        },
        async jwt({ token, account, profile, user }) {
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
          if (user) {
            token.userId = user.id;
            token.role = user.role;
            token.providers = user.providers;
            token.name = user.name;
            token.email = user.email;
            token.picture = user.image ?? token.picture;
          } else if (token.email && (!token.userId || !token.role || !token.providers)) {
            const storedUser = await getUserByEmail(token.email);
            if (storedUser) {
              token.userId = storedUser.id;
              token.role = storedUser.role;
              token.providers = storedUser.providers;
              token.name = storedUser.name;
              token.picture = storedUser.image ?? token.picture;
            }
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
          if (session.user) {
            session.user.id =
              typeof token.userId === "string" ? token.userId : "";
            session.user.role = isAuthRole(token.role) ? token.role : "member";
            session.user.providers = Array.isArray(token.providers)
              ? token.providers.filter(isAuthProvider)
              : [];
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
