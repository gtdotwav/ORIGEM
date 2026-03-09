import { NextResponse } from "next/server";
import { getMCPStore } from "@/lib/mcp/store";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const spaceId = searchParams.get("spaceId");
  const limit = parseInt(searchParams.get("limit") ?? "50", 10);

  if (!spaceId) {
    return NextResponse.json({ error: "missing_spaceId" }, { status: 400 });
  }

  try {
    const store = getMCPStore();
    const entries = await store.getAuditEntries(spaceId, limit);
    return NextResponse.json({ entries });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Audit query failed";
    return NextResponse.json({ error: "audit_failed", reason: message }, { status: 500 });
  }
}
