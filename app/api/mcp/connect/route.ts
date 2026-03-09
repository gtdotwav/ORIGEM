import { NextResponse } from "next/server";
import { installConnector } from "@/lib/mcp/connector-manager";

export async function POST(request: Request) {
  try {
    const body = await request.json() as {
      spaceId?: string;
      serverId?: string;
      credentials?: Record<string, string>;
    };

    if (!body.spaceId || !body.serverId) {
      return NextResponse.json({ error: "missing_fields", details: "spaceId and serverId required" }, { status: 400 });
    }

    const connector = await installConnector(
      body.spaceId,
      body.serverId,
      body.credentials ?? {},
    );

    return NextResponse.json({ ok: true, connector }, { status: 201 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to connect";
    return NextResponse.json({ error: "connection_failed", reason: message }, { status: 422 });
  }
}
