import { NextResponse } from "next/server";
import { getMCPStore } from "@/lib/mcp/store";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      connectorId?: string;
      spaceId?: string;
      serverId?: string;
      credentials?: Record<string, string>;
    };

    if (!body.connectorId || !body.spaceId || !body.serverId || !body.credentials) {
      return NextResponse.json({ error: "missing_fields" }, { status: 400 });
    }

    const store = getMCPStore();
    await store.setCredentials(body.connectorId, body.spaceId, body.serverId, body.credentials);

    return NextResponse.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to store credentials";
    return NextResponse.json({ error: "auth_failed", reason: message }, { status: 500 });
  }
}
