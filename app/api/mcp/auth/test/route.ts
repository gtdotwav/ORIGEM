import { NextResponse } from "next/server";
import { healthCheck } from "@/lib/mcp/connector-manager";

export async function POST(request: Request) {
  try {
    const body = await request.json() as { connectorId?: string };

    if (!body.connectorId) {
      return NextResponse.json({ error: "missing_connectorId" }, { status: 400 });
    }

    const result = await healthCheck(body.connectorId);

    if (result.ok) {
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: "connection_failed", reason: result.error }, { status: 422 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Test failed";
    return NextResponse.json({ error: "test_failed", reason: message }, { status: 500 });
  }
}
