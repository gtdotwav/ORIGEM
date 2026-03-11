import type {
  ProviderSecretRecord,
  SessionSnapshot,
  SessionSnapshotRecord,
} from "@/lib/server/backend/types";
import type { ProviderName } from "@/types/provider";
import { assertEncryptionReady, decrypt, encrypt } from "@/lib/server/crypto";

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

class SnapshotStore {
  async listRecords(): Promise<SessionSnapshotRecord[]> {
    const data = await supabaseFetch("session_records?select=*");
    return (data || []).map((row: any) => ({
      ...row,
      sessionId: row.session_id,
      updatedAt: row.updated_at,
    })).sort((a: any, b: any) => b.updatedAt - a.updatedAt);
  }

  async getRecord(sessionId: string): Promise<SessionSnapshotRecord | null> {
    const data = await supabaseFetch(`session_records?session_id=eq.${encodeURIComponent(sessionId)}&select=*`);
    if (!data || data.length === 0) return null;
    const row = data[0];
    return {
      ...row,
      sessionId: row.session_id,
      updatedAt: row.updated_at,
    };
  }

  async upsertSnapshot(
    sessionId: string,
    snapshot: SessionSnapshot
  ): Promise<SessionSnapshotRecord> {
    const previous = await this.getRecord(sessionId);
    const now = Date.now();
    const nextRecord = {
      session_id: sessionId,
      version: previous ? previous.version + 1 : 1,
      updated_at: now,
      snapshot: snapshot,
    };

    const data = await supabaseFetch("session_records", {
      method: "POST",
      headers: {
        "Prefer": "resolution=merge-duplicates",
      },
      body: JSON.stringify([nextRecord]),
    });

    return {
      sessionId,
      version: nextRecord.version,
      updatedAt: nextRecord.updated_at,
      snapshot: nextRecord.snapshot,
    };
  }

  async deleteRecord(sessionId: string): Promise<void> {
    await supabaseFetch(`session_records?session_id=eq.${encodeURIComponent(sessionId)}`, {
      method: "DELETE",
    });
  }

  private decryptRecord(record: ProviderSecretRecord): ProviderSecretRecord {
    return { ...record, apiKey: decrypt(record.apiKey) };
  }

  async listProviderRecords(): Promise<ProviderSecretRecord[]> {
    const data = await supabaseFetch("provider_records?select=*");
    return (data || [])
      .map((row: any) => ({
        provider: row.provider as ProviderName,
        apiKey: row.api_key,
        selectedModel: row.selected_model,
        updatedAt: row.updated_at,
      }))
      .sort((a: any, b: any) => b.updatedAt - a.updatedAt)
      .map((item: any) => Object.assign({}, item, { apiKey: decrypt(item.apiKey) }));
  }

  async getProviderRecord(
    provider: ProviderName
  ): Promise<ProviderSecretRecord | null> {
    const data = await supabaseFetch(`provider_records?provider=eq.${encodeURIComponent(provider)}&select=*`);
    if (!data || data.length === 0) return null;
    const row = data[0];
    const record = {
      provider: row.provider as ProviderName,
      apiKey: row.api_key,
      selectedModel: row.selected_model,
      updatedAt: row.updated_at,
    };
    return this.decryptRecord(record);
  }

  async upsertProviderRecord(
    provider: ProviderName,
    input: { apiKey: string; selectedModel: string }
  ): Promise<ProviderSecretRecord> {
    assertEncryptionReady("persist provider credentials");

    const nextRecord = {
      provider,
      api_key: encrypt(input.apiKey),
      selected_model: input.selectedModel,
      updated_at: Date.now(),
    };

    await supabaseFetch("provider_records", {
      method: "POST",
      headers: {
        "Prefer": "resolution=merge-duplicates",
      },
      body: JSON.stringify([nextRecord]),
    });

    return { 
      provider,
      apiKey: input.apiKey,
      selectedModel: input.selectedModel,
      updatedAt: nextRecord.updated_at 
    };
  }
}

const globalStore = globalThis as typeof globalThis & {
  __origemSnapshotStore?: SnapshotStore;
};

export function getSnapshotStore() {
  if (!globalStore.__origemSnapshotStore) {
    globalStore.__origemSnapshotStore = new SnapshotStore();
  }

  return globalStore.__origemSnapshotStore;
}
