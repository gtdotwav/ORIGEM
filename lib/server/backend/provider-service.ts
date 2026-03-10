import { ProviderConfigUpsertSchema } from "@/lib/server/backend/provider-schemas";
import { getSnapshotStore } from "@/lib/server/backend/store";
import { getProviderEnvApiKey } from "@/lib/server/ai/provider-factory";

export async function listProviderRecords() {
  const store = getSnapshotStore();
  return store.listProviderRecords();
}

export async function upsertProviderRecord(input: unknown) {
  const parsed = ProviderConfigUpsertSchema.parse(input);
  const store = getSnapshotStore();

  const existing = await store.getProviderRecord(parsed.provider);
  const apiKey =
    parsed.apiKey.trim() ||
    existing?.apiKey ||
    getProviderEnvApiKey(parsed.provider) ||
    "";

  if (!apiKey) {
    throw new Error("api_key_required");
  }

  return store.upsertProviderRecord(parsed.provider, {
    apiKey,
    selectedModel: parsed.selectedModel,
  });
}
