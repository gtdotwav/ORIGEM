import { NextResponse } from "next/server";
import { getSpaceTools } from "@/lib/mcp/connector-manager";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const spaceId = searchParams.get("spaceId");

  if (!spaceId) {
    return NextResponse.json({ error: "missing_spaceId" }, { status: 400 });
  }

  try {
    const tools = await getSpaceTools(spaceId);
    return NextResponse.json({ tools });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to list tools";
    return NextResponse.json({ error: "list_failed", reason: message }, { status: 500 });
  }
}
