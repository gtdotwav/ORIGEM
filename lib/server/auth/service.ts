import { z } from "zod";
import {
  buildUserId,
  getAuthStore,
} from "@/lib/server/auth/store";
import { hashPassword, verifyPassword } from "@/lib/server/auth/password";
import type {
  AuthIdentityProvider,
  AuthRole,
  AuthUserRecord,
  PublicAuthUser,
} from "@/lib/server/auth/types";

export const RegistrationInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "name_too_short")
    .max(80, "name_too_long"),
  email: z.string().trim().email("invalid_email").max(160, "email_too_long"),
  password: z
    .string()
    .min(10, "password_too_short")
    .max(128, "password_too_long")
    .regex(/[a-z]/, "password_needs_lowercase")
    .regex(/[A-Z]/, "password_needs_uppercase")
    .regex(/[0-9]/, "password_needs_number"),
});

export const CredentialsInputSchema = z.object({
  email: z.string().trim().email("invalid_email"),
  password: z.string().min(1, "password_required"),
});

function isTruthy(value: string | undefined) {
  if (!value) {
    return false;
  }

  const normalized = value.trim().toLowerCase();
  return normalized === "1" || normalized === "true" || normalized === "yes";
}

function cleanName(value: string, fallbackEmail: string) {
  const trimmed = value.trim().replace(/\s+/g, " ");
  if (trimmed.length > 0) {
    return trimmed;
  }

  return fallbackEmail.split("@")[0] ?? "Usuario";
}

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function toPublicAuthUser(user: AuthUserRecord): PublicAuthUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    providers: [...user.providers],
    image: user.image,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    lastLoginAt: user.lastLoginAt,
  };
}

export function isRegistrationExplicitlyEnabled() {
  return isTruthy(process.env.AUTH_ALLOW_REGISTRATION);
}

export async function getAuthSetupState() {
  const store = getAuthStore();
  const userCount = await store.countUsers();
  const bootstrap = userCount === 0;
  const open = bootstrap || isRegistrationExplicitlyEnabled();

  return {
    userCount,
    hasUsers: userCount > 0,
    bootstrap,
    registrationOpen: open,
  };
}

function getRoleForNewUser(userCount: number): AuthRole {
  return userCount === 0 ? "owner" : "member";
}

async function buildNewUserRecord(input: {
  email: string;
  name: string;
  passwordHash: string | null;
  provider: AuthIdentityProvider;
  image?: string | null;
}): Promise<AuthUserRecord> {
  const store = getAuthStore();
  const emailNormalized = normalizeEmail(input.email);
  const userCount = await store.countUsers();
  const now = Date.now();

  return {
    id: buildUserId(emailNormalized),
    email: input.email.trim(),
    emailNormalized,
    name: cleanName(input.name, input.email),
    role: getRoleForNewUser(userCount),
    providers: [input.provider],
    passwordHash: input.passwordHash,
    image: input.image ?? null,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: null,
  };
}

export async function registerUser(input: unknown) {
  const parsed = RegistrationInputSchema.parse(input);
  const store = getAuthStore();
  const emailNormalized = normalizeEmail(parsed.email);
  const existing = await store.getUserByEmailNormalized(emailNormalized);

  if (existing) {
    throw new Error("email_already_in_use");
  }

  const setup = await getAuthSetupState();
  if (!setup.registrationOpen) {
    throw new Error("registration_closed");
  }

  const passwordHash = await hashPassword(parsed.password);
  const record = await buildNewUserRecord({
    email: parsed.email,
    name: parsed.name,
    passwordHash,
    provider: "credentials",
  });

  const saved = await store.upsertUser(record);
  return toPublicAuthUser(saved);
}

export async function authenticateWithPassword(input: unknown) {
  const parsed = CredentialsInputSchema.parse(input);
  const store = getAuthStore();
  const emailNormalized = normalizeEmail(parsed.email);
  const user = await store.getUserByEmailNormalized(emailNormalized);

  if (!user?.passwordHash) {
    return null;
  }

  const isValid = await verifyPassword(parsed.password, user.passwordHash);
  if (!isValid) {
    return null;
  }

  const updated: AuthUserRecord = {
    ...user,
    lastLoginAt: Date.now(),
    updatedAt: Date.now(),
    providers: user.providers.includes("credentials")
      ? user.providers
      : [...user.providers, "credentials"],
  };

  await store.upsertUser(updated);
  return toPublicAuthUser(updated);
}

export async function getUserByEmail(email: string) {
  const store = getAuthStore();
  const user = await store.getUserByEmailNormalized(normalizeEmail(email));
  return user ? toPublicAuthUser(user) : null;
}

export async function getUserById(userId: string) {
  const store = getAuthStore();
  const user = await store.getUserById(userId);
  return user ? toPublicAuthUser(user) : null;
}

export async function syncOAuthUser(input: {
  email: string;
  name?: string | null;
  provider: Exclude<AuthIdentityProvider, "credentials">;
  image?: string | null;
}) {
  const store = getAuthStore();
  const emailNormalized = normalizeEmail(input.email);
  const existing = await store.getUserByEmailNormalized(emailNormalized);
  const now = Date.now();

  if (existing) {
    const nextProviders = existing.providers.includes(input.provider)
      ? existing.providers
      : [...existing.providers, input.provider];

    const updated: AuthUserRecord = {
      ...existing,
      name: input.name ? cleanName(input.name, existing.email) : existing.name,
      providers: nextProviders,
      image: input.image ?? existing.image,
      updatedAt: now,
      lastLoginAt: now,
    };

    await store.upsertUser(updated);
    return toPublicAuthUser(updated);
  }

  const setup = await getAuthSetupState();
  if (!setup.registrationOpen) {
    throw new Error("registration_closed");
  }

  const created = await buildNewUserRecord({
    email: input.email,
    name: input.name ?? input.email,
    passwordHash: null,
    provider: input.provider,
    image: input.image ?? null,
  });

  created.lastLoginAt = now;
  created.updatedAt = now;

  const saved = await store.upsertUser(created);
  return toPublicAuthUser(saved);
}
