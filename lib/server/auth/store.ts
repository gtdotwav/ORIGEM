import { createHash } from "node:crypto";
import type { AuthUserRecord } from "@/lib/server/auth/types";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uzqzetbcynoiptmnufxv.supabase.co";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_0ljR9h3-FUMUuKHGA9EVQA_qHgeCn0n";

async function supabaseFetch(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${endpoint}`, {
    ...options,
    headers: {
      "apikey": SUPABASE_ANON_KEY,
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      "Prefer": "return=representation",
      ...(options.headers || {}),
    },
  });
  
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Supabase error: ${res.statusText} - ${text}`);
  }
  
  if (res.status === 204) return null;
  return res.json();
}

class AuthStore {
  async countUsers(): Promise<number> {
    const data = await supabaseFetch("auth_users?select=id", { method: "GET" });
    return data ? data.length : 0;
  }

  async listUsers(): Promise<AuthUserRecord[]> {
    const data = await supabaseFetch("auth_users?select=raw_data");
    return (data || [])
      .map((row: any) => row.raw_data as AuthUserRecord)
      .sort((a: any, b: any) => b.updatedAt - a.updatedAt);
  }

  async getUserByEmailNormalized(
    emailNormalized: string
  ): Promise<AuthUserRecord | null> {
    const data = await supabaseFetch(`auth_users?email_normalized=eq.${encodeURIComponent(emailNormalized)}&select=raw_data`);
    if (!data || data.length === 0) return null;
    return data[0].raw_data as AuthUserRecord;
  }

  async getUserById(userId: string): Promise<AuthUserRecord | null> {
    const data = await supabaseFetch(`auth_users?id=eq.${encodeURIComponent(userId)}&select=raw_data`);
    if (!data || data.length === 0) return null;
    return data[0].raw_data as AuthUserRecord;
  }

  async upsertUser(record: AuthUserRecord): Promise<AuthUserRecord> {
    const nextRecord = {
      id: record.id,
      email_normalized: record.emailNormalized,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
      last_login_at: record.lastLoginAt || null,
      raw_data: record,
    };

    const data = await supabaseFetch("auth_users", {
      method: "POST",
      headers: {
        "Prefer": "resolution=merge-duplicates",
      },
      body: JSON.stringify([nextRecord]),
    });

    return record;
  }
}

const globalStore = globalThis as typeof globalThis & {
  __origemAuthStore?: AuthStore;
};

export function buildUserId(emailNormalized: string) {
  return `usr_${createHash("sha256")
    .update(emailNormalized)
    .digest("hex")
    .slice(0, 24)}`;
}

export function getAuthStore() {
  if (!globalStore.__origemAuthStore) {
    globalStore.__origemAuthStore = new AuthStore();
  }

  return globalStore.__origemAuthStore;
}

