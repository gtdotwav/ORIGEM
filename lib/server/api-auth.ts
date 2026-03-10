import { NextResponse } from "next/server";
import type { Session } from "next-auth";
import { auth, authEnabled } from "@/lib/auth";

export async function getApiSession(): Promise<Session | null> {
  if (!authEnabled || !auth) {
    return null;
  }

  return auth();
}

export async function requireApiSession(): Promise<Session | Response | null> {
  const session = await getApiSession();

  if (!authEnabled) {
    return null;
  }

  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  return session;
}
