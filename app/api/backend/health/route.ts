import { NextResponse } from "next/server";
import { authEnabled, enabledProviders } from "@/lib/auth";
import { listConfiguredProviders } from "@/lib/server/ai/provider-factory";
import { getSnapshotStore } from "@/lib/server/backend/store";
import { getMCPStore } from "@/lib/mcp/store";

export const runtime = "nodejs";

export async function GET() {
  const checks = {
    snapshotStore: { ok: true as boolean, details: "" as string | null },
    providerStore: { ok: true as boolean, details: "" as string | null },
    mcpStore: { ok: true as boolean, details: "" as string | null },
  };

  let configuredProvidersCount = 0;

  try {
    const store = getSnapshotStore();
    await store.listRecords();
  } catch (error) {
    checks.snapshotStore = {
      ok: false,
      details: error instanceof Error ? error.message : "snapshot_store_unavailable",
    };
  }

  try {
    configuredProvidersCount = (await listConfiguredProviders()).length;
  } catch (error) {
    checks.providerStore = {
      ok: false,
      details: error instanceof Error ? error.message : "provider_store_unavailable",
    };
  }

  try {
    const store = getMCPStore();
    await store.listConnectors();
  } catch (error) {
    checks.mcpStore = {
      ok: false,
      details: error instanceof Error ? error.message : "mcp_store_unavailable",
    };
  }

  const ok = Object.values(checks).every((check) => check.ok);

  return NextResponse.json(
    {
      ok,
      service: "origem-backend",
      timestamp: Date.now(),
      auth: {
        enabled: authEnabled,
        providers: enabledProviders,
      },
      storage: {
        blobEnabled: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
        encryptionConfigured: Boolean(process.env.ORIGEM_ENCRYPT_SECRET),
      },
      providers: {
        configuredCount: configuredProvidersCount,
      },
      checks,
    },
    { status: ok ? 200 : 503 }
  );
}
