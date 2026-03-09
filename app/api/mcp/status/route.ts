import { NextResponse } from "next/server";
import { getMCPStore } from "@/lib/mcp/store";
import { isConnected } from "@/lib/mcp/client";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const spaceId = searchParams.get("spaceId");

  if (!spaceId) {
    return NextResponse.json({ error: "missing_spaceId" }, { status: 400 });
  }

  try {
    const store = getMCPStore();
    const connectors = await store.listConnectors(spaceId);

    const status = connectors.map((c) => ({
      id: c.id,
      serverId: c.serverId,
      serverName: c.serverName,
      status: isConnected(c.id) ? "connected" as const : c.status,
      toolCount: c.tools.length,
      lastHealthCheck: c.lastHealthCheck,
      error: c.error,
      installedAt: c.installedAt,
    }));

    return NextResponse.json({ connectors: status });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Status check failed";
    return NextResponse.json({ error: "status_failed", reason: message }, { status: 500 });
  }
}
