import { NextResponse } from "next/server";
import { uninstallConnector } from "@/lib/mcp/connector-manager";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { connectorId?: string };

    if (!body.connectorId) {
      return NextResponse.json({ error: "missing_fields", details: "connectorId required" }, { status: 400 });
    }

    await uninstallConnector(body.connectorId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to disconnect";
    return NextResponse.json({ error: "disconnect_failed", reason: message }, { status: 500 });
  }
}
