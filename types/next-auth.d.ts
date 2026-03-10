import type { DefaultSession } from "next-auth";
import type { AuthIdentityProvider, AuthRole } from "@/lib/server/auth/types";

declare module "next-auth" {
  interface Session {
    accessToken?: string;
    provider?: string;
    githubUsername?: string;
    user: DefaultSession["user"] & {
      id: string;
      role: AuthRole;
      providers: AuthIdentityProvider[];
    };
  }

  interface User {
    id: string;
    role: AuthRole;
    providers: AuthIdentityProvider[];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    userId?: string;
    role?: AuthRole;
    providers?: AuthIdentityProvider[];
    accessToken?: string;
    provider?: string;
    githubUsername?: string;
    picture?: string;
  }
}
