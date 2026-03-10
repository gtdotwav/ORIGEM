export type AuthRole = "owner" | "member";

export type AuthIdentityProvider = "credentials" | "github" | "google";

export interface AuthUserRecord {
  id: string;
  email: string;
  emailNormalized: string;
  name: string;
  role: AuthRole;
  providers: AuthIdentityProvider[];
  passwordHash: string | null;
  image: string | null;
  createdAt: number;
  updatedAt: number;
  lastLoginAt: number | null;
}

export interface AuthDatabaseShape {
  users: Record<string, AuthUserRecord>;
}

export interface PublicAuthUser {
  id: string;
  email: string;
  name: string;
  role: AuthRole;
  providers: AuthIdentityProvider[];
  image: string | null;
  createdAt: number;
  updatedAt: number;
  lastLoginAt: number | null;
}

