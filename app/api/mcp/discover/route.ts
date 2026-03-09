import { NextResponse } from "next/server";
import { refreshConnectorTools } from "@/lib/mcp/connector-manager";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { connectorId?: string };

    if (!body.connectorId) {
      return NextResponse.json({ error: "missing_fields", details: "connectorId required" }, { status: 400 });
    }

    const tools = await refreshConnectorTools(body.connectorId);
    return NextResponse.json({ ok: true, tools });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Discovery failed";
    return NextResponse.json({ error: "discovery_failed", reason: message }, { status: 500 });
  }
}
