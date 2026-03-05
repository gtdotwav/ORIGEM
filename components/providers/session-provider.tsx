"use client";

import { SessionProvider } from "next-auth/react";

export function AuthSessionProvider({
  children,
  enabled,
}: {
  children: React.ReactNode;
  enabled: boolean;
}) {
  // Always render SessionProvider so useSession() works everywhere.
  // When auth is disabled, the /api/auth/session endpoint returns
  // an empty session which is fine — no errors, no user shown.
  return (
    <SessionProvider
      refetchOnWindowFocus={false}
      // When auth is not configured, don't attempt to refetch
      refetchInterval={enabled ? 300 : 0}
    >
      {children}
    </SessionProvider>
  );
}
